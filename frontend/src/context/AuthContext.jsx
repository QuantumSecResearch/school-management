import { createContext, useContext, useEffect, useState } from "react";
import api, { getCsrfCookie } from "@/api/axios";

const AuthContext = createContext(null);

// Hook pour utiliser l'auth dans n'importe quelle page
// Usage: const { user, login, logout } = useAuth()
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // utilisateur connecté ou null
  const [loading, setLoading] = useState(true); // true pendant qu'on vérifie la session

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
  }

  async function logout() {
    await api.post("/logout");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
