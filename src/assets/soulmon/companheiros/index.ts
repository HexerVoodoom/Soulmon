/**
 * Sprites FIXOS do companheiro invocado, 1 por criatura do class-system (32). Os 32 PNG vivem aqui (PR 1b, após o dono escolher entre 1ª geração e refeita)
 * (E:\Soulmon-assets\_lote-16-11\companheiros\<id>.png). Resolvido por `import.meta.glob` (mesmo padrão de
 * `assets/soulmon/barrage`): arquivo ausente NÃO quebra o build, só devolve `undefined` (o chamador não desenha).
 */
import { CRIATURAS_COMPANHEIRO } from '../../../utils/companheiroInvocado';

const arquivos = import.meta.glob<string>('./*.png', { eager: true, query: '?url', import: 'default' });

/** id da criatura → URL do sprite; só tem chave para o que existe em disco. */
export const COMPANHEIRO_SPRITES: Readonly<Record<string, string>> = Object.fromEntries(
  CRIATURAS_COMPANHEIRO.flatMap(id => {
    const url = arquivos[`./${id}.png`];
    return typeof url === 'string' ? [[id, url] as const] : [];
  }),
);

/** URL do sprite da criatura, ou `undefined` se o id for desconhecido ou o asset ainda não existir. */
export function spriteDoCompanheiro(id: string | null | undefined): string | undefined {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(COMPANHEIRO_SPRITES, id) ? COMPANHEIRO_SPRITES[id] : undefined;
}
