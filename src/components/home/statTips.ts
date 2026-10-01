/**
 * C13 (navegação do dono, 01/10/2026) — o que o toque no CORAÇÃO e na ENERGIA
 * da Home explica: como sobe e como desce. Uma linha de cada, voz de PRODUTO
 * (a camada sóbria da L10 da bíblia), nunca voz do mundo nem da criatura.
 *
 * Os números saem das CONSTANTES das regras — nunca escritos à mão aqui
 * (CLAUDE.md, "os números saem das CONSTANTES, não de texto à mão"). Quem
 * decide a regra é `utils/dailyReset.ts` / `utils/careRules.ts`; este arquivo
 * só descreve. Se uma regra mudar, o texto muda junto — e o teste
 * `statTips.test.ts` reprova cópia de número.
 *
 * Checklist da bíblia (§17) aplicado: nada de "você é", nada de culpa
 * ("por sua culpa", "você falhou"), nada de "perdeu N dias", nada que desce
 * sobre vínculo/registro. HP e energia descem por desenho e o produto PODE
 * descrever a descida (L4) — sem atribuir causa moral.
 */
import { MAX_HEARTS_LOST_PER_DAY, WEEKLY_RELIEF_HEARTS } from '../../utils/dailyReset';
import { RUB_HEAL_DAILY_CAP } from '../../utils/careRules';

export type StatTipKind = 'hp' | 'energy';

export interface StatTip {
  title: string;
  up: string;
  down: string;
  upLabel: string;
  downLabel: string;
}

/** Meio coração em texto, no idioma (0,5 / 0.5 → "½"). */
function half(n: number): string {
  return n === 0.5 ? '½' : String(n);
}

export function statTip(kind: StatTipKind, isPt: boolean): StatTip {
  const upLabel = isPt ? 'Sobe' : 'Goes up';
  const downLabel = isPt ? 'Desce' : 'Goes down';
  if (kind === 'hp') {
    return {
      title: isPt ? 'Corações' : 'Hearts',
      upLabel,
      downLabel,
      up: isPt
        ? `com carinho: segure e esfregue seu Soulmon (até ${RUB_HEAL_DAILY_CAP} por dia). Toda segunda volta ${half(WEEKLY_RELIEF_HEARTS)}.`
        : `with care: hold and rub your Soulmon (up to ${RUB_HEAL_DAILY_CAP} a day). Every Monday ${half(WEEKLY_RELIEF_HEARTS)} comes back.`,
      down: isPt
        ? `na virada do dia, se a meta não fechou (no máximo ${MAX_HEARTS_LOST_PER_DAY} por dia), e com cocô sem banho.`
        : `at the day turn if the goal wasn't met (at most ${MAX_HEARTS_LOST_PER_DAY} a day), and with poop left without a bath.`,
    };
  }
  return {
    title: isPt ? 'Energia' : 'Energy',
    upLabel,
    downLabel,
    up: isPt
      ? 'comendo: cada atividade concluída rende uma comida na mochila.'
      : 'by eating: each finished activity gives one food in the backpack.',
    down: isPt
      ? 'recomeça do zero a cada dia.'
      : 'starts again from zero each day.',
  };
}
