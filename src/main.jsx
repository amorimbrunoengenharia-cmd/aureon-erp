import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DataProvider } from './context/DataContext'
import { ThemeProvider } from './context/ThemeContext'
// import { AuthProvider } from './context/AuthContext' // Versão antiga (localStorage)
import { AuthProvider } from './context/AuthContextAPI' // Versão nova (API + JWT)
import { SimulationProvider } from './context/SimulationContext'
import { FinanceProvider } from './context/FinanceContext'
import { PrescriptionProvider } from './context/PrescriptionContext'
import { registerServiceWorker } from './utils/serviceWorker'

// Registrar Service Worker para modo offline
if (import.meta.env.PROD) {
  registerServiceWorker().catch(console.error);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SimulationProvider>
      <AuthProvider>
        <DataProvider>
          <PrescriptionProvider>
            <FinanceProvider>
              <ThemeProvider>
                <App />
              </ThemeProvider>
            </FinanceProvider>
          </PrescriptionProvider>
        </DataProvider>
      </AuthProvider>
    </SimulationProvider>
  </StrictMode>,
)
