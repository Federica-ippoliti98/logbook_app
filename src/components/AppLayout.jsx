// src/components/AppLayout.jsx
import { NavLink, Outlet } from 'react-router-dom';
import { useRestTimer } from '../context/RestTimerContext';
import './AppLayout.css';

export function AppLayout() {
  const { isActive, formatTime, stopTimer } = useRestTimer();

  return (
    <div className="app-container">
      {/* Banner del Timer Globale Fluttuante */}
      {isActive && (
        <div className="global-timer-banner">
          <span>⏱️ Recupero: <strong>{formatTime()}</strong></span>
          <button onClick={stopTimer} className="btn-stop-timer">Salta</button>
        </div>
      )}

      <main className="main-content" style={{ paddingTop: isActive ? '60px' : '16px' }}>
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span>🏋️‍♂️</span><label>Allenati</label>
        </NavLink>
        <NavLink to="/storico" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span>⏱️</span><label>Storico</label>
        </NavLink>
        <NavLink to="/schede" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span>📋</span><label>Schede</label>
        </NavLink>
        <NavLink to="/analisi" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span>✨</span><label>Analisi IA</label>
        </NavLink>
        <NavLink to="/profilo" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <span>👤</span><label>Profilo</label>
        </NavLink>
      </nav>
    </div>
  );
}
