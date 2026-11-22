/**
 * ELEMENTAL FUSION — a ESCOLHA DE 3 antes da partida (pedido do dono, 18/11/2026, REGISTRO §487), a regra PURA.
 *
 * O Match-3 passou a funcionar como o Torneio/Arena: escolhido o modo, o jogador vê 3 opções e toca em "Lutar" numa delas.
 *  - AVENTURA: cada opção é um ELEMENTO (ícone + nome, como as linhas da Arena aberta). O time de 4 só aparece na partida: ele é
 *    sorteado pela semente da opção, com criaturas DAQUELE elemento (`pickEnemy` com `element`). A composição não é revelada antes.
 *  - PVP: cada opção é um JOGADOR que a rota `opponents` do Torneio entregou (real ou simulado do servidor = "jogador real fake").
 *    O cliente NUNCA inventa adversário aqui: nada de jogador simulado local (`simulatedFoe`), demo ou monstro. Lista curta = menos linhas.
 *    O boss continua decidido ANTES (§473/§476): a semente da tela; se ela é de boss, a tela mostra só a linha "Boss".
 *  - "Sortear 3 novos": grátis, UMA vez por visita à tela (a mesma regra do Torneio ranqueado: um refresh entre combates).
 *
 * Determinístico: tudo sai de `mulberry32(semente)`; nunca `Math.random` aqui.
 */
import { mulberry32 } from './combate/rng';
import { ENEMY_ROSTER } from './enemyRoster';
import { isBossMatch } from './match3Boss';
import { mixedElementPool, pickMixedElements, type PvpFoe } from './match3Pvp';

/** Quantas opções a tela mostra (o "1 de 3" do Torneio). */
export const M3_CHOICES = 3;
/** Quantas vezes dá para sortear de novo por visita à tela (Torneio ranqueado: 1 entre combates). Grátis. */
export const M3_REDRAWS_PER_VISIT = 1;

/** Uma opção da Aventura: o elemento do time e a semente da partida (tabuleiro, time e boss saem dela). */
export interface M3AdventureChoice { mode: 'adventure'; element: string; seed: number }
/** Uma opção do PvP: o jogador (já como `PvpFoe`, sem nome de pessoa) e a semente; `boss` = a linha do boss decidido antes. */
export interface M3PvpChoice { mode: 'pvp'; seed: number; foe?: PvpFoe; petName?: string; stage?: string; opponentId?: string; /** ícone-ficha 64 da linha (quando existe) */ icon?: string; boss?: boolean }
export type M3Choice = M3AdventureChoice | M3PvpChoice;

const semente = (rng: () => number): number => Math.floor(rng() * 2 ** 31);

/** Semente que NÃO é de boss (as linhas de jogador nunca viram boss escondido). Determinística pelo `rng`. */
function sementeSemBoss(rng: () => number): number {
  for (let i = 0; i < 64; i++) { const s = semente(rng); if (!isBossMatch(s)) return s; }
  return 1; // inalcançável na prática (3% de chance por tentativa)
}

/** Os elementos que podem ser tema de um time da Aventura: os do pool misturado que TÊM criatura no roster (o time cai daquele elemento). */
export function adventureElementPool(): string[] {
  const comCriatura = new Set(ENEMY_ROSTER.filter(e => e.kind !== 'mascote').map(e => e.element));
  return mixedElementPool().filter(id => comCriatura.has(id));
}

/** As 3 opções da Aventura para uma semente de tela: 3 elementos DISTINTOS e uma semente de partida por opção. */
export function adventureChoices(screenSeed: number, n: number = M3_CHOICES): M3AdventureChoice[] {
  const rng = mulberry32((screenSeed ^ 0x6e5c) | 0);
  return pickMixedElements(rng, adventureElementPool(), n).map(element => ({ mode: 'adventure', element, seed: semente(rng) }));
}

/** O mínimo que a tela lê de um oponente da rota `opponents`. */
export interface M3OpponentLike {
  id?: string; petName?: string; stage?: string; element?: string | null;
  duel?: { level: number } | null; demo?: unknown; simulated?: unknown;
}

/** Demo nunca entra no PvP (dono, 18/11/2026): conta sem id, flag `demo` ou id de demo. Simulado do SERVIDOR entra (é "jogador real fake"). */
export function isDemoOpponent(o: M3OpponentLike): boolean {
  return !o.id || o.demo === true || /^demo[-_:]/i.test(o.id);
}

/**
 * As opções do PvP para uma semente de tela. Boss decidido ANTES (semente da tela, §473/§476): só a linha do boss. Senão até 3 jogadores
 * da lista do servidor, sem demo, cada um com uma semente que não é de boss. A arte vem de quem chama (`opponentArt`): `sprite` da luta e `icon` da linha.
 */
export function pvpChoices(screenSeed: number, opponents: readonly M3OpponentLike[], myLevel: number, artOf: (o: M3OpponentLike) => { sprite?: string; icon?: string }, n: number = M3_CHOICES): M3PvpChoice[] {
  if (isBossMatch(screenSeed)) return [{ mode: 'pvp', seed: screenSeed, boss: true }];
  const rng = mulberry32((screenSeed ^ 0x1f7a) | 0);
  return opponents.filter(o => !isDemoOpponent(o)).slice(0, n).map(o => {
    const { sprite, icon } = artOf(o);
    const foe: PvpFoe = {
      kind: 'player', level: Number.isFinite(o.duel?.level) ? o.duel!.level : myLevel,
      ...(sprite ? { sprite } : {}), ...(typeof o.element === 'string' ? { element: o.element } : {}),
    };
    return { mode: 'pvp', seed: sementeSemBoss(rng), foe, opponentId: o.id, ...(icon ? { icon } : {}), ...(o.petName ? { petName: o.petName } : {}), ...(o.stage ? { stage: o.stage } : {}) };
  });
}
