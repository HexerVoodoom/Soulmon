import { useEffect, useState } from 'react';
import { GROUND_Y } from '../utils/petStage';
import poopSprite from 'figma:asset/9087038914d85d3c74c1b4c1fb6e2b91f486cbee.png';
import foodSprite from 'figma:asset/90d2794255a0abd49ab9e2ca8c9f1c54b45d7cd0.png';

export interface CareEvent {
  type: 'poop' | 'food';
  requestTime: number;
  showSprite: boolean;
}

interface CareSystemProps {
  careEvent: CareEvent | null;
  onCareEventComplete: () => void;
  language?: 'pt-BR' | 'en-US';
}

export function CareSystem({ careEvent, onCareEventComplete, language = 'en-US' }: CareSystemProps) {
  const isPt = language === 'pt-BR';
  if (!careEvent || !careEvent.showSprite) {
    return null;
  }

  const isPoop = careEvent.type === 'poop';

  // Cocô/comida ficam APOIADOS no chão do palco, como toda a decoração
  // (utils/petStage.ts). Antes eram `bottom-3 right-3` — uma regra anterior ao
  // palco, que os deixava boiando abaixo da linha do piso. O x é 66%: a faixa
  // livre entre a vitrine (47%) e o canto direito (84%).
  const SIZE = 48;
  return (
    <div
      className="absolute z-10 animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{ left: '66%', top: `${GROUND_Y}%`, marginLeft: -SIZE / 2, marginTop: -SIZE }}
    >
      <img
        src={isPoop ? poopSprite : foodSprite}
        alt={isPoop ? (isPt ? 'Cocô para limpar' : 'Poop to clean') : (isPt ? 'Comida' : 'Food')}
        onClick={isPoop ? undefined : onCareEventComplete}
        className={`w-12 h-12 object-contain transition-transform ${isPoop ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
        title={isPoop ? (isPt ? '🚿 Dê um banho para limpar' : '🚿 Use the shower to clean') : (isPt ? 'Alimentar' : 'Feed')}
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}

// getCareMessage foi removida: devolvia "Complete a task!" como resposta a
// fome e cocô — cobrança, e factualmente errada (o cocô é agendado por tempo).
// Não era renderizada em lugar nenhum, mas voltaria a viver com uma linha.

export function scheduleCareEvents(
  lastResetDate: string,
  hasIncompleteTasks: boolean
): { nextPoopTime: number | null; nextFoodTimes: number[] } {
  if (!hasIncompleteTasks) {
    return { nextPoopTime: null, nextFoodTimes: [] };
  }

  const today = new Date();
  const todayStr = today.toDateString();
  
  // Only schedule if we're on the same day
  if (todayStr !== lastResetDate) {
    return { nextPoopTime: null, nextFoodTimes: [] };
  }

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  // Random time for poop (once per day, between 8 AM and 8 PM)
  const poopHour = 8 + Math.random() * 12; // 8 AM to 8 PM
  const nextPoopTime = startOfDay.getTime() + (poopHour * 60 * 60 * 1000);

  // Two random times for food (between 8 AM and 8 PM, at least 3 hours apart)
  const firstFoodHour = 8 + Math.random() * 6; // 8 AM to 2 PM
  const secondFoodHour = 14 + Math.random() * 6; // 2 PM to 8 PM
  
  const nextFoodTimes = [
    startOfDay.getTime() + (firstFoodHour * 60 * 60 * 1000),
    startOfDay.getTime() + (secondFoodHour * 60 * 60 * 1000),
  ];

  return { nextPoopTime, nextFoodTimes };
}
