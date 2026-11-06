// ============================================================================
// TAPPA 1: Importazione delle Dipendenze Core, Router, Client e Stili
// OBIETTIVO: Caricare gli hook di stato, l'SDK di Supabase, gli strumenti di navigazione tra le rotte e i fogli di stile associati al layout.
// TEORIA DA STUDIARE PRIMA:
// - Navigazione Single Page Application (SPA): Utilizzare l'hook `useNavigate` per reindirizzare programmaticamente l'utente senza rinfrescare l'applicazione.
// PASSAGGI LOGICI:
// 1. Importare useState ed useEffect dal modulo 'react'.
// 2. Importare il client asincrono supabase dal percorso delle librerie del progetto.
// 3. Estrarre l'hook useNavigate da 'react-router-dom'.
// 4. Integrare il file di stile locale './Schede.css'.
// ============================================================================
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import './Schede.css';

// ============================================================================
// TAPPA 2: Dichiarazione del Componente e Configurazione degli Stati Reattivi
// OBIETTIVO: Definire il componente principale Schede e inizializzare le variabili necessarie per gestire l'elenco dei programmi, la creazione e la diagnostica degli errori.
// TEORIA DA STUDIARE PRIMA:
// - Flag di Stato Booleani: Sfruttare valori booleani (true/false) per mostrare o nascondere dinamicamente porzioni di codice (come il form di creazione).
// PASSAGGI LOGICI:
// 1. Esportare la funzione componente Schede.
// 2. Configurare gli stati di caricamento ed elenco: schede (array vuoto iniziale) e loading (attivo di default).
// 3. Impostare i controlli del form: nuovoNome (stringa vuota) e isCreating (booleano false di default).
// 4. Dichiarare la costante di navigazione istanziando l'hook useNavigate().
// ============================================================================
export function Schede() {
  const [schede, setSchede] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuovoNome, setNuovoNome] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errore, setErrore] = useState('');
  const navigate = useNavigate();

  // ============================================================================
  // TAPPA 3: Sincronizzazione ed Esecuzione dell'Effetto al Montaggio
  // OBIETTIVO: Sincronizzare il client con la base dati remota per estrarre l'elenco delle schede utente non appena lo schermo è pronto.
  // PASSAGGI LOGICI:
  // 1. Configurare un hook useEffect accoppiato a un array di dipendenze vuoto `([])`.
  // 2. Chiamare la funzione asincrona caricaSchede() all'interno della callback.
  // ============================================================================
  useEffect(() => {
    caricaSchede();
  }, []);

  // ============================================================================
  // TAPPA 4: Query Relazionale Complessa e Sub-Selezione Tabelle Figlie
  // OBIETTIVO: Recupero asincrono di tutte le routine attive dell'utente, includendo in un'unica richiesta i nomi degli esercizi collegati tramite tabelle di giunzione.
  // TEORIA DA STUDIARE PRIMA:
  // - Query Relazionali Supabase (Nested Selects): Sfruttare la sintassi a stringa con parentesi tonde per indicare a Supabase di eseguire automaticamente una JOIN e recuperare i dati dalla tabella figlia `routine_exercises`.
  // - Filtri su valori Nulli (`.is`): Escludere i record archiviati verificando che la colonna `archived_at` sia impostata su NULL.
  // PASSAGGI LOGICI:
  // 1. Impostare loading su true e recuperare l'ID utente autenticato tramite `supabase.auth.getUser()`.
  // 2. Interrogare la tabella 'routines', richiedendo i campi id, name, l'intera sotto-tabella 'routine_exercises' e i relativi record correlati di 'exercises'.
  // 3. Applicare i filtri condizionali per utente, escludere gli elementi archiviati e ordinare per la colonna 'position' in modo ascendente.
  // ============================================================================
  const caricaSchede = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Query relazionale ufficiale sulle tabelle routines e routine_exercises (Pagina 8)
      const { data, error } = await supabase
        .from('routines')
        .select(`
          id,
          name,
          routine_exercises (
            id,
            position,
            exercises (name)
          )
        `)
        .eq('user_id', user.id)
        .is('archived_at', null)
        .order('position', { ascending: true });

      if (error) throw error;
      setSchede(data || []);
    } catch (err) {
      setErrore('Errore nel recupero dei dati: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // TAPPA 5: Validazione dei Moduli, Inserimento Singolo e Reindirizzamento Rotta
  // OBIETTIVO: Validare il nome inserito dall'utente, calcolare la posizione d'ordine progressiva, inserire la riga in archivio e spostarsi sulla pagina di configurazione.
  // TEORIA DA STUDIARE PRIMA:
  // - Metodo `.single()` e Clausola `.select()`: Chiedere esplicitamente a Supabase di restituire l'oggetto appena inserito (invece di un array di oggetti), rendendo subito disponibile il suo ID per la navigazione.
  // PASSAGGI LOGICI:
  // 1. Prevenire il refresh nativo del form, pulire gli errori ed effettuare il `.trim()` del testo.
  // 2. Applicare le regole if client-side: bloccare l'invio se il testo è vuoto o se supera i 40 caratteri di lunghezza massima.
  // 3. Calcolare la costante `nuovaPosizione` basandosi sulla lunghezza attuale dell'array in memoria (`schede.length + 1`).
  // 4. Eseguire l'operazione di `.insert()`, richiedere il record con `.select().single()` e usare `navigate()` per reindirizzare alla rotta dinamica `/schede/:id`.
  // ============================================================================
  const handleCreaScheda = async (e) => {
    e.preventDefault();
    setErrore('');
    const nomePulito = nuovoNome.trim();

    // Validazione dei moduli (Pagina 22)
    if (!nomePulito) {
      setErrore('Il nome della scheda è obbligatorio.');
      return;
    }
    if (nomePulito.length > 40) {
      setErrore('Il nome della scheda non può superare i 40 caratteri.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const nuovaPosizione = schede.length + 1;

      // Inserisce il record principale della routine
      const { data, error } = await supabase
        .from('routines')
        .insert([{
          user_id: user.id,
          name: nomePulito,
          position: nuovaPosizione
        }])
        .select()
        .single();

      if (error) throw error;
      
      setNuovoNome('');
      setIsCreating(false);
      
      // Reindirizzamento immediato alla pagina di modifica parametri (Tappa 4)
      navigate(`/schede/${data.id}`);
    } catch (err) {
      setErrore(err.message);
    }
  };

  // ============================================================================
  // TAPPA 6: Intercettazione e Blocco della Propagazione degli Eventi (`.stopPropagation`)
  // OBIETTIVO: Permettere l'eliminazione fisica di una scheda tramite un pulsante annidato senza attivare accidentalmente il click di navigazione della card padre.
  // TEORIA DA STUDIARE PRIMA:
  // - Event Bubbling (Propagazione degli Eventi): Fenomeno per cui un evento scatenato su un elemento figlio risale l'albero DOM attivando i gestori del padre. Si neutralizza invocando `e.stopPropagation()`.
  // PASSAGGI LOGICI:
  // 1. Invocare immediatamente `preventDefault()` e `stopPropagation()` sull'evento.
  // 2. Mostrare una finestra di avviso `window.confirm()` prima di avviare la query distruttiva.
  // 3. Eseguire l'istruzione `.delete()` filtrando per l'ID della scheda e aggiornare l'interfaccia richiamando `caricaSchede()`.
  // ============================================================================
  const handleEliminaScheda = async (id, e) => {
    e.preventDefault();
    e.stopPropagation(); // Evita di attivare il clic di navigazione della card

    // Messaggio di conferma rassicurante (Pagina 12)
    if (!window.confirm("Sei sicuro di voler eliminare questa scheda? Lo storico degli allenamenti fatti resta.")) return;

    try {
      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', id);

      if (error) throw error;
      caricaSchede();
    } catch (err) {
      alert("Errore durante l'eliminazione: " + err.message);
    }
  };

    // ============================================================================
  // TAPPA 7: Rendering del Layout Principale e Gestione dei Form Condizionali
  // OBIETTIVO: Strutturare il punto di ingresso visivo del componente, implementando l'apertura a scomparsa del form per l'inserimento del nuovo programma.
  // TEORIA DA STUDIARE PRIMA:
  // - Operatore Logico Cortocircuito (`&&`): Sintassi reattiva per includere un intero blocco di codice HTML all'interno del DOM soltanto se lo stato di controllo risulta TRUE.
  // PASSAGGI LOGICI:
  // 1. Aprire il container principale, inserire l'intestazione e configurare il bottone di apertura form invertendo lo stato booleano (`!isCreating`).
  // 2. Agganciare il gestore `onSubmit={handleCreaScheda}` al tag form.
  // 3. Collegare l'attributo `value` dello stato `nuovoNome` e il gestore `onChange` al rispettivo tag d'inserimento testuale.
  // ============================================================================
  return (
    <div className="schede-container">
      <div className="header-sezione">
        <h2>Le tue Schede</h2>
        <button 
          type="button" 
          className="btn-add" 
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? 'Chiudi' : '➕ Nuova Scheda'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreaScheda} className="scheda-form card">
          <h3>Crea Programma</h3>
          {errore && <div className="schede-alert error">{errore}</div>}
          
          <div className="form-group">
            <label htmlFor="routine-name">Nome Scheda *</label>
            <input 
              id="routine-name"
              type="text" 
              maxLength={40}
              placeholder="es. Upper Body, Spinta, Gambe..." 
              value={nuovoNome} 
              onChange={e => setNuovoNome(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn-primary-full">Crea e Configura</button>
        </form>
      )}

      {/* ============================================================================
          TAPPA 8: Ordinamento ad Array, Mappatura ed Estrazione di Proprietà Annidate
          OBIETTIVO: Isolare l'elenco degli esercizi associati, ordinarli linearmente secondo l'indice di posizione ed elaborare una stringa unificata di anteprima per ogni scheda.
          TEORIA DA STUDIARE PRIMA:
          - Concatenazione e Pulizia di Array (`.filter(Boolean)`): Rimuovere in modo sicuro eventuali valori nulli, indefiniti o vuoti generati da record orfani o query asincrone parziali prima di trasformare i dati.
          PASSAGGI LOGICI:
          1. Eseguire un controllo ternario sullo stato `loading` e verificare se l'array `schede` ha lunghezza pari a zero per mostrare l'Empty State.
          2. Avviare il ciclo `.map()` globale sulla griglia delle schede per generare le relative card cliccabili.
          3. All'interno del ciclo di ogni scheda, ordinare l'array nidificato `routine_exercises` prendendo come parametro di calcolo `a.position - b.position`.
          4. Isolare solo i nomi degli esercizi con `.map(re => re.exercises?.name)` ed eliminare i campi inconsistenti usando `.filter(Boolean)`.
          5. Utilizzare il metodo `.join(', ')` per unire i nomi degli esercizi in un testo separato da virgole da mostrare a schermo.
          ============================================================================ */}
      {loading ? (
        <p className="loading-text">Sincronizzazione schede in corso...</p>
      ) : schede.length === 0 ? (
        <div className="empty-state card">
          <p>Nessuna scheda: creane una con Nuova scheda, qui sopra.</p>
        </div>
      ) : (
        <div className="schede-grid">
          {schede.map((scheda) => {
            // Estrae ed ordina i nomi degli esercizi associati su stringa singola
            const eserciziAnteprima = (scheda.routine_exercises || [])
              .sort((a, b) => a.position - b.position)
              .map(re => re.exercises?.name)
              .filter(Boolean);

            return (
              <div 
                key={scheda.id} 
                className="scheda-card card"
                onClick={() => navigate(`/schede/${scheda.id}`)}
              >
                <div className="scheda-card-header">
                  <h4>{scheda.name}</h4>
                  <button 
                    type="button" 
                    className="btn-delete-icon" 
                    onClick={(e) => handleEliminaScheda(scheda.id, e)}
                    aria-label={`Elimina scheda ${scheda.name}`}
                  >
                    🗑️
                  </button>
                </div>
                
                <p className="hint">
                  Esercizi inseriti: <strong>{eserciziAnteprima.length}</strong>
                </p>

                {eserciziAnteprima.length > 0 && (
                  <div className="scheda-esercizi-preview">
                    <p className="preview-text-ellipsis">
                      {eserciziAnteprima.join(', ')}
                    </p>
                  </div>
                )}
                
                <div className="card-footer-action">
                  <span>Configura parametri ⋯</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
