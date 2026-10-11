/**
 * PRESETS DE TAREFA COM SUBITENS.
 *
 * Um preset é um atalho de criação, não uma regra: ele só preenche o formulário
 * (nome, categoria, subitens que a PESSOA marcou, repetição) e a pessoa ainda
 * revisa e salva. O PESO e o drop premium seguem a regra dos subitens
 * (`effortWithSteps`, `premiumFood.ts`) — nada aqui inventa número.
 *
 * Finanças NÃO é categoria: ela mora em `Work` (categoria → atributo é
 * `CATEGORY_ATTRIBUTES`, e uma categoria nova exigiria números novos do dono),
 * do mesmo jeito que a área 'financas' do catálogo de hábitos já usa `Work`.
 */
import type { ActivityCategory } from '../types/attributes';

export interface TaskPresetItem {
  id: string;
  pt: string;
  en: string;
  /** Já vem marcado? As contas que quase todo mundo tem. */
  defaultOn?: boolean;
}

export interface TaskPreset {
  id: string;
  emoji: string;
  category: ActivityCategory;
  name: { pt: string; en: string };
  /** Repetição contada da CONCLUSÃO (`nextOccurrence`) — mensal por padrão. */
  repeatEveryDays: number;
  items: TaskPresetItem[];
}

export const TASK_PRESETS: TaskPreset[] = [
  {
    id: 'pagar-contas',
    emoji: '🧾',
    category: 'Work',
    name: { pt: 'Pagar contas', en: 'Pay bills' },
    repeatEveryDays: 30,
    items: [
      { id: 'agua', pt: 'Pagar água', en: 'Pay water', defaultOn: true },
      { id: 'luz', pt: 'Pagar luz', en: 'Pay electricity', defaultOn: true },
      { id: 'gas', pt: 'Pagar gás', en: 'Pay gas' },
      { id: 'internet', pt: 'Pagar internet', en: 'Pay internet', defaultOn: true },
      { id: 'aluguel', pt: 'Pagar aluguel', en: 'Pay rent' },
      { id: 'condominio', pt: 'Pagar condomínio', en: 'Pay building fees' },
      { id: 'escola', pt: 'Pagar escola', en: 'Pay school' },
      { id: 'saude', pt: 'Pagar plano de saúde', en: 'Pay health plan' },
      { id: 'seguro', pt: 'Pagar seguro', en: 'Pay insurance' },
      { id: 'cartao', pt: 'Pagar cartão', en: 'Pay credit card' },
    ],
  },
];

/** Os subitens do preset para os ids que a pessoa marcou (ordem do preset). */
export function presetSteps(
  preset: TaskPreset,
  selectedIds: ReadonlyArray<string>,
  isPt: boolean,
  idPrefix = String(Date.now()),
): Array<{ id: string; label: string; completed: boolean }> {
  return preset.items
    .filter(i => selectedIds.includes(i.id))
    .map(i => ({ id: `${idPrefix}-${i.id}`, label: isPt ? i.pt : i.en, completed: false }));
}
