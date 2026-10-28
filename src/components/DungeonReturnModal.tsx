import { ModalSheet, sm2Button, sm2Text } from './form/FormKit';
import { BitsAmount } from './ui/BitsAmount';
import { RewardIcon, RewardPop } from './ui/RewardPop';
import { useRewardReveal } from '../hooks/useRewardReveal';
import { rewardItemLabel, useRewardItemIcon } from '../utils/rewardIcons';
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

/** Uma linha de item da volta: ícone (arte do item) que estoura + quantidade. O texto continua no DOM desde o primeiro quadro. */
function ReturnItem({ kind, qty, label, on, still, attr }: { kind: 'heart' | 'glitchtama' | 'fragments'; qty: number; label: string; on: boolean; still: boolean; attr: string }) {
  const src = useRewardItemIcon(kind);
  return (
    <li {...{ [attr]: '' }} style={{ listStyle: 'none', marginLeft: -18, display: 'flex', alignItems: 'center', gap: 8 }}>
      <RewardIcon src={src} size={24} on={on} still={still} />
      <span>{qty} {label}</span>
    </li>
  );
}

export function DungeonReturnModal({ summary, language, onClose }: { summary: DungeonReturnSummary; language: Language; onClose: () => void }) {
  const isPt = language === 'pt-BR';
  const n = summary.layers;
  const camadas = `${n} ${isPt ? (n === 1 ? 'camada limpa' : 'camadas limpas') : (n === 1 ? 'layer cleared' : 'layers cleared')}`;
  // O "o que rendeu" usa a revelação padrão: os ícones estouram um a um e os Bits rolam (toque no modal pula).
  const reveal = useRewardReveal([
    ...(summary.hearts > 0 ? [{ key: 'hearts' }] : []),
    ...(summary.glitchtama > 0 ? [{ key: 'glitchtama' }] : []),
    ...(summary.fragments > 0 ? [{ key: 'fragments' }] : []),
    { key: 'bits', roll: true },
  ], { active: true });
  const still = !reveal.animated;
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
      <div data-dungeon-return-modal onClick={reveal.skip}>
        <p style={{ ...sm2Text, margin: '0 0 8px' }}>{motivo}</p>
        <ul style={{ ...sm2Text, margin: 0, paddingLeft: 18 }}>
          <li>{camadas}</li>
          {summary.hearts > 0 && <ReturnItem kind="heart" qty={summary.hearts} label={rewardItemLabel('heart', isPt)} on={reveal.isShown('hearts')} still={still} attr="data-dungeon-return-hearts" />}
          {summary.glitchtama > 0 && <ReturnItem kind="glitchtama" qty={summary.glitchtama} label={isPt ? (summary.glitchtama === 1 ? 'item de marco' : 'itens de marco') : (summary.glitchtama === 1 ? 'milestone item' : 'milestone items')} on={reveal.isShown('glitchtama')} still={still} attr="data-dungeon-return-glitchtama" />}
          {summary.fragments > 0 && <ReturnItem kind="fragments" qty={summary.fragments} label={isPt ? 'fragmentos' : 'fragments'} on={reveal.isShown('fragments')} still={still} attr="data-dungeon-return-fragments" />}
          <li style={{ listStyle: 'none', marginLeft: -18 }}>
            <RewardPop on={reveal.isShown('bits')} still={still}>
              <BitsAmount value={summary.bits} size={14} roll={{ run: reveal.isRolling('bits'), still: still || reveal.isLanded('bits') }} />
            </RewardPop>
          </li>
        </ul>
      </div>
    </ModalSheet>
  );
}
