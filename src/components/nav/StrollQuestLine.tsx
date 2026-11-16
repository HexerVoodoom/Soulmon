import type { Language } from '../../utils/i18n';
import type { CrossingsState } from '../../types/travessias';
import { missionLive, strollLineState } from '../../utils/travessiasSave';
import { travessiaTitle } from '../../utils/travessiaTitles';
import { sm2Button } from '../form/FormKit';
import { ClaimButton, MissionCard, type MissionEntry } from './MissionCard';

/**
 * A LINHA "Stroll" do menu de Missões da Home (07/10/2026, "Stroll fica com o NPC"; REGISTRO §413, 16/11/2026).
 * A ESCOLHA do passeio mora no lote do Passeio (NPC Lisel). Escolhido, a linha vira "Stroll" em turquesa (token `primary-ink`)
 * e, na frente, qual é o passeio; um "Done" aqui conclui pelo MESMO caminho do "Concluir" do NPC (`onDone`): a cena e as
 * recompensas saem na hora, uma vez só. Sem passeio escolhido, a linha só APONTA ao NPC. O Resgatar sobrevive só para o
 * passeio feito ANTES desta regra e ainda sem recibo (`ready`): é o recibo do dia (`claimStroll`), não paga nada.
 */
export interface StrollLineProps {
  language: Language;
  crossings: CrossingsState;
  /** Dia do JOGADOR (`AAAA-MM-DD`). */
  todayKey: string;
  onClaim: () => void;
  /** Concluir o passeio escolhido, direto da linha. */
  onDone?: () => void;
  /** Pedido do dono (11/10/2026): tocar na linha leva ao PRÉDIO do Passeio. */
  onGo?: () => void;
}

/** A entrada do Passeio para a lista unificada da aba Diárias (`DailyMissionBoard`). */
export function strollEntries({ language, crossings, todayKey, onClaim, onDone, onGo }: StrollLineProps): MissionEntry[] {
  const isPt = language === 'pt-BR';
  const st = strollLineState(crossings, todayKey);
  const state = st === 'claimed' ? 'claimed' : st === 'ready' ? 'ready' : 'open';
  const escolhido = crossings.active && (st !== 'point' || missionLive(crossings, todayKey, Date.now()))
    ? travessiaTitle(crossings.active.challenge, isPt)
    : null;
  // Sem passeio escolhido a linha só aponta, como sempre; escolhido, vira "Stroll" em turquesa + qual é o passeio.
  const title = escolhido
    ? (
      <>
        <span data-stroll-word style={{ color: 'var(--sm2-primary-ink)' }}>{isPt ? 'Passeio' : 'Stroll'}</span>
        {` · ${escolhido}`}
      </>
    )
    : (isPt ? 'Faça um passeio' : 'Take a stroll');
  return [{
    key: 'stroll',
    state,
    node: (
      <MissionCard
        key="stroll"
        language={language}
        attrs={{ 'data-stroll-line': '', 'data-status': st }}
        status={state}
        title={title}
        desc={escolhido ? undefined : (isPt ? 'A aventura acontece no lote do Passeio.' : 'The adventure happens at the Stroll lot.')}
        onGo={onGo}
        goAttr="data-stroll-go"
        action={<ClaimButton language={language} attrs={{ 'data-claim': 'stroll' }} onClick={onClaim} />}
        openAction={escolhido && onDone
          ? <button type="button" data-stroll-done style={sm2Button('primary', false, 'sm')} onClick={onDone}>{isPt ? 'Feito' : 'Done'}</button>
          : undefined}
      />
    ),
  }];
}
