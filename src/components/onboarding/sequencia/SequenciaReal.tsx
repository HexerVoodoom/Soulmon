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
