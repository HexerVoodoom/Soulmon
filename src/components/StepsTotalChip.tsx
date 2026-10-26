/**
 * Total de passos do dia, discreto, para a Home (Rodada 5, lane C; REGISTRO §176).
 *
 * ENTREGUE SEM SER LIGADO: `Home/CompanionHUD` está sendo mexido por outra frente, então este componente é só
 * exposto. Para ligar, UMA linha onde couber: `<StepsTotalChip steps={stepsToday} visible={stepsAvailable === true && gameState.stepsConsent === 'granted' && stepsPermission === true} language={language} />`.
 *
 * Regras: some por completo sem sensor/permissão (nada de "0", nada de aviso); só o total, SEM meta, SEM barra, SEM "faltam N"
 * (a meta e o andamento vivem na missão); mono `tabular-nums` para o número não pular a cada leitura.
 */
import type { Language } from '../utils/i18n';
import { sm2Hint } from './form/FormKit';

export interface StepsTotalChipProps {
  steps: number;
  /** Sensor disponível + consentimento + permissão. Falso = não existe. */
  visible: boolean;
  language: Language;
}

export function StepsTotalChip({ steps, visible, language }: StepsTotalChipProps) {
  if (!visible) return null;
  const pt = language === 'pt-BR';
  const n = Math.max(0, Math.floor(Number.isFinite(steps) ? steps : 0));
  return (
    <span data-steps-total="" className="sm2-num" style={{ ...sm2Hint, fontVariantNumeric: 'tabular-nums' }}>
      {n.toLocaleString(pt ? 'pt-BR' : 'en-US')} {pt ? 'passos hoje' : 'steps today'}
    </span>
  );
}

export default StepsTotalChip;
