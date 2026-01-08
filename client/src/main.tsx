// Entry — mounts React app. Keep this minimal to preserve performance.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from 'virtual:pwa-register';
import App from "./App";
import "./index.css";

// Register Service Worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App is ready to work offline');
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
