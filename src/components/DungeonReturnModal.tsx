import { ModalSheet, sm2Button, sm2Text } from './form/FormKit';
import { BitsAmount } from './ui/BitsAmount';
import type { Language } from '../utils/i18n';

/** beta3 A2: o resumo de quando o Soulmon VOLTA SOZINHO da masmorra (a energia/HP/teto acabou). Centralizado, sem cobrança. */
export interface DungeonReturnSummary {
  layers: number;
  bits: number;
  fragments: number;
  hearts: number;
  glitchtama: number;
  ended: string | null;
}

export function DungeonReturnModal({ summary, language, onClose }: { summary: DungeonReturnSummary; language: Language; onClose: () => void }) {
  const isPt = language === 'pt-BR';
  const n = summary.layers;
  const linhas: string[] = [];
  linhas.push(`${n} ${isPt ? (n === 1 ? 'camada limpa' : 'camadas limpas') : (n === 1 ? 'layer cleared' : 'layers cleared')}`);
  if (summary.fragments > 0) linhas.push(`${summary.fragments} ${isPt ? 'fragmentos' : 'fragments'}`);
  if (summary.hearts > 0) linhas.push(`${summary.hearts} 💗`);
  if (summary.glitchtama > 0) linhas.push(`${summary.glitchtama} 🌀`);
  const motivo = summary.ended === 'hp'
    ? (isPt ? 'O fôlego dele acabou.' : 'He ran out of breath.')
    : (isPt ? 'A energia da descida acabou.' : 'The descent ran out of energy.');
  return (
    <ModalSheet
      open
      placement="center"
      onClose={onClose}
      language={language}
      title={isPt ? 'Ele voltou da masmorra' : "He's back from the dungeon"}
      maxWidth={380}
      footer={<button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }} data-dungeon-return-ok>{isPt ? 'Ótimo' : 'Great'}</button>}
    >
      <div data-dungeon-return-modal>
        <p style={{ ...sm2Text, margin: '0 0 8px' }}>{motivo}</p>
        <ul style={{ ...sm2Text, margin: 0, paddingLeft: 18 }}>
          {linhas.map(l => <li key={l}>{l}</li>)}
          <li><BitsAmount value={summary.bits} size={14} /></li>
        </ul>
      </div>
    </ModalSheet>
  );
}
