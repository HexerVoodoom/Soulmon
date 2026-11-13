import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { RitualRow } from './pixel/RitualPanel';
import type { Language } from '../utils/i18n';

/**
 * ⭐ Apresentação da TAREFA BÔNUS (pedido do dono, 13/11/2026). Abre UMA vez, na primeira conclusão de uma tarefa bônus
 * (`bonusIntroSeen` no save). Dois exemplos lado a lado com a MESMA `RitualRow` da lista — "Item comum" e "Item especial"
 * (título em bronze) — e a frase do dono. Exemplos só ilustram (`aria-hidden` + `inert`: fora do foco e do leitor de tela); a caixa é a da lista, não a tracejada de inerte.
 */
export function BonusTaskIntroModal({ open, language, onClose }: { open: boolean; language: Language; onClose: () => void }) {
  const isPt = language === 'pt-BR';
  const exemplo = (rotulo: string, nome: string, bonus: boolean) => (
    <figure data-bonus-intro-example={bonus ? 'bonus' : 'comum'} style={{ flex: '1 1 0', minWidth: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <figcaption style={{ ...sm2Hint, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{rotulo}</figcaption>
      <ul aria-hidden="true" {...({ inert: '' } as object)} className="sm2-conta-card" style={{ listStyle: 'none', margin: 0, padding: '2px 8px' }}>
        <RitualRow kind="habit" name={nome} value={0} max={1} bonus={bonus} onToggle={() => {}} language={language} />
      </ul>
    </figure>
  );
  return (
    <ModalSheet open={open} title={isPt ? 'Tarefa bônus' : 'Bonus task'} onClose={onClose} language={language} placement="center" maxWidth={420}>
      <div style={{ display: 'flex', gap: 8 }}>
        {exemplo(isPt ? 'Item comum' : 'Regular item', isPt ? 'Ler 10 páginas' : 'Read 10 pages', false)}
        {exemplo(isPt ? 'Item especial' : 'Special item', isPt ? 'Caminhar 5 min' : 'Walk 5 min', true)}
      </div>
      <p data-bonus-intro-text style={{ ...sm2Text, margin: 0 }}>
        {isPt
          ? 'Algumas tarefas podem receber bônus para te ajudar a completá-las. Essas tarefas concedem um ponto extra em direção à evolução.'
          : 'Some tasks can get a bonus to help you complete them. These tasks grant one extra point toward evolution.'}
      </p>
      <button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }}>
        {isPt ? 'Entendi' : 'Got it'}
      </button>
    </ModalSheet>
  );
}
