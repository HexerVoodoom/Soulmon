import { useEffect } from 'react';
import { isBBStage } from '../utils/bbStage';
import { CareEvent } from '../components/CareSystem';
import { showNotification } from '../utils/notifications';
import type { Language } from '../utils/i18n';
import { getStageLevel } from '../types/progression';
import { earliestPoopHour } from '../utils/passives';
import { awakeSecondGapHours, normalizeMealTimes, planDailyPoops } from '../utils/mealRhythm';
import type { MealRhythmSettings } from '../utils/mealRhythm';

interface CareGameState {
  lastResetDate: string;
  poopEventsScheduled: number[];
  poopEventsCompleted: number[];
  poopEventsShown: number[];
  evolutionStage: string;
  maxHealthPoints: number;
  energyPoints: number;
  /** Traço de nascimento — Madrugador atrasa o primeiro cocô (utils/passives.ts). */
  petPassive?: string;
  /** Ritmo das refeições: com ele ligado, o horário SORTEADO do cocô prefere o
   *  pós-refeição — dentro dos MESMOS limites de sempre (ver `alignedFirstPoopHour`). */
  mealRhythm?: MealRhythmSettings;
  /** Janela de descanso: o cocô do dia (os DOIS) cai sempre com o pet acordado, o 2º antes do sono. */
  rest?: { window?: { start: string; end: string } | null };
}

interface UseCareSystemProps {
  gameState: CareGameState;
  careEvent: CareEvent | null;
  setCareEvent: (event: CareEvent | null) => void;
  setMessageTrigger: (fn: (prev: number) => number) => void;
  setGameState: (fn: (prev: any) => any) => void;
  language: Language;
  /** While asleep, poop never appears (sleeping protects against the overnight penalty). */
  isSleeping: boolean;
}

export function useCareSystem({
  gameState,
  careEvent,
  setCareEvent,
  setMessageTrigger,
  setGameState,
  language,
  isSleeping,
}: UseCareSystemProps) {
  // Schedule the day's poops (BOTH, awake only — REGISTRO §114). Saves from before
  // §114 may carry just the first one; the polling loop below appends the second
  // when the first appears (clamped to the awake day).
  useEffect(() => {
    if (gameState.lastResetDate !== new Date().toDateString()) return;
    if (isBBStage(gameState.evolutionStage)) return; // Forma BB: sem cocô agendado (D3)

    if (!gameState.poopEventsScheduled || gameState.poopEventsScheduled.length === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = today.getTime();
      // REGISTRO §114 (D-05): os DOIS cocôs do dia saem agendados de uma vez, ambos
      // com o pet ACORDADO (fora da janela de descanso) e o 2º antes do sono — antes
      // o 2º era sorteado 8–10 h depois do 1º aparecer e muitas vezes caía no sono
      // (saía 1 só). O 1º continua entre 07:00 (10h Madrugador) e 15:00; com o ritmo
      // das refeições ligado o sorteio prefere o pós-refeição. Dreno, teto e perdão
      // por ausência não mudam: só a AGENDA. Ter a agenda no save também é o que
      // deixa o push de cocô (D-04) saber a hora.
      const earliest = earliestPoopHour(gameState.petPassive, 7);
      const ritmo = !!(gameState.mealRhythm && (gameState.mealRhythm.inApp || gameState.mealRhythm.push));
      const [h1, h2] = planDailyPoops(Math.random, {
        earliest,
        latest: 15,
        times: normalizeMealTimes(gameState.mealRhythm?.times),
        restWindow: gameState.rest?.window ?? null,
        aligned: ritmo,
      });
      // Só agenda se o estado AINDA está sem agenda: o sorteio é aleatório, e um
      // segundo disparo antes do commit (StrictMode, adoção da nuvem no meio)
      // trocaria a hora de um cocô já agendado.
      setGameState(prev => (prev.poopEventsScheduled?.length ? prev : {
        ...prev,
        poopEventsScheduled: [startOfDay + h1 * 3600000, startOfDay + h2 * 3600000],
      }));
    }
  }, [gameState.lastResetDate, gameState.poopEventsScheduled, gameState.evolutionStage, gameState.petPassive]);
  // (`mealRhythm` fica de fora das deps de propósito: mexer nos horários não reagenda o cocô do dia.)

  // Check care events and trigger them
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const ispt = language === 'pt-BR';

      // ── Poop events (time-based, never while sleeping; NOT tied to tasks) ───
      // Sleeping holds poop back entirely, so an overnight sleep shields the
      // user from the day-turn penalty. Must run before the food early-return
      // below, which would otherwise block poop when there are no pending tasks.
      if (!isSleeping && !careEvent) {
        const scheduled = gameState.poopEventsScheduled || [];
        const shown = gameState.poopEventsShown || [];
        for (let index = 0; index < scheduled.length; index++) {
          if (shown.includes(index)) continue;
          if (now >= scheduled[index]) {
            const poopTime = scheduled[index];
            setCareEvent({ type: 'poop', requestTime: poopTime, showSprite: true });
            setMessageTrigger(prev => prev + 1);
            showNotification(
              ispt ? '🚽 Hora de limpar!' : '🚽 Bathroom time!',
              {
                body: ispt
                  ? 'Seu Soulmon fez cocô! Dê um banho para limpar. 🚿'
                  : 'Your Soulmon pooped! Give it a shower to clean up. 🚿',
                tag: `poop-event-${index}`,
              },
            );
            setGameState((prev: any) => {
              // Idempotente: o mesmo índice nunca entra duas vezes em `poopEventsShown`.
              if ((prev.poopEventsShown || []).includes(index)) return prev;
              const newShown = [...(prev.poopEventsShown || []), index];
              let newScheduled = prev.poopEventsScheduled || [];
              // First poop just appeared → schedule the second 8-10h later, so
              // the minimum 8h gap is measured from the first poop's appearance.
              if (index === 0 && newScheduled.length < 2) {
                // Save de antes do §114 (1 só agendado): o 2º sai 8–10 h depois do 1º
                // aparecer, como sempre, mas CLAMPADO ao dia acordado — nunca no sono.
                const ritmo = !!(prev.mealRhythm && (prev.mealRhythm.inApp || prev.mealRhythm.push));
                const secondGapHour = awakeSecondGapHours(
                  Math.random, now, normalizeMealTimes(prev.mealRhythm?.times), prev.rest?.window ?? null, ritmo,
                );
                newScheduled = [...newScheduled, now + secondGapHour * 3600000];
              }
              return { ...prev, poopEventsShown: newShown, poopEventsScheduled: newScheduled };
            });
            break; // at most one poop per tick
          }
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [
    gameState.poopEventsScheduled,
    gameState.poopEventsShown,
    gameState.evolutionStage,
    careEvent,
    language,
    isSleeping,
  ]);

  // Antes isto trocava a fala do pet por "Complete a task!" sempre que havia
  // cocô ou comida na tela — cobrança, e errada (o cocô é agendado por tempo,
  // não por tarefa). O retorno nunca era renderizado, mas a função existia
  // esperando para voltar a viver.
  return {};
}
