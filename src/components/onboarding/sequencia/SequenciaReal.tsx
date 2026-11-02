import { useState } from 'react';
import type { Language } from '../../../utils/i18n';
import { SequenciaOnboarding } from './SequenciaOnboarding';
import { SLOTS_REAIS, LigacoesOnboardingContext, type LigacoesOnboarding } from './slotsReais';

/** Sequência + ligações reais num único módulo, para o App carregá-lo `lazy` (traz Match3Game/BattleStage junto, fora da entrada). */
export function SequenciaReal({ language, ligacoes, onDone }: { language: Language; ligacoes: LigacoesOnboarding; onDone: () => void }) {
  return (
    <LigacoesOnboardingContext.Provider value={ligacoes}>
      <SequenciaOnboarding language={language} slots={SLOTS_REAIS} onDone={onDone} />
    </LigacoesOnboardingContext.Provider>
  );
}

type TarefaRevisao = NonNullable<LigacoesOnboarding['tasks']>[number];

/** "Ver intro" das Configurações: as mesmas etapas reais (puzzle, tarefa, alimentar, duelo), mas com tarefas e comida num estado LOCAL — rever a história nunca mexe no save. */
export function SequenciaRevisao({ language, ligacoes, onDone }: { language: Language; ligacoes: Pick<LigacoesOnboarding, 'maxActivities' | 'spriteUrl' | 'petName' | 'evolutionStage' | 'demoCharacterId'>; onDone: () => void }) {
  const [tasks, setTasks] = useState<TarefaRevisao[]>([]);
  const lig: LigacoesOnboarding = {
    ...ligacoes,
    tasks,
    onCreateTask: item => setTasks(t => [...t, { id: `revisao-${t.length}`, name: item.name, category: item.category, emoji: item.emoji, completed: false } as TarefaRevisao]),
    onCompleteTask: id => setTasks(t => t.map(x => (x.id === id ? { ...x, completed: true } : x))),
    foodInventory: { '🍎': 1 },
    onFeed: () => {},
  };
  return (
    <LigacoesOnboardingContext.Provider value={lig}>
      <SequenciaOnboarding forcar language={language} slots={SLOTS_REAIS} onDone={onDone} />
    </LigacoesOnboardingContext.Provider>
  );
}
