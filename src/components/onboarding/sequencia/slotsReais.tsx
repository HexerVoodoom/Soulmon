import { createContext, useContext, useState } from 'react';
import type { ComponentProps } from 'react';
import { EtapaPuzzle } from '../etapas/EtapaPuzzle';
import { EtapaTarefa } from '../etapas/EtapaTarefa';
import { EtapaAlimentar } from '../etapas/EtapaAlimentar';
import { EtapaDuelo } from '../etapas/EtapaDuelo';
import type { NovaTarefa } from '../etapas/tipos';
import type { SlotProps, SlotRenderers } from './types';

/** O que o App liga às etapas reais. Os componentes de slot são estáveis (module-level) e leem daqui: mudar o estado não remonta a etapa. */
export interface LigacoesOnboarding {
  tasks: ComponentProps<typeof EtapaTarefa>['tasks'];
  maxActivities: number;
  onCreateTask: (item: NovaTarefa) => void;
  onCompleteTask: (id: string) => void;
  foodInventory: Record<string, number>;
  onFeed: (emoji: string) => void;
  spriteUrl?: string;
  petName?: string;
  evolutionStage?: string;
  demoCharacterId?: string;
}

export const LigacoesOnboardingContext = createContext<LigacoesOnboarding | null>(null);
const useLig = (): Partial<LigacoesOnboarding> => useContext(LigacoesOnboardingContext) ?? {};

function SlotPuzzle({ language, onDone }: SlotProps) {
  const l = useLig();
  return <EtapaPuzzle language={language} onDone={() => onDone()} evolutionStage={l.evolutionStage} demoCharacterId={l.demoCharacterId}
    petName={l.petName} maxActivities={l.maxActivities} onCreateTask={l.onCreateTask} />;
}

/** D24: tarefa e, ao terminar, alimentar. */
export function SlotTarefa({ language, onDone }: SlotProps) {
  const l = useLig();
  const [alimentando, setAlimentando] = useState(false);
  if (alimentando) {
    return <EtapaAlimentar language={language} onDone={() => onDone()} foodInventory={l.foodInventory} onFeed={l.onFeed} spriteUrl={l.spriteUrl} petName={l.petName} />;
  }
  return <EtapaTarefa language={language} onDone={() => setAlimentando(true)} tasks={l.tasks} maxActivities={l.maxActivities}
    onCreateTask={l.onCreateTask} onCompleteTask={l.onCompleteTask} />;
}

function SlotDuelo({ language, onDone }: SlotProps) {
  const l = useLig();
  return <EtapaDuelo language={language === 'pt-BR' ? 'pt-BR' : 'en'} onDone={() => onDone()} playerSprite={l.spriteUrl} />;
}

export const SLOTS_REAIS: SlotRenderers = { puzzle: SlotPuzzle, tarefa: SlotTarefa, duelo: SlotDuelo };
