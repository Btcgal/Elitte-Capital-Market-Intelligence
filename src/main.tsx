import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ClientProvider } from './context/ClientContext';
import { TutorialProvider } from './context/TutorialContext';
import { ThesisProvider } from './context/ThesisContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClientProvider>
      <TutorialProvider>
        <ThesisProvider>
          <App />
        </ThesisProvider>
      </TutorialProvider>
    </ClientProvider>
  </StrictMode>,
);
