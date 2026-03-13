import api from "./axios";

export const getGrades        = (params) => api.get("/api/grades", { params });
export const getStudentGrades = (studentId) => api.get(`/api/students/${studentId}/grades`);
export const addGrade         = (data) => api.post("/api/grades", data);
export const updateGrade      = (id, data) => api.put(`/api/grades/${id}`, data);
export const deleteGrade      = (id) => api.delete(`/api/grades/${id}`);
