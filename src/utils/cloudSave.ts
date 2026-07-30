// Derive a stable save id from an email so the same email = the same cloud
// save on any device, no manual code copying. Matches the server's VALID_ID
// regex (^[a-zA-Z0-9_-]{8,64}$): we return 32 hex chars.
//
// The salt namespaces the hash to THIS product. Soulmon's KV binding
// (DIGIAPP_SAVES) still points at the same underlying namespace as the old
// DigiApp product it was forked from — with a shared "digiapp:" salt, the
// same email hashed to the SAME key in both apps, so logging into Soulmon
// with an email already used in DigiApp loaded DigiApp's (foreign-shaped)
// save instead of creating a fresh Soulmon one. "soulmon:" makes the two
// products derive different keys even while the raw KV storage is shared.
import { authHeaders } from './auth';

export async function emailToSaveId(email: string): Promise<string> {
  const norm = email.trim().toLowerCase();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulmon:${norm}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export async function cloudSave(saveId: string, state: unknown): Promise<void> {
  try {
    await fetch(`/api/save?id=${saveId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ state }),
    });
    localStorage.setItem('digiapp-last-cloud-sync', new Date().toISOString());
  } catch {
    // Silent — local save already persisted
  }
}

export async function cloudLoad(saveId: string): Promise<unknown | null> {
  try {
    const res = await fetch(`/api/save?id=${saveId}`, { headers: await authHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return data.found ? data.state : null;
  } catch {
    return null;
  }
}
