/**
 * BRINCAR, CANSAÇO E "O QUE O PET GOSTARIA AGORA"
 * ==============================================
 *
 * PRINCÍPIO DE DESIGN DESTE ARQUIVO — leia antes de acrescentar qualquer coisa:
 *
 * O Soulmon JÁ tem cocô, energia, banho, dormir e carinho. A decisão de produto
 * é **NÃO ADICIONAR MAIS MEDIDORES**. Cada barra nova é uma cobrança nova, e o
 * contra-exemplo canônico é o Habitica: usuários relatam gastar mais tempo
 * administrando o app do que fazendo os próprios hábitos. O benchmark é
 * inequívoco na outra direção — quem retém (Finch, Pokémon Sleep) tem MENOS
 * sistemas, não mais.
 *
 * A REGRA DE OURO para qualquer parâmetro que entre aqui:
 *
 *   ele precisa **ou ser alimentado por uma tarefa real cumprida, ou gastar um
 *   recurso que veio de tarefa real**.
 *
 * Medidor que sobe e desce sozinho com o tempo é cobrança desacoplada da vida
 * real — e neste app a vida real é o jogo. É por isso que:
 *
 *  - BRINCAR não tem barra de "diversão" que desce. Brincar GASTA energia, e
 *    energia só existe porque alguém comeu, e comida só existe porque alguém
 *    concluiu uma tarefa. O gasto está ancorado em trabalho real.
 *  - CANSAÇO não é campo de save nem barra: é ESTADO DERIVADO do que já existe
 *    (a carga planejada de ontem e a janela de descanso). Nada novo é medido.
 *  - `needsAttention` devolve NO MÁXIMO UM item, porque um painel de pendências
 *    é exatamente o painel de cobranças que este arquivo existe para não criar.
 *
 * Estilo: funções PURAS, como `careRules.ts` e `taskTriage.ts`. Sem React, sem
 * localStorage, `now: Date`/`todayKey` SEMPRE por parâmetro. Genéricas em
 * `<T extends PetNeedsState>` onde escrevem estado, para quem chama passar o
 * `GameState` inteiro e receber ele de volta sem perder campo.
 */

import { getMaxEnergyForStage } from '../types/progression';
import { OVERCOMMIT_EFFORT, isOvercommitted, plannedEffort } from './taskTriage';
import type { PlannedActivity, TriageTask } from './taskTriage';
import { GOOD_CONSTANCY_RATIO, dayKeyOf } from './habitRhythm';
import type { HabitRhythm } from './habitRhythm';
import { restConstancy } from './restWindow';
import type { RestState } from './restWindow';

// Reexportado só como documentação de qual constante define "dia pesado" aqui.
// O DONO continua sendo `types/taskModel.ts` — este arquivo não inventa número.
export { OVERCOMMIT_EFFORT };

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

/**
 * O buff que brincar concede.
 *
 * Modesto de propósito (`PLAY_BUFF_MULTIPLIER`): brincar é OFERTA, não
 * obrigação, e um bônus grande transformaria a oferta em dever diário — a
 * pessoa passaria a "ter que" brincar antes de todo minijogo, que é a definição
 * de mais uma cobrança.
 */
export interface PlayBuff {
  kind: 'minigame';
  /** Multiplicador de Bits do PRÓXIMO minijogo (1.2 = +20%). Sempre ≥ 1. */
  multiplier: number;
  /** ISO — instante em que o buff deixa de valer. */
  expiresAt: string;
  /** Atributo que a brincadeira favoreceu (o galho de evolução). */
  attribute: PlayAttribute;
}

export type PlayAttribute = 'virus' | 'data' | 'vaccine';

/** O registro de persistência (opcional no GameState). */
export interface PlayLog {
  /** dayKey (`new Date().toDateString()`) da última brincadeira. */
  date: string;
  buff?: PlayBuff;
}

/**
 * A fatia do GameState que este módulo lê.
 *
 * TODOS os campos além dos dois primeiros são opcionais: nenhum save existente
 * tem `playLog`, e save antigo que quebra ao abrir é pior do que qualquer coisa
 * que este arquivo entregue.
 */
export interface PetNeedsState {
  energyPoints: number;
  foodInventory: Record<string, number>;
  evolutionStage?: string;
  tasks?: TriageTask[];
  activities?: PlannedActivity[];
  rest?: RestState;
  habitRhythms?: Record<string, HabitRhythm>;
  playLog?: PlayLog;
  /** Há cocô na tela agora (quem decide isso é o sistema de cuidado). */
  hasPoop?: boolean;
  virusPoints?: number;
  dataPoints?: number;
  vaccinePoints?: number;
}

// ---------------------------------------------------------------------------
// 1. BRINCAR — oferta, nunca obrigação
// ---------------------------------------------------------------------------

/**
 * Custo em energia de uma brincadeira.
 *
 * Um, e não mais: energia vem de comida, comida vem de concluir tarefa. Cobrar
 * caro faria brincar competir com o dia perfeito (que exige energia ≥ meta do
 * dia) — o jogo estaria punindo quem aceitou a oferta.
 */
export const PLAY_ENERGY_COST = 1;

/** +20% de Bits no próximo minijogo. Modesto por decisão de produto. */
export const PLAY_BUFF_MULTIPLIER = 1.2;

/** Quanto tempo o buff sobrevive esperando o minijogo (min). */
export const PLAY_BUFF_DURATION_MIN = 60;

/** Pontos de atributo que a brincadeira rende, na categoria do buff. */
export const PLAY_ATTRIBUTE_POINT = 1;

/** Quantas vezes por dia se pode brincar. */
export const PLAY_TIMES_PER_DAY = 1;

const MINUTE_MS = 60 * 1000;

const PLAY_ATTRIBUTES: readonly PlayAttribute[] = ['virus', 'data', 'vaccine'];

/** Hash estável do dia → atributo. Determinístico: o mesmo dia rende o mesmo. */
function attributeForDay(todayKey: string): PlayAttribute {
  let h = 0;
  for (let i = 0; i < todayKey.length; i++) h = (h * 31 + todayKey.charCodeAt(i)) >>> 0;
  return PLAY_ATTRIBUTES[h % PLAY_ATTRIBUTES.length];
}

/** Já brincou hoje? */
export function playedToday(state: PetNeedsState, todayKey: string): boolean {
  return state.playLog?.date === todayKey;
}

/**
 * Pode brincar agora: 1×/dia e energia suficiente.
 *
 * Devolver `false` aqui NÃO é uma punição e não deve virar aviso vermelho na
 * UI: é só a oferta não estar disponível. Quem não brincou não perdeu nada —
 * ver a nota grande em `tiredness` sobre o que brincar nunca pode influenciar.
 */
export function canPlay(state: PetNeedsState, todayKey: string): boolean {
  if (playedToday(state, todayKey)) return false;
  return (state.energyPoints ?? 0) >= PLAY_ENERGY_COST;
}

export type PlayRefusal = 'already-played' | 'no-energy';

/**
 * BRINCAR.
 *
 * Consome `PLAY_ENERGY_COST` de energia e concede um buff temporário para o
 * PRÓXIMO minijogo, mais um ponto de atributo da categoria do buff.
 *
 * ⚠️ REGRA QUE NÃO PODE SER QUEBRADA: brincar **NUNCA** pode ser condição de
 * dia perfeito, de HP ou de evolução. No instante em que qualquer um desses
 * três olhar para `playLog`, a oferta vira obrigação diária — mais uma barra
 * para administrar, exatamente o defeito do Habitica que este arquivo existe
 * para não repetir. Brincar só pode SOMAR (Bits do minijogo, um ponto de
 * atributo); nunca subtrair de nada além da energia que o próprio jogador
 * escolheu gastar.
 *
 * Idempotente por `todayKey`: chamar duas vezes no mesmo dia não cobra energia
 * duas vezes nem renova o buff — a segunda chamada devolve o estado intacto com
 * `refused: 'already-played'`.
 */
export function play<T extends PetNeedsState>(
  state: T,
  todayKey: string,
  now: Date = new Date(),
): { state: T; buff?: PlayBuff; refused?: PlayRefusal } {
  if (playedToday(state, todayKey)) return { state, refused: 'already-played' };
  if ((state.energyPoints ?? 0) < PLAY_ENERGY_COST) return { state, refused: 'no-energy' };

  const attribute = attributeForDay(todayKey);
  const buff: PlayBuff = {
    kind: 'minigame',
    multiplier: PLAY_BUFF_MULTIPLIER,
    expiresAt: new Date(now.getTime() + PLAY_BUFF_DURATION_MIN * MINUTE_MS).toISOString(),
    attribute,
  };

  const attrKey = `${attribute}Points` as 'virusPoints' | 'dataPoints' | 'vaccinePoints';

  return {
    buff,
    state: {
      ...state,
      energyPoints: Math.max(0, (state.energyPoints ?? 0) - PLAY_ENERGY_COST),
      [attrKey]: (state[attrKey] ?? 0) + PLAY_ATTRIBUTE_POINT,
      playLog: { date: todayKey, buff },
    },
  };
}

/** O buff ainda válido, ou `null`. Buff vencido simplesmente não existe mais. */
export function activeBuff(state: PetNeedsState, now: Date): PlayBuff | null {
  const buff = state.playLog?.buff;
  if (!buff) return null;
  const at = new Date(buff.expiresAt);
  if (Number.isNaN(at.getTime()) || at.getTime() <= now.getTime()) return null;
  return buff;
}

/**
 * O multiplicador a aplicar nos Bits do minijogo. **Sempre ≥ 1** — esta função
 * não tem como devolver penalidade, e isso é regra, não detalhe.
 */
export function minigameMultiplier(state: PetNeedsState, now: Date): number {
  return activeBuff(state, now)?.multiplier ?? 1;
}

/** Gasta o buff (o minijogo aconteceu). Mantém `playLog.date` — 1×/dia continua valendo. */
export function consumeBuff<T extends PetNeedsState>(state: T): T {
  if (!state.playLog?.buff) return state;
  return { ...state, playLog: { date: state.playLog.date } };
}

// ---------------------------------------------------------------------------
// 2. CANSAÇO DERIVADO — estado calculado, nunca campo de save, nunca barra
// ---------------------------------------------------------------------------

export type TirednessLevel = 'rested' | 'normal' | 'tired';

/**
 * O quanto o pet parece cansado.
 *
 * DERIVADO, sempre. Não existe `tiredness` no GameState e não pode passar a
 * existir: no instante em que virar campo persistido, ele vira uma barra que
 * sobe e desce sozinha — cobrança desacoplada da vida real, que é justamente o
 * que a regra de ouro deste arquivo proíbe. As duas entradas já existem:
 *
 *  - a CARGA PLANEJADA DE ONTEM (`plannedEffort` acima de `OVERCOMMIT_EFFORT`);
 *  - a NOITE (a janela de descanso que o próprio usuário escolheu).
 *
 * ⚠️ O EFEITO É **APENAS COSMÉTICO/NARRATIVO**. O pet aparece sonolento — um
 * espelho do dono, e nada além disso. Cansaço **NÃO PODE**:
 *   · reduzir recompensa (Bits, comida, atributo, multiplicador);
 *   · travar ação nenhuma (brincar, minijogo, masmorra, concluir tarefa);
 *   · entrar em dia perfeito, HP ou evolução.
 *
 * O motivo é o desenho inteiro do produto: quem aparece 'tired' é exatamente
 * quem trabalhou demais ou dormiu fora de hora. Se o jogo reduzisse a
 * recompensa dessa pessoa, ele estaria punindo quem mais precisa de acolhimento
 * — e o Soulmon é um avatar que encoraja, nunca um cobrador. O pet sonolento
 * existe para a pessoa se VER, não para pagar por isso.
 */
export function tiredness(state: PetNeedsState, now: Date): TirednessLevel {
  const yesterday = new Date(now.getTime());
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dayKeyOf(yesterday);

  const overloaded = isOvercommitted(
    plannedEffort(state.tasks ?? [], state.activities ?? [], yesterdayKey),
  );

  const rest = state.rest;
  const todayKey = dayKeyOf(now);
  const lastNight = rest?.nights.find(n => n.date === todayKey);
  const badNight = !!lastNight && !lastNight.onTime;

  if (overloaded || badNight) return 'tired';

  // 'rested' pede boa constância REGISTRADA. Sem registro nenhum a resposta é
  // 'normal': noite sem registro é NEUTRA (regra de `restWindow`), então ela
  // não vira elogio nem cobrança.
  if (rest) {
    const c = restConstancy(rest, now);
    if (c.window > 0 && c.ratio >= GOOD_CONSTANCY_RATIO) return 'rested';
  }

  return 'normal';
}

/**
 * A fala do pet sobre o próprio sono. Curta, fofa e **sem emoji** — o `speak()`
 * do app remove emoji das frases faladas.
 *
 * Nenhuma variante cobra, avisa ou sugere que algo foi perdido: 'tired' é
 * cumplicidade ("a gente descansa junto"), não diagnóstico.
 */
export function tirednessMessage(level: TirednessLevel, language: string): string {
  const pt = language === 'pt-BR';
  switch (level) {
    case 'rested':
      return pt ? 'Dormi tão bem! Que dia bonito pra gente.' : 'I slept so well! What a nice day for us.';
    case 'tired':
      return pt ? 'Que dia cheio, hein? A gente descansa junto.' : 'Busy day, huh? Let us rest together.';
    default:
      return pt ? 'To do jeitinho de sempre, pertinho de voce.' : 'Same as always, right here with you.';
  }
}

// ---------------------------------------------------------------------------
// 3. UMA sugestão de cada vez
// ---------------------------------------------------------------------------

export type PetWishKind = 'shower' | 'play' | 'feed';

export interface PetWish {
  kind: PetWishKind;
  /** Inglês é a base; PT-BR é localização (CLAUDE.md). */
  en: string;
  pt: string;
}

/** Abaixo desta fração da energia máxima, comer é uma boa ideia. */
export const LOW_ENERGY_RATIO = 0.5;

/**
 * O que o pet gostaria agora — **no máximo UM item**.
 *
 * O teto de um é a regra, não uma otimização de layout. Uma lista de três
 * desejos é um painel de pendências, e painel de pendências é o Habitica: a
 * pessoa abre o app e encontra uma fatura. Um convite de cada vez é o Finch.
 *
 * Devolve array (e não um único valor) só para a UI poder tratar "nada a
 * sugerir" sem `null` espalhado — e o array vazio é um resultado perfeitamente
 * bom: um pet que não quer nada agora é um pet feliz, não um bug.
 *
 * Ordem: banho (cocô tem consequência real de HP e é o único com prazo) →
 * brincar (a oferta) → comida (só se HÁ estoque, isto é, só se o jogador já
 * concluiu tarefa; sugerir comer sem estoque seria cobrar tarefa por tabela).
 *
 * NENHUM item aqui é obrigação, nenhum tem contador e nenhum vira penalidade se
 * for ignorado.
 */
export function needsAttention(state: PetNeedsState, now: Date): PetWish[] {
  if (state.hasPoop) {
    return [{
      kind: 'shower',
      en: 'A quick shower would feel great.',
      pt: 'Um banhinho cairia super bem.',
    }];
  }

  if (canPlay(state, dayKeyOf(now))) {
    return [{
      kind: 'play',
      en: 'Want to play for a bit?',
      pt: 'Vamos brincar um pouquinho?',
    }];
  }

  const stock = Object.values(state.foodInventory ?? {}).reduce((s, n) => s + (n ?? 0), 0);
  const maxEnergy = getMaxEnergyForStage(state.evolutionStage ?? '');
  if (stock > 0 && (state.energyPoints ?? 0) < maxEnergy * LOW_ENERGY_RATIO) {
    return [{
      kind: 'feed',
      en: 'I am a little hungry, if you feel like it.',
      pt: 'To com uma fominha, se voce quiser.',
    }];
  }

  return [];
}
