/**
 * OFICINA DO FOCO — o catálogo de técnicas (04/10/2026, `docs/PLANO-OFICINA-FOCO.md` §2).
 *
 * A copy DESCREVE a técnica e diz a evidência com honestidade; nunca promete efeito
 * (mesma regra do Ateliê da Mente). Cada técnica carrega a FONTE e o nível de evidência, que
 * o `InfoTip` mostra. Dono único: nenhum componente escreve esta copy à mão.
 * `icon` é nome do subset da fonte de ícones (`styles/tokens.md`).
 */
export type Evidencia = 'forte' | 'moderada' | 'fraca';

export interface FocoTecnica {
  id: 'pomodoro' | 'blocos' | 'se-entao' | 'esvaziar' | 'dois-minutos' | 'eisenhower' | 'sapo';
  icon: string;
  namePt: string; nameEn: string;
  /** A linha do card — descreve, não promete. */
  linePt: string; lineEn: string;
  /** Atrás do `InfoTip`: como se faz e por que costuma ajudar. */
  howPt: string; howEn: string;
  evidencia: Evidencia;
  /** A fonte (neutra de idioma: autor, ano, veículo). */
  fonte: string;
  /** Tem timer de verdade na folha? */
  timer?: boolean;
}

export const EVIDENCIA_LABEL: Record<Evidencia, { pt: string; en: string }> = {
  forte: { pt: 'Evidência forte', en: 'Strong evidence' },
  moderada: { pt: 'Evidência moderada', en: 'Moderate evidence' },
  fraca: { pt: 'Evidência fraca', en: 'Weak evidence' },
};

export const FOCO_TECNICAS: readonly FocoTecnica[] = [
  {
    id: 'pomodoro', icon: 'timer', timer: true, evidencia: 'moderada',
    namePt: 'Pomodoro', nameEn: 'Pomodoro',
    linePt: '25 minutos de foco, 5 de pausa.', lineEn: '25 minutes of focus, 5 of rest.',
    howPt: 'Escolha uma tarefa, foque por 25 minutos, descanse 5. Depois de quatro rodadas, uma pausa maior, de 15. As pausas fixas tiram de você a decisão de quando parar. Estudos acham efeito pequeno das pausas curtas sobre vigor e cansaço, e uma pausa marcada saiu melhor que pausa livre num dia de estudo; a técnica em si tem poucos ensaios.',
    howEn: 'Pick one task, focus for 25 minutes, rest for 5. After four rounds, take a longer break of 15. Fixed breaks take the "when do I stop?" decision off you. Studies find a small effect of short breaks on vigor and fatigue, and scheduled breaks beat free breaks in one study day; the technique itself has few trials.',
    fonte: 'Cirillo (2006); Biwer et al. (2023), Br. J. Educ. Psychol.; Albulescu et al. (2022), PLOS ONE',
  },
  {
    id: 'blocos', icon: 'schedule', timer: true, evidencia: 'fraca',
    namePt: 'Blocos de foco', nameEn: 'Focus blocks',
    linePt: '50 minutos de foco, 10 de pausa.', lineEn: '50 minutes of focus, 10 of rest.',
    howPt: 'Um bloco mais longo serve a tarefa que pede imersão (escrever, programar, estudar). Há quem use 90 minutos de foco e 20 de pausa, ligado ao ritmo ultradiano. A pausa fixa continua. A evidência é fraca: o ciclo de 90 minutos é extrapolação e não vale como regra.',
    howEn: 'A longer block suits work that needs immersion (writing, coding, studying). Some use 90 minutes of focus and 20 of rest, tied to the ultradian rhythm. The fixed break stays. Evidence is weak: the 90-minute cycle is an extrapolation, not a rule.',
    fonte: 'Ericsson, Krampe & Tesch-Römer (1993), Psychol. Rev.; Kleitman (BRAC)',
  },
  {
    id: 'se-entao', icon: 'flag', evidencia: 'forte',
    namePt: 'Se… então…', nameEn: 'If… then…',
    linePt: 'Ligue um gatilho a uma ação.', lineEn: 'Tie a cue to an action.',
    howPt: 'Escreva um plano na forma "se acontecer X, então faço Y": "se eu sentar à mesa às 9h, então abro o texto". O gatilho decide por você na hora. Em 94 estudos reunidos o efeito foi médio a grande (d ≈ 0,65), embora estudos mais recentes e maiores mostrem efeito menor.',
    howEn: 'Write a plan as "if X happens, then I do Y": "if I sit at my desk at 9, then I open the draft". The cue decides for you in the moment. Across 94 pooled studies the effect was medium to large (d ≈ 0.65), though newer, larger studies show a smaller one.',
    fonte: 'Gollwitzer & Sheeran (2006), Adv. Exp. Soc. Psychol. 38',
  },
  {
    id: 'esvaziar', icon: 'psychology', evidencia: 'moderada',
    namePt: 'Esvaziar a cabeça', nameEn: 'Brain dump',
    linePt: 'Anote o que pende, com um primeiro passo.', lineEn: 'Write down what is pending, with a first step.',
    howPt: 'Antes de começar, anote no papel tudo o que está na sua cabeça e, para o que importa, o primeiro passo. Pendências sem plano tendem a voltar como pensamento intruso; um plano concreto reduz isso. Há ensaios pequenos, com efeito modesto.',
    howEn: 'Before you start, write down everything on your mind and, for what matters, the first step. Unplanned loose ends tend to return as intrusive thoughts; a concrete plan reduces that. There are small trials with a modest effect.',
    fonte: 'Masicampo & Baumeister (2011), J. Pers. Soc. Psychol. 101(4); Scullin et al. (2018), J. Exp. Psychol. Gen.',
  },
  {
    id: 'dois-minutos', icon: 'bolt', evidencia: 'fraca',
    namePt: 'Regra dos 2 minutos', nameEn: 'Two-minute rule',
    linePt: 'O que cabe em 2 minutos, faça agora.', lineEn: 'If it fits in 2 minutes, do it now.',
    howPt: 'Se uma tarefa leva menos de 2 minutos, fazer na hora custa menos do que anotar e voltar depois. É uma regra prática do método GTD. Evidência fraca: não tem ensaio próprio.',
    howEn: 'If a task takes under 2 minutes, doing it now costs less than noting it and coming back. It is a rule of thumb from the GTD method. Weak evidence: it has no trial of its own.',
    fonte: 'Allen, Getting Things Done (2001)',
  },
  {
    id: 'eisenhower', icon: 'task_alt', evidencia: 'fraca',
    namePt: 'Matriz de Eisenhower', nameEn: 'Eisenhower matrix',
    linePt: 'Separe o urgente do importante.', lineEn: 'Tell urgent from important.',
    howPt: 'Divida as tarefas em quatro: importante e urgente (faça), importante e não urgente (agende), urgente e não importante (delegue, se der), nenhum dos dois (largue). Ajuda a notar o que só grita. Evidência fraca: é uma ferramenta de organização, sem ensaio próprio.',
    howEn: 'Sort tasks into four: important and urgent (do), important and not urgent (schedule), urgent and not important (delegate if you can), neither (drop). It helps spot what merely shouts. Weak evidence: an organizing tool with no trial of its own.',
    fonte: 'Covey (1989), The 7 Habits (atribuída a Eisenhower, 1954)',
  },
  {
    id: 'sapo', icon: 'eco', evidencia: 'fraca',
    namePt: 'O sapo primeiro', nameEn: 'Eat the frog',
    linePt: 'A tarefa mais difícil, logo cedo.', lineEn: 'The hardest task, first thing.',
    howPt: 'Escolha a tarefa mais difícil ou mais evitada do dia e faça-a antes das outras, quando a energia costuma estar melhor. Evidência fraca: vem da literatura de autoajuda, sem ensaio. A frase atribuída a Mark Twain é apócrifa.',
    howEn: 'Pick the hardest or most avoided task of the day and do it before the others, when energy tends to be better. Weak evidence: it comes from self-help writing, with no trial. The line attributed to Mark Twain is apocryphal.',
    fonte: 'Tracy, Eat That Frog! (2001)',
  },
];
