import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

// Global security: Disable right-click on the entire website
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  return false;
});

// Global security: Disable copy, cut, paste
document.addEventListener('copy', (e) => {
  e.preventDefault();
  return false;
});
document.addEventListener('cut', (e) => {
  e.preventDefault();
  return false;
});

// Global security: Block keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Block Ctrl+C, Ctrl+A, Ctrl+U (view source), Ctrl+S, Ctrl+P
  if (e.ctrlKey && ['c', 'a', 'u', 's', 'p'].includes(e.key.toLowerCase())) {
    e.preventDefault();
    return false;
  }
  // Block F12 (DevTools)
  if (e.key === 'F12') {
    e.preventDefault();
    return false;
  }
  // Block Ctrl+Shift+I/J/C (DevTools)
  if (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) {
    e.preventDefault();
    return false;
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
