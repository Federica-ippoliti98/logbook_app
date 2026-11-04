// ============================================================================
// TAPPA 1: Importazione di Hook, Client API e Fogli di Stile
// OBIETTIVO: Caricare gli strumenti di stato locali di React, il client di Supabase, le utility di navigazione e gli stili visuali dedicati.
// TEORIA DA STUDIARE PRIMA:
// - Programmatic Navigation: Comprendere come reindirizzare gli utenti via codice tramite l'hook useNavigate dopo un'operazione asincrona andata a buon fine.
// - Importazione Asset (CSS): Includere fogli di stile locali per isolare la formattazione visiva della pagina.
// PASSAGGI LOGICI:
// 1. Importare lo stato useState da 'react'.
// 2. Importare l'istanza configurata di supabase dal percorso relativo delle librerie.
// 3. Importare l'hook useNavigate da 'react-router-dom'.
// 4. Collegare il file di stile './Login.css'.
// ============================================================================
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import './Login.css';

// ============================================================================
// TAPPA 2: Dichiarazione dei Componenti e Inizializzazione degli Stati Locali
// OBIETTIVO: Definire la funzione principale del componente e isolare le variabili reattive per i campi di input, i messaggi di feedback e l'attesa di rete.
// TEORIA DA STUDIARE PRIMA:
// - Form State Management: Gestione dello stato locale per tracciare ciò che l'utente scrive o seleziona.
// - Stati di Feedback (Error/Message/Loading): Variabili booleane o stringhe usate per mutare l'interfaccia durante i caricamenti o in caso di errore.
// PASSAGGI LOGICI:
// 1. Esportare la funzione componente Login.
// 2. Creare un flag booleano isSignUp (inizialmente false) per decidere se mostrare la form di Accesso o di Registrazione.
// 3. Inizializzare stringhe vuote per email e password.
// 4. Inizializzare a null le variabili locali per intercettare stringhe di errore o messaggi di successo.
// 5. Creare lo stato booleano loading impostato inizialmente a false.
// 6. Eseguire l'hook useNavigate() salvandolo in una costante.
// ============================================================================
export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ============================================================================
  // TAPPA 3: Gestione dell'Invio Form e Flusso di Autenticazione Asincrona
  // OBIETTIVO: Sviluppare la funzione di intercettazione del submit per inviare i dati a Supabase, smistando la logica tra iscrizione e login.
  // TEORIA DA STUDIARE PRIMA:
  // - Evento e.preventDefault(): Bloccare il comportamento predefinito dei browser che rinfrescano l'intera pagina al submit di una form.
  // - Costrutto Try/Catch/Finally: Schema ottimale per eseguire chiamate asincrone, catturare eccezioni di rete e ripristinare in ogni caso (finally) gli stati di loading.
  // - Rilancio degli Errori SDK: Controllare la presenza dell'oggetto error restituito da Supabase e sollevarlo con throw per deviare il flusso nel blocco catch.
  // PASSAGGI LOGICI:
  // 1. Creare la funzione asincrona handleSubmit che accetta l'evento "e" come parametro.
  // 2. Invocare e.preventDefault() e ripulire i vecchi alert impostando error e message a null, attivando al contempo loading a true.
  // 3. Aprire il blocco try: se isSignUp è true, chiamare supabase.auth.signUp; se l'SDK restituisce un errore, lanciarlo, altrimenti mostrare il messaggio di successo.
  // 4. Se isSignUp è false, chiamare supabase.auth.signInWithPassword; se fallisce lanciare l'errore, altrimenti usare navigate('/') per spostare l'utente nella dashboard protetta.
  // 5. Nel blocco catch(err), salvare err.message nello stato error.
  // 6. Nel blocco finally, spegnere il caricamento riportando loading a false.
  // • Errori da evitare: Salvare variabili all'esterno del flusso try/catch o scordare il blocco finally, lasciando il pulsante disabilitato per sempre in caso di errore.
  // ============================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Registrazione nuovo utente
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setMessage('Registrazione completata! Controlla la tua email per il link di conferma.');
      } else {
        // Accesso utente esistente
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        navigate('/'); // Vai alla dashboard principale
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // TAPPA 4: Rendering di Interfaccia Condizionale e Campi di Input Controllati
  // OBIETTIVO: Comporre la struttura visiva JSX legando i valori degli input agli stati locali e stampando dinamicamente i testi e gli avvisi di errore.
  // TEORIA DA STUDIARE PRIMA:
  // - Input Controllati (Controlled Components): Legare la prop "value" a una variabile di stato e aggiornarla tramite l'evento "onChange" intercettando e.target.value.
  // - Cortocircuito Logico (&&): Tecnica rapida per mostrare un tag HTML (es. l'alert) solo se la stringa di testo contiene dati reali.
  // - Disabilitazione Pulsanti: Sfruttare la proprietà nativa "disabled" dei bottoni per impedire click multipli accidentali durante i caricamenti di rete.
  // PASSAGGI LOGICI:
  // 1. Aprire il contenitore form e agganciare handleSubmit all'evento onSubmit del tag.
  // 2. Usare l'operatore ternario nel tag h2 per alternare tra "Crea un account" e "Accedi" basandosi su isSignUp.
  // 3. Stampare condizionalmente i blocchi div degli alert tramite error && ... e message && ...
  // 4. Configurare i tag input per email e password impostando value e onChange.
  // 5. Iniettare disabled={loading} sul tag button.
  // 6. Creare un tag cliccabile (span) che inverte il booleano di isSignUp al click per permettere lo switch visivo della form.
  // • Errori da evitare: Dimenticare l'attributo type="submit" sul pulsante principale o omettere l'attributo required negli input, bypassando la validazione nativa del browser.
  // ============================================================================
  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="brand-title">🏋️‍♂️ LOGBOOK</h1>
        <p className="brand-subtitle">Traccia i tuoi record. Spingi oltre i tuoi limiti.</p>
        
        <h2>{isSignUp ? 'Crea un account' : 'Accedi'}</h2>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="tu@email.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Elaborazione...' : isSignUp ? 'Registrati' : 'Accedi'}
          </button>
        </form>

        <p className="toggle-auth">
          {isSignUp ? 'Hai già un account?' : 'Nuovo su Logbook?'} {' '}
          <span onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Accedi qui' : 'Registrati ora'}
          </span>
        </p>
      </div>
    </div>
  );
}
