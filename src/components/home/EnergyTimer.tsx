import { useEffect, useState } from 'react';
import { formatEnergyCountdown, formatEnergyEta, type EnergyMode } from '../../utils/hunger';
import type { Language } from '../../utils/i18n';

/**
 * O TIMER DA ENERGIA (beta-2 3.4; REGISTRO §40 e, desde 14/10/2026, §43): NÃO fica mais na faixa de status. Vive DENTRO da dica da energia,
 * que abre ao tocar no raio. Mostra a contagem regressiva AO VIVO (1 s) até a próxima unidade, "H:MM:SS" com hora, "M:SS" sem.
 *
 * Não conta por conta própria: `msToNext` vem de `energyStatus(state, now)` (`utils/hunger.ts`, via `useEnergyStatus`, a cada 15 s). Aqui só
 * se ANDA o relógio entre dois recálculos: ancora (`msToNext`, instante em que chegou) e desconta o tempo decorrido a cada segundo.
 * Chegou um `msToNext` novo (fome mudou de faixa, energia fechou) → reancora.
 *
 *  · `regen` / `slow`: contagem tabular; `slow` acrescenta "(mais devagar)".
 *  · `paused` (faminto): sem contagem, o estado "pausada".
 *  · `full`: nada (energia cheia não tem próximo).
 *
 * Acessibilidade: o `aria-live="polite"` cobre só o RÓTULO (com o tempo aproximado de quando abriu); o número que muda a cada segundo é
 * `aria-hidden` — o leitor de tela NÃO anuncia segundo a segundo.
 */
/** Contagem local: ancora (`ms`, instante da chegada) e desconta o decorrido a cada segundo; reancora quando `ms` muda. */
function useLiveLeft(ms: number | null): number {
  const [anchor, setAnchor] = useState(() => ({ ms, at: Date.now() }));
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { setAnchor({ ms, at: Date.now() }); setNow(Date.now()); }, [ms]);
  useEffect(() => {
    if (ms === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ms === null]); // eslint-disable-line react-hooks/exhaustive-deps
  return Math.max(0, (anchor.ms ?? 0) - (now - anchor.at));
}

/**
 * Dentro da dica da FOME (toque no indicador): quanto falta para a fome cair de nível, ao vivo (mesmo formato e mesma regra de aria da energia).
 * `msToDrop === null` (já faminto) = sem contagem, só o estado.
 */
export function HungerTimer({ msToDrop, language }: { msToDrop: number | null; language: Language }) {
  const isPt = language === 'pt-BR';
  const [opened] = useState(() => msToDrop);
  const left = useLiveLeft(msToDrop);
  if (msToDrop === null) {
    return <p data-hunger-timer data-mode="floor" aria-live="polite">{isPt ? 'Já está no nível mais baixo: dê comida.' : 'Already at the lowest level: give food.'}</p>;
  }
  return (
    <p data-hunger-timer aria-live="polite" aria-atomic="true">
      <b>{isPt ? 'Cai de nível em' : 'Drops a level in'}</b>{' '}
      <span className="sm2-sr-only">{formatEnergyEta(opened ?? msToDrop, isPt)}</span>
      <span data-hunger-countdown aria-hidden="true" className="sm2-num" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatEnergyCountdown(left)}</span>
    </p>
  );
}

export function EnergyTimer({ msToNext, mode, language }: {
  /** Ms até a próxima unidade; `null` quando cheia ou pausada. */
  msToNext: number | null;
  mode: EnergyMode;
  language: Language;
}) {
  const isPt = language === 'pt-BR';
  const [anchor, setAnchor] = useState(() => ({ ms: msToNext, at: Date.now() }));
  const [now, setNow] = useState(() => Date.now());
  const [opened] = useState(() => msToNext); // o rótulo falado congela no valor da abertura
  const ticking = mode !== 'full' && mode !== 'paused' && msToNext !== null;
  useEffect(() => { setAnchor({ ms: msToNext, at: Date.now() }); setNow(Date.now()); }, [msToNext]);
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ticking]);
  if (mode === 'full') return null;
  if (!ticking) {
    return (
      <p data-energy-timer data-mode="paused" aria-live="polite">
        {isPt ? 'Regeneração pausada: ele está faminto.' : 'Regeneration paused: he is starving.'}
      </p>
    );
  }
  const left = Math.max(0, (anchor.ms ?? 0) - (now - anchor.at));
  const slow = mode === 'slow';
  const label = isPt ? 'Próxima energia em' : 'Next energy in';
  const spoken = formatEnergyEta(opened ?? msToNext!, isPt);
  return (
    <p data-energy-timer data-mode={mode} aria-live="polite" aria-atomic="true">
      <b>{label}</b>{' '}
      <span className="sm2-sr-only">{spoken}{slow ? (isPt ? ' (mais devagar)' : ' (slower)') : ''}</span>
      <span data-energy-countdown aria-hidden="true" className="sm2-num" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatEnergyCountdown(left)}</span>
      {slow && <span aria-hidden="true">{isPt ? ' (mais devagar)' : ' (slower)'}</span>}
    </p>
  );
}
