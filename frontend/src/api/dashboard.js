import api from "./axios";

export const getDashboard        = () => api.get("/api/dashboard");
export const getTeacherDashboard = () => api.get("/api/dashboard/teacher");
export const getStudentDashboard = () => api.get("/api/dashboard/student");
