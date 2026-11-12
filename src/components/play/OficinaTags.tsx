/** Etiquetas da lista da Oficina — arquivo à parte para a folha não puxar o planejamento (lazy) só por elas. */
import { sm2Hint } from '../form/FormKit';
import type { PlanTag } from '../../utils/focoSessao';

export const TAG_LABEL: Record<PlanTag, { pt: string; en: string }> = {
  habit: { pt: 'Hábito', en: 'Habit' },
  quick: { pt: '2 min', en: '2 min' }, frog: { pt: 'Sapo', en: 'Frog' },
};

export function TagChips({ tags, isPt }: { tags: PlanTag[]; isPt: boolean }) {
  return <>{tags.map(t => <span key={t} data-oficina-tag={t} style={{ ...sm2Hint, margin: 0, border: '1px solid var(--sm2-border)', borderRadius: 999, padding: '0 8px', whiteSpace: 'nowrap' }}>{isPt ? TAG_LABEL[t].pt : TAG_LABEL[t].en}</span>)}</>;
}
