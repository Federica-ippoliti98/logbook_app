// ============================================================================
// TAPPA 1: Importazione delle Dipendenze Core, Client e Stili Associati
// OBIETTIVO: Caricare gli hook fondamentali di gestione dello stato e degli effetti, uniti all'SDK di Supabase e agli stili di layout.
// TEORIA DA STUDIARE PRIMA:
// - Strutturazione dei Moduli Applicativi: Importare moduli core e librerie locali per abilitare la reattività e le query asincrone.
// PASSAGGI LOGICI:
// 1. In cima al file, importare useState ed useEffect dal modulo 'react'.
// 2. Importare il client asincrono supabase dal percorso relativo delle librerie del progetto.
// 3. Integrare il foglio di stile locale './AnalisiIA.css'.
// ============================================================================
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import "./AnalisiIA.css";

// ============================================================================
// TAPPA 2: Dichiarazione del Componente e Configurazione degli Stati Statistici
// OBIETTIVO: Definire la funzione principale dell'AnalisiIA e inizializzare le variabili reattive per memorizzare i volumi, le sessioni e i record massimi.
// TEORIA DA STUDIARE PRIMA:
// - Stati Primitivi e Collezioni: Scegliere valori iniziali idonei (array vuoti per dati tabellari, numeri azzerati per contatori matematici).
// PASSAGGI LOGICI:
// 1. Esportare la funzione componente AnalisiIA.
// 2. Creare gli stati di controllo base: loading (attivo di default) e statistiche (array vuoto iniziale).
// 3. Configurare le costanti numeriche di riepilogo: totaleAllenamenti e volumeMassimo inizializzati a zero.
// ============================================================================
export function AnalisiIA() {
  const [loading, setLoading] = useState(true);
  const [statistiche, setStatistiche] = useState([]);
  const [totaleAllenamenti, setTotaleAllenamenti] = useState(0);
  const [volumeMassimo, setVolumeMassimo] = useState(0);

  // ============================================================================
  // TAPPA 3: Sincronizzazione ed Esecuzione dell'Effetto al Montaggio
  // OBIETTIVO: Avviare il calcolo matematico dei dati volumetrici non appena la pagina viene visualizzata sullo schermo.
  // PASSAGGI LOGICI:
  // 1. Configurare un hook useEffect associato a un array di controllo finale vuoto `([])`.
  // 2. All'interno della callback dell'effetto, invocare direttamente la funzione calcolaStatisticheVolumetriche().
  // ============================================================================
  useEffect(() => {
    calcolaStatisticheVolumetriche();
  }, []);

  // ============================================================================
  // TAPPA 4: Recupero delle Sessioni Concluse con Limitazione di Record
  // OBIETTIVO: Scaricare dal database esclusivamente gli ultimi 7 allenamenti completati dall'utente attivo per l'elaborazione del grafico.
  // TEORIA DA STUDIARE PRIMA:
  // - Limitazione di Righe (`.limit`): Istruzione SQL per forzare il database a restituire un numero massimo di record, ottimizzando il carico di rete.
  // - Filtri di Negazione Logica (`.not`): Scartare le righe in cui una determinata colonna (es. data_fine) risulta priva di dati.
  // PASSAGGI LOGICI:
  // 1. Definire la funzione asincrona calcolaStatisticheVolumetriche e attivare lo stato loading su true.
  // 2. Prelevare l'oggetto utente autenticato tramite la chiamata asincrona supabase.auth.getUser().
  // 3. Eseguire una query sulla tabella 'sessioni_allenamento' filtrando per user_id, escludendo i record con data_fine nulla, ordinando in modo decrescente e limitando l'output a 7 record.
  // 4. Inserire un controllo if di sicurezza: se l'array delle sessioni estratto è vuoto, azzerare lo stato statistiche, spegnere loading con return e interrompere la funzione.
  // ============================================================================
  const calcolaStatisticheVolumetriche = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1. Recupera le ultime 7 sessioni completate
      const { data: sessioni, error: errSess } = await supabase
        .from("sessioni_allenamento")
        .select("id, nome_scheda, data_inizio")
        .eq("user_id", user.id)
        .not("data_fine", "is", null)
        .order("data_inizio", { ascending: false })
        .limit(7);

      if (errSess) throw errSess;

      if (!sessioni || sessioni.length === 0) {
        setStatistiche([]);
        setLoading(false);
        return;
      }

      setTotaleAllenamenti(sessioni.length);

      // ============================================================================
      // TAPPA 5: Estrazione ed Interrogazione Relazionale di Gruppo (Filtro `.in`)
      // OBIETTIVO: Raccogliere tutti gli ID delle sessioni estratte ed effettuare un'unica query cumulativa per prelevare tutte le serie collegate ad esse.
      // TEORIA DA STUDIARE PRIMA:
      // - Operatore SQL IN (`.in`): Filtro per estrarre record in cui il valore di una colonna corrisponde a uno qualsiasi degli elementi presenti in un array di ID fornito.
      // - Data Mapping Estrattivo: Utilizzo di `.map()` per isolare una specifica proprietà (es. id) da una collezione di oggetti.
      // PASSAGGI LOGICI:
      // 1. Mappare l'array delle sessioni scaricate un momento prima per estrarre solo gli ID, memorizzandoli nella costante sessioniIds.
      // 2. Effettuare una query sulla tabella 'log_serie' selezionando i campi necessari ed applicando il filtro `.in()` sulla colonna 'sessione_id'.
      // 3. Verificare la presenza di errori di rete ed interrompere il blocco try lanciando l'eccezione in caso di anomalie.
      // • Errori da evitare: Inviare query separate per ogni sessione all'interno di un ciclo asincrono, intasando la rete ed abbassando drasticamente le performance.
      // ============================================================================
      const sessioniIds = sessioni.map((s) => s.id);
      const { data: serie, error: errSerie } = await supabase
        .from("log_serie")
        .select("sessione_id, peso, ripetizioni")
        .in("sessione_id", sessioniIds);

      if (errSerie) throw errSerie;

      // ============================================================================
      // TAPPA 6: Calcolo del Tonnellaggio Totale e Inversione Cronologica (`.reverse`)
      // OBIETTIVO: Elaborare il volume di carico (Peso × Ripetizioni) per ogni singola sessione e ordinare l'array in modo cronologico lineare.
      // TEORIA DA STUDIARE PRIMA:
      // - Calcolo del Volume Muscolare: Formula algoritmica applicata alle prestazioni fisiche `(Sommatoria di Peso × Ripetizioni per ogni set)`.
      // - Inversione di Array (`.reverse()`): Metodo JavaScript per invertire l'ordine degli elementi in un array, utile per visualizzare i grafici da sinistra (più vecchio) a destra (più recente).
      // PASSAGGI LOGICI:
      // 1. Eseguire un `.map()` sull'array delle sessioni per generare una nuova collezione strutturata.
      // 2. All'interno del ciclo, usare `.filter()` sull'array globale delle serie per estrarre solo quelle appartenenti alla sessione corrente (`sessione_id === s.id`).
      // 3. Eseguire un `.reduce()` sulle serie filtrate per calcolare il tonnellaggio complessivo sommo, convertendo i valori tramite `parseFloat()` e `parseInt()`.
      // 4. Formattare la data di inizio in formato testuale italiano ridotto (DD/MM).
      // 5. Ritorna l'oggetto mappato comprensivo di id, nome, data, volume totale e conteggio delle serie fatte.
      // 6. Concatenare il metodo `.reverse()` alla fine del blocco di map per invertire la cronologia.
      // ============================================================================
      const analisiMappa = sessioni
        .map((s) => {
          const serieDellaSessione = serie.filter(
            (item) => item.sessione_id === s.id,
          );
          const volumeTotale = serieDellaSessione.reduce((acc, curr) => {
            return acc + parseFloat(curr.peso) * parseInt(curr.ripetizioni);
          }, 0);

          const dataFormattata = new Date(s.data_inizio).toLocaleDateString(
            "it-IT",
            {
              day: "2-digit",
              month: "2-digit",
            },
          );

          return {
            id: s.id,
            nome: s.nome_scheda,
            data: dataFormattata,
            volume: volumeTotale,
            numSerie: serieDellaSessione.length,
          };
        })
        .reverse();

      // ============================================================================
      // TAPPA 7: Individuazione del Picco Massimo tramite Operatore Spread (`...`)
      // OBIETTIVO: Isolare il valore di volume più alto registrato nell'array per usarlo come valore di riferimento proporzionale per l'altezza del grafico CSS.
      // TEORIA DA STUDIARE PRIMA:
      // - Metodo Math.max() con Destrutturazione Spread: Utilizzare `Math.max(...array)` per estrarre il numero maggiore da una lista di valori numerici passati in linea.
      // PASSAGGI LOGICI:
      // 1. Estrarre i volumi calcolati dall'array analisiMappa tramite un ciclo map rapido.
      // 2. Passare i valori estratti a Math.max sfruttando l'operatore spread `...`, includendo un valore di fallback fisso (es. 100) per evitare divisioni per zero.
      // 3. Salvare il valore di picco nello stato volumeMassimo ed assegnare l'intera collezione analisiMappa allo stato statistiche.
      // ============================================================================
      const maxVol = Math.max(...analisiMappa.map((o) => o.volume), 100);
      setVolumeMassimo(maxVol);
      setStatistiche(analisiMappa);
    } catch (err) {
      console.error("Errore nel calcolo del volume: ", err.message);
    } finally {
      // ============================================================================
      // TAPPA 8: Ripristino degli Stati di Caricamento Preventivi
      // OBIETTIVO: Spegnere in ogni scenario possibile (sia successo che errore) l'indicatore di caricamento, abilitando il rendering dell'interfaccia.
      // TEORIA DA STUDIARE PRIMA:
      // - Il blocco finally: Comprendere l'importanza di eseguire istruzioni di pulizia o reset di stati di caricamento che devono tassativamente verificarsi al termine di un flusso asincrono, indipendentemente dall'esito della query.
      // PASSAGGI LOGICI:
      // 1. Inserire il blocco `finally` immediatamente sotto la chiusura del blocco `catch`.
      // 2. All'interno di questo blocco, invocare il setter `setLoading(false)` per spegnere l'attesa di rete.
      // ============================================================================
      setLoading(false);
    }
  };

  // ============================================================================
  // TAPPA 9: Intercettazione del Caricamento ed Early Return di Sicurezza
  // OBIETTIVO: Bloccare il rendering del layout principale se le query asincrone al database Supabase sono ancora in esecuzione.
  // TEORIA DA STUDIARE PRIMA:
  // - Early Return Pattern: Evitare la lettura o il calcolo di variabili di rendering parziali (es. dividere per un `volumeMassimo` non ancora calcolato) uscendo anticipatamente dalla funzione componente.
  // PASSAGGI LOGICI:
  // 1. Inserire un controllo condizionale `if` subito dopo la chiusura delle funzioni asincrone e prima del blocco di ritorno principale.
  // 2. Controllare se lo stato `loading` è attivo. In caso positivo, interrompere l'esecuzione restituendo un tag testuale di attesa.
  // ============================================================================
  if (loading)
    return (
      <p className="loading-text">Generazione statistiche volumetriche...</p>
    );

  return (
    <div className="analisi-container">
      <h2>Analisi Progressi</h2>
      <p className="subtitle">
        Visualizzazione quantitativa del tonnellaggio totale sollevato.
      </p>

      {/* Box riepilogo dati veloci */}
      <div className="stats-overview-grid">
        <div className="stat-mini-card card">
          <label>Sessioni Analizzate</label>
          <h3>{totaleAllenamenti}</h3>
        </div>
        <div className="stat-mini-card card">
          <label>Record Volume Singolo</label>
          <h3>{Math.round(volumeMassimo)} Kg</h3>
        </div>
      </div>

      {/* ============================================================================
          TAPPA 10: Rendering del Grafico CSS Nativo in Proporzione Percentuale
          OBIETTIVO: Comporre la struttura visiva JSX iterando sulle statistiche calcolate e impostando dinamicamente l'altezza delle barre in base al rapporto percentuale con il picco massimo.
          TEORIA DA STUDIARE PRIMA:
          - Stili in Linea Dinamici (Inline Styles in React): Utilizzare la prop `style={{ height: ... }}` passandogli un oggetto JavaScript per alterare i parametri geometrici dei tag HTML a runtime.
          - Calcolo Proporzionale Percentuale: Determinare l'altezza di una barra dividendo il valore corrente per il valore massimo globale e moltiplicando il risultato per 100.
          - Metodo String.prototype.substring(): Tagliare una stringa di testo troppo lunga (es. nomi schede) per evitare che sovrascriva o deformi il layout grafico dell'applicazione.
          PASSAGGI LOGICI:
          1. Usare un operatore ternario controllando la lunghezza dell'array statistiche: se è zero, stampare l'Empty State di avviso.
          2. Se contiene dati, avviare il map grafico sull'array delle statistiche all'interno del contenitore delle barre.
          3. All'interno del ciclo, calcolare l'altezza percentuale dividendo il volume dell'elemento per la costante volumeMassimo e moltiplicando per 100.
          4. Applicare al tag fill della barra lo stile in linea `style={{ height: ... }}` usando il valore calcolato avvolto nel metodo Math.max per garantire un'altezza minima visiva (es. 5%).
          5. Troncare il testo del nome della scheda tramite `.substring(0, 6)` per mostrare una didascalia pulita sotto la rispettiva colonna del grafico.
          • Errori da evitare: Omettere il calcolo percentuale dinamico o impostare l'altezza in modo statico nel file CSS, rimuovendo la natura reattiva e proporzionale dal grafico.
          ============================================================================ */}
      {statistiche.length === 0 ? (
        <div className="empty-state card">
          <p>Dati insufficienti per generare il grafico volumetrico.</p>
          <p className="hint">
            Registra le serie completate all'interno delle tue sessioni per
            sbloccare i grafici.
          </p>
        </div>
      ) : (
        <div className="grafico-card card">
          <h3>Volume Totale Sollevato (Ultime Sessioni)</h3>

          {/* Contenitore Grafico CSS Nativo */}
          <div className="chart-wrapper">
            <div className="chart-bars-container">
              {statistiche.map((item) => {
                // Calcola l'altezza percentuale rispetto al picco massimo
                const altezzaPercentuale = (item.volume / volumeMassimo) * 100;

                return (
                  <div key={item.id} className="chart-bar-column">
                    <div className="chart-bar-value-label">
                      {item.volume > 0 ? `${Math.round(item.volume)}` : "0"}
                    </div>
                    <div
                      className="chart-bar-fill"
                      style={{ height: `${Math.max(altezzaPercentuale, 5)}%` }}
                      title={`${item.nome}: ${item.volume} Kg sollevati`}
                    ></div>
                    <div className="chart-bar-date-label">{item.data}</div>
                    <div className="chart-bar-name-label">
                      {item.nome.substring(0, 6)}..
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="hint-graph">
            Il volume è calcolato sommando (Carico × Ripetizioni) per ogni set
            spuntato.
          </p>
        </div>
      )}
    </div>
  );
}
