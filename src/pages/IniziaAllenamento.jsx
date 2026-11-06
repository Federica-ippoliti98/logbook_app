// ============================================================================
// TAPPA 1: Importazione delle Dipendenze Core, Client e Stili Associati
// OBIETTIVO: Caricare gli hook fondamentali di gestione dello stato e degli effetti, uniti all'SDK di Supabase, al router di navigazione e agli stili di layout.
// TEORIA DA STUDIARE PRIMA:
// - Strutturazione dei Moduli Applicativi: Importare moduli core e librerie locali per abilitare la reattività e le query asincrone.
// PASSAGGI LOGICI:
// 1. In cima al file, importare useState ed useEffect dal modulo 'react'.
// 2. Importare il client asincrono supabase dal percorso relativo delle librerie del progetto.
// 3. Estrarre l'hook useNavigate da 'react-router-dom'.
// 4. Integrare il foglio di stile locale './IniziaAllenamento.css'.
// ============================================================================
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import './IniziaAllenamento.css';

// ============================================================================
// TAPPA 2: Dichiarazione del Componente e Configurazione degli Stati Statistici
// OBIETTIVO: Definire la funzione principale IniziaAllenamento e inizializzare le variabili reattive per memorizzare le schede, le sessioni odierne e lo stato di caricamento.
// TEORIA DA STUDIARE PRIMA:
// - Stati Primitivi e Collezioni: Scegliere valori iniziali idonei (array vuoti per dati tabellari, booleani per controlli di flusso di rete).
// PASSAGGI LOGICI:
// 1. Esportare la funzione componente IniziaAllenamento.
// 2. Creare gli stati di controllo base: schede (array vuoto iniziale) e sessioniOggi (array vuoto iniziale).
// 3. Configurare lo stato loading (attivo di default su true) e istanziare l'hook `useNavigate()`.
// ============================================================================
export function IniziaAllenamento() {
  const [schede, setSchede] = useState([]);
  const [sessioniOggi, setSessioniOggi] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ============================================================================
  // TAPPA 3: Sincronizzazione ed Esecuzione dell'Effetto al Montaggio
  // OBIETTIVO: Avviare la sincronizzazione e l'estrazione parallela di schede e sessioni storiche non appena la pagina viene visualizzata sullo schermo.
  // PASSAGGI LOGICI:
  // 1. Configurare un hook useEffect associato a un array di controllo finale vuoto `([])`.
  // 2. All'interno della callback dell'effetto, invocare direttamente la funzione caricaDatiInizio().
  // ============================================================================
  useEffect(() => {
    caricaDatiInizio();
  }, []);

  // ============================================================================
  // TAPPA 4: Recupero Asincrono Sequenziale e Manipolazione Date (`.split`)
  // OBIETTIVO: Scaricare dal database le routine attive dell'utente e intercettare eventuali sessioni già avviate nella giornata corrente tramite calcolo della data ISO localizzata.
  // TEORIA DA STUDIARE PRIMA:
  // - Formattazione Date stringa: Utilizzare `new Date().toISOString().split('T')[0]` per isolare la stringa pura della data in formato SQL (YYYY-MM-DD), escludendo i dettagli del fuso orario di rete.
  // PASSAGGI LOGICI:
  // 1. Definire la funzione asincrona caricaDatiInizio e attivare lo stato loading su true.
  // 2. Prelevare l'oggetto utente autenticato tramite la chiamata asincrona `supabase.auth.getUser()`.
  // 3. Interrogare la tabella 'routines' estraendo ID, nome ed esercizi interni, filtrando per record non archiviati.
  // 4. Estrarre la stringa della data odierna ed eseguire una query sulla tabella 'workouts' filtrando per utente e data esatta.
  // ============================================================================
  const caricaDatiInizio = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Recupera le schede attive
      const { data: routines } = await supabase
        .from('routines')
        .select('id, name, routine_exercises(id)')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .order('position', { ascending: true });

      setSchede(routines || []);

      // 2. Recupera le sedute avviate nella giornata di oggi (ora locale)
      const oggiLocale = new Date().toISOString().split('T')[0];
      const { data: workouts } = await supabase
        .from('workouts')
        .select('id, routine_id, concluded_at')
        .eq('user_id', user.id)
        .eq('workout_date', oggiLocale);

      setSessioniOggi(workouts || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // TAPPA 5: Vincoli Tecnici di Configurazione e Controllo dei Duplicati (`.find`)
  // OBIETTIVO: Intercettare schede vuote per rimandare alla modifica, e verificare se una sessione è già attiva in modo da riaprirla senza duplicare i record.
  // TEORIA DA STUDIARE PRIMA:
  // - Early Return Pattern su Controllo Collezioni: Utilizzare `.find()` su un array per cercare la presenza di un record corrispondente e uscire anticipatamente dalla funzione per evitare ridondanze.
  // PASSAGGI LOGICI:
  // 1. Controllare se l'array `routine_exercises` è vuoto o indefinito: in caso positivo mostrare un alert e forzare la rotta su `/schede/:id`.
  // 2. Eseguire un ciclo `.find()` sull'array `sessioniOggi` incrociando l'id della scheda selezionata.
  // 3. Se il record esiste, bypassare la creazione riaprendo la sessione esistente tramite navigazione diretta.
  // ============================================================================
  const gestisciAvvioScheda = async (scheda) => {
    // Vincolo tecnico (Pagina 13): Una scheda senza esercizi si apre per essere modificata
    if (!scheda.routine_exercises || scheda.routine_exercises.length === 0) {
      alert("Questa scheda non ha esercizi. Ti reindirizzo alla pagina di configurazione.");
      navigate(`/schede/${scheda.id}`);
      return;
    }

    // Controlla se c'è già una seduta avviata oggi per questa scheda
    const esistente = sessioniOggi.find(w => w.routine_id === scheda.id);
    if (esistente) {
      // FIX ERRORE: Corretto il nome della variabile che presentava un typo (era esistent.id)
      navigate(`/allenamento/${esistente.id}`);
      return;
    }

    // ============================================================================
    // TAPPA 6: Creazione Sessione Principale e Clonazione Storica Esercizi (Snapshot)
    // OBIETTIVO: Generare un record di workout e scattare una fotografia istantanea dei parametri degli esercizi della scheda per salvarli nella tabella transazionale.
    // TEORIA DA STUDIARE PRIMA:
    // - Data Snapshotting (Fotografia dei Dati): Copiare i dati strutturati da una tabella di configurazione (`routine_exercises`) a una tabella transazionale (`workout_exercises`) per garantire che modifiche future alle schede non alterino lo storico degli allenamenti passati.
    // PASSAGGI LOGICI:
    // 1. Inserire una riga all'interno della tabella 'workouts' valorizzando l'utente, l'ID della scheda, il nome e la data odierna.
    // 2. Sfruttare `.select().single()` per catturare l'oggetto appena inserito e isolarne l'ID generato dal server.
    // 3. Interrogare la tabella 'routine_exercises' per prelevare i target numerici impostati.
    // 4. Mappare l'array degli esercizi tramite `.map()` per generare il `payloadEsercizi` comprensivo di `workout_id`.
    // 5. Salvare cumulativamente il blocco di record su 'workout_exercises' e reindirizzare alla schermata live.
    // ============================================================================
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const oggiLocale = new Date().toISOString().split('T')[0];

      // Crea la nuova seduta (fissando il titolo)
      const { data: nuovoWorkout, error } = await supabase
        .from('workouts')
        .insert([{
          user_id: user.id,
          routine_id: scheda.id,
          title: scheda.name,
          workout_date: oggiLocale
        }])
        .select()
        .single();

      if (error) throw error;

      // Fotografa gli esercizi della scheda riversandoli in workout_exercises (Pagina 9, 13)
      const { data: exScheda } = await supabase
        .from('routine_exercises')
        .select('exercise_id, position, target_sets, rep_min, rep_max, rest_seconds')
        .eq('routine_id', scheda.id);

      if (exScheda && exScheda.length > 0) {
        const payloadEsercizi = exScheda.map(e => ({
          user_id: user.id,
          workout_id: nuovoWorkout.id,
          exercise_id: e.exercise_id,
          position: e.position,
          target_sets: e.target_sets,
          rep_min: e.rep_min,
          rep_max: e.rep_max,
          rest_seconds: e.rest_seconds
        }));

        const { error: errEx } = await supabase
          .from('workout_exercises')
          .insert(payloadEsercizi);

        if (errEx) throw errEx;
      }

      navigate(`/allenamento/${nuovoWorkout.id}`);
    } catch (err) {
      alert(err.message);
    }
  };

    // ============================================================================
  // TAPPA 7: Gestione Sessione Estemporanea a Routine Nulla (Allenamento Libero)
  // OBIETTIVO: Abilitare l'utente ad avviare un allenamento privo di esercizi preimpostati, gestendo il vincolo di unicità giornaliera per le sessioni libere.
  // PASSAGGI LOGICI:
  // 1. Controllare se all'interno dell'array `sessioniOggi` esiste già una riga in cui `routine_id === null`. In caso positivo, reindirizzare direttamente su quell'ID.
  // 2. Se non esiste, eseguire una insert su 'workouts' impostando esplicitamente la colonna `routine_id` a `null` e fornendo come stringa descrittiva di titolo 'Allenamento libero'.
  // 3. Spostarsi programmaticamente sulla rotta dell'allenamento appena generato.
  // ============================================================================
  const avviaAllenamentoLibero = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const oggiLocale = new Date().toISOString().split('T')[0];

      // Controlla se c'è già un allenamento libero oggi
      const esistenteLibero = sessioniOggi.find(w => w.routine_id === null);
      if (esistenteLibero) {
        navigate(`/allenamento/${esistenteLibero.id}`);
        return;
      }

      const { data: nuovoWorkout, error } = await supabase
        .from('workouts')
        .insert([{
          user_id: user.id,
          routine_id: null,
          title: 'Allenamento libero',
          workout_date: oggiLocale
        }])
        .select()
        .single();

      if (error) throw error;
      navigate(`/allenamento/${nuovoWorkout.id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Early return di sicurezza per bloccare l'albero visivo durante l'attesa delle query asincrone
  if (loading) return <p className="loading-text">Preparazione sessione...</p>;

  // ============================================================================
  // TAPPA 8: Rendering Visivo JSX e Intercettazione Condizionale degli Stati Card
  // OBIETTIVO: Comporre la griglia delle opzioni JSX e determinare a runtime le classi CSS e le diciture dei bottoni in base allo stato concluso o live della seduta.
  // TEORIA DA STUDIARE PRIMA:
  // - Classi Dinamiche Template Literals: Utilizzare la sintassi a backtick `` `card ${condizione ? 'stile' : ''}` `` per alterare le geometrie visive o i bordi CSS a seconda dei dati reattivi.
  // PASSAGGI LOGICI:
  // 1. Stampare il bottone di navigazione superiore delegando il ritorno alla radice principale (`/`).
  // 2. Eseguire il ciclo `.map()` sull'array delle schede per strutturare graficamente i programmi attivi.
  // 3. All'interno del ciclo, calcolare i due booleani di controllo: `matchOggi` (seduta avviata) e `isConclusa` (colonna `concluded_at` valorizzata).
  // 4. Se l'allenamento risulta concluso, iniettare la classe di confine `conclusa-border` e stampare il badge protetto corrispondente.
  // 5. Configurare il pulsante d'azione alternando il testo testuale tra 'Riapri' e 'Avvia' in base alla presenza del match odierno.
  // ============================================================================
  return (
    <div className="inizia-container">
      <div className="header-inizia">
        <button type="button" className="btn-back-home" onClick={() => navigate('/')}>‹ Indietro</button>
        <h2>Inizia Allenamento</h2>
      </div>
      <p className="subtitle-inizia">Scegli una scheda o avvia una sessione libera per oggi:</p>

      <div className="opzioni-allenamento-list">
        {schede.map(scheda => {
          const matchOggi = sessioniOggi.find(w => w.routine_id === scheda.id);
          const isConclusa = matchOggi && matchOggi.concluded_at !== null;

          return (
            <div 
              key={scheda.id} 
              className={`start-workout-card card ${isConclusa ? 'conclusa-border' : ''}`}
              onClick={() => gestisciAvvioScheda(scheda)}
            >
              <div className="card-left-info">
                <h3>{scheda.name}</h3>
                {isConclusa && <span className="badge-conclusa">Conclusa oggi</span>}
                {matchOggi && !isConclusa && <span className="badge-live">In corso</span>}
              </div>
              <button type="button" className="btn-go-workout">
                {matchOggi ? 'Riapri ⚡' : 'Avvia ⚡'}
              </button>
            </div>
          );
        })}

        <div className="libero-separator">oppure</div>

        <div className="start-workout-card card libero-card" onClick={avviaAllenamentoLibero}>
          <div className="card-left-info">
            <h3>Allenamento Libero</h3>
            <p>Senza scheda preimpostata</p>
          </div>
          <button type="button" className="btn-go-workout">Inizia 🏋️‍♂️</button>
        </div>
      </div>
    </div>
  );
}
