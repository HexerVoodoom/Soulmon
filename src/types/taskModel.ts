/**
 * O MODELO DE TAREFAS E HÁBITOS
 * =============================
 *
 * Dono único dos tipos e das constantes do motor de tarefas (docs/PLANO-TAREFAS.md).
 * Regras que USAM estes tipos vivem em `utils/habitRhythm.ts` (constância),
 * `utils/taskTriage.ts` (execução) e `utils/dailyReset.ts` (virada do dia).
 *
 * Os dois contratos, e por que são diferentes:
 *
 *   HÁBITO  → contrato de CONSTÂNCIA. O valor está em repetir. Mede-se por
 *             média móvel ("5 das últimas 7"), nunca por streak que zera.
 *   TAREFA  → contrato de EXECUÇÃO. O valor está em terminar e sair da cabeça.
 *             Mede-se por esforço concluído, nunca por contagem de itens.
 *
 * Enquanto os dois rendiam a mesma coisa, nenhum dos dois rendia muito: a
 * recompensa por CONTAGEM ensina o jogador a cadastrar cinco tarefas triviais
 * em vez de encarar a difícil (é o defeito documentado do Karma do Todoist).
 * Por isso `effort` existe e por isso a meta do dia passou a ser ponderada.
 */

/**
 * Como um hábito se repete.
 *
 * `weekdays` é o modelo antigo (e continua sendo o padrão de saves velhos —
 * ver `normalizeSchedule`). Os outros dois vieram do benchmark:
 *
 *  - `timesPerWeek`: "3x por semana". Tem PERDÃO EMBUTIDO — a pessoa escolhe os
 *    dias, então um dia ruim não é uma falha, é uma remarcação. É o formato que
 *    o Streaks (iOS) usa e o que mais sobrevive a semanas irregulares.
 *  - `everyNDays` com `from: 'completion'`: o `every!` do Todoist. É o item mais
 *    importante deste arquivo. Contando da CONCLUSÃO (e não da data prevista),
 *    é estruturalmente impossível acumular instâncias atrasadas — e a pilha de
 *    atrasadas é a causa nº1 documentada de abandono de app de tarefas.
 */
export type Schedule =
  | { kind: 'weekdays'; days: number[] }
  | { kind: 'timesPerWeek'; target: number }
  | { kind: 'everyNDays'; n: number; from: 'schedule' | 'completion' };

/**
 * A âncora do hábito — uma *implementation intention* (Gollwitzer).
 *
 * "Depois do café da manhã, na mesa da cozinha." Não é enfeite de texto: a
 * formulação "quando X, então Y, em Z" é a intervenção de custo zero com maior
 * efeito medido na literatura de mudança de comportamento, e é a espinha do
 * app do James Clear. Um hábito com âncora e um hábito com só um horário de
 * alarme são coisas categoricamente diferentes em taxa de execução.
 *
 * Ambos os campos são livres e opcionais — obrigar a preencher afasta na
 * criação, que é onde o usuário tem menos paciência.
 */
export interface HabitAnchor {
  /** "depois do café da manhã" */
  after?: string;
  /** "na mesa da cozinha" */
  where?: string;
}

/**
 * Esforço de uma tarefa pontual.
 *
 * 1 = rápida (minutos) · 2 = média · 3 = projeto (precisa de passos).
 *
 * A recompensa escala com ISTO, nunca com a quantidade de itens. Sem este
 * campo, todo o resto do desenho é contornável cadastrando cinco coisas
 * triviais — e o jogo passaria a premiar exatamente o comportamento que ele
 * existe para corrigir.
 */
export type Effort = 1 | 2 | 3;

export const DEFAULT_EFFORT: Effort = 1;

/**
 * Peso de um hábito na meta do dia.
 *
 * Fixo em 1 de propósito: hábito não tem esforço variável porque o valor dele
 * não está em ser difícil, está em ser repetido. Um hábito "difícil" que a
 * pessoa não repete vale menos que um fácil que ela repete — é essa a tese do
 * contrato de constância.
 */
export const HABIT_WEIGHT = 1;

/**
 * PRESETS DE ROTINA — P4 do `product/soulmon-01/balance/carga-diaria.md`.
 *
 * A pesquisa do dossiê foi conclusiva: **ninguém planeja a semana** num app de
 * hábito, e nenhum benchmark resolve isso com um planejador — todos resolvem
 * com preset de um toque na criação. A grade de 7 caixinhas não é difícil; ela
 * é uma DECISÃO de sete partes cobrada de quem só queria começar a correr.
 *
 * Então não se pede planejamento: pede-se UMA escolha. A grade completa
 * continua existindo atrás de "Personalizar" — quem quer a precisão não a
 * perde, e quem não quer não paga por ela.
 *
 * Domingo = 0, como `Date.getDay()` e como `Schedule.days` já usa.
 */
export const ROUTINE_PRESETS = {
  /** Todo dia. */
  diario: [0, 1, 2, 3, 4, 5, 6],
  /** Segunda a sexta. */
  uteis: [1, 2, 3, 4, 5],
  /** Segunda, quarta e sexta — dia sim, dia não, com o fim de semana livre. */
  leve: [1, 3, 5],
} as const;

export type RoutinePreset = keyof typeof ROUTINE_PRESETS;

/** Qual preset descreve exatamente esta seleção? `null` = personalizada. */
export function presetDeRotina(days: number[]): RoutinePreset | null {
  const alvo = [...new Set(days)].sort((a, b) => a - b).join(',');
  for (const [nome, dias] of Object.entries(ROUTINE_PRESETS)) {
    if ([...dias].join(',') === alvo) return nome as RoutinePreset;
  }
  return null;
}

/** Esforço válido, com o padrão para saves antigos (que não têm o campo). */
export function normalizeEffort(value: unknown): Effort {
  return value === 2 || value === 3 ? value : DEFAULT_EFFORT;
}

/**
 * Estado de uma tarefa pontual.
 *
 *  - `open`    — na lista, viva.
 *  - `someday` — o **Someday do Things 3**: deliberadamente INERTE. Não conta
 *                na meta, não envelhece, não gera cobrança. Dar permissão
 *                formal para não fazer nada é o que impede o backlog de virar
 *                um depósito de culpa que o usuário passa a evitar abrir.
 *  - `dropped` — o **Won't Do do TickTick**: estado terminal, com lista própria
 *                e volta atrás. Não é deletar (perde o contexto) nem concluir
 *                (é mentira). É a saída digna, e é ela que quebra o ciclo de
 *                falência periódica — apagar tudo e recomeçar — que é o padrão
 *                de uso dominante no mercado inteiro.
 */
export type TaskStatus = 'open' | 'someday' | 'dropped';

/**
 * Quantos adiamentos até o pet intervir.
 *
 * O contador vem do Sunsama ("movida 7 vezes"), e a intervenção é a nossa: aos
 * 3, o pet oferece decompor / encolher / deixar pra lá. Tornar a evitação
 * crônica um DADO em vez de um sentimento é o que transforma culpa em decisão.
 */
export const POSTPONE_NUDGE_AT = 3;

/**
 * A partir de quantos dias parada uma tarefa fica "assombrada".
 *
 * Aging temático: a tarefa esmaece, ganha uma partícula escura e o pet olha
 * para ela. Concluir uma assombrada dá BÔNUS DE ALÍVIO (o pet comemora mais).
 *
 * É a peça mais Soulmon do plano: a pilha de atrasadas é a causa nº1 de
 * abandono da categoria, e em vez de escondê-la (ou pior, pintá-la de vermelho
 * e cobrar) ela vira um loop de jogo com recompensa própria. Nenhum
 * concorrente faz isso — todos ou ignoram a tarefa velha ou a usam para
 * culpar.
 */
export const HAUNTED_AFTER_DAYS = 7;

/** Quantas tarefas podem ser "foco do dia". Três, e o número é a mecânica. */
export const MAX_DAILY_FOCUS = 3;

/**
 * Carga de esforço a partir da qual o pet avisa gentilmente.
 *
 * O medidor do Sunsama, em versão leve: o app assume que a estimativa do
 * usuário está errada PARA BAIXO (planning fallacy) e avisa antes que o dia
 * fique impossível. É AVISO, nunca bloqueio — o Motion é odiado exatamente por
 * decidir no lugar do usuário.
 */
export const OVERCOMMIT_EFFORT = 7;

/**
 * Marcos de maturidade de um hábito, em dias efetivos.
 *
 * Os números são de Lally et al. (2010): mediana real de **66 dias** até a
 * automaticidade, faixa de 18 a 254. NÃO são os "21 dias" populares — esse
 * número vem de Maxwell Maltz (1960), observando pacientes de cirurgia
 * plástica se acostumando ao rosto novo, e não tem nada a ver com hábitos.
 *
 * Cada marco evolui o ícone do hábito na lista (mesmo idioma visual do pet que
 * evolui) e aumenta o rendimento de atributo: o esforço antigo passa a valer
 * MAIS, nunca menos.
 */
export const HABIT_MILESTONES = [7, 21, 66] as const;

/**
 * WP2.13 — os DIAS EM QUE O PET COMENTA, e que não são marcos.
 *
 * Entre o 21 e o 66 há quarenta e cinco dias em que nada acontece — e é
 * exatamente ali que a maioria das pessoas para. Estes três números existem
 * para o pet falar no meio do caminho.
 *
 * A distinção é o pacote inteiro, e há teste travando:
 *  · `HABIT_MILESTONES` são MARCOS: mudam o ícone, aumentam o rendimento de
 *    atributo, e a lista NÃO muda;
 *  · `HABIT_CHEER_AT` são FALAS: não dão nada. Nem bônus, nem ícone, nem
 *    ponto. Se um dia derem, viraram marco por acidente, e a escada de
 *    maturidade passa a ter seis degraus sem ninguém ter decidido isso.
 * E nenhuma fala diz "faltam N" — o número que falta é a conta que
 * transforma constância em cobrança.
 */
export const HABIT_CHEER_AT = [3, 36, 51] as const;

/** O dia de fala que ACABOU de ser cruzado, ou `null`. Mesma forma de
 *  `milestoneReached`: existe para a fala tocar UMA vez. */
export function cheerReached(before: number, after: number): number | null {
  for (const n of HABIT_CHEER_AT) {
    if (before < n && after >= n) return n;
  }
  return null;
}

export type HabitTier = 'seed' | 'sprout' | 'sapling' | 'tree';

/** Rendimento extra de atributo por marco atingido (0%, +10%, +20%, +30%). */
export const HABIT_TIER_BONUS: Record<HabitTier, number> = {
  seed: 0,
  sprout: 0.1,
  sapling: 0.2,
  tree: 0.3,
};

export const HABIT_TIER_ICONS: Record<HabitTier, string> = {
  seed: '🌱',
  sprout: '🌿',
  sapling: '🪴',
  tree: '🌳',
};

/**
 * A janela de constância: "N das últimas 7".
 *
 * Substitui o streak binário, e a decisão tem base empírica. O achado mais
 * subestimado de Lally et al. é que **pular um único dia não prejudicou
 * mensuravelmente a curva de automaticidade** — ou seja, a ciência autoriza o
 * perdão; o streak que zera é invenção de produto, não de psicologia.
 *
 * E o streak que zera tem custo conhecido: o *what-the-hell effect* (Polivy &
 * Herman) e a violação de abstinência (Marlatt) descrevem exatamente o que
 * acontece quando a pessoa quebra a sequência — ela não perde um dia, ela
 * abandona. Com média móvel, uma falha custa ~14%, não 100%.
 */
export const CONSTANCY_WINDOW_DAYS = 7;

/**
 * Escudos de descanso — o Streak Freeze do Duolingo, com a correção que faz
 * ele funcionar: são consumidos AUTOMATICAMENTE.
 *
 * O Streak Freeze só virou a mecânica de retenção que é (churn de ~47% para
 * ~28%) quando passou a vir equipado por padrão. Proteção que exige lembrar de
 * ativar antes de falhar não protege ninguém — é exatamente o defeito da
 * Pousada do Habitica, que só ajuda quem já estava organizado o bastante para
 * não precisar dela.
 */
export const REST_SHIELD_MAX = 3;
export const REST_SHIELD_EARN_EVERY_DAYS = 7;

/**
 * "Never miss twice."
 *
 * A primeira falha não gera NADA visível — nenhum alerta, nenhuma marca, nenhum
 * número que muda de cor. Na segunda seguida, o pet aparece oferecendo uma
 * versão reduzida do hábito ("hoje, só 5 minutos?"), e aceitar conta como
 * feito.
 *
 * É o modelo do Finch (o pet nunca cobra, só oferece uma meta menor) e o
 * oposto exato do dano de HP do Habitica. A regra também é honesta com os
 * dados: um dia perdido não é sinal de nada; dois seguidos são o começo de um
 * padrão, e é aí — e só aí — que vale intervir.
 */
export const MISS_INTERVENTION_AT = 2;

/**
 * A JANELA DE DESCANSO (sono)
 * ---------------------------
 * A recompensa é por ENTRAR NA JANELA, nunca por dormir bem.
 *
 * Comportamento é controlável; resultado fisiológico não. Premiar o resultado
 * é a definição operacional de como se fabrica ortossonia — e o risco não é
 * teórico: 3–14% da população geral apresenta sinais, e ~23% dos usuários de
 * 18 a 35 anos relatam que apps de sono os deixam estressados com o próprio
 * sono (contra 2,4% acima dos 66). O público deste app está inteiro na faixa
 * de risco.
 *
 * A escolha também é a mais forte cientificamente: no UK Biobank (n=60.977), a
 * REGULARIDADE do sono previu mortalidade melhor que a duração — 20–48% menos
 * mortalidade por todas as causas nos quintis mais regulares, e o efeito
 * sobrevive ao controle por duração. Ou seja: a métrica mais bem embasada é
 * também a única que dá para medir sem sensor nenhum, e a que menos gera
 * ansiedade. É por isso que a Janela de Descanso funciona igual na PWA e no
 * Android, sem Health Connect, sem permissão de saúde e sem dado sensível.
 */
export const DEFAULT_REST_WINDOW = { start: '23:00', end: '07:00' };

/** Tolerância (min) para "entrou na janela". Não é um app de pontualidade. */
export const REST_WINDOW_GRACE_MIN = 45;

/** Janela da média móvel de sono. Mesma lógica dos hábitos: nada zera. */
export const REST_WINDOW_DAYS = 7;

// ---------------------------------------------------------------------------
// Normalização — saves antigos NUNCA podem quebrar
// ---------------------------------------------------------------------------

/**
 * Um `weekDays` antigo lido como `Schedule`.
 *
 * Todo save existente tem `weekDays: number[]` e nenhum tem `schedule`. Esta
 * função é o que permite os dois conviverem sem migração destrutiva: o campo
 * antigo continua sendo escrito para o caso `weekdays` (o desktop e os widgets
 * Android leem ele direto, e nenhum dos dois roda este código), e o campo novo
 * manda quando existe.
 */
export function normalizeSchedule(source: {
  schedule?: Schedule;
  weekDays?: number[];
}): Schedule {
  const s = source.schedule;
  if (s) {
    if (s.kind === 'weekdays' && Array.isArray(s.days)) return s;
    if (s.kind === 'timesPerWeek' && typeof s.target === 'number' && s.target > 0) {
      return { kind: 'timesPerWeek', target: Math.min(7, Math.max(1, Math.round(s.target))) };
    }
    if (s.kind === 'everyNDays' && typeof s.n === 'number' && s.n > 0) {
      return {
        kind: 'everyNDays',
        n: Math.max(1, Math.round(s.n)),
        from: s.from === 'completion' ? 'completion' : 'schedule',
      };
    }
  }
  const days = Array.isArray(source.weekDays) ? source.weekDays : [0, 1, 2, 3, 4, 5, 6];
  return { kind: 'weekdays', days };
}

/**
 * Os dias da semana equivalentes a um `Schedule`.
 *
 * Existe porque o campo `weekDays` continua sendo a interface com o widget
 * Android e com o app de desktop, que não carregam este módulo. Um hábito
 * `timesPerWeek` ou `everyNDays` é elegível todo dia — quem decide se ele
 * *conta hoje* é `habitRhythm`, não o calendário.
 */
export function weekDaysForSchedule(schedule: Schedule): number[] {
  return schedule.kind === 'weekdays' ? schedule.days : [0, 1, 2, 3, 4, 5, 6];
}
