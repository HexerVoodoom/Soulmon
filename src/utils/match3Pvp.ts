/**
 * ELEMENTAL FUSION — o modo PVP (1 contra 1) e o sorteio de elementos misturados, a regra PURA (pedido do dono, 26/10/2026; invertido em 17/11/2026, REGISTRO §473).
 *
 * Duas coisas moram aqui:
 *  1. OS ELEMENTOS MISTURADOS: 6 sorteados por semente do pool INTEIRO de ícones de elemento (base E mistos), sem repetir. Desde §473 isto é da
 *     AVENTURA (ex-Normal/PvE). O PVP é o contrário: os 6 elementos básicos FIXOS de `M3_TILE_ELEMENTS`, sem sorteio.
 *  2. O OPONENTE do PVP: SEMPRE um jogador. O SERVIDOR sorteia (a mesma rota `opponents` do Torneio, `_rankedPick.js`: perto da faixa de quem
 *     pede, inclusive os simulados = "jogador real fake"); o cliente escolhe o de level mais PARECIDO. Sem ninguém (offline, pool vazio) cai num
 *     jogador SIMULADO local (`simulatedFoe`: arte de criatura do roster no level do jogador), nunca num inimigo genérico. Nome de pessoa e número
 *     de ranking NUNCA chegam à tela: só o Soulmon e o level.
 *
 * Recompensa do PVP (`pvpRewards`): Bits = o combate médio da Arena (`ARENA_FIGHT_BITS`) só na vitória, mais Honra como a do Torneio
 * (`EMBLEMS_PER_WIN`/`EMBLEMS_PER_LOSS`). Os Bits passam pelo funil único com os tetos do dia; este módulo não credita nada.
 * Determinístico: o `rng` vem por PARÂMETRO (`mulberry32`), nunca `Math.random`.
 */
import { mulberry32 } from './combate/rng';
import { elementIconIds } from './elementIconArt';
import { BASE_ELEMENT_LABELS, DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { CURATED_ELEMENT_NAMES } from './elementosCurados';
import { essenceEn } from './soulProfile/essenceLabels';
import { M3_KINDS, type Rng } from './match3';
import { M3_MIN_DELTA_E, pickM3Distinct, type M3Limiares } from './match3Cores';
import { pickEnemy, type RosterEntry } from './enemyRoster';
import { rosterEntryElement } from './spriteElement';
import { ARENA_FIGHT_BITS } from './arena';
import { EMBLEMS_PER_LOSS, EMBLEMS_PER_WIN } from './currencies';

/** Quantos elementos entram no tabuleiro da Aventura (= `M3_KINDS`: a lógica do tabuleiro não muda, só o ícone de cada tipo). */
export const MIXED_ELEMENT_COUNT = M3_KINDS;

/** Ids sem ícone de peça: `neutro` não é elemento de combate (SUPOSIÇÃO: o dono pediu "elementos", e neutro é a ausência de um). */
const FORA_DO_POOL: ReadonlySet<string> = new Set(['neutro']);

/** O pool inteiro de ícones de elemento (base + mistos), em ordem fixa (ordenado) para o sorteio ser determinístico. */
export function mixedElementPool(): string[] {
  return elementIconIds().filter(id => !FORA_DO_POOL.has(id)).sort();
}

/** `n` elementos DISTINTOS do `pool`, sorteados pelo `rng` (Fisher-Yates parcial). Pool menor que `n` devolve o que houver. */
export function pickMixedElements(rng: Rng, pool: readonly string[] = mixedElementPool(), n: number = MIXED_ELEMENT_COUNT): string[] {
  const arr = [...pool];
  const out: string[] = [];
  for (let i = 0; i < n && arr.length > 0; i++) {
    out.push(arr.splice(Math.min(arr.length - 1, Math.floor(rng() * arr.length)), 1)[0]);
  }
  return out;
}

/**
 * Sorteio guloso com semente: embaralha o pool com o `rng` e aceita um ícone só se não forma par da lista curada com nenhum já aceito
 * e fica a ΔE ≥ limiar de todos (regras e constantes em `match3Cores.ts`, REGISTRO §400). Se não fechar `n`, o limiar relaxa aos
 * poucos sobre a MESMA ordem embaralhada; a lista curada não relaxa. Determinístico pelo `rng`.
 */
export function pickDistinctMixedElements(rng: Rng, pool: readonly string[] = mixedElementPool(), n: number = MIXED_ELEMENT_COUNT, minDeltaE: number | Partial<M3Limiares> = M3_MIN_DELTA_E): string[] {
  return pickM3Distinct(pickMixedElements(rng, pool, pool.length), n, minDeltaE).elements;
}

/** Os 6 elementos misturados de uma partida de Aventura a partir da SEMENTE dela (fluxo próprio: não toca o rng do tabuleiro nem o do combate). Ícones bem distintos entre si. */
export const mixedElementsForSeed = (seed: number): string[] => pickDistinctMixedElements(mulberry32((seed ^ 0x3e1e) | 0));

/** Nome do elemento de uma peça, PT/EN (leitor de tela): base do Oráculo/class-system ou misto; id desconhecido devolve o próprio id. */
export function tileElementName(id: string, isPt: boolean): string {
  if (isPt) {
    const base = (BASE_ELEMENT_LABELS as Record<string, string>)[id];
    return base ?? DERIVED_ELEMENT_PAIRS.find(d => d.id === id)?.nome ?? CURATED_ELEMENT_NAMES[id]?.pt ?? id;
  }
  return essenceEn(id) ?? CURATED_ELEMENT_NAMES[id]?.en ?? id;
}

/** Um candidato a oponente como a rota `opponents` devolve (só o que o pareamento lê). */
export interface PvpCandidate { duel?: { level: number } | null }

/**
 * Entre os candidatos, o de level mais PARECIDO com o do jogador (empate = o primeiro, que já veio sorteado pelo servidor).
 * Quem não declara level só entra quando NINGUÉM declara (não dá para medir semelhança). Lista vazia = `null`.
 */
export function pickPvpOpponent<T extends PvpCandidate>(cands: readonly T[], myLevel: number): T | null {
  if (cands.length === 0) return null;
  const me = Number.isFinite(myLevel) ? myLevel : 1;
  const withLevel = cands.filter(c => Number.isFinite(c.duel?.level));
  if (withLevel.length === 0) return cands[0];
  let best = withLevel[0];
  for (const c of withLevel) if (Math.abs(c.duel!.level - me) < Math.abs(best.duel!.level - me)) best = c;
  return best;
}

/** O adversário do PVP, já pronto para a tela: arte, level e a chave do roster (só o simulado local), que alimenta o bestiário. Sempre um jogador. */
export interface PvpFoe { kind: 'player'; level: number; sprite?: string; roster?: string; /** `true` = jogador simulado local (sem rede) */ simulated?: boolean; /** elemento do sprite do oponente */ element?: string }

/** Jogador simulado de reserva (sem rede, pool vazio): arte de criatura do roster, no level do jogador, pelo `rng`. */
export function simulatedFoe(level: number, rng: Rng): { foe: PvpFoe; entry: RosterEntry } {
  const entry = pickEnemy(level, rng, { tabela: true });
  return { foe: { kind: 'player', simulated: true, level, roster: entry.key, element: rosterEntryElement(entry) }, entry };
}

/**
 * O que UMA partida de PVP rende (§473, "equivalente à Arena"): vitória = `ARENA_FIGHT_BITS` Bits (o combate médio do Duelo da Arena) + Honra
 * de vitória do Torneio; derrota = só a Honra de consolo (perder nunca custa nada; a Arena também não paga na derrota). Boss e Calabouço não passam aqui.
 */
export function pvpRewards(won: boolean): { bits: number; honor: number } {
  return won ? { bits: ARENA_FIGHT_BITS, honor: EMBLEMS_PER_WIN } : { bits: 0, honor: EMBLEMS_PER_LOSS };
}
