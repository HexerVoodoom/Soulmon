/**
 * A DESCOBERTA DO PASSEIO (pedido do dono, 05/11/2026) — dono único.
 *
 * Todo dia em que o jogador fez um Passeio (a missão do dia anterior, `travessias.strollSummary`), o Soulmon topa com UM Soulmon que
 * o jogador ainda nunca viu — aleatório, mas GARANTIDO enquanto restar algum fora do Drive (`bestiary`, abas Selvagem/Desgarrado).
 *
 * Regras:
 *  - O sorteio é DETERMINÍSTICO por (`dayKey`, o que já foi visto): reabrir o resumo não re-sorteia (mesma ideia da Aventura da Noite,
 *    `utils/adventure.ts`, regra 3 — achado que muda a cada abertura é caça-níquel).
 *  - O Corvinho segue a MESMA chance rara de sempre (`RAVEN_SPAWN_CHANCE`, 1/1000): só entra no sorteio se o 1º número do dia passar
 *    dela. Se ele for o ÚNICO que falta, a garantia vence e ele vem.
 *  - Não paga nada (sem Bits, item, XP): a recompensa é a página nova do Drive (como a Aventura, regra 2).
 *  - Quando tudo já foi visto, devolve `null` e a cena segue sem a metade da descoberta.
 *
 * Função PURA: não grava nada. Quem chama grava a chave em `bestiary` quando o jogador confirma o "OK" da descoberta.
 */
import { ENEMY_ROSTER, RAVEN_ENTRY, RAVEN_SPAWN_CHANCE, type RosterEntry } from './enemyRoster';
import { hashString, mulberry32 } from './oracle/base';

export function strollDiscoveryOf(seen: readonly string[] | undefined, dayKey: string): RosterEntry | null {
  const vistos = new Set(seen ?? []);
  const livres = ENEMY_ROSTER.filter((e) => !vistos.has(e.key));
  if (livres.length === 0) return null;
  const rng = mulberry32(hashString(`passeio-descoberta:${dayKey}`) >>> 0);
  const corvoLivre = livres.some((e) => e.key === RAVEN_ENTRY.key);
  const comuns = livres.filter((e) => e.key !== RAVEN_ENTRY.key);
  // O 1º número decide o corvo (probabilidade exata 1/1000, como no `withRaven`); o 2º escolhe entre os comuns.
  const roll = rng();
  if (corvoLivre && (roll < RAVEN_SPAWN_CHANCE || comuns.length === 0)) return RAVEN_ENTRY;
  return comuns[Math.floor(rng() * comuns.length) % comuns.length];
}
