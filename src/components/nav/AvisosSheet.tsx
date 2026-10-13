import { useEffect, type ReactNode } from 'react';
import type { Language } from '../../utils/i18n';
import { ModalSheet } from '../form/FormKit';

/**
 * A FOLHA DOS AVISOS da Home (beta-2, F3 do crítico). Bottom sheet padrão (`ModalSheet`) com os avisos do dia NA ORDEM da fila de
 * prioridade da Home (a fila não mudou — só o lugar onde ela é lida: saiu da faixa acima de "HOJE" e foi para esta folha, aberta pelo
 * `AvisosLink` do canto direito). O check-in da janela entra por este mesmo canal (é um item da fila). Quando o último aviso some (o
 * resgate, o "Ok"), a folha se fecha sozinha — não fica uma folha vazia aberta.
 */
export function AvisosSheet({ open, language, items, onClose }: {
  open: boolean;
  language: Language;
  items: { key: string; node: ReactNode }[];
  onClose: () => void;
}) {
  const vazio = items.length === 0;
  useEffect(() => { if (open && vazio) onClose(); }, [open, vazio, onClose]);
  return (
    <ModalSheet open={open && !vazio} title={language === 'pt-BR' ? 'Avisos' : 'Notices'} onClose={onClose} language={language}>
      <div data-avisos-sheet style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(a => <div key={a.key} data-aviso={a.key}>{a.node}</div>)}
      </div>
    </ModalSheet>
  );
}
