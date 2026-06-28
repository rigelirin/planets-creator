import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// Note: StrictMode is intentionally omitted. Its dev-only double-invoke of effects
// would double-subscribe our imperative store->material/uniform bridges; we rely on
// single, cleanup-guarded subscriptions instead.
createRoot(document.getElementById('root')!).render(<App />)
