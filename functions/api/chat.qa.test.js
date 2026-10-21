import { describe, it, expect } from 'vitest';
import { onRequestPost as chat } from './chat.js';
import { perMinuteGate } from './_aiGuard.js';

// L07-03: anônimo não pode esgotar o balde por minuto de outra conta.
describe('L07-03: chat autentica antes do balde por minuto', () => {
  it('6 POSTs anônimos com o id da vítima não esgotam o balde dela', async () => {
    const store = new Map();
    const KV = { async get(k) { return store.get(k) ?? null; }, async put(k, v) { store.set(k, v); },
      async getWithMetadata(k) { return { value: store.get(k) ?? null, metadata: null }; }, async delete() {}, async list() { return { keys: [] }; } };
    const env = { DIGIAPP_SAVES: KV, SOULMON_SAVES: KV, FIREBASE_PROJECT_ID: 'soulmon-app', GROQ_API_KEY: 'x' };
    const vitima = 'abcdef0123456789abcdef0123456789';
    for (let i = 0; i < 6; i++) {
      const req = new Request('https://x/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: vitima, message: 'oi', language: 'pt-BR' }) });
      const res = await chat({ request: req, env });
      expect(res.status).toBe(401);
    }
    expect(perMinuteGate('chat', vitima)).toBeNull();
  });
});
