// Entry — mounts React app. Keep this minimal to preserve performance.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initializeMonitoring } from "./lib/monitoring";
import "./index.css";

// Initialize monitoring service
initializeMonitoring();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
