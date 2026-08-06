// Ensure window.fetch has both getter and setter in iframe environments
try {
  let _fetch = window.fetch;
  Object.defineProperty(window, 'fetch', {
    get() {
      return _fetch;
    },
    set(v) {
      _fetch = v;
    },
    configurable: true,
    enumerable: true,
  });
} catch {
  // ignore if already non-configurable
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
