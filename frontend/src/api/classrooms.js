import api from "./axios";

export const getClassrooms    = ()          => api.get("/api/classrooms");
export const getClassroom     = (id)        => api.get(`/api/classrooms/${id}`);
export const createClassroom  = (data)      => api.post("/api/classrooms", data);
export const updateClassroom  = (id, data)  => api.put(`/api/classrooms/${id}`, data);
export const deleteClassroom  = (id)        => api.delete(`/api/classrooms/${id}`);
export const assignTeachers   = (id, teacherIds) =>
  api.post(`/api/classrooms/${id}/teachers`, { teacher_ids: teacherIds });

export const assignStudents   = (id, studentIds) =>
  api.post(`/api/classrooms/${id}/students`, { student_ids: studentIds });
