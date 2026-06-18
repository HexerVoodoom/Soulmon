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

export function detectMessageCategory(message: string): MessageCategory {
  const m = message.toLowerCase();

  if (m.match(/\b(hi|hey|hello|hola|sup|yo|greetings)\b/)) return 'greeting';
  if (m.match(/\b(bye|goodbye|see you|later|cya)\b/)) return 'farewell';
  if (m.match(/\b(how|are|you|doing|feeling|feel)\b/)) return 'feeling';
  if (m.match(/\b(let's|go|come on|strength|can|will)\b/)) return 'encouragement';
  if (m.match(/\b(cool|nice|awesome|great|amazing|wonderful|beautiful|cute)\b/)) return 'compliment';
  if (m.match(/\b(love|adore|like|dear|friend)\b/)) return 'affection';
  if (m.match(/\b(eat|food|hungry|energy|tired|weak)\b/)) return 'food';
  if (m.match(/\b(evolve|digivolve|transform|next|level|up)\b/)) return 'evolution';
  if (m.match(/\b(name|called|who|are you)\b/)) return 'name';
  if (m.match(/\b(task|activity|do|work|mission|goal)\b/)) return 'task';
  if (m.match(/\b(day|night|morning|afternoon|time|today|tomorrow)\b/)) return 'time';
  if (m.match(/\b(help|support|need|hard|difficult|problem)\b/)) return 'help';
  if (m.match(/\b(sad|upset|bad|down|depressed)\b/)) return 'sad';
  if (m.match(/\b(happy|cheerful|glad|excited|pumped)\b/)) return 'happy';
  if (m.match(/^(yes|yeah|yep|sure|okay|ok)$/)) return 'yes';
  if (m.match(/^(no|nope|nah)$/)) return 'no';
  if (m.endsWith('?')) return 'question';

  return null;
}
