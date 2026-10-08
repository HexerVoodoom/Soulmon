import type { Language } from '../../utils/i18n';
import type { CrossingsState } from '../../types/travessias';
import { strollLineState } from '../../utils/travessiasSave';
import { sm2Button } from '../form/FormKit';
import { MissionMark } from '../play/MissionMark';

/**
 * A LINHA "Take a stroll" do menu de Missões da Home (07/10/2026, pedido do dono: "Stroll fica com o NPC!").
 * O Passeio inteiro — propostas, card, relógio de 30 min, "Concluir" — mora no lote do Passeio (NPC Brume);
 * aqui a linha só APONTA ("!"), fica PRONTA ("?" + Resgatar) quando o passeio foi concluído lá hoje, e depois
 * mostra "Resgatada". Não abre o `PasseioSheet`, não tem timer. O Resgatar é só o recibo do dia
 * (`claimStroll`): o pagamento já saiu no "Concluir" do NPC e não se paga duas vezes.
 */
export function StrollQuestLine({ language, crossings, todayKey, onClaim }: {
  language: Language;
  crossings: CrossingsState;
  /** Dia do JOGADOR (`AAAA-MM-DD`). */
  todayKey: string;
  onClaim: () => void;
}) {
  const isPt = language === 'pt-BR';
  const st = strollLineState(crossings, todayKey);
  return (
    <ul data-stroll-quest style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <li data-stroll-line data-status={st} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1 }}>🧭</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="sm2-title" style={{ display: 'block', fontSize: 'var(--sm2-text-md)', color: st === 'claimed' ? 'var(--sm2-muted)' : undefined }}>
            {isPt ? 'Faça um passeio' : 'Take a stroll'}
          </span>
        </span>
        {st === 'point' && <MissionMark kind="available" size={24} isPt={isPt} />}
        {st === 'ready' && <MissionMark kind="ready" size={24} isPt={isPt} />}
        {st === 'ready' && (
          <button type="button" style={sm2Button('primary', false, 'sm')} data-claim="stroll" onClick={onClaim}>
            {isPt ? 'Resgatar' : 'Claim'}
          </button>
        )}
        {st === 'claimed' && <span style={{ fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-muted)' }}>{isPt ? 'Resgatada' : 'Claimed'}</span>}
      </li>
    </ul>
  );
}
