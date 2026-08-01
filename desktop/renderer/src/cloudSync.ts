// Sincronização com o save do app mobile/web — MESMO mecanismo de
// src/utils/cloudSave.ts: e-mail → SHA-256 → saveId, GET em /api/save.
//
// ⚠️ O salt tem que ser `soulmon:` (e o corte em 32 chars). Se divergir de
// src/utils/cloudSave.ts ou de functions/api/_auth.js, o desktop lê um save
// que não existe e mostra um bicho genérico sem dar nenhum erro visível.
//
// Leitura (fetchRemoteSnapshot) e ESCRITA de volta (pushCareAction) das ações
// de cuidado. As regras aplicadas são as de src/utils/careRules.ts — as mesmas
// do app do celular, não uma cópia. Tarefas continuam locais (ver menu.ts).
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

/**
 * O servidor exige login? (`FIREBASE_PROJECT_ID` definido lá.)
 *
 * Em caso de dúvida responde `true`: é melhor pedir login à toa do que deixar
 * o campo de e-mail livre num servidor que já exige token — aí o usuário
 * levaria um 403 sem entender o motivo.
 */
export async function isAuthRequired(): Promise<boolean> {
  try {
    const res = await fetch(`${APP_URL}/api/config`);
    if (!res.ok) return true;
    const data = await res.json();
    return data?.authRequired !== false;
  } catch {
    return true;
  }
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
  /** Pastinha de comida do save (emoji → quantidade). */
  foodInventory: Record<string, number>;
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
      foodInventory: (state.foodInventory ?? {}) as Record<string, number>,
    },
  };
}

// ───────────────────────────────────────────────────────── escrita de volta

export type PushResult =
  | { ok: true; snapshot: RemoteSnapshot }
  | { ok: false; reason: 'not-found' | 'unauthenticated' | 'network' | 'refused' };

/**
 * Aplica uma ação de cuidado no save REAL (o mesmo do celular).
 *
 * Sempre **relê antes de escrever**: o KV é last-write-wins, então mandar um
 * estado montado a partir do cache local apagaria o que o celular fez desde a
 * última sincronização. Reler → mutar → gravar mantém a janela de conflito em
 * uma ida e volta.
 *
 * `mutate` recebe o GameState inteiro e devolve o novo, ou `null` para
 * desistir (ex.: acabou a comida entre a leitura e a ação). As regras vêm de
 * `src/utils/careRules.ts` — as MESMAS do app do celular, não uma cópia.
 */
export async function pushCareAction(
  email: string,
  mutate: (state: Record<string, unknown>) => Record<string, unknown> | null,
): Promise<PushResult> {
  const saveId = await emailToSaveId(email);
  const session = (await window.soulmonDesktop?.getAuth()) ?? null;
  const authHeader: Record<string, string> = session ? { Authorization: `Bearer ${session.token}` } : {};

  let current: Record<string, unknown>;
  try {
    const res = await fetch(`${APP_URL}/api/save?id=${saveId}`, { headers: authHeader });
    if (res.status === 401 || res.status === 403) return { ok: false, reason: 'unauthenticated' };
    if (!res.ok) return { ok: false, reason: 'network' };
    const data = await res.json().catch(() => null);
    if (!data?.found || !data.state) return { ok: false, reason: 'not-found' };
    current = data.state as Record<string, unknown>;
  } catch {
    return { ok: false, reason: 'network' };
  }

  const next = mutate(normalizeForRules(current));
  if (!next) return { ok: false, reason: 'refused' };
  // Rede de segurança: uma regra aplicada sobre um save incompleto pode gerar
  // NaN (ex.: Math.min(undefined, x)), e JSON.stringify(NaN) vira `null` —
  // gravar isso destruiria o progresso do jogador em silêncio. Melhor desistir
  // da ação do que salvar lixo.
  if (!isSaneCareState(next)) {
    console.error('desktop: mutação gerou estado inválido, escrita abortada');
    return { ok: false, reason: 'refused' };
  }

  try {
    const res = await fetch(`${APP_URL}/api/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      // `accountTier`/`credits` são removidos pelo servidor de qualquer jeito
      // (functions/api/save.js) — o cliente nunca decide dinheiro.
      body: JSON.stringify({ id: saveId, state: next }),
    });
    if (res.status === 401 || res.status === 403) return { ok: false, reason: 'unauthenticated' };
    if (!res.ok) return { ok: false, reason: 'network' };
  } catch {
    return { ok: false, reason: 'network' };
  }

  return { ok: true, snapshot: snapshotOf(next) };
}

/**
 * Completa os campos derivados que as regras de cuidado leem.
 *
 * `maxHealthPoints` é DERIVADO do estágio — o próprio app o recalcula ao
 * carregar o save (GameStateContext). Um save antigo, ou salvo por uma versão
 * anterior, pode não ter o campo; sem isto `Math.min(undefined, …)` viraria NaN
 * e apagaria o HP do jogador.
 */
export function normalizeForRules(state: Record<string, unknown>): Record<string, unknown> {
  const stage = typeof state.evolutionStage === 'string' ? state.evolutionStage : 'rookie';
  const level = stageLevel(stage);
  return {
    ...state,
    healthPoints: Number.isFinite(state.healthPoints as number) ? state.healthPoints : 1,
    maxHealthPoints: MAX_HP_BY_LEVEL[level] ?? 3,
    energyPoints: Number.isFinite(state.energyPoints as number) ? state.energyPoints : 0,
    foodInventory: (state.foodInventory ?? {}) as Record<string, number>,
    virusPoints: Number(state.virusPoints) || 0,
    dataPoints: Number(state.dataPoints) || 0,
    vaccinePoints: Number(state.vaccinePoints) || 0,
    totalXP: Number(state.totalXP) || 0,
    attributesSinceLastEvolution: (state.attributesSinceLastEvolution
      ?? { virus: 0, data: 0, vaccine: 0 }) as Record<string, number>,
  };
}

/** Os números que acabamos de mexer continuam sendo números? */
export function isSaneCareState(state: Record<string, unknown>): boolean {
  const nums = ['healthPoints', 'maxHealthPoints', 'energyPoints', 'virusPoints', 'dataPoints', 'vaccinePoints', 'totalXP'];
  if (!nums.every(k => Number.isFinite(state[k] as number))) return false;
  const inv = state.foodInventory as Record<string, number> | undefined;
  if (inv && Object.values(inv).some(n => !Number.isFinite(n) || n < 0)) return false;
  return (state.healthPoints as number) >= 0;
}

/** Extrai o snapshot de exibição de um GameState já em mãos. */
function snapshotOf(state: Record<string, unknown>): RemoteSnapshot {
  const stage = typeof state.evolutionStage === 'string' ? state.evolutionStage : 'rookie';
  const level = stageLevel(stage);
  const rawLine = state.eggType;
  return {
    stage,
    stageName: stageDisplayName(state, stage),
    genericLine: rawLine === 'veemon' || rawLine === 'salamon' || rawLine === 'tapirmon' ? rawLine : 'tapirmon',
    demoCharacterId: typeof state.demoCharacterId === 'string' ? state.demoCharacterId : undefined,
    hearts: typeof state.healthPoints === 'number' ? state.healthPoints : 1,
    maxHearts: MAX_HP_BY_LEVEL[level] ?? 3,
    energy: typeof state.energyPoints === 'number' ? state.energyPoints : 0,
    maxEnergy: ENERGY_BY_LEVEL[level] ?? 4,
    foodInventory: (state.foodInventory ?? {}) as Record<string, number>,
  };
}
