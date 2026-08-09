import { useEffect } from 'react';
import { CareEvent } from '../components/CareSystem';
import { showNotification } from '../utils/notifications';
import type { Language } from '../utils/i18n';
import { getStageLevel } from '../types/progression';
import { earliestPoopHour } from '../utils/passives';

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
  // Schedule the day's FIRST poop at a random morning/afternoon time.
  // The second poop is scheduled only once the first actually appears (see the
  // polling loop below), so the ≥8h gap counts from the first poop's appearance.
  useEffect(() => {
    if (gameState.lastResetDate !== new Date().toDateString()) return;

    if (!gameState.poopEventsScheduled || gameState.poopEventsScheduled.length === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = today.getTime();
      // Primeiro cocô entre 07:00 e 15:00 — deixa espaço para o segundo (8-10h
      // depois) ainda cair no mesmo dia. O traço Madrugador (utils/passives.ts)
      // empurra o início para as 10h.
      const earliest = earliestPoopHour(gameState.petPassive, 7);
      const firstPoopHour = earliest + Math.random() * (15 - earliest);
      setGameState(prev => ({
        ...prev,
        poopEventsScheduled: [startOfDay + firstPoopHour * 3600000],
      }));
    }
  }, [gameState.lastResetDate, gameState.poopEventsScheduled, gameState.evolutionStage, gameState.petPassive]);

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
