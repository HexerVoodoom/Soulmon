// Sincronização com o save do app mobile/web — MESMO mecanismo de
// src/utils/cloudSave.ts: e-mail → SHA-256 → saveId, GET em /api/save.
//
// ⚠️ O salt tem que ser `soulmon:` (e o corte em 32 chars). Se divergir de
// src/utils/cloudSave.ts ou de functions/api/_auth.js, o desktop lê um save
// que não existe e mostra um bicho genérico sem dar nenhum erro visível.
//
// v1 é SOMENTE LEITURA: mostramos o estado real, mas as ações do menu ainda
// ficam no estado local (ver state.ts e a fase 2b do
// docs/PLANO-DESKTOP-STEAM.md).
import { APP_URL } from './config';
import type { GenericLine } from './sprites';

/** Espelha MAX_HP_BY_FORM (src/types/progression.ts). */
const MAX_HP_BY_LEVEL: Record<string, number> = {
  rookie: 3, champion: 3, ultimate: 3, mega: 4, ultra: 5,
};
/** Espelha FORM_REQUIREMENTS[].required — barras de energia = tarefas exigidas. */
const ENERGY_BY_LEVEL: Record<string, number> = {
  rookie: 4, champion: 5, ultimate: 6, mega: 7, ultra: 8,
};

/**
 * Espelha getStageLevel (src/types/progression.ts) para o esquema de ids do
 * Soulmon. Não importamos o módulo direto porque ele arrasta o roster legado
 * da masmorra, que o desktop não usa — a regra de prefixo é a mesma.
 */
function stageLevel(stage: string): string {
  if (stage === 'rookie' || stage === 'ultra') return stage;
  const prefix = stage.split('-')[0];
  return prefix === 'champion' || prefix === 'ultimate' || prefix === 'mega' ? prefix : 'rookie';
}

export async function emailToSaveId(email: string): Promise<string> {
  const norm = email.trim().toLowerCase();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulmon:${norm}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export interface RemoteSnapshot {
  stage: string;
  stageName: string;
  genericLine: GenericLine;
  demoCharacterId?: string;
  hearts: number;
  maxHearts: number;
  energy: number;
  maxEnergy: number;
  food: number;
}

export type SyncResult =
  | { ok: true; snapshot: RemoteSnapshot }
  | { ok: false; reason: 'not-found' | 'unauthenticated' | 'network' };

interface RemoteStage { stage?: string; branch?: string; name?: string }

/** Nome de exibição da forma atual, procurado na árvore única do jogador. */
function stageDisplayName(state: Record<string, unknown>, stageId: string): string {
  const stages = state.soulmonStages as RemoteStage[] | undefined;
  const meta = state.soulmonMeta as { baseName?: string } | undefined;
  if (Array.isArray(stages)) {
    const level = stageLevel(stageId);
    const branch = stageId.split('-')[1];
    // O oráculo usa outro vocabulário para nível e branch, então casamos pelo
    // que der: primeiro nível+branch, depois só nível.
    const match = stages.find(s => {
      const sLevel = stageLevel(`${s.stage}${s.branch ? `-${s.branch}` : ''}`);
      return sLevel === level && (!branch || !s.branch || s.branch === branch);
    });
    if (match?.name) return match.name;
  }
  return meta?.baseName ?? 'Soulmon';
}

/**
 * Busca o save real e extrai o que o overlay precisa.
 *
 * Manda o ID token quando o app de desktop tem uma sessão (ver
 * electron/auth-preload.js). Sem token, o servidor só recusa se
 * `FIREBASE_PROJECT_ID` estiver ligado — nesse caso devolvemos
 * `unauthenticated` para a UI pedir login em vez de dizer "save não
 * encontrado", que mandaria o usuário caçar o problema no lugar errado.
 */
export async function fetchRemoteSnapshot(email: string): Promise<SyncResult> {
  const saveId = await emailToSaveId(email);
  const session = (await window.soulmonDesktop?.getAuth()) ?? null;
  const headers: Record<string, string> = session ? { Authorization: `Bearer ${session.token}` } : {};

  let res: Response;
  try {
    res = await fetch(`${APP_URL}/api/save?id=${saveId}`, { headers });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 401 || res.status === 403) return { ok: false, reason: 'unauthenticated' };
  if (!res.ok) return { ok: false, reason: 'network' };

  const data = await res.json().catch(() => null);
  if (!data?.found || !data.state) return { ok: false, reason: 'not-found' };

  const state = data.state as Record<string, unknown>;
  const stage = typeof state.evolutionStage === 'string' ? state.evolutionStage : 'rookie';
  const level = stageLevel(stage);
  const rawLine = state.eggType;
  const genericLine: GenericLine =
    rawLine === 'veemon' || rawLine === 'salamon' || rawLine === 'tapirmon' ? rawLine : 'tapirmon';
  const inventory = (state.foodInventory ?? {}) as Record<string, number>;

  return {
    ok: true,
    snapshot: {
      stage,
      stageName: stageDisplayName(state, stage),
      genericLine,
      demoCharacterId: typeof state.demoCharacterId === 'string' ? state.demoCharacterId : undefined,
      hearts: typeof state.healthPoints === 'number' ? state.healthPoints : 1,
      maxHearts: MAX_HP_BY_LEVEL[level] ?? 3,
      energy: typeof state.energyPoints === 'number' ? state.energyPoints : 0,
      maxEnergy: ENERGY_BY_LEVEL[level] ?? 4,
      food: Object.values(inventory).reduce<number>((sum, n) => sum + (Number(n) || 0), 0),
    },
  };
}
