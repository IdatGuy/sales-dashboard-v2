import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Capture invite/recovery token type before the Supabase SDK processes the URL
// hash and removes it via history.replaceState. This must run before createRoot.
const _hashParams = new URLSearchParams(window.location.hash.substring(1));
const _tokenType = _hashParams.get('type');
if (_tokenType === 'invite' || _tokenType === 'recovery') {
  sessionStorage.setItem('auth_token_type', _tokenType);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
