import { NpcSequence } from './NpcSequence';
import { NPC_MENSAGEIRO_ART } from '../assets/soulmon/npcs';
import { announceLine } from '../utils/mensageiro';
import type { Language } from '../utils/i18n';

/**
 * O AVISO do Papus (NPC 440, §241/§245) no modal padrão de NPC: "chegou carta". Só avisa; o conteúdo e o resgate vivem na caixa de cartas
 * (`MailboxSheet`, ícone da Home), então fechar ou pular aqui não credita nada.
 */
export function MessengerSequence({ count, language, onDone }: { count: number; language: Language; onDone: () => void }) {
  const isPt = language === 'pt-BR';
  const speaker = isPt ? 'Papus, o mensageiro' : 'Papus, the messenger';
  return <NpcSequence lines={[{ speaker, art: NPC_MENSAGEIRO_ART, text: announceLine(count, isPt) }]} language={language} label={speaker} onFinish={onDone} />;
}
