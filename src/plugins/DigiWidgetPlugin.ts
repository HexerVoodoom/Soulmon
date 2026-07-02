import { registerPlugin } from '@capacitor/core';

export interface DigiWidgetData {
  digimonName: string;
  currentStage: string;
  eggType: string;
  branchType: string;
  completedTasks: number;
  totalTasks: number;
  hp: number;
  healthPoints: number;
  maxHealthPoints: number;
  energyPoints: number;
  /** True while there's poop on screen that hasn't been cleaned. */
  hasPoop: boolean;
}

export interface DigiWidgetPlugin {
  updateWidgetData(data: DigiWidgetData): Promise<void>;
}

const DigiWidget = registerPlugin<DigiWidgetPlugin>('DigiWidget', {
  // No-op web implementation — widget only exists on Android
  web: {
    async updateWidgetData() {},
  },
});

export { DigiWidget };
