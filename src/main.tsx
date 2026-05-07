import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app/App';
import { useAppStore } from './store/store';
import { pruneOrphanImages } from './overlays/Background/cleanup';
import { pruneOrphanAudio } from './lib/audio-storage';
import { startScheduler } from './lib/scheduler';

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
    const s = useAppStore.getState();
    pruneOrphanImages(s).catch(() => { /* ignore */ });
    pruneOrphanAudio(s).catch(() => { /* ignore */ });
  }, 1500);
};

useAppStore.subscribe((s, prev) => {
  if (
    s.current.background !== prev.current.background ||
    s.current.widgets !== prev.current.widgets ||
    s.presets !== prev.presets
  ) {
    schedulePrune();
  }
});

schedulePrune();
startScheduler();
