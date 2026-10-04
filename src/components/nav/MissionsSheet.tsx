import { Suspense, lazy } from 'react';
import type { Language } from '../../utils/i18n';
import type { CrossingsState } from '../../types/travessias';
import { ModalSheet } from '../form/FormKit';

const PasseioSheet = lazy(() => import('../play/PasseioSheet').then(m => ({ default: m.PasseioSheet })));

/**
 * A LISTA DE MISSÕES, aberta pelo ícone da Home (rodada 7, M8): a MESMA folha do
 * Passeio (as três do dia, a escolhida com o relógio de 24 h, o registro das
 * feitas) dentro de uma folha modal. Uma regra só, dois lugares — nada daqui
 * escreve estado que o Passeio não escreva.
 */
export function MissionsSheet({ open, onClose, language, crossings, onChange, todayKey, seed }: {
  open: boolean;
  onClose: () => void;
  language: Language;
  crossings: CrossingsState;
  onChange: (f: (c: CrossingsState) => CrossingsState) => void;
  todayKey: string;
  seed: string;
}) {
  const isPt = language === 'pt-BR';
  return (
    <ModalSheet open={open} title={isPt ? 'Missões' : 'Missions'} onClose={onClose} language={language}>
      <div data-missions-sheet>
        <Suspense fallback={null}>
          <PasseioSheet language={language} crossings={crossings} onChange={onChange} todayKey={todayKey} seed={seed} />
        </Suspense>
      </div>
    </ModalSheet>
  );
}
