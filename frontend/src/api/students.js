import api from "./axios";

// GET /api/students?page=1&search=...&class=... → liste filtrée et paginée
export const getStudents = (page = 1, search = "", studentClass = "") => {
  const params = new URLSearchParams({ page });
  if (search)       params.append("search", search);
  if (studentClass) params.append("class", studentClass);
  return api.get(`/api/students?${params.toString()}`);
};

// GET /api/students/:id → un seul student
export const getStudent = (id) => api.get(`/api/students/${id}`);

// POST /api/students → créer un student
export const createStudent = (data) => api.post("/api/students", data);

// PUT /api/students/:id → modifier un student
export const updateStudent = (id, data) => api.put(`/api/students/${id}`, data);

// DELETE /api/students/:id → supprimer un student
export const deleteStudent = (id) => api.delete(`/api/students/${id}`);
