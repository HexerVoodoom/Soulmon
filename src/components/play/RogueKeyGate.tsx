import { NpcSequence } from '../NpcSequence';
import { CtaButton } from '../ui/CtaButton';
import { NPC_GUARDA_CHAVE_ART } from '../../assets/soulmon/npcs';
import type { Language } from '../../utils/i18n';

/**
 * O portão do Calabouço sem a chave do dia: Bastion (NPC 412, §239), no modal padrão de NPC, manda à Oficina. Só fecha pelo X, pelo CTA, Esc ou voltar: tocar no fundo NÃO fecha (dono, 16/11/2026).
 * 13/11/2026 (dono): com `onGoToWorkshop`, a fala ganha o CTA "Ir para a Oficina do Foco" (fecha o portão e leva à Forja › Oficina).
 */
export function RogueKeyGate({ language, onClose, expired, onGoToWorkshop }: { language: Language; onClose: () => void; expired?: boolean; onGoToWorkshop?: () => void }) {
  const isPt = language === 'pt-BR';
  const speaker = isPt ? 'Bastion, o guarda-chave' : 'Bastion, the keykeeper'; // o nome é sempre em inglês (dono, 06/11/2026)
  const text = expired
    ? (isPt ? 'Sua chave expirou: ela vale 48 h. Conclua outra sessão na Oficina do Foco para ganhar uma nova. Cada chave dá 1 uso por dia.' : 'Your key expired: it lasts 48 h. Complete another session in the Focus Workshop for a new one. Each key gives 1 use per day.')
    : isPt
    ? 'Você precisa de uma chave. Ganhe uma na Oficina do Foco, na Forja, concluindo uma sessão. A chave vale por 48 h, com 1 uso por dia, e sair daqui não custa nada.'
    : 'You need a key. Earn one in the Focus Workshop, in the Forge, by completing a session. The key lasts 48 h, 1 use per day, and leaving costs nothing.';
  const action = onGoToWorkshop
    ? <CtaButton data-rogue-gate-workshop onClick={onGoToWorkshop}>{isPt ? 'Ir para a Oficina do Foco' : 'Go to the Focus Workshop'}</CtaButton>
    : undefined;
  return <NpcSequence lines={[{ speaker, art: NPC_GUARDA_CHAVE_ART, text }]} language={language} label={speaker} onFinish={onClose} action={action} closeOnTap={false} />;
}
