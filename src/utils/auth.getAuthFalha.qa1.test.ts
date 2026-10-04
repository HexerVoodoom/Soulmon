/**
 * QA1 (rodada 6) — `entrarComGoogle` (web) chamava `getAuth()` FORA do try
 * (para o catch poder usar `auth`/`authMod`). Se o carregamento do SDK falha
 * (chunk que não baixou, offline no primeiro toque, `initializeApp` lançando),
 * a promessa REJEITAVA: o portão nem chegava a ler `r.erro`, o botão ficava
 * desabilitado até a rede de 2 minutos (`GOOGLE_SEM_RESPOSTA_MS`) e o erro
 * virava rejeição não tratada. Contrato de todas as outras entradas (`entrarComSenha`,
 * `criarContaComSenha`, nativo): NUNCA lança, devolve `{ ok:false, erro }`.
 */
import { describe, it, expect, vi } from 'vitest';

const estado = { falhaNoSdk: true };

vi.mock('firebase/app', () => ({
  initializeApp: () => ({ name: 'test' }),
  getApps: () => {
    if (estado.falhaNoSdk) throw new Error('Failed to fetch dynamically imported module');
    return [];
  },
}));
vi.mock('firebase/auth', () => ({
  getAuth: () => ({ name: 'auth' }),
  GoogleAuthProvider: class {},
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  setPersistence: vi.fn(async () => {}),
  browserLocalPersistence: 'local',
}));

vi.stubEnv('VITE_FIREBASE_API_KEY', 'chave-de-teste');
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'soulmon-app.firebaseapp.com');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'soulmon-app');

describe('entrarComGoogle — o SDK não carregou', () => {
  it('devolve { ok:false, erro:"rede" } em vez de rejeitar', async () => {
    const { entrarComGoogle } = await import('./auth');
    const r = await entrarComGoogle();
    expect(r.ok).toBe(false);
    expect(r.erro).toBe('rede');
  });
});
