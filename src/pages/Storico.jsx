// ============================================================================
// TAPPA 1: Importazione delle Dipendenze, Hook Core e Client di Rete
// OBIETTIVO: Caricare gli strumenti di gestione dello stato e degli effetti di React, uniti al client SDK di Supabase e agli stili di layout.
// TEORIA DA STUDIARE PRIMA:
// - Strutturazione dei Moduli: Importare hook nativi e istanze locali per abilitare la reattività e le chiamate asincrone.
// PASSAGGI LOGICI:
// 1. In cima al file, importare useState ed useEffect dal pacchetto 'react'.
// 2. Importare l'istanza configurata di supabase dal percorso relativo corretto delle librerie.
// 3. Collegare il foglio di stile locale './Storico.css'.
// ============================================================================
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Storico.css';

// ============================================================================
// TAPPA 2: Dichiarazione del Componente e Configurazione dei Modelli di Stato
// OBIETTIVO: Definire la funzione principale dello Storico e inizializzare le variabili reattive per le sessioni chiuse e i dettagli espandibili delle serie.
// TEORIA DA STUDIARE PRIMA:
// - Stati di Flag Cooperativi: Coordinare una variabile identificativa (sessioneEspansa) con array o oggetti di caricamento per gestire l'apertura asincrona di una singola riga per volta.
// PASSAGGI LOGICI:
// 1. Esportare la funzione componente Storico.
// 2. Creare gli stati primari per l'array delle sessioni complessive e il flag booleano loading del primo caricamento.
// 3. Configurare lo stato sessioneEspansa (inizialmente null) per memorizzare l'ID numerico o stringa della card aperta.
// 4. Creare lo stato dettagliSerie (array vuoto iniziale) e il booleano di attesa loadingDettagli impostato a false.
// ============================================================================
export function Storico() {
  const [sessioni, setSessioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessioneEspansa, setSessioneEspansa] = useState(null);
  const [dettagliSerie, setDettagliSerie] = useState([]);
  const [loadingDettagli, setLoadingDettagli] = useState(false);

  // ============================================================================
  // TAPPA 3: Sincronizzazione al Montaggio del Componente (Mounting)
  // OBIETTIVO: Attivare il recupero automatico del registro storico non appena l'utente naviga sulla pagina.
  // PASSAGGI LOGICI:
  // 1. Dichiarare un hook useEffect passando un array di controllo finale vuoto `([])`.
  // 2. All'interno della callback dell'effetto, invocare direttamente la funzione fetchStorico().
  // ============================================================================
  useEffect(() => {
    fetchStorico();
  }, []);

  // ============================================================================
  // TAPPA 4: Recupero Dati Filtrati su Valori Non Nulli (`.not`)
  // OBIETTIVO: Interrogare la tabella delle sessioni per estrarre esclusivamente gli allenamenti conclusi (che presentano un timestamp valido nella colonna data_fine).
  // TEORIA DA STUDIARE PRIMA:
  // - Esclusione di Record SQL (`.not`): Utilizzare l'istruzione `.not('colonna', 'is', null)` per scartare le righe prive di dati su un attributo specifico.
  // PASSAGGI LOGICI:
  // 1. Definire la funzione asincrona fetchStorico e attivare lo stato di loading globale.
  // 2. Ottenere l'identificativo utente protetto mediante supabase.auth.getUser().
  // 3. Interrogare la tabella 'sessioni_allenamento' filtrando per user_id, escludendo i record dove 'data_fine' è null, e ordinando in modo decrescente su 'data_inizio'.
  // 4. Salvare i risultati nello stato sessioni e disattivare loading all'interno del blocco di sicurezza finally.
  // • Errori da evitare: Omettere il filtro di esclusione dei valori nulli, stampando nello storico anche l'allenamento live attualmente in corso nella dashboard.
  // ============================================================================
  const fetchStorico = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Recupera solo le sessioni concluse (data_fine non nulla)
      const { data, error } = await supabase
        .from('sessioni_allenamento')
        .select('*')
        .eq('user_id', user.id)
        .not('data_fine', 'is', null)
        .order('data_inizio', { ascending: false });

      if (error) throw error;
      setSessioni(data || []);
    } catch (err) {
      alert("Errore nel recupero dello storico: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // TAPPA 5: Gestione dell'Espansione Dinamica e Raggruppamento Relazionale (Array.prototype.reduce)
  // OBIETTIVO: Recuperare asincronamente i log delle serie collegate a una singola sessione cliccata e raggrupparli in una mappa strutturata per nome dell'esercizio.
  // TEORIA DA STUDIARE PRIMA:
  // - Metodo Array.prototype.reduce(): Funzione JavaScript per iterare su una lista e accumulare i dati all'interno di un oggetto strutturato, categorizzandoli per una chiave specifica (es. raggruppare serie per nome esercizio).
  // - Uscite di Sicurezza Condizionali (Early Return): Bloccare l'esecuzione e resettare lo stato a null se l'utente fa click su una riga già espansa per richiuderla.
  // PASSAGGI LOGICI:
  // 1. Scrivere la funzione asincrona handleEspandiSessione che riceve l'ID del record selezionato.
  // 2. Inserire un controllo if: se sessioneEspansa coincide con l'ID passato, azzerare lo stato a null e interrompere il flusso con return.
  // 3. Impostare lo stato sessioneEspansa sull'ID corrente e attivare loadingDettagli su true.
  // 4. Interrogare la tabella 'log_serie' filtrando per la chiave esterna 'sessione_id' e ordinando in modo crescente per data di creazione.
  // 5. Nel blocco di successo, eseguire il metodo `.reduce()` sui dati estratti: controllare se esiste già la chiave del nome esercizio nell'accumulatore (`acc`), inizializzarla come array vuoto se assente, e spingere (`.push()`) la riga corrente al suo interno.
  // 6. Assegnare l'oggetto raggruppato risultante allo stato dettagliSerie e spegnere loadingDettagli nel blocco finally.
  // • Errori da evitare: Sovrascrivere o perdere i dati accumulati nel ciclo reduce non restituendo l'oggetto `acc` alla fine della funzione di callback del riduttore.
  // ============================================================================
  const handleEspandiSessione = async (sessioneId) => {
    // Se clicco sulla sessione già aperta, la chiudo
    if (sessioneEspansa === sessioneId) {
      setSessioneEspansa(null);
      return;
    }

    setSessioneEspansa(sessioneId);
    setLoadingDettagli(true);
    try {
      // Recupera tutte le serie collegate a questa specifica sessione
      const { data, error } = await supabase
        .from('log_serie')
        .select('*')
        .eq('sessione_id', sessioneId)
        .order('creato_il', { ascending: true });

      if (error) throw error;

      // • Obiettivo: Trasformare un array lineare di record SQL in un oggetto dizionario categorizzato per nome dell'esercizio, ottimizzando la struttura per il rendering.
      // • Passaggi logici:
      // 	1. Invocare il metodo `.reduce()` sull'array `data` restituito da Supabase.
      // 	2. Nel corpo della callback, verificare con un blocco `if` se l'accumulatore (`acc`) possiede già una chiave corrispondente al nome dell'esercizio del record attuale.
      // 	3. Se la chiave non esiste, inizializzarla creando un array vuoto `[]` associato a quel nome.
      // 	4. Inserire il record corrente (`current`) dentro l'array specifico dell'esercizio tramite il metodo `.push()`.
      // 	5. Restituire tassativamente l'oggetto accumulatore modificato (`acc`) per renderlo disponibile all'elemento successivo.
      // • Errori da evitare: Omettere l'istruzione `return acc;` a fine ciclo, che interromperebbe immediatamente l'algoritmo di riduzione svuotando l'oggetto.
      // ============================================================================
      // Raggruppiamo le serie per nome esercizio per mostrarle meglio in UI
      const raggruppati = data.reduce((acc, current) => {
        if (!acc[current.nome_esercizio]) {
          acc[current.nome_esercizio] = [];
        }
        acc[current.nome_esercizio].push(current);
        return acc;
      }, {});


      setDettagliSerie(raggruppati);
    } catch (err) {
      alert("Errore nel caricamento dei dettagli: " + err.message);
    } finally {
      setLoadingDettagli(false);
    }
  };

  // ============================================================================
  // TAPPA 6: Formattazione delle Stringhe di Data e Calcoli di Durata Temporale
  // OBIETTIVO: Convertire i timestamp ISO grezzi del database in scritte leggibili dall'utente per data (DD MMM YYYY) e minuti totali di durata del workout.
  // TEORIA DA STUDIARE PRIMA:
  // - Metodo toLocaleDateString(): Funzione nativa degli oggetti Date per localizzare la rappresentazione testuale del calendario in base alle impostazioni geografiche (es. 'it-IT').
  // - Operazioni Matematiche su Date: Sottrarre due istanze Date per ottenere la differenza lorda in millisecondi, eseguendo poi il parsing in minuti tramite divisioni e arrotondamenti numerici (`Math.round`).
  // PASSAGGI LOGICI:
  // 1. In formattaData, instanziare un oggetto `new Date(isoString)` e restituire la stringa localizzata configurando le opzioni day, month e year.
  // 2. In calcolaDurata, calcolare la differenza in millisecondi sottraendo le istanze dei timestamp di inizio e fine.
  // 3. Dividere il valore per 1000 (secondi) e poi per 60 (minuti), applicando Math.round per arrotondare all'intero più vicino, e restituire la stringa risultante concatenata a "min".
  // ============================================================================
  const formattaData = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const calcolaDurata = (inizio, fine) => {
    const diffMs = new Date(fine) - new Date(inizio);
    const diffMins = Math.round(diffMs / 1000 / 60);
    return `${diffMins} min`;
  };

  // ============================================================================
  // ============================================================================
  // TAPPA 7: Rendering del Registro Principale e Gestione dell'Istruzione di Uscita Anticipata
  // OBIETTIVO: Comporre il primo livello visivo del componente gestendo i caricamenti iniziali, lo stato vuoto del registro e l'iterazione sulle sessioni salvate.
  // TEORIA DA STUDIARE PRIMA:
  // - Early Return Pattern: Interrompere il flusso di rendering di un componente se una condizione (es. caricamento) è ancora attiva, evitando di leggere variabili non definite.
  // - Classi Dinamiche in Linea: Utilizzare i Template Literals per iniettare stringhe di classe CSS condizionali (es. 'aperta') basandosi su stati booleani.
  // PASSAGGI LOGICI:
  // 1. Scrivere la prima istruzione di return condizionale per verificare lo stato loading globale, mostrando il testo di attesa.
  // 2. Verificare se la lunghezza dell'array sessioni è pari a zero, mostrando in quel caso l'interfaccia statica di stato vuoto (Empty State).
  // 3. Eseguire l'istruzione di return principale aprendo il tag contenitore e mappando l'array sessioni.
  // 4. All'interno del ciclo `.map()`, calcolare la variabile locale booleana `isAperta` confrontando l'id della sessione corrente con la variabile di stato `sessioneEspansa`.
  // 5. Configurare le classi dinamiche del tag contenitore iniettando la stringa 'aperta' se `isAperta` risulta vera, e agganciare handleEspandiSessione all'evento onClick del blocco sommario.
  // ============================================================================
  if (loading) return <p className="loading-text">Caricamento dello storico...</p>;

  return (
    <div className="storico-container">
      <h2>Storico Allenamenti</h2>
      <p className="subtitle">Il registro dei tuoi progressi nel tempo.</p>

      {sessioni.length === 0 ? (
        <div className="empty-state card">
          <p>Nessun allenamento salvato nel registro.</p>
          <p className="hint">Completa il tuo primo allenamento nella sezione "Allenati" per vederlo apparire qui!</p>
        </div>
      ) : (
        <div className="storico-list">
          {sessioni.map((sessione) => {
            const isAperta = sessioneEspansa === sessione.id;
            return (
              <div key={sessione.id} className={`storico-item card ${isAperta ? 'aperta' : ''}`}>
                <div className="storico-item-summary" onClick={() => handleEspandiSessione(sessione.id)}>
                  <div className="info-principali">
                    <span className="data-badge">{formattaData(sessione.data_inizio)}</span>
                    <h4>{sessione.nome_scheda}</h4>
                  </div>
                  <div className="info-secondarie">
                    <span>⏱️ {calcolaDurata(sessione.data_inizio, sessione.data_fine)}</span>
                    <span className="freccia-icon">{isAperta ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* ============================================================================
                    TAPPA 8: Estrazione delle Chiavi di Mappa ed Iterazione Annidata dei Log Esercizio
                    OBIETTIVO: Sviluppare il sotto-pannello visivo condizionale per ciclare sulle chiavi dell'oggetto dei dettagli raggruppati, generando le griglie e l'elenco dei singoli set eseguiti.
                    TEORIA DA STUDIARE PRIMA:
                    - Metodo Object.keys(): Istruzione JavaScript nativa per estrarre un array contenente tutte le stringhe di chiave memorizzate in un dizionario/mappa, rendendolo compatibile con il ciclo `.map()`.
                    - Cicli Annidate (Nested Mapping): Eseguire un map grafico (Object.keys().map) per generare i titoli degli esercizi e, all'interno di ciascuno di essi, attivare un secondo map (dettagliSerie[key].map) per stampare l'elenco lineare delle singole righe di serie (Kg x Reps).
                    PASSAGGI LOGICI:
                    1. Sotto il blocco sommario, inserire il cortocircuito logico `{ isAperta && ( ... ) }` per montare i dettagli solo se la card risulta espansa.
                    2. Gestire la visualizzazione condizionale interna legata a loadingDettagli per mostrare il caricamento delle serie.
                    3. Usare `Object.keys(dettagliSerie).length === 0` per intercettare allenamenti privi di serie salvate.
                    4. Invocare `Object.keys(dettagliSerie).map((nomeEsercizio, idx) => ... )` per generare i singoli blocchi degli esercizi.
                    5. All'interno del blocco di ciascun esercizio, inserire il secondo map puntando all'array specifico: `dettagliSerie[nomeEsercizio].map((serie, sIdx) => ... )`.
                    6. Stampare i dati della serie calcolando il progressivo del set con `sIdx + 1` e iniettando le proprietà peso e ripetizioni del record SQL corrente.
                    • Errori da evitare: Omettere l'attributo speciale "key" o usare indici di ciclo identici o non univoci nei tag dei cicli annidati, mandando in confusione l'algoritmo di Riconciliazione (Diffing) di React durante gli aggiornamenti visivi del DOM.
                    ============================================================================ */}
                {isAperta && (
                  <div className="storico-item-details">
                    {loadingDettagli ? (
                      <p className="loading-text-sm">Caricamento serie...</p>
                    ) : Object.keys(dettagliSerie).length === 0 ? (
                      <p className="no-sets-text">Nessuna serie registrata in questo allenamento.</p>
                    ) : (
                      Object.keys(dettagliSerie).map((nomeEsercizio, idx) => (
                        <div key={idx} className="dettaglio-esercizio-block">
                          <h5>{nomeEsercizio}</h5>
                          <div className="dettaglio-serie-grid">
                            {dettagliSerie[nomeEsercizio].map((serie, sIdx) => (
                              <div key={serie.id} className="dettaglio-serie-row">
                                <span className="num-set">Set {sIdx + 1}</span>
                                <span className="dati-set"><strong>{serie.peso}</strong> Kg x <strong>{serie.ripetizioni}</strong> rps</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
