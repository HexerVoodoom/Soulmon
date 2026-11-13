/**
 * SOULMON DORMINDO NÃO VAI A ATIVIDADE (13/11/2026, pedido do dono — REGISTRO §329).
 *
 * Com o Soulmon dormindo, COMEÇAR uma atividade que precisa dele não acontece direto: abre a pergunta "Seu Soulmon está dormindo.
 * Quer acordá-lo?" com "Acordar" (acorda pelo gesto de sempre e segue para o que foi tocado) e "Agora não" (fecha e fica).
 *
 * ONDE a pergunta mora (emenda do dono, 13/11/2026): no gesto que LEVA o Soulmon, não na porta. Duas listas de prédio:
 *  - `SLEEP_BLOCKED_LOTS`: a ENTRADA já é a atividade (o Calabouço abre o mapa da incursão em tela cheia) — pergunta ao tocar o prédio;
 *  - `SLEEP_ACTION_LOTS`: a folha tem parte de leitura (ranking, oponentes, sala do clã, bosque, quadro de foco, missões do passeio).
 *    Entrar e olhar são livres; só o botão de LUTAR/AGIR pergunta — e pergunta na hora do toque, então o sono automático que chega
 *    com a folha aberta também é visto.
 * Olhar não para: Home, Mapa, áreas, lojas, Biblioteca, Laboratório (a Vesca), Forja de equipar, a Hexsmith e o Refúgio seguem livres.
 *
 * "Dormindo" = o que a Home desenha dormindo: o sono REAL (`isSleeping`: gesto, sono automático) OU o Soulmon à espera do
 * "Acordar" do início de dia (`dayWakePending`, §110). Acordar é o MESMO gesto do deck (`handleSleep` no `App`); este módulo
 * não cria custo nem penalidade — só diz a verdade sobre o que o sono real já faz (`hunger.ts` › `SLEEP_ENERGY_REGEN_BONUS`,
 * `poopDrain.ts`, `useCareSystem.ts`).
 *
 * Módulo PURO: o `App` e o `components/WakeToEnter.tsx` só delegam. Mesmo desenho do cristal da evolução
 * (`evolutionCrystal.ts` › `CRYSTAL_BLOCKED_LOTS`): as listas moram aqui; quem tem o botão só chama o gancho com a entrada.
 */
import { WAKE_BLOCKED_GAMES } from './dayWake';

/** Prédios (`área.lote`) cuja ENTRADA já é a atividade com o Soulmon: tocar o prédio pergunta. Mudar esta lista é decisão do dono. */
export const SLEEP_BLOCKED_LOTS: readonly string[] = [
  'exploracao.dungeon', // Calabouço (rogue): o toque abre direto o mapa da incursão em tela cheia, sem folha de leitura
];

/**
 * Prédios cuja folha tem parte de LEITURA: entrar é livre; o botão de lutar/agir dentro dela pergunta (chamando o gancho com
 * esta mesma `área.lote`). Mudar esta lista é decisão do dono.
 */
export const SLEEP_ACTION_LOTS: readonly string[] = [
  'arena.duelo',        // Arena livre: ver oponentes e sortear é livre; "Lutar" (`DueloSheet` › onStart) pergunta
  'arena.torneio',      // Torneio: ranking, histórico e molduras livres; lutar, treinar e o desgarrado (`TournamentPage`) perguntam
  'arena.guerra',       // Guerra de clãs: ver a guerra é livre; "Buscar guerra" (`GuildSheet` › SalaGuerra) pergunta
  'exploracao.fenda',   // Fenda Sem Fim: a folha é livre; "Descer" é o jogo `masmorra` (`SLEEP_BLOCKED_GAMES`). O Pesadelo da noite já não abre dormindo (`nightmareWake.ts`)
  'exploracao.passeio', // Passeio: ver missões e o registro é livre; escolher a missão (mandar o Soulmon) pergunta; "Fiz" é da pessoa e nunca para
  'forja.oficina',      // Oficina do Foco: cards, chaves e concluir tarefa são livres (G-01); "Começar jornada" pergunta
  'hall.feira',         // Feira do Chefe: ler a sala e colher o prêmio é livre; a rodada do chefe pergunta (a missão, por `missao`)
  'hall.grove',         // Grove do clã: ver o bosque e colher é livre; plantar, cuidar e lutar na defesa perguntam
];

/** Ações que não são prédio e também levam o Soulmon (o gesto que manda, não a tela que mostra). */
export const SLEEP_BLOCKED_ACTIONS = ['treino', 'missao'] as const;

/**
 * O que NUNCA pergunta, mesmo com o Soulmon dormindo (contrato; os testes conferem que nenhum destes devolve `true`).
 * Ler e olhar é livre; tarefa/hábito nunca param (G-01, §96); o Refúgio é para momentos difíceis e não pontua.
 */
export const SLEEP_NEVER_BLOCKED: readonly string[] = [
  'home', 'mapa',
  'mercado.itens', 'mercado.conquistas', 'mercado.decoracao', 'mercado.background', 'mercado.restaurante', 'mercado.cambista',
  'forja.ferreiro', 'forja.hexsmith', 'forja.caderno', 'forja.refugio',
  'jogos.salao', 'jogos.mente', // a folha (ler, comprar rodada) é livre; o JOGO pergunta (`SLEEP_BLOCKED_GAMES`)
  'laboratorio.evolucao', 'laboratorio.pet', 'laboratorio.stats', 'laboratorio.perfil', 'laboratorio.biblioteca', 'laboratorio.amigos',
  'hall.guilda', // a sala do clã é leitura (a missão é mandada na Feira, `missao`)
  'respiracao', 'bolhas-calmas', 'chama',
  'completeTask', 'completeHabit', 'focusTask',
];

/** Os jogos que perguntam: a mesma lista dos jogos parados até o "Acordar" do dia (§112), sem cópia. */
export const SLEEP_BLOCKED_GAMES: readonly string[] = WAKE_BLOCKED_GAMES;

/** Uma entrada que pode perguntar: `área.lote`, id de jogo (`PlayGame`) ou uma das `SLEEP_BLOCKED_ACTIONS`. */
export type WakeEntry = string;

export interface SleepSignals {
  /** Sono real (`isSleeping`). */
  isSleeping: boolean;
  /** À espera do "Acordar" do início do dia (`dayWakePending`). */
  dayWakePending: boolean;
}

/** O Soulmon está dormindo (o que a Home desenha)? */
export function isAsleep(s: SleepSignals): boolean {
  return !!s.isSleeping || !!s.dayWakePending;
}

/** Esta entrada precisa do Soulmon acordado? (independe do estado; `needsWakeToEnter` junta os dois). */
export function entryNeedsSoulmon(entry: WakeEntry): boolean {
  if (SLEEP_NEVER_BLOCKED.includes(entry)) return false;
  return SLEEP_BLOCKED_LOTS.includes(entry)
    || SLEEP_ACTION_LOTS.includes(entry)
    || SLEEP_BLOCKED_GAMES.includes(entry)
    || (SLEEP_BLOCKED_ACTIONS as readonly string[]).includes(entry);
}

/** Verdadeiro = não entra direto: pergunta se quer acordar. */
export function needsWakeToEnter(entry: WakeEntry, s: SleepSignals): boolean {
  return isAsleep(s) && entryNeedsSoulmon(entry);
}

/** Tocar o PRÉDIO `área.lote` já é a atividade (pergunta na porta)? Os de `SLEEP_ACTION_LOTS` entram livres. */
export function lotEntryAsks(entry: WakeEntry): boolean {
  return SLEEP_BLOCKED_LOTS.includes(entry) && !SLEEP_NEVER_BLOCKED.includes(entry);
}

/** Atalho do `AreaView`: tocar o lote `área.lote` pergunta com o Soulmon dormindo? */
export function sleepBlocksLot(area: string, lotId: string | null | undefined, s: SleepSignals): boolean {
  return !!lotId && isAsleep(s) && lotEntryAsks(`${area}.${lotId}`);
}

export interface WakePromptCopy {
  title: string;
  question: string;
  /** O que acordar muda, dito com verdade. Só no sono REAL (acordar do início de dia não muda nada). `null` = nada a dizer. */
  effect: string | null;
  wake: string;
  later: string;
}

/**
 * A pergunta. Sem culpa, sem veredito, sem contagem: diz o estado e oferece o gesto.
 * `realSleep`: o sono REAL — aí acordar tem efeito de verdade (a energia deixa de recarregar no ritmo do sono e a borra volta a
 * poder aparecer), e a pergunta diz isso. Não existe outra consequência nas regras (a noite fica registrada como sempre).
 */
export function wakePromptCopy(isPt: boolean, realSleep: boolean): WakePromptCopy {
  return isPt
    ? {
      title: 'Dormindo',
      question: 'Seu Soulmon está dormindo. Quer acordá-lo?',
      effect: realSleep ? 'Dormindo, a energia recarrega mais rápido e a borra não aparece. Acordado, tudo volta ao ritmo de sempre.' : null,
      wake: 'Acordar',
      later: 'Agora não',
    }
    : {
      title: 'Sleeping',
      question: 'Your Soulmon is sleeping. Want to wake it up?',
      effect: realSleep ? 'While asleep, energy recharges faster and no mess shows up. Awake, everything goes back to its usual pace.' : null,
      wake: 'Wake up',
      later: 'Not now',
    };
}
