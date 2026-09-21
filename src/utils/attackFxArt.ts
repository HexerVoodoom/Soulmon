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
/** Auras 96² (`fx-<el>-aura-96.png`, rodada 2 R2-3 — derivadas das 128²). */
const AURA_96: Record<string, string> = {};

for (const [path, url] of Object.entries(modules)) {
  const m96 = /\/fx-([a-z_]+)-aura-96\.png$/.exec(path);
  if (m96) { AURA_96[m96[1]] = url; continue; }
  // ⚠️ Ancorado na BARRA e sem `.+` guloso: o caminho do glob é
  // `../assets/soulmon/fx-ataque/fx-fogo-aura.png`, e `fx-(.+)-aura` casava a
  // partir do `fx-` de `fx-ataque/`, gravando a chave `ataque/fx-fogo:aura` —
  // 924 peças no mapa e NENHUMA encontrável: `auraForElement` devolvia
  // `undefined` para todo elemento e a aura da Ficha nunca foi desenhada
  // (achado em 20/09/2026, ao implementar o canvas Pet; há teste).
  const match = /\/fx-([a-z_]+)-(cast|aura|slash|impact|defended|orb)\.png$/.exec(path);
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
/** Quantas auras 96² o glob encontrou (R2-3: uma por elemento com `-aura.png`). */
export const AURA_96_COUNT = Object.keys(AURA_96).length;

export { ATTACK_FX_STATES };

/**
 * O elemento DOMINANTE do oráculo (`soulmonMeta.dominantElement`,
 * `utils/oracle.ts` `ElementId`) não coincide 1:1 com o class-system: `planta`
 * e `industrial` não são elementos base lá. Mapeia para a aura mais próxima
 * (`vida` e `aco` são derivados com arte própria).
 */
const ORACLE_TO_FX: Record<string, string> = { planta: 'vida', industrial: 'aco' };

/**
 * Aura (D9: a única chamada por agora) para o elemento dominante do bicho.
 * `size: 96` devolve a variante 96² (vidro 192 da Ficha a 2×, canvas Pet
 * §22) quando ela existe; sem ela — ou com `size: 128` — a 128² de sempre.
 */
export const auraForElement = (elementoOraculo: string | undefined, size: 96 | 128 = 128): string | undefined => {
  if (!elementoOraculo) return undefined;
  const id = ORACLE_TO_FX[elementoOraculo] ?? elementoOraculo;
  return (size === 96 ? AURA_96[id] : undefined) ?? attackFx(id, 'aura');
};
