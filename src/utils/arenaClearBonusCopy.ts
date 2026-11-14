// A linha do bônus "Todos derrotados" no livro "Ganhou" da Arena (§372). Separado de `arenaClearBonus.ts` porque lê os NOMES
// dos materiais (`buildingQuestsCopy`, só telas lazy) e o ícone em imagem (`materialIcons`): a regra pura fica leve para o App.
import { MATERIALS } from './buildingQuestsCopy';
import { materialIconSrc } from './materialIcons';
import { ARENA_CLEAR_BONUS_MATERIAL } from './arenaClearBonus';

export interface ArenaClearBonusRow { key: 'arena-clear-bonus'; kind: 'item'; label: string; icon?: string }

/** "Todos derrotados +1 Presa" / "All defeated +1 Fang". `qty` ≤ 0 = sem linha (o bônus não entrou). */
export function arenaClearBonusRows(qty: number, isPt: boolean): ArenaClearBonusRow[] {
  if (!(qty >= 1)) return [];
  const m = MATERIALS.find(x => x.id === ARENA_CLEAR_BONUS_MATERIAL)!;
  const nome = isPt ? m.namePt : m.nameEn;
  const icon = materialIconSrc(m.id);
  return [{ key: 'arena-clear-bonus', kind: 'item', label: isPt ? `Todos derrotados +${qty} ${nome}` : `All defeated +${qty} ${nome}`, ...(icon ? { icon } : {}) }];
}
