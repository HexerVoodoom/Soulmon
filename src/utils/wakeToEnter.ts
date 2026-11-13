/**
 * SOULMON DORMINDO NÃO VAI A ATIVIDADE (13/11/2026, pedido do dono — REGISTRO §329).
 *
 * Com o Soulmon dormindo, ENTRAR numa atividade que precisa dele (Arena, Fenda, Calabouço, Passeio, Oficina do Foco, Feira,
 * Grove, Guerra, minijogos, treino com amigo, missão da guilda) não acontece direto: abre a pergunta "Seu Soulmon está dormindo.
 * Quer acordá-lo?" com "Acordar" (acorda pelo gesto de sempre e segue para a atividade escolhida) e "Agora não" (fecha e fica).
 * Olhar não para: Home, Mapa, áreas, lojas, Biblioteca, Laboratório, Forja de equipar e o Refúgio seguem livres.
 *
 * "Dormindo" = o que a Home desenha dormindo: o sono REAL (`isSleeping`: gesto, sono automático) OU o Soulmon à espera do
 * "Acordar" do início de dia (`dayWakePending`, §110). Acordar é o MESMO gesto do deck (`handleSleep` no `App`); este módulo
 * não cria custo nem penalidade — só diz a verdade sobre o que o sono real já faz (`hunger.ts` › `SLEEP_ENERGY_REGEN_BONUS`,
 * `poopDrain.ts`, `useCareSystem.ts`).
 *
 * Módulo PURO: o `App` e o `components/WakeToEnter.tsx` só delegam. Mesmo desenho do cristal da evolução
 * (`evolutionCrystal.ts` › `CRYSTAL_BLOCKED_LOTS`): a lista mora aqui e o portão vale na ENTRADA.
 */
import { WAKE_BLOCKED_GAMES } from './dayWake';

/** Prédios (`área.lote`) cuja ENTRADA é a atividade com o Soulmon. Mudar esta lista é decisão do dono. */
export const SLEEP_BLOCKED_LOTS: readonly string[] = [
  'arena.duelo',        // Arena livre
  'arena.torneio',      // Torneio
  'arena.guerra',       // Guerra de clãs
  'exploracao.fenda',   // Fenda Sem Fim (e o Pesadelo da noite: já não abre com ele dormindo, `nightmareWake.ts`)
  'exploracao.dungeon', // Calabouço (rogue)
  'exploracao.passeio', // Passeio
  'forja.oficina',      // Oficina do Foco e a Jornada
  'hall.feira',         // Feira do Chefe (raid da guilda) e a missão
  'hall.grove',         // Grove do clã
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
  'hall.guilda', // a sala é leitura; MANDAR o Soulmon na missão pergunta (`missao`)
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
    || SLEEP_BLOCKED_GAMES.includes(entry)
    || (SLEEP_BLOCKED_ACTIONS as readonly string[]).includes(entry);
}

/** Verdadeiro = não entra direto: pergunta se quer acordar. */
export function needsWakeToEnter(entry: WakeEntry, s: SleepSignals): boolean {
  return isAsleep(s) && entryNeedsSoulmon(entry);
}

/** Atalho do `AreaView`: o lote `área.lote` pergunta com o Soulmon dormindo? */
export function sleepBlocksLot(area: string, lotId: string | null | undefined, s: SleepSignals): boolean {
  return !!lotId && needsWakeToEnter(`${area}.${lotId}`, s);
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
