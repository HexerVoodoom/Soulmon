/**
 * Modal de RENOMEAR da Hexsmith (11/11/2026): caixa de texto + custo (`HEX_RENAME_COST` Bits) + confirmação antes de gastar.
 * A troca é do SERVIDOR (`cloudHexRename`): ele valida o nome, debita e grava; o cliente só aplica o que ele confirmou.
 * O `ModalSheet` cuida de modalDepth (a tela de trás esmaece) e do Voltar.
 */
import { useState } from 'react';
import { useBackLayer } from '../../utils/backStack';
import type { Language } from '../../utils/i18n';
import { Field, FieldWarn, ModalSheet, sm2Button, sm2Hint, sm2Label, sm2Text } from '../form/FormKit';
import { BitsAmount } from '../ui/BitsAmount';
import { spendableBits } from '../../utils/bitsOrigin';
import { HEX_RENAME_COST, HEX_RENAME_MAX, hexRenameClean, hexRenameRefusal, type HexRenameKind } from '../../utils/hexsmithRename';
import { HEX_RENAME_COPY, HEX_UI, tx } from '../../utils/hexsmithCopy';

type GS = Parameters<typeof hexRenameRefusal>[0];

export function HexRenameModal({ kind, language, gs, atual, aviso, ocupado, onClose, onConfirm }: {
  kind: HexRenameKind; language: Language; gs: GS; atual: string; aviso: string | null; ocupado: boolean;
  onClose: () => void; onConfirm: (nome: string) => void;
}) {
  const isPt = language === 'pt-BR';
  const [texto, setTexto] = useState(atual);
  const [pedindo, setPedindo] = useState(false);
  const C = HEX_RENAME_COPY[kind];
  const recusa = hexRenameRefusal(gs, kind, texto);
  const mostraRecusa = recusa && recusa !== 'empty' && (recusa !== 'same');
  const limpo = hexRenameClean(texto);
  // Voltar = UM nível: na confirmação (Sim/Não) volta ao campo; no campo, volta ao mapa. Nunca fecha a Hexsmith (o ✕ é o do modal principal).
  const voltar = () => { if (pedindo) setPedindo(false); else onClose(); };
  useBackLayer(true, voltar);
  return (
    <ModalSheet open title={tx(C.title, isPt)} onClose={voltar} onBack={voltar} language={language}
      footer={pedindo && limpo ? (
        <div data-hex-rename-confirm className="sm2-hex-footer">
          <p style={{ ...sm2Text, textAlign: 'center' }}>{tx(HEX_RENAME_COPY.confirmAsk, isPt).replace('{n}', String(HEX_RENAME_COST))} <strong>{limpo}</strong></p>
          <button type="button" data-hex-rename-yes disabled={ocupado} style={sm2Button('primary', ocupado)} onClick={() => { onConfirm(limpo); setPedindo(false); }}>
            {tx(HEX_RENAME_COPY.yes, isPt)}
          </button>
          <button type="button" data-hex-rename-no style={sm2Button('outline', false)} onClick={() => setPedindo(false)}>{tx(HEX_RENAME_COPY.no, isPt)}</button>
        </div>
      ) : (
        <div className="sm2-hex-footer">
          <button type="button" data-hex-rename-go disabled={!!recusa || ocupado} style={sm2Button('primary', !!recusa || ocupado)} onClick={() => setPedindo(true)}>
            {ocupado ? tx(HEX_RENAME_COPY.working, isPt) : tx(HEX_RENAME_COPY.confirm, isPt)}
          </button>
        </div>
      )}>
      <div data-hex-rename-panel={kind} className="sm2-hex-panel">
        <p style={sm2Hint}>{tx(C.hint, isPt)}</p>
        {aviso && <p role="status" data-hex-rename-aviso style={sm2Text}>{aviso}</p>}
        <label htmlFor="hex-rename-input" style={{ ...sm2Label, margin: 0 }}>{tx(HEX_RENAME_COPY.label, isPt)}</label>
        <Field id="hex-rename-input" value={texto} maxLength={HEX_RENAME_MAX} warn={recusa === 'invalid'} aria-describedby="hex-rename-help"
          onChange={(e) => { setTexto(e.target.value); setPedindo(false); }} />
        {recusa === 'invalid'
          ? <FieldWarn id="hex-rename-help">{tx(HEX_RENAME_COPY.refusal.invalid, isPt)}</FieldWarn>
          : <p id="hex-rename-help" style={sm2Hint}>{tx(HEX_RENAME_COPY.rules, isPt)}</p>}
        <p data-hex-rename-cost className="sm2-hex-balance">
          <span>{tx(HEX_RENAME_COPY.cost, isPt)}</span>
          <BitsAmount value={HEX_RENAME_COST} size={20} dim={spendableBits(gs) < HEX_RENAME_COST} unit={tx(HEX_UI.bitsEarned, isPt)} />
          <span aria-hidden="true">{tx(HEX_UI.bitsEarned, isPt)}</span>
        </p>
        {mostraRecusa && recusa !== 'invalid' && <p data-hex-rename-refusal={recusa} style={sm2Hint}>{tx(HEX_RENAME_COPY.refusal[recusa], isPt)}</p>}
        {recusa === 'same' && <p data-hex-rename-refusal="same" style={sm2Hint}>{tx(HEX_RENAME_COPY.refusal.same, isPt)}</p>}
      </div>
    </ModalSheet>
  );
}
