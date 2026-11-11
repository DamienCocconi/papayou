import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
// Police des atouts illustrés, embarquée dans le site (aucun appel à un service externe).
import './ui/styles/fonts.css'
import './ui/styles/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
