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
// Mora FORA de `dungeon.ts` de propósito e só importa dois módulos SEM dependências (`types/progression`, `gates`): o Guia/Ajuda leem as constantes daqui, e importar
// `dungeon.ts` arrastaria sprites e o núcleo de combate para o chunk de entrada (`orcamentoDeBytes.contract.test.ts`).
// (`DUNGEON_FIGHTS_PER_FLOOR` = `LADDER_TIERS.length`: a igualdade é travada em `dungeonIdle.test.ts`.)

import { STAGE_LEVEL_CAPS } from '../types/progression';
import { MASMORRA_ALTO_A_PARTIR_DO_ANDAR, masmorraFloorOpen } from './gates';

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

// ─────────────────────────────────────────────────────────────────────────────
// 🔋 ENERGIA, PROFUNDIDADE ATÉ 999 E RECOMPENSAS (decisão do dono, 11/10/2026 — REGISTRO §31).
//
// A masmorra virou o recurso IDLE de retorno. Três regras, todas puras e com dono aqui:
//  1. CADA CAMADA (a "fase") GASTA ENERGIA — a MESMA energia da Home (enche comendo, zera na virada; máximo
//     `getMaxEnergyForStage`, requisito × 2). Não existe uma segunda energia. Sem energia a descida para com
//     uma frase calma; nunca custa coração nem Bits.
//  2. A PROFUNDIDADE vai de 1 a `DUNGEON_MAX_LAYER` (999). O inimigo continua RELATIVO ao level (combate v3,
//     `dungeonFoe` intocado, `DUNGEON_FLOOR_GROWTH` intocado): o que muda com a força do Soulmon é a ZONA DE
//     CONFORTO (`comfortLayers`) — as camadas até ela lutam na dificuldade do andar 1; daí para baixo a
//     dificuldade sobe como sempre subiu, e a parede medida (andar efetivo ~5–6) cai `comfortLayers(L)` camadas
//     mais fundo. Quem fez tarefas e hábitos com constância tem Lv mais alto (dias completos + estágio), e por
//     isso desce mais. O TETO declarado é `dungeonLayerCap` (zona + margem, e o portão do Vínculo de `gates.ts`).
//  3. O RECORDE (`dungeonDepthRecord` no save) é o ponto de retorno: cada descida começa no último marco de
//     `DUNGEON_MILESTONE_FLOOR` camadas já limpo (`startLayerFor`). Bater um marco de profundidade pela 1ª vez
//     (`DUNGEON_DEPTH_MARKS`) rende fragmentos do Soulsmith — material, nunca Bits e nunca equipamento sorteado.
// ─────────────────────────────────────────────────────────────────────────────

/** Energia gasta ao COMEÇAR cada camada (a 1ª inclusive). Leve (~2 de energia/dia) = 2 camadas; médio (3–4) = 3–4; intenso até o máximo do estágio (8–12). */
export const DUNGEON_ENERGY_PER_LAYER = 1;

/** A camada mais funda que existe. */
export const DUNGEON_MAX_LAYER = 999;

/** Camadas além da zona de conforto que o teto do Lv deixa tentar: a parede medida cai entre +4 e +6 (média 5,35). */
export const DUNGEON_CAP_MARGIN = 6;

/** O Lv mais alto do combate (ultra no topo): é nele que a zona de conforto chega à camada 999. */
const TOP_LEVEL = STAGE_LEVEL_CAPS[STAGE_LEVEL_CAPS.length - 1];

const int = (n: unknown, d = 0): number => (typeof n === 'number' && Number.isFinite(n) ? Math.floor(n) : d);

/**
 * Quantas camadas um Soulmon de Lv `level` atravessa na dificuldade do andar 1. Curva QUADRÁTICA (o começo é
 * curto e o fim é longo): Lv 1 → 0 · Lv 6 → 16 · Lv 13 → 95 · Lv 21 → 263 · Lv 30 → 552 · Lv 40 → 999.
 */
export function comfortLayers(level: number): number {
  const L = Math.min(TOP_LEVEL, Math.max(1, int(level, 1)));
  return Math.round(DUNGEON_MAX_LAYER * ((L - 1) / (TOP_LEVEL - 1)) ** 2);
}

/** O "andar" que o núcleo de combate enxerga (`dungeonFoe`/`buildDungeonWave`) para a camada `layer`. */
export function effectiveFloor(layer: number, level: number): number {
  return 1 + Math.max(0, Math.max(1, int(layer, 1)) - 1 - comfortLayers(level));
}

/**
 * O TETO de camadas do Lv (e do Vínculo): `min(999, zona + margem)`, e enquanto o portão `masmorraAlto` estiver
 * fechado, a última camada antes dele. É o que a tela promete: "com mais Lv, mais fundo".
 */
export function dungeonLayerCap(level: number, bondLevel: number): number {
  const byLevel = Math.min(DUNGEON_MAX_LAYER, comfortLayers(level) + DUNGEON_CAP_MARGIN);
  return masmorraFloorOpen(MASMORRA_ALTO_A_PARTIR_DO_ANDAR, bondLevel)
    ? byLevel
    : Math.min(byLevel, MASMORRA_ALTO_A_PARTIR_DO_ANDAR - 1);
}

/** Higieniza o recorde vindo do save/nuvem: inteiro em [0, 999]. */
export function sanitizeDepthRecord(raw: unknown): number {
  return Math.min(DUNGEON_MAX_LAYER, Math.max(0, int(raw, 0)));
}

/** Onde a descida começa: logo depois do último marco (múltiplo de `DUNGEON_MILESTONE_FLOOR`) já limpo, sem passar do teto. */
export function startLayerFor(record: number, cap: number): number {
  const lim = Math.min(sanitizeDepthRecord(record), Math.max(1, int(cap, 1)) - 1);
  return 1 + DUNGEON_MILESTONE_FLOOR * Math.floor(Math.max(0, lim) / DUNGEON_MILESTONE_FLOOR);
}

/** A camada `layer` é um marco da descida (o item 🌀 1× por descida, no primeiro)? */
export function isMilestoneLayer(layer: number): boolean {
  return int(layer) > 0 && int(layer) % DUNGEON_MILESTONE_FLOOR === 0;
}

/** Dá para pagar a próxima camada? */
export function canPayLayer(energy: unknown): boolean {
  return int(energy) >= DUNGEON_ENERGY_PER_LAYER;
}

/** Quantas camadas a energia de agora paga. */
export function layersAffordable(energy: unknown): number {
  return Math.max(0, Math.floor(int(energy) / DUNGEON_ENERGY_PER_LAYER));
}

/** Gasta a energia de UMA camada. Sem energia devolve a MESMA referência (o updater não muda nada). */
export function spendLayerEnergy<T extends { energyPoints: number }>(prev: T): T {
  if (!canPayLayer(prev.energyPoints)) return prev;
  return { ...prev, energyPoints: int(prev.energyPoints) - DUNGEON_ENERGY_PER_LAYER };
}

/** Os marcos de PROFUNDIDADE (recorde, 1× na vida) e os fragmentos do Soulsmith de cada um. Material, nunca Bits. */
export const DUNGEON_DEPTH_MARKS: readonly { readonly layer: number; readonly fragments: number }[] = [
  { layer: 5, fragments: 5 },
  { layer: 10, fragments: 10 },
  { layer: 25, fragments: 15 },
  { layer: 50, fragments: 20 },
  { layer: 100, fragments: 30 },
  { layer: 250, fragments: 40 },
  { layer: 500, fragments: 50 },
  { layer: 999, fragments: 100 },
];

/** Os marcos que um recorde novo cruza (`oldRecord` < marco ≤ `newRecord`). Recorde que não sobe = nenhum. */
export function depthMarksCrossed(oldRecord: number, newRecord: number) {
  const a = sanitizeDepthRecord(oldRecord);
  const b = sanitizeDepthRecord(newRecord);
  return DUNGEON_DEPTH_MARKS.filter(m => m.layer > a && m.layer <= b);
}

/**
 * Registra uma camada LIMPA no save: sobe o recorde (nunca desce) e devolve os marcos cruzados. Idempotente:
 * a mesma camada de novo não cruza nada.
 */
export function recordLayerCleared<T extends { dungeonDepthRecord?: number }>(prev: T, layer: number): { next: T; marks: ReturnType<typeof depthMarksCrossed> } {
  const old = sanitizeDepthRecord(prev.dungeonDepthRecord);
  const nova = Math.max(old, sanitizeDepthRecord(layer));
  if (nova === old) return { next: prev, marks: [] };
  return { next: { ...prev, dungeonDepthRecord: nova }, marks: depthMarksCrossed(old, nova) };
}

// ─────────────────────────────────────────────────────────────────────────────
// ⏩ VELOCIDADE E 🏠 A DESCIDA QUE CONTINUA SOZINHA (pedido do dono, 11/10/2026 — REGISTRO §36).
//
//  · VELOCIDADE (1×/2×/3×): só encurta o RELÓGIO da cena e a pausa entre lutas. O núcleo de combate decide a luta
//    pela semente e não lê o relógio de parede, então o resultado é o MESMO em qualquer velocidade (teste:
//    `dungeonAway.test.ts` e `useGroupBattle.velocidade.test.tsx`). A preferência mora no aparelho (`STORAGE_KEYS.DUNGEON_SPEED`).
//  · A DESCIDA IDLE (`dungeonAway` no save): sair da tela NÃO cancela. O que fica gravado é a posição da descida
//    (camada, lugar na escada, HP, energia do especial, semente, um instantâneo do jogador); quem calcula o avanço
//    ao voltar é a conta pura de `utils/dungeonAway.ts`, sobre o relógio e com TETO de tempo fora. Enquanto o registro
//    existe o Soulmon está OCUPADO (`soulmonNaMasmorra`): nada que use o Soulmon abre até ele ser retirado.
// ─────────────────────────────────────────────────────────────────────────────

/** As velocidades da cena de combate da masmorra. */
export const DUNGEON_SPEEDS = [1, 2, 3] as const;
export type DungeonSpeed = (typeof DUNGEON_SPEEDS)[number];

/** Lixo/ausente → 1×. */
export function sanitizeDungeonSpeed(raw: unknown): DungeonSpeed {
  const n = typeof raw === 'string' ? Number(raw) : raw;
  return (DUNGEON_SPEEDS as readonly number[]).includes(n as number) ? (n as DungeonSpeed) : 1;
}

/** Próxima velocidade do botão do canto (1 → 2 → 3 → 1). */
export function nextDungeonSpeed(s: DungeonSpeed): DungeonSpeed {
  return DUNGEON_SPEEDS[(DUNGEON_SPEEDS.indexOf(s) + 1) % DUNGEON_SPEEDS.length];
}

/** Quanto tempo fora a descida idle conta, no máximo (ms). Passou disso, o que sobrou não rende (nem custa) nada. */
export const DUNGEON_AWAY_MAX_HOURS = 8;
export const DUNGEON_AWAY_MAX_MS = DUNGEON_AWAY_MAX_HOURS * 3_600_000;

/** O instantâneo do jogador gravado com a descida: a conta fora do app não depende de hook nem de tela. */
export interface DungeonAwayPlayer {
  level: number; atk: number; def: number; spd: number; hp: number; bonus: number;
  /** Família do especial (`SpecialFamily`). */
  fam: string;
  /** Id do ofício da ficha (ausente = jeito padrão). */
  prof?: string;
  /** `tal-pve-07`: escudo de largada; `tal-pve-03`: cura extra entre camadas; `riftBits`: Bits a mais por ganho. */
  sh: number; hb: number; rb: number;
  /** Estágio de evolução (decide os sprites/chaves do bestiário dos inimigos). */
  stage: string;
}

/** A descida em andamento (campo `dungeonAway` do save). Opcional: ausente = o Soulmon não está na masmorra. */
export interface DungeonAway {
  /** Instante (epoch ms) a que a posição abaixo se refere. */
  since: number;
  /** Semente da descida (decide ondas e lutas). */
  seed: number;
  /** Camada atual e o lugar da PRÓXIMA luta na escada (0..5; 6 = a camada foi limpa e a descida para a de baixo ainda não aconteceu). */
  layer: number;
  slot: number;
  /** HP (fração) e energia do especial (0..ENERGY_TRIGGER) que passam para a próxima luta. */
  hp: number;
  en: number;
  /** O marco do andar 5 desta descida já foi pago. */
  ms: boolean;
  player: DungeonAwayPlayer;
}

const numIn = (x: unknown, d: number, lo: number, hi: number): number =>
  typeof x === 'number' && Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d;

/** Higieniza o que veio do disco/nuvem. Qualquer campo ruim → `undefined` (= o Soulmon não está na masmorra). */
export function sanitizeDungeonAway(raw: unknown): DungeonAway | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  const p = r.player && typeof r.player === 'object' && !Array.isArray(r.player) ? r.player as Record<string, unknown> : null;
  if (!p || typeof r.since !== 'number' || !Number.isFinite(r.since) || typeof r.seed !== 'number' || !Number.isFinite(r.seed)) return undefined;
  if (typeof p.fam !== 'string' || typeof p.stage !== 'string' || p.fam.length > 40 || p.stage.length > 80) return undefined;
  const prof = typeof p.prof === 'string' && p.prof.length <= 40 ? p.prof : undefined;
  return {
    since: Math.max(0, r.since),
    seed: Math.trunc(r.seed) | 0,
    layer: Math.trunc(numIn(r.layer, 1, 1, DUNGEON_MAX_LAYER)),
    slot: Math.trunc(numIn(r.slot, 0, 0, DUNGEON_FIGHTS_PER_FLOOR)),
    hp: numIn(r.hp, 1, 0, 1),
    en: numIn(r.en, 0, 0, 100),
    ms: r.ms === true,
    player: {
      level: Math.trunc(numIn(p.level, 1, 1, TOP_LEVEL)),
      atk: numIn(p.atk, 1, 0, 1e6), def: numIn(p.def, 1, 0, 1e6), spd: numIn(p.spd, 1, 0, 1e6), hp: numIn(p.hp, 1, 1, 1e7), bonus: numIn(p.bonus, 0, 0, 10),
      fam: p.fam, prof, sh: numIn(p.sh, 0, 0, 1), hb: numIn(p.hb, 0, 0, 1), rb: numIn(p.rb, 0, 0, 10), stage: p.stage,
    },
  };
}

/** O Soulmon está na masmorra (descida idle em andamento)? É o ÚNICO critério de "ocupado". */
export function soulmonNaMasmorra(state: { dungeonAway?: DungeonAway | null } | null | undefined): boolean {
  return !!state?.dungeonAway;
}
