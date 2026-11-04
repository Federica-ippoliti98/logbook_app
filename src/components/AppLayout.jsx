import { NavLink, Outlet } from 'react-router-dom';
import './AppLayout.css';

export function AppLayout() {
  return (
    <div className="app-container">
      {/* Contenuto della pagina corrente */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Barra di navigazione fissa in basso per Mobile */}
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span>🏋️‍♂️</span>
          <label>Allenati</label>
        </NavLink>
        <NavLink to="/storico" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span>⏱️</span>
          <label>Storico</label>
        </NavLink>
        <NavLink to="/schede" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span>📋</span>
          <label>Schede</label>
        </NavLink>
        <NavLink to="/analisi" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span>✨</span>
          <label>Analisi IA</label>
        </NavLink>
        <NavLink to="/profilo" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span>👤</span>
          <label>Profilo</label>
        </NavLink>
      </nav>
    </div>
  );
}
