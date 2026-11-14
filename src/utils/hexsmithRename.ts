/**
 * RENOMEAR NA HEXSMITH (11/11/2026, pedido do dono): o NOME do Soulmon (lápis) e o NOME DO ESPECIAL (chama) só se trocam AQUI, por
 * `HEX_RENAME_COST` Bits (desde §373 o Bit de Crédito também paga). A troca é do SERVIDOR (`POST /api/save?action=hexRename`, `functions/api/_hexRename.js`): valida,
 * debita e grava numa escrita. Este módulo é a parte pura do cliente: forma do texto (a MESMA régua do especial: letras, números e
 * espaço, até 20, sem palavrão/contato), recusa e o espelho do que o servidor confirmou. Mudar o preço = mudar SÓ esta constante
 * (e a do servidor; `hexsmithRename.parity.test.js` trava as duas).
 */
import { nomeEspecialValido, ESPECIAL_NOME_MAX } from '../../functions/api/_especialNomeRegra.js';
import { spendableBits, type BitsOriginState } from './bitsOrigin';
import { spendBits } from './equipment';

/** Preço de UMA troca de nome (Bits). Fácil de mudar: é só este número (e o espelho no servidor). */
export const HEX_RENAME_COST = 200;
export const HEX_RENAME_MAX = ESPECIAL_NOME_MAX;
export type HexRenameKind = 'pet' | 'especial';
export type HexRenameRefusal = 'empty' | 'invalid' | 'same' | 'bits';

/** O nome limpo (trim + espaços colapsados) ou `null` se vazio/inválido (forma, contato, palavrão PT/EN). */
export function hexRenameClean(raw: string): string | null {
  const t = raw.replace(/\s+/g, ' ').trim();
  if (!t) return null;
  return nomeEspecialValido(t);
}

interface RenameState extends BitsOriginState {
  especialNome?: string;
  especialNomeAt?: number;
  soulmonMeta?: { baseName?: string; petName?: string } | null;
}

/** Por que NÃO dá para trocar (o botão fica desabilitado e o texto aparece); `undefined` = pode. */
export function hexRenameRefusal(state: RenameState, kind: HexRenameKind, raw: string): HexRenameRefusal | undefined {
  if (!raw.replace(/\s+/g, ' ').trim()) return 'empty';
  const nome = hexRenameClean(raw);
  if (!nome) return 'invalid';
  const atual = kind === 'pet' ? state.soulmonMeta?.petName ?? '' : state.especialNome ?? '';
  if (nome === atual) return 'same';
  if (spendableBits(state) < HEX_RENAME_COST) return 'bits';
  return undefined;
}

/** Aplica no save local o que o SERVIDOR confirmou (nome + débito). `paid` falso = já estava assim, nada a debitar. */
export function applyServerHexRename<T extends RenameState>(prev: T, kind: HexRenameKind, nome: string, paid: boolean, at: number = Date.now()): T {
  let next: T = paid ? spendBits(prev, Math.min(prev.gamePoints ?? 0, HEX_RENAME_COST)) : prev;
  if (kind === 'pet') next = { ...next, soulmonMeta: { ...(next.soulmonMeta ?? {}), petName: nome } };
  else next = { ...next, especialNome: nome, especialNomeAt: at };
  return next;
}
