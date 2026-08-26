import { feedFood, rubHeal, rubRefusal, type CareState, type FeedRefusal, type RubRefusal } from './careRules';
import { feedTimesFor, rubHealFor, type CareCaps } from './careCaps';

/**
 * Os UPDATERS de cuidado — a parte do gesto que roda DENTRO do
 * `setGameState(prev => ...)`, extraída do `App.tsx`.
 *
 * ⚠️ Existe por causa do achado **X-6**: três bugs foram consertados na fatia 2
 * sem nenhum teste, e um grep de `handlePet|handleFeed|petPassive` nos testes
 * dava zero. Os três podiam ser desfeitos **sem quebrar o TypeScript**:
 *
 *  1. o `petPassive` é o 5º argumento OPCIONAL de `rubRefusal` — apagá-lo
 *     compila, e o Traço Carinhoso volta a ser barrado em 1,0;
 *  2. trocar `prev.careCaps` por `gameState.careCaps` compila, e o teto para de
 *     recusar dentro do updater;
 *  3. idem para a janela de comida — e aí dois toques no mesmo lote do React
 *     leem o mesmo estado e a segunda comida fura o teto.
 *
 * Testar isso montando o `App.tsx` em jsdom seria caro e frágil (4000+ linhas,
 * contextos, áudio, storage). O que quebra nos três não é render nem evento: é
 * a PROCEDÊNCIA do argumento dentro da função. Extraído, o furo de lote vira
 * duas aplicações encadeadas do updater sobre o `prev`, sem React nenhum.
 *
 * O que fica no `App.tsx`: só os efeitos (som, animação, fala do pet) e a
 * decisão de recusar, que dispara fala e por isso não pode morar dentro de um
 * updater — efeito colateral em updater roda 2x no StrictMode (footgun 6).
 */

/** Fatia do estado que estes updaters leem e escrevem. */
export type CareCapsState = CareState & { careCaps?: CareCaps };

/**
 * Um gesto de carinho aplicado ao `prev`.
 *
 * O teto é reconferido AQUI, sobre o registro que está no save — a checagem de
 * fora existe só pela fala. Antes chegava `{ healed: 0 }` fixo e o teto ficava
 * inteiramente dependente da checagem externa.
 */
export function applyRub<T extends CareCapsState>(
  prev: T,
  todayKey: string,
): { state: T; refused?: RubRefusal } {
  const done = rubHeal(prev, rubHealFor(prev.careCaps, todayKey), todayKey);
  if (done.refused) return { state: prev, refused: done.refused };
  return { state: { ...done.state, careCaps: { ...prev.careCaps, rubHeal: done.record } } };
}

/**
 * Uma comida aplicada ao `prev`.
 *
 * A janela vem do `prev`, e NÃO de uma leitura de fora: dois toques dentro do
 * mesmo lote do React veriam o mesmo estado e a segunda furaria o teto. Aqui a
 * segunda passada já enxerga o timestamp da primeira.
 */
export function applyFeed<T extends CareCapsState>(
  prev: T,
  foodEmoji: string,
  now: number,
): { state: T; refused?: FeedRefusal } {
  const fed = feedFood(prev, foodEmoji, feedTimesFor(prev.careCaps, now), now);
  if (fed.refused) return { state: prev, refused: fed.refused };
  return { state: { ...fed.state, careCaps: { ...prev.careCaps, feedTimes: fed.feedTimes } } };
}

/**
 * A decisão de recusar o carinho, do jeito que o chamador precisa dela.
 *
 * Separada do updater porque a recusa dispara fala e animação. O `petPassive`
 * vem do ESTADO — não de um parâmetro que quem chama possa esquecer, que é
 * exatamente como o Traço Carinhoso ficou desligado na prática.
 */
export function rubDecision(state: CareCapsState, todayKey: string): RubRefusal | undefined {
  return rubRefusal(
    state.healthPoints, state.maxHealthPoints,
    rubHealFor(state.careCaps, todayKey), todayKey, state.petPassive,
  );
}
