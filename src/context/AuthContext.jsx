// ============================================================================
// TAPPA 1: Importazione delle Dipendenze (import)
// OBIETTIVO: Importare le funzioni native di React e il client Supabase pronti all'uso.
// TEORIA DA STUDIARE PRIMA:
// - Named vs Default Imports: Sintassi per estrarre funzioni specifiche da un pacchetto o importare un intero modulo.
// - Percorsi Relativi: Navigazione tra cartelle per collegare file locali del progetto.
// PASSAGGI LOGICI:
// 1. Importa i quattro hook fondamentali direttamente dal pacchetto di React.
// 2. Importa il client Supabase personalizzato puntando al percorso relativo corretto della cartella delle librerie.
// ============================================================================
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// TAPPA 2: Creazione del Contesto Globale (AuthContext)
// OBIETTIVO: Inizializzare lo spazio isolato che conterrà i dati e le funzioni di autenticazione.
// TEORIA DA STUDIARE PRIMA:
// - React Context API: Sistema nativo per condividere dati globali senza passare props manualmente.
// - createContext: Funzione che genera un oggetto contesto con un valore predefinito opzionale.
// PASSAGGI LOGICI:
// 1. Invoca la funzione di creazione del contesto.
// 2. Passa un oggetto vuoto como valore iniziale predefinito.
// 3. Salva il risultato in una costante interna non esportata direttamente.
// ============================================================================
// Crea la scatola vuota che conterrà i nostri dati globali
const AuthContext = createContext({});

// ============================================================================
// TAPPA 3: Inizializzazione degli Stati Fondamentali (user, profile, loading)
// OBIETTIVO: Dichiarare le variabili reattive per utente, dati del profilo e stato di caricamento.
// TEORIA DA STUDIARE PRIMA:
// - useState Hook: Strumento per memorizzare dati variabili che aggiornano l'interfaccia al loro cambio.
// - Stato Iniziale Coerente: Scegliere valori di partenza logici (es. null per dati assenti, true per processi attivi).
// PASSAGGI LOGICI:
// 1. Dichiarare la funzione componente del Provider che riceve la prop children.
// 2. Inizializzare lo stato per l'utente di Supabase partendo da un valore nullo.
// 3. Inizializzare lo stato per il profilo del database partendo da un valore nullo.
// 4. Inizializzare lo stato booleano di caricamento impostandolo inizialmente su attivo.
// ============================================================================
// children  Rappresenta tutti i componenti della nostra app che verranno avvolti da questo sistema di autenticazione.
export const AuthProvider = ({ children }) => {
  // 1. Contiene l'oggetto utente di Supabase Auth (id, email, ecc.)
  const [user, setUser] = useState(null);
  
  // 2. Contiene i dati fisici presi dalla tabella "profiles" del DB (altezza, peso, obiettivi)
  const [profile, setProfile] = useState(null);
  
  // 3. Dice all'app se sta ancora controllando se l'utente sia loggato o meno all'avvio
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // TAPPA 5: Recupero dei Dati dal Database (fetchProfile e refreshProfile)
  // OBIETTIVO: Scaricare i campi personalizzati del profilo usando l'identificativo dell'utente autenticato.
  // TEORIA DA STUDIARE PRIMA:
  // - Sintassi Query Supabase: Uso di .from(), .select(), .eq() per filtrare record sul database.
  // - Modificatore .single(): Istruzione per richiedere un singolo oggetto anziché un array di risultati.
  // - Codice Errore PGRST116: Errore specifico di PostgREST che indica che nessun record è stato trovato.
  // PASSAGGI LOGICI (Parte 1):
  // 1. Scrivi una funzione asincrona che accetta l'ID dell'utente loggato.
  // 2. Avvia una query sulla tabella dei profili filtrando per la colonna ID.
  // 3. Richiedi una riga singola e intercetta eventuali errori di rete.
  // 4. Se l'errore è un record non trovato (PGRST116), ignoralo; altrimenti lancia l'errore.
  // 5. Aggiorna lo stato del profilo con i dati ricevuti o impostalo a null.
  // ============================================================================
  // Funzione che scarica i dati del profilo dal database usando l'ID utente
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId) // eq è uguale a WHERE  in sql
        .single(); // Chiediamo una riga singola

      if (error && error.code !== 'PGRST116') throw error; // Ignora l'errore se il profilo non esiste ancora
      setProfile(data || null);
    } catch (error) {
      console.error('Errore nel caricamento del profilo:', error.message);
    }
  };

  // ============================================================================
  // TAPPA 6: Sincronizzazione della Sessione all'Avvio e Ascolto degli Eventi (useEffect e onAuthStateChange)
  // 
  // --- BLOCCO A: DICHIARAZIONE HOOK ---
  // • Obiettivo: Dichiarare l'hook del ciclo di vita impostandolo per l'attivazione esclusiva al momento del caricamento iniziale della pagina.
  // • Teoria da studiare prima:
  // 	• Array di dipendenze vuoto: Comprendere come limitare l'esecuzione di un effetto al solo momento del montaggio del componente (consultare la guida di riferimento di "useEffect" su react.dev).
  // • Passaggi logici:
  // 	1. Sotto la funzione fetchProfile, scrivere la struttura dell'hook useEffect.
  // 	2. Passare come primo parametro una funzione di callback e come secondo parametro un array di controllo vuoto [].
  // • Errore da evitare: Inserire variabili instabili all'interno dell'array delle dipendenze che causerebbero riesecuzioni continue del controllo di sessione.
  // ============================================================================
  useEffect(() => {
    // ============================================================================
    // --- BLOCCO B: RECUPERO SESSIONE INIZIALE (`getSession`) ---
    // • Obiettivo: Inviare una richiesta immediata al motore di autenticazione per estrarre eventuali token utente salvati precedentemente nel browser.
    // • Teoria da studiare prima:
    // 	• Lettura sessione locale: Studiare i meccanismi di persistenza dell'autenticazione (consultare la sezione di riferimento "Auth getSession()" su supabase.com).
    // • Passaggi logici:
    // 	1. Come prima istruzione dentro l'hook useEffect, richiamare il metodo supabase.auth.getSession().
    // 	2. Agganciare direttamente alla chiamata il metodo di micro-risoluzione delle promesse .then().
    // 	3. All'interno della funzione di callback del .then(), distrutturare i dati ricevuti per prelevare l'oggetto sessione con la sintassi ({ data: { session } }) => { ... }.
    // • Errore da evitare: Usare costrutti sincroni errati per intercettare il token prima che il client Supabase si sia interamente avviato.
    // ============================================================================
    // A. All'avvio dell'app, controlla subito se c'è un utente già loggato nel browser (sessione attiva)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false); // Finito il controllo iniziale, smette di caricare
    });

    // ============================================================================
    // --- BLOCCO C: ASCOLTO EVENTI DI AUTENTICAZIONE (`onAuthStateChange`) ---
    // • Obiettivo: Configurare un ascoltatore attivo in tempo reale per intercettare qualsiasi variazione futura dello stato di auth (login, logout, token rinnovati).
    // • Teoria da studiare prima:
    // 	• Cambiamenti di stato Auth: Studiare come Supabase notifica gli eventi di sessione tramite callback e come restituisce una struttura dati annidata (`{ data: { subscription } }`).
    // • Passaggi logici:
    // 	1. Chiamare la funzione asincrona supabase.auth.onAuthStateChange().
    // 	2. Fornire come parametro una funzione di callback asincrona che riceve l'evento (`_event`) e la sessione corrente (`session`).
    // 	3. Estrarre l'oggetto "subscription" tramite destrutturazione del valore di ritorno e salvarlo in una costante.
    // 	4. All'interno della callback, aggiornare lo stato dell'utente e verificare se prelevare il nuovo profilo o resettarlo a null in caso di disconnessione.
    // • Errore da evitare: Dimenticare di spegnere lo stato loading all'interno del gestore eventi, bloccando l'interfaccia.
    // ============================================================================
    // B. Resta in ascolto degli eventi futuri: LOGIN, LOGOUT, PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfile(currentUser.id); // Se entra un utente, prendi il suo profilo
      } else {
        setProfile(null); // Se esce, svuota il profilo
      }
      setLoading(false);
    });

    // ============================================================================
    // --- BLOCCO D: FUNZIONE DI PULIZIA (CLEANUP) E SOTTO-METODO UNSUBSCRIBE ---
    // • Obiettivo: Chiudere l'ascoltatore di Supabase non appena il componente viene distrutto per evitare memory leak e sprechi di memoria.
    // • Teoria da studiare prima:
    // 	• Funzione di Pulizia in useEffect: Comprendere come il valore di ritorno di un effetto gestisca la rimozione dei canali aperti.
    // 	• Metodo Unsubscribe: Capire come invocare la funzione nativa inclusa nell'oggetto "subscription" per dire a Supabase di rimuovere il listener.
    // • Passaggi logici:
    // 	1. Usare la parola chiave `return` alla fine dell'hook useEffect per dichiarare una funzione anonima di cleanup.
    // 	2. All'interno di questa funzione, richiamare la costante locale "subscription" definita nel Blocco C.
    // 	3. Eseguire il metodo `.unsubscribe()` associato all'oggetto.
    // • Errore da evitare: Lasciare l'ascoltatore attivo in background dopo lo smontaggio, provocando tentativi di aggiornamento di stato su componenti inesistenti.
    // ============================================================================
    // Pulizia dell'ascoltatore quando il componente viene smontato
    return () => subscription.unsubscribe();
  }, []);


    // ============================================================================
  // TAPPA 4: Implementazione dei Metodi di Autenticazione (signUp, signIn, signOut)
  // OBIETTIVO GENERALE: Creare le funzioni per la registrazione, l'accesso e la disconnessione degli utenti.
  // TEORIA GENERALE DA STUDIARE PRIMA:
  // - Supabase Auth API: Metodi nativi del client per gestire le credenziali e le sessioni.
  // - Funzioni Asincrone (Async/Await): Sintassi per attendere operazioni di rete senza bloccare il codice.
  // PASSAGGI LOGICI GENERALI:
  // 1. Crea la funzione di registrazione che invia email e password a Supabase e solleva un errore se fallisce.
  // 2. Crea la funzione di login che autentica le credenziali e solleva un errore se fallisce.
  // 3. Crea la funzione di logout che termina la sessione corrente su Supabase e solleva un errore se fallisce.
  // ============================================================================
  
  // ============================================================================
  // --- DETTAGLIO: METODO DI REGISTRAZIONE (`signUp`) ---
  // • Obiettivo: Sviluppare il metodo asincrono per inoltrare le richieste di creazione account al sistema di autenticazione di Supabase, gestendo le eccezioni in modo centralizzato.
  // • Teoria da studiare prima:
  // 	• Registrazione utenti: Studiare le specifiche del metodo di creazione account tramite credenziali tradizionali (consultare la sezione di riferimento "Auth signUp()" su supabase.com).
  // • Passaggi logici:
  // 	1. Sotto l'hook useEffect, definire una costante asincrona chiamata signUp strutturata come funzione freccia che accetta i parametri email e password.
  // 	2. All'interno, effettuare la chiamata di attesa memorizzando i dati e l'eventuale errore restituiti dal client: const { data, error } = await supabase.auth.signUp({ email, password });.
  // 	3. Inserire un controllo condizionale: se l'oggetto error è presente, lanciare l'eccezione all'esterno con throw error.
  // 	4. Se la richiesta ha successo, restituire l'oggetto data.
  // • Errori da evitare: Non intercettare o nascondere l'oggetto error, impedendo alle interfacce utente successive di mostrare i messaggi di validazione appropriati (es. email già registrata).
  // ============================================================================
  // Funzione di Registrazione
  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  // ============================================================================
  // --- DETTAGLIO: METODO DI LOGIN (`signIn`) ---
  // • Obiettivo: Sviluppare il metodo asincrono per convalidare le credenziali dell'utente e generare un token di sessione sicuro tramite Supabase.
  // • Teoria da studiare prima:
  // 	• Accesso con credenziali: Studiare i flussi di accesso tramite password (consultare la sezione di riferimento "Auth signInWithPassword()" su supabase.com).
  // • Passaggi logici:
  // 	1. Definire una costante asincrona denominata signIn che accetta gli argomenti email e password.
  // 	2. Invocare il servizio di rete memorizzando il risultato in forma distrutturata: const { data, error } = await supabase.auth.signInWithPassword({ email, password });.
  // 	3. Verificare la presenza di errori tramite un'istruzione if e, in caso positivo, effettuarne il rilancio immediato con throw error.
  // 	4. Restituire l'oggetto data risultante in caso di esito positivo.
  // • Errori da evitare: Salvare dati parziali nello stato prima che la promessa di login si sia interamente risolta.
  // ============================================================================
  // Funzione di Login
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  // ============================================================================
  // --- DETTAGLIO: METODO DI LOGOUT (`signOut`) ---
  // • Obiettivo: Sviluppare il metodo asincrono per distruggere la sessione corrente sia sul server di backend che nella memoria locale del browser.
  // • Teoria da studiare prima:
  // 	• Disconnessione delle sessioni: Comprendere la terminazione dei token di accesso (consultare la sezione di riferimento "Auth signOut()" su supabase.com).
  // • Passaggi logici:
  // 	1. Definire una costante asincrona nominata signOut senza parametri in ingresso.
  // 	2. Eseguire l'istruzione di attesa per la disconnessione: const { error } = await supabase.auth.signOut();.
  // 	3. Aggiungere il controllo di sicurezza: se si verifica un errore, propagarlo all'esterno tramite throw error.
  // • Errori da evitare: Omettere il controllo degli errori sulla disconnessione di rete.
  // ============================================================================
  // Funzione di Logout
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

    // ============================================================================
  // TAPPA 7: Configurazione del Provider e dell'Hook di Consumo (AuthProvider e useAuth)
  // OBIETTIVO GENERALE: Esportare il componente Provider condizionale e l'hook personalizzato per i componenti figli.
  // TEORIA GENERALE DA STUDIARE PRIMA:
  // - Context.Provider: Componente che distribuisce un oggetto di valori a tutti i nodi sottostanti.
  // - useContext Hook: Hook per estrarre i dati correnti di un contesto in un componente qualsiasi.
  // - Rendering Condizionale: Mostrare o nascondere elementi in base allo stato di una variabile booleana.
  // ============================================================================

  // ============================================================================
  // --- DETTAGLIO: COMPOSIZIONE VALORE E BLOCCO DI RITORNO PROVDIER ---
  // • Obiettivo: Comporre il blocco di ritorno del componente AuthProvider per iniettare tutti gli stati e le funzioni nel provider del contesto, abilitando il rendering condizionale.
  // • Teoria da studiare prima:
  // 	• Sintassi dei Provider di contesto: Studiare come l'attributo speciale value distribuisce i dati reattivi (consultare la pagina di riferimento di "createContext" su react.dev).
  // • Passaggi logici:
  // 	1. In fondo alla funzione AuthProvider, scrivere l'istruzione di return ( ... );.
  // 	2. Aprire il tag del componente provider utilizzando la costante definita all'inizio: <AuthContext.Provider>.
  // 	3. Configurare l'attributo value passandogli un oggetto JavaScript contenente le chiavi di tutti gli stati e i metodi creati: user, profile, loading, signUp, signIn, signOut, uniti a una funzione di utilità refreshProfile che esegua nuovamente fetchProfile(user.id).
  // 	4. All'interno dei tag di apertura e chiusura del Provider, inserire l'espressione di rendering condizionale: { !loading && children }.
  // • Errori da evitare: Sbagliare la sintassi delle parentesi graffe nell'attributo value quando si passano oggetti letterali direttamente in linea (ricorda che se non si usa una costante separata come "value" servono doppie graffe: value={{ user, ... }}).
  // ============================================================================
  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => user && fetchProfile(user.id)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// --- DETTAGLIO: CREAZIONE E ESPORTAZIONE CUSTOM HOOK (`useAuth`) ---
// • Obiettivo: Dichiarare ed esportare un hook personalizzato per semplificare l'estrazione dei dati di autenticazione all'interno delle singole pagine dell'applicazione.
// • Teoria da studiare prima:
// 	• Scrittura di Custom Hook: Comprendere come astrarre l'utilizzo combinato di useContext e del contesto specifico (consultare la guida "Reusing Logic with Custom Hooks" su react.dev).
// • Passaggi logici:
// 	1. Posizionarsi in fondo al file, al di fuori e al di sotto del corpo del componente AuthProvider.
// 	2. Dichiarare ed esportare una costante chiamata useAuth configurata come funzione freccia contratta su una sola riga.
// 	3. Impostare la funzione affinché esegua e restituisca direttamente l'hook nativo useContext a cui viene passato come argomento l'oggetto AuthContext.
// • Errori da evitare: Scrivere la dichiarazione dell'hook all'interno di un altro componente o dimenticare di esportarlo.
// ============================================================================
export const useAuth = () => useContext(AuthContext);
