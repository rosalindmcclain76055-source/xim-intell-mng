import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Handle SPA routing redirect from 404.html
if (sessionStorage.redirect) {
  delete sessionStorage.redirect;
}

createRoot(document.getElementById("root")!).render(<App />);