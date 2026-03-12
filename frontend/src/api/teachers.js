import api from "./axios";

export const getTeachers = (page = 1, search = "", subject = "") => {
  const params = new URLSearchParams({ page });
  if (search)  params.append("search", search);
  if (subject) params.append("subject", subject);
  return api.get(`/api/teachers?${params.toString()}`);
};

export const getTeacher    = (id)       => api.get(`/api/teachers/${id}`);
export const createTeacher = (data)     => api.post("/api/teachers", data);
export const updateTeacher = (id, data) => api.put(`/api/teachers/${id}`, data);
export const deleteTeacher = (id)       => api.delete(`/api/teachers/${id}`);
