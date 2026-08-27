// Ícone de cada ELEMENTO — o objeto que representa o elemento (caveira para
// morte, chama para fogo), não o efeito dele em combate.
//
// Distinto de `derivedAttackFxArt.ts`, que é a arte de COMBATE (cast, aura,
// slash, impact, defended, orb) e vive em `assets/soulmon/fx-ataque/`. Aqui é
// uma peça por elemento, para identificá-lo numa lista ou ficha.
//
// O prefixo do arquivo é `el-` e não `fx-` de propósito: o glob de
// `derivedAttackFxArt.ts` casa `fx-(.+)-(cast|aura|...)`, e misturar as duas
// famílias na mesma convenção de nome faria uma pegar arquivos da outra.
//
// **A fronteira do visor.** `docs/PLANO-DESIGN` §1 diz que pixel art existe
// DENTRO do visor do v-pet e que tudo fora é SVG + Material Symbols. Estes
// ícones foram encomendados para a Ficha, que é superfície de FORA — ou seja,
// são uma EXCEÇÃO explícita, decidida pelo dono em 27/ago/2026 com a
// consequência posta na mesa. O texto do PLANO-DESIGN ainda não registra a
// exceção; quem for mexer nele deve registrar, senão o próximo a ler trata
// esta leva como erro.

/**
 * `import.meta.glob` com `eager: true` faz o Vite ver e empacotar cada PNG
 * estaticamente (mesma garantia de bundle que imports nomeados dariam), sem
 * exigir uma linha de import por arquivo — inviável à mão para 137 ícones.
 */
const modules = import.meta.glob('../assets/soulmon/elementos/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const ELEMENT_ICONS: Record<string, string> = {};

for (const [path, url] of Object.entries(modules)) {
  const match = /el-(.+)\.png$/.exec(path);
  if (!match) continue;
  ELEMENT_ICONS[match[1]] = url;
}

/**
 * Devolve a URL do ícone de um elemento — base, derivado ou `neutro` — ou
 * `undefined` se não houver arte para esse id.
 *
 * Devolve `undefined` de propósito em vez de cair num placeholder: o
 * consumidor decide se mostra o rótulo de texto, um traço, ou nada. Hoje os
 * 136 derivados e o `neutro` estão todos cobertos; os 17 elementos BASE
 * (fogo, agua, terra…) ainda NÃO têm ícone, então `elementIcon('fogo')` é
 * `undefined` e isso é esperado.
 */
export const elementIcon = (elementoId: string): string | undefined =>
  ELEMENT_ICONS[elementoId];

/** Todos os ids que têm ícone. Útil para testes de cobertura. */
export const elementIconIds = (): string[] => Object.keys(ELEMENT_ICONS);
