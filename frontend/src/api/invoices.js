import api from "./axios";

export const getInvoices    = (params) => api.get("/api/invoices", { params });
export const getInvoiceStats = ()      => api.get("/api/invoices/stats");
export const createInvoice  = (data)   => api.post("/api/invoices", data);
export const bulkInvoice    = (data)   => api.post("/api/invoices/bulk", data);
export const markPaid       = (id, note) => api.put(`/api/invoices/${id}`, { status: "paid", note });
export const updateInvoice  = (id, data) => api.put(`/api/invoices/${id}`, data);
export const deleteInvoice  = (id)    => api.delete(`/api/invoices/${id}`);
