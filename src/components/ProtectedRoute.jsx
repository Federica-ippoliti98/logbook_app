// ============================================================================
// TAPPA 1: Importazione delle Dipendenze (import)
// OBIETTIVO: Importare i componenti di navigazione di terze parti e l'hook di autenticazione globale del progetto.
// TEORIA DA STUDIARE PRIMA:
// - Routing Dichiarativo: Comprendere come React Router gestisca gli spostamenti tramite componenti visivi anziché funzioni.
// - Import Relativi di Moduli Custom: Sintassi per importare hook creati all'interno della propria architettura.
// PASSAGGI LOGICI:
// 1. In cima al file, importare il componente Navigate dal pacchetto 'react-router-dom'.
// 2. Importare l'hook personalizzato useAuth puntando al percorso relativo del file di contesto auth creato in precedenza.
// ============================================================================
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ============================================================================
// TAPPA 2: Dichiarazione del Componente Guardiano (ProtectedRoute)
// OBIETTIVO: Creare un componente contenitore (Wrapper) per intercettare l'accesso alle rotte private dell'applicazione.
// TEORIA DA STUDIARE PRIMA:
// - Componenti Wrapper in React: Sviluppare componenti che incapsulano altri elementi per estenderne le funzionalità o controllarne l'accesso.
// - Proprietà Speciale children: Meccanismo nativo di React per ricevere e fare il pass-through dei nodi JSX annidati.
// PASSAGGI LOGICI:
// 1. Dichiarare ed esportare la funzione componente ProtectedRoute.
// 2. Configurare i parametri della funzione per accettare l'oggetto distrutturato { children }.
// ============================================================================
export function ProtectedRoute({ children }) {
  
  // ============================================================================
  // TAPPA 3: Consumo dello Stato di Autenticazione Globale
  // OBIETTIVO: Estrarre i dati dell'utente corrente dal contesto per verificare se ha i permessi di visualizzazione.
  // TEORIA DA STUDIARE PRIMA:
  // - Consumo dei Custom Hook: Estrarre specifiche proprietà (es. l'oggetto user) in modo distrutturato da un hook globale.
  // PASSAGGI LOGICI:
  // 1. Come prima riga all'interno del componente, invocare l'hook useAuth().
  // 2. Estrarre in modo distrutturato solo la proprietà "user" dall'oggetto restituito.
  // ============================================================================
  const { user } = useAuth();

  // ============================================================================
  // TAPPA 4: Controllo di Sicurezza e Reindirizzamento Condizionale
  // OBIETTIVO: Intercettare gli utenti non autenticati e respingerli verso la pagina di login, ripulendo la cronologia di navigazione.
  // TEORIA DA STUDIARE PRIMA:
  // - Operatore di Negazione Logica (!): Verificare la falsità di una variabile (es. se user è null o undefined).
  // - Componente <Navigate />: Strumento di React Router per forzare un cambio di rotta al momento del rendering.
  // - Proprietà replace: Attributo fondamentale per rimpiazzare la rotta corrente nella cronologia del browser, impedendo all'utente di tornare indietro con il tasto "Back".
  // PASSAGGI LOGICI:
  // 1. Aprire un blocco condizionale if per verificare l'assenza della costante user (!user).
  // 2. All'interno del blocco if, inserire un'istruzione di return per interrompere l'esecuzione.
  // 3. Restituire il tag del componente <Navigate /> configurato con l'attributo "to" su "/login" e l'attributo booleano "replace".
  // • Errori da evitare: Omettere la prop "replace", permettendo all'utente di entrare in un loop infinito premendo il tasto "indietro" del browser.
  // ============================================================================
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ============================================================================
  // TAPPA 5: Rendering Sicuro dei Componenti Protetti (children)
  // OBIETTIVO: Consentire la visualizzazione della pagina privata se e solo se i controlli di autenticazione precedenti hanno dato esito positivo.
  // TEORIA DA STUDIARE PRIMA:
  // - Rendering di ripiego (Fall-through): Restituire direttamente nodi JSX ricevuti come argomento senza alterarne la struttura.
  // PASSAGGI LOGICI:
  // 1. Al di fuori e al di sotto del blocco condizionale if, inserire l'istruzione finale di return.
  // 2. Restituire direttamente la variabile children.
  // • Errori da evitare: Avvolgere "children" in tag inutili (es. <div> o React Fragment) se non strettamente necessario per il layout, appesantendo l'albero del DOM.
  // ============================================================================
  return children;
}
