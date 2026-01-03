import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.tsx'
import './styles/index.css'
import { AuthProvider } from './app/context/AuthContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
