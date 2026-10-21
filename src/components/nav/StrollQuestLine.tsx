import type { Language } from '../../utils/i18n';
import type { CrossingsState } from '../../types/travessias';
import { strollLineState } from '../../utils/travessiasSave';
import { ClaimButton, MissionCard, type MissionEntry } from './MissionCard';

/**
 * A LINHA "Take a stroll" do menu de Missões da Home (07/10/2026, pedido do dono: "Stroll fica com o NPC!").
 * O Passeio inteiro — propostas, card, relógio de 30 min, "Concluir" — mora no lote do Passeio (NPC Amandha);
 * aqui o cartão só APONTA ("!"), fica PRONTO ("?" + Resgatar) quando o passeio foi concluído lá hoje, e depois
 * mostra "Resgatada". Não abre o `PasseioSheet`, não tem timer. O Resgatar é só o recibo do dia
 * (`claimStroll`): o pagamento já saiu no "Concluir" do NPC e não se paga duas vezes.
 * Desde 14/10/2026 é um CARTÃO (`MissionCard`, REGISTRO §62), como todas as missões da folha.
 */
export interface StrollLineProps {
  language: Language;
  crossings: CrossingsState;
  /** Dia do JOGADOR (`AAAA-MM-DD`). */
  todayKey: string;
  onClaim: () => void;
  /** Pedido do dono (11/10/2026): tocar em "Faça um passeio" leva ao PRÉDIO do Passeio. */
  onGo?: () => void;
}

/** A entrada do Passeio para a lista unificada da aba Diárias (`DailyMissionBoard`). */
export function strollEntries({ language, crossings, todayKey, onClaim, onGo }: StrollLineProps): MissionEntry[] {
  const isPt = language === 'pt-BR';
  const st = strollLineState(crossings, todayKey);
  const state = st === 'claimed' ? 'claimed' : st === 'ready' ? 'ready' : 'open';
  return [{
    key: 'stroll',
    state,
    node: (
      <MissionCard
        key="stroll"
        language={language}
        attrs={{ 'data-stroll-line': '', 'data-status': st }}
        status={state}
        title={isPt ? 'Faça um passeio' : 'Take a stroll'}
        desc={isPt ? 'A aventura acontece no lote do Passeio.' : 'The adventure happens at the Stroll lot.'}
        onGo={onGo}
        goAttr="data-stroll-go"
        action={<ClaimButton language={language} attrs={{ 'data-claim': 'stroll' }} onClick={onClaim} />}
      />
    ),
  }];
}
