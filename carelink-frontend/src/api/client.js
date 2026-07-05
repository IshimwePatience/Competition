import { clearToken, getToken } from './token';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && getToken()) clearToken();
    throw new ApiError(data.message || 'Request failed', res.status);
  }

  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  registerFacility: (body) => request('/auth/register/facility', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  triagePublic: (body) => request('/triage/public', { method: 'POST', body: JSON.stringify(body) }),
  triageFindMedicines: (body) => request('/triage/find-medicines', { method: 'POST', body: JSON.stringify(body) }),
  triageSymptoms: () => request('/triage/symptoms'),
  facilities: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/facilities${q ? `?${q}` : ''}`);
  },
  facilitiesNearby: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/facilities/nearby?${q}`);
  },
  facility: (id) => request(`/facilities/${id}`),
  createFacility: (body) => request('/facilities', { method: 'POST', body: JSON.stringify(body) }),
  updateFacility: (id, body) => request(`/facilities/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteFacility: (id) => request(`/facilities/${id}`, { method: 'DELETE' }),
  myFacility: () => request('/facilities/me/profile'),
  updateMyFacility: (body) => request('/facilities/me/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  myFacilityStock: () => request('/facilities/me/stock'),
  updateMyFacilityStock: (medicineStock) => request('/facilities/me/stock', { method: 'PUT', body: JSON.stringify({ medicineStock }) }),
  medicineSuggestions: () => request('/facilities/medicines/suggestions'),
  reports: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports${q ? `?${q}` : ''}`);
  },
  submitReport: (facilityId, body) => request(`/reports/${facilityId}`, { method: 'POST', body: JSON.stringify(body) }),
  verifyReport: (id) => request(`/reports/${id}/verify`, { method: 'PATCH' }),
  rejectReport: (id) => request(`/reports/${id}/reject`, { method: 'PATCH' }),
  creditBalance: () => request('/credits/balance'),
  creditHistory: () => request('/credits/history'),
  creditAction: (body) => request('/credits/actions', { method: 'POST', body: JSON.stringify(body) }),
  creditRedeem: () => request('/credits/redeem', { method: 'POST' }),
  notifications: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/notifications${q ? `?${q}` : ''}`);
  },
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  analytics: () => request('/analytics/dashboard'),
  adminAiSnapshot: () => request('/analytics/admin-ai/snapshot'),
  adminAiQuery: (question) => request('/analytics/admin-ai/query', { method: 'POST', body: JSON.stringify({ question }) }),
  users: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/auth/users${q ? `?${q}` : ''}`);
  },
  verifyWorker: (id) => request(`/auth/users/${id}/verify`, { method: 'PATCH' }),
  applyHealthWorker: () => request('/auth/apply-health-worker', { method: 'POST' }),
  createCampaign: (body) => request('/notifications/campaigns', { method: 'POST', body: JSON.stringify(body) }),
  search: (q) => request(`/search?q=${encodeURIComponent(q)}`),
};

export { ApiError };
