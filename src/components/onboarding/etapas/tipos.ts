import type { Language } from '../../../utils/i18n';
import type { ActivityCategory } from '../../../types/attributes';

/** Contrato dos slots do player de sequência: toda etapa recebe `onDone`. O resto é opcional (quem encaixa liga ao App). */
export interface EtapaProps {
  onDone: () => void;
  language?: Language;
}

/** O que o `GameTutorialFlow` entrega ao criar uma tarefa. */
export interface NovaTarefa { name: string; category: ActivityCategory; emoji: string; kind: 'task' | 'habit' }
