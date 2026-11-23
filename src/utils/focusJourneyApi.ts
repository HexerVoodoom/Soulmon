/** Cliente de `/api/focus-journey` (§247). O servidor é o relógio e o caixa; aqui só se chama e se devolve a resposta. */
import { authHeaders } from './auth';
import type { JourneyGrants, JourneyKeyId, JourneyMode } from './focusJourney';
import type { FocusEnvironmentId } from './focusExpedition';

export interface ActiveJourney {
  sid: string; seed: number; mode: JourneyMode; env: FocusEnvironmentId; keys: JourneyKeyId[]; day: string;
  startAt: number; pausedMs: number; pausedAt: number | null; pauses: number;
}
export interface JourneyResponse {
  active: ActiveJourney | null;
  ledger?: { day: string; items: number; ess: number; done: number };
  grants?: JourneyGrants;
  dungeonKeyDay?: string;
  now: number;
  error?: string;
}

async function call(saveId: string, body?: unknown, day?: string): Promise<JourneyResponse & { status: number }> {
  const qs = new URLSearchParams({ id: saveId, ...(day ? { day } : {}) });
  const auth = await authHeaders();
  const res = await fetch(`/api/focus-journey?${qs.toString()}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json', ...auth } : auth,
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json() as JourneyResponse;
  if (!res.ok && res.status !== 409) throw new Error(j.error || `http ${res.status}`);
  return { ...j, status: res.status };
}

export const journeyState = (saveId: string, day: string) => call(saveId, undefined, day);
export const journeyStart = (saveId: string, p: { mode: JourneyMode; env: FocusEnvironmentId; keys: JourneyKeyId[]; day: string }) => call(saveId, { action: 'start', ...p });
export const journeyAction = (saveId: string, action: 'pause' | 'resume' | 'claim' | 'end') => call(saveId, { action });
