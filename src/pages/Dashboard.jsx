// ============================================================================
// TAPPA 1: Importazione delle Dipendenze, Hook e Stili Interni
// OBIETTIVO: Caricare gli strumenti di stato, il client API di Supabase, gli hook di consumo del timer globale e gli stili visuali dedicati.
// TEORIA DA STUDIARE PRIMA:
// - Integrazione di Contesti Eterogenei: Consumare funzionalità di un'area dell'applicazione (es. RestTimerContext) all'interno di una pagina di layout.
// PASSAGGI LOGICI:
// 1. Importare gli hook useState ed useEffect dal modulo 'react'.
// 2. Importare il client d'interfaccia supabase dalle librerie locali.
// 3. Importare l'hook custom useRestTimer dal file del contesto del timer di recupero.
// 4. Collegare il foglio di stile locale './Dashboard.css'.
// ============================================================================
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRestTimer } from '../context/RestTimerContext';
import './Dashboard.css';

// ============================================================================
// TAPPA 2: Dichiarazione del Componente e Configurazione dei Modelli di Stato
// OBIETTIVO: Definire la funzione Dashboard e inizializzare gli stati per schede, caricamenti e le variabili di tracciamento della sessione fitness attiva.
// TEORIA DA STUDIARE PRIMA:
// - Strutturazione di Dizionari/Mappe (Dati Chiave-Valore): Utilizzare un oggetto reattivo vuoto `({})` come mappa associativa in cui le chiavi dinamiche corrispondono ai nomi delle entità (es. nomi esercizi).
// PASSAGGI LOGICI:
// 1. Esportare la funzione componente Dashboard.
// 2. Inizializzare gli stati base per l'array schede e il flag booleano loading.
// 3. Estrarre il metodo startTimer invocando l'hook useRestTimer().
// 4. Configurare lo stato sessioneAttiva (inizialmente null) per tracciare se c'è un allenamento avviato nel database.
// 5. Creare lo stato eserciziSessione (array vuoto) e l'oggetto mappa logsInput per immagazzinare i pesi e le ripetizioni digitate.
// ============================================================================
export function Dashboard() {
  const [schede, setSchede] = useState([]);
  const [loading, setLoading] = useState(true);
  const { startTimer } = useRestTimer();

  // Stati della sessione attiva
  const [sessioneAttiva, setSessioneAttiva] = useState(null);
  const [eserciziSessione, setEserciziSessione] = useState([]);
  const [logsInput, setLogsInput] = useState({}); // Mappa per tracciare { [esercizio_nome]: { peso, reps } }

  // ============================================================================
  // TAPPA 3: Aggancio al Ciclo di Vita (Mounting)
  // OBIETTIVO: Avviare la sincronizzazione simultanea per scaricare l'elenco delle schede disponibili e controllare se l'utente ha lasciato una sessione aperta in precedenza.
  // PASSAGGI LOGICI:
  // 1. Definire un hook useEffect con array di controllo vuoto `([])`.
  // 2. Chiamare in sequenza fetchSchede() e controllaSessioneInCorso() all'interno della callback.
  // ============================================================================
  useEffect(() => {
    fetchSchede();
    controllaSessioneInCorso();
  }, []);

  // ============================================================================
  // TAPPA 4: Download delle Schede Disponibili
  // OBIETTIVO: Scaricare i record essenziali della tabella schede per consentire all'utente di selezionare la propria routine di partenza.
  // PASSAGGI LOGICI:
  // 1. Scrivere la funzione asincrona fetchSchede.
  // 2. Interrogare la tabella 'schede' selezionando id, nome e descrizione.
  // 3. Aggiornare lo stato locale e spegnere il caricamento nel blocco di chiusura finally.
  // ============================================================================
  const fetchSchede = async () => {
    try {
      const { data } = await supabase.from('schede').select('id, nome, descrizione');
      setSchede(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // TAPPA 5: Controllo delle Sessioni Pendenti (State Recovery)
  // OBIETTIVO: Interrogare il DB per verificare se esiste un record di allenamento avviato dall'utente ma non ancora concluso (data_fine non impostata).
  // TEORIA DA STUDIARE PRIMA:
  // - Filtri SQL per Valori Nulli (`.is`): Utilizzare l'istruzione `.is('colonna', null)` per verificare l'assenza di dati su un attributo specifico.
  // - Limitazione dei Risultati (`.limit`): Ottimizzare la query forzando l'estrazione di un unico record per evitare sovraccarichi.
  // PASSAGGI LOGICI:
  // 1. Ottenere l'utente corrente tramite supabase.auth.getUser().
  // 2. Effettuare una query sulla tabella 'sessioni_allenamento' filtrando per user_id, controllando che 'data_fine' sia null, e ordinando in modo decrescente.
  // 3. Se viene trovato un record, impostarlo nello stato sessioneAttiva e richiamare immediatamente fetchEserciziDellaScheda passandogli la chiave esterna della scheda.
  // ============================================================================
  const controllaSessioneInCorso = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('sessioni_allenamento')
      .select('*')
      .eq('user_id', user.id)
      .is('data_fine', null)
      .order('data_inizio', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const sessione = data[0];
      setSessioneAttiva(sessione);
      // Recupera gli esercizi storici o della scheda per continuare
      fetchEserciziDellaScheda(sessione.scheda_id);
    }
  };

  // ============================================================================
  // TAPPA 6: Estrazione Esercizi e Modellazione Dinamica degli Input
  // OBIETTIVO: Scaricare l'elenco degli esercizi associati alla sessione corrente e inizializzare la mappa degli input vuoti per ciascuno di essi.
  // TEORIA DA STUDIARE PRIMA:
  // - Inizializzazione di Strutture ad Oggetto con cicli: Iterare su un array di risposte SQL e popolare un oggetto vuoto accoppiando chiavi dinamiche a strutture predefinite (es. `obj[item.nome] = { ... }`).
  // PASSAGGI LOGICI:
  // 1. Controllare la validità di schedaId e avviare una query su 'esercizi_scheda' filtrando per ID scheda e ordinando per priorità.
  // 2. Registrare la lista nello stato eserciziSessione.
  // 3. Creare un oggetto temporaneo vuoto (initialInputs) ed eseguire un ciclo `.forEach()` sui dati ricevuti: per ogni esercizio, definire una chiave corrispondente al suo nome impostando i campi peso, reps e l'array storici vuoto.
  // 4. Riassegnare l'oggetto risultante al setter setLogsInput.
  // ============================================================================
  const fetchEserciziDellaScheda = async (schedaId) => {
    if (!schedaId) return;
    const { data } = await supabase
      .from('esercizi_scheda')
      .select('nome')
      .eq('scheda_id', schedaId)
      .order('ordine', { ascending: true });
    
    if (data) {
      setEserciziSessione(data);
      // Inizializza gli input vuoti per ciascun esercizio
      const initialInputs = {};
      data.forEach(es => {
        initialInputs[es.nome] = { peso: '', reps: '', storici: [] };
      });
      setLogsInput(initialInputs);
      
      // Carica eventuali serie già fatte in questa sessione per visualizzarle
      recuperaSerieSalvate(data[0]?.sessione_id);
    }
  };

  const recuperaSerieSalvate = async () => {
    // Implementazione opzionale per ricaricare le serie se si chiude l'app
  };

  // ============================================================================
  // TAPPA 7: Apertura Nuova Sessione di Allenamento
  // OBIETTIVO: Creare un nuovo record di allenamento all'interno del database impostando il timestamp esatto di avvio in formato ISO.
  // TEORIA DA STUDIARE PRIMA:
  // - Generazione di Timestamp Standardizzati (`toISOString`): Utilizzo del costruttore `new Date().toISOString()` per uniformare le date a livello internazionale nel database.
  // PASSAGGI LOGICI:
  // 1. Recuperare le credenziali dell'utente attivo.
  // 2. Eseguire una richiesta `.insert()` sulla tabella 'sessioni_allenamento' passando un oggetto contenente user_id, scheda_id, nome_scheda e la data d'inizio ISO.
  // 3. Estrarre il singolo record con `.select().single()`, salvarlo in sessioneAttiva e caricare i relativi esercizi.
  // ============================================================================
  const avviaAllenamento = async (scheda) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('sessioni_allenamento')
        .insert([{
          user_id: user.id,
          scheda_id: scheda.id,
          nome_scheda: scheda.nome,
          data_inizio: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      setSessioneAttiva(data);
      fetchEserciziDellaScheda(scheda.id);
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================================================================
   // ============================================================================
  // TAPPA 8: Salvataggio Serie, Parsing Numerico e Trigger del Timer Globale
  // OBIETTIVO: Salvare i dati di performance correnti sul database, aggiornare la cronologia visiva locale dell'esercizio e far scattare il conto alla rovescia del riposo.
  // TEORIA DA STUDIARE PRIMA:
  // - Funzioni di Parsing Numerico: Uso di parseFloat() e parseInt() per convertire le stringhe catturate dai form di input in dati numerici reali prima dell'invio.
  // - Aggiornamento di Chiavi Annidate Dinamiche: Clonare lo stato precedente di un oggetto tramite operatore spread e aggiornare selettivamente solo la sotto-proprietà legata al nome dell'esercizio corrente: [key]: { ... }.
  // PASSAGGI LOGICI:
  // 1. Estrarre i dati correnti dalla mappa logsInput usando il nome dell'esercizio come chiave. Verificare che i campi peso e reps non siano vuoti.
  // 2. Avviare un inserimento sulla tabella 'log_serie' mappando le colonne richieste (incluso l'id della sessione attiva) e convertendo i dati nei tipi primitivi corretti.
  // 3. Nel blocco di successo, aggiornare lo stato logsInput tramite la callback funzionale prev, espandendo l'array 'storici' con il nuovo set completato.
  // 4. Invocare il metodo startTimer(90) estratto dal contesto globale per avviare il countdown di recupero di 90 secondi.
  // • Errori da evitare: Dimenticare il parsing numerico, inviando i valori sotto forma di stringhe e causando potenziali violazioni dei vincoli di tipo delle tabelle del database Postgres.
  // ============================================================================
  const salvaSerie = async (nomeEsercizio) => {
    const input = logsInput[nomeEsercizio];
    if (!input.peso || !input.reps) return;

    try {
      const { error } = await supabase
        .from('log_serie')
        .insert([{
          sessione_id: sessioneAttiva.id,
          nome_esercizio: nomeEsercizio,
          peso: parseFloat(input.peso),
          ripetizioni: parseInt(input.reps),
          completato: true
        }]);

      if (error) throw error;

      // Aggiorna lo stato locale per mostrare la serie fatta
      setLogsInput(prev => ({
        ...prev,
        [nomeEsercizio]: {
          ...prev[nomeEsercizio],
          storici: [...(prev[nomeEsercizio].storici || []), { peso: input.peso, reps: input.reps }]
        }
      }));

      // Fai partire il timer di recupero (es. 90 secondi)
      startTimer(90);
    } catch (err) {
      alert("Errore nel salvataggio della serie: " + err.message);
    }
  };

  // ============================================================================
  // TAPPA 9: Chiusura Sessione con Query di Aggiornamento (`.update`)
  // OBIETTIVO: Modificare il record dell'allenamento attivo iniettando la data di fine per marcare la sessione come completata e pulire l'interfaccia di lavoro.
  // TEORIA DA STUDIARE PRIMA:
  // - Modifica parziale di record (Update SQL): Uso del costrutto .update().eq('id', target) per alterare solo specifiche colonne su una riga individuata.
  // PASSAGGI LOGICI:
  // 1. Chiedere conferma all'utente mediante la finestra pop-up di sistema window.confirm().
  // 2. Chiamare il metodo .update() di Supabase iniettando un oggetto con data_fine impostata sul timestamp ISO attuale, filtrando la query per l'ID della sessione attiva.
  // 3. Azzerare gli stati sessioneAttiva e eserciziSessione per resettare la visualizzazione client-side.
  // ============================================================================
  const terminaAllenamento = async () => {
    if (!window.confirm("Vuoi davvero terminare l'allenamento corrente?")) return;
    try {
      const { error } = await supabase
        .from('sessioni_allenamento')
        .update({ data_fine: new Date().toISOString() })
        .eq('id', sessioneAttiva.id);

      if (error) throw error;
      setSessioneAttiva(null);
      setEserciziSessione([]);
      alert("Allenamento completato con successo! Ottimo lavoro.");
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================================================================
  // TAPPA 10: Intercettazione del Caricamento e Rendering delle Viste Condizionali
  // OBIETTIVO: Isolare l'interfaccia durante i caricamenti iniziali e smistare il rendering tra la visualizzazione di selezione scheda e il pannello di tracking dell'allenamento attivo.
  // TEORIA DA STUDIARE PRIMA:
  // - Rendering condizionale di form nidificati su oggetti complessi: Sfruttare l'operatore ternario per generare interfacce interattive basate sulla presenza o assenza di un record di sessione, legando gli input numerici a chiavi dinamiche dell'oggetto di stato.
  // PASSAGGI LOGICI:
  // 1. Gestire la condizione di caricamento iniziale ritornando un tag testuale di attesa se loading è attivo.
  // 2. Nel blocco principale, usare l'operatore ternario controllando la variabile !sessioneAttiva.
  // 3. Se vera, mappare l'array delle schede disponibili assegnando l'azione avviaAllenamento al click di ogni elemento.
  // 4. Se falsa (sessione avviata), renderizzare il pannello live eseguendo il .map() sull'array eserciziSessione.
  // 5. Estrarre in linea l'oggetto di input corrente per ciascun esercizio e legare i campi numerici Kg e Reps a funzioni di aggiornamento che modificano in modo reattivo solo la specifica cella del dizionario di stato locale.
  // • Errori da evitare: Omettere l'inizializzazione di fallback (|| { peso: '', reps: '', storici: [] }) durante la lettura in linea della mappa degli input, causando errori di tipo "undefined" al primo rendering della schermata.
  // ============================================================================
  if (loading) return <p style={{ padding: 20 }}>Caricamento...</p>;

  return (
    <div className="dashboard-container">
      {!sessioneAttiva ? (
        <div className="seleziona-scheda-view">
          <h2>Inizia Allenamento</h2>
          <p className="subtitle">Seleziona una delle tue schede per avviare la sessione:</p>
          
          {schede.length === 0 ? (
            <p className="hint">Nessuna scheda trovata. Vai nella sezione Schede per crearne una!</p>
          ) : (
            <div className="schede-list-start">
              {schede.map(scheda => (
                <div key={scheda.id} className="start-card" onClick={() => avviaAllenamento(scheda)}>
                  <h3>{scheda.nome}</h3>
                  {scheda.descrizione && <p>{scheda.descrizione}</p>}
                  <button className="btn-start">Avvia ⚡</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="allenamento-attivo-view">
          <div className="workout-header">
            <div>
              <h2>In Sessione: {sessioneAttiva.nome_scheda}</h2>
              <span className="live-badge">LIVE TRACKING</span>
            </div>
            <button className="btn-end-workout" onClick={terminaAllenamento}>Termina</button>
          </div>

          <div className="esercizi-workout-list">
            {eserciziSessione.map((es, index) => {
              const currentInput = logsInput[es.nome] || { peso: '', reps: '', storici: [] };
              return (
                <div key={index} className="esercizio-workout-card">
                  <h4>{es.nome}</h4>
                  
                  {/* Riga di inserimento dati della serie */}
                  <div className="log-row-inputs">
                    <input 
                      type="number" 
                      placeholder="Kg" 
                      value={currentInput.peso} 
                      onChange={e => setLogsInput(prev => ({
                        ...prev,
                        [es.nome]: { ...prev[es.nome], peso: e.target.value }
                      }))}
                    />
                    <input 
                      type="number" 
                      placeholder="Reps" 
                      value={currentInput.reps}
                      onChange={e => setLogsInput(prev => ({
                        ...prev,
                        [es.nome]: { ...prev[es.nome], reps: e.target.value }
                      }))}
                    />
                    <button className="btn-save-set" onClick={() => salvaSerie(es.nome)}>✓ Spunta</button>
                  </div>

                  {/* Elenco visivo dei set fatti durante questa sessione */}
                  {currentInput.storici && currentInput.storici.length > 0 && (
                    <div className="sets-done-list">
                      {currentInput.storici.map((set, sIdx) => (
                        <div key={sIdx} className="set-badge">
                          Set {sIdx + 1}: <strong>{set.peso} Kg</strong> x {set.reps}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
