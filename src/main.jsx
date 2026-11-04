import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/variables.css' // <-- Aggiunto per gestire i temi Chiaro/Scuro
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
