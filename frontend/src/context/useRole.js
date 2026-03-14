import { useAuth } from "@/context/AuthContext";

/**
 * Hook pour vérifier le rôle de l'utilisateur connecté.
 *
 * Rôles disponibles :
 *   super_admin   → accès total
 *   director      → lecture KPI globaux
 *   school_admin  → scolarité (élèves, profs, classes, emploi du temps)
 *   finance_manager → facturation / paiements
 *   teacher       → ses classes uniquement
 *   student       → ses propres données
 *   admin         → legacy (même droits que super_admin)
 */
export function useRole() {
  const { user } = useAuth();
  const role = user?.role ?? null;

  return {
    role,

    // Rôles métier
    isSuperAdmin:    role === "super_admin",
    isDirector:      role === "director",
    isSchoolAdmin:   role === "school_admin",
    isFinanceManager: role === "finance_manager",
    isTeacher:       role === "teacher",
    isStudent:       role === "student",

    // Legacy — true pour "admin" ET "super_admin"
    isAdmin: role === "admin" || role === "super_admin",

    // Helpers agrégés
    /** Peut gérer la scolarité (élèves, profs, classes, emploi du temps) */
    canManageAcademics: ["admin", "super_admin", "school_admin"].includes(role),

    /** Peut gérer les finances (factures, paiements) */
    canManageFinance: ["admin", "super_admin", "finance_manager"].includes(role),

    /** Tout rôle avec accès backend (exclu student et teacher pour certaines pages) */
    isAdminLike: ["admin", "super_admin", "director", "school_admin", "finance_manager"].includes(role),
  };
}
