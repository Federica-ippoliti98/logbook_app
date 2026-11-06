// ============================================================================
// TAPPA 1: Importazione di Router, Contesti, Guardiani e Layout
// OBIETTIVO: Caricare l'infrastruttura di routing e tutti i wrapper globali di contesto e layout creati in precedenza.
// TEORIA DA STUDIARE PRIMA:
// - Architettura a Matrioska (Composizione): Comprendere come i moduli indipendenti convergano nel file radice per avvolgere l'intera applicazione.
// PASSAGGI LOGICI:
// 1. Importare BrowserRouter, Routes e Route dal pacchetto di gestione della navigazione.
// 2. Importare AuthProvider, ThemeProvider, useTheme, ProtectedRoute e AppLayout dai rispettivi percorsi del progetto.
// ============================================================================
import { supabase } from './lib/supabase';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { Login } from './pages/Login';
import { Schede } from './pages/Schede';
import { RestTimerProvider } from './context/RestTimerContext';
import { Dashboard } from './pages/Dashboard';
import { Storico } from './pages/Storico';
import { AnalisiIA } from './pages/AnalisiIA';
import { Profilo } from './pages/Profilo';
import { Esercizi } from './pages/Esercizi';
import { ModificaScheda } from './pages/ModificaScheda';
import { IniziaAllenamento } from './pages/IniziaAllenamento';
import { WorkoutSessione } from './pages/WorkoutSessione';






// ============================================================================
// TAPPA 4: Configurazione dell'Albero dei Provider (Nesting di Contesti)
// OBIETTIVO: Configurare i punti di ingresso dei dati inserendo i Provider nel corretto ordine di dipendenza logica.
// TEORIA DA STUDIARE PRIMA:
// - Provider Nesting Order: Capire perché i contesti strutturali e applicativi più importanti (Autenticazione) devono stare sopra a quelli di navigazione o di stile.
// PASSAGGI LOGICI:
// 1. Aprire il tag esterno <AuthProvider> per distribuire le informazioni utente.
// 2. Inserire all'interno <ThemeProvider> per distribuire i dati di stile.
// 3. Inserire <BrowserRouter> per attivare la gestione degli URL del browser su tutto l'albero interno.
// • Errori da evitare: Invertire i provider inserendo componenti di routing o di stile al di sopra di AuthProvider se questi dipendono dall'identità dell'utente.
// ============================================================================
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RestTimerProvider>
          <BrowserRouter>
            {/* ============================================================================
                TAPPA 5: Definizione dell'Albero delle Rotte Pubbliche e Protette
                OBIETTIVO: Mappare le corrispondenze tra i percorsi URL e i rispettivi componenti visivi, blindando i percorsi privati.
                TEORIA DA STUDIARE PRIMA:
                - Gestore <Routes> e Nodi <Route>: Istruzioni di React Router per raggruppare i percorsi e dichiarare i parametri path ed element.
                - Rotte Annidate (Nested Routing): Utilizzo di una rotta genitore come layout strutturale comune per un gruppo di sotto-rotte.
                - Indice di Rotta (index): Configurare la vista di default che appare quando il percorso corrisponde esattamente al path del genitore.
                - Composizione del Guardiano: Inserire il componente di layout direttamente dentro al guardiano <ProtectedRoute> nell'attributo element della rotta genitore.
                PASSAGGI LOGICI:
                1. Aprire il contenitore globale <Routes>.
                2. Configurare la rotta isolata e pubblica path="/login" assegnandole il componente Login.
                3. Creare la rotta radice privata path="/" avvolgendo il layout <AppLayout /> all'interno del guardiano <ProtectedRoute>.
                4. All'interno della rotta radice privata, inserire le sotto-rotte figlie: configurare Dashboard come "index", e assegnare i path relativi per storico, schede, analisi e profilo.
                • Errori da evitare: Inserire uno slash iniziale (es. path="/profilo") nelle rotte figlie annidate, rompendo la risoluzione automatica dei percorsi relativi di React Router.
                ============================================================================ */}
            <Routes>
              {/* Rotte Pubbliche */}
              <Route path="/login" element={<Login />} />

              {/* Rotte Protette all'interno del Layout Navigabile */}
              <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="storico" element={<Storico />} />
                <Route path="schede" element={<Schede />} />
                <Route path="analisi" element={<AnalisiIA />} />
                <Route path="profilo" element={<Profilo />} />
                <Route path="esercizi" element={<Esercizi />} />
                <Route path="schede/:id" element={<ModificaScheda />} />
                <Route path="inizia" element={<IniziaAllenamento />} />
                <Route path="allenamento/:id" element={<WorkoutSessione />} />



              </Route>
            </Routes>
          </BrowserRouter>
        </RestTimerProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
