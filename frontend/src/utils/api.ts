// src/utils/api.ts — Centralized API client for LegalEdge frontend.
//
// All backend API calls go through this module.
// Features:
//   - JWT token management (localStorage)
//   - Auto-attaches Authorization header
//   - Typed request/response helpers
//   - Error handling with user-friendly messages

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ── Token Management ─────────────────────────────────────────────────────────

const TOKEN_KEY = 'legaledge_token';
const USER_KEY = 'legaledge_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setUser(user: { id: number; name: string }): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): { id: number; name: string } | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// ── Core Fetch Wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Auto-attach JWT token if available
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...options,
  });

  // Handle 401 — token expired or invalid
  if (res.status === 401) {
    clearToken();
    // Don't throw for auth check endpoints
    if (!path.includes('/check/')) {
      const err = await res.json().catch(() => ({ detail: 'Session expired' }));
      throw new Error(err.detail ?? 'Session expired. Please log in again.');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH HELPERS
// ══════════════════════════════════════════════════════════════════════════════

export async function checkIfAlreadyRegistered(phone: string): Promise<{
  registered: boolean;
  name?: string;
  hasCard?: boolean;
}> {
  try {
    return await apiFetch(`/api/auth/check/${phone}`);
  } catch {
    return { registered: false };
  }
}

export async function requestOTP(phone: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await apiFetch('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function verifyOTP(
  phone: string,
  enteredOTP: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await apiFetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp: enteredOTP }),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function saveUserProfile(profile: {
  name: string;
  dob: string;
  gender: string;
  phone: string;
  aadhaar: string;
  password?: string;
}): Promise<{
  success: boolean;
  userId?: number;
  alreadyRegistered?: boolean;
  existingName?: string;
  access_token?: string;
  error?: string;
}> {
  try {
    const result = await apiFetch<any>('/api/auth/save-profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    });

    // Store JWT token if signup was successful
    if (result.success && result.access_token) {
      setToken(result.access_token);
      setUser({ id: result.userId, name: result.name || profile.name });
    }

    return result;
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function loginWithPassword(
  phone: string,
  password: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await apiFetch<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });

    if (result.access_token) {
      setToken(result.access_token);
      setUser({ id: result.user_id, name: result.name });
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateNfcUid(
  userId: number | string,
  nfcUid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await apiFetch('/api/auth/update-nfc', {
      method: 'POST',
      body: JSON.stringify({ user_id: Number(userId), nfc_uid: nfcUid }),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function lookupUserByNfcUid(nfcUid: string): Promise<{
  success: boolean;
  user?: { id: number; name: string; phone: string; gender: string };
  access_token?: string;
  error?: string;
}> {
  try {
    const result = await apiFetch<any>('/api/auth/lookup-nfc', {
      method: 'POST',
      body: JSON.stringify({ nfc_uid: nfcUid }),
    });

    // Store token from NFC login too
    if (result.access_token) {
      setToken(result.access_token);
      if (result.user) {
        setUser({ id: result.user.id, name: result.user.name });
      }
    }

    return result;
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export function generatePlaceholderNfcUid(): string {
  return Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  ).join(':');
}

// ══════════════════════════════════════════════════════════════════════════════
// CASE TRACKING — replaces the old Supabase direct queries
// ══════════════════════════════════════════════════════════════════════════════

export async function searchCaseByCnr(cnr: string): Promise<{
  found: boolean;
  caseData?: any;
  timelineEvents?: any[];
  reminders?: any[];
  error?: string;
}> {
  try {
    const result = await apiFetch<any>(
      `/api/cases/search?cnr=${encodeURIComponent(cnr.toUpperCase())}`
    );

    if (!result.found) {
      return { found: false, error: result.error || 'No case found for this CNR number.' };
    }

    return {
      found: true,
      caseData: result.caseData,
      timelineEvents: result.timelineEvents || [],
      reminders: result.reminders || [],
    };
  } catch (e: any) {
    return { found: false, error: e.message || 'Could not search records. Please try again.' };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// REMINDERS
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchReminders(): Promise<{
  reminders: any[];
  total: number;
  error?: string;
}> {
  try {
    return await apiFetch('/api/reminders');
  } catch (e: any) {
    return { reminders: [], total: 0, error: e.message };
  }
}

export async function createReminder(data: {
  type: string;
  title: string;
  date: string;
  description?: string;
  urgent?: boolean;
  case_id?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await apiFetch('/api/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteReminder(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await apiFetch(`/api/reminders/${id}`, { method: 'DELETE' });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHAT
// ══════════════════════════════════════════════════════════════════════════════

export async function sendChatMessage(
  text: string,
  activeTrack: string | null = null,
  language: string = "en-IN",
  consultationId: number | null = null
): Promise<{
  reply: string;
  active_track: string | null;
  consultation_id: number | null;
  is_final_structured?: boolean;
  structured_data?: any;
  error?: string;
}> {
  try {
    return await apiFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        text, 
        active_track: activeTrack,
        language,
        consultation_id: consultationId
      }),
    });
  } catch (e: any) {
    // Fallback: return a generic error reply so chat doesn't break
    return {
      reply: "I'm having trouble connecting to the server. Please try again.",
      active_track: activeTrack,
      consultation_id: consultationId,
      error: e.message,
    };
  }
}

export async function fetchChatHistory(consultationId?: number): Promise<{
  messages: any[];
  consultation_id?: number | null;
  active_track?: string | null;
  language?: string;
  structured_data?: any;
  error?: string;
}> {
  try {
    const query = consultationId ? `?consultation_id=${consultationId}` : '';
    return await apiFetch(`/api/chat/history${query}`);
  } catch (e: any) {
    return { messages: [], error: e.message };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// USER PROFILE
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchProfile(): Promise<any | null> {
  try {
    return await apiFetch('/api/users/me');
  } catch {
    return null;
  }
}