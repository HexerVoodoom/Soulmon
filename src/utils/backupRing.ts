import { STORAGE_KEYS, RECONCILE_KEYS } from './storageKeys';
import { readLocal, writeLocal } from './safeStorage';

/**
 * L08-03 — ANEL de cópias de segurança. `CONFLICT_BACKUP` tem UMA vaga (e o
 * suporte já procura nela); este anel guarda as cópias que iriam sobrescrevê-la.
 * Formato: `{formato:'soulmon-backup-ring-v1', copias:[{saveId,salvoEm,motivo,state}]}`,
 * a mais nova por último, no máximo `ANEL_MAX`. Módulo sem dependência de
 * `cloudSave`/`sessionReset` (evita ciclo e não é alvo dos `vi.mock` deles).
 */
export const ANEL_FORMATO = 'soulmon-backup-ring-v1';
export const ANEL_MAX = 3;

export interface CopiaDoAnel {
  saveId: string;
  salvoEm: string;
  motivo: string;
  state: unknown;
}

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** O save já passou pelo onboarding? (criatura nascida ou uso registrado) — mesma régua da adoção. */
export function saveTemProgresso(state: unknown): boolean {
  if (!ehObjeto(state)) return false;
  const s = state;
  const len = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  return !!s.soulmonMeta || !!s.demoCharacterId
    || len(s.activities) > 0 || len(s.completedTasks) > 0
    || (typeof s.totalXP === 'number' && s.totalXP > 0);
}

/** Leitura tolerante: ausente/ilegível/formato estranho = lista vazia. Nunca lança. */
export function lerAnel(): CopiaDoAnel[] {
  try {
    const bruto = readLocal(RING_KEY());
    if (!bruto) return [];
    const o = JSON.parse(bruto) as unknown;
    if (!ehObjeto(o) || !Array.isArray(o.copias)) return [];
    return o.copias.filter(ehObjeto).map(c => ({
      saveId: typeof c.saveId === 'string' ? c.saveId : '',
      salvoEm: typeof c.salvoEm === 'string' ? c.salvoEm : '',
      motivo: typeof c.motivo === 'string' ? c.motivo : '',
      state: c.state,
    }));
  } catch { return []; }
}

function RING_KEY(): string { return STORAGE_KEYS.BACKUP_RING; }

function mesmaCopia(a: CopiaDoAnel, b: CopiaDoAnel): boolean {
  try { return a.saveId === b.saveId && JSON.stringify(a.state) === JSON.stringify(b.state); } catch { return false; }
}

/** Empurra uma cópia no anel. Idempotente (igual à mais recente = no-op). Nunca lança. */
export function empurrarNoAnel(copia: CopiaDoAnel): boolean {
  try {
    const atual = lerAnel();
    if (atual.length > 0 && mesmaCopia(atual[atual.length - 1], copia)) return true;
    let lista = [...atual, copia].slice(-ANEL_MAX);
    for (;;) {
      const ok = writeLocal(RING_KEY(), JSON.stringify({ formato: ANEL_FORMATO, copias: lista }), { silent: true });
      if (ok) return true;
      if (lista.length <= 1) return false;
      lista = lista.slice(1); // cota: a mais antiga sai
    }
  } catch { return false; }
}

/**
 * Chamar ANTES de escrever em `CONFLICT_BACKUP`: se já há um valor lá, ele vai
 * para o anel (a vaga única não perde a cópia anterior). Nunca lança.
 */
export function preservarConflictBackup(): void {
  try {
    const velho = readLocal(RECONCILE_KEYS.CONFLICT_BACKUP);
    if (!velho) return;
    let c: unknown;
    try { c = JSON.parse(velho); } catch { c = undefined; }
    if (ehObjeto(c) && 'state' in c) {
      empurrarNoAnel({
        saveId: typeof c.saveId === 'string' ? c.saveId : '',
        salvoEm: typeof c.salvoEm === 'string' ? c.salvoEm : '',
        motivo: typeof c.motivo === 'string' ? c.motivo : 'conflito-na-reconciliacao',
        state: c.state,
      });
    } else {
      empurrarNoAnel({ saveId: '', salvoEm: '', motivo: 'conflict-backup-ilegivel', state: velho });
    }
  } catch { /* melhor esforço */ }
}
