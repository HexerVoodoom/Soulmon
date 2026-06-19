export async function cloudSave(saveId: string, state: unknown): Promise<void> {
  try {
    await fetch(`/api/save?id=${saveId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    });
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
