export type MessageCategory =
  | 'greeting'
  | 'farewell'
  | 'feeling'
  | 'encouragement'
  | 'compliment'
  | 'affection'
  | 'food'
  | 'evolution'
  | 'name'
  | 'task'
  | 'time'
  | 'help'
  | 'sad'
  | 'happy'
  | 'yes'
  | 'no'
  | 'question'
  | null;

/**
 * Detecta a intenção da mensagem. Reconhece PT e EN no mesmo passo.
 *
 * Antes só havia padrões em inglês: um usuário brasileiro escrevendo "oi",
 * "tô triste" ou "me ajuda" caía sempre no default e recebia resposta genérica
 * em inglês. Como o app é PT-BR primeiro, isso significava que o chat de
 * fallback — usado sempre que a IA está desligada OU falha — praticamente não
 * funcionava para o público principal.
 *
 * Acentos são normalizados, porque ninguém digita "está" no celular com pressa.
 */
export function detectMessageCategory(message: string): MessageCategory {
  const m = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (m.match(/\b(hi|hey|hello|hola|sup|yo|greetings|oi|ola|opa|eai|e ai|bom dia|boa tarde|boa noite)\b/)) return 'greeting';
  if (m.match(/\b(bye|goodbye|see you|later|cya|tchau|ate mais|ate logo|falou|xau)\b/)) return 'farewell';
  // Tristeza vem ANTES de "feeling"/"help": quem diz "tô mal" precisa da
  // resposta de acolhimento, não do papo de status.
  if (m.match(/\b(sad|upset|down|depressed|triste|mal|pra baixo|deprimid|desanimad|cansad de tudo|sozinh|ansios)\b/)) return 'sad';
  if (m.match(/\b(how are|doing|feeling|feel|como voce esta|como vc ta|como ta|tudo bem|como voce ta)\b/)) return 'feeling';
  if (m.match(/\b(let's|come on|strength|vamos|bora|forca|consigo|vou conseguir)\b/)) return 'encouragement';
  if (m.match(/\b(cool|nice|awesome|great|amazing|wonderful|beautiful|cute|legal|lindo|linda|fofo|fofa|massa|maneiro|incrivel)\b/)) return 'compliment';
  if (m.match(/\b(love|adore|dear|friend|amo|adoro|te amo|amigo|amiga|querid)\b/)) return 'affection';
  if (m.match(/\b(eat|food|hungry|weak|no energy|comer|comida|fome|faminto|lanche|fraco|sem energia)\b/)) return 'food';
  if (m.match(/\b(evolve|evolution|transform|grow up|level up|next level|evolui|evoluir|evolucao|proxima forma|subir de nivel)\b/)) return 'evolution';
  if (m.match(/\b(name|called|who are you|nome|quem e voce|quem eh voce)\b/)) return 'name';
  if (m.match(/\b(task|activity|mission|goal|work|tarefa|atividade|missao|meta|afazer|trabalho|trabalhar)\b/)) return 'task';
  if (m.match(/\b(day|night|morning|afternoon|today|tomorrow|dia|noite|manha|tarde|hoje|amanha)\b/)) return 'time';
  if (m.match(/\b(help|support|need|hard|difficult|problem|ajuda|ajudar|socorro|dificil|problema|nao consigo)\b/)) return 'help';
  if (m.match(/\b(happy|cheerful|glad|excited|pumped|feliz|content|animad|alegre)\b/)) return 'happy';
  if (m.match(/^(yes|yeah|yep|sure|okay|ok|sim|claro|isso|aham|beleza)$/)) return 'yes';
  if (m.match(/^(no|nope|nah|nao|nem|negativo)$/)) return 'no';
  if (m.endsWith('?')) return 'question';

  return null;
}
