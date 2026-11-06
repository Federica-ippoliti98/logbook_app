// ============================================================================
// TAPPA 1: Importazione delle Dipendenze Core, Router, Client, Context e Stili
// OBIETTIVO: Caricare gli hook fondamentali, i parametri di rotta, l'SDK di Supabase, il gestore del timer di recupero e gli stili di layout.
// TEORIA DA STUDIARE PRIMA:
// - Consumo di Context Custom (`useRestTimer`): Utilizzare contesti globali condivisi per attivare comportamenti cross-componente, come un timer di riposo visibile in tutta l'applicazione.
// PASSAGGI LOGICI:
// 1. In cima al file, importare useState ed useEffect dal modulo 'react'.
// 2. Estrarre useParams e useNavigate dal pacchetto 'react-router-dom'.
// 3. Importare il client asincrono supabase dal percorso delle librerie del progetto.
// 4. Estrarre l'hook useRestTimer dal contesto locale dei timer.
// 5. Integrare il foglio di stile locale './WorkoutSessione.css'.
// ============================================================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useRestTimer } from '../context/RestTimerContext';
import './WorkoutSessione.css';

// ============================================================================
// TAPPA 2: Configurazione degli Stati Reattivi per la Sessione Live e il Form
// OBIETTIVO: Inizializzare le variabili reattive per la seduta attiva, gli esercizi, i set completati e i parametri di input del modulo controllato.
// TEORIA DA STUDIARE PRIMA:
// - Modellazione degli Stati del Form: Impostare valori iniziali coerenti (stringhe vuote per testi opzionali, numeri convertiti in stringa per input numerici fluidi).
// PASSAGGI LOGICI:
// 1. Esportare la funzione componente WorkoutSessione ed estrarre `id` rinominandolo in `workoutId`.
// 2. Estrarre il metodo `startTimer` dall'hook `useRestTimer()`.
// 3. Configurare gli stati per memorizzare l'allenamento padre (`workout`), l'elenco degli esercizi (`esercizi`) e l'array delle serie completate (`serieSalvate`).
// 4. Impostare i controlli reattivi per l'inserimento: peso (stringa vuota per il corpo libero), ripetizioni (default '8'), flag riscaldamento (`isWarmup`) e note testuali.
// 5. Configurare l'oggetto `storicoPrecedente` per conservare i dati storici delle prestazioni passate.
// ============================================================================
export function WorkoutSessione() {
  const { id: workoutId } = useParams();
  const navigate = useNavigate();
  const { startTimer } = useRestTimer();

  const [workout, setWorkout] = useState(null);
  const [esercizi, setEsercizi] = useState([]);
  const [serieSalvate, setSerieSalvate] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stati per il modulo di inserimento della serie attiva
  const [esercizioSelezionato, setEsercizioSelezionato] = useState(null);
  const [peso, setPeso] = useState('');
  const [ripetizioni, setRipetizioni] = useState('8');
  const [isWarmup, setIsWarmup] = useState(false);
  const [noteSerie, setNoteSerie] = useState('');

  // Per mostrare lo storico immediato dell'ultima volta
  const [storicoPrecedente, setStoricoPrecedente] = useState({});

  // ============================================================================
  // TAPPA 3: Sincronizzazione ed Esecuzione dell'Effetto al Cambio Sessione
  // OBIETTIVO: Attivare lo scaricamento asincrono dell'intera struttura dati ogni volta che la rotta viene montata o cambia l'ID sessione.
  // PASSAGGI LOGICI:
  // 1. Configurare un hook useEffect associato all'array di dipendenze `[workoutId]`.
  // 2. Invocare all'interno del blocco la funzione principale `caricaInizialeSessione()`.
  // ============================================================================
  useEffect(() => {
    caricaInizialeSessione();
  }, [workoutId]);

  // ============================================================================
  // TAPPA 4: Recupero Multitabella e Inizializzazione Esercizio di Focus
  // OBIETTIVO: Scaricare asincronamente i dettagli della seduta, la lista sequenziale degli esercizi e i set già salvati, impostando il focus sul primo movimento.
  // TEORIA DA STUDIARE PRIMA:
  // - Ordinamento e Fallback di Inizializzazione: Verificare la consistenza degli array estratti per impostare in modo sicuro uno stato iniziale senza rischiare letture di proprietà su valori undefined.
  // PASSAGGI LOGICI:
  // 1. Attivare il caricamento, prelevare l'utente e scaricare il record della tabella 'workouts' tramite `.single()`.
  // 2. Estrarre gli esercizi pianificati da 'workout_exercises' in ordine ascendente di posizione, includendo i dettagli del nome dell'esercizio.
  // 3. Se l'array contiene dati e non c'è ancora un esercizio attivo, impostare il primo come focus e invocare la ricerca dello storico passatp.
  // 4. Prelevare da 'workout_sets' i set già spuntati ordinati cronologicamente.
  // ============================================================================
  const caricaInizialeSessione = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Recupera la seduta principale
      const { data: wk, error: errWk } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();
      if (errWk) throw errWk;
      setWorkout(wk);

      // 2. Recupera gli esercizi pianificati per questa seduta
      const { data: exWk, error: errEx } = await supabase
        .from('workout_exercises')
        .select(`
          id, exercise_id, position, target_sets, rep_min, rep_max, rest_seconds,
          exercises (name, muscle_group)
        `)
        .eq('workout_id', workoutId)
        .order('position', { ascending: true });
      if (errEx) throw errEx;
      setEsercizi(exWk || []);

      if (exWk && exWk.length > 0 && !esercizioSelezionato) {
        setEsercizioSelezionato(exWk[0]);
        recuperoEsercizioPrecedente(user.id, exWk[0].exercise_id);
      }

      // 3. Recupera le serie già spuntate in questa sessione
      const { data: sets, error: errSets } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('workout_id', workoutId)
        .order('created_at', { ascending: true });
      if (errSets) throw errSets;
      setSerieSalvate(sets || []);

    } catch (err) {
      alert("Errore nel caricamento dell'allenamento: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // TAPPA 5: Analisi Storica Retroattiva e Autofill dei Suggerimenti Carico
  // OBIETTIVO: Rintracciare l'ultima sessione passata in cui è stato eseguito l'esercizio focalizzato ed estrarre i carichi per popolare i suggerimenti intelligenti del form.
  // TEORIA DA STUDIARE PRIMA:
  // - Filtrazione dei Record Correnti (`not eq`): Escludere esplicitamente i dati dell'allenamento in corso durante le query storiche per evitare che i set eseguiti oggi si auto-suggeriscano come passati.
  // PASSAGGI LOGICI:
  // 1. Interrogare la tabella 'workout_sets' escludendo `workout_id` corrente, filtrando per utente ed esercizio, e ordinando in modo decrescente.
  // 2. Se viene trovato un record, estrarre la data del workout associato e filtrare tutti i set eseguiti in quella esatta giornata.
  // 3. Elaborare una stringa descrittiva concatenando carichi e ripetizioni tramite `.join(', ')`.
  // 4. Aggiornare gli stati di input (`peso` e `ripetizioni`) con i valori reali dell'ultima performance per velocizzare la compilazione.
  // ============================================================================
  const recuperoEsercizioPrecedente = async (userId, exerciseId) => {
    try {
      // Cerca l'ultimo set completato in assoluto prima di questo allenamento
      const { data: ultimoSet } = await supabase
        .from('workout_sets')
        .select('weight_kg, reps, created_at, workouts(workout_date)')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .not('workout_id', 'eq', workoutId)
        .order('created_at', { ascending: false });

      if (ultimoSet && ultimoSet.length > 0) {
        // Filtra tutti i set eseguiti in quella stessa giornata storica
        const ultimaData = ultimoSet[0].workouts?.workout_date;
        const setDellaGiornata = ultimoSet.filter(s => s.workouts?.workout_date === ultimaData);
        
        setStoricoPrecedente({
          data: ultimaData,
          stringa: setDellaGiornata.map(s => `${s.weight_kg ? s.weight_kg + 'kg' : 'Corpo libero'} × ${s.reps}`).join(', ')
        });

        // Imposta i valori suggeriti nel form
        setPeso(ultimoSet[0].weight_kg || '');
        setRipetizioni(ultimoSet[0].reps.toString());
      } else {
        setStoricoPrecedente({});
        setPeso('');
        setRipetizioni('8');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCambiaEsercizioAttivo = (es) => {
    setEsercizioSelezionato(es);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) recuperoEsercizioPrecedente(user.id, es.exercise_id);
    });
  };

   // ============================================================================
  // TAPPA 6: Registrazione Set e Innesco condizionale del Timer di Recupero
  // OBIETTIVO: Salvare la riga del set su Supabase, aggiornare reattivamente lo stato locale e avviare il conto alla rovescia del riposo discriminando i set di riscaldamento.
  // TEORIA DA STUDIARE PRIMA:
  // - Parsing dei Dati per il Database: Convertire le stringhe del form in tipi numerici (`parseFloat` per il peso, `parseInt` per le ripetizioni) prima dell'invio.
  // PASSAGGI LOGICI:
  // 1. Interceptare l'invio del form, prelevare i dati utente ed eseguire l'operazione di `.insert()` su 'workout_sets'.
  // 2. Integrare l'oggetto salvato all'interno dell'array locale `serieSalvate` tramite operatore spread (`[...prev, nuovaSerie]`).
  // 3. Calcolare il tempo di recupero: se è impostato il flag `isWarmup` forzare a 60 secondi, altrimenti prioritizzare i secondi impostati nell'esercizio (con un fallback di 180s).
  // 4. Invocare la funzione globale `startTimer()` passando i secondi calcolati.
  // ============================================================================
  const handleRegistraSerie = async (e) => {
    e.preventDefault();
    if (!esercizioSelezionato) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: nuovaSerie, error } = await supabase
        .from('workout_sets')
        .insert([{
          user_id: user.id,
          workout_id: workoutId,
          exercise_id: esercizioSelezionato.exercise_id,
          weight_kg: peso ? parseFloat(peso) : null,
          reps: parseInt(ripetizioni),
          is_warmup: isWarmup,
          notes: noteSerie.trim() || null
        }])
        .select()
        .single();

      if (error) throw error;

      setSerieSalvate(prev => [...prev, nuovaSerie]);
      setNoteSerie('');

      // Fa partire il timer di recupero (Pagina 14): prioritizza esercizio, poi Profilo, riscaldamento = 60s
      const tempoRecupero = isWarmup ? 60 : (esercizioSelezionato.rest_seconds || 180);
      startTimer(tempoRecupero);

    } catch (err) {
      alert("Errore nel salvataggio della serie: " + err.message);
    }
  };

  const handleEliminaSerie = async (id) => {
    if (!window.confirm("Eliminare questa serie definitivamente?")) return;
    try {
      const { error } = await supabase.from('workout_sets').delete().eq('id', id);
      if (error) throw error;
      setSerieSalvate(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================================================================
  // TAPPA 7: Chiusura Sessione e Validazione del Volume Minimo di Lavoro
  // OBIETTIVO: Impedire il salvataggio di allenamenti vuoti accidentalmente e aggiornare la colonna di completamento temporale (`concluded_at`).
  // PASSAGGI LOGICI:
  // 1. Verificare che la lunghezza dell'array `serieSalvate` sia superiore a zero: se vuoto, bloccare il flusso con un messaggio di errore.
  // 2. Mostrare un pop-up di conferma prima di procedere al salvataggio definitivo.
  // 3. Inviare un comando di `.update()` impostando la colonna `concluded_at` con la stringa ISO del momento esatto (`new Date().toISOString()`).
  // 4. Reindirizzare programmaticamente l'utente alla schermata del riepilogo storico `/storico`.
  // ============================================================================
  const handleConcludiSessione = async () => {
    if (serieSalvate.length === 0) {
      alert("Non puoi concludere un allenamento senza aver registrato almeno una serie.");
      return;
    }
    if (!window.confirm("Vuoi completare e salvare l'allenamento corrente?")) return;

    try {
      const { error } = await supabase
        .from('workouts')
        .update({ concluded_at: new Date().toISOString() })
        .eq('id', workoutId);

      if (error) throw error;
      alert("Allenamento salvato con successo nello storico!");
      navigate('/storico');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p className="loading-text">Sincronizzazione dati allenamento in corso...</p>;

  // ============================================================================
  // TAPPA 8: Rendering Visivo delle Schede Esercizio (Carousel Tabs Mobile)
  // OBIETTIVO: Comporre la barra superiore orizzontale degli esercizi calcolando dinamicamente a runtime lo stato di completamento e il conteggio dei set fatti.
  // TEORIA DA STUDIARE PRIMA:
  // - Conteggio e Toggle di Classe Condizionale: Filtrare la collezione dei set estratti per escludere il riscaldamento (`!s.is_warmup`) e verificare se le serie allenanti reali equivalgono o superano il valore programmato (`target_sets`).
  // PASSAGGI LOGICI:
  // 1. Aprire l'intestazione principale agganciando la funzione `handleConcludiSessione` al pulsante "Concludi".
  // 2. Eseguire un `.map()` sull'array degli `esercizi` per generare la lista dei pulsanti-scheda.
  // 3. Filtrare i set completati per l'esercizio corrente per calcolare la costante booleana `completato`.
  // 4. Applicare le classi dinamiche (`active` / `completed`) usando i template literals e stampare l'icona di spunta ✅ o la stringa frazionaria delle serie.
  // ============================================================================
  return (
    <div className="workout-live-container">
      <div className="workout-live-header">
        <div>
          <h2>⚡ {workout?.title}</h2>
          <span className="badge-live-trapping">LIVE SEDUTA</span>
        </div>
        <button type="button" className="btn-concludi-workout" onClick={handleConcludiSessione}>Concludi</button>
      </div>

      {/* Selettore degli esercizi stile Tabs Mobile-First */}
      <div className="esercizi-tabs-carousel">
        {esercizi.map((es, idx) => {
          const fatte = serieSalvate.filter(s => s.exercise_id === es.exercise_id && !s.is_warmup).length;
          const completato = fatte >= es.target_sets;
          const isActive = esercizioSelezionato?.id === es.id;

          return (
            <button
              key={es.id}
              type="button"
              className={`tab-item-btn ${isActive ? 'active' : ''} ${completato ? 'completed' : ''}`}
              onClick={() => handleCambiaEsercizioAttivo(es)}
            >
              <span className="tab-ex-name">{es.exercises?.name}</span>
              <span className="tab-ex-status">{completato ? '✅' : `${fatte}/${es.target_sets}`}</span>
            </button>
          );
        })}
      </div>

            {/* ============================================================================
          TAPPA 9: Pannello di Focus Esercizio e Indicizzazione Frazionata dei Set
          OBIETTIVO: Renderizzare l'esercizio attivo, mostrare i dati storici e listare ordinatamente i set eseguiti oggi separando numericamente i riscaldamenti.
          TEORIA DA STUDIARE PRIMA:
          - Generazione di Badge con Contatore Separato: Combinare l'unione di due sotto-array (`[...warmups, ...working]`) gestendo un contatore numerico manuale incrementato solo per i set non riscaldamento.
          PASSAGGI LOGICI:
          1. Mostrare i dettagli dell'obiettivo programmato e iniettare condizionalmente la stringa `storicoPrecedente` se valorizzata.
          2. Creare una funzione IIFE auto-eseguita `(() => { ... })()` per calcolare i set eseguiti nella giornata.
          3. Isolare i set di riscaldamento (`warmups`) e quelli allenanti (`working`), unendoli in un unico array finale su cui eseguire il ciclo di mappatura.
          4. All'interno del ciclo, se il set è un riscaldamento stampare la sigla fissa 'W', altrimenti incrementare la variabile `counterAllenanti` per stampare l'indice numerico lineare.
          ============================================================================ */}
      {esercizioSelezionato && (
        <div className="esercizio-live-focus-panel">
          <div className="focus-ex-header card">
            <h3>{esercizioSelezionato.exercises?.name}</h3>
            <p className="focus-target-label">
              Obiettivo programmato: <strong>{esercizioSelezionato.target_sets} × {esercizioSelezionato.rep_min}–{esercizioSelezionato.rep_max}</strong>
            </p>
            {storicoPrecedente.stringa && (
              <p className="focus-history-label">
                ↩️ L'ultima volta ({storicoPrecedente.data}): <span className="history-values">{storicoPrecedente.stringa}</span>
              </p>
            )}
          </div>

          {/* Elenco dei set eseguiti oggi */}
          <div className="sets-registered-list">
            {(() => {
              const odierne = serieSalvate.filter(s => s.exercise_id === esercizioSelezionato.exercise_id);
              const warmups = odierne.filter(s => s.is_warmup);
              const working = odierne.filter(s => !s.is_warmup);
              
              let counterAllenanti = 0;

              return [...warmups, ...working].map((set, index) => {
                let sigla = '';
                if (set.is_warmup) {
                  sigla = 'W';
                } else {
                  counterAllenanti++;
                  sigla = counterAllenanti.toString();
                }

                return (
                  <div key={set.id} className="live-set-row card">
                    <span className={`set-index-badge ${set.is_warmup ? 'w-badge' : ''}`}>{sigla}</span>
                    <span className="set-data-text">
                      <strong>{set.weight_kg ? `${set.weight_kg} kg` : 'Corpo Libero'}</strong> × {set.reps}
                    </span>
                    <button type="button" className="btn-delete-set-row" onClick={() => handleEliminaSerie(set.id)}>✕</button>
                  </div>
                );
              });
            })()}
          </div>

          {/* ============================================================================
              TAPPA 10: Form Inserimento Controllato e Regolazione a Pulsanti Stepper
              OBIETTIVO: Comporre il modulo di registrazione finale, permettendo la regolazione incrementale rapida dei valori tramite controlli stepper (+/-).
              TEORIA DA STUDIARE PRIMA:
              - Computazione di Stato Funzionale per Input Numerici: Utilizzare le funzioni di aggiornamento di stato di tipo `setPeso(p => ...)` per estrarre in modo sicuro il valore precedente, convertirlo a runtime e applicargli modifiche geometriche (es. passi di 2.5 kg).
              PASSAGGI LOGICI:
              1. Collegare l'evento `onSubmit` del modulo alla funzione `handleRegistraSerie`.
              2. Configurare i due pulsanti superiori per commutare lo stato booleano `isWarmup` alternando le classi di accento.
              3. Nella griglia dei controlli numerici del carico, associare i bottoni meno e più a funzioni in linea che aggiornano lo stato incrementando o decrementando il valore di `2.5` unità (usando `Math.max(0, ...)` per impedire carichi negativi).
              4. Configurare lo stepper delle ripetizioni impostando variazioni a passi di `1` unità.
              5. Collegare la casella di testo per le note opzionali con limite massimo impostato a 200 caratteri.
              ============================================================================ */}
          <form onSubmit={handleRegistraSerie} className="add-set-form card">
            <div className="type-toggle-row">
              <button 
                type="button" 
                className={`type-btn ${!isWarmup ? 'active' : ''}`} 
                onClick={() => setIsWarmup(false)}
              >
                Serie Allenante
              </button>
              <button 
                type="button" 
                className={`type-btn ${isWarmup ? 'w-active' : ''}`} 
                onClick={() => setIsWarmup(true)}
              >
                Riscaldamento (W)
              </button>
            </div>

            <div className="numeric-stepper-inputs">
              <div className="stepper-field">
                <label>Carico (Kg)</label>
                <div className="stepper-controls">
                  <button type="button" onClick={() => setPeso(p => Math.max(0, (parseFloat(p) || 0) - 2.5).toString())}>−</button>
                  <input 
                    type="number" 
                    step="0.01" 
                    inputMode="decimal"
                    placeholder="Corpo libero"
                    value={peso} 
                    onChange={e => setPeso(e.target.value)} 
                  />
                  <button type="button" onClick={() => setPeso(p => ((parseFloat(p) || 0) + 2.5).toString())}>+</button>
                </div>
              </div>

              <div className="stepper-field">
                <label>Ripetizioni</label>
                <div className="stepper-controls">
                  <button type="button" onClick={() => setRipetizioni(r => Math.max(1, (parseInt(r) || 0) - 1).toString())}>−</button>
                  <input 
                    type="number" 
                    inputMode="numeric" 
                    required
                    value={ripetizioni} 
                    onChange={e => setRipetizioni(e.target.value)} 
                  />
                  <button type="button" onClick={() => setRipetizioni(r => ((parseInt(r) || 0) + 1).toString())}>+</button>
                </div>
              </div>
            </div>

            <div className="input-group-note">
              <input 
                type="text" 
                maxLength={200} 
                placeholder="Note opzionali per questa serie..." 
                value={noteSerie} 
                onChange={e => setNoteSerie(e.target.value)} 
              />
            </div>

            <button type="submit" className="btn-submit-set-row">⚡ Registra e Avvia Recupero</button>
          </form>
        </div>
      )}
    </div>
  );
}
