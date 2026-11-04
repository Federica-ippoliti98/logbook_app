// ============================================================================
// TAPPA 1: Importazione delle Dipendenze (import)
// OBIETTIVO: Importare le funzioni core di React per gestire lo stato reattivo, gli effetti temporali e la distribuzione dei dati.
// TEORIA DA STUDIARE PRIMA:
// - Named Imports delle API di React: Sintassi per estrarre selettivamente gli strumenti nativi necessari alla gestione del ciclo di vita.
// PASSAGGI LOGICI:
// 1. In cima al file, importare createContext, useContext, useState e useEffect dal pacchetto principale 'react'.
// ============================================================================
import { createContext, useContext, useState, useEffect } from 'react';

// ============================================================================
// TAPPA 2: Creazione del Contesto Globale (RestTimerContext)
// OBIETTIVO: Inizializzare lo spazio di memoria globale e isolato in cui risiederanno i dati e i metodi del timer di riposo.
// TEORIA DA STUDIARE PRIMA:
// - React Context API per utility temporali: Condividere un unico timer attivo in background tra diverse schermate senza perdere il conteggio.
// PASSAGGI LOGICI:
// 1. Invocare la funzione createContext passando come argomento iniziale un oggetto vuoto.
// 2. Registrare il risultato all'interno di una costante locale non esportata nominata RestTimerContext.
// ============================================================================
const RestTimerContext = createContext({});

// ============================================================================
// TAPPA 3: Dichiarazione del Provider e Inizializzazione degli Stati del Timer
// OBIETTIVO: Configurare il componente contenitore e dichiarare le variabili reattive per i secondi rimanenti e lo stato di attivazione.
// TEORIA DA STUDIARE PRIMA:
// - Primitivi di Stato: Gestione di numeri interi per i conteggi matematici e booleani per tracciare stati binari (acceso/spento).
// PASSAGGI LOGICI:
// 1. Dichiarare ed esportare la funzione componente RestTimerProvider che accetta la prop children.
// 2. Creare la variabile di stato secondsLeft inizializzata a 0 (nessun timer attivo).
// 3. Creare la variabile di stato isActive inizializzata sul valore booleano false.
// ============================================================================
export function RestTimerProvider({ children }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // ============================================================================
  // TAPPA 4: Ciclo di Vita del Timer e Gestione dei Sottoprocessi (`setInterval`)
  // OBIETTIVO: Configurare un effetto collaterale capace di avviare un loop temporale asincrono che sottragga un secondo ogni 1000ms, gestendo la pulizia automatica al termine.
  // TEORIA DA STUDIARE PRIMA:
  // - Funzione Funzionale setInterval: Funzione nativa dei browser per eseguire ciclicamente un blocco di codice a intervalli regolari.
  // - Funzione di Cleanup di un Effetto: Riconoscere l'importanza di chiamare clearInterval per distruggere il vecchio timer ad ogni ciclo o al cambio di stato.
  // - Sincronizzazione per Dipendenze: Agganciare l'effetto alle variabili reattive [isActive, secondsLeft] per ricalcolare la logica ad ogni secondo speso.
  // PASSAGGI LOGICI:
  // 1. Dichiarare un hook useEffect includendo [isActive, secondsLeft] nell'array delle dipendenze finale.
  // 2. All'interno, inizializzare una variabile di riferimento locale per l'intervallo impostandola a null.
  // 3. Aprire un controllo condizionale: se il timer è attivo e i secondi sono maggiori di zero, associare a interval un ciclo setInterval che esegue il decremento funzionale `(time) => time - 1` ogni 1000ms.
  // 4. Aggiungere un ramo else/if: se i secondi raggiungono lo zero, spegnere lo stato isActive e cancellare il sotto-processo attivo tramite clearInterval.
  // 5. Restituire l'istruzione di cleanup `return () => clearInterval(interval);` per ripulire la memoria ad ogni re-render.
  // • Errori da evitare: Dimenticare la funzione di cleanup, provocando la generazione incontrollata di decine di timer paralleli (memory leak) che consumano risorse del browser e alterano il conteggio.
  // ============================================================================
  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((time) => time - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  // ============================================================================
  // TAPPA 5: Implementazione delle Funzioni di Controllo (`startTimer` e `stopTimer`)
  // OBIETTIVO: Esporre i metodi imperativi per avviare il countdown con una durata dinamica o azzerarlo istantaneamente.
  // PASSAGGI LOGICI:
  // 1. Scrivere la funzione startTimer che accetta il parametro numerico duration; al suo interno aggiornare secondsLeft con la durata e forzare isActive su true.
  // 2. Scrivere la funzione stopTimer senza parametri; al suo interno impostare secondsLeft a 0 e isActive a false.
  // ============================================================================
  const startTimer = (duration) => {
    setSecondsLeft(duration);
    setIsActive(true);
  };

  const stopTimer = () => {
    setSecondsLeft(0);
    setIsActive(false);
  };

  // ============================================================================
  // TAPPA 6: Formattazione Visiva delle Stringhe Temporali (MM:SS)
  // OBIETTIVO: Convertire il totale dei secondi grezzi in una stringa testuale formattata per essere letta comodamente dall'utente finale.
  // TEORIA DA STUDIARE PRIMA:
  // - Divisione Intera e Operatore Resto (Moduli): Uso di Math.floor() per ricavare i minuti e dell'operatore `% 60` per isolare i secondi rimanenti.
  // - String Padding / Operatore Ternario di Formattazione: Inserire uno zero come carattere iniziale se i secondi scendono sotto la doppia cifra (es. 5 diventa '05').
  // PASSAGGI LOGICI:
  // 1. Definire la funzione formatTime.
  // 2. Calcolare i minuti dividendo per 60 ed escludendo i decimali con Math.floor.
  // 3. Calcolare i secondi estraendo il resto tramite il modulo 60.
  // 4. Ritorna una stringa interpolata (Template Literal) che concatena minuti e secondi, iniettando lo zero di riempimento se i secondi sono minori di 10.
  // ============================================================================
  // Formatta i secondi in MM:SS
  const formatTime = () => {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ============================================================================
  // TAPPA 7: Rendering del Provider del Contesto e Configurazione Proprietà
  // OBIETTIVO: Confezionare gli stati correnti e i metodi di controllo all'interno della proprietà di erogazione value per tutti i componenti figli avvolti.
  // PASSAGGI LOGICI:
  // 1. Configurare il blocco di ritorno return ( ... );.
  // 2. Aprire il tag del componente <RestTimerContext.Provider> iniettando nell'attributo value l'oggetto completo contenente: secondsLeft, isActive, startTimer, stopTimer, formatTime.
  // 3. Posizionare l'elemento {children} all'interno dei tag per abilitare il pass-through dei componenti dell'applicazione.
  // ============================================================================
  return (
    <RestTimerContext.Provider value={{ secondsLeft, isActive, startTimer, stopTimer, formatTime }}>
      {children}
    </RestTimerContext.Provider>
  );
}

// ============================================================================
// TAPPA 8: Creazione ed Esportazione del Custom Hook (`useRestTimer`)
// OBIETTIVO: Creare un punto di aggancio riutilizzabile e pulito per consumare il timer in qualsiasi bottone o interfaccia di esercizio.
// TEORIA DA STUDIARE PRIMA:
// - Astrazione dei consumatori tramite Custom Hook: Sfruttare useContext per nascondere i dettagli di implementazione del contesto radice.
// PASSAGGI LOGICI:
// 1. Al di fuori del provider, dichiarare ed esportare la costante useRestTimer come funzione freccia a riga singola che ritorna direttamente useContext(RestTimerContext).
// • Errori da evitare: Dimenticare la parola chiave "export", rendendo l'hook invisibile e inutilizzabile all'esterno del modulo.
// ============================================================================
export const useRestTimer = () => useContext(RestTimerContext);
