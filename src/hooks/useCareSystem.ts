import { useEffect, useRef } from 'react';
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
}: UseCareSystemProps) {
  // Poop fires when energyPoints reaches maxHealthPoints - 1.
  // poopFiredRef prevents re-triggering while still at that level (e.g. after shower).
  // Resets to false whenever energy leaves the threshold so the next visit fires again.
  const poopFiredRef = useRef(false);
  useEffect(() => {
    if (['digiegg', 'baby-i'].includes(getStageLevel(gameState.evolutionStage))) return;

    const maxHP = gameState.maxHealthPoints;
    if (gameState.energyPoints !== maxHP - 1) {
      poopFiredRef.current = false;
      return;
    }

    if (poopFiredRef.current) return;
    poopFiredRef.current = true;

    const ispt = language === 'pt-BR';
    const now = Date.now();
    setCareEvent({ type: 'poop', requestTime: now, showSprite: true });
    setMessageTrigger(prev => prev + 1);
    showNotification(
      ispt ? '🚽 Hora de limpar!' : '🚽 Bathroom time!',
      {
        body: ispt
          ? 'Seu Digimon fez cocô! Dê um banho para limpar. 🚿'
          : 'Your Digimon pooped! Give it a shower to clean up. 🚿',
        tag: 'poop-energy-trigger',
      },
    );
  }, [gameState.energyPoints, gameState.maxHealthPoints, gameState.evolutionStage]);

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

      // ── Food events (tied to pending activity steps) ────────────────────────
      const allSteps = gameState.activities.flatMap(a => a.steps);
      if (!allSteps.some(s => !s.completed)) return;

      if (gameState.foodEventsScheduled && gameState.foodEventsCompleted) {
        gameState.foodEventsScheduled.forEach((foodTime, index) => {
          // Skip if already completed, or if any care event is already active (poop takes priority)
          if (gameState.foodEventsCompleted.includes(index) || careEvent) return;

          const elapsed = now - foodTime;

          if (elapsed >= 0 && elapsed < 5 * 60000) {
            setCareEvent({ type: 'food', requestTime: foodTime, showSprite: false });
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
    gameState.maxHealthPoints,
    gameState.careHPLostToday,
    gameState.activities,
    careEvent,
    language,
  ]);

  const getCompanionMessageWithCare = (fallbackMessage: string): string => {
    if (careEvent && !careEvent.showSprite) {
      return getCareMessage(careEvent.type);
    }
    return fallbackMessage;
  };

  return { getCompanionMessageWithCare };
}
