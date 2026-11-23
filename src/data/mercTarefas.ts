/**
 * TAREFAS DA GUILDA DOS MERCENÁRIOS (dono, 06/11/2026)
 * ====================================================
 *
 * A proposta da Guilda é UMA tarefa pontual: o jogador faz naquele dia, uma vez, e acabou. Sem
 * frequência ("3x por semana"), sem hábito, sem sequência. Por isso a Guilda NÃO sorteia mais do
 * catálogo de hábitos (`activityCatalog.ts`, cujos `target` falam em vezes por semana): tem o
 * catálogo próprio daqui, escrito já como tarefa de um dia.
 *
 * Cada tarefa traz: o que fazer hoje (`target`), e `benefit`, uma frase discreta sobre o que a
 * pessoa ganha ao fazê-la. O benefício descreve a atividade (o que ela é, o que deixa feito), nunca
 * promete saúde nem efeito clínico (L8 do catálogo de atividades; vetos de psicologia).
 *
 * Os dois filtros abaixo (`mercTextoForaDaRegra`) valem para o catálogo inteiro em teste e para
 * qualquer tarefa que o gerador devolva: se um dia alguém reintroduzir "2x por semana" ou "ajuda
 * contra a ansiedade", o contrato fica vermelho. As ids são espelhadas em `functions/api/_mercMission.js`
 * (paridade em `mercMission.parity.test.js`) para o servidor descartar a proposta pendente que não existe mais.
 */
import type { MercOrdem } from '../utils/mercMissionSave';

type Bi = { pt: string; en: string };

export interface MercTarefa {
  id: string;
  ordem: MercOrdem;
  emoji: string;
  name: Bi;
  /** O que fazer HOJE, uma vez. */
  target: Bi;
  /** Para a pessoa, em tipografia discreta: o que a tarefa deixa feito. Sem promessa clínica ou de saúde. */
  benefit: Bi;
  /** 1 = rápida (3 pontos); 2 = pede um pouco mais (5 pontos). */
  effort: 1 | 2;
}

const T = (id: string, ordem: MercOrdem, emoji: string, name: Bi, target: Bi, benefit: Bi, effort: 1 | 2): MercTarefa =>
  ({ id, ordem, emoji, name, target, benefit, effort });

export const MERC_TAREFAS: readonly MercTarefa[] = [
  /* Rompentes (Poder): esforço, foco, desafio. */
  T('r-foco', 'rompente', '⏱️', { pt: 'Foco de 25 minutos', en: '25-minute focus' },
    { pt: 'Escolha uma tarefa e trabalhe só nela por 25 minutos, com o celular fora da mão.', en: 'Pick one task and work only on it for 25 minutes, phone out of reach.' },
    { pt: 'Um bloco curto e fechado faz a tarefa parecer menor do que era.', en: 'A short, closed block makes the task look smaller than it was.' }, 2),
  T('r-adiado', 'rompente', '🪨', { pt: 'O item adiado', en: 'The postponed item' },
    { pt: 'Pegue o que você vem adiando e faça só o primeiro passo hoje.', en: 'Take the thing you keep putting off and do just its first step today.' },
    { pt: 'Depois do primeiro passo, o resto deixa de ser um bloco só.', en: 'After the first step, the rest stops being one big block.' }, 2),
  T('r-novo', 'rompente', '🔭', { pt: 'Uma coisa nova', en: 'Something new' },
    { pt: 'Aprenda um fato novo sobre um assunto que te interessa e escreva numa frase.', en: 'Learn one new fact about a topic you like and write it in one sentence.' },
    { pt: 'Você termina o dia sabendo algo que não sabia de manhã.', en: 'You end the day knowing something you did not know this morning.' }, 1),
  T('r-volta', 'rompente', '🥾', { pt: 'Volta de 15 minutos', en: '15-minute walk' },
    { pt: 'Dê uma volta a pé de 15 minutos, por um caminho que você quiser.', en: 'Take a 15-minute walk along any route you like.' },
    { pt: 'Mudar de paisagem por um momento costuma render ideias.', en: 'A change of scenery for a moment often brings ideas.' }, 1),
  T('r-meta', 'rompente', '🎯', { pt: 'A coisa do dia', en: 'The one thing' },
    { pt: 'Escolha a única coisa que faria o dia valer e termine ela antes do fim da tarde.', en: 'Pick the one thing that would make today count and finish it before the evening.' },
    { pt: 'Uma coisa concluída conta mais do que dez começadas.', en: 'One finished thing counts for more than ten started ones.' }, 2),
  T('r-serie', 'rompente', '💪', { pt: 'Série curta', en: 'Short set' },
    { pt: 'Faça uma série curta de um exercício de que você gosta, como 10 agachamentos e 10 flexões.', en: 'Do a short set of an exercise you like, such as 10 squats and 10 push-ups.' },
    { pt: 'É uma tarefa pequena de corpo que dá para riscar da lista em poucos minutos.', en: 'A small bodily task you can cross off the list in a few minutes.' }, 2),
  T('r-tres', 'rompente', '✅', { pt: 'Três pendências', en: 'Three small chores' },
    { pt: 'Resolva três pendências pequenas, de menos de 5 minutos cada.', en: 'Clear three small chores of under 5 minutes each.' },
    { pt: 'Três itens a menos na cabeça, de uma vez.', en: 'Three fewer items on your mind, in one go.' }, 2),
  T('r-paginas', 'rompente', '📖', { pt: 'Dez páginas', en: 'Ten pages' },
    { pt: 'Leia dez páginas de um livro ou de um texto longo.', en: 'Read ten pages of a book or a long article.' },
    { pt: 'Dez páginas são pouco, e mesmo assim são dez páginas a mais.', en: 'Ten pages are few, and still ten pages further.' }, 1),
  T('r-mensagem-pesada', 'rompente', '✉️', { pt: 'A mensagem que pesa', en: 'The message you owe' },
    { pt: 'Responda a mensagem ou o e-mail que você está evitando.', en: 'Answer the message or email you have been avoiding.' },
    { pt: 'Responder tira o assunto da fila de coisas que ficam pesando.', en: 'Replying takes it off the list of things that keep nagging.' }, 1),
  T('r-fora', 'rompente', '🧗', { pt: 'Um passo fora do costume', en: 'One step outside the usual' },
    { pt: 'Faça hoje uma coisa pequena que você costuma evitar, como pedir uma informação a um desconhecido.', en: 'Do one small thing you usually avoid today, like asking a stranger for directions.' },
    { pt: 'Fica a história de uma coisa que você fez e antes não fazia.', en: 'You come away with the story of something you did that you had not before.' }, 2),
  T('r-sem-tela', 'rompente', '📵', { pt: 'Meia hora sem tela', en: 'Half an hour off-screen' },
    { pt: 'Fique 30 minutos longe de telas, fazendo uma coisa só.', en: 'Stay away from screens for 30 minutes, doing one thing only.' },
    { pt: 'Meia hora inteira dedicada a uma coisa só rende mais do que parece.', en: 'A whole half hour on a single thing gets more done than it seems.' }, 2),
  T('r-plano', 'rompente', '🗒️', { pt: 'O plano de amanhã', en: "Tomorrow's plan" },
    { pt: 'Antes de dormir, escreva os três primeiros passos de amanhã.', en: 'Before bed, write down the first three steps for tomorrow.' },
    { pt: 'Amanhã você começa sabendo por onde começar.', en: 'Tomorrow you start already knowing where to start.' }, 1),

  /* Tecelões (Harmonia): ordem, calma, criação, casa. */
  T('t-gaveta', 'tecelao', '🗄️', { pt: 'Uma gaveta em ordem', en: 'One tidy drawer' },
    { pt: 'Arrume uma gaveta, uma prateleira ou a sua bolsa.', en: 'Tidy one drawer, one shelf or your bag.' },
    { pt: 'Um canto em ordem é uma vitória que dá para ver.', en: 'A tidy corner is a win you can actually see.' }, 1),
  T('t-pausa', 'tecelao', '🌿', { pt: 'Cinco minutos de pausa', en: 'Five-minute pause' },
    { pt: 'Sente-se por 5 minutos, sem tela, só ouvindo o que há ao redor.', en: 'Sit for 5 minutes, no screen, just listening to what is around you.' },
    { pt: 'Uma pausa curta deixa mais espaço para o resto do dia.', en: 'A short pause leaves more room for the rest of the day.' }, 1),
  T('t-planta', 'tecelao', '🪴', { pt: 'Olhar uma planta', en: 'Look at a plant' },
    { pt: 'Regue uma planta ou, se não tiver, observe uma árvore por 5 minutos.', en: 'Water a plant or, if you have none, watch a tree for 5 minutes.' },
    { pt: 'Reparar numa coisa viva é um jeito simples de prestar atenção.', en: 'Noticing something alive is a simple way to pay attention.' }, 1),
  T('t-musica', 'tecelao', '🎧', { pt: 'Uma música inteira', en: 'One whole song' },
    { pt: 'Ouça uma música ou um álbum inteiro sem fazer outra coisa junto.', en: 'Listen to a whole song or album without doing anything else.' },
    { pt: 'Ouvir de ponta a ponta é um prazer que quase nunca sobra tempo para ter.', en: 'Listening start to finish is a pleasure we rarely make time for.' }, 1),
  T('t-refeicao', 'tecelao', '🍲', { pt: 'Uma refeição feita por você', en: 'A meal you made' },
    { pt: 'Prepare uma refeição simples com as próprias mãos.', en: 'Prepare one simple meal with your own hands.' },
    { pt: 'No fim sobra um prato de algo que você mesmo fez.', en: 'You end up with a plate of something you made yourself.' }, 2),
  T('t-rabisco', 'tecelao', '🖍️', { pt: 'Rabisco livre', en: 'Free doodle' },
    { pt: 'Desenhe, escreva ou componha algo por 10 minutos, sem se importar com o resultado.', en: 'Draw, write or compose something for 10 minutes, without caring how it turns out.' },
    { pt: 'Criar sem nota nem plateia é um espaço seu.', en: 'Making something with no grade and no audience is a space of your own.' }, 1),
  T('t-janela', 'tecelao', '🪟', { pt: 'Céu na janela', en: 'Sky from the window' },
    { pt: 'Abra a janela ou vá até a porta e olhe o céu por 5 minutos.', en: 'Open the window or step to the door and look at the sky for 5 minutes.' },
    { pt: 'Cinco minutos olhando para longe dão uma folga aos olhos e à cabeça.', en: 'Five minutes looking into the distance give your eyes and mind a break.' }, 1),
  T('t-mesa', 'tecelao', '🧹', { pt: 'Mesa limpa', en: 'Clear desk' },
    { pt: 'Deixe a sua mesa de trabalho limpa, sem copos nem papéis soltos.', en: 'Leave your work desk clear, with no cups or loose papers.' },
    { pt: 'Sentar numa mesa limpa é um bom jeito de começar a próxima tarefa.', en: 'Sitting at a clear desk is a good way to start the next task.' }, 1),
  T('t-linhas', 'tecelao', '📓', { pt: 'Três linhas', en: 'Three lines' },
    { pt: 'Escreva três linhas sobre o que aconteceu hoje.', en: 'Write three lines about what happened today.' },
    { pt: 'Fica registrado um pedaço de hoje que depois seria esquecido.', en: 'A piece of today stays on record that would otherwise be forgotten.' }, 1),
  T('t-caixa', 'tecelao', '📦', { pt: 'Uma caixa para doar', en: 'A box to give away' },
    { pt: 'Separe uma caixa de coisas para doar ou jogar fora.', en: 'Set aside one box of things to give away or throw out.' },
    { pt: 'Menos coisa parada em casa e uma caixa pronta para sair.', en: 'Less stuff sitting around and a box ready to go.' }, 2),
  T('t-foto', 'tecelao', '📷', { pt: 'Uma foto bonita', en: 'One nice photo' },
    { pt: 'Tire uma foto de algo bonito que você viu hoje.', en: 'Take a photo of something beautiful you saw today.' },
    { pt: 'Procurar algo bonito faz você olhar o caminho com outros olhos.', en: 'Looking for something beautiful makes you see the same way with new eyes.' }, 1),
  T('t-bebida', 'tecelao', '☕', { pt: 'Bebida quente sem pressa', en: 'A hot drink, unhurried' },
    { pt: 'Prepare uma bebida quente e tome sentado, sem celular.', en: 'Make a hot drink and have it sitting down, without your phone.' },
    { pt: 'Um intervalo pequeno, só seu, no meio do dia.', en: 'A small break of your own in the middle of the day.' }, 1),

  /* Filtradores (Benevolência): outras pessoas. */
  T('f-mensagem', 'filtrador', '💬', { pt: 'Mensagem sem pedir nada', en: 'A message, no strings' },
    { pt: 'Mande uma mensagem a alguém de quem você gosta, sem pedir nada.', en: 'Send a message to someone you like, asking for nothing.' },
    { pt: 'Quem recebe costuma gostar de ser lembrado, e a conversa fica aberta.', en: 'People usually like being remembered, and the conversation stays open.' }, 1),
  T('f-elogio', 'filtrador', '🌟', { pt: 'Um elogio sincero', en: 'A sincere compliment' },
    { pt: 'Faça hoje um elogio sincero a alguém, dizendo o que exatamente você achou bom.', en: 'Give someone a sincere compliment today, saying exactly what you liked.' },
    { pt: 'Um elogio específico dura na memória de quem o recebe.', en: 'A specific compliment stays in the memory of whoever gets it.' }, 1),
  T('f-favor', 'filtrador', '🤝', { pt: 'Um favor pequeno', en: 'A small favor' },
    { pt: 'Ofereça ajuda a alguém com uma coisa pequena.', en: 'Offer someone help with one small thing.' },
    { pt: 'Um favor pequeno resolve de verdade a vida de alguém naquele momento.', en: 'A small favor really does solve something for someone right then.' }, 2),
  T('f-ligacao', 'filtrador', '📞', { pt: 'Uma ligação', en: 'A phone call' },
    { pt: 'Ligue para alguém da família ou para um amigo, só para conversar.', en: 'Call a family member or a friend, just to talk.' },
    { pt: 'A voz de quem se importa diz mais do que muitas mensagens.', en: 'The voice of someone who cares says more than many messages.' }, 2),
  T('f-obrigado', 'filtrador', '🙏', { pt: 'Um agradecimento', en: 'A thank-you' },
    { pt: 'Agradeça a alguém por uma coisa específica que fez por você.', en: 'Thank someone for one specific thing they did for you.' },
    { pt: 'Dizer obrigado com o motivo mostra que você reparou.', en: 'Saying thanks with the reason shows you noticed.' }, 1),
  T('f-escuta', 'filtrador', '👂', { pt: 'Escuta inteira', en: 'Full attention' },
    { pt: 'Converse com alguém por 10 minutos sem olhar o celular.', en: 'Talk with someone for 10 minutes without looking at your phone.' },
    { pt: 'Atenção inteira é um presente que custa só o seu tempo.', en: 'Full attention is a gift that costs only your time.' }, 2),
  T('f-agrado', 'filtrador', '🎁', { pt: 'Um agrado', en: 'A small gift' },
    { pt: 'Leve ou envie um pequeno agrado a alguém, como um café ou um bilhete.', en: 'Bring or send someone a small gift, like a coffee or a note.' },
    { pt: 'Um gesto pequeno e inesperado muda o dia de quem recebe.', en: 'A small, unexpected gesture changes the day for whoever gets it.' }, 2),
  T('f-doar', 'filtrador', '👕', { pt: 'Doar uma peça', en: 'Give one thing away' },
    { pt: 'Doe uma roupa ou um objeto que você não usa mais.', en: 'Donate a piece of clothing or an object you no longer use.' },
    { pt: 'O que está parado na gaveta passa a servir a alguém.', en: 'What sat in a drawer now serves someone.' }, 2),
  T('f-convite', 'filtrador', '☕', { pt: 'Um convite', en: 'An invitation' },
    { pt: 'Convide alguém para um café ou para uma caminhada.', en: 'Invite someone for a coffee or a walk.' },
    { pt: 'Convidar primeiro costuma ser tudo o que falta para o encontro acontecer.', en: 'Inviting first is often all it takes for the meeting to happen.' }, 1),
  T('f-cumprimento', 'filtrador', '👋', { pt: 'Chamar pelo nome', en: 'Call them by name' },
    { pt: 'Cumprimente pelo nome alguém que você encontra por perto, como vizinho, porteiro ou colega.', en: 'Greet by name someone you run into nearby, like a neighbor, doorman or coworker.' },
    { pt: 'Ser chamado pelo nome faz a pessoa se sentir vista.', en: 'Being called by name makes a person feel seen.' }, 1),
  T('f-bilhete', 'filtrador', '📝', { pt: 'Um bilhete', en: 'A note' },
    { pt: 'Escreva um bilhete curto para alguém e deixe onde a pessoa vá achar.', en: 'Write a short note for someone and leave it where they will find it.' },
    { pt: 'Um bilhete à mão é encontrado e guardado.', en: 'A handwritten note gets found and kept.' }, 1),
  T('f-indicacao', 'filtrador', '🎬', { pt: 'Uma indicação', en: 'A recommendation' },
    { pt: 'Indique a alguém um livro, um filme ou uma música de que você gostou, com uma frase do porquê.', en: 'Recommend a book, film or song you liked to someone, with one sentence on why.' },
    { pt: 'Quem indica compartilha um pedaço do que gosta.', en: 'Recommending shares a piece of what you like.' }, 1),
];

export const MERC_TAREFAS_BY_ID: Readonly<Record<string, MercTarefa>> =
  Object.fromEntries(MERC_TAREFAS.map(t => [t.id, t]));

/** Frequência, hábito, sequência: nada disso cabe numa tarefa de UM dia. */
const FREQUENCIA = /semana|\bm[eê]s\b|mensal|di[aá]ri[ao]|\bpor dia\b|todo[s]? (o[s]? )?dias?|todas? (as )?(manh|noite|tarde|semana)|toda\b|cada dia|sempre|vezes|\b\d+\s*x\b|h[aá]bito|rotina|sequ[eê]ncia|dias seguidos|week|month|daily|every|each day|per day|times|habit|routine|streak|always/i;

/** Saúde, tratamento, conduta terapêutica: o benefício descreve a atividade, não promete efeito. */
const SAUDE = /sa[uú]de|saud[aá]vel|ansied|depress|estress|stress|trat[ae]|tratament|\bcur[ae]\b|\bcura\b|terap|doen[çc]|sintom|cl[ií]nic|diagn|m[eé]dic|rem[eé]dio|imunid|cora[çc][aã]o|press[aã]o|emagre|\bpeso\b|\bsono\b|insôni|insoni|mental|health|anxi|treat|cure|therap|disease|symptom|clinic|diagnos|medic|heart|blood|weight|immun|sleep|insomn/i;

/** `true` se o texto foge da regra "tarefa pontual, de um dia, sem promessa de saúde". */
export function mercTextoForaDaRegra(texto: string): boolean {
  return FREQUENCIA.test(texto) || SAUDE.test(texto);
}

/** Todos os textos que o jogador lê numa tarefa (PT e EN). */
function textosDe(t: Pick<MercTarefa, 'name' | 'target' | 'benefit'>): string[] {
  return [t.name.pt, t.name.en, t.target.pt, t.target.en, t.benefit.pt, t.benefit.en];
}

/**
 * Porteiro do gerador: uma tarefa só é oferecida se tem benefício PT/EN, só texto sem frequência
 * e sem promessa de saúde. Devolve os motivos da recusa (vazio = válida).
 */
export function mercTarefaProblemas(t: Partial<MercTarefa> | null | undefined): string[] {
  if (!t || typeof t !== 'object') return ['ausente'];
  const out: string[] = [];
  for (const campo of ['name', 'target', 'benefit'] as const) {
    const v = t[campo];
    if (!v || typeof v.pt !== 'string' || typeof v.en !== 'string' || !v.pt.trim() || !v.en.trim()) out.push(`${campo} PT/EN`);
  }
  if (out.length) return out;
  const completa = t as MercTarefa;
  if (textosDe(completa).some(mercTextoForaDaRegra)) out.push('texto fora da regra (frequência ou saúde)');
  return out;
}

export const mercTarefaValida = (t: Partial<MercTarefa> | null | undefined): boolean => mercTarefaProblemas(t).length === 0;
