import api from "./axios";

export const getSchedules    = (params) => api.get("/api/schedules", { params });
export const addSchedule     = (data)   => api.post("/api/schedules", data);
export const updateSchedule  = (id, data) => api.put(`/api/schedules/${id}`, data);
export const deleteSchedule  = (id)    => api.delete(`/api/schedules/${id}`);
