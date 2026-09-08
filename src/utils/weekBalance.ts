/**
 * "EQUILIBRAR MINHA SEMANA" — P4 do `product/soulmon-01/balance/carga-diaria.md`
 * ============================================================================
 *
 * Vem do teste com usuários do dono, queixa 2: *"tenho preguiça de planejar"*.
 * A pesquisa do documento foi conclusiva e é o que dita o desenho aqui:
 * **ninguém planeja a semana num app de hábito.** Nenhum dos benchmarks resolve
 * isso com um planejador; todos resolvem tirando o planejamento do caminho.
 *
 * Então isto NÃO é um planejador. É uma proposta de um toque, que a pessoa
 * aceita ou recusa.
 *
 * ## As duas invariantes, e por que elas mandam
 *
 * **1. A FREQUÊNCIA de cada atividade é sagrada.** Se um hábito acontece 3× por
 *    semana, ele continua acontecendo 3× por semana — muda QUAIS dias, nunca
 *    QUANTOS. Redistribuir mexendo na frequência seria o app decidindo quanto a
 *    pessoa se exercita, e aí não é mais a meta dela. É o oposto da autonomia
 *    que sustenta a motivação intrínseca (SDT), e o mesmo motivo pelo qual esta
 *    função **nunca roda sozinha**: quem chama tem que mostrar o antes/depois e
 *    pedir confirmação.
 *
 * **2. Nenhuma regra do jogo é tocada.** Esta é a proposta da lista que não
 *    mexe em `CLAUDE.md` nenhum: não altera HP, meta, dia perfeito nem
 *    evolução. Ela só reorganiza `Schedule.kind === 'weekdays'`.
 *
 * ## O que ela NÃO toca, de propósito
 *
 * `timesPerWeek` e `everyNDays` ficam de fora. Os dois já carregam perdão
 * embutido — no `timesPerWeek` quem julga é `weeklyProgress` e não o
 * calendário; no `everyNDays` com `from: 'completion'` é estruturalmente
 * impossível acumular atrasadas. Redistribuir dias fixos para eles seria
 * *tirar* essa flexibilidade em nome de equilíbrio, o que piora o que já
 * estava bom.
 *
 * ## Determinística de propósito
 *
 * Mesma entrada, mesma proposta — sempre. Uma sugestão que muda a cada toque
 * ensina a pessoa a apertar de novo até gostar do resultado, e isso é um
 * sorteio disfarçado de ajuda. Ordenação estável por (frequência desc, id) e
 * distribuição gulosa pelo dia mais vazio, com empate resolvido pelo dia de
 * índice menor.
 */

/** Domingo = 0, como `Date.getDay()` e como `Schedule.days` já usa. */
export const DIAS_DA_SEMANA = [0, 1, 2, 3, 4, 5, 6] as const;

export interface AtividadeSemanal {
  id: string;
  /** Dias em que ela acontece hoje. */
  days: number[];
}

export interface PropostaDeEquilibrio {
  /** As atividades com os dias NOVOS. Só entram as que realmente mudaram. */
  mudancas: AtividadeSemanal[];
  /** Contagem por dia antes e depois — é o que a tela de confirmação mostra. */
  antes: number[];
  depois: number[];
  /** O maior número de itens num único dia, antes e depois. */
  picoAntes: number;
  picoDepois: number;
  /**
   * `false` quando a carga total não cabe em `7 × teto`. A proposta continua
   * sendo a melhor possível — espalhar ajuda mesmo sem resolver —, e quem
   * chama precisa dizer a verdade em vez de prometer o que não entrega.
   */
  cabe: boolean;
}

/** Quantos itens caem em cada dia da semana. */
export function contarPorDia(atividades: AtividadeSemanal[]): number[] {
  const contagem = [0, 0, 0, 0, 0, 0, 0];
  for (const a of atividades) {
    for (const d of a.days) {
      if (Number.isInteger(d) && d >= 0 && d <= 6) contagem[d] += 1;
    }
  }
  return contagem;
}

/** Dias válidos, sem repetição, em ordem — entrada vinda do save não é confiável. */
function diasLimpos(days: unknown): number[] {
  if (!Array.isArray(days)) return [];
  const vistos = new Set<number>();
  for (const d of days) {
    if (Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6) vistos.add(d as number);
  }
  return [...vistos].sort((a, b) => a - b);
}

/**
 * Propõe uma semana mais plana.
 *
 * @param atividades só as de `kind: 'weekdays'` — ver o cabeçalho.
 * @param teto       itens por dia que não se quer ultrapassar. Quem chama passa
 *                   o `required` do estágio; o número não é decidido aqui, para
 *                   a escada de `FORM_REQUIREMENTS` continuar tendo um dono só.
 */
export function equilibrarSemana(
  atividades: AtividadeSemanal[],
  teto: number,
): PropostaDeEquilibrio {
  const limpas = atividades
    .map(a => ({ id: a.id, days: diasLimpos(a.days) }))
    .filter(a => a.days.length > 0);

  const antes = contarPorDia(limpas);
  const total = limpas.reduce((s, a) => s + a.days.length, 0);
  const tetoUtil = Math.max(1, Math.floor(teto));
  const cabe = total <= tetoUtil * 7;

  // Mais frequentes primeiro: elas têm menos liberdade de encaixe, e deixá-las
  // para o fim é o que produz um último item com sobra em cima de um dia só.
  // `id` desempata para a proposta ser a mesma em toda execução.
  const ordenadas = [...limpas].sort(
    (a, b) => b.days.length - a.days.length || a.id.localeCompare(b.id),
  );

  const carga = [0, 0, 0, 0, 0, 0, 0];
  const novas = new Map<string, number[]>();

  for (const a of ordenadas) {
    const quantos = a.days.length;
    // Uma atividade de 7 dias não tem o que redistribuir: fica como está.
    if (quantos >= 7) {
      novas.set(a.id, [...DIAS_DA_SEMANA]);
      for (const d of DIAS_DA_SEMANA) carga[d] += 1;
      continue;
    }
    // Escolhe os `quantos` dias mais vazios. Empate pelo dia de índice menor,
    // e — entre dias igualmente vazios — prefere um dia que a atividade JÁ
    // usava: mexer menos na semana da pessoa é sempre melhor.
    const jaUsava = new Set(a.days);
    const escolhidos = [...DIAS_DA_SEMANA]
      .sort((x, y) => (
        carga[x] - carga[y]
        || (jaUsava.has(y) ? 1 : 0) - (jaUsava.has(x) ? 1 : 0)
        || x - y
      ))
      .slice(0, quantos)
      .sort((x, y) => x - y);
    novas.set(a.id, escolhidos);
    for (const d of escolhidos) carga[d] += 1;
  }

  const mudancas: AtividadeSemanal[] = [];
  for (const a of limpas) {
    const proposto = novas.get(a.id) ?? a.days;
    const igual = proposto.length === a.days.length
      && proposto.every((d, i) => d === a.days[i]);
    if (!igual) mudancas.push({ id: a.id, days: proposto });
  }

  return {
    mudancas,
    antes,
    depois: carga,
    picoAntes: Math.max(...antes),
    picoDepois: Math.max(...carga),
    cabe,
  };
}

/**
 * Vale a pena oferecer o botão?
 *
 * Oferecer "equilibrar" para quem já está equilibrado é ruído — e pior, sugere
 * que há algo errado quando não há. Só aparece quando existe pelo menos um dia
 * acima do teto E a proposta realmente melhora o pico.
 */
export function valeEquilibrar(proposta: PropostaDeEquilibrio, teto: number): boolean {
  return proposta.picoAntes > Math.max(1, Math.floor(teto))
    && proposta.picoDepois < proposta.picoAntes
    && proposta.mudancas.length > 0;
}
