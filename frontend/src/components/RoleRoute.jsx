import { Navigate } from "react-router";
import { useAuth } from "@/context/AuthContext";

/**
 * Garde de route par rôle.
 *
 * Usage :
 *   <RoleRoute roles={["admin"]}>
 *     <AdminPage />
 *   </RoleRoute>
 *
 *   <RoleRoute roles={["admin", "teacher"]}>
 *     <SharedPage />
 *   </RoleRoute>
 *
 * - Non connecté  → redirige vers /login
 * - Rôle refusé   → redirige vers /dashboard (page d'accueil selon le rôle)
 */
export default function RoleRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
