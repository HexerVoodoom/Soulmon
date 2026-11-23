/**
 * Ícones de ESTÁGIO (pedido do dono, 09/11/2026): rookie, champion, ultimate, mega, ultra. O BEBÊ (`bb`/ovo) NÃO tem ícone.
 * Dois sets para o dono decidir: `creme` (pixel art creme com contorno escuro, `estagio-<estágio>.png`) e `branco` (procedurais,
 * todos brancos, `estagio-branco-<estágio>.png`). Troca = mudar `ESTAGIO_ICONE_SET`. 96x96, alfa real; renderizar com `image-rendering: pixelated`.
 */
import { getStageLevel } from '../../../types/progression';

export type EstagioIconeSet = 'creme' | 'branco';
export const ESTAGIO_ICONE_SET: EstagioIconeSet = 'branco';

const arquivos = import.meta.glob('./estagio-*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const url = (nome: string): string | undefined => arquivos[`./${nome}.png`];

export const ESTAGIOS_COM_ICONE = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'] as const;
export type EstagioComIcone = (typeof ESTAGIOS_COM_ICONE)[number];

/** O ícone do estágio de uma forma (id da árvore, ex.: `mega-power`, ou o nível puro). `undefined` para o bebê/ovo e ids desconhecidos. */
export function estagioIcone(formaOuNivel: string | null | undefined, set: EstagioIconeSet = ESTAGIO_ICONE_SET): string | undefined {
  if (typeof formaOuNivel !== 'string') return undefined;
  // Estrito: id que não começa por um nível conhecido (bb, ovo, tier de bicho selvagem…) fica SEM ícone; `getStageLevel` cairia em rookie.
  if (!/^(rookie|champion|ultimate|mega|ultra)(-|$)/.test(formaOuNivel)) return undefined;
  const nivel = getStageLevel(formaOuNivel);
  return url(set === 'branco' ? `estagio-branco-${nivel}` : `estagio-${nivel}`);
}
