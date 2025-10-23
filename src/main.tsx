import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'  // ← ONLY this CSS import
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)