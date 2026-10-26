/**
 * ELEMENTAL FUSION — o modo PVP (1 contra 1), a regra PURA (pedido do dono, 26/10/2026).
 *
 * O PVP tem dois pedaços, os dois aqui:
 *  1. OS 6 ELEMENTOS DO TABULEIRO: sorteados por semente do pool INTEIRO de ícones de elemento (base E mistos), sem repetir. O Normal
 *     segue com os 6 fixos de `M3_TILE_ELEMENTS`; nada mudou nele.
 *  2. O OPONENTE: o SERVIDOR sorteia (a mesma rota `opponents` do Torneio, que usa `_rankedPick.js`: perto da faixa de quem pede,
 *     inclusive simulados). O cliente só escolhe, entre os devolvidos, o de level mais PARECIDO com o do jogador; sem ninguém (offline, pool
 *     vazio) cai num NPC do roster no level do jogador. Nome de pessoa e número de ranking NUNCA chegam à tela: só o Soulmon e o level.
 *
 * Recompensa = a do Normal (`match3Bits(combatScore)`, mesmo funil e teto diário): este módulo não toca em Bits.
 * Determinístico: o `rng` vem por PARÂMETRO (`mulberry32`), nunca `Math.random`.
 */
import { mulberry32 } from './combate/rng';
import { elementIconIds } from './elementIconArt';
import { BASE_ELEMENT_LABELS, DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { essenceEn } from './soulProfile/essenceLabels';
import { M3_KINDS, type Rng } from './match3';
import { pickEnemy, type RosterEntry } from './enemyRoster';

/** Quantos elementos entram no tabuleiro do PVP (= `M3_KINDS`: a lógica do tabuleiro não muda, só o ícone de cada tipo). */
export const PVP_ELEMENT_COUNT = M3_KINDS;

/** Ids sem ícone de peça: `neutro` não é elemento de combate (SUPOSIÇÃO: o dono pediu "elementos", e neutro é a ausência de um). */
const FORA_DO_POOL: ReadonlySet<string> = new Set(['neutro']);

/** O pool inteiro de ícones de elemento (base + mistos), em ordem fixa (ordenado) para o sorteio ser determinístico. */
export function pvpElementPool(): string[] {
  return elementIconIds().filter(id => !FORA_DO_POOL.has(id)).sort();
}

/** `n` elementos DISTINTOS do `pool`, sorteados pelo `rng` (Fisher-Yates parcial). Pool menor que `n` devolve o que houver. */
export function pickPvpElements(rng: Rng, pool: readonly string[] = pvpElementPool(), n: number = PVP_ELEMENT_COUNT): string[] {
  const arr = [...pool];
  const out: string[] = [];
  for (let i = 0; i < n && arr.length > 0; i++) {
    out.push(arr.splice(Math.min(arr.length - 1, Math.floor(rng() * arr.length)), 1)[0]);
  }
  return out;
}

/** Os 6 elementos de uma partida a partir da SEMENTE dela (fluxo próprio: não toca o rng do tabuleiro nem o do combate). */
export const pvpElementsForSeed = (seed: number): string[] => pickPvpElements(mulberry32((seed ^ 0x3e1e) | 0));

/** Nome do elemento de uma peça, PT/EN (leitor de tela): base do Oráculo/class-system ou misto; id desconhecido devolve o próprio id. */
export function tileElementName(id: string, isPt: boolean): string {
  if (isPt) {
    const base = (BASE_ELEMENT_LABELS as Record<string, string>)[id];
    return base ?? DERIVED_ELEMENT_PAIRS.find(d => d.id === id)?.nome ?? id;
  }
  return essenceEn(id) ?? id;
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

/** O adversário do PVP, já pronto para a tela: arte, level e (só NPC) a chave do roster, que alimenta o bestiário. */
export interface PvpFoe { kind: 'player' | 'npc'; level: number; sprite?: string; roster?: string }

/** NPC de reserva (sem rede, pool vazio): do roster, no level do jogador, pelo `rng`. */
export function npcFoe(level: number, rng: Rng): { foe: PvpFoe; entry: RosterEntry } {
  const entry = pickEnemy(level, rng);
  return { foe: { kind: 'npc', level, roster: entry.key }, entry };
}
