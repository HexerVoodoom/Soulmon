import { useEffect, useState } from 'react';
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
}

export function CareSystem({ careEvent, onCareEventComplete }: CareSystemProps) {
  if (!careEvent || !careEvent.showSprite) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <img
        src={careEvent.type === 'poop' ? poopSprite : foodSprite}
        alt={careEvent.type}
        className="w-12 h-12 object-contain"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}

export function getCareMessage(type: 'poop' | 'food'): string {
  if (type === 'poop') {
    return "I need to go to the bathroom! 💩 Complete a task!";
  }
  return "I'm hungry! 🍖 Complete a task to feed me!";
}

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
