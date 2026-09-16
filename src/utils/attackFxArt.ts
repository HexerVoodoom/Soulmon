// Arte pixel dos FX de ataque por ELEMENTO — os 17 BASE (fogo, agua, terra…,
// `entrega6/`, instalados em 15/09/2026) e os 136 DERIVADOS
// (`derivedElements.ts`), 6 estados cada, todos em `fx-ataque/`.
// Fronteira de troca no molde de `fxArt.ts` — aqui a chave é composta
// (`'<idElemento>:<estado>'`), não emoji, porque o consumidor escolhe a peça
// por elemento+estado.
//
// Chamada hoje (decisão D9 do dono, 15/09/2026): SÓ `aura`, pelo GALHO do
// bicho, na Evolução/Ficha. O combate segue genérico — `buildDungeonWave`
// sorteia por tier, não por elemento, e os popups de `DungeonGame`/
// `NightmareBattle` usam os emojis de `fxArt.ts`. Ver
// `src/assets/soulmon/fx-ataque/INSTALAR.md` para a campanha e as armadilhas.
//
// Era `derivedAttackFxArt.ts` (só derivados) até os base entrarem; o nome
// antigo da função fica exportado como alias.

export type AttackFxState =
  | 'cast'
  | 'aura'
  | 'slash'
  | 'impact'
  | 'defended'
  | 'orb';

const ATTACK_FX_STATES: readonly AttackFxState[] = [
  'cast',
  'aura',
  'slash',
  'impact',
  'defended',
  'orb',
];

// `import.meta.glob` com `eager: true` faz o Vite ver e empacotar cada PNG
// estaticamente (mesma garantia de bundle que imports nomeados dariam), sem
// exigir uma linha de import por arquivo — inviável à mão para 816 sprites.
// `import: 'default'` devolve a URL final do asset diretamente, sem o
// wrapper `{ default: ... }`.
const modules = import.meta.glob('../assets/soulmon/fx-ataque/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const ATTACK_FX: Record<string, string> = {};

for (const [path, url] of Object.entries(modules)) {
  const match = /fx-(.+)-(cast|aura|slash|impact|defended|orb)\.png$/.exec(path);
  if (!match) continue;
  const [, id, estado] = match;
  ATTACK_FX[`${id}:${estado}`] = url;
}

/**
 * Devolve a URL do sprite de FX de ataque para um elemento (base ou derivado)
 * + estado, ou `undefined` se não houver arte para essa combinação — de
 * propósito, para o consumidor cair no emoji genérico de `fxArt.ts` sem quebrar.
 */
export const attackFx = (
  elementoId: string,
  estado: AttackFxState,
): string | undefined => ATTACK_FX[`${elementoId}:${estado}`];

/** @deprecated nome anterior; hoje cobre base e derivados. */
export const derivedAttackFx = attackFx;

/** Quantas peças o glob encontrou — guard de instalação (18 base incl. neutro + 136 derivados) × 6 = 924. */
export const ATTACK_FX_COUNT = Object.keys(ATTACK_FX).length;

export { ATTACK_FX_STATES };

/**
 * O elemento DOMINANTE do oráculo (`soulmonMeta.dominantElement`,
 * `utils/oracle.ts` `ElementId`) não coincide 1:1 com o class-system: `planta`
 * e `industrial` não são elementos base lá. Mapeia para a aura mais próxima
 * (`vida` e `aco` são derivados com arte própria).
 */
const ORACLE_TO_FX: Record<string, string> = { planta: 'vida', industrial: 'aco' };

/** Aura (D9: a única chamada por agora) para o elemento dominante do bicho. */
export const auraForElement = (elementoOraculo: string | undefined): string | undefined =>
  elementoOraculo ? attackFx(ORACLE_TO_FX[elementoOraculo] ?? elementoOraculo, 'aura') : undefined;
