// ============================================================================
// TAPPA 1: Importazione delle Dipendenze Core, Client API, Contesti e Funzioni di Calcolo
// OBIETTIVO: Caricare gli hook nativi di React, il client di Supabase, gli hook per lo stile visivo e l'algoritmo di classificazione degli obiettivi antropometrici.
// TEORIA DA STUDIARE PRIMA:
// - Composizione di Utility Esterne: Integrare funzioni matematiche pure (determinaTipoObiettivo) ereditate da file di calcolo isolati per arricchire l'interfaccia a runtime.
// PASSAGGI LOGICI:
// 1. In cima al file, importare useState ed useEffect dal pacchetto 'react'.
// 2. Importare il client asincrono supabase dal relativo percorso delle librerie locali.
// 3. Importare l'hook personalizzato useTheme dal modulo di contesto del tema globale.
// 4. Importare la funzione determinaTipoObiettivo dal modulo locale 'calculations'.
// 5. Collegare il foglio di stile locale './Profilo.css'.
// ============================================================================
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useTheme } from "../context/ThemeContext";
import { determinaTipoObiettivo } from "../lib/calculations";
import "./Profilo.css";

// ============================================================================
// TAPPA 2: Dichiarazione del Componente e Configurazione Massiva degli Stati Modulo
// OBIETTIVO: Definire la funzione principale del Profilo e isolare le variabili reattive per mappare ogni singola colonna della tabella profiles del database.
// TEORIA DA STUDIARE PRIMA:
// - Stati Strutturati Complessi vs Input Singoli: Gestire dizionari composti (es. lo stato message come oggetto `{ text, type }`) per veicolare feedback grafici omogenei.
// PASSAGGI LOGICI:
// 1. Esportare la funzione componente Profilo ed estrarre theme e toggleTheme da useTheme().
// 2. Creare gli stati di controllo di rete e identità: userEmail, userId, exportLoading, e saving.
// 3. Inizializzare lo stato ad oggetto message impostando chiavi vuote per testo e tipologia d'allerta.
// 4. Inizializzare i sei moduli controllati del form legandoli ai tipi primitivi corretti coerenti con le colonne SQL (stringhe per i testi, interi o decimali per parametri fisici).
// ============================================================================
export function Profilo() {
  const { theme, toggleTheme } = useTheme();
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Stati per i moduli controllati del database ufficiale (Tappa 3)
  const [displayName, setDisplayName] = useState("");
  const [height, setHeight] = useState("");
  const [startingWeight, setStartingWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [restSeconds, setRestSeconds] = useState(180);
  const [currentWeight, setCurrentWeight] = useState(null);

  // ============================================================================
  // TAPPA 3: Inizializzazione Multipla e State Recovery Relazionale
  // OBIETTIVO: Estrarre l'identità dell'utente dal client auth all'avvio, scaricare i parametri di configurazione del profilo ed interrogare lo storico misurazioni per ricavare l'ultimo peso salvato.
  // TEORIA DA STUDIARE PRIMA:
  // - Ordinamento e Limitazione di Query di Misura: Combinare modificatori `.order()` e `.limit(1)` su tabelle di log cronologici (body_measurements) per isolare l'ultimo inserimento registrato nel tempo.
  // PASSAGGI LOGICI:
  // 1. Dichiarare un hook useEffect ad attivazione singola legata a un array di controllo vuoto `([])`.
  // 2. All'interno della callback, definire ed eseguire la funzione asincrona inizializzaProfilo.
  // 3. Estrarre l'utente tramite supabase.auth.getUser(); se assente, interrompere il flusso con un return preventivo.
  // 4. Eseguire una query sulla tabella 'profiles' filtrando per l'ID recuperato per popolare i sei setter dei moduli controllati.
  // 5. Eseguire una seconda query sulla tabella 'body_measurements' filtrando per user_id e per tipo di misurazione 'weight', ordinando in modo decrescente su 'measured_on' con un limite fisso di 1.
  // 6. Se il log del peso è presente, effettuarne il parsing numerico e assegnarlo a currentWeight, altrimenti ripiegare sul peso di partenza della tabella profiles come fallback.
  // ============================================================================
  useEffect(() => {
    async function inizializzaProfilo() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email);
      setUserId(user.id);

      // 1. Recupera i dati di configurazione dal profilo utente
      const { data: prof, error: errProf } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!errProf && prof) {
        setDisplayName(prof.display_name || "");
        setHeight(prof.height_cm || "");
        setStartingWeight(prof.starting_weight_kg || "");
        setTargetWeight(prof.target_weight_kg || "");
        setWeeklyGoal(prof.weekly_workout_goal || 4);
        setRestSeconds(prof.default_rest_seconds || 180);
      }

      // 2. Recupera l'ultimo peso dalle misurazioni corporee per l'avviso differenziale (Pagina 10)
      const { data: pesoMisura } = await supabase
        .from("body_measurements")
        .select("value")
        .eq("user_id", user.id)
        .eq("kind", "weight")
        .order("measured_on", { ascending: false })
        .limit(1);

      if (pesoMisura && pesoMisura.length > 0) {
        setCurrentWeight(parseFloat(pesoMisura.value));
      } else if (prof?.starting_weight_kg) {
        setCurrentWeight(parseFloat(prof.starting_weight_kg));
      }
    }
    inizializzaProfilo();
  }, []);

  // ============================================================================
  // TAPPA 4: Validazione Stringente e Query di Aggiornamento Parziale (`.update`)
  // OBIETTIVO: Convertire e convalidare l'integrità numerica di ogni campo compilato prima di inoltrare la query SQL di modifica dei record su Supabase.
  // TEORIA DA STUDIARE PRIMA:
  // - Range di Validazione Client-Side: Intercettare anomalie geometriche e parametriche (altezze assurde, giorni fuori settimana) per bloccare le richieste prima del crash del database.
  // - Conversione condizionale a Null: Uso degli operatori ternari per decidere se passare un valore convertito o azzerare la cella del DB inserendo `null` se il form è vuoto.
  // PASSAGGI LOGICI:
  // 1. Intercettare l'evento di submit tramite e.preventDefault(), attivare lo stato di saving e azzerare i messaggi precedenti.
  // 2. Convertire i dati in float o int ed eseguire i 5 controlli condizionali di range di sicurezza; se falliscono, popolare l'oggetto message con tipo "error" ed interrompere l'esecuzione.
  // 3. Aprire il blocco try: chiamare il metodo `.update()` di Supabase iniettando l'oggetto mappato e ripulendo la stringa del nome utente tramite `.trim()`.
  // 4. Filtrare l'aggiornamento sulla chiave primaria tramite `.eq("id", userId)`.
  // 5. In caso di successo, stampare un messaggio con tipo "success", catturando invece i messaggi di fallimento nel blocco catch.
  // • Errori da evitare: Omettere il reset del flag `setSaving(false)` all'interno delle barriere di validazione primitive, lasciando il pulsante congelato all'infinito se l'utente inserisce dati non validi.
  // ============================================================================
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    // Validazione stringente dell'input moduli (Pagina 22)
    const h = parseFloat(height);
    const sw = parseFloat(startingWeight);
    const tw = parseFloat(targetWeight);
    const wg = parseInt(weeklyGoal);
    const rs = parseInt(restSeconds);

    if (height && (h < 100 || h > 250)) {
      setMessage({
        text: "L'altezza deve essere compresa tra 100 e 250 cm.",
        type: "error",
      });
      setSaving(false);
      return;
    }
    if (startingWeight && (sw < 20 || sw > 400)) {
      setMessage({
        text: "Il peso di partenza deve essere compreso tra 20 e 400 kg.",
        type: "error",
      });
      setSaving(false);
      return;
    }
    if (targetWeight && (tw < 20 || tw > 400)) {
      setMessage({
        text: "Il peso obiettivo deve essere compreso tra 20 e 400 kg.",
        type: "error",
      });
      setSaving(false);
      return;
    }
    if (wg < 1 || wg > 7) {
      setMessage({
        text: "Gli allenamenti settimanali devono essere compresi tra 1 e 7.",
        type: "error",
      });
      setSaving(false);
      return;
    }
    if (rs < 15 || rs > 600) {
      setMessage({
        text: "Il recupero deve essere compreso tra 15 secondi e 10 minuti.",
        type: "error",
      });
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          height_cm: height ? h : null,
          starting_weight_kg: startingWeight ? sw : null,
          target_weight_kg: targetWeight ? tw : null,
          weekly_workout_goal: wg,
          default_rest_seconds: rs,
        })
        .eq("id", userId);

      if (error) throw error;
      setMessage({
        text: "Impostazioni aggiornate con successo!",
        type: "success",
      });
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // TAPPA 5: Revoca dei Token e Disconnessione
  // OBIETTIVO: Terminare la sessione attiva comunicando la chiusura dell'account al server di autenticazione globale di Supabase.
  // ============================================================================
  const handleLogout = async () => {
    if (window.confirm("Vuoi davvero uscire dall'applicazione?")) {
      await supabase.auth.signOut();
    }
  };

  // ============================================================================
  // TAPPA 6: Esportazione Relazionale Multi-Tabella (`workouts` e `workout_sets`)
  // OBIETTIVO: Estrarre la totalità dei dati storici delle sessioni di allenamento completate, accoppiare i rispettivi set e avviare il download di un backup JSON locale.
  // TEORIA DA STUDIARE PRIMA:
  // - Sollevamento Eccezioni Personalizzate (`new Error`): Interrompere forzatamente l'esecuzione lanciando un errore esplicito se non esistono dati da esportare nel database.
  // PASSAGGI LOGICI:
  // 1. Attivare exportLoading su true e richiedere i dettagli dell'utente.
  // 2. Interrogare la tabella 'workouts' estraendo tutte le sessioni legate all'ID utente.
  // 3. Controllare se l'array sessioni è nullo o vuoto; in caso positivo, scatenare l'errore con `throw new Error(...)`.
  // 4. Estrarre in massa le serie dalla tabella 'workout_sets' filtrando con il modificatore `.in()` sulla chiave esterna 'workout_id' costruendo un array tramite il map dei soli ID delle sessioni.
  // 5. Unificare i flussi tramite un secondo map: iniettare all'interno di ogni sessione l'array filtrato dei soli set associati ad essa (`item.workout_id === s.id`).
  // 6. Stringificare i dati, generare l'ancora di download HTML temporanea sul DOM, forzarne l'attivazione ed eseguirne l'eliminazione finale dal body del documento.
  // ============================================================================
  const esportaDatiJSON = async () => {
    setExportLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: sessioni, error: errSess } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id);

      if (errSess) throw errSess;

      if (!sessioni || sessioni.length === 0) {
        throw new Error("Nessun allenamento registrato da esportare.");
      }

      const { data: serie, error: errSerie } = await supabase
        .from("workout_sets")
        .select("*")
        .in(
          "workout_id",
          sessioni.map((s) => s.id),
        );

      if (errSerie) throw errSerie;

      const backupCompleto = sessioni.map((s) => ({
        ...s,
        serie_registrate: serie
          ? serie.filter((item) => item.workout_id === s.id)
          : [],
      }));

      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(backupCompleto, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `logbook_backup_${new Date().toISOString().split("T")[0]}.json`,
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("Errore durante l'esportazione: " + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  // ============================================================================
  // TAPPA 7: Calcoli di Avanzamento Differenziale Client-Side
  // OBIETTIVO: Sfruttare le librerie matematiche per dedurre il tipo di obiettivo fisico calcolando i chilogrammi mancanti al traguardo finale.
  // TEORIA DA STUDIARE PRIMA:
  // - Metodo toFixed(1): Arrotondare e convertire numeri decimali fissando una precisione millimetrica a una sola cifra dopo la virgola.
  // PASSAGGI LOGICI:
  // 1. Invocare determinaTipoObiettivo passando i parametri reattivi di peso iniziale e obiettivo per ricavare la stringa identificativa.
  // 2. Aprire un controllo ternario: se esistono sia currentWeight che targetWeight, calcolare la sottrazione pura applicando il modificatore `.toFixed(1)`, altrimenti impostare la variabile a null.
  // ============================================================================
  const tipoObiettivo = determinaTipoObiettivo(startingWeight, targetWeight);
  const pesoMancante =
    currentWeight && targetWeight
      ? (parseFloat(currentWeight) - parseFloat(targetWeight)).toFixed(1)
      : null;

  // ============================================================================
  // TAPPA 8: Rendering di Interfaccia Condizionale Dinamica e Collegamento Input Controllati
  // OBIETTIVO: Sviluppare il layout JSX associando le etichette degli input (label) ai rispettivi ID tramite l'attributo speciale htmlFor, stampando gli alert e troncando le stringhe di iniziali utente.
  // TEORIA DA STUDIARE PRIMA:
  // - Accessibilità dei Form (`htmlFor`): Uso dell'attributo `htmlFor` sui tag `<label>` legandolo all'ID dell'input per agganciare in modo accessibile le descrizioni ai campi modulo.
  // - String Splitting ed Iniziali: Estrarre sezioni di una stringa con `.substring(0, 2)` convertendola in maiuscolo tramite `.toUpperCase()` per generare avatar grafici temporanei dell'account.
  // PASSAGGI LOGICI:
  // 1. Configurare il return principale inserendo l'avatar utente condizionale: se displayName esiste, troncarne le prime due lettere in maiuscolo, altrimenti stampare l'icona di default.
  // 2. Stampare condizionalmente i banner alert controllando se `message.text` contiene dati, applicando classi CSS modificate sul valore della chiave `message.type`.
  // 3. Generare le sezioni del form suddividendole in Dati Fisici, Parametri Obiettivo ed Impostazioni Allenamento.
  // 4. Associare per ogni input la prop value e la callback onChange, curando di impostare gli attributi `step`, `min`, `max` e l'ID corrispondente alla label.
  // 5. Inserire il box informativo sotto i parametri peso per mostrare la stringa dell'obiettivo e valutare con un ternario se il peso mancante è pari a zero ("Obiettivo raggiunto!") o calcolare il valore assoluto con `Math.abs(pesoMancante)` per indicare la distanza residua dal traguardo.
  // 6. Bloccare forzatamente i pulsanti di invio form e download di sistema collegando la proprietà disabled agli stati booleani di attesa delle chiamate asincrone.
  // • Errori da evitare: Omettere l'attributo richiesto disabled durante le fasi di export asincrono, permettendo all'utente di fare click a ripetizione e lanciare decine di download pesanti contemporaneamente in background.
  // ============================================================================
  return (
    <div className="profilo-container">
      <h2>Il tuo Profilo</h2>
      <p className="subtitle">
        Gestione account e preferenze dell'applicazione.
      </p>

      <div className="profilo-card card">
        <div className="user-avatar">
          {displayName ? displayName.substring(0, 2).toUpperCase() : "👤"}
        </div>
        <div className="user-info">
          <label>Account collegato</label>
          <h4>{userEmail || "Caricamento..."}</h4>
        </div>
      </div>

      {message.text && (
        <div
          className={`profile-alert ${message.type === "error" ? "error" : "success"}`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="profilo-form">
        <div className="form-section card">
          <h3>Dati Fisici</h3>
          <div className="input-group">
            <label htmlFor="display-name">Nome utente</label>
            <input
              id="display-name"
              type="text"
              maxLength={40}
              placeholder="Inserisci il tuo nome"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="height">Altezza (cm)</label>
            <input
              id="height"
              type="number"
              step="0.1"
              placeholder="es. 175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>
        </div>

        <div className="form-section card">
          <h3>Parametri Obiettivo</h3>
          <div className="input-group">
            <label htmlFor="starting-weight">Peso di Partenza (kg)</label>
            <input
              id="starting-weight"
              type="number"
              step="0.01"
              placeholder="es. 80.50"
              value={startingWeight}
              onChange={(e) => setStartingWeight(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="target-weight">Peso Obiettivo (kg)</label>
            <input
              id="target-weight"
              type="number"
              step="0.01"
              placeholder="es. 75.00"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
            />
          </div>
          {tipoObiettivo && (
            <div className="obiettivo-info-box">
              <p>
                Obiettivo identificato: <strong>{tipoObiettivo}</strong>
              </p>
              {pesoMancante !== null && (
                <p className="mancanti-label">
                  {parseFloat(pesoMancante) === 0
                    ? "Obiettivo raggiunto!"
                    : `Ora ${currentWeight} kg · mancano ${Math.abs(pesoMancante)} kg`}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="form-section card">
          <h3>Impostazioni Allenamento</h3>
          <div className="input-group">
            <label htmlFor="weekly-goal">Allenamenti a settimana</label>
            <input
              id="weekly-goal"
              type="number"
              min="1"
              max="7"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="rest-seconds">Recupero predefinito (secondi)</label>
            <input
              id="rest-seconds"
              type="number"
              min="15"
              max="600"
              value={restSeconds}
              onChange={(e) => setRestSeconds(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="btn-save-profile" disabled={saving}>
          {saving ? "Salvataggio in corso..." : "💾 Salva Impostazioni"}
        </button>
      </form>

      <div className="opzioni-sezione">
        <h3>Utility & Sistema</h3>
        <div className="opzione-row card" onClick={toggleTheme}>
          <div>
            <h4>Tema Interfaccia</h4>
            <p>
              Attualmente impostato su:{" "}
              <strong>{theme === "dark" ? "Scuro" : "Chiaro"}</strong>
            </p>
          </div>
          <button className="btn-toggle-switch" type="button">
            🔄 Cambia
          </button>
        </div>

        <div className="opzione-row card" onClick={esportaDatiJSON}>
          <div>
            <h4>Esporta Dati Personali</h4>
            <p>Scarica un file .json con tutto lo storico delle tue serie</p>
          </div>
          <button
            className="btn-outline"
            type="button"
            disabled={exportLoading}
          >
            {exportLoading ? "Esportazione..." : "📥 Scarica"}
          </button>
        </div>
      </div>

      <button className="btn-danger-full" type="button" onClick={handleLogout}>
        Disconnetti ed Esci
      </button>
    </div>
  );
}
