// ============================================================================
// TAPPA 1: Importazione delle Dipendenze (import)
// OBIETTIVO: Importare le funzioni native di React per la gestione di stati, effetti e contesti.
// TEORIA DA STUDIARE PRIMA:
// - Named Imports di React: Sintassi per prelevare selettivamente solo le funzioni necessarie dall'SDK core di React.
// PASSAGGI LOGICI:
// 1. In cima al file, importare createContext, useContext, useEffect e useState dal modulo 'react'.
// ============================================================================
import { createContext, useContext, useEffect, useState } from 'react';

// ============================================================================
// TAPPA 2: Creazione del Contesto Globale (ThemeContext)
// OBIETTIVO: Generare lo spazio di memoria isolato dedicato alla distribuzione globale dello stato del tema.
// TEORIA DA STUDIARE PRIMA:
// - React Context API per configurazioni: Uso dei contesti per memorizzare preferenze di stile accessibili ovunque.
// PASSAGGI LOGICI:
// 1. Invocare la funzione createContext passando un oggetto vuoto come valore predefinito.
// 2. Assegnare l'istanza a una costante locale non esportata denominata ThemeContext.
// ============================================================================
const ThemeContext = createContext({});

// ============================================================================
// TAPPA 3: Dichiarazione del Provider e Stato Iniziale Pigro (Lazy Initialization)
// OBIETTIVO: Configurare il componente contenitore e inizializzare il tema leggendo le preferenze precedenti del browser.
// TEORIA DA STUDIARE PRIMA:
// - Lazy State Initialization: Passare una funzione a useState per eseguire logiche di lettura pesanti (LocalStorage) solo al primo rendering.
// - Web Storage API (localStorage): Meccanismo del browser per salvare dati in formato chiave-valore in modo persistente.
// - Operatore Logico OR (||): Tecnica di fallback per impostare un valore di default se la lettura restituisce null.
// PASSAGGI LOGICI:
// 1. Dichiarare ed esportare la funzione componente ThemeProvider che accetta la prop children.
// 2. Creare lo stato "theme" passando una funzione di callback a useState.
// 3. Dentro la callback, richiedere la chiave 'theme' a localStorage; se non esiste, restituire la stringa di default 'dark'.
// ============================================================================
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // ============================================================================
  // TAPPA 4: Sincronizzazione dell'Effetto Collaterale (useEffect)
  // OBIETTIVO: Allineare il DOM dell'HTML e la memoria locale del browser ogni volta che l'utente cambia tema.
  // TEORIA DA STUDIARE PRIMA:
  // - Manipolazione del DOM in React: Uso di document.documentElement per modificare l'elemento radice (<html>) dall'interno di un effetto.
  // - Array di dipendenze mirato: Configurare useEffect per riattivarsi esclusivamente quando una specifica variabile reattiva muta.
  // PASSAGGI LOGICI:
  // 1. Scrivere un hook useEffect sotto la dichiarazione dello stato.
  // 2. Nella callback dell'effetto, usare setAttribute per iniettare l'attributo 'data-theme' sul tag document.documentElement.
  // 3. Salvare il valore corrente di theme all'interno di localStorage tramite setItem.
  // 4. Inserire la variabile [theme] nell'array delle dipendenze alla fine dell'hook.
  // • Errori da evitare: Omettere l'array di dipendenze o lasciarlo vuoto, causando il disallineamento visivo dell'interfaccia o loop infiniti di rendering.
  // ============================================================================
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // ============================================================================
  // TAPPA 5: Implementazione della Funzione di Scambio (toggleTheme)
  // OBIETTIVO: Creare la logica reattiva per invertire lo stato del tema attuale.
  // TEORIA DA STUDIARE PRIMA:
  // - Aggiornamento dello stato basato sul valore precedente: Uso della sintassi a funzione funzionale di useState (prev) => ... per evitare letture di stato obsolete.
  // - Operatore Ternario (? :): Sintassi contratta per verificare condizioni logiche rapide su una sola riga.
  // PASSAGGI LOGICI:
  // 1. Definire una funzione freccia chiamata toggleTheme.
  // 2. Invocare il setter setTheme passando la funzione che analizza lo stato precedente.
  // 3. Se lo stato precedente era 'dark' restituisce 'light', altrimenti restituisce 'dark'.
  // ============================================================================
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // ============================================================================
  // TAPPA 6: Blocco di Ritorno del Provider del Contesto
  // OBIETTIVO: Iniettare le proprietà del tema e la funzione di switch nell'albero dei componenti figli.
  // TEORIA DA STUDIARE PRIMA:
  // - Sintassi di iniezione delle proprietà: Esporre un oggetto combinato all'interno della prop value del tag Provider.
  // PASSAGGI LOGICI:
  // 1. Inserire l'istruzione di return.
  // 2. Aprire il tag del componente <ThemeContext.Provider> configurando la prop value con le chiavi { theme, toggleTheme }.
  // 3. Posizionare la variabile {children} al centro del tag del Provider per abilitare il passaggio dei nodi.
  // • Errori da evitare: Passare per sbaglio proprietà separate invece di avvolgerle in un unico oggetto strutturato, rompendo il consumo nei sotto-componenti.
  // ============================================================================
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// TAPPA 7: Creazione ed Esportazione del Custom Hook (`useTheme`)
// OBIETTIVO: Creare un punto di accesso rapido, pulito e riutilizzabile per consumare il tema nelle pagine dell'app.
// TEORIA DA STUDIARE PRIMA:
// - Consumo dei contesti tramite hook personalizzati: Astrarre useContext per pulire la sintassi dei componenti visuali.
// PASSAGGI LOGICI:
// 1. Fuori dal componente ThemeProvider, dichiarare ed esportare una costante nominata useTheme.
// 2. Configurare la costante come funzione freccia che esegue e ritorna useContext(ThemeContext).
// • Errori da evitare: Dichiarare l'hook custom all'interno del blocco del provider, violando le regole fondamentali degli hook di React.
// ============================================================================
export const useTheme = () => useContext(ThemeContext);
