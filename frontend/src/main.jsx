import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import App from './App.jsx'

// For deep links (?view=voter / ?view=home), start the route chunk fetch while
// React mounts instead of waiting for Suspense to ask for it. The lazy import
// in App.jsx reuses this same in-flight request.
const initialView = new URLSearchParams(window.location.search).get('view')
if (initialView === 'voter') {
  import('./Dashboard.jsx')
} else if (initialView === 'home') {
  import('./StagePickApp.jsx')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
