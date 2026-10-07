import { useEffect, useState } from 'react';
import { GROUND_Y } from '../utils/petStage';
import { ANIM_ART } from '../utils/animArt';
import { SpriteAnim } from './pixel/SpriteAnim';
import foodSprite from 'figma:asset/90d2794255a0abd49ab9e2ca8c9f1c54b45d7cd0.png';

/* O cocô SAIU do `figma:asset/9087…` (156×145, herança do DigiApp) em
   16/09/2026 — canvas Home, achado 4 / PetDeckEstados: o adereço é o FX
   próprio `anim-poop-plop` do `animArt`, na grade 64 × 2 do vidro. A folha
   toca UMA vez (`forwards`) e PARA no quadro 3/3 — o quadro final É o cocô
   assentado; não existe mais um PNG estático por cima. Sob movimento
   reduzido a animação encolhe para o fim e o quadro 3 aparece direto. */
const FX_PX = 128;

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
  if (isPoop) {
    return (
      <div
        className="absolute z-10"
        data-care-poop
        role="img"
        aria-label={isPt ? 'Cocô para limpar — dê um banho' : 'Poop to clean — use the shower'}
        style={{ left: '66%', top: `${GROUND_Y}%`, marginLeft: -FX_PX / 2, marginTop: -FX_PX + 16, width: FX_PX, height: FX_PX, pointerEvents: 'none' }}
      >
        <SpriteAnim
          key={`plop-${careEvent.requestTime}`}
          sheet={ANIM_ART.poopPlop}
          size={FX_PX}
          durationMs={450}
          hold
          style={{ position: 'absolute', left: 0, top: 0 }}
        />
      </div>
    );
  }

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
        src={foodSprite}
        alt={isPt ? 'Comida' : 'Food'}
        onClick={onCareEventComplete}
        className="w-12 h-12 object-contain transition-transform cursor-pointer hover:scale-110 active:scale-95"
        title={isPt ? 'Alimentar' : 'Feed'}
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
