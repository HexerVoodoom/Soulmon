// Arte pixel dos FX de ataque dos 136 ELEMENTOS DERIVADOS (derivedElements.ts).
// Fronteira de troca no molde de `fxArt.ts` — aqui a chave é composta
// (`'<idDerivado>:<estado>'`), não emoji, porque o combate ainda não conhece
// elemento e o consumidor futuro precisa escolher a peça por elemento+estado.
//
// NÃO existe ponto de chamada hoje. `buildDungeonWave` sorteia por tier, não
// por elemento, e os popups de `DungeonGame`/`NightmareBattle` usam os emojis
// genéricos de `fxArt.ts`. Instalar os arquivos aqui não troca nenhuma arte —
// só deixa a peça pronta para o dia em que o combate ganhar uma dimensão
// elemental. Ver `src/assets/soulmon/fx-ataque/INSTALAR.md` para o histórico
// completo da campanha, a tabela de cobertura e as armadilhas de geração.
//
// Os 17 elementos BASE (fogo, agua, terra, ...) têm sua própria leva de arte
// (`_gemini_out/entrega6/`, ainda não instalada) e não estão neste mapa —
// quando entrarem, devem cair no MESMO destino (`fx-ataque/`) e no MESMO
// formato de chave, então este módulo já está pronto para recebê-los.

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

const DERIVED_ATTACK_FX: Record<string, string> = {};

for (const [path, url] of Object.entries(modules)) {
  const match = /fx-(.+)-(cast|aura|slash|impact|defended|orb)\.png$/.exec(path);
  if (!match) continue;
  const [, id, estado] = match;
  DERIVED_ATTACK_FX[`${id}:${estado}`] = url;
}

/**
 * Devolve a URL do sprite de FX de ataque para um elemento derivado + estado,
 * ou `undefined` se não houver arte para essa combinação — de propósito,
 * para o consumidor cair no emoji genérico de `fxArt.ts` sem quebrar.
 */
export const derivedAttackFx = (
  elementoDerivadoId: string,
  estado: AttackFxState,
): string | undefined => DERIVED_ATTACK_FX[`${elementoDerivadoId}:${estado}`];

export { ATTACK_FX_STATES };
