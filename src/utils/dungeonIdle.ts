// 🕳️ A DESCIDA IDLE da Masmorra (decisão do dono, 08/10/2026 — REGISTRO-DE-DECISOES, masmorra).
//
// Este arquivo é o DONO ÚNICO das constantes e das contas puras da descida automática. Nenhuma regra de
// COMBATE mora aqui (o motor da luta é `utils/combate/` e `utils/dungeonFight.ts`, intocados): só o ritmo,
// o HP que persiste no save e a profundidade. Funções PURAS: `now` sempre por parâmetro, sem localStorage.
//
//  - As lutas encadeiam sozinhas: uma a cada `DUNGEON_AUTO_FIGHT_MS` entre o fim de uma e o começo da próxima.
//  - A cada `DUNGEON_FIGHTS_PER_FLOOR` (6, a escada inteira) o jogador desce um andar. SEM teto de andares: o
//    que encerra a descida é o HP chegar a zero (a dificuldade de `dungeonFoe`/`DUNGEON_FLOOR_GROWTH` cresce).
//  - O HP NÃO enche entre uma descida e outra. Ele é guardado no save como `{ frac, at }` e é SEMPRE lido com
//    `hpAgora(state, now)`: regenera por TIMESTAMP (nunca por tick), inclusive com o app fechado.
//  - Regenerar é recuperação, não punição: nunca custa coração nem Bits, e não compra vantagem de combate.
//
// Mora FORA de `dungeon.ts` de propósito e NÃO importa nada: o Guia/Ajuda leem as constantes daqui, e importar
// `dungeon.ts` arrastaria sprites e o núcleo de combate para o chunk de entrada (`orcamentoDeBytes.contract.test.ts`).
// (`DUNGEON_FIGHTS_PER_FLOOR` = `LADDER_TIERS.length`: a igualdade é travada em `dungeonIdle.test.ts`.)

/** Pausa entre o fim de uma luta e o começo da próxima (ritmo visível do idle). Ajustável pelo dono. */
export const DUNGEON_AUTO_FIGHT_MS = 4000;

/** Lutas por andar: a escada inteira (baby-i → mega). */
export const DUNGEON_FIGHTS_PER_FLOOR = 6;

/** O MARCO: limpar este andar (uma vez por descida) rende o item raro (o 🌀) e sobe a base semanal. Era o fim da run (`MAX_FLOORS` = 5). */
export const DUNGEON_MILESTONE_FLOOR = 5;

/** Horas para o HP ir de ZERO a CHEIO, parado ou com o app fechado. O dono ajusta este número. */
export const DUNGEON_HP_REGEN_FULL_HOURS = 4;

/** Piso para ENTRAR numa descida, em % do HP máximo (evita o laço de morte imediata). Com 4 h de regen, 25% = 1 h de espera no pior caso. */
export const DUNGEON_MIN_HP_TO_ENTER_PCT = 25;

/** O que fica no save: fração do HP máximo (0..1) e o instante (epoch ms) em que ela foi medida. */
export interface DungeonHpRecord { frac: number; at: number }
export interface DungeonHpState { dungeonHp?: DungeonHpRecord }

const FULL_MS = DUNGEON_HP_REGEN_FULL_HOURS * 3_600_000;

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/** Higieniza o que veio do disco/nuvem. Lixo → `undefined` (= HP cheio, sem dívida retroativa). */
export function sanitizeDungeonHp(raw: unknown): DungeonHpRecord | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as { frac?: unknown; at?: unknown };
  if (typeof r.frac !== 'number' || typeof r.at !== 'number' || !Number.isFinite(r.frac) || !Number.isFinite(r.at)) return undefined;
  return { frac: clamp01(r.frac), at: Math.max(0, r.at) };
}

/**
 * O HP do jogador na masmorra AGORA, como fração do máximo (0..1). Sem registro = cheio. Relógio que voltou
 * (`now < at`) não regenera nem tira: vale a fração gravada. Nunca passa de 1.
 */
export function hpAgora(state: DungeonHpState, now: number): number {
  const rec = state.dungeonHp;
  if (!rec) return 1;
  const elapsed = Math.max(0, now - rec.at);
  return clamp01(rec.frac + elapsed / FULL_MS);
}

/** O registro a gravar: a fração medida agora. */
export function gravarHp(frac: number, now: number): DungeonHpRecord {
  return { frac: clamp01(frac), at: now };
}

/** Pode descer? (HP de agora ≥ piso.) */
export function podeDescer(state: DungeonHpState, now: number): boolean {
  return hpAgora(state, now) * 100 >= DUNGEON_MIN_HP_TO_ENTER_PCT - 1e-9;
}

/** Milissegundos até o HP chegar ao piso (0 se já pode descer). */
export function msAteDescer(state: DungeonHpState, now: number): number {
  const faltam = DUNGEON_MIN_HP_TO_ENTER_PCT / 100 - hpAgora(state, now);
  return faltam <= 1e-9 ? 0 : Math.ceil(faltam * FULL_MS);
}

/** A posição na descida: a luta de número `n` (0-based) cai no andar `floor` (1-based), no `slot` da escada. */
export function posicaoDaLuta(n: number): { floor: number; slot: number } {
  const i = Math.max(0, Math.floor(n));
  return { floor: Math.floor(i / DUNGEON_FIGHTS_PER_FLOOR) + 1, slot: i % DUNGEON_FIGHTS_PER_FLOOR };
}

/** Texto curto de espera ("1 h 05 min" / "1h 05m"), arredondado PARA CIMA em minutos. */
export function formatarEspera(ms: number, pt: boolean): string {
  const min = Math.max(1, Math.ceil(ms / 60_000));
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return pt ? `${m} min` : `${m}m`;
  return pt ? `${h} h ${String(m).padStart(2, '0')} min` : `${h}h ${String(m).padStart(2, '0')}m`;
}
