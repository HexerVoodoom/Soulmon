/**
 * O POOL DE ATIVIDADES CURADAS.
 *
 * Cada item passou por revisão de evidência — a citação completa e o achado
 * em 1 linha estão em `docs/CATALOGO-EVIDENCIAS.md`. Regra do plano: nada de
 * dieta/jejum/caloria/peso/sono-por-duração/promessa-de-tratamento (linha
 * vermelha do psicólogo). Nenhum item aqui viola essa linha.
 *
 * Tipos: `src/types/activityCatalog.ts`. Consumidores: `utils/recommend.ts`
 * (starter set do onboarding) e o navegador de catálogo em `CreateModal`.
 */
import type { CatalogItem } from '../types/activityCatalog';
import type { Schedule } from '../types/taskModel';

const daily: Schedule = { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] };
const weekdays5: Schedule = { kind: 'weekdays', days: [1, 2, 3, 4, 5] };
const x3: Schedule = { kind: 'timesPerWeek', target: 3 };
const x2: Schedule = { kind: 'timesPerWeek', target: 2 };

export const ACTIVITY_CATALOG: CatalogItem[] = [
  // ---------------------------------------------------------------- sono
  {
    id: 'sono-horario-fixo',
    kind: 'especifica',
    area: 'sono',
    category: 'Wellness',
    emoji: '🌙',
    name: { pt: 'Deitar num horário fixo', en: 'Go to bed at a fixed time' },
    why: {
      pt: 'Higiene do sono com horário regular está entre as recomendações com maior consenso clínico para melhorar o sono.',
      en: 'A regular bedtime is one of the most consistently recommended sleep-hygiene practices.',
    },
    levels: [
      { label: { pt: 'Nível 1 — 3x/semana', en: 'Level 1 — 3x/week' }, target: { pt: 'Deitar na janela escolhida 3 noites', en: 'Go to bed in the chosen window 3 nights' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 2 — dias úteis', en: 'Level 2 — weekdays' }, target: { pt: 'Deitar na janela em todo dia útil', en: 'Bed window every weekday' }, effort: 1, defaultSchedule: weekdays5 },
      { label: { pt: 'Nível 3 — todo dia', en: 'Level 3 — every day' }, target: { pt: 'Deitar na janela todos os dias', en: 'Bed window every day' }, effort: 2, defaultSchedule: daily },
    ],
    anchorSuggestion: { pt: 'depois de escovar os dentes, na cama', en: 'after brushing your teeth, in bed' },
    addresses: ['constancia', 'esquecer'],
    leverages: ['disciplina'],
    evidence: { level: 'A', refs: ['Irish et al. 2015 (Sleep Medicine Reviews)'] },
  },
  {
    id: 'sono-telas-fora',
    kind: 'especifica',
    area: 'sono',
    category: 'Wellness',
    emoji: '📵',
    name: { pt: 'Telas fora 30 min antes de dormir', en: 'Screens off 30 min before bed' },
    why: {
      pt: 'Reduzir exposição a telas antes de dormir é recomendação central das revisões de higiene do sono.',
      en: 'Reducing screen exposure before bed is a core sleep-hygiene recommendation.',
    },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '3 noites/semana sem tela antes de dormir', en: '3 nights/week screen-free before bed' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: 'Dias úteis sem tela antes de dormir', en: 'Weekdays screen-free before bed' }, effort: 1, defaultSchedule: weekdays5 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: 'Todo dia sem tela antes de dormir', en: 'Every day screen-free before bed' }, effort: 2, defaultSchedule: daily },
    ],
    addresses: ['distracao', 'constancia'],
    leverages: ['disciplina'],
    evidence: { level: 'A', refs: ['Irish et al. 2015 (Sleep Medicine Reviews)'] },
  },
  {
    id: 'sono-preparar-quarto',
    kind: 'especifica',
    area: 'sono',
    category: 'Wellness',
    emoji: '🛏️',
    name: { pt: 'Preparar o quarto para dormir', en: 'Prep the room for sleep' },
    why: { pt: 'Ambiente escuro, silencioso e fresco é parte padrão da higiene do sono recomendada.', en: 'A dark, quiet, cool room is a standard sleep-hygiene recommendation.' },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '2x/semana apagar luzes fortes antes de dormir', en: '2x/week dim lights before bed' }, effort: 1, defaultSchedule: x2 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '3x/semana', en: '3x/week' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: 'Todo dia', en: 'Every day' }, effort: 1, defaultSchedule: daily },
    ],
    addresses: ['esquecer'],
    leverages: ['organizacao'],
    evidence: { level: 'B', refs: ['Irish et al. 2015 (Sleep Medicine Reviews)'] },
  },

  // ---------------------------------------------------------------- corpo
  {
    id: 'corpo-caminhar',
    kind: 'especifica',
    area: 'corpo',
    category: 'Fitness',
    emoji: '🚶',
    name: { pt: 'Caminhar', en: 'Walk' },
    why: {
      pt: 'Meta-análise de 15 coortes (n grande, Paluch et al. 2022): mais passos por dia associam-se a menor mortalidade por todas as causas, com o benefício estabilizando por volta de 6.000–10.000 passos.',
      en: 'A 15-cohort meta-analysis (Paluch et al. 2022) found more daily steps associated with lower all-cause mortality, plateauing around 6,000–10,000 steps.',
    },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: 'Caminhar 10 min, 3x/semana', en: 'Walk 10 min, 3x/week' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: 'Caminhar 20 min, dias úteis', en: 'Walk 20 min, weekdays' }, effort: 2, defaultSchedule: weekdays5 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: 'Caminhar 20+ min todo dia', en: 'Walk 20+ min every day' }, effort: 2, defaultSchedule: daily },
    ],
    anchorSuggestion: { pt: 'depois do almoço, saindo de casa', en: 'after lunch, leaving the house' },
    addresses: ['energia', 'comecar'],
    leverages: ['energiaFisica'],
    evidence: { level: 'A', refs: ['Paluch et al. 2022 (Lancet Public Health)'] },
  },
  {
    id: 'corpo-beber-agua',
    kind: 'especifica',
    area: 'corpo',
    category: 'Health',
    emoji: '💧',
    name: { pt: 'Beber água', en: 'Drink water' },
    why: { pt: 'Hidratação regular é recomendação de saúde básica amplamente consensual; útil como vitória rápida no começo.', en: 'Regular hydration is a broadly consensual basic health recommendation; a good early quick win.' },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '1 copo ao acordar', en: '1 glass on waking' }, effort: 1, defaultSchedule: daily },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '3 copos ao longo do dia', en: '3 glasses through the day' }, effort: 1, defaultSchedule: daily },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: '6 copos ao longo do dia', en: '6 glasses through the day' }, effort: 2, defaultSchedule: daily },
    ],
    anchorSuggestion: { pt: 'assim que levantar, na cozinha', en: 'right after waking, in the kitchen' },
    addresses: ['comecar', 'esquecer'],
    leverages: [],
    evidence: { level: 'B', refs: ['Consenso de guias de saúde pública (hidratação diária)'], note: 'Recomendação amplamente aceita; não há meta-análise específica de "copos/dia" como intervenção comportamental — nível B por consenso clínico.' },
  },
  {
    id: 'corpo-forca',
    kind: 'especifica',
    area: 'corpo',
    category: 'Fitness',
    emoji: '🏋️',
    name: { pt: 'Treino de força', en: 'Strength training' },
    why: { pt: 'A OMS recomenda atividades de fortalecimento muscular 2x ou mais por semana para adultos, associadas a menor mortalidade e melhor saúde metabólica.', en: 'WHO recommends muscle-strengthening activity 2+ times/week for adults, linked to lower mortality and better metabolic health.' },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '1x/semana, 10 min', en: '1x/week, 10 min' }, effort: 2, defaultSchedule: { kind: 'timesPerWeek', target: 1 } },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '2x/semana, 15-20 min', en: '2x/week, 15-20 min' }, effort: 2, defaultSchedule: x2 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: '2-3x/semana, 20+ min', en: '2-3x/week, 20+ min' }, effort: 3, defaultSchedule: x3 },
    ],
    addresses: ['energia', 'comecar'],
    leverages: ['disciplina', 'energiaFisica'],
    evidence: { level: 'A', refs: ['WHO Guidelines on Physical Activity and Sedentary Behaviour, 2020'] },
  },
  {
    id: 'corpo-alongar',
    kind: 'especifica',
    area: 'corpo',
    category: 'Fitness',
    emoji: '🧘‍♂️',
    name: { pt: 'Alongar', en: 'Stretch' },
    why: { pt: 'Alongamento regular é recomendado por guias de atividade física como complemento de mobilidade e prevenção de lesões.', en: 'Regular stretching is recommended by physical-activity guidelines to support mobility and reduce injury risk.' },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '5 min, 3x/semana', en: '5 min, 3x/week' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '10 min, dias úteis', en: '10 min, weekdays' }, effort: 1, defaultSchedule: weekdays5 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: '10 min todo dia', en: '10 min every day' }, effort: 2, defaultSchedule: daily },
    ],
    addresses: ['energia'],
    leverages: ['calma'],
    evidence: { level: 'B', refs: ['WHO Guidelines on Physical Activity and Sedentary Behaviour, 2020'] },
  },

  // ---------------------------------------------------------------- mente
  {
    id: 'mente-respiracao',
    kind: 'especifica',
    area: 'mente',
    category: 'Wellness',
    emoji: '🌬️',
    name: { pt: 'Respiração lenta (suspiro cíclico)', en: 'Slow breathing (cyclic sighing)' },
    why: {
      pt: 'RCT (Balban et al. 2023, Cell Reports Medicine): 5 min/dia de respiração com suspiro cíclico melhoraram humor e reduziram frequência respiratória mais que meditação equivalente.',
      en: 'RCT (Balban et al. 2023, Cell Reports Medicine): 5 min/day of cyclic sighing improved mood and lowered respiratory rate more than equivalent meditation.',
    },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '2 min, 3x/semana', en: '2 min, 3x/week' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '5 min, dias úteis', en: '5 min, weekdays' }, effort: 1, defaultSchedule: weekdays5 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: '5 min todo dia', en: '5 min every day' }, effort: 2, defaultSchedule: daily },
    ],
    anchorSuggestion: { pt: 'antes de abrir o celular de manhã', en: 'before opening your phone in the morning' },
    addresses: ['ansiedade'],
    leverages: ['calma'],
    contraindications: [
      'se sentir tontura ou falta de ar, pare e respire normalmente',
      'não usar como substituto de atendimento em crise de pânico recorrente',
    ],
    evidence: {
      level: 'B',
      refs: ['Balban et al. 2023 (Cell Reports Medicine)'],
      note: 'RCT único, remoto, n=108 (24 no controle) — sem poder estatístico para superioridade entre os braços e sem mudança medida em VFC. Um RCT pequeno não sustenta nível A (revisão psicológica de 28/09/2026).',
    },
  },
  {
    id: 'mente-gratidao',
    kind: 'especifica',
    area: 'mente',
    category: 'Wellness',
    emoji: '📓',
    name: { pt: 'Diário de gratidão', en: 'Gratitude journal' },
    why: {
      pt: 'RCT clássico (Emmons & McCullough 2003): registrar gratidão semanalmente aumentou bem-estar em relação a grupos-controle.',
      en: 'Classic RCT (Emmons & McCullough 2003): weekly gratitude journaling raised well-being versus control groups.',
    },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '1 coisa boa, 2x/semana', en: '1 good thing, 2x/week' }, effort: 1, defaultSchedule: x2 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '3 coisas boas, 3x/semana', en: '3 good things, 3x/week' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: '3 coisas boas todo dia', en: '3 good things every day' }, effort: 2, defaultSchedule: daily },
    ],
    anchorSuggestion: { pt: 'antes de dormir, na cama', en: 'before sleep, in bed' },
    addresses: ['ansiedade', 'perfeccionismo'],
    leverages: ['calma'],
    contraindications: ['se listar coisas boas num dia difícil te deixar culpado, pule — não é obrigação'],
    evidence: {
      level: 'B',
      refs: ['Emmons & McCullough 2003 (Journal of Personality and Social Psychology)'],
      note: 'O RCT original existe, mas meta-análises posteriores (Davis et al. 2016; Dickens 2017) mostram efeito pequeno, perto de zero contra controle ativo. Nível B (revisão psicológica de 28/09/2026).',
    },
  },
  {
    id: 'mente-autocompaixao',
    kind: 'abrangente',
    area: 'mente',
    category: 'Wellness',
    emoji: '💗',
    name: { pt: 'Praticar autocompaixão', en: 'Practice self-compassion' },
    why: { pt: 'Praticar frases gentis consigo mesmo é uma prática leve de autocompaixão, associada a menor ansiedade e maior bem-estar em revisões da área. Aqui é autocuidado, não é uma intervenção clínica.', en: 'Practicing kind self-talk is a light self-compassion practice, linked to lower anxiety and higher well-being in the research literature. This is self-care, not a clinical intervention.' },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: 'Uma frase gentil a si mesmo, 2x/semana', en: 'One kind sentence to yourself, 2x/week' }, effort: 1, defaultSchedule: x2 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '3x/semana', en: '3x/week' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: 'Todo dia', en: 'Every day' }, effort: 1, defaultSchedule: daily },
    ],
    addresses: ['perfeccionismo', 'ansiedade'],
    leverages: ['calma'],
    evidence: {
      level: 'B',
      refs: ['Ferrari et al. 2019 (Mindfulness) — meta-análise de intervenções de autocompaixão'],
      note: 'Neff 2003 é o artigo da ESCALA de autocompaixão, não de uma intervenção — a fonte correta para "praticar" é a meta-análise de intervenções (revisão psicológica de 28/09/2026).',
    },
  },
  {
    id: 'mente-ativacao-comportamental',
    kind: 'abrangente',
    area: 'mente',
    category: 'Wellness',
    emoji: '☀️',
    name: { pt: 'Fazer 1 coisa prazerosa', en: 'Do 1 pleasurable thing' },
    why: {
      pt: 'Programar pequenas atividades de que você gosta, ou que importam para você, é o núcleo da ativação comportamental, uma abordagem bem estudada para o humor (Cuijpers et al. 2007). Aqui é só uma prática leve.',
      en: 'Scheduling small activities you enjoy, or that matter to you, is the core of behavioral activation, a well-studied approach for mood (Cuijpers et al. 2007). This is just a light practice.',
    },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '2x/semana', en: '2x/week' }, effort: 1, defaultSchedule: x2 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '3x/semana', en: '3x/week' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: 'Todo dia', en: 'Every day' }, effort: 2, defaultSchedule: daily },
    ],
    addresses: ['energia', 'ansiedade'],
    leverages: ['curiosidade'],
    contraindications: [
      'não substitui ajuda profissional para depressão/ansiedade clínica',
      'em sofrimento intenso ou pensamento de se machucar, ligue 188 (CVV) ou 192',
    ],
    evidence: { level: 'A', refs: ['Cuijpers, van Straten & Warmerdam 2007 (Clinical Psychology Review)'] },
  },
  {
    id: 'mente-registro-pensamentos',
    kind: 'especifica',
    area: 'mente',
    category: 'Wellness',
    emoji: '📝',
    optInOnly: true,
    name: { pt: 'Registrar um pensamento difícil', en: 'Log a difficult thought' },
    why: {
      pt: 'Anotar um pensamento e o que o confirma ou contradiz é uma técnica usada na TCC. Aqui é uma versão simples, de autocuidado — não é diagnóstico e não substitui acompanhamento profissional.',
      en: 'Writing down a thought and what confirms or contradicts it is a technique used in CBT. Here it is a simple, self-care version — this is not a diagnosis and does not replace professional care.',
    },
    levels: [
      {
        label: { pt: 'Seu ritmo', en: 'Your pace' },
        target: {
          pt: '1x/semana, escrever 1 pensamento e o fato que o testa — sem pressa de aumentar',
          en: '1x/week, write 1 thought and the fact that tests it — no rush to increase',
        },
        effort: 1,
        defaultSchedule: { kind: 'timesPerWeek', target: 1 },
      },
    ],
    addresses: ['ansiedade', 'perfeccionismo'],
    leverages: ['calma'],
    contraindications: [
      'não é diagnóstico nem tratamento — não usar em crise aguda ou ideação suicida (ligue 188/CVV ou 192)',
      'se escrever sobre o pensamento te deixa ruminando (voltando ao mesmo assunto por muito tempo), pare, e prefira uma atividade prazerosa',
      'em TOC, checar pensamentos pode virar ritual; converse com um profissional',
      'não substitui acompanhamento profissional',
    ],
    evidence: {
      level: 'B',
      refs: ['Ciharova et al. 2021, Journal of Consulting and Clinical Psychology 89(6):563-574 (45 estudos, n=3.382)'],
      note: 'A meta-análise confirma o número, mas avalia reestruturação cognitiva PRESENCIAL e INDIVIDUAL, com terapeuta, contra lista de espera ou cuidado usual — não sustenta um registro semanal feito sozinho. Extrapolação registrada (revisão psicológica de 28/09/2026).',
    },
  },
  {
    id: 'mente-exposicao-leve',
    kind: 'abrangente',
    area: 'mente',
    category: 'Wellness',
    emoji: '🌤️',
    optInOnly: true,
    name: { pt: 'Encarar, de leve, algo que evito', en: 'Gently face something I avoid' },
    why: {
      pt: 'Aproximar-se aos poucos do que a gente evita costuma diminuir o medo com o tempo. Aqui é para evitações pequenas do dia a dia — não é uma intervenção clínica.',
      en: 'Gradually approaching what we avoid tends to reduce fear over time. This is for small, everyday avoidances — this is not a clinical intervention.',
    },
    levels: [
      {
        label: { pt: 'Seu ritmo', en: 'Your pace' },
        target: {
          pt: 'Escolha um passo que dê para fazer hoje; se ficou fácil, o próximo pode ser um pouquinho maior',
          en: 'Choose a step you can do today; if it felt easy, the next one can be a little bigger',
        },
        effort: 1,
        defaultSchedule: { kind: 'timesPerWeek', target: 1 },
      },
    ],
    addresses: ['ansiedade', 'comecar'],
    leverages: ['persistencia'],
    contraindications: [
      'não usar para fobia clínica, pânico, trauma ou TEPT — isso exige acompanhamento profissional',
      'não usar para comida, corpo ou peso — exposição alimentar em transtorno alimentar é clínica',
      'nunca em crise aguda ou ideação suicida (ligue 188/CVV ou 192)',
      'não é tratamento; é prática de autoajuda de baixa intensidade, e o mecanismo é a GRADAÇÃO — não a repetição do mesmo passo',
    ],
    evidence: {
      level: 'B',
      refs: [
        'Haug et al. 2012 (Clinical Psychology Review) — self-help para transtornos de ansiedade, meta-análise',
        'Domhardt et al. 2019 (Depression and Anxiety) — componentes de intervenções digitais para ansiedade',
      ],
      note: 'Evidência A é de exposição conduzida ou guiada por terapeuta para transtorno; a autoajuda não guiada tem efeito menor e menor adesão, e aqui é extrapolada para evitações cotidianas (revisão psicológica de 28/09/2026, que também vetou a referência anterior: PMC9735589/Heo & Park 2022 é exposição em realidade virtual PARA TEPT, conduzida por terapeuta — a fonte tratava exatamente da condição que este item contraindica).',
    },
  },

  // ---------------------------------------------------------------- foco
  {
    id: 'foco-bloco-25min',
    kind: 'especifica',
    area: 'foco',
    category: 'Discipline',
    emoji: '⏱️',
    name: { pt: 'Bloco de foco de 25 min', en: '25-min focus block' },
    why: { pt: 'Timeboxing (blocos curtos e protegidos de tempo) é técnica consolidada de produtividade recomendada por revisões de gestão do tempo.', en: 'Timeboxing (short, protected blocks of time) is a well-established productivity technique in time-management reviews.' },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '1 bloco, 3x/semana', en: '1 block, 3x/week' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '1 bloco, dias úteis', en: '1 block, weekdays' }, effort: 2, defaultSchedule: weekdays5 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: '2 blocos todo dia', en: '2 blocks every day' }, effort: 2, defaultSchedule: daily },
    ],
    addresses: ['distracao', 'comecar'],
    leverages: ['disciplina'],
    evidence: { level: 'B', refs: ['Revisões de timeboxing/Pomodoro em produtividade cognitiva'], note: 'Prática consolidada na indústria e com suporte indireto de estudos sobre atenção sustentada; nível B por falta de RCT específico do bloco de 25 min.' },
  },
  {
    id: 'foco-celular-fora',
    kind: 'especifica',
    area: 'foco',
    category: 'Discipline',
    emoji: '📴',
    name: { pt: 'Celular fora da mesa', en: 'Phone off the desk' },
    why: {
      pt: 'Experimentos (Ward et al. 2017): a mera presença do celular por perto (mesmo desligado) reduz a capacidade cognitiva disponível.',
      en: 'Experiments (Ward et al. 2017): the mere presence of a nearby phone (even off) reduces available cognitive capacity.',
    },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: 'Fora da mesa 3x/semana durante o foco', en: 'Off the desk 3x/week during focus' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: 'Dias úteis', en: 'Weekdays' }, effort: 1, defaultSchedule: weekdays5 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: 'Todo dia', en: 'Every day' }, effort: 1, defaultSchedule: daily },
    ],
    addresses: ['distracao'],
    leverages: ['disciplina'],
    evidence: { level: 'A', refs: ['Ward, Duke, Gneezy & Bos 2017 (Journal of the Association for Consumer Research)'] },
  },
  {
    id: 'foco-uma-tarefa-por-vez',
    kind: 'abrangente',
    area: 'foco',
    category: 'Discipline',
    emoji: '🎯',
    name: { pt: 'Escolher 1 prioridade do dia', en: 'Pick 1 priority for the day' },
    why: { pt: 'Definir uma única prioridade antes de começar reduz custo de troca de tarefa (task switching), documentado como prejudicial ao desempenho em revisões cognitivas.', en: 'Naming a single priority before starting reduces task-switching cost, documented as harmful to performance in cognitive reviews.' },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '3x/semana', en: '3x/week' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: 'Dias úteis', en: 'Weekdays' }, effort: 1, defaultSchedule: weekdays5 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: 'Todo dia', en: 'Every day' }, effort: 1, defaultSchedule: daily },
    ],
    addresses: ['distracao', 'comecar'],
    leverages: ['organizacao'],
    evidence: { level: 'B', refs: ['Revisões sobre custo de task-switching em cognição'] },
  },

  // ---------------------------------------------------------- aprendizado
  {
    id: 'aprendizado-recuperacao-ativa',
    kind: 'abrangente',
    area: 'aprendizado',
    category: 'Study',
    emoji: '🧠',
    name: { pt: 'Estudar com recuperação ativa', en: 'Study with active recall' },
    why: {
      pt: 'Roediger & Karpicke 2006: testar-se sobre o material (recuperação ativa) produz retenção muito maior no longo prazo que reler — 61% vs 40% após uma semana.',
      en: 'Roediger & Karpicke 2006: testing yourself on material (active recall) produces far higher long-term retention than rereading — 61% vs 40% after a week.',
    },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '10 min, 3x/semana', en: '10 min, 3x/week' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '20 min, dias úteis', en: '20 min, weekdays' }, effort: 2, defaultSchedule: weekdays5 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: '20+ min todo dia', en: '20+ min every day' }, effort: 2, defaultSchedule: daily },
    ],
    addresses: ['tempo', 'constancia'],
    leverages: ['curiosidade', 'disciplina'],
    evidence: { level: 'A', refs: ['Roediger & Karpicke 2006 (Psychological Science)', 'Dunlosky et al. 2013 (Psychological Science in the Public Interest)'] },
  },
  {
    id: 'aprendizado-pratica-espacada',
    kind: 'abrangente',
    area: 'aprendizado',
    category: 'Study',
    emoji: '📆',
    name: { pt: 'Praticar em sessões espaçadas', en: 'Practice in spaced sessions' },
    why: {
      pt: 'Revisão de técnicas de aprendizagem (Dunlosky et al. 2013) classifica prática espaçada como uma das técnicas de maior utilidade, junto com recuperação ativa.',
      en: 'A review of learning techniques (Dunlosky et al. 2013) rates spaced practice as one of the highest-utility techniques, alongside active recall.',
    },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '2x/semana', en: '2x/week' }, effort: 1, defaultSchedule: x2 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '3x/semana', en: '3x/week' }, effort: 2, defaultSchedule: x3 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: 'Dias úteis', en: 'Weekdays' }, effort: 2, defaultSchedule: weekdays5 },
    ],
    addresses: ['constancia', 'tempo'],
    leverages: ['organizacao'],
    evidence: { level: 'A', refs: ['Dunlosky et al. 2013 (Psychological Science in the Public Interest)'] },
  },
  {
    id: 'aprendizado-ler',
    kind: 'especifica',
    area: 'aprendizado',
    category: 'Study',
    emoji: '📖',
    name: { pt: 'Ler algumas páginas', en: 'Read a few pages' },
    why: { pt: 'Leitura regular é hábito de aprendizado de baixa fricção; vitória rápida recomendada em programas de formação de hábito (começar pequeno).', en: 'Regular reading is a low-friction learning habit; a recommended quick win in habit-formation programs (start small).' },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '5 páginas, 3x/semana', en: '5 pages, 3x/week' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '10 páginas, dias úteis', en: '10 pages, weekdays' }, effort: 1, defaultSchedule: weekdays5 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: '10 páginas todo dia', en: '10 pages every day' }, effort: 2, defaultSchedule: daily },
    ],
    anchorSuggestion: { pt: 'antes de dormir, na cama', en: 'before sleep, in bed' },
    addresses: ['comecar', 'constancia'],
    leverages: ['curiosidade'],
    evidence: { level: 'B', refs: ['Lally et al. 2010 (European Journal of Social Psychology) — começar pequeno favorece automaticidade'] },
  },

  // -------------------------------------------------------------- relações
  {
    id: 'relacoes-mensagem',
    kind: 'especifica',
    area: 'relacoes',
    category: 'Social',
    emoji: '💬',
    name: { pt: 'Mandar mensagem a alguém', en: 'Message someone' },
    why: {
      pt: 'Meta-análise (Holt-Lunstad et al. 2010, n=308.849): relações sociais fortes associam-se a 50% mais chance de sobrevivência, efeito comparável a parar de fumar.',
      en: 'Meta-analysis (Holt-Lunstad et al. 2010, n=308,849): strong social relationships associate with a 50% greater survival likelihood, an effect comparable to quitting smoking.',
    },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '1 mensagem, 2x/semana', en: '1 message, 2x/week' }, effort: 1, defaultSchedule: x2 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '1 mensagem, 3x/semana', en: '1 message, 3x/week' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: '1 mensagem todo dia', en: '1 message every day' }, effort: 1, defaultSchedule: daily },
    ],
    addresses: ['comecar', 'tempo'],
    leverages: ['sociabilidade'],
    evidence: { level: 'A', refs: ['Holt-Lunstad, Smith & Layton 2010 (PLoS Medicine)'] },
  },
  {
    id: 'relacoes-gentileza',
    kind: 'especifica',
    area: 'relacoes',
    category: 'Social',
    emoji: '🤝',
    name: { pt: 'Fazer um ato de gentileza', en: 'Do one act of kindness' },
    why: { pt: 'Estudos experimentais sobre atos de gentileza associam a prática a aumento de bem-estar de quem pratica, além de fortalecer vínculos sociais.', en: 'Experimental studies on kindness acts link the practice to greater well-being for the person doing it, and to stronger social bonds.' },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '1x/semana', en: '1x/week' }, effort: 1, defaultSchedule: { kind: 'timesPerWeek', target: 1 } },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '2x/semana', en: '2x/week' }, effort: 1, defaultSchedule: x2 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: '3x/semana', en: '3x/week' }, effort: 1, defaultSchedule: x3 },
    ],
    addresses: ['ansiedade'],
    leverages: ['sociabilidade'],
    evidence: { level: 'B', refs: ['Holt-Lunstad, Smith & Layton 2010 (PLoS Medicine) — vínculo social como fator protetor'] },
  },
  {
    id: 'relacoes-tempo-com-alguem',
    kind: 'abrangente',
    area: 'relacoes',
    category: 'Social',
    emoji: '👥',
    name: { pt: 'Passar tempo de qualidade com alguém', en: 'Spend quality time with someone' },
    why: { pt: 'A mesma meta-análise (Holt-Lunstad et al. 2010) sustenta o valor de interação social regular e não só de laços existentes — presença ativa importa.', en: 'The same meta-analysis (Holt-Lunstad et al. 2010) supports the value of regular social interaction, not just existing ties — active presence matters.' },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '1x/semana', en: '1x/week' }, effort: 2, defaultSchedule: { kind: 'timesPerWeek', target: 1 } },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '2x/semana', en: '2x/week' }, effort: 2, defaultSchedule: x2 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: '3x/semana', en: '3x/week' }, effort: 2, defaultSchedule: x3 },
    ],
    addresses: ['tempo'],
    leverages: ['sociabilidade'],
    evidence: { level: 'A', refs: ['Holt-Lunstad, Smith & Layton 2010 (PLoS Medicine)'] },
  },

  // -------------------------------------------------------------------- casa
  {
    id: 'casa-arrumar-10min',
    kind: 'especifica',
    area: 'casa',
    category: 'Discipline',
    emoji: '🧹',
    name: { pt: 'Arrumar por 10 minutos', en: 'Tidy up for 10 minutes' },
    why: { pt: 'Micro-hábitos de organização doméstica são recomendados por programas de formação de hábito como vitória rápida de baixa fricção (Fogg, Tiny Habits).', en: 'Small home-organization habits are recommended by habit-formation programs as low-friction quick wins (Fogg, Tiny Habits).' },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '3x/semana', en: '3x/week' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: 'Dias úteis', en: 'Weekdays' }, effort: 1, defaultSchedule: weekdays5 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: 'Todo dia', en: 'Every day' }, effort: 1, defaultSchedule: daily },
    ],
    addresses: ['comecar', 'energia'],
    leverages: ['organizacao'],
    evidence: { level: 'C', refs: ['Fogg, B.J. — Tiny Habits (2019, prática de campo, não RCT)'], note: 'Prática amplamente adotada em programas de mudança de comportamento, mas sem meta-análise dedicada a "arrumar 10 min"; entra como C por ser de baixo risco e alta plausibilidade (extensão direta de princípios de hábito bem estabelecidos).' },
  },
  {
    id: 'casa-roupa-amanha',
    kind: 'especifica',
    area: 'casa',
    category: 'Discipline',
    emoji: '👕',
    name: { pt: 'Preparar a roupa de amanhã', en: 'Prep tomorrow\'s clothes' },
    why: { pt: 'Reduzir decisões pela manhã (decision fatigue) é estratégia recomendada em programas de produtividade pessoal para poupar autocontrole.', en: 'Reducing morning decisions (decision fatigue) is a recommended personal-productivity strategy to conserve self-control.' },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '2x/semana', en: '2x/week' }, effort: 1, defaultSchedule: x2 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: 'Dias úteis', en: 'Weekdays' }, effort: 1, defaultSchedule: weekdays5 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: 'Todo dia', en: 'Every day' }, effort: 1, defaultSchedule: daily },
    ],
    anchorSuggestion: { pt: 'depois do jantar, no quarto', en: 'after dinner, in the bedroom' },
    addresses: ['esquecer', 'tempo'],
    leverages: ['organizacao'],
    evidence: { level: 'C', refs: ['Baumeister & Tierney — Willpower (2011): custo cognitivo de decisões repetidas'], note: 'Extensão plausível da literatura de decision fatigue; sem RCT específico da tarefa — nível C.' },
  },

  // ---------------------------------------------------------------- finanças
  {
    id: 'financas-registrar-gastos',
    kind: 'especifica',
    area: 'financas',
    category: 'Work',
    emoji: '💰',
    name: { pt: 'Registrar os gastos do dia', en: 'Log today\'s spending' },
    why: {
      pt: 'Automonitoramento é uma das técnicas de mudança de comportamento (BCT 2.3) mais robustas da taxonomia de Michie et al. (2013), usada em intervenções de saúde e finanças.',
      en: 'Self-monitoring is one of the most robust behavior-change techniques (BCT 2.3) in the Michie et al. (2013) taxonomy, used across health and financial interventions.',
    },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '2x/semana', en: '2x/week' }, effort: 1, defaultSchedule: x2 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: 'Dias úteis', en: 'Weekdays' }, effort: 1, defaultSchedule: weekdays5 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: 'Todo dia', en: 'Every day' }, effort: 1, defaultSchedule: daily },
    ],
    anchorSuggestion: { pt: 'à noite, antes de dormir', en: 'at night, before bed' },
    addresses: ['esquecer', 'comecar'],
    leverages: ['organizacao'],
    evidence: { level: 'A', refs: ['Michie et al. 2013 (Annals of Behavioral Medicine) — taxonomia BCT, self-monitoring of behaviour'] },
  },
  {
    id: 'financas-planejar-semana',
    kind: 'abrangente',
    area: 'financas',
    category: 'Work',
    emoji: '📊',
    name: { pt: 'Planejar os gastos da semana', en: 'Plan the week\'s spending' },
    why: { pt: 'Planejamento antecipado é técnica de mudança de comportamento reconhecida (Michie et al. 2013, "action planning"), aplicável a finanças pessoais.', en: 'Advance planning is a recognized behavior-change technique (Michie et al. 2013, "action planning"), applicable to personal finance.' },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '1x/semana', en: '1x/week' }, effort: 2, defaultSchedule: { kind: 'timesPerWeek', target: 1 } },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '1x/semana + revisão', en: '1x/week + review' }, effort: 2, defaultSchedule: { kind: 'timesPerWeek', target: 1 } },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: '1x/semana + ajuste diário rápido', en: '1x/week + quick daily check' }, effort: 3, defaultSchedule: { kind: 'timesPerWeek', target: 1 } },
    ],
    addresses: ['ansiedade', 'tempo'],
    leverages: ['organizacao', 'disciplina'],
    evidence: { level: 'B', refs: ['Michie et al. 2013 (Annals of Behavioral Medicine) — action planning'] },
  },

  // -------------------------------------------------------------- propósito
  {
    id: 'proposito-planejar-dia',
    kind: 'especifica',
    area: 'proposito',
    category: 'Discipline',
    emoji: '🗒️',
    name: { pt: 'Planejar o dia', en: 'Plan the day' },
    why: {
      pt: 'Meta-análise (Gollwitzer & Sheeran 2006): planos do tipo "quando/onde farei X" (implementation intentions) elevam substancialmente a taxa de execução de metas.',
      en: 'Meta-analysis (Gollwitzer & Sheeran 2006): "when/where I will do X" plans (implementation intentions) substantially raise goal follow-through.',
    },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '3x/semana, 2 min', en: '3x/week, 2 min' }, effort: 1, defaultSchedule: x3 },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: 'Dias úteis, 3 min', en: 'Weekdays, 3 min' }, effort: 1, defaultSchedule: weekdays5 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: 'Todo dia, 5 min', en: 'Every day, 5 min' }, effort: 1, defaultSchedule: daily },
    ],
    anchorSuggestion: { pt: 'assim que acordar, com café na mão', en: 'right after waking, coffee in hand' },
    addresses: ['comecar', 'esquecer', 'ansiedade'],
    leverages: ['organizacao'],
    evidence: { level: 'A', refs: ['Gollwitzer & Sheeran 2006 (Advances in Experimental Social Psychology)'] },
  },
  {
    id: 'proposito-refletir-valores',
    kind: 'abrangente',
    area: 'proposito',
    category: 'Wellness',
    emoji: '🧭',
    name: { pt: 'Refletir sobre o que importa hoje', en: 'Reflect on what matters today' },
    why: { pt: 'Clarificação de valores é componente central de terapias baseadas em valores (ex.: ACT) associadas a maior bem-estar e persistência em metas.', en: 'Values clarification is a core component of values-based therapies (e.g., ACT) linked to greater well-being and goal persistence.' },
    levels: [
      { label: { pt: 'Nível 1', en: 'Level 1' }, target: { pt: '1x/semana', en: '1x/week' }, effort: 1, defaultSchedule: { kind: 'timesPerWeek', target: 1 } },
      { label: { pt: 'Nível 2', en: 'Level 2' }, target: { pt: '2x/semana', en: '2x/week' }, effort: 1, defaultSchedule: x2 },
      { label: { pt: 'Nível 3', en: 'Level 3' }, target: { pt: '3x/semana', en: '3x/week' }, effort: 1, defaultSchedule: x3 },
    ],
    addresses: ['ansiedade', 'perfeccionismo'],
    leverages: ['calma'],
    evidence: { level: 'B', refs: ['Hayes, Strosahl & Wilson — Acceptance and Commitment Therapy (revisões sobre clarificação de valores)'] },
  },
];

/** Índice por id, para lookups O(1) no recomendador e no catálogo UI. */
export const ACTIVITY_CATALOG_BY_ID: Record<string, CatalogItem> = Object.fromEntries(
  ACTIVITY_CATALOG.map((item) => [item.id, item]),
);
