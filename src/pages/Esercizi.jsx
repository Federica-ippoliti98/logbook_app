// ============================================================================
// TAPPA 1: Importazione delle Dipendenze Core, Client e Stili Associati
// OBIETTIVO: Caricare gli hook fondamentali di gestione dello stato e degli effetti, uniti all'SDK di Supabase e agli stili di layout.
// TEORIA DA STUDIARE BEFORE:
// - Strutturazione dei Moduli Applicativi: Importare moduli core e librerie locali per abilitare la reattività e le query asincrone.
// PASSAGGI LOGICI:
// 1. In cima al file, importare useState ed useEffect dal modulo 'react'.
// 2. Importare il client asincrono supabase dal percorso relativo delle librerie del progetto.
// 3. Integrare il foglio di stile locale './Esercizi.css'.
// ============================================================================
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./Esercizi.css"; // File di stile abbinato

// ============================================================================
// TAPPA 2: Dichiarazione del Componente e Configurazione degli Stati del Form
// OBIETTIVO: Definire la funzione principale Esercizi e inizializzare le variabili reattive per la lista, i caricamenti, i dati di input del form e i messaggi di feedback.
// TEORIA DA STUDIARE PRIMA:
// - Stati Primitivi e Collezioni: Scegliere valori iniziali idonei (array vuoti per dati tabellari, stringhe vuote per input testuali o messaggi di notifica).
// PASSAGGI LOGICI:
// 1. Esportare la funzione componente Esercizi.
// 2. Creare gli stati di controllo base: esercizi (array vuoto iniziale) e loading (attivo di default).
// 3. Configurare i controlli reattivi per il form: nuovoNome, gruppoSelezionato (con valore di default 'Petto'), errore e successo.
// 4. Inizializzare gli stati per la barra di ricerca (`ricerca`) e l'editing in linea (`idEsercizioInModifica`, `nomeModificato`).
// ============================================================================
export function Esercizi() {
  const [esercizi, setEsercizi] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stati per il form di inserimento controllato
  const [nuovoNome, setNuovoNome] = useState("");
  const [gruppoSelezionato, setGruppoSelezionato] = useState("Petto");
  const [errore, setErrore] = useState("");
  const [successo, setSuccesso] = useState("");

  // NUOVI STATI: Ricerca e Modifica in linea
  const [ricerca, setRicerca] = useState("");
  const [idEsercizioInModifica, setIdEsercizioInModifica] = useState(null);
  const [nomeModificato, setNomeModificato] = useState("");

  // Gruppi muscolari ufficiali (Pagina 9 della guida)
  const gruppiMuscolari = [
    "Petto",
    "Dorso",
    "Spalle",
    "Bicipiti",
    "Tricipiti",
    "Quadricipiti",
    "Femorali",
    "Glutei",
    "Polpacci",
    "Addome",
    "Altro",
  ];

  // ============================================================================
  // TAPPA 3: Sincronizzazione ed Esecuzione dell'Effetto al Montaggio
  // OBIETTIVO: Avviare il caricamento della libreria degli esercizi non appena la pagina viene visualizzata sullo schermo.
  // PASSAGGI LOGICI:
  // 1. Configurare un hook useEffect associato a un array di controllo finale vuoto `([])`.
  // 2. All'interno della callback dell'effetto, invocare direttamente la funzione caricaEsercizi().
  // ============================================================================
  useEffect(() => {
    caricaEsercizi();
  }, []);

  // ============================================================================
  // TAPPA 4: Recupero degli Esercizi Globali e Personali Ordinati A-Z
  // OBIETTIVO: Scaricare dal database la lista completa degli esercizi ordinati alfabeticamente per nome.
  // TEORIA DA STUDIARE PRIMA:
  // - Ordinamento di Righe (`.order`): Istruzione SQL per forzare il database a restituire i record secondo un criterio alfabetico (ascending: true).
  // - Politiche di Sicurezza RLS: Sfruttare le regole globali del database per estrarre con un'unica query sia i dati pubblici (user_id nullo) sia quelli personalizzati dell'utente corrente.
  // PASSAGGI LOGICI:
  // 1. Definire la funzione asincrona caricaEsercizi, attivare lo stato loading su true e azzerare i messaggi di errore precedenti.
  // 2. Eseguire una query sulla tabella 'exercises' selezionando tutti i campi (`*`) e applicando l'ordinamento alfabetico sul campo 'name'.
  // 3. Gestire l'eventuale errore di rete lanciando un'eccezione, altrimenti assegnare i dati estratti (o un array vuoto di fallback) allo stato esercizi.
  // ============================================================================
  const caricaEsercizi = async () => {
    setLoading(true);
    setErrore("");
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setEsercizi(data || []);
    } catch (err) {
      setErrore("Impossibile caricare la libreria esercizi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // TAPPA 5: Validazione Input e Creazione con Gestione dei Duplicati
  // OBIETTIVO: Validare il form, connettersi a Supabase per inserire la riga e intercettare gli errori di vincolo UNIQUE nel database.
  // TEORIA DA STUDIARE PRIMA:
  // - Codici Errore Postgres (`23505`): Riconoscere l'errore di violazione del vincolo di unicità sollevato dal database se lo stesso utente prova a inserire un duplicato.
  // PASSAGGI LOGICI:
  // 1. Bloccare il refresh, sanificare il nome con `.trim()` e applicare i blocchi preventivi if sulla lunghezza della stringa.
  // 2. Prelevare l'oggetto utente ed eseguire l'operazione di `.insert()` passando user_id, name e muscle_group.
  // 3. Nel blocco catch, isolare l'errore con codice '23505' per mostrare un messaggio personalizzato, resettare il campo di input in caso di successo e invocare caricaEsercizi().
  // ============================================================================
  const handleCreaEsercizio = async (e) => {
    e.preventDefault();
    setErrore("");
    setSuccesso("");

    const nomePulito = nuovoNome.trim();

    if (!nomePulito) {
      setErrore("Il nome dell'esercizio è obbligatorio.");
      return;
    }
    if (nomePulito.length > 60) {
      setErrore("Il nome non può superare i 60 caratteri.");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("exercises").insert([
        {
          user_id: user.id,
          name: nomePulito,
          muscle_group: gruppoSelezionato,
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          throw new Error(
            "Esiste già un esercizio con questo nome nella tua libreria.",
          );
        }
        throw error;
      }

      setNuovoNome("");
      setSuccesso("Esercizio aggiunto con successo!");
      caricaEsercizi();
    } catch (err) {
      setErrore(err.message);
    }
  };

  // ============================================================================
  // TAPPA 6A: Aggiornamento Parziale e Salvataggio delle Modifiche (`.update`)
  // OBIETTIVO: Inviare una query di update a Supabase per rinominare un esercizio utente dopo aver validato i nuovi criteri testuali.
  // TEORIA DA STUDIARE PRIMA:
  // - Aggiornamento Condizionale SQL: Utilizzare `.update()` in combinazione con `.eq()` per modificare esclusivamente la riga target identificata dall'ID.
  // PASSAGGI LOGICI:
  // 1. Sanificare il testo con `.trim()` e controllare che il nome non sia vuoto o superiore a 60 caratteri.
  // 2. Eseguire l'istruzione `.update({ name: nomeModificatoPulito })` filtrando sul record specifico.
  // 3. Resettare lo stato `idEsercizioInModifica` a null per chiudere l'interfaccia di editing in linea e aggiornare la lista a schermo.
  // ============================================================================
  const handleSalvaModifica = async (id) => {
    setErrore("");
    setSuccesso("");
    const nomeModificatoPulito = nomeModificato.trim();

    if (!nomeModificatoPulito) {
      setErrore("Il nome modificato non può essere vuoto.");
      return;
    }
    if (nomeModificatoPulito.length > 60) {
      setErrore("Il nome non può superare i 60 caratteri.");
      return;
    }

    try {
      const { error } = await supabase
        .from("exercises")
        .update({ name: nomeModificatoPulito })
        .eq("id", id);

      if (error) {
        if (error.code === "23505") {
          throw new Error("Esiste già un esercizio con questo nome.");
        }
        throw error;
      }

      setSuccesso("Esercizio aggiornato con successo!");
      setIdEsercizioInModifica(null);
      caricaEsercizi();
    } catch (err) {
      setErrore(err.message);
    }
  };

  // ============================================================================
  // TAPPA 6B: Rimozione Protetta ed Intercettazione dei Vincoli Relazionali (FK)
  // OBIETTIVO: Cancellare un esercizio personalizzato prevenendo errori fatali se l'elemento è già associato a schede o allenamenti storici.
  // TEORIA DA STUDIARE PRIMA:
  // - Integrità Referenziale (`Codice 23503`): Errore SQL RESTRICT causato dal tentativo di eliminare una riga padre i cui ID sono presenti in tabelle figlie (chiavi esterne).
  // PASSAGGI LOGICI:
  // 1. Mostrare un pop-up nativo di conferma `window.confirm()` prima di avviare la cancellazione.
  // 2. Eseguire l'istruzione `.delete()` filtrando con il metodo `.eq('id', id)` l'esercizio selezionato.
  // 3. Intercettare l'errore '23503' nel catch per informare l'utente del blocco relazionale ed evitare crash dell'applicazione.
  // ============================================================================
  const handleEliminaEsercizio = async (id) => {
    if (
      !window.confirm("Vuoi davvero eliminare questo esercizio personalizzato?")
    )
      return;
    setErrore("");
    setSuccesso("");

    try {
      const { error } = await supabase.from("exercises").delete().eq("id", id);

      if (error) {
        if (error.code === "23503") {
          throw new Error(
            "Impossibile eliminare: questo esercizio è già stato utilizzato in una scheda o in un allenamento.",
          );
        }
        throw error;
      }

      setSuccesso("Esercizio rimosso dalla libreria.");
      caricaEsercizi();
    } catch (err) {
      setErrore(err.message);
    }
  };

  // ============================================================================
  // TAPPA 7: Filtraggio in Real-Time e Raggruppamento ad Albero Dinamico
  // OBIETTIVO: Filtrare la collezione degli esercizi in base alla stringa digitata dall'utente prima di generare l'accumulatore per gruppi muscolari.
  // TEORIA DA STUDIARE PRIMA:
  // - Ricerca Case-Insensitive Client-Side: Convertire sia il termine cercato sia la proprietà dell'oggetto in `.toLowerCase()` per garantire corrispondenze indipendenti da maiuscole/minuscole.
  // PASSAGGI LOGICI:
  // 1. Filtrare l'array globale `esercizi` verificando che `e.name` includa la stringa memorizzata nello stato `ricerca`.
  // 2. Eseguire il ciclo `.reduce()` sull'array dei gruppi muscolari applicando il filtro partizionato esclusivamente sulla lista già scremata dalla ricerca.
  // ============================================================================

  const eserciziFiltrati = esercizi.filter((e) =>
  // Cerca la parola sia nel NOME dell'esercizio O (||) nel GRUPPO MUSCOLARE
  e.name.toLowerCase().includes(ricerca.toLowerCase()) || 
  e.muscle_group.toLowerCase().includes(ricerca.toLowerCase())
);

const eserciziRaggruppati = gruppiMuscolari.reduce((acc, gruppo) => {
  const listaFiltrata = eserciziFiltrati.filter((e) => e.muscle_group === gruppo);
  if (listaFiltrata.length > 0) {
    acc[gruppo] = listaFiltrata;
  }
  return acc;
}, {});

  // ============================================================================
  // TAPPA 8: Rendering dell'Interfaccia Form e Integrazione dell'Input di Ricerca
  // OBIETTIVO: Costruire il layout JSX, gestire la visualizzazione degli alert e integrare la nuova barra di ricerca dinamica.
  // TEORIA DA STUDIARE PRIMA:
  // - Inputs Controllati e Rendering Condizionale: Associare la proprietà `value` agli stati di React e intercettare i cambiamenti con i gestori `onChange`.
  // PASSAGGI LOGICI:
  // 1. Configurare il tag `<form>` assegnando la funzione `handleCreaEsercizio` all'evento `onSubmit`.
  // 2. Iniettare i blocchi condizionali short-circuit (`&&`) per visualizzare gli alert di errore o successo solo se le stringhe contengono testo.
  // 3. Creare un nuovo contenitore di input prima della lista dedicato alla search bar agganciata allo stato `ricerca`.
  // ============================================================================
  return (
    <div className="esercizi-page-container">
      <h2>Libreria Esercizi</h2>
      <p className="subtitle">
        Visualizza l'elenco suddiviso o inserisci i tuoi movimenti
        personalizzati.
      </p>

      {/* Form controllato per nuovo esercizio */}
      <form onSubmit={handleCreaEsercizio} className="esercizio-form card">
        <h3>Nuovo Esercizio</h3>

        {errore && <div className="ex-alert error">{errore}</div>}
        {successo && <div className="ex-alert success">{successo}</div>}

        <div className="input-group">
          <label htmlFor="exercise-name">
            Nome esercizio (max 60 caratteri)
          </label>
          <input
            id="exercise-name"
            type="text"
            placeholder="es. Panca inclinata manubri"
            maxLength={60}
            value={nuovoNome}
            onChange={(e) => setNuovoNome(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="muscle-group">Gruppo Muscolare</label>
          <select
            id="muscle-group"
            value={gruppoSelezionato}
            onChange={(e) => setGruppoSelezionato(e.target.value)}
          >
            {gruppiMuscolari.map((g, idx) => (
              <option key={idx} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-accent-action">
          ➕ Aggiungi alla Libreria
        </button>
      </form>

      {/* Barra di ricerca per il filtraggio in tempo reale */}
      <div className="search-bar-container card">
        <label htmlFor="search-exercise">Ricerca esercizio </label>
        <input
          id="search-exercise"
          type="text"
          placeholder="🔍 Digita per filtrare gli esercizi..."
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
        />
      </div>

      {/* ============================================================================
          TAPPA 9: Rendering Iterativo ad Albero con Editing in Linea Condizionale
          OBIETTIVO: Sviluppare graficamente i gruppi muscolari e implementare lo switch condizionale tra la visualizzazione normale e il form di modifica in linea per gli esercizi utente.
          TEORIA DA STUDIARE PRIMA:
          - Toggle di Interfaccia: Utilizzare un id di controllo (`idEsercizioInModifica === es.id`) per decidere a runtime se renderizzare il testo fisso o un campo di input modificabile.
          PASSAGGI LOGICI:
          1. Eseguire un controllo ternario sullo stato `loading` per gestire l'attesa di caricamento.
          2. Controllare se l'oggetto `eserciziRaggruppati` è vuoto per mostrare un messaggio di "Nessun risultato trovato".
          3. All'interno del ciclo degli esercizi, inserire un controllo if/ternario: se l'esercizio è in stato di modifica, mostrare un input di testo con i pulsanti "Salva" (spunta) e "Annulla" (X).
          4. Se l'esercizio non è in modifica, mostrare il nome e, se `user_id` è presente, abilitare i pulsanti di modifica (matita) ed eliminazione (cestino).
          ============================================================================ */}
      {loading ? (
        <p className="status-text">Caricamento in corso...</p>
      ) : Object.keys(eserciziRaggruppati).length === 0 ? (
        <p className="status-text no-results">
          Nessun esercizio corrisponde ai criteri di ricerca.
        </p>
      ) : (
        <div className="gruppi-esercizi-list">
          {Object.keys(eserciziRaggruppati).map((gruppo, idx) => (
            <div key={idx} className="gruppo-muscolare-section card">
              <h4>{gruppo}</h4>
              <ul className="esercizio-items-list">
                {eserciziRaggruppati[gruppo].map((es) => (
                  <li key={es.id} className="esercizio-item-row">
                    {idEsercizioInModifica === es.id ? (
                      <div className="edit-inline-container">
                        <input
                          type="text"
                          className="edit-inline-input"
                          value={nomeModificato}
                          maxLength={60}
                          onChange={(e) => setNomeModificato(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-save-inline"
                          onClick={() => handleSalvaModifica(es.id)}
                          title="Salva modifiche"
                        >
                          ✅
                        </button>
                        <button
                          type="button"
                          className="btn-cancel-inline"
                          onClick={() => setIdEsercizioInModifica(null)}
                          title="Annulla"
                        >
                          ❌
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="ex-name">{es.name}</span>
                        <div className="actions-wrapper">
                          {es.user_id ? (
                            <>
                              <button
                                type="button"
                                className="btn-edit-ex"
                                onClick={() => {
                                  setIdEsercizioInModifica(es.id);
                                  setNomeModificato(es.name);
                                }}
                                aria-label={`Modifica ${es.name}`}
                                title="Rinomina esercizio"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="btn-delete-ex"
                                onClick={() => handleEliminaEsercizio(es.id)}
                                aria-label={`Elimina ${es.name}`}
                                title="Elimina esercizio"
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <span className="system-badge">Predefinito</span>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
