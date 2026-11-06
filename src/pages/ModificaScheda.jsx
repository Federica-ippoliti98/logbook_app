// ============================================================================
// TAPPA 1: Importazione delle Dipendenze Core, Router, Client e Stili
// OBIETTIVO: Caricare gli hook fondamentali, i selettori di parametri di rotta di React Router, l'SDK di Supabase e gli stili di layout.
// TEORIA DA STUDIARE PRIMA:
// - Parametri di Rotta Dinamici (`useParams`): Estrarre variabili dall'URL (es. `/schede/:id`) per identificare la risorsa su cui effettuare le query.
// PASSAGGI LOGICI:
// 1. In cima al file, importare useState ed useEffect dal modulo 'react'.
// 2. Estrarre useParams e useNavigate dal modulo 'react-router-dom'.
// 3. Importare il client asincrono supabase dal percorso delle librerie del progetto.
// 4. Integrare il foglio di stile locale './ModificaScheda.css'.
// ============================================================================
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./ModificaScheda.css";

// ============================================================================
// TAPPA 2: Dichiarazione del Componente e Configurazione degli Stati Statistici
// OBIETTIVO: Estrarre l'ID della scheda dall'URL e inizializzare tutte le variabili di stato per i form, la griglia degli esercizi inseriti e la libreria globale.
// TEORIA DA STUDIARE PRIMA:
// - Destrutturazione con Alias: Rinominare una proprietà estratta da un oggetto (es. `const { id: routineId } = useParams()`) per renderla semanticamente chiara all'interno dello scope del codice.
// PASSAGGI LOGICI:
// 1. Esportare la funzione componente ModificaScheda.
// 2. Destrutturare `id` da `useParams()` rinominandolo in `routineId`.
// 3. Inizializzare gli stati per il nome della scheda, la lista degli esercizi inclusi, la libreria totale e l'esercizio correntemente selezionato nel menu a tendina.
// 4. Configurare gli stati di caricamento (`loading`), diagnostica (`errore`) e feedback temporaneo (`successo`).
// ============================================================================
export function ModificaScheda() {
  const { id: routineId } = useParams();
  const navigate = useNavigate();

  const [nomeScheda, setNomeScheda] = useState("");
  const [eserciziInseriti, setEserciziInseriti] = useState([]);
  const [libreriaEsercizi, setLibreriaEsercizi] = useState([]);
  const [esercizioSelezionato, setEsercizioSelezionato] = useState("");
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState("");
  const [successo, setSuccesso] = useState(false);

  // ============================================================================
  // TAPPA 3: Sincronizzazione ed Esecuzione dell'Effetto al Montaggio o Cambio ID
  // OBIETTIVO: Innescare il caricamento asincrono di tutti i dati dal database remoto ogni volta che il componente viene montato o l'ID della routine cambia nell'URL.
  // PASSAGGI LOGICI:
  // 1. Configurare un hook useEffect associato a un array di controllo contenente `[routineId]`.
  // 2. All'interno della callback dell'effetto, invocare direttamente la funzione asincrona `inizializzaDati()`.
  // ============================================================================
  useEffect(() => {
    inizializzaDati();
  }, [routineId]);

  // ============================================================================
  // TAPPA 4: Chiamate Asincrone in Parallelo Sequenziale e Query Relazionali
  // OBIETTIVO: Scaricare dal database le informazioni principali della scheda, le righe della tabella di giunzione con i relativi dettagli, e l'intera lista di esercizi disponibili.
  // TEORIA DA STUDIARE PRIMA:
  // - JOIN Relazionali con Supabase: Sfruttare la sintassi a stringa annidata (es. `exercises (name, muscle_group)`) per estrarre dati da tabelle collegate tramite chiavi esterne (FK).
  // PASSAGGI LOGICI:
  // 1. Impostare loading su true e ripulire lo stato errore.
  // 2. Estrarre il record singolo della routine tramite `.single()` e impostare lo stato `nomeScheda`.
  // 3. Interrogare la tabella di giunzione `routine_exercises` prelevando i parametri di allenamento ordinati per `position`.
  // 4. Scaricare l'intera libreria esercizi in ordine alfabetico e impostare il valore di default del select sull'ID del primo elemento disponibile.
  // ============================================================================
  const inizializzaDati = async () => {
    setLoading(true);
    setErrore("");
    try {
      // 1. Recupera i dati principali della scheda
      const { data: routine, error: errRoutine } = await supabase
        .from("routines")
        .select("name")
        .eq("id", routineId)
        .single();

      if (errRoutine) throw errRoutine;
      setNomeScheda(routine.name);

      // 2. Recupera gli esercizi correnti inseriti in questa scheda
      const { data: routineEx, error: errRoutineEx } = await supabase
        .from("routine_exercises")
        .select(
          `
          id,
          exercise_id,
          position,
          target_sets,
          rep_min,
          rep_max,
          rest_seconds,
          exercises (name, muscle_group)
        `,
        )
        .eq("routine_id", routineId)
        .order("position", { ascending: true });

      if (errRoutineEx) throw errRoutineEx;
      setEserciziInseriti(routineEx || []);

      // 3. Recupera l'intera libreria esercizi per il menu a tendina
      const { data: libEx, error: errLib } = await supabase
        .from("exercises")
        .select("id, name, muscle_group")
        .order("name", { ascending: true });

      if (errLib) throw errLib;
      setLibreriaEsercizi(libEx || []);

      // FIX ERRORE: Corretto il nome del setter che presentava un typo (era setEsercisioneSelezionato)
      if (libEx && libEx.length > 0) setEsercizioSelezionato(libEx[0].id);
    } catch (err) {
      setErrore("Errore nel caricamento della scheda: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // TAPPA 5: Aggiornamento Parziale d'Integrità e Timer di Feedback Visivo
  // OBIETTIVO: Permettere all'utente di rinominare la scheda d'allenamento aggiornando solo la colonna specifica sul database, mostrando una notifica temporanea di successo.
  // TEORIA DA STUDIARE PRIMA:
  // - Funzioni di Temporizzazione (`setTimeout`): Eseguire un blocco di codice differito nel tempo per ripristinare uno stato booleano (es. far sparire un badge di conferma dopo 2 secondi).
  // PASSAGGI LOGICI:
  // 1. Controllare che il testo non sia vuoto dopo aver applicato `.trim()`.
  // 2. Eseguire l'istruzione `.update()` sulla tabella 'routines' filtrando per l'id corrente.
  // 3. Impostare lo stato successo su true e registrare un `setTimeout` che dopo 2000ms invochi `setSuccesso(false)`.
  // ============================================================================
  const handleAggiornaNomeScheda = async () => {
    if (!nomeScheda.trim()) return;
    try {
      const { error } = await supabase
        .from("routines")
        .update({ name: nomeScheda.trim() })
        .eq("id", routineId);

      if (error) throw error;
      setSuccesso(true);
      setTimeout(() => setSuccesso(false), 2000);
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================================================================
  // TAPPA 6: Prevenzione dei Duplicati Logici e Inserimento con Valori di Default
  // OBIETTIVO: Impedire l'inserimento dello stesso esercizio più volte all'interno della stessa scheda e salvare il nuovo record calcolando la posizione d'ordine progressiva.
  // TEORIA DA STUDIARE PRIMA:
  // - Metodo per Array `.some()`: Funzione JavaScript nativa che controlla se almeno un elemento all'interno di una collezione soddisfa una specifica condizione logica, restituendo un booleano.
  // PASSAGGI LOGICI:
  // 1. Bloccare il refresh del form e controllare la validità della selezione.
  // 2. Usare `.some()` per verificare se l'ID dell'esercizio è già presente nell'array locale `eserciziInseriti`. Se presente, interrompere il flusso con un avviso.
  // 3. Ricavare l'ID utente e calcolare la colonna position progressiva (`eserciziInseriti.length + 1`).
  // 4. Eseguire l'operazione di `.insert()` su `routine_exercises` iniettando i valori di default stabiliti dai vincoli architetturali (2 set, target reps 6-10).
  // 5. Invocare `inizializzaDati()` per forzare il riallineamento dell'interfaccia.
  // ============================================================================
  const handleAggiungiEsercizio = async (e) => {
    e.preventDefault();
    if (!esercizioSelezionato) return;

    // Evita duplicati immediati nella stessa scheda
    if (eserciziInseriti.some((e) => e.exercise_id === esercizioSelezionato)) {
      alert("Questo esercizio è già presente nella scheda corrente.");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const nuovaPosizione = eserciziInseriti.length + 1;

      const { error } = await supabase.from("routine_exercises").insert([
        {
          user_id: user.id,
          routine_id: routineId,
          exercise_id: esercizioSelezionato,
          position: nuovaPosizione,
          target_sets: 2, // Default da linee guida
          rep_min: 6,
          rep_max: 10,
        },
      ]);

      if (error) throw error;
      inizializzaDati();
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================================================================
  // TAPPA 7: Aggiornamento Dinamico in Linea con Computazione a Chiave Dinamica
  // OBIETTIVO: Modificare i singoli parametri numerici (set, rep, recupero) di un esercizio direttamente dai campi di input della lista senza causare il rinfresco dell'intera pagina.
  // TEORIA DA STUDIARE PRIMA:
  // - Proprietà a Chiave Dinamica (Computed Property Names): Utilizzare la sintassi tra parentesi quadre `{ [campo]: valore }` in un oggetto JavaScript per stabilire a runtime il nome della proprietà da aggiornare.
  // PASSAGGI LOGICI:
  // 1. Inviare la query di `.update()` a Supabase passando la chiave dinamica calcolata dall'argomento `campo`.
  // 2. Se l'operazione ha successo sul server, aggiornare lo stato locale usando la notazione funzionale di `setEserciziInseriti` accoppiata a un ciclo `.map()`.
  // 3. Sostituire l'oggetto target sovrascrivendo la proprietà aggiornata tramite operatore spread (`{ ...item, [campo]: valore }`).
  // ============================================================================
  const handleAggiornaParametriEsercizio = async (id, campo, valore) => {
    try {
      const { error } = await supabase
        .from("routine_exercises")
        .update({ [campo]: valore })
        .eq("id", id);

      if (error) throw error;

      // Aggiorna lo stato locale senza ricaricare tutto
      setEserciziInseriti((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, [campo]: valore } : item,
        ),
      );
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================================================================
  // TAPPA 8: Rimozione Fisica e Controllo di Sicurezza Utente
  // OBIETTIVO: Eliminare permanentemente un esercizio associato a una scheda d'allenamento previo consenso esplicito dell'utente.
  // PASSAGGI LOGICI:
  // 1. Sollecitare una conferma d'azione distruttiva tramite il metodo nativo `window.confirm()`.
  // 2. Chiamare il metodo `.delete()` sulla tabella di giunzione `routine_exercises` filtrando per il record ID specifico.
  // 3. Rieseguire il caricamento dei dati per aggiornare gli indici visivi.
  // ============================================================================
  const handleRimuoviEsercizio = async (id) => {
    if (!window.confirm("Rimuovere questo esercizio dal programma corrente?"))
      return;
    try {
      const { error } = await supabase
        .from("routine_exercises")
        .delete()
        .eq("id", id);

      if (error) throw error;
      inizializzaDati();
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================================================================
  // TAPPA 9: Algoritmo di Scambio Posizioni e Riordino Sequenziale
  // OBIETTIVO: Spostare un esercizio verso l'alto o verso il basso all'interno del programma invertendo i valori della colonna 'position' con il record adiacente.
  // TEORIA DA STUDIARE PRIMA:
  // - Inversione di Indici in Array: Identificare l'elemento target sopra (`index - 1`) o sotto (`index + 1`) e riordinare i dati lanciando chiamate consecutive di aggiornamento condizionale.
  // PASSAGGI LOGICI:
  // 1. Inserire i controlli di sicurezza per evitare spostamenti fuori dai limiti dell'array (primo elemento verso l'alto o ultimo verso il basso).
  // 2. Isolare il record `attuale` e il record `adiacente` sfruttando l'indice di posizione.
  // 3. Eseguire due query asincrone di update distinte incrociando i rispettivi indici numerici della colonna 'position'.
  // 4. Aggiornare l'interfaccia richiamando la funzione `inizializzaDati()`.
  // ============================================================================
  const handleSpostaEsercizio = async (index, direzione) => {
    if (direzione === "su" && index === 0) return;
    if (direzione === "giu" && index === eserciziInseriti.length - 1) return;

    const targetIdx = direzione === "su" ? index - 1 : index + 1;
    const attuale = eserciziInseriti[index];
    const adiacente = eserciziInseriti[targetIdx];

    try {
      // Inverte le posizioni sul database
      await supabase
        .from("routine_exercises")
        .update({ position: adiacente.position })
        .eq("id", attuale.id);

      await supabase
        .from("routine_exercises")
        .update({ position: attuale.position })
        .eq("id", adiacente.id);

      inizializzaDati();
    } catch (err) {
      alert(err.message);
    }
  };

  // Early return di sicurezza per intercettare lo stato di caricamento asincrono delle tabelle
  if (loading)
    return <p className="loading-text">Caricamento configurazione scheda...</p>;

  // ============================================================================
  // TAPPA 10: Struttura di Rendering Visivo JSX e Inputs Sincronizzati in Linea
  // OBIETTIVO: Comporre l'albero DOM per l'interfaccia di modifica parametri, integrando i form controllati, i blocchi condizionali e i campi di input numerici dinamici.
  // TEORIA DA STUDIARE PRIMA:
  // - Inputs Controllati Iterativi: Sincronizzare gli attributi `value` dei singoli input nidificati con lo stato di React estratti dai cicli `.map()`, garantendo la ri-validazione dei tipi (es. `parseInt`).
  // - Disabilitazione Condizionale di Bottoni: Sfruttare l'attributo `disabled={index === 0}` per impedire errori logici di posizionamento fuori dai bordi dell'array.
  // PASSAGGI LOGICI:
  // 1. Configurare la barra di navigazione e associare il link di ritorno a `navigate('/schede')`.
  // 2. Integrare il box di modifica titolo inserendo il tag di contenimento `<div className="input-group-title">` corretto per risolvere i crash strutturali.
  // 3. Sviluppare il form di aggiunta ciclando la collezione `libreriaEsercizi` all'interno del selettore a tendina.
  // 4. Mappare l'elenco `eserciziInseriti`: per ciascun elemento, generare le frecce di posizionamento ▲/▼ disabilitate condizionalmente in base all'indice.
  // 5. Configurare i quattro campi numerici (Serie, Rep Min, Rep Max, Recupero) agganciando i gestori `onChange` alla funzione asincrona `handleAggiornaParametriEsercizio()`.
  // ============================================================================
  return (
    <div className="modifica-scheda-container">
      <div className="back-nav-row">
        <button
          type="button"
          className="btn-back"
          onClick={() => navigate("/schede")}
        >
          ‹ Torna alle Schede
        </button>
      </div>

      <div className="scheda-title-section card">
        <div className="input-group-title">
          <label htmlFor="routine-name-edit">Nome del programma</label>
          <div className="inline-edit-row">
            <input
              id="routine-name-edit"
              type="text"
              maxLength={40}
              value={nomeScheda}
              onChange={(e) => setNomeScheda(e.target.value)}
            />
            <button
              type="button"
              className="btn-save-title"
              onClick={handleAggiornaNomeScheda}
            >
              Aggiorna
            </button>
          </div>
        </div>
        {successo && (
          <p className="success-inline">✓ Nome salvato correttamente</p>
        )}
      </div>

      {/* Form per pescare esercizi dalla libreria */}
      <form
        onSubmit={handleAggiungiEsercizio}
        className="aggiungi-esercizio-section card"
      >
        <h3>Aggiungi Esercizio al Programma</h3>
        <div className="select-row">
          <select
            aria-label="Seleziona esercizio dalla libreria"
            value={esercizioSelezionato}
            onChange={(e) => setEsercizioSelezionato(e.target.value)}
          >
            {libreriaEsercizi.map((es) => (
              <option key={es.id} value={es.id}>
                {es.name} ({es.muscle_group})
              </option>
            ))}
          </select>
          <button type="submit" className="btn-add-ex-routine">
            ＋ Inserisci
          </button>
        </div>
      </form>

      {/* Elenco ordinabile con input specifici (Pagina 12, 22) */}
      <div className="esercizi-routine-list">
        <h3>Struttura Allenamento ({eserciziInseriti.length})</h3>

        {eserciziInseriti.length === 0 ? (
          <p className="no-exercises-hint">
            Questa scheda non contiene ancora nessun esercizio. Aggiungine uno
            usando il modulo sopra.
          </p>
        ) : (
          eserciziInseriti.map((item, index) => (
            <div key={item.id} className="esercizio-routine-item card">
              <div className="item-top-bar">
                <div className="exercise-info-title">
                  <h4>{item.exercises?.name}</h4>
                  <span className="muscle-badge-sm">
                    {item.exercises?.muscle_group}
                  </span>
                </div>
                <div className="order-actions">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleSpostaEsercizio(index, "su")}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={index === eserciziInseriti.length - 1}
                    onClick={() => handleSpostaEsercizio(index, "giu")}
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    className="btn-remove-ex-item"
                    onClick={() => handleRimuoviEsercizio(item.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modulo di immissione e regolazione parametri della scheda */}
              <div className="inputs-parameters-grid">
                <div className="param-field">
                  <label>Serie</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={item.target_sets}
                    onChange={(e) =>
                      handleAggiornaParametriEsercizio(
                        item.id,
                        "target_sets",
                        parseInt(e.target.value) || 2,
                      )
                    }
                  />
                </div>
                <div className="param-field">
                  <label>Reps Min</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={item.rep_min}
                    onChange={(e) =>
                      handleAggiornaParametriEsercizio(
                        item.id,
                        "rep_min",
                        parseInt(e.target.value) || 1,
                      )
                    }
                  />
                </div>
                <div className="param-field">
                  <label>Reps Max</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={item.rep_max}
                    onChange={(e) =>
                      handleAggiornaParametriEsercizio(
                        item.id,
                        "rep_max",
                        parseInt(e.target.value) || 1,
                      )
                    }
                  />
                </div>
                <div className="param-field">
                  <label>Recupero (s)</label>
                  <input
                    type="number"
                    placeholder="Profilo"
                    value={item.rest_seconds || ""}
                    onChange={(e) =>
                      handleAggiornaParametriEsercizio(
                        item.id,
                        "rest_seconds",
                        parseInt(e.target.value) || null,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
