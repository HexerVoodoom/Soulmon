// ÁRVORE COMPLETA das linhas curadas (`assets/soulmon/lines/full/`): as formas por GALHO
// (power/harmony/benevolence) e o ultra — kaelen/orrin/thalindra (29, desde a rodada 1) e
// ignar/lumel/serah/igni (40, rodada 3, 01/10/2026; `igni-*-power` é cópia dos sprites que
// a linha já tinha em `lines/`, é a mesma forma do oráculo).
//
// ⚠️ SEM CONSUMIDOR (registrado em `docs/INVENTARIO-ASSETS.md` e no STATUS): hoje
// `DUNGEON_LINE_SPRITES` usa só 4 por linha. O mapa existe para o dia em que a pré-seleção,
// o Bestiário ou um inimigo por galho precisarem da forma de um galho — e para o guard
// `artMaps.contract.test.ts` fechar arquivo ↔ chave. Enquanto ninguém o importa, o glob não
// entra no bundle.
//
// Fronteira no molde de `lineIcons.ts`/`attackFxArt.ts`: glob eager, `undefined` quando
// não há arte (nautilu e astrase ainda NÃO têm — pendentes da rodada 3).
export type LineFullStage = 'rookie' | 'champion' | 'ultimate' | 'mega' | 'ultra';
export type LineFullBranch = 'power' | 'harmony' | 'benevolence';

const modules = import.meta.glob('../assets/soulmon/lines/full/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

/** `<linha>-<estágio>[-<galho>]` → URL. `rookie` e `ultra` não têm galho. */
export const LINE_FULL_ART: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const m = /\/([a-z]+-(?:rookie|ultra|(?:champion|ultimate|mega)-(?:power|harmony|benevolence)))\.png$/.exec(path);
  if (m) LINE_FULL_ART[m[1]] = url;
}

/** A forma de uma linha num estágio (e galho, de champion a mega), ou `undefined` se não houver arte. */
export const lineFullSprite = (
  lineId: string,
  stage: LineFullStage,
  branch?: LineFullBranch,
): string | undefined =>
  LINE_FULL_ART[stage === 'rookie' || stage === 'ultra' ? `${lineId}-${stage}` : `${lineId}-${stage}-${branch}`];
