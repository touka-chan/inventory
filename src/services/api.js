const BASE_URL = 'http://localhost:8000/api';

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

async function request(endpoint, options = {}) {
  const headers = { ...options.headers };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const csrfToken = getCookie('csrftoken');
  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) {
    headers['X-CSRFToken'] = csrfToken;
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers,
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  login: (data) => request('/login/', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/me/'),
  logout: () => request('/logout/', { method: 'POST' }),

  getProducts: () => request('/products/'),
  createProduct: (data) => request('/products/', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  archiveProduct: (id) => request(`/products/${id}/`, { method: 'DELETE' }),
  getProductDropdown: () => request('/products/dropdown/'),
  getArchivedProducts: () => request('/products/archived/'),
  unarchiveProduct: (id) => request(`/products/${id}/unarchive/`, { method: 'PATCH' }),
  permanentDeleteProduct: (id) => request(`/products/${id}/permanent_delete/`, { method: 'DELETE' }),

  getCategories: () => request('/categories/'),
  createCategory: (data) => request('/categories/', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}/`, { method: 'DELETE' }),

  getSuppliers: () => request('/suppliers/'),
  createSupplier: (data) => request('/suppliers/', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/suppliers/${id}/`, { method: 'DELETE' }),

  getStockLedger: () => request('/stock-ledger/'),
  createStockLedger: (data) => request('/stock-ledger/', { method: 'POST', body: JSON.stringify(data) }),

  getNotifications: () => request('/notifications/'),
  markNotificationRead: (id) => request(`/notifications/${id}/mark_read/`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/mark_all_read/', { method: 'PUT' }),
  deleteNotification: (id) => request(`/notifications/${id}/`, { method: 'DELETE' }),
  clearAllNotifications: () => request('/notifications/clear_all/', { method: 'DELETE' }),
};
