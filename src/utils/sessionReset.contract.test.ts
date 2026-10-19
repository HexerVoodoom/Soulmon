/**
 * RÉGUA do fim de sessão: (1) a allowlist do que sobrevive ao logout é EXPLÍCITA
 * e travada; (2) toda chave de storage do app é decidida (sai ou fica) — chave
 * nova nasce apagada, e ficar exige entrar na lista E neste teste; (3) as
 * telemetrias privadas de `telemetry.ts` estão todas classificadas; (4) só o
 * dono único apaga o save/identidade e encerra a sessão.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { STORAGE_KEYS, RECONCILE_KEYS } from './storageKeys';
import { SOBREVIVEM_AO_LOGOUT, chavesDaConta } from './sessionReset';

const SRC = resolve(__dirname, '..');

/** A lista aprovada. Mudar = decisão consciente, não efeito colateral. */
const ESPERADO = [
  'soulmon-language', 'soulmon-theme',
  'soulmon-sound-muted',
  'soulmon-sound-prefs-version', 'soulmon-sound-category-volumes', 'soulmon-sound-track-enabled', 'soulmon-sound-theme-off',
  'soulmon-dungeon-speed', 'soulmon-foco-vibrate', 'soulmon-pwa-install-dismissed',
  'soulmon-terms-notice-seen', 'soulmon-terms-notice-shown',
  'soulmon-account-deleted-notice', 'soulmon-pending-login-email',
  'soulmon-reconcile-backup', 'soulmon-previous-save-id',
  'soulmon-telemetry-enabled', 'soulmon-telemetry-id', 'soulmon-telemetry-queue', 'soulmon-telemetry-hidden',
  'soulmon-telemetry-seen', 'soulmon-telemetry-install', 'soulmon-telemetry-music-day',
].sort();

/** Telemetria que é da CONTA (derivada de tier/atividade) e por isso sai. */
const TELEMETRIA_DA_CONTA = ['soulmon-telemetry-tier', 'soulmon-telemetry-week'];

describe('allowlist do que sobrevive ao logout', () => {
  it('é exatamente a lista aprovada', () => {
    expect([...SOBREVIVEM_AO_LOGOUT].sort()).toEqual(ESPERADO);
  });

  it('nenhuma chave de save, identidade, sync, push ou progresso sobrevive', () => {
    const proibidas = [
      STORAGE_KEYS.GAME_STATE, STORAGE_KEYS.SAVE_ID, STORAGE_KEYS.USER_EMAIL, STORAGE_KEYS.USER_NAME,
      STORAGE_KEYS.LAST_CLOUD_SYNC, STORAGE_KEYS.SYNC_PENDING, STORAGE_KEYS.FCM_TOKEN,
      STORAGE_KEYS.ONBOARDING_COMPLETE, STORAGE_KEYS.TUTORIAL_COMPLETE, STORAGE_KEYS.AI_SETTINGS,
      STORAGE_KEYS.SOULMON_PROFILE, STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, STORAGE_KEYS.NOTIFICATIONS_ENABLED,
      STORAGE_KEYS.GUILD_CLAIMED, STORAGE_KEYS.CADERNO,
    ];
    for (const k of proibidas) expect(SOBREVIVEM_AO_LOGOUT, k).not.toContain(k);
  });

  it('toda chave do dicionário ou é apagada ou está na allowlist (sem terceira via)', () => {
    const apaga = new Set(chavesDaConta());
    for (const k of Object.values(STORAGE_KEYS)) {
      expect(apaga.has(k) !== SOBREVIVEM_AO_LOGOUT.includes(k), k).toBe(true);
    }
  });

  it('as chaves privadas de telemetry.ts estão todas classificadas', () => {
    const fonte = readFileSync(join(SRC, 'utils/telemetry.ts'), 'utf8');
    const chaves = [...fonte.matchAll(/const K_[A-Z_]+ = '(soulmon-telemetry-[a-z-]+)'/g)].map(m => m[1]);
    expect(chaves.length).toBeGreaterThanOrEqual(9);
    for (const k of chaves) {
      const classificada = SOBREVIVEM_AO_LOGOUT.includes(k) || TELEMETRIA_DA_CONTA.includes(k);
      expect(classificada, `${k} sem decisão de logout`).toBe(true);
    }
    for (const k of TELEMETRIA_DA_CONTA) expect(chavesDaConta()).toContain(k);
  });

  it('o rastro forense continua fora do alcance da limpeza', () => {
    for (const k of Object.values(RECONCILE_KEYS)) expect(chavesDaConta()).not.toContain(k);
  });
});

function fontes(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) { fontes(f, out); continue; }
    if (/\.(ts|tsx)$/.test(e) && !/\.test\.(ts|tsx)$/.test(e) && !f.replace(/\\/g, '/').includes('/src/test/')) out.push(f);
  }
  return out;
}

describe('um dono só para sair', () => {
  const rel = (f: string) => f.slice(SRC.length + 1).replace(/\\/g, '/');
  it('`signOut` só é chamado por sessionReset (fim de sessão) e pelo login de lápide', () => {
    const chamam = fontes(SRC).filter(f => /\bsignOut\(/.test(readFileSync(f, 'utf8'))).map(rel).sort();
    // auth.ts define; cloudSave.ts `checarContaExcluidaNoLogin` encerra a sessão que ACABOU de nascer (sem estado local a limpar).
    expect(chamam).toEqual(['utils/auth.ts', 'utils/cloudSave.ts', 'utils/sessionReset.ts']);
  });
  it('apagar o save/identidade local é exclusividade de sessionReset (e do `leaveDemo`, que não tem conta)', () => {
    const apagam = fontes(SRC)
      .filter(f => /removeLocal\(\s*STORAGE_KEYS\.(GAME_STATE|SAVE_ID)\b/.test(readFileSync(f, 'utf8'))).map(rel).sort();
    expect(apagam).toEqual(['utils/demoStart.ts']);
  });
});
