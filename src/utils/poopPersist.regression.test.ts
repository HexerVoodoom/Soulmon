import { describe, expect, it } from 'vitest';
import { cleanPoop, pendingPoopEvent } from './poopDrain';

// Bug: o cocô vivia só no `careEvent` (estado de React) e sumia na recarga,
// enquanto o dreno de coração seguia no save. A tela agora é derivada do save.
describe('cocô persiste até o banho', () => {
  const base = { poopEventsScheduled: [1000, 5000], poopEventsShown: [0], poopEventsCompleted: [] as number[], poopPenaltyClockAt: 1100 };

  it('cocô aparecido e não limpo é devolvido após "recarga" (só o save)', () => {
    expect(pendingPoopEvent(base)).toEqual({ requestTime: 1000 });
  });

  it('sem cocô aparecido não há nada na tela', () => {
    expect(pendingPoopEvent({ ...base, poopEventsShown: [] })).toBeNull();
  });

  it('só some depois do banho', () => {
    const limpo = cleanPoop(base, { at: 1000 }).state;
    expect(pendingPoopEvent(limpo)).toBeNull();
  });

  it('virada do dia (agenda limpa) não deixa fantasma', () => {
    expect(pendingPoopEvent({ poopEventsScheduled: [], poopEventsShown: [0], poopEventsCompleted: [] })).toBeNull();
  });

  it('o segundo cocô é exibido quando o primeiro já foi limpo', () => {
    expect(pendingPoopEvent({ ...base, poopEventsShown: [0, 1], poopEventsCompleted: [0] })).toEqual({ requestTime: 5000 });
  });
});
