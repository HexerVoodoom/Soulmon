import { Icon } from '../ui/Icon';
import { RitualDialog, ritualTitle } from '../ritual/RitualKit';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { catalogLevelDownCopy } from '../../utils/catalogLevel';

/**
 * F4 do catálogo — o convite de subir/descer nível de um item do catálogo.
 * `EvolveTaskModal.tsx` continua sendo o aviso de requisito de tarefas após
 * evoluir (fluxo diferente, já testado em produção); este é um modal NOVO e
 * dedicado, para não arriscar a máquina de estados daquele.
 *
 * A6 da revisão de psicologia: o convite de DESCER nunca mostra "descer" nem
 * "Nível 1" (`catalogLevelDownCopy`), e os dois botões têm o MESMO peso
 * visual — nenhum é a ação "certa". Recusar não gera nada.
 */
interface CatalogLevelInviteModalProps {
  isOpen: boolean;
  direction: 'up' | 'down';
  itemName: string;
  language?: 'pt-BR' | 'en-US';
  onAccept: () => void;
  onDecline: () => void;
}

export function CatalogLevelInviteModal({
  isOpen, direction, itemName, language = 'en-US', onAccept, onDecline,
}: CatalogLevelInviteModalProps) {
  if (!isOpen) return null;
  const isPt = language === 'pt-BR';

  if (direction === 'down') {
    const copy = catalogLevelDownCopy(language);
    return (
      <RitualDialog label={copy.title} onClose={onDecline} zIndex={200} maxWidth={340} style={{ textAlign: 'center' }}>
        <Icon name="spa" size={32} fill={1} tone="primary" />
        <h2 style={ritualTitle}>{copy.title}</h2>
        <p style={{ ...sm2Text, margin: 0 }}>{itemName}</p>
        <p style={sm2Hint}>{copy.body}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          <button type="button" onClick={onAccept} style={{ ...sm2Button('outline'), width: '100%' }}>
            {copy.confirmLabel}
          </button>
          <button type="button" onClick={onDecline} style={{ ...sm2Button('outline'), width: '100%' }}>
            {copy.declineLabel}
          </button>
        </div>
      </RitualDialog>
    );
  }

  // 'up' — subir de nível é sempre boa notícia, então pode nomear o nível.
  const title = isPt ? 'Pronto para o próximo passo?' : 'Ready for the next step?';
  const body = isPt
    ? 'Sua constância está ótima. Quer um desafio um pouco maior?'
    : 'Your consistency has been great. Want a slightly bigger challenge?';
  return (
    <RitualDialog label={title} onClose={onDecline} zIndex={200} maxWidth={340} style={{ textAlign: 'center' }}>
      <Icon name="trending_up" size={32} fill={1} tone="primary" />
      <h2 style={ritualTitle}>{title}</h2>
      <p style={{ ...sm2Text, margin: 0 }}>{itemName}</p>
      <p style={sm2Hint}>{body}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        <button type="button" onClick={onAccept} style={{ ...sm2Button('primary'), width: '100%' }}>
          {isPt ? 'Vamos!' : "Let's go!"}
        </button>
        <button type="button" onClick={onDecline} style={{ ...sm2Button('outline'), width: '100%' }}>
          {isPt ? 'Continuar assim' : 'Keep it as is'}
        </button>
      </div>
    </RitualDialog>
  );
}
