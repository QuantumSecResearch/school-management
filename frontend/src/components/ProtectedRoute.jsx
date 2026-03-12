import { Navigate } from "react-router";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Pendant la vérification de session, on n'affiche rien
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Chargement...
      </div>
    );
  }

  // Non connecté → redirige vers login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Connecté → affiche la page demandée
  return children;
}
