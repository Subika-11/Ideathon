// src/utils/api.ts
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

// ── Auth helpers ─────────────────────────────────────────────────────────────

export async function checkIfAlreadyRegistered(phone: string): Promise<{
  registered: boolean;
  name?: string;
  hasCard?: boolean;
}> {
  try {
    return await apiFetch(`/auth/check/${phone}`);
  } catch {
    return { registered: false };
  }
}

export async function requestOTP(phone: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await apiFetch('/auth/send-otp', {
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
    await apiFetch('/auth/verify-otp', {
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
}): Promise<{
  success: boolean;
  userId?: string;
  alreadyRegistered?: boolean;
  existingName?: string;
  error?: string;
}> {
  try {
    return await apiFetch('/auth/save-profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateNfcUid(
  userId: string,
  nfcUid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await apiFetch('/auth/update-nfc', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, nfc_uid: nfcUid }),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function lookupUserByNfcUid(nfcUid: string): Promise<{
  success: boolean;
  user?: { id: string; name: string; phone: string; gender: string };
  error?: string;
}> {
  try {
    return await apiFetch('/auth/lookup-nfc', {
      method: 'POST',
      body: JSON.stringify({ nfc_uid: nfcUid }),
    });
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