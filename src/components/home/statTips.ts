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
import { DUNGEON_DAILY_LAYERS, DUNGEON_ENERGY_PER_LAYER } from '../../utils/dungeonIdle';
import { ENERGY_REGEN_MINUTES, HUNGER_FULL_TO_EMPTY_HOURS } from '../../utils/hunger';

export type StatTipKind = 'hp' | 'energy' | 'hunger';

export interface StatTip {
  title: string;
  up: string;
  down: string;
  upLabel: string;
  downLabel: string;
  /** Para que serve (11/10/2026, REGISTRO §31: a energia era explicada só pelo como sobe/desce). Ausente = não há linha. */
  use?: string;
  useLabel?: string;
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
  if (kind === 'hunger') {
    return {
      title: isPt ? 'Fome' : 'Hunger',
      upLabel,
      downLabel,
      up: isPt ? 'ao comer: a comida enche a fome (3 de 3 = bem alimentado).' : 'when eating: food fills hunger (3 of 3 = well fed).',
      down: isPt
        ? `com o tempo: de cheia a vazia leva ${HUNGER_FULL_TO_EMPTY_HOURS} h, passando por 3, 2 e 1 de 3.`
        : `with time: full to empty takes ${HUNGER_FULL_TO_EMPTY_HOURS} h, going through 3, 2 and 1 of 3.`,
      useLabel: isPt ? 'Impacto' : 'Impact',
      use: isPt
        ? 'a fome define a velocidade da energia: 3 = normal, 2 = metade, 1 = parada.'
        : 'hunger sets how fast energy comes back: 3 = normal, 2 = half, 1 = stopped.',
    };
  }
  return {
    title: isPt ? 'Energia' : 'Energy',
    upLabel,
    downLabel,
    up: isPt
      ? `com o tempo: +1 a cada ${ENERGY_REGEN_MINUTES} min com ele bem alimentado, a metade da velocidade com um pouco de fome, parada se faminto. Comer enche a fome, não a energia.`
      : `with time: +1 every ${ENERGY_REGEN_MINUTES} min when well fed, half speed when a little hungry, stopped when starving. Eating fills hunger, not energy.`,
    down: isPt
      ? `recomeça do zero a cada dia, e cada camada da Masmorra gasta ${DUNGEON_ENERGY_PER_LAYER}.`
      : `starts again from zero each day, and each Dungeon layer spends ${DUNGEON_ENERGY_PER_LAYER}.`,
    useLabel: isPt ? 'Serve para' : 'Used for',
    use: isPt
      ? `descer a Masmorra: ${DUNGEON_ENERGY_PER_LAYER} por camada, até ${DUNGEON_DAILY_LAYERS} camadas por dia. Subir de nível enche de novo.`
      : `going down the Dungeon: ${DUNGEON_ENERGY_PER_LAYER} per layer, up to ${DUNGEON_DAILY_LAYERS} layers a day. Leveling up fills it again.`,
  };
}
