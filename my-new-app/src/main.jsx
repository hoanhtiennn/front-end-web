import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import axios from "axios";
import "./index.css";
import App from "./App.jsx";

// Thay YOUR_GOOGLE_CLIENT_ID bằng Client ID từ Google Cloud Console
const GOOGLE_CLIENT_ID =
  "976791800553-1affrpu6mi922dfogstiboisalk8gqpi.apps.googleusercontent.com";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
if (API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
