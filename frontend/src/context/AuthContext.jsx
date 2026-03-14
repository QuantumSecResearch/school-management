import { createContext, useContext, useEffect, useState } from "react";
import api, { getCsrfCookie } from "@/api/axios";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Au démarrage : vérifie si on est déjà connecté (cookie de session existant)
  useEffect(() => {
    api.get("/api/user")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    await getCsrfCookie();
    await api.post("/login", { email, password });
    const res = await api.get("/api/user");
    setUser(res.data);
    return res.data; // retourne l'utilisateur pour la redirection par rôle
  }

  // Inscription : le backend connecte déjà l'utilisateur après register,
  // on récupère juste la session existante sans re-poster sur /login
  async function register(name, email, password, passwordConfirmation) {
    await getCsrfCookie();
    await api.post("/register", {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    // Le backend a déjà appelé Auth::login() — on récupère l'utilisateur
    const res = await api.get("/api/user");
    setUser(res.data);
    return res.data; // retourne l'utilisateur pour la redirection par rôle
  }

  async function logout() {
    await api.post("/logout");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
