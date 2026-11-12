import { NpcSequence } from '../NpcSequence';
import { NPC_GUARDA_CHAVE_ART } from '../../assets/soulmon/npcs';
import type { Language } from '../../utils/i18n';

/** O portão do Calabouço sem a chave do dia: Bastion (NPC 412, §239), no modal padrão de NPC, manda à Oficina. Tocar ou pular só fecha. */
export function RogueKeyGate({ language, onClose, expired }: { language: Language; onClose: () => void; expired?: boolean }) {
  const isPt = language === 'pt-BR';
  const speaker = isPt ? 'Bastion, o guarda-chave' : 'Bastion, the keykeeper'; // o nome é sempre em inglês (dono, 06/11/2026)
  const text = expired
    ? (isPt ? 'Sua chave expirou: ela vale 48 h. Conclua outra sessão na Oficina do Foco para ganhar uma nova. Cada chave dá 1 uso por dia.' : 'Your key expired: it lasts 48 h. Complete another session in the Focus Workshop for a new one. Each key gives 1 use per day.')
    : isPt
    ? 'O portão só abre para quem traz a chave. Vá à Oficina do Foco, na Forja, e conclua uma sessão. A chave vale por 48 h, com 1 uso por dia, e sair daqui não custa nada.'
    : 'The gate only opens for those who bring the key. Go to the Focus Workshop, in the Forge, and complete a session. The key lasts 48 h, 1 use per day, and leaving costs nothing.';
  return <NpcSequence lines={[{ speaker, art: NPC_GUARDA_CHAVE_ART, text }]} language={language} label={speaker} onFinish={onClose} />;
}
