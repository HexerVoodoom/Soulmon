/**
 * ARTE dos inimigos temáticos (`temaInimigos.ts`). A arte entra SOZINHA quando o PNG cair em
 * `src/assets/soulmon/inimigos-tema/<id>-<forma>.png` (256², fundo transparente, olhando para a DIREITA): o glob pega.
 * Até lá, o PLACEHOLDER é a criatura base do MESMO elemento (`novos/<elemento>-<forma>.png`; sem a forma, a rookie) —
 * nunca um sprite de outro elemento (regra "um sprite = um elemento").
 */
import { ENEMY_ROSTER, type RosterEntry } from './enemyRoster';
import { rosterSpriteOf } from './novosSoulmon';

const FILES = import.meta.glob('../assets/soulmon/inimigos-tema/*.png', { eager: true, import: 'default' }) as Record<string, string>;

export const TEMA_ART: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1).replace(/\.png$/, ''), url]),
);

/** O placeholder: a base do mesmo elemento na mesma forma (ou rookie). */
export function placeholderOf(e: Pick<RosterEntry, 'element' | 'stage'>): string | undefined {
  const bases = ENEMY_ROSTER.filter(r => r.kind === 'base' && r.element === e.element);
  const b = bases.find(r => r.stage === e.stage) ?? bases.find(r => r.stage === 'rookie');
  return b ? rosterSpriteOf(b) : undefined;
}

/** O sprite de qualquer entrada do roster: temático (arte própria ou placeholder) ou o caminho de sempre. */
export function temaSpriteOf(e: RosterEntry): string | undefined {
  if (e.kind === 'api' && e.artFile && TEMA_ART[e.artFile]) return TEMA_ART[e.artFile];
  return rosterSpriteOf(e) ?? placeholderOf(e);
}
