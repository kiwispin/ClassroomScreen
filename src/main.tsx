import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app/App';
import { useAppStore } from './store/store';
import { pruneOrphanImages } from './overlays/Background/cleanup';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

let pruneScheduled = false;
const schedulePrune = () => {
  if (pruneScheduled) return;
  pruneScheduled = true;
  setTimeout(() => {
    pruneScheduled = false;
    pruneOrphanImages(useAppStore.getState()).catch(() => {
      /* ignore */
    });
  }, 1500);
};

useAppStore.subscribe((s, prev) => {
  if (s.current.background !== prev.current.background || s.presets !== prev.presets) {
    schedulePrune();
  }
});

schedulePrune();
