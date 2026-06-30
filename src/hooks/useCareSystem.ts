import { useEffect } from 'react';
import { CareEvent, getCareMessage } from '../components/CareSystem';
import { showNotification } from '../utils/notifications';
import type { Language } from '../utils/i18n';
import { getStageLevel } from '../types/progression';

interface Activity {
  steps: { completed: boolean }[];
}

interface CareGameState {
  activities: Activity[];
  lastResetDate: string;
  poopEventsScheduled: number[];
  poopEventsCompleted: number[];
  poopEventsShown: number[];
  foodEventsScheduled: number[];
  foodEventsCompleted: number[];
  evolutionStage: string;
  maxHealthPoints: number;
  energyPoints: number;
  careHPLostToday: number;
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

/** HP damage for a missed food/poop event, scaled by stage. */
function carePenalty(maxHP: number): number {
  return maxHP >= 3 ? 2 : 1;
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
  // Schedule the day's FIRST poop at a random morning/afternoon time.
  // The second poop is scheduled only once the first actually appears (see the
  // polling loop below), so the ≥8h gap counts from the first poop's appearance.
  useEffect(() => {
    if (['digiegg', 'baby-i'].includes(getStageLevel(gameState.evolutionStage))) return;
    if (gameState.lastResetDate !== new Date().toDateString()) return;

    if (!gameState.poopEventsScheduled || gameState.poopEventsScheduled.length === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = today.getTime();
      // First poop somewhere between 07:00 and 15:00 — leaves room for the
      // second (8-10h later) to still land within the same day.
      const firstPoopHour = 7 + Math.random() * 8;
      setGameState(prev => ({
        ...prev,
        poopEventsScheduled: [startOfDay + firstPoopHour * 3600000],
      }));
    }
  }, [gameState.lastResetDate, gameState.poopEventsScheduled, gameState.evolutionStage]);

  // Schedule 2 food events per day (tied to having pending activity steps)
  useEffect(() => {
    const allSteps = gameState.activities.flatMap(a => a.steps);
    const hasIncompleteTasks = allSteps.some(s => !s.completed);
    if (!hasIncompleteTasks) return;

    if (gameState.lastResetDate !== new Date().toDateString()) return;

    if (!gameState.foodEventsScheduled || gameState.foodEventsScheduled.length === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = today.getTime();
      const firstFoodHour = 8 + Math.random() * 6;
      const secondFoodHour = 14 + Math.random() * 6;
      setGameState(prev => ({
        ...prev,
        foodEventsScheduled: [
          startOfDay + firstFoodHour * 3600000,
          startOfDay + secondFoodHour * 3600000,
        ],
      }));
    }
  }, [gameState.lastResetDate, gameState.foodEventsScheduled, gameState.activities]);

  // Check care events and trigger them
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const maxHP = gameState.maxHealthPoints;
      const dailyCap = Math.floor(maxHP / 2);
      const penalty = carePenalty(maxHP);
      const ispt = language === 'pt-BR';

      // ── Poop events (time-based, never while sleeping; NOT tied to tasks) ───
      // Sleeping holds poop back entirely, so an overnight sleep shields the
      // user from the day-turn penalty. Must run before the food early-return
      // below, which would otherwise block poop when there are no pending tasks.
      if (
        !isSleeping &&
        !['digiegg', 'baby-i'].includes(getStageLevel(gameState.evolutionStage)) &&
        !careEvent
      ) {
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
                  ? 'Seu Digimon fez cocô! Dê um banho para limpar. 🚿'
                  : 'Your Digimon pooped! Give it a shower to clean up. 🚿',
                tag: `poop-event-${index}`,
              },
            );
            setGameState((prev: any) => {
              const newShown = [...(prev.poopEventsShown || []), index];
              let newScheduled = prev.poopEventsScheduled || [];
              // First poop just appeared → schedule the second 8-10h later, so
              // the minimum 8h gap is measured from the first poop's appearance.
              if (index === 0 && newScheduled.length < 2) {
                const secondGapHour = 8 + Math.random() * 2;
                newScheduled = [...newScheduled, now + secondGapHour * 3600000];
              }
              return { ...prev, poopEventsShown: newShown, poopEventsScheduled: newScheduled };
            });
            break; // at most one poop per tick
          }
        }
      }

      // ── Food events (tied to pending activity steps) ────────────────────────
      const allSteps = gameState.activities.flatMap(a => a.steps);
      if (!allSteps.some(s => !s.completed)) return;

      if (gameState.foodEventsScheduled && gameState.foodEventsCompleted) {
        gameState.foodEventsScheduled.forEach((foodTime, index) => {
          // Skip if already completed, or if any care event is already active (poop takes priority)
          if (gameState.foodEventsCompleted.includes(index) || careEvent) return;

          const elapsed = now - foodTime;

          if (elapsed >= 0 && elapsed < 5 * 60000) {
            setCareEvent({ type: 'food', requestTime: foodTime, showSprite: true });
            setMessageTrigger(prev => prev + 1);
            showNotification(
              ispt ? '🍎 Hora da comida!' : '🍎 Feeding time!',
              {
                body: ispt
                  ? 'Seu Digimon está com fome. Alimente-o logo!'
                  : 'Your Digimon is hungry. Feed it quickly!',
                tag: `food-event-${index}`,
              },
            );
          } else if (elapsed >= 5 * 60000 && elapsed < 6 * 60000) {
            if (!careEvent) setCareEvent({ type: 'food', requestTime: foodTime, showSprite: true });
            setGameState((prev: any) => {
              const remaining = dailyCap - (prev.careHPLostToday ?? 0);
              if (remaining <= 0) {
                return { ...prev, foodEventsCompleted: [...(prev.foodEventsCompleted || []), index] };
              }
              const damage = Math.min(penalty, remaining);
              return {
                ...prev,
                healthPoints: Math.max(0, prev.healthPoints - damage),
                foodEventsCompleted: [...(prev.foodEventsCompleted || []), index],
                careHPLostToday: (prev.careHPLostToday ?? 0) + damage,
              };
            });
            showNotification(
              ispt ? '😢 Digimon com fome!' : '😢 Digimon went hungry!',
              {
                body: ispt
                  ? `Você perdeu ${penalty} HP por não alimentar seu Digimon a tempo.`
                  : `You lost ${penalty} HP for missing your Digimon's meal.`,
                tag: `food-missed-${index}`,
              },
            );
          }
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [
    gameState.foodEventsScheduled,
    gameState.foodEventsCompleted,
    gameState.poopEventsScheduled,
    gameState.poopEventsShown,
    gameState.evolutionStage,
    gameState.maxHealthPoints,
    gameState.careHPLostToday,
    gameState.activities,
    careEvent,
    language,
    isSleeping,
  ]);

  const getCompanionMessageWithCare = (fallbackMessage: string): string => {
    if (careEvent) {
      return getCareMessage(careEvent.type);
    }
    return fallbackMessage;
  };

  return { getCompanionMessageWithCare };
}
