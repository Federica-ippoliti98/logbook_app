// ============================================================================
// TAPPA 1: Importazione delle Dipendenze Core e del Client API
// OBIETTIVO: Caricare le funzioni native di React per la gestione dello stato globale e delle sottoscrizioni, uniti al client SDK di Supabase.
// TEORIA DA STUDIARE PRIMA:
// - Named vs Default Imports: Sintassi ES6 per estrarre selettivamente hook core da 'react' o istanze configurate da percorsi relativi locali.
// ============================================================================
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// TAPPA 2: Creazione del Contesto Globale (AuthContext)
// OBIETTIVO: Inizializzare lo spazio isolato che distribuirà le informazioni utente e le funzioni a cascata su tutta l'app.
// ============================================================================
const AuthContext = createContext({});

// ============================================================================
// TAPPA 3: Dichiarazione del Provider e degli Stati Fondamentali
// OBIETTIVO: Definire il componente AuthProvider e le tre variabili reattive per memorizzare utente, dati del profilo fisico e stato di blocco del caricamento.
// ============================================================================
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // TAPPA 5 (Aggiornata): Recupero Avanzato e Inizializzazione Automatica del Profilo (`fetchProfile`)
  // OBIETTIVO: Scaricare i dati del profilo dal database e, in caso di assenza (primo login), intercettare l'anomalia per inserire istantaneamente una riga iniziale con valori di default.
  // TEORIA DA STUDIARE PRIMA:
  // - Gestione degli Errori PostgREST: Comprendere il codice `PGRST116` che indica che la query di riga singola (.single()) non ha trovato alcun record corrispondente.
  // - Pattern di Autoinizializzazione (Upsert Client-Side): Creare un payload strutturato con i parametri predefiniti dell'applicazione (es. obiettivi serie, timer di recupero) per salvare il record a runtime senza dipendere da trigger di database.
  // PASSAGGI LOGICI:
  // 1. Avviare la query asincrona di selezione sulla tabella 'profiles' filtrando per l'ID utente.
  // 2. Se l'oggetto error restituisce il codice `PGRST116`, preparare l'oggetto `defaultProfile` inserendo come chiavi l'ID utente e i valori standard di configurazione.
  // 3. Eseguire una richiesta `.insert()` passando il payload e concatenando `.select().single()` per estrarre i dati della riga appena generata.
  // 4. In caso di errori diversi da PGRST116, arrestare il blocco lanciando l'eccezione all'esterno.
  // 5. Assegnare i dati finali estratti o inseriti allo stato `profile`.
  // • Errori da evitare: Dimenticare l'istruzione `.select().single()` sulla query di insert, impedendo il recupero immediato delle informazioni appena create e lasciando lo stato locale vuoto.
  // ============================================================================
  // Sincronizza o inserisce automaticamente la riga profilo al primo accesso (Pagina 9)
  const fetchProfile = async (userId) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Errore PGRST116: Record non trovato -> Crea il profilo iniziale di default
      if (error && error.code === 'PGRST116') {
        const defaultProfile = {
          id: userId,
          weekly_workout_goal: 4,
          default_rest_seconds: 180
        };

        const { data: insertedData, error: insertError } = await supabase
          .from('profiles')
          .insert([defaultProfile])
          .select()
          .single();

        if (insertError) throw insertError;
        data = insertedData;
      } else if (error) {
        throw error;
      }

      setProfile(data || null);
    } catch (error) {
      console.error('Errore nella sincronizzazione automatica del profilo:', error.message);
    }
  };

  // ============================================================================
  // TAPPA 6: Sincronizzazione ed Ascolto dei Cambiamenti di Stato (useEffect)
  // OBIETTIVO: Gestire il recupero della sessione archiviata nel browser all'avvio dell'applicazione ed attivare l'ascoltatore globale in tempo reale per login e logout.
  // TEORIA DA STUDIARE PRIMA:
  // - Risoluzione di Promesse Annidate (.then): Sincronizzare lo spegnimento dello stato loading solo dopo che il metodo asincrono `fetchProfile` ha interamente concluso la sua catena di query.
  // PASSAGGI LOGICI:
  // 1. Dichiarare l'hook useEffect a dipendenze vuote `([])`.
  // 2. Chiamare `supabase.auth.getSession()` e agganciare il `.then()` per estrarre la sessione. Se l'utente esiste, eseguire `fetchProfile` e, solo al termine di quest'ultima, impostare `setLoading(false)`.
  // 3. Registrare il listener `supabase.auth.onAuthStateChange()`, aggiornando l'utente e coordinando lo scaricamento o il reset del profilo prima di disattivare il caricamento.
  // 4. Restituire la funzione freccia di cleanup per eseguire `subscription.unsubscribe()`.
  // • Errori da evitare: Spegnere lo stato loading prematuramente nel blocco getSession prima che fetchProfile abbia terminato, causando il rendering dei componenti figli prima che il profilo sia disponibile.
  // ============================================================================
  useEffect(() => {
    // Controllo sessione memorizzata nel browser all'avvio
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Ascolto in tempo reale dei cambi di stato (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ============================================================================
  // TAPPA 4: Implementazione dei Metodi Asincroni di Autenticazione (signUp, signIn, signOut)
  // OBIETTIVO: Creare le tre funzioni asincrone per inoltrare al modulo auth di Supabase le richieste di creazione account, login con password e distruzione del token di sessione.
  // ============================================================================
  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // ============================================================================
  // TAPPA 7: Configurazione del Provider del Contesto e dell'Hook Custom
  // OBIETTIVO: Raggruppare stati e funzioni nell'attributo value, implementare il rendering condizionale dei figli ed esportare l'hook useAuth per l'applicazione.
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

export const useAuth = () => useContext(AuthContext);
