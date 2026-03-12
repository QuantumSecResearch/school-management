import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,  // envoie les cookies de session (Sanctum)
  withXSRFToken: true,    // Axios 1.x : requis pour envoyer X-XSRF-TOKEN en cross-origin
  xsrfCookieName: "XSRF-TOKEN",      // nom du cookie que Laravel crée
  xsrfHeaderName: "X-XSRF-TOKEN",    // nom du header que Laravel vérifie
});

// Récupère le cookie CSRF de Sanctum — à appeler avant login/register/logout
export async function getCsrfCookie() {
  await api.get("/sanctum/csrf-cookie");
}

export default api;
