// API client for SM Trade backend

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function clearSession() {
  localStorage.removeItem('sm_auth_token');
  localStorage.removeItem('sm_current_user');
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('sm_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && endpoint !== '/auth/login') {
    clearSession();
    if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/verify/')) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API request failed');
  }
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username: email, email, password }) }),
  changePassword: (userId: string, currentPassword: string, newPassword: string) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify({ userId, currentPassword, newPassword }) }),

  // Public verify (QR)
  verifyDocument: (type: string, docId: string) =>
    request<{ document: Record<string, unknown>; settings: Record<string, unknown> | null }>(`/verify/${type}/${docId}`),

  // Users
  getUsers: () => request('/users'),
  createUser: (data: Record<string, unknown>) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: Record<string, unknown>) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),

  // Customers
  getCustomers: () => request('/customers'),
  createCustomer: (data: Record<string, unknown>) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: Record<string, unknown>) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id: string) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: () => request('/products'),
  createProduct: (data: Record<string, unknown>) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Record<string, unknown>) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request(`/products/${id}`, { method: 'DELETE' }),

  // Invoices
  getInvoices: () => request('/invoices'),
  getInvoice: (id: string) => request(`/invoices/${id}`),
  createInvoice: (data: Record<string, unknown>) => request('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id: string, data: Record<string, unknown>) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id: string) => request(`/invoices/${id}`, { method: 'DELETE' }),

  // Quotations
  getQuotations: () => request('/quotations'),
  getQuotation: (id: string) => request(`/quotations/${id}`),
  createQuotation: (data: Record<string, unknown>) => request('/quotations', { method: 'POST', body: JSON.stringify(data) }),
  updateQuotation: (id: string, data: Record<string, unknown>) => request(`/quotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuotation: (id: string) => request(`/quotations/${id}`, { method: 'DELETE' }),

  // Challans
  getChallans: () => request('/challans'),
  getChallan: (id: string) => request(`/challans/${id}`),
  createChallan: (data: Record<string, unknown>) => request('/challans', { method: 'POST', body: JSON.stringify(data) }),
  updateChallan: (id: string, data: Record<string, unknown>) => request(`/challans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteChallan: (id: string) => request(`/challans/${id}`, { method: 'DELETE' }),

  // Purchase Orders
  getPurchaseOrders: () => request('/purchase-orders'),
  getPurchaseOrder: (id: string) => request(`/purchase-orders/${id}`),
  createPurchaseOrder: (data: Record<string, unknown>) => request('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  updatePurchaseOrder: (id: string, data: Record<string, unknown>) => request(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePurchaseOrder: (id: string) => request(`/purchase-orders/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data: Record<string, unknown>) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),
};
