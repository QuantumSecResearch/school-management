import api from "./axios";

// Dispatcher: retourne le bon dashboard selon le rôle du user connecté
export const getDashboard = () => api.get("/api/dashboard");

// Dashboards dédiés par rôle (aussi accessibles depuis getDashboard via dispatcher)
export const getSuperAdminDashboard  = () => api.get("/api/dashboard/super-admin");
export const getDirectorDashboard    = () => api.get("/api/dashboard/director");
export const getSchoolAdminDashboard = () => api.get("/api/dashboard/school-admin");
export const getFinanceDashboard     = () => api.get("/api/dashboard/finance");
export const getTeacherDashboard     = () => api.get("/api/dashboard/teacher");
export const getStudentDashboard     = () => api.get("/api/dashboard/student");
