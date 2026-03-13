import { useAuth } from "@/context/AuthContext";

/**
 * Hook pour vérifier le rôle de l'utilisateur connecté.
 *
 * Usage:
 *   const { isAdmin, isTeacher, role } = useRole();
 *   if (isAdmin) <button>Supprimer</button>
 */
export function useRole() {
  const { user } = useAuth();

  return {
    role:      user?.role ?? null,
    isAdmin:   user?.role === "admin",
    isTeacher: user?.role === "teacher",
    isStudent: user?.role === "student",
  };
}
