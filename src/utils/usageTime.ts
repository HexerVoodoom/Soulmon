/**
 * TEMPO DE USO por tela / feature / minigame (09/11/2026, `docs/PLANO-METRICAS.md`).
 *
 * Decisão do dono: AGREGADO, soma no aparelho, sem série por pessoa. O aparelho acumula os segundos do dia por (tipo, nome) e, quando o
 * dia passa, manda UM `time_spent` por par com a FAIXA do total (nunca segundos, nunca hora). O servidor só soma em histogramas.
 *
 * Regras: pausa em segundo plano (`visibilitychange`); só conta com a telemetria ligada; opt-out apaga o acumulado
 * (`setTelemetryEnabled(false)` remove `K_USAGE`); nunca lança, nunca bloqueia render (princípio 5 de `telemetry.ts`).
 * Os REGISTROS de nome são espelhados em `functions/api/_usageRegistry.js` (`usageTime.test.ts` trava a paridade): só se acrescenta no fim.
 */
import { readJson, writeJson, removeLocal } from './safeStorage';
import { track, isTelemetryEnabled, telemetryDayKey, K_USAGE } from './telemetry';

export type TimeKind = 'screen' | 'feature' | 'minigame';
export const TIME_KINDS: readonly TimeKind[] = ['screen', 'feature', 'minigame'];
export const TIME_SCREENS = ['home', 'map', 'area:mercado', 'area:jogos', 'area:arena', 'area:exploracao', 'area:forja', 'area:laboratorio', 'area:hall', 'page:settings', 'page:oracle'] as const;
export const TIME_FEATURES = [
  'mercado.itens', 'mercado.conquistas', 'mercado.decoracao', 'mercado.background', 'forja.ferreiro', 'forja.hexsmith',
  'jogos.salao', 'exploracao.dungeon', 'jogos.mente', 'arena.duelo', 'arena.torneio', 'arena.guerra',
  'exploracao.passeio', 'exploracao.fenda', 'forja.caderno', 'forja.oficina', 'forja.refugio',
  'laboratorio.evolucao', 'laboratorio.pet', 'laboratorio.stats', 'laboratorio.perfil', 'laboratorio.biblioteca', 'laboratorio.amigos',
  'hall.guilda', 'hall.feira', 'hall.grove',
] as const;
export const TIME_MINIGAMES = ['masmorra', 'dino', 'ppt', 'match3', 'barrage', 'eco', 'zip', 'selo', 'respiracao', 'bolhas-calmas', 'chama'] as const;
export const TIME_REGISTRY: readonly (readonly string[])[] = [TIME_SCREENS, TIME_FEATURES, TIME_MINIGAMES];

export const TIME_BAND_EDGES = [5, 10, 20, 30, 60, 120, 180, 300, 600, 1200, 2400] as const;
export const TIME_BAND_MID = [2, 7, 15, 25, 45, 90, 150, 240, 450, 900, 1800, 3000] as const;

/** Faixa 0..11 de um total em segundos. */
export function timeBand(seconds: number): number {
  const s = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  let b = 0;
  while (b < TIME_BAND_EDGES.length && s >= TIME_BAND_EDGES[b]) b++;
  return b;
}

/** Índice de (tipo, nome) no registro, ou -1 (nome fora do registro não gera evento). */
export function timeItemIndex(kind: TimeKind, name: string): number {
  return TIME_REGISTRY[TIME_KINDS.indexOf(kind)].indexOf(name);
}

/** O que mora no aparelho: ms acumulados por dia e por `kind:name`. */
type Ledger = Record<string, Record<string, number>>;
/* O servidor aceita dia de até 7 dias atrás (`MAX_DAY_SKEW_DAYS`): guardar além disso só produziria evento recusado. */
const MAX_DAYS_KEPT = 6;
/** Um par fica de fora se somou menos que isto no dia (toque acidental não vira linha de agregado). */
const MIN_SECONDS = 1;
/** Teto de um dia por par: um relógio errado não gera 40 min+ à toa. */
const MAX_DAY_MS = 16 * 3600 * 1000;

let ledger: Ledger | null = null;
const active: Record<TimeKind, { name: string; since: number } | null> = { screen: null, feature: null, minigame: null };
let hidden = false;
/* Sessão: tempo visível contínuo, fechada quando o app fica oculto por mais de SESSION_GAP_MS. */
const SESSION_GAP_MS = 30 * 60 * 1000;
let sessionMs = 0;
let sessionSince = -1;
let hiddenAt = 0;

const nowMs = (): number => Date.now();
const load = (): Ledger => {
  if (!ledger) {
    const raw = readJson<unknown>(K_USAGE, {});
    ledger = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Ledger) : {};
  }
  return ledger;
};
const save = (): void => { try { if (ledger) writeJson(K_USAGE, ledger, { silent: true }); } catch { /* princípio 5 */ } };

function add(kind: TimeKind, name: string, ms: number, day = telemetryDayKey()): void {
  if (!(ms > 0) || timeItemIndex(kind, name) < 0) return;
  const l = load();
  const d = (l[day] ??= {});
  const k = `${kind}:${name}`;
  d[k] = Math.min(MAX_DAY_MS, (d[k] ?? 0) + ms);
  const days = Object.keys(l).sort();
  while (days.length > MAX_DAYS_KEPT) delete l[days.shift() as string];
}

function closeActive(kind: TimeKind, at: number): void {
  const a = active[kind];
  if (!a) return;
  add(kind, a.name, at - a.since);
  active[kind] = null;
}

/**
 * Passa a contar `name` para o tipo (`null` = ninguém ocupa o tipo agora). Trocar fecha o anterior. Idempotente para o mesmo nome.
 * Chamar de dentro de um efeito do React é seguro.
 */
export function setActive(kind: TimeKind, name: string | null): void {
  try {
    if (!isTelemetryEnabled()) { active[kind] = null; return; }
    const at = nowMs();
    if (active[kind]?.name === name) return;
    closeActive(kind, at);
    if (name && !hidden) active[kind] = { name, since: at };
    else if (name) active[kind] = { name, since: -1 }; // aberto com o app oculto: começa a contar ao voltar
    save();
  } catch { /* princípio 5 */ }
}

function endSession(): void {
  if (sessionMs >= 3000) track('session_end', { band: timeBand(sessionMs / 1000), build: appBuild() });
  sessionMs = 0;
}
function appBuild(): number {
  const raw = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '';
  const n = Number(raw.split('.').join('')) || 0; // 1.3.0 -> 130: só precisa distinguir versões entre si
  return Math.max(0, Math.min(9999, Math.floor(n)));
}

function pause(): void {
  const at = nowMs();
  if (sessionSince >= 0) { sessionMs += at - sessionSince; sessionSince = -1; }
  hiddenAt = at;
  for (const kind of TIME_KINDS) {
    const a = active[kind];
    if (a && a.since >= 0) { add(kind, a.name, at - a.since); active[kind] = { name: a.name, since: -1 }; }
  }
  hidden = true;
  save();
}
function resume(): void {
  const at = nowMs();
  if (hiddenAt && at - hiddenAt > SESSION_GAP_MS) endSession();
  sessionSince = at;
  for (const kind of TIME_KINDS) { const a = active[kind]; if (a) active[kind] = { name: a.name, since: at }; }
  hidden = false;
}

/** Manda os totais dos dias já FECHADOS (anteriores a `today`) e os apaga do aparelho. Devolve quantos eventos saíram. */
export function flushUsageDays(today: string = telemetryDayKey()): number {
  try {
    if (!isTelemetryEnabled()) return 0;
    const l = load();
    let n = 0;
    for (const day of Object.keys(l).sort()) {
      if (day >= today) continue;
      for (const [key, ms] of Object.entries(l[day])) {
        const [kind, name] = [key.slice(0, key.indexOf(':')) as TimeKind, key.slice(key.indexOf(':') + 1)];
        const item = timeItemIndex(kind, name);
        if (item < 0 || ms / 1000 < MIN_SECONDS) continue;
        track('time_spent', { kind: TIME_KINDS.indexOf(kind), item, band: timeBand(ms / 1000) }, day);
        n++;
      }
      delete l[day];
    }
    save();
    return n;
  } catch { return 0; }
}

/** Apaga tudo (opt-out). */
export function clearUsageTime(): void {
  ledger = {};
  for (const kind of TIME_KINDS) active[kind] = null;
  try { removeLocal(K_USAGE, { silent: true }); } catch { /* idem */ }
}

/* Resultado que a tela de resultado informou para a partida em andamento (0 vitória · 1 derrota); sem informe = "saiu" (2). */
let pendingOutcome: 0 | 1 | undefined;
let runningMinigames = 0;
/** A tela de resultado chama isto ao aparecer. Sem partida rastreada em andamento, não faz nada. */
export function noteMinigameOutcome(outcome: 0 | 1): void {
  if (runningMinigames > 0) pendingOutcome = outcome;
}

/** Minigame: `begin` conta a partida e devolve `end(outcome)` (0 vitória · 1 derrota · 2 saiu). Idempotente: o 2º `end` não faz nada. */
export function trackMinigame(name: string): (outcome?: 0 | 1 | 2) => void {
  const item = TIME_MINIGAMES.indexOf(name as typeof TIME_MINIGAMES[number]);
  if (item < 0) return () => {};
  const started = nowMs();
  let done = false;
  runningMinigames++;
  pendingOutcome = undefined;
  track('minigame_start', { item });
  return (outcome) => {
    if (done) return;
    done = true;
    runningMinigames = Math.max(0, runningMinigames - 1);
    const final = outcome ?? pendingOutcome ?? 2;
    pendingOutcome = undefined;
    try {
      track('minigame_end', { item, outcome: final, band: timeBand((nowMs() - started) / 1000) });
    } catch { /* princípio 5 */ }
  };
}

/** Liga a pausa em segundo plano e solta o acumulado dos dias fechados. Chamar UMA vez no boot; devolve o desligador. */
export function installUsageTime(): () => void {
  try {
    const doc = (globalThis as { document?: Document }).document;
    hidden = doc?.visibilityState === 'hidden';
    if (!hidden) sessionSince = nowMs();
    flushUsageDays();
    if (!doc?.addEventListener) return () => {};
    const onVis = () => {
      if (doc.visibilityState === 'hidden') pause();
      else { resume(); flushUsageDays(); }
    };
    doc.addEventListener('visibilitychange', onVis);
    return () => { try { doc.removeEventListener('visibilitychange', onVis); } catch { /* idem */ } };
  } catch { return () => {}; }
}

/** Só para teste. */
export function resetUsageTimeForTest(): void {
  clearUsageTime();
  ledger = null;
  hidden = false;
  sessionMs = 0;
  sessionSince = -1;
  hiddenAt = 0;
  pendingOutcome = undefined;
  runningMinigames = 0;
}
