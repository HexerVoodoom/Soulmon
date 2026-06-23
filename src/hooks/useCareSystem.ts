import { useEffect } from 'react';
import { CareEvent, getCareMessage } from '../components/CareSystem';
import { showNotification } from '../utils/notifications';
import { getStageLevel } from '../types/progression';
import type { Language } from '../utils/i18n';

interface Activity {
  steps: { completed: boolean }[];
}

interface CareGameState {
  activities: Activity[];
  lastResetDate: string;
  poopEventScheduled: number | null;
  poopEventCompleted: boolean;
  foodEventsScheduled: number[];
  foodEventsCompleted: number[];
  evolutionStage: string;
  maxHealthPoints: number;
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
  // Schedule the next poop relative to now — recurring and independent of
  // activities, so it reliably appears even for task-only players.
  useEffect(() => {
    if (gameState.poopEventScheduled || careEvent?.type === 'poop') return;
    const delayMs = (30 + Math.random() * 60) * 60000; // 30–90 minutes
    setGameState(prev => ({
      ...prev,
      poopEventScheduled: Date.now() + delayMs,
      poopEventCompleted: false,
    }));
  }, [gameState.poopEventScheduled, careEvent]);

  // Schedule food events (still tied to having pending activity steps)
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
  }, [gameState.lastResetDate, gameState.foodEventsScheduled]);

  // Check care events and trigger them
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const maxHP = gameState.maxHealthPoints;
      const dailyCap = Math.floor(maxHP / 2);
      const penalty = carePenalty(maxHP);
      const ispt = language === 'pt-BR';

      // ── Poop appears when due (independent of activities) ────────────────────
      if (gameState.poopEventScheduled && !careEvent && now >= gameState.poopEventScheduled) {
        setCareEvent({ type: 'poop', requestTime: now, showSprite: true });
        // Clear the schedule; a fresh poop is queued once this one is cleaned.
        setGameState(prev => ({ ...prev, poopEventScheduled: null }));
        setMessageTrigger(prev => prev + 1);
        showNotification(
          ispt ? '🚽 Hora de limpar!' : '🚽 Bathroom time!',
          {
            body: ispt
              ? 'Seu Digimon fez cocô! Dê um banho para limpar. 🚿'
              : 'Your Digimon pooped! Give it a shower to clean up. 🚿',
            tag: 'poop-event',
          },
        );
        return;
      }

      // ── Poop neglected too long → HP penalty, then reschedule ────────────────
      if (careEvent?.type === 'poop' && now - careEvent.requestTime >= 30 * 60000) {
        setGameState((prev: any) => {
          const remaining = dailyCap - (prev.careHPLostToday ?? 0);
          const damage = remaining > 0 ? 1 : 0;
          return {
            ...prev,
            healthPoints: Math.max(0, prev.healthPoints - damage),
            careHPLostToday: (prev.careHPLostToday ?? 0) + damage,
            poopEventScheduled: null, // queue the next poop
          };
        });
        setCareEvent(null);
        showNotification(
          ispt ? '😔 Que bagunça!' : '😔 What a mess!',
          {
            body: ispt
              ? 'Seu Digimon ficou sujo demais. Você perdeu HP.'
              : 'Your Digimon got too dirty. You lost HP.',
            tag: 'poop-missed',
          },
        );
        return;
      }

      // ── Food events (still tied to pending activity steps) ───────────────────
      const allSteps = gameState.activities.flatMap(a => a.steps);
      if (!allSteps.some(s => !s.completed)) return;

      if (gameState.foodEventsScheduled && gameState.foodEventsCompleted) {
        gameState.foodEventsScheduled.forEach((foodTime, index) => {
          if (gameState.foodEventsCompleted.includes(index) || careEvent) return;

          const elapsed = now - foodTime;

          if (elapsed >= 0 && elapsed < 5 * 60000) {
            if (!careEvent || (careEvent as CareEvent).type !== 'food') {
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
            }
          } else if (elapsed >= 5 * 60000 && elapsed < 6 * 60000) {
            // 5–6 min: sprite + HP penalty (with daily cap and stage scaling)
            setCareEvent({ type: 'food', requestTime: foodTime, showSprite: true });
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
    gameState.poopEventScheduled,
    gameState.foodEventsScheduled,
    gameState.poopEventCompleted,
    gameState.foodEventsCompleted,
    gameState.maxHealthPoints,
    gameState.careHPLostToday,
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
