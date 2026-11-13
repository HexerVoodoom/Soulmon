import type { MotiveKey, ObstacleKey, Perceived, ReviewDecision } from './purpose';

/**
 * TEXTOS DO OBJETIVO ANUAL (PT/EN, E13)
 * =====================================
 *
 * Linguagem de `docs/design/OBJETIVO-ANUAL-CIENCIA.md`: DESCRITIVA, sem culpa e
 * sem promessa. Nunca "você falhou", "deveria", "tem que", "em X dias você
 * vai...". O número é dito como é ("18 de 22") e a pergunta que vem junto
 * é curiosa, não de cobrança. Há teste de palavras proibidas
 * (`purposeCopy.test.ts`) e de paridade PT/EN.
 */
export type Bi = { pt: string; en: string };

export const PC = {
  // ── onboarding: o destino ─────────────────────────────────────────────────
  yearTitle: { pt: 'Daqui a um ano, onde você quer estar?', en: 'A year from now, where do you want to be?' },
  yearHint: { pt: 'Uma frase sua. Só você vê, e dá para mudar depois.', en: 'One sentence of your own. You can change it later.' },
  yearPlaceholder: { pt: 'Escreva do seu jeito', en: 'Write it your way' },
  yearExamples: { pt: 'Ideias para começar (toque para usar)', en: 'Ideas to start from (tap to use)' },
  yearAreasLabel: { pt: 'Áreas que você escolheu', en: 'Areas you picked' },
  skip: { pt: 'Pular por agora', en: 'Skip for now' },
  counter: { pt: 'caracteres', en: 'characters' },
  // ── o porquê ──────────────────────────────────────────────────────────────
  motiveTitle: { pt: 'Por que isso importa pra você?', en: 'Why does this matter to you?' },
  motiveHint: { pt: 'Escolha o que mais pesa para você.', en: 'Pick what weighs most for you.' },
  motiveOtherPlaceholder: { pt: 'Outro motivo, nas suas palavras', en: 'Another reason, in your words' },
  phraseLabel: { pt: 'Uma frase para guardar para os dias difíceis (opcional)', en: 'A line to keep for harder days (optional)' },
  phrasePlaceholder: { pt: 'Escreva do seu jeito', en: 'Write it your way' },
  // ── o obstáculo ───────────────────────────────────────────────────────────
  planTitle: { pt: 'O que costuma atrapalhar?', en: 'What tends to get in the way?' },
  planHint: { pt: 'Se você já sabe o obstáculo, dá para combinar o que fazer quando ele aparecer.', en: 'If you already know the obstacle, you can decide what to do when it shows up.' },
  planWhen: { pt: 'Quando isso acontecer, eu…', en: 'When that happens, I…' },
  planOtherPlaceholder: { pt: 'Outro obstáculo', en: 'Another obstacle' },
  planResponsePlaceholder: { pt: 'Escreva do seu jeito', en: 'Write it your way' },
  continue: { pt: 'Continuar', en: 'Continue' },
  // ── prioridades ───────────────────────────────────────────────────────────
  starterTitle: { pt: 'Pra chegar lá, o que você vai fazer?', en: 'To get there, what will you do?' },
  starterGoalLead: { pt: 'Seu objetivo', en: 'Your goal' },
  priorityHint: { pt: 'Marque até 3 com a estrela: são os que o Soulmon acompanha por perto.', en: 'Star up to 3: these are the ones Soulmon keeps closer track of.' },
  priorityMax: { pt: 'São 3 prioridades. Desmarque uma para escolher outra.', en: 'That is 3 priorities. Unstar one to pick another.' },
  priorityStar: { pt: 'Marcar como prioridade', en: 'Mark as priority' },
  priorityUnstar: { pt: 'Tirar das prioridades', en: 'Remove from priorities' },
  // ── modal do jogador existente ────────────────────────────────────────────
  existingTitle: { pt: 'Um objetivo para o seu ano', en: 'A goal for your year' },
  existingHint: { pt: 'Se quiser, conte onde você quer chegar. Dá para fazer depois, em Perfil.', en: 'If you like, say where you want to get to. You can do it later in Profile.' },
  notNow: { pt: 'Agora não', en: 'Not now' },
  save: { pt: 'Guardar', en: 'Save' },
  // ── Meu objetivo ──────────────────────────────────────────────────────────
  myGoal: { pt: 'Meu objetivo', en: 'My goal' },
  myGoalEmpty: { pt: 'Você ainda não escreveu um objetivo. Quando quiser, ele fica aqui.', en: 'You have not written a goal yet. When you want to, it will live here.' },
  setGoal: { pt: 'Escrever meu objetivo', en: 'Write my goal' },
  edit: { pt: 'Editar', en: 'Edit' },
  goalSince: { pt: 'Desde', en: 'Since' },
  myWhy: { pt: 'Meu porquê', en: 'My why' },
  myPhrase: { pt: 'Para os dias difíceis', en: 'For harder days' },
  myPlan: { pt: 'Quando atrapalhar', en: 'When it gets in the way' },
  myPriorities: { pt: 'Minhas prioridades', en: 'My priorities' },
  noPriorities: { pt: 'Nenhuma ainda. Toque na estrela de um hábito para marcar.', en: 'None yet. Tap the star on a habit to mark it.' },
  history: { pt: 'Objetivos anteriores', en: 'Earlier goals' },
  voiceToggle: { pt: 'Soulmon pode lembrar meu porquê', en: 'Soulmon can remind me of my why' },
  voiceToggleHint: { pt: 'No máximo uma vez por semana, num dia bom.', en: 'At most once a week, on a good day.' },
  homeLineAria: { pt: 'Abrir Meu objetivo', en: 'Open My goal' },
  // ── revisões ──────────────────────────────────────────────────────────────
  weeklyTitle: { pt: 'Suas prioridades nesta semana', en: 'Your priorities this week' },
  weeklyOf: { pt: 'de', en: 'of' },
  weeklyAsk: { pt: 'O que mais pesou nesta semana? (opcional)', en: 'What weighed most this week? (optional)' },
  weeklyDone: { pt: 'Anotado.', en: 'Noted.' },
  monthTitle: { pt: 'Olhar para o mês', en: 'Looking at the month' },
  monthCard: { pt: 'Um olhar para o mês que passou', en: 'A look at the month that passed' },
  monthCardCta: { pt: 'Ver o mês', en: 'See the month' },
  monthDismiss: { pt: 'Deixar para depois', en: 'Leave it for later' },
  stepEvidence: { pt: 'O que aconteceu', en: 'What happened' },
  evidenceLine: { pt: 'feitas de', en: 'done out of' },
  evidenceTotal: { pt: 'No total', en: 'In total' },
  evidenceNone: { pt: 'Não há registro deste mês.', en: 'There is no record for this month.' },
  evidenceAsk: { pt: 'Nas outras, o que aconteceu?', en: 'On the others, what happened?' },
  stepPerceived: { pt: 'Você sente que está mais perto?', en: 'Do you feel you are getting closer?' },
  stepObstacles: { pt: 'O que mais pesou?', en: 'What weighed the most?' },
  stepDecision: { pt: 'E agora?', en: 'And now?' },
  stepNext: { pt: 'A meta do próximo mês (opcional)', en: 'Next month goal (optional)' },
  nextPlaceholder: { pt: 'Um passo seu para o mês', en: 'One step of your own for the month' },
  prevMilestone: { pt: 'A meta do mês anterior', en: 'Last month goal' },
  mDone: { pt: 'Feita', en: 'Done' },
  mPartial: { pt: 'Em parte', en: 'Partly' },
  mNot: { pt: 'Não desta vez', en: 'Not this time' },
  next: { pt: 'Próximo', en: 'Next' },
  back: { pt: 'Voltar', en: 'Back' },
  finish: { pt: 'Concluir', en: 'Finish' },
  semesterTitle: { pt: 'Seis meses de caminho', en: 'Six months on the path' },
  semesterStill: { pt: 'O objetivo ainda é o que você quer?', en: 'Is the goal still what you want?' },
  semesterChanged: { pt: 'O que mudou em você?', en: 'What has changed in you?' },
  semesterMilestone: { pt: 'Um marco para os próximos 6 meses', en: 'A milestone for the next 6 months' },
  semesterReward: { pt: 'Um presente para o seu Soulmon, pelo olhar que você fez.', en: 'A gift for your Soulmon, for the look you took.' },
  yearTitleReview: { pt: 'Um ano depois', en: 'A year later' },
  yearLook: { pt: 'Olhando quem você era há um ano, o que mudou?', en: 'Looking at who you were a year ago, what changed?' },
  yearArchive: { pt: 'Guardar este objetivo e começar outro', en: 'Keep this goal and start another' },
  yearKeep: { pt: 'Continuar com este objetivo', en: 'Keep going with this goal' },
  notePlaceholder: { pt: 'Escreva do seu jeito (opcional)', en: 'Write it your way (optional)' },
  // ── as 3 cartas e a revisão de tarefas (PLANO §2b) ────────────────────────
  tasksAsk: { pt: 'Você quer rever suas tarefas?', en: 'Do you want to look over your tasks?' },
  tasksYes: { pt: 'Sim, quero rever', en: 'Yes, let us look' },
  tasksNo: { pt: 'Agora não', en: 'Not now' },
  plansChanged: { pt: 'Meus planos mudaram', en: 'My plans have changed' },
  switchCard: { pt: 'Trocar de carta', en: 'Switch card' },
  switchCardTitle: { pt: 'Em que momento você está?', en: 'Where are you right now?' },
  switchCardHint: { pt: 'A carta só ajuda a escolher suas tarefas. Trocar não apaga nada.', en: 'The card only helps pick your tasks. Switching erases nothing.' },
  currentCard: { pt: 'Sua carta', en: 'Your card' },
  suggestAdd: { pt: 'Adicionar', en: 'Add' },
  suggestNone: { pt: 'Nada novo para sugerir agora.', en: 'Nothing new to suggest right now.' },
  suggestSkip: { pt: 'Agora não', en: 'Not now' },
  // ── falas do Soulmon (E11) ────────────────────────────────────────────────
  voiceReviewDone: { pt: 'Você olhou para o caminho. Eu gostei de ver junto.', en: 'You looked at the path. I liked seeing it with you.' },
  voiceGoalHit: { pt: 'Lembra do seu porquê? Hoje ele estava bem perto.', en: 'Remember your why? Today it was right here.' },
  voiceMilestone: { pt: 'Mais um marco no caminho. Eu estava aqui.', en: 'Another marker on the path. I was here.' },
} satisfies Record<string, Bi>;

export type PcKey = keyof typeof PC;
export const tx = (k: PcKey, isPt: boolean): string => (isPt ? PC[k].pt : PC[k].en);

export const MOTIVE_LABEL: Record<MotiveKey, Bi> = {
  health: { pt: 'Cuidar da minha saúde', en: 'Taking care of my health' },
  family: { pt: 'Estar presente para quem eu amo', en: 'Being there for people I love' },
  freedom: { pt: 'Ter mais liberdade', en: 'Having more freedom' },
  growth: { pt: 'Crescer como pessoa', en: 'Growing as a person' },
  calm: { pt: 'Viver com mais calma', en: 'Living with more calm' },
  meaning: { pt: 'Fazer algo que faça sentido', en: 'Doing something meaningful' },
  curiosity: { pt: 'Aprender e descobrir', en: 'Learning and discovering' },
  pride: { pt: 'Sentir orgulho do meu caminho', en: 'Feeling proud of my path' },
  contribution: { pt: 'Contribuir com os outros', en: 'Contributing to others' },
  joy: { pt: 'Ter mais alegria no dia a dia', en: 'More joy in daily life' },
  security: { pt: 'Ter mais segurança', en: 'Feeling more secure' },
  other: { pt: 'Outro motivo', en: 'Another reason' },
};

export const OBSTACLE_LABEL: Record<ObstacleKey, Bi> = {
  time: { pt: 'Falta de tempo', en: 'Not enough time' },
  energy: { pt: 'Pouca energia', en: 'Low energy' },
  forget: { pt: 'Esquecer', en: 'Forgetting' },
  mood: { pt: 'Desânimo', en: 'Low mood' },
  focus: { pt: 'Distração', en: 'Distraction' },
  others: { pt: 'Outras pessoas e imprevistos', en: 'Other people and surprises' },
  start: { pt: 'Começar', en: 'Getting started' },
  other: { pt: 'Outro', en: 'Other' },
};

export const PLAN_SUGGESTIONS: Bi[] = [
  { pt: 'faço só 5 minutos', en: 'do just 5 minutes' },
  { pt: 'faço amanhã cedo', en: 'do it early tomorrow' },
  { pt: 'peço ajuda', en: 'ask for help' },
];

export const PERCEIVED_LABEL: Record<Perceived, Bi> = {
  closer: { pt: 'Sim, mais perto', en: 'Yes, closer' },
  same: { pt: 'Na mesma distância', en: 'About the same' },
  farther: { pt: 'Um pouco mais longe', en: 'A bit farther' },
  unsure: { pt: 'Ainda não sei dizer', en: 'Not sure yet' },
};

export const DECISION_LABEL: Record<ReviewDecision, Bi> = {
  keep: { pt: 'Manter como está', en: 'Keep it as it is' },
  adjust: { pt: 'Ajustar meus hábitos', en: 'Adjust my habits' },
  change: { pt: 'Mudar o objetivo', en: 'Change the goal' },
};

/** Ideias que só PREENCHEM o campo (o jogador edita). Por área de vida. */
export const YEAR_EXAMPLES: Record<string, Bi[]> = {
  sono: [{ pt: 'Dormir bem na maioria das noites', en: 'Sleeping well most nights' }],
  corpo: [{ pt: 'Me mexer com prazer, sem dor', en: 'Moving with pleasure and without pain' }, { pt: 'Correr 5 km', en: 'Running 5 km' }],
  mente: [{ pt: 'Me sentir mais calmo no dia a dia', en: 'Feeling calmer day to day' }],
  foco: [{ pt: 'Terminar o que começo', en: 'Finishing what I start' }],
  aprendizado: [{ pt: 'Concluir um curso que me interessa', en: 'Finishing a course I care about' }],
  relacoes: [{ pt: 'Estar mais perto de quem eu amo', en: 'Being closer to people I love' }],
  casa: [{ pt: 'Ter uma casa em que eu goste de estar', en: 'Having a home I like being in' }],
  financas: [{ pt: 'Ter uma reserva para imprevistos', en: 'Having a cushion for surprises' }],
  proposito: [{ pt: 'Fazer algo que faça sentido pra mim', en: 'Doing something that matters to me' }],
  criatividade: [{ pt: 'Criar um pouco toda semana', en: 'Creating a little every week' }],
};

/** Mensagens "em linguagem de evidência" (nunca de julgamento). */
export function evidenceSentence(done: number, due: number, isPt: boolean): string {
  return `${done} ${isPt ? 'de' : 'of'} ${due}`;
}
