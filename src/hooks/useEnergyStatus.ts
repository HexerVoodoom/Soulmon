import { useEffect, useMemo, useState } from 'react';
import { energyStatus, type EnergyStatus, type HungerState } from '../utils/hunger';

/**
 * O estado real da energia/fome para a Home (beta-2 3.4/3.5): `energyStatus(state, now)` recalculado a cada `everyMs` (15 s por padrão —
 * o mesmo passo do acerto do `App.tsx`) e quando o estado muda. Não guarda contador: o `now` é só o gatilho de re-render; o número vem
 * do relógio gravado no save (`utils/hunger.ts`). Use com `<EnergyTimer>` e `<HungerIndicator>`.
 */
export function useEnergyStatus(state: HungerState, everyMs = 15_000): EnergyStatus {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs, state.energyPoints, state.hunger, state.energyClock, state.evolutionStage]);
  // Memoizado: `CompanionHUD` é `memo()` e um objeto novo por render anularia o memo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => energyStatus(state, now), [now, state.energyPoints, state.hunger, state.energyClock, state.evolutionStage]);
}
