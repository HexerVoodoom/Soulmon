import { useCallback } from 'react';
import type { Language } from '../../../utils/i18n';
import { readLocal, writeLocal } from '../../../utils/safeStorage';
import { SEQUENCIA_VELADO } from './cenas';
import { SequenciaPlayer } from './SequenciaPlayer';
import { onboardingVeladoLigado } from './flag';
import type { Quadro, SlotRenderers } from './types';

/** Escolha da bifurcação (cena 5), cosmética. */
export const CHAVE_CAMINHO = 'soulmon-onboarding-caminho';
export const lerCaminho = (): string | null => readLocal(CHAVE_CAMINHO);

export interface SequenciaOnboardingProps {
  language: Language;
  /** Frentes plugam aqui: puzzle (cena 4), tarefa (cena 6), duelo (cena 7). */
  slots?: SlotRenderers;
  quadros?: Quadro[];
  onDone: () => void;
  onMusica?: (faixa: 'suspense' | null) => void;
  /** Para "Rever a história", ignora o interruptor. */
  forcar?: boolean;
}

/** Entrada atrás do interruptor ONBOARDING_VELADO (desligado = renderiza nada). */
export function SequenciaOnboarding({ language, slots, quadros = SEQUENCIA_VELADO, onDone, onMusica, forcar }: SequenciaOnboardingProps) {
  const escolher = useCallback((id: string) => { writeLocal(CHAVE_CAMINHO, id); }, []);
  if (!forcar && !onboardingVeladoLigado()) return null;
  return <SequenciaPlayer quadros={quadros} language={language} slots={slots} onDone={onDone} onChoice={escolher} onMusica={onMusica} />;
}
