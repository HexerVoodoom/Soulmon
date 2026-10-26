import { ModalSheet, sm2Button, sm2Text } from './form/FormKit';
import { BitsAmount } from './ui/BitsAmount';
import { Icon } from './ui/Icon';
import type { Language } from '../utils/i18n';
import type { DungeonReturnSummary } from '../utils/dungeonReturnSummary';

/** O motivo da volta, por `ended` (`AwayEnd` de `utils/dungeonAway.ts`): cada fim tem a sua frase, nunca "a energia acabou" para tudo. */
export function dungeonReturnReason(ended: string | null, isPt: boolean): string {
  switch (ended) {
    case 'hp': return isPt ? 'O fôlego dele acabou.' : 'He ran out of breath.';
    case 'retired': return isPt ? 'O foco terminou e ele voltou para casa.' : 'Your focus ended and he came home.';
    case 'deep': return isPt ? 'Ele chegou ao fundo da Fenda.' : 'He reached the bottom of the Rift.';
    case 'sealed': return isPt ? 'O próximo andar ainda está selado para ele.' : 'The next floor is still sealed for him.';
    case 'daily': return isPt ? 'O limite de camadas de hoje foi atingido.' : "Today's layer limit was reached.";
    default: return isPt ? 'A energia da descida acabou.' : 'The descent ran out of energy.';
  }
}

export type { DungeonReturnSummary };

export function DungeonReturnModal({ summary, language, onClose }: { summary: DungeonReturnSummary; language: Language; onClose: () => void }) {
  const isPt = language === 'pt-BR';
  const n = summary.layers;
  const linhas: string[] = [];
  linhas.push(`${n} ${isPt ? (n === 1 ? 'camada limpa' : 'camadas limpas') : (n === 1 ? 'layer cleared' : 'layers cleared')}`);
  if (summary.fragments > 0) linhas.push(`${summary.fragments} ${isPt ? 'fragmentos' : 'fragments'}`);
  const motivo = dungeonReturnReason(summary.ended, isPt);
  return (
    <ModalSheet
      open
      placement="center"
      onClose={onClose}
      language={language}
      title={isPt ? 'De volta da Fenda' : 'Back from the Rift'}
      maxWidth={380}
      footer={<button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }} data-dungeon-return-ok>{isPt ? 'Ótimo' : 'Great'}</button>}
    >
      <div data-dungeon-return-modal>
        <p style={{ ...sm2Text, margin: '0 0 8px' }}>{motivo}</p>
        <ul style={{ ...sm2Text, margin: 0, paddingLeft: 18 }}>
          {linhas.map(l => <li key={l}>{l}</li>)}
          {summary.hearts > 0 && <li data-dungeon-return-hearts><Icon name="favorite" size={20} tone="inherit" label={isPt ? 'corações' : 'hearts'} /> {summary.hearts}</li>}
          {summary.glitchtama > 0 && <li data-dungeon-return-glitchtama>{summary.glitchtama} {isPt ? (summary.glitchtama === 1 ? 'item de marco' : 'itens de marco') : (summary.glitchtama === 1 ? 'milestone item' : 'milestone items')}</li>}
          <li><BitsAmount value={summary.bits} size={14} /></li>
        </ul>
      </div>
    </ModalSheet>
  );
}
