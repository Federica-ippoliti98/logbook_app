// ============================================================================
// TAPPA 1: Importazione delle Dipendenze (import)
// OBIETTIVO: Importare gli hook di stato e di ciclo di vita di React, il client di Supabase e gli stili dedicati.
// TEORIA DA STUDIARE PRIMA:
// - Hook Integrati (Core Hooks): Ruolo combinato di useState ed useEffect per il recupero dati al caricamento.
// PASSAGGI LOGICI:
// 1. In cima al file, importare useState ed useEffect dal pacchetto 'react'.
// 2. Importare il client supabase dal file di configurazione locale.
// 3. Collegare il foglio di stile locale './Schede.css'.
// ============================================================================
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './Schede.css';

// ============================================================================
// TAPPA 2: Configurazione degli Stati e Struttura dell'Array Dinamico
// OBIETTIVO: Dichiarare gli stati applicativi per l'elenco delle schede, i caricamenti di rete e i singoli campi del form di creazione.
// TEORIA DA STUDIARE PRIMA:
// - Gestione di Array nello Stato: Utilizzo di array vuoti `([])` per contenere collezioni di oggetti SQL provenienti dal database.
// - Array di Stringhe Dinamiche: Inizializzare un array contenente una stringa vuota `([''])` per tracciare righe di input generate a runtime.
// PASSAGGI LOGICI:
// 1. Dichiarare ed esportare il componente principale Schede.
// 2. Inizializzare gli stati globali per l'elenco schede e il flag booleano loading (attivo di default).
// 3. Definire gli stati del form: il flag isCreating per la visibilità, le stringhe nomeScheda e descrizione.
// 4. Configurare lo stato esercizi passandogli come valore di partenza un array con un unico elemento stringa vuoto.
// ============================================================================
export function Schede() {
  const [schede, setSchede] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stati per il form di nuova scheda
  const [isCreating, setIsCreating] = useState(false);
  const [nomeScheda, setNomeScheda] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [esercizi, setEsercizi] = useState(['']); // Array di stringhe per gli esercizi dinamici

  // ============================================================================
  // TAPPA 3: Montaggio del Componente e Sincronizzazione Iniziale
  // OBIETTIVO: Innescare il recupero automatico dei dati dal database nel momento esatto in cui la pagina compare a schermo.
  // TEORIA DA STUDIARE PRIMA:
  // - Ciclo di Vita (Mounting): Comprendere l'esecuzione di funzioni asincrone staccate dal rendering sincrono del componente.
  // PASSAGGI LOGICI:
  // 1. Scrivere un hook useEffect configurando un array di dipendenze vuoto `([])` per limitarne l'attivazione.
  // 2. All'interno della callback dell'effetto, invocare direttamente la funzione fetchSchede().
  // ============================================================================
  useEffect(() => {
    fetchSchede();
  }, []);

  // ============================================================================
  // TAPPA 4: Recupero Dati Relazionali Avanzato (Join SQL e Ordinamento)
  // OBIETTIVO: Eseguire una query di lettura sul database per estrarre le schede aggregando in un'unica richiesta le righe collegate della tabella degli esercizi.
  // TEORIA DA STUDIARE PRIMA:
  // - Query Relazionali Supabase: Sintassi a stringa multilinea all'interno del metodo `.select()` per definire le join con tabelle figlie (es. `esercizi_scheda(...)`).
  // - Ordinamento SQL (`.order`): Configurare parametri di inversione cronologica tramite l'oggetto opzionale `{ ascending: false }`.
  // PASSAGGI LOGICI:
  // 1. Definire la funzione asincrona fetchSchede e attivare lo stato di loading.
  // 2. Nel blocco try, interrogare la tabella 'schede' selezionando i campi id, nome, descrizione, ed eseguendo l'aggregazione di 'esercizi_scheda'.
  // 3. Concatenare il modificatore `.order()` sulla colonna 'creato_il'.
  // 4. Verificare la presenza di errori, aggiornare lo stato schede con l'array estratto e forzare lo spegnimento di loading nel blocco finally.
  // • Errori da evitare: Omettere i passaggi di cattura nel blocco finally, rischiando di lasciare l'applicazione bloccata in modalità di caricamento se la query fallisce.
  // ============================================================================
  const fetchSchede = async () => {
    setLoading(true);
    try {
      // Recupera le schede includendo i rispettivi esercizi associati
      const { data, error } = await supabase
        .from('schede')
        .select(`
          id,
          nome,
          descrizione,
          esercizi_scheda (id, nome, ordine)
        `)
        .order('creato_il', { ascending: false });

      if (error) throw error;
      setSchede(data || []);
    } catch (err) {
      alert("Errore nel recupero delle schede: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // TAPPA 5: Manipolazione Immutabile dell'Array di Esercizi Dinamici
  // OBIETTIVO: Sviluppare le funzioni per aggiungere, modificare o rimuovere singole stringhe dall'array degli esercizi rispettando l'immutabilità dello stato di React.
  // TEORIA DA STUDIARE PRIMA:
  // - Immutabilità dello Stato: Evitare modifiche dirette all'array originale; utilizzare l'operatore spread `([...array])` o metodi non distruttivi come `.filter()`.
  // - Aggiornamento per Indice: Clonare l'array, sovrascrivere l'elemento nella coordinata target e riassegnare il clone al setter.
  // PASSAGGI LOGICI:
  // 1. In handleAddEsercizioInput, espandere l'array corrente e accodare una nuova stringa vuota `''`.
  // 2. In handleEsercizioChange, copiare l'array, individuare l'indice passato, aggiornarne il valore con il testo dell'input e salvare.
  // 3. In handleRemoveEsercizioInput, aggiungere un controllo di lunghezza minima (maggiore di 1) e usare `.filter()` per escludere l'elemento la cui coordinata corrisponde all'indice target.
  // ============================================================================
  const handleAddEsercizioInput = () => {
    setEsercizi([...esercizi, '']);
  };

  const handleEsercizioChange = (index, value) => {
    const nuoviEsercizi = [...esercizi];
    nuoviEsercizi[index] = value;
    setEsercizi(nuoviEsercizi);
  };

  const handleRemoveEsercizioInput = (index) => {
    if (esercizi.length > 1) {
      setEsercizi(esercizi.filter((_, i) => i !== index));
    }
  };

  // ============================================================================
  // TAPPA 6: Inserimenti Multipli Consensuali e Transazioni Bulk
  // OBIETTIVO: Sviluppare la logica di salvataggio per creare la scheda sul database, recuperarne l'ID generato e usarlo immediatamente per inserire in blocco (Bulk Insert) l'elenco degli esercizi associati.
  // TEORIA DA STUDIARE PRIMA:
  // - Modificatori di Ritorno (`.select().single()`): Richiedere al database di restituire immediatamente i dati del record appena creato (incluso l'ID auto-generato) sotto forma di oggetto singolo.
  // - Inserimento Bulk: Inviare a Supabase un array completo di oggetti per effettuare un unico inserimento di rete massivo, riducendo i tempi di latenza.
  // - Metodo .trim(): Pulizia di spazi bianchi superflui prima dell'invio dei testi SQL.
  // PASSAGGI LOGICI:
  // 1. Intercettare l'evento di invio form tramite e.preventDefault() e controllare la validità del nome scheda.
  // 2. Chiamare supabase.auth.getUser() per prelevare in modo sicuro l'ID dell'utente attivo.
  // 3. Eseguire l'insert sulla tabella 'schede' passando l'oggetto dati, concatenando `.select().single()` per estrarre la costante nuovaScheda.
  // 4. Usare `.map()` sull'array degli esercizi per formattare gli oggetti figli iniettando la chiave esterna `scheda_id: nuovaScheda.id` e calcolando la colonna ordine (index + 1).
  // 5. Filtrare gli elementi con nome vuoto e inviare l'array risultante alla tabella 'esercizi_scheda'.
  // 6. Resettare tutti i campi del form e rieseguire fetchSchede() per rinfrescare l'interfaccia.
  // • Errori da evitare: Effettuare inserimenti di esercizi ciclici dentro un ciclo for asincrono, generando decine di richieste HTTP lente e intasando le connessioni di rete.
  // ============================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomeScheda.trim()) return;

    try {
      // 1. Ottieni l'id dell'utente loggato
      const { data: { user } } = await supabase.auth.getUser();

      // 2. Inserisci la nuova scheda
      const { data: nuovaScheda, error: schedaError } = await supabase
        .from('schede')
        .insert([{ nome: nomeScheda, descrizione, user_id: user.id }])
        .select()
        .single();

      if (schedaError) throw schedaError;

      // 3. Filtra gli esercizi vuoti e prepara il payload per l'inserimento bulk
      const eserciziFiltrati = esercizi
        .map((es, index) => ({
          scheda_id: nuovaScheda.id,
          nome: es.trim(),
          ordine: index + 1
        }))
        .filter(es => es.nome !== '');

      if (eserciziFiltrati.length > 0) {
        const { error: eserciziError } = await supabase
          .from('esercizi_scheda')
          .insert(eserciziFiltrati);
        
        if (eserciziError) throw eserciziError;
      }

      // Reset del form e rinfresco dati
      setNomeScheda('');
      setDescrizione('');
      setEsercizi(['']);
      setIsCreating(false);
      fetchSchede();
    } catch (err) {
      alert("Errore nel salvataggio: " + err.message);
    }
  };

  // ============================================================================
  // TAPPA 7: Eliminazione a Cascata sul Database (Cascade Delete)
// OBIETTIVO: Rimuovere un record specifico dal database in base alla sua chiave primaria, sfruttando i vincoli di eliminazione a cascata configurati sulle tabelle del DB.
// TEORIA DA STUDIARE PRIMA:
// - Finestre di Dialogo Native (window.confirm): Bloccare l'azione chiedendo una conferma esplicita all'utente tramite pop-up.
// - Cancellazione Relazionale (Filtro .eq): Uso del comando .delete().eq('id', id) per rimuovere righe specifiche.
// PASSAGGI LOGICI:
// 1. Richiedere la conferma di cancellazione tramite window.confirm().
// 2. Avviare la chiamata asincrona di eliminazione puntando alla tabella 'schede' e filtrando per l'id selezionato.
// 3. In caso di successo, invocare fetchSchede() per aggiornare la visualizzazione.
// ============================================================================
const handleDeleteScheda = async (id) => {
if (!window.confirm("Sei sicuro di voler eliminare questa scheda? Questa azione cancellerà anche gli esercizi collegati.")) return;
try {
const { error } = await supabase.from('schede').delete().eq('id', id);
if (error) throw error;
fetchSchede();
} catch (err) {
alert("Errore nell'eliminazione: " + err.message);
}
};
// ============================================================================
// TAPPA 8: Rendering di Griglie Dati e Ordinamento Client-Side (Array.prototype.sort)
// OBIETTIVO: Sviluppare il motore JSX per iterare sulle schede scaricate e mostrare le sotto-liste degli esercizi ordinati correttamente per priorità.
// TEORIA DA STUDIARE PRIMA:
// - Metodo Array.prototype.sort(): Funzione JavaScript per riordinare gli elementi di un array in base a un criterio numerico di confronto (a.ordine - b.ordine).
// - Rendering Condizionale Multiplo: Utilizzo del triplo operatore condizionale (loading vs array vuoto vs griglia dati) per mutare completamente la struttura dell'interfaccia.
// PASSAGGI LOGICI:
// 1. Verificare lo stato loading e stampare il testo di caricamento.
// 2. Se loading è falso e la lunghezza di schede è zero, stampare l'interfaccia di stato vuoto (Empty State).
// 3. Se sono presenti elementi, eseguire il map principale su schede generando i nodi della griglia.
// 4. All'interno di ogni card, verificare la presenza dell'array figlio ed eseguirne il .sort() numerico sulla proprietà ordine prima di stamparne i tag di lista <li>.
// • Errori da evitare: Usare il metodo .sort() direttamente sull'array di stato senza accortezze se questo muta l'array originale di React (in questo blocco l'operatore di navigazione opzionale ?. unito al rendering immediato evita l'effetto).
// ============================================================================
return (
    <div className="schede-container">
      <div className="header-sezione">
        <h2>Le tue Schede</h2>
        <button className="btn-add" onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Chiudi' : 'Nuova Scheda'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="scheda-form card">
          <h3>Crea Programma</h3>
          <div className="form-group">
            <label>Nome Scheda *</label>
            <input 
              type="text" 
              placeholder="es. Spinta (Petto/Spalle/Tricipiti)" 
              value={nomeScheda} 
              onChange={e => setNomeScheda(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label>Descrizione / Note</label>
            <textarea 
              placeholder="es. Focus progressione sui carichi" 
              value={descrizione} 
              onChange={e => setDescrizione(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Esercizi</label>
            {esercizi.map((esercizio, index) => (
              <div key={index} className="esercizio-input-row">
                <input 
                  type="text" 
                  placeholder={`Esercizio ${index + 1}`}
                  value={esercizio} 
                  onChange={e => handleEsercizioChange(index, e.target.value)}
                  required={index === 0}
                />
                {esercizi.length > 1 && (
                  <button type="button" className="btn-remove-line" onClick={() => handleRemoveEsercizioInput(index)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="btn-secondary text-sm" onClick={handleAddEsercizioInput}>
              + Aggiungi Esercizio
            </button>
          </div>

          <button type="submit" className="btn-primary-full">Salva Scheda</button>
        </form>
      )}

      {loading ? (
        <p className="loading-text">Caricamento schede in corso...</p>
      ) : schede.length === 0 ? (
        <div className="empty-state card">
          <p>Non hai ancora creato nessuna scheda di allenamento.</p>
          <p className="hint">Clicca su "Nuova Scheda" in alto per iniziare a configurare la tua routine!</p>
        </div>
      ) : (
        <div className="schede-grid">
          {schede.map(scheda => (
            <div key={scheda.id} className="scheda-card card">
              <div className="scheda-card-header">
                <h4>{scheda.nome}</h4>
                <button className="btn-delete-icon" onClick={() => handleDeleteScheda(scheda.id)}>🗑️</button>
              </div>
              {scheda.descrizione && <p className="scheda-desc">{scheda.descrizione}</p>}
              <div className="scheda-esercizi-preview">
                <h5>Esercizi inclusi ({scheda.esercizi_scheda?.length || 0}):</h5>
                <ul>
                  {scheda.esercizi_scheda?.sort((a,b) => a.ordine - b.ordine).map(es => (
                    <li key={es.id}>{es.nome}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


