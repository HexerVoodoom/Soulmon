import { describe, it, expect } from 'vitest';
import {
  createRestState,
  recordNight,
  restConstancy,
  dreamRarity,
  morningKey,
  RARITY_MIN_NIGHTS,
  type RestState,
  type RestNight,
} from './restWindow';
import {
  nightmareDayKey,
  nightmaresFor,
  hasPendingNightmare,
  pendingNightmare,
  markFought,
  createNightmareState,
  NIGHTMARES_PER_NIGHT,
} from './nightmares';
import { REST_WINDOW_DAYS } from '../types/taskModel';
import { playerDayKey, deviceOffsetMs, type PlayerDayAnchor } from './playerDay';

/**
 * A NOITE — o SEXTO e o SÉTIMO irmãos da família do dia-do-aparelho.
 * ================================================================
 *
 * Mesma família de `careCaps.rubHeal`, `lastCheckInDate`, `moodLog`,
 * `poopDrainCharge` (b8296e0b) e `playLog` (4ef33d89): um registro diário que
 * MORA NO SAVE e cuja chave de dia saía de `toDateString()` — o dia do
 * APARELHO. Só que aqui o defeito tem uma cara própria, e ela importa:
 *
 * ═══ `nightmares` — fura na direção de NEGAR ═══
 *
 * O portão de `nightmaresFor` é `rest.nights.find(n => n.date === key)`, e
 * `NIGHTMARES_PER_NIGHT` é 1. Não existe o furo "ganhou dois": o segundo
 * aparelho não acha noite nenhuma com o nome do dia DELE, então ele **perde**
 * o pesadelo que a noite gravada pelo primeiro rendeu. Uma recompensa que some
 * sem gesto nenhum que a recupere é pior que um teto vazando: não há nada que
 * o jogador possa fazer, e a mecânica parece quebrada exatamente para quem
 * cumpriu a regra. Num arquivo cuja tese é NUNCA punir sono, é o pior lado
 * possível de errar.
 *
 * ═══ `restWindow` — a noite é INSTANTE, o nome dela era do aparelho ═══
 *
 * `sleptAt`/`wokeAt` são ISO absolutos: instante não tem fuso. O NOME da manhã
 * (`morningKey`) saía de `toDateString()`, então dois aparelhos batizam a MESMA
 * noite com duas manhãs — e a idempotência de `recordNight`, que é POR dayKey,
 * não alcança a segunda. Uma noite, dois registros: o denominador de
 * `restConstancy` conta duas vezes, e é essa razão que decide raridade de sonho
 * e tier de pesadelo.
 *
 * ═══ A técnica ═══
 *
 * Nenhum teste aqui mexe no `TZ` do processo — a mesma materialização de
 * `careCaps.fuso.test.ts` e `petNeeds.fuso.test.ts`. O instante é construído em
 * hora LOCAL e a âncora é o offset DESTE aparelho mais 13h; assim, em qualquer
 * máquina do mundo, o dia do JOGADOR é o dia SEGUINTE ao dia do APARELHO. O
 * segundo aparelho, materializado sem sair do processo.
 */

/** Acordou ao meio-dia LOCAL: longe da meia-noite dos dois lados. */
const ACORDOU = new Date(2026, 7, 26, 12, 0, 0);
/** Deitou de madrugada, dentro da janela padrão (23:00–07:00). */
const DEITOU = new Date(2026, 7, 26, 4, 0, 0);
/** A âncora do save: 13h à frente deste aparelho. Fixa, e viaja no save. */
const ANCORA: PlayerDayAnchor = { offsetMs: deviceOffsetMs(ACORDOU) + 13 * 3600000 };

/** O dia do JOGADOR desta manhã (o que o save deve gravar). */
const DIA_JOGADOR = playerDayKey(ACORDOU, ANCORA);
/** O dia do APARELHO na mesma manhã (o que o código gravava). */
const DIA_APARELHO = ACORDOU.toDateString();

/** Um `RestState` ancorado, com as noites já carimbadas. */
function descanso(nights: RestNight[] = [], anchor?: PlayerDayAnchor): RestState {
  // Sem default: passar `undefined` de propósito É o caso do save não migrado,
  // e um parâmetro com valor padrão engoliria justamente esse caso.
  return { ...createRestState(), nights, ...(anchor ? { playerDayTz: anchor } : {}) };
}

/** A chave do jogador de `i` dias atrás. */
function diasAtras(i: number): string {
  const d = new Date(ACORDOU.getTime());
  d.setDate(d.getDate() - i);
  return playerDayKey(d, ANCORA);
}

/** O mesmo instante de `i` dias atrás — para gravar noites de verdade. */
function instante(base: Date, i: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() - i);
  return d;
}

/** A chave do APARELHO de `i` dias atrás — a régua VELHA, a que já está gravada. */
function diasAtrasAparelho(i: number): string {
  const d = new Date(ACORDOU.getTime());
  d.setDate(d.getDate() - i);
  return d.toDateString();
}

describe('o cenário existe: os dois aparelhos discordam do nome da manhã', () => {
  it('o dia do jogador e o dia do aparelho são strings diferentes neste instante', () => {
    expect(DIA_JOGADOR).not.toBe(DIA_APARELHO);
  });

  it('o pesadelo é de UM por noite — não há furo "ganhou dois" a defender aqui', () => {
    expect(NIGHTMARES_PER_NIGHT).toBe(1);
  });
});

describe('nightmares: a noite gravada pelo outro aparelho NÃO some', () => {
  /* O gesto real: o celular gravou a noite ao acordar, com a chave do JOGADOR.
     O tablet do outro fuso abre o mesmo save, no mesmo instante, e pergunta ao
     módulo puro "há pesadelo esta manhã?". */
  const rest = descanso([{ date: DIA_JOGADOR, onTime: true }], ANCORA);

  it('a manhã do jogador rende o pesadelo, lida de qualquer aparelho', () => {
    expect(
      nightmaresFor(rest, ACORDOU).count,
      'o segundo aparelho não achou a noite: a luta da manhã sumiu sem motivo',
    ).toBe(NIGHTMARES_PER_NIGHT);
  });

  it('o pesadelo fica PENDENTE, que é o que abre o modal da manhã', () => {
    expect(hasPendingNightmare(createNightmareState(), rest, ACORDOU)).toBe(true);
    expect(pendingNightmare(createNightmareState(), rest, ACORDOU)).toBe(DIA_JOGADOR);
  });

  it('a chave da ESCRITA e a do PORTÃO batem — senão o modal reabre para sempre', () => {
    // `markFought` carimba o que `nightmareDayKey` devolve; `hasPendingNightmare`
    // pergunta pelo mesmo nome. Se as duas réguas se desencontrassem, fechar a
    // luta não a fecharia: o pesadelo voltaria à próxima abertura, para sempre.
    const chave = nightmareDayKey(ACORDOU, rest.playerDayTz);
    expect(chave).toBe(DIA_JOGADOR);
    const depois = markFought(createNightmareState(), chave);
    expect(hasPendingNightmare(depois, rest, ACORDOU)).toBe(false);
  });

  it('noite sem registro segue NEUTRA: nenhum pesadelo, nenhuma perda', () => {
    expect(nightmaresFor(descanso([], ANCORA), ACORDOU).count).toBe(0);
    expect(hasPendingNightmare(createNightmareState(), descanso([], ANCORA), ACORDOU)).toBe(false);
  });
});

describe('restWindow: uma noite, um registro — o nome vem do INSTANTE', () => {
  it('a manhã é nomeada no dia do JOGADOR, não no de quem segurava o celular', () => {
    const s = recordNight(descanso([], ANCORA), DEITOU, ACORDOU);
    expect(s.nights).toHaveLength(1);
    expect(s.nights[0].date).toBe(DIA_JOGADOR);
  });

  it('`morningKey` aceita a âncora e concorda com a chave do jogador', () => {
    expect(morningKey(DEITOU, ACORDOU, ANCORA)).toBe(DIA_JOGADOR);
  });

  it('o outro aparelho REGRAVA a mesma noite e continua havendo UMA', () => {
    // O defeito: o aparelho B batizava a mesma noite com outra manhã, e a
    // idempotência de `recordNight` — que é POR dayKey — não a alcançava. Duas
    // entradas para uma noite só, e o denominador de `restConstancy` contando
    // a mesma noite duas vezes.
    const primeiro = recordNight(descanso([], ANCORA), DEITOU, ACORDOU);
    const segundo = recordNight(primeiro, DEITOU, ACORDOU);
    expect(
      segundo.nights,
      'a mesma noite virou dois registros: a razão de regularidade está distorcida',
    ).toHaveLength(1);
  });

  it('a noite carimbada pelo jogador entra na janela de `restConstancy`', () => {
    const nights = Array.from({ length: REST_WINDOW_DAYS }, (_, i) => ({
      date: diasAtras(i),
      onTime: true,
    }));
    const c = restConstancy(descanso(nights, ANCORA), ACORDOU);
    expect(c.window, 'as noites do save ficaram invisíveis para este aparelho').toBe(REST_WINDOW_DAYS);
    expect(c.ratio).toBe(1);
  });
});

describe('migração invisível: save SEM âncora se comporta byte a byte como antes', () => {
  /* A garantia que tornou o b8296e0b seguro de ligar sem migrar campo, e que
     vale igual aqui: sem âncora, `playerDayKey` devolve exatamente
     `toDateString()`. Save antigo não perde a noite nem ganha uma de graça. */
  it('sem âncora, a manhã é a do aparelho — e o pesadelo dela continua valendo', () => {
    const rest = descanso([{ date: DIA_APARELHO, onTime: true }]);
    expect(morningKey(DEITOU, ACORDOU, undefined)).toBe(DIA_APARELHO);
    expect(nightmaresFor(rest, ACORDOU).count).toBe(NIGHTMARES_PER_NIGHT);
    expect(nightmareDayKey(ACORDOU, undefined)).toBe(DIA_APARELHO);
  });

  it('sem âncora, `restConstancy` conta as noites do aparelho como sempre contou', () => {
    const nights = Array.from({ length: 3 }, (_, i) => ({ date: diasAtrasAparelho(i), onTime: true }));
    expect(restConstancy(descanso(nights), ACORDOU).window).toBe(3);
  });
});

describe('O CUSTO DO RESET BENIGNO — o que esta escolha NÃO fecha', () => {
  /* ⚠️ Este teste trava o BURACO, não a virtude — mesmo formato do resíduo do
     X-4 em `careCaps.fuso.test.ts`. Ninguém pode ler o commit e achar que ficou
     perfeito.

     A DECISÃO: as noites JÁ GRAVADAS continuam valendo com a chave que têm, e
     não há migração de dado gravado. Só as noites NOVAS usam o dia do jogador.

     A CONSEQUÊNCIA, para quem está FORA do fuso de casa: por até
     `REST_WINDOW_DAYS` dias a janela móvel de `restConstancy` mistura as duas
     réguas. As noites da régua velha não são LIDAS como falha — elas
     simplesmente não são encontradas, e noite não encontrada é noite sem
     registro, que esta mecânica define como NEUTRA (sai do denominador,
     jamais conta como falha). Ninguém perde razão de regularidade.

     Mas a janela ENCOLHE, e encolher tem preço: abaixo de `RARITY_MIN_NIGHTS`
     a raridade cai para `common` por alguns dias, mesmo para quem dormiu no
     horário todas as noites. É um prêmio menor, nunca um castigo — e é
     exatamente o que se paga por não migrar dado gravado.

     Por que se aceita: o dono confirmou que nenhum save atual tem valor. E o
     alternativo — recarimbar noites já gravadas — pediria confiar que o
     `sleptAt` ISO de um registro antigo basta para reconstruir a manhã com a
     âncora de hoje, o que é justamente a suposição que produziu esta família de
     bugs. */

  /* A régua velha nomeia a manhã M de `deviceDay(M)`; a nova, de
     `playerDay(M)`. Como o maior afastamento civil possível entre dois fusos é
     de ~26h, as duas réguas nunca discordam por mais de UM dia — o histórico
     inteiro de quem está fora do fuso de casa aparece DESLOCADO em um dia, e
     não apagado. É isso que torna o reset "benigno": ninguém perde
     regularidade, porque noite deslocada continua sendo noite REGISTRADA. */

  /** O histórico inteiro na régua VELHA: as 7 manhãs, nomeadas pelo aparelho. */
  const soRéguaVelha = descanso(
    Array.from({ length: REST_WINDOW_DAYS }, (_, i) => ({ date: diasAtrasAparelho(i), onTime: true })),
    ANCORA,
  );

  it('a janela encolhe em UM dia — e o que sai sai como NEUTRO, nunca como falha', () => {
    const c = restConstancy(soRéguaVelha, ACORDOU);
    expect(
      c.window,
      'a noite mais antiga caiu fora da janela: o deslocamento de um dia é o custo',
    ).toBe(REST_WINDOW_DAYS - 1);
    expect(
      c.ratio,
      'a razão NÃO cai: noite não encontrada sai dos DOIS lados (regra da neutralidade)',
    ).toBe(1);
    expect(c.onTime).toBe(REST_WINDOW_DAYS - 1);
  });

  it('o preço real é de FIDELIDADE: a gravação nova apaga a noite velha vizinha', () => {
    // A noite de HOJE, gravada pela régua velha, chama-se "ontem" na régua
    // nova. Quando a manhã de ontem for (re)gravada, `recordNight` faz
    // `nights.filter(n => n.date !== key)` — a idempotência que existe para não
    // duplicar — e a entrada velha, homônima, some junto. Uma noite real
    // desaparece do histórico, em silêncio.
    //
    // Não é perda de HP, de coração nem de streak: nada nesta mecânica
    // diminui. É o Dex e a régua de regularidade ficando com um buraco por
    // alguns dias. Recarimbar as noites velhas custaria confiar que o `sleptAt`
    // ISO antigo reconstrói a manhã sob a âncora de hoje — exatamente a
    // suposição que produziu esta família de bugs.
    const velha = descanso([{ date: diasAtrasAparelho(0), onTime: true }], ANCORA);
    const depois = recordNight(velha, instante(DEITOU, 1), instante(ACORDOU, 1));
    expect(depois.nights).toHaveLength(1);
    expect(depois.nights[0].date).toBe(diasAtras(1));
    expect(
      depois.nights.some((n) => n.sleptAt === undefined),
      'a noite da régua velha foi substituída pela homônima nova',
    ).toBe(false);
  });

  it('e o buraco FECHA sozinho: passada a janela, só a régua nova sobra', () => {
    const convergido = descanso([
      // Já fora da janela móvel — o que sobrou da régua velha envelhece e sai.
      ...[8, 9].map((i) => ({ date: diasAtrasAparelho(i), onTime: true })),
      ...Array.from({ length: REST_WINDOW_DAYS }, (_, i) => ({ date: diasAtras(i), onTime: true })),
    ], ANCORA);
    const c = restConstancy(convergido, ACORDOU);
    expect(c.window).toBe(REST_WINDOW_DAYS);
    expect(c.ratio).toBe(1);
    expect(dreamRarity(convergido, ACORDOU)).toBe('legendary');
    expect(RARITY_MIN_NIGHTS).toBeLessThan(REST_WINDOW_DAYS);
  });

  it('o pesadelo da manhã da TRANSIÇÃO é o que se perde — uma vez, e sem dívida', () => {
    // A noite de ontem foi gravada com a chave do aparelho; a manhã de hoje
    // pergunta pela chave do jogador e não a encontra. Não há dano, não há
    // fila, não há aviso: pesadelo não combatido EXPIRA sem custo (é a regra
    // escrita em `pendingNightmare`), e isso vale igual quando o motivo de ele
    // não existir é o reset.
    const soVelhas = descanso([{ date: DIA_APARELHO, onTime: true }], ANCORA);
    expect(nightmaresFor(soVelhas, ACORDOU).count).toBe(0);
    expect(hasPendingNightmare(createNightmareState(), soVelhas, ACORDOU)).toBe(false);
  });

  it('o que este conserto NÃO ancora, de propósito: `onTime` segue no relógio do APARELHO', () => {
    // `isWithinWindow` lê `getHours()` do aparelho, e continua lendo. A janela
    // ("23:00–07:00") é um gesto do MUNDO REAL — deitar quando é noite ONDE A
    // PESSOA ESTÁ —, não um nome de dia. Ancorá-la faria quem viaja ser julgado
    // pelo relógio de casa: às 23h de Tóquio o app diria que ainda são 10h da
    // manhã e a noite não contaria. Quem grava a noite é sempre o aparelho onde
    // ela aconteceu, então o relógio certo para esta pergunta é o dele.
    const s = recordNight(descanso([], ANCORA), DEITOU, ACORDOU);
    expect(s.nights[0].onTime, 'deitou 04:00 no relógio do aparelho, dentro da janela').toBe(true);
  });
});
