import { createRoot } from 'react-dom/client'
import './app.css'
import App from './App.tsx'

console.log('[System] App Bootstrapping...');

// 暫時關閉 StrictMode 以解決 Supabase AbortError
// https://github.com/supabase/supabase-js/issues/1 (React 18 StrictMode causes double fetch)
createRoot(document.getElementById('root')!).render(
  <App />,
)
