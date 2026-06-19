const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const API_BASE = API_URL ? `${API_URL}/api/admin` : '/api/admin';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Oturum sona erdi');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'İstek başarısız');
  return data;
}

export const api = {
  login: (email: string, password: string) =>
    fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Giriş başarısız');
      return data;
    }),

  me: () => request<{ id: string; email: string; name: string }>('/me'),

  getDashboard: () =>
    request<{
      totalLicenses: number;
      activeLicenses: number;
      expiredLicenses: number;
      expiringSoon: number;
      licensesByProgram: { programId: string; programName: string; appCode: string; count: number }[];
    }>('/dashboard'),

  getPrograms: () => request<Program[]>('/programs'),
  createProgram: (data: Partial<Program>) =>
    request<Program>('/programs', { method: 'POST', body: JSON.stringify(data) }),

  getCustomers: (search?: string) =>
    request<Customer[]>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createCustomer: (data: Partial<Customer>) =>
    request<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),

  getLicenses: (params?: { search?: string; programId?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.programId) q.set('programId', params.programId);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return request<LicenseListItem[]>(`/licenses${qs ? `?${qs}` : ''}`);
  },

  getLicense: (id: string) => request<LicenseDetail>(`/licenses/${id}`),

  createLicense: (data: CreateLicenseData) =>
    request<CreateLicenseResult>('/licenses', { method: 'POST', body: JSON.stringify(data) }),

  extendLicense: (id: string, days: number) =>
    request<LicenseDetail>(`/licenses/${id}/extend`, {
      method: 'POST',
      body: JSON.stringify({ days }),
    }),

  enableLicense: (id: string) =>
    request<LicenseDetail>(`/licenses/${id}/enable`, { method: 'POST' }),

  disableLicense: (id: string) =>
    request<LicenseDetail>(`/licenses/${id}/disable`, { method: 'POST' }),

  resetDevices: (id: string) =>
    request<LicenseDetail>(`/licenses/${id}/reset-devices`, { method: 'POST' }),

  regeneratePassword: (id: string) =>
    request<{ activationPassword: string; warning: string }>(
      `/licenses/${id}/regenerate-password`,
      { method: 'POST' }
    ),

  sendMail: (id: string, activationPassword: string, downloadUrl?: string) =>
    request<{ sent: boolean; error?: string }>(`/licenses/${id}/send-mail`, {
      method: 'POST',
      body: JSON.stringify({ activationPassword, downloadUrl }),
    }),
};

export interface Program {
  id: string;
  appCode: string;
  name: string;
  description?: string;
  defaultLicenseDays: number;
  defaultMaxDevices: number;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  notes?: string;
}

export interface LicenseListItem {
  id: string;
  licenseKey: string;
  customer: Customer;
  program: Program;
  expiresAt: string;
  status: string;
  effectiveStatus: string;
  activeDeviceCount: number;
  maxDevices: number;
  daysUntilExpiry: number;
}

export interface LicenseDevice {
  id: string;
  deviceHash: string;
  deviceName?: string;
  platform?: string;
  appVersion?: string;
  firstActivatedAt: string;
  lastValidatedAt: string;
  status: string;
}

export interface LicenseEvent {
  id: string;
  eventType: string;
  message?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface LicenseDetail extends LicenseListItem {
  startsAt: string;
  notes?: string;
  source: string;
  devices: LicenseDevice[];
  events: LicenseEvent[];
}

export interface CreateLicenseData {
  customerId?: string;
  newCustomer?: Partial<Customer>;
  programId: string;
  startsAt?: string;
  expiresAt?: string;
  licenseDays?: number;
  maxDevices?: number;
  notes?: string;
  sendMail?: boolean;
  downloadUrl?: string;
}

export interface CreateLicenseResult {
  license: LicenseDetail;
  activationPassword: string;
  mailResult?: { sent: boolean; error?: string };
  warning: string;
}
