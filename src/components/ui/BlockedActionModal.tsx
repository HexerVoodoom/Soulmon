/**
 * O modalzinho PADRÃO de ação bloqueada (dono, 09/11/2026): diz POR QUE não dá. Fecha com OK, com o fechar do canto ou
 * tocando fora (`ModalSheet` centralizado em portal: foco, Esc, véu e a camada acima do voltar já vêm dele). O nome do lugar
 * em "pode ser obtido em <lugar>" é tocável e leva o jogador até lá (`requestGoToBuilding`, ouvido pelo `App`).
 */
import { useCallback, useState, type ReactNode } from 'react';
import { ModalSheet } from '../form/FormKit';
import { explainBlocked, requestGoToBuilding, type BlockedReason } from '../../utils/blockedAction';
import type { BuildingId } from '../../utils/gates';
import type { Language } from '../../utils/i18n';

export function BlockedActionModal({ reason, onClose, language, onGo }: {
  reason: BlockedReason | null;
  onClose: () => void;
  language: Language;
  /** Navegação própria; sem ela, vai pelo evento do `App`. */
  onGo?: (rota: BuildingId) => void;
}) {
  const isPt = language === 'pt-BR';
  const ex = reason ? explainBlocked(reason, isPt) : null;
  return (
    <ModalSheet open={!!ex} title={ex?.title ?? ''} onClose={onClose} language={language} placement="center" titulo="inline" sobreTelas maxWidth={380}
      footer={<button type="button" className="sm2-kit-btn sm2-kit-btn-primary" style={{ width: '100%' }} data-blocked-ok onClick={onClose}>OK</button>}>
      {ex && reason && (
        <div data-blocked-action={reason.kind} style={{ display: 'grid', gap: 8 }}>
          {ex.lines.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }} data-blocked-lines>
              {ex.lines.map(l => <li key={l} className="sm2-stats-s">{l}</li>)}
            </ul>
          )}
          {ex.sources.map(s => (
            <p key={s.rota + s.prefix} className="sm2-stats-s" style={{ margin: 0 }} data-blocked-source={s.rota}>
              {s.prefix}{' '}
              <button type="button" className="sm2-blocked-link" data-blocked-go={s.rota}
                onClick={() => { onClose(); (onGo ?? requestGoToBuilding)(s.rota); }}>{s.label}</button>.
            </p>
          ))}
        </div>
      )}
    </ModalSheet>
  );
}

/** `const [blocked, explain] = useBlockedAction(language)`: renderize `blocked` e chame `explain(motivo)` no toque bloqueado. */
export function useBlockedAction(language: Language, onGo?: (rota: BuildingId) => void): [ReactNode, (r: BlockedReason) => void] {
  const [reason, setReason] = useState<BlockedReason | null>(null);
  const explain = useCallback((r: BlockedReason) => setReason(r), []);
  return [<BlockedActionModal key="blocked" reason={reason} onClose={() => setReason(null)} language={language} onGo={onGo} />, explain];
}

export default BlockedActionModal;
