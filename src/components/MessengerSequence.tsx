import { NpcSequence } from './NpcSequence';
import { NPC_MENSAGEIRO_ART } from '../assets/soulmon/npcs';
import { mailLine, type MailItem } from '../utils/mensageiro';
import type { Language } from '../utils/i18n';

/** O modal padrão de NPC com as cartas do Papus (NPC 440, §241). Tocar ou pular: o crédito é o mesmo, sai em `onDone`. */
export function MessengerSequence({ mail, language, onDone }: { mail: readonly MailItem[]; language: Language; onDone: () => void }) {
  const isPt = language === 'pt-BR';
  const speaker = isPt ? 'Papus, o mensageiro' : 'Papus, the messenger';
  const lines = mail.map(m => ({ speaker, art: NPC_MENSAGEIRO_ART, text: mailLine(m, isPt) }));
  return <NpcSequence lines={lines} language={language} label={speaker} onFinish={onDone} />;
}
