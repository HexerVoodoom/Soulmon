// Falas do pet no overlay. Curtas, fofas e sem emoji (mesma convenção do
// speak() do app). Sempre PT-BR + EN.
type Lang = 'pt-BR' | 'en';

const IDLE: Record<Lang, string[]> = {
  'pt-BR': [
    'Oi! Eu tô aqui trabalhando com você.',
    'Não esquece de beber água, tá?',
    'Que tal marcar uma tarefa como feita?',
    'Eu vi você digitando bem rápido!',
    'Tô de olho na sua produtividade.',
    'Um passinho de cada vez, a gente chega lá.',
    'Se cansar, faz uma pausinha comigo.',
    'Hoje é um bom dia pra um dia perfeito.',
    'Clica em mim se precisar de alguma coisa.',
    'Andar por aqui é meu exercício do dia.',
  ],
  en: [
    'Hi! I am right here working with you.',
    'Remember to drink some water, ok?',
    'How about checking off a task?',
    'I saw you typing really fast!',
    'I am keeping an eye on your productivity.',
    'One small step at a time, we will get there.',
    'If you get tired, take a tiny break with me.',
    'Today is a good day for a perfect day.',
    'Click me if you need anything.',
    'Walking around here is my daily exercise.',
  ],
};

const BY_EVENT: Record<string, Record<Lang, string[]>> = {
  pet: {
    'pt-BR': ['Aaah, que carinho gostoso!', 'Hehe, isso faz cócegas!', 'Eu mereço mesmo, né?'],
    en: ['Aaah, that feels so nice!', 'Hehe, that tickles!', 'I do deserve it, right?'],
  },
  petHealed: {
    'pt-BR': ['Me sinto mais forte agora!'],
    en: ['I feel stronger now!'],
  },
  feed: {
    'pt-BR': ['Nham nham, delícia!', 'Comidinha! Obrigado!', 'Isso me dá energia!'],
    en: ['Yum yum, delicious!', 'Food! Thank you!', 'This gives me energy!'],
  },
  full: {
    'pt-BR': ['Ufa, tô cheinho... daqui a pouco eu como mais.'],
    en: ['Phew, I am full... I will eat more in a bit.'],
  },
  noFood: {
    'pt-BR': ['Sem comida no bolso... completa uma tarefa que a gente ganha!'],
    en: ['No food in the pocket... complete a task and we earn some!'],
  },
  shower: {
    'pt-BR': ['Que banho gostoso!', 'Limpinho e cheiroso!'],
    en: ['What a nice bath!', 'All clean and fresh!'],
  },
  sleep: {
    'pt-BR': ['Boa noite... zzz'],
    en: ['Good night... zzz'],
  },
  wake: {
    'pt-BR': ['Bom dia! Dormi super bem.'],
    en: ['Good morning! I slept great.'],
  },
  taskDone: {
    'pt-BR': ['Mandou bem na tarefa! Ganhamos comida!', 'Aê! Mais uma feita!'],
    en: ['Great job on that task! We earned food!', 'Yay! One more done!'],
  },
  taskNew: {
    'pt-BR': ['Anotado! Vamos nessa.'],
    en: ['Noted! Let us do this.'],
  },
};

function pick(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

export function idlePhrase(lang: Lang): string {
  return pick(IDLE[lang]);
}

export function eventPhrase(event: keyof typeof BY_EVENT, lang: Lang): string {
  return pick(BY_EVENT[event][lang]);
}
