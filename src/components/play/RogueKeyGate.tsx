import { NpcSequence } from '../NpcSequence';
import { NPC_GUARDA_CHAVE_ART } from '../../assets/soulmon/npcs';
import type { Language } from '../../utils/i18n';

/** O portão do Calabouço sem a chave do dia: Bastião (NPC 412, §239), no modal padrão de NPC, manda à Oficina. Tocar ou pular só fecha. */
export function RogueKeyGate({ language, onClose }: { language: Language; onClose: () => void }) {
  const isPt = language === 'pt-BR';
  const speaker = isPt ? 'Bastião, o guarda-chave' : 'Bastion, the keykeeper';
  const text = isPt
    ? 'O portão só abre para quem traz a chave. Vá à Oficina do Foco, na Forja, e conclua uma sessão. A chave vale o dia inteiro, e sair daqui não custa nada.'
    : 'The gate only opens for those who bring the key. Go to the Focus Workshop, in the Forge, and complete a session. The key lasts all day, and leaving costs nothing.';
  return <NpcSequence lines={[{ speaker, art: NPC_GUARDA_CHAVE_ART, text }]} language={language} label={speaker} onFinish={onClose} />;
}
