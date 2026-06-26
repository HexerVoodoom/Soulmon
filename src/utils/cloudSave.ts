// Derive a stable save id from an email so the same email = the same cloud
// save on any device, no manual code copying. Matches the server's VALID_ID
// regex (^[a-zA-Z0-9_-]{8,64}$): we return 32 hex chars.
export async function emailToSaveId(email: string): Promise<string> {
  const norm = email.trim().toLowerCase();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`digiapp:${norm}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export async function cloudSave(saveId: string, state: unknown): Promise<void> {
  try {
    await fetch(`/api/save?id=${saveId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    });
    localStorage.setItem('digiapp-last-cloud-sync', new Date().toISOString());
  } catch {
    // Silent — local save already persisted
  }
}

export async function cloudLoad(saveId: string): Promise<unknown | null> {
  try {
    const res = await fetch(`/api/save?id=${saveId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.found ? data.state : null;
  } catch {
    return null;
  }
}
