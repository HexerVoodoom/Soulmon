import { describe, it, expect } from 'vitest';
import {
  playerDayKey, deviceOffsetMs, anchorOffsetMs,
  sanitizePlayerDayAnchor, resolvePlayerDayAnchor,
  type PlayerDayAnchor,
} from './playerDay';
import { rubHealFor } from './careCaps';
import { RUB_HEAL_DAILY_CAP } from './careRules';
import { needsCheckIn } from './rituals';
import { applyPoopDrain, chargedToday, POOP_DRAIN_PERIOD_MS, type PoopDrainState } from './poopDrain';
import { MAX_HEARTS_LOST_PER_DAY } from './dailyReset';
import { recordMood, moodFor } from './mood';

/**
 * O RESÍDUO DO X-4 — **o dia do jogador em fuso fixo.**
 *
 * O commit 9e9f679f tornou `rubHealRecordFor` ordem-consciente e matou o furo
 * ILIMITADO do teto de carinho, mas deixou um resíduo travado por teste: o
 * aparelho ADIANTADO ainda estreia o teto do dia dele mais cedo, porque um
 * registro "de um dia atrás" vindo de outro fuso é indistinguível de um registro
 * de ontem de verdade. Comparar melhor não resolve; os dois aparelhos precisam
 * CONCORDAR sobre qual dia é hoje.
 *
 * O instante que serve de bancada em toda a suíte:
 *
 *     2026-08-27T02:00:00Z  ==  26/ago 23:00 em São Paulo (UTC−3)
 *                           ==  27/ago 11:00 em Tóquio    (UTC+9)
 *
 * Nenhum teste aqui mexe no `TZ` do processo, e nenhum depende do fuso da
 * máquina que roda a suíte: um aparelho é simulado pelo par (instante, âncora),
 * e `playerDayKey` deriva a chave do INSTANTE deslocado pela âncora, lido em
 * UTC. Isso é o que torna a função independente do aparelho — e é a propriedade
 * inteira do conserto.
 */

const INSTANTE = new Date('2026-08-27T02:00:00Z');

/** As duas âncoras, uma por fuso de residência declarável. */
const BRASIL: PlayerDayAnchor = { zone: 'America/Sao_Paulo' };
const TOQUIO: PlayerDayAnchor = { zone: 'Asia/Tokyo' };
/** A mesma coisa pelo caminho do FALLBACK — offset congelado, sem IANA. */
const BRASIL_OFFSET: PlayerDayAnchor = { offsetMs: -3 * 3600000 };

describe('a chave do dia do jogador não depende do aparelho', () => {
  it('o mesmo instante com a MESMA âncora dá a MESMA chave — o conserto em uma linha', () => {
    // O aparelho não entra na conta: os dois lados são o mesmo instante, e a
    // âncora é a mesma. Com `toDateString()` isto era impossível de garantir,
    // porque a string saía do relógio local de cada celular.
    expect(playerDayKey(INSTANTE, BRASIL)).toBe(playerDayKey(new Date(INSTANTE.getTime()), BRASIL));
    expect(playerDayKey(INSTANTE, BRASIL)).toBe('Wed Aug 26 2026');
  });

  it('e âncoras DIFERENTES dão chaves diferentes — senão o teste acima seria vácuo', () => {
    // Sem isto, uma implementação que devolvesse uma constante passaria. A
    // discordância BR↔Tóquio (12h) é justamente o tamanho do furo original.
    expect(playerDayKey(INSTANTE, TOQUIO)).toBe('Thu Aug 27 2026');
    expect(playerDayKey(INSTANTE, BRASIL)).not.toBe(playerDayKey(INSTANTE, TOQUIO));
  });

  it('NÃO é UTC: às 23h no Brasil o dia do jogador ainda é hoje', () => {
    /* `App.tsx` já explica por escrito o bug clássico deste campo (a nota do
       `isoDay`, sobre `toISOString`): em fuso negativo o dia UTC vira à tarde.
       Com UTC puro, o carinho da noite do brasileiro contaria como o de amanhã
       e o teto zeraria às 21h — trocar um furo por outro. */
    expect(INSTANTE.toISOString().slice(0, 10), 'a bancada: em UTC já é dia 27')
      .toBe('2026-08-27');
    expect(playerDayKey(INSTANTE, BRASIL), 'mas o dia do jogador brasileiro ainda é 26')
      .toBe('Wed Aug 26 2026');
  });

  it('o fallback de offset congelado concorda com o IANA fora do horário de verão', () => {
    // O caminho de quem nunca fez o ritual longo. Fixo, ele erra por uma hora
    // durante o DST de quem o tem — mas erra IGUAL nos dois aparelhos, que é a
    // única propriedade de que um teto precisa.
    expect(playerDayKey(INSTANTE, BRASIL_OFFSET)).toBe(playerDayKey(INSTANTE, BRASIL));
  });

  it('a forma é a de `toDateString()`, com o dia zero-preenchido', () => {
    // Não é cosmética: é o que faz `Date.parse` continuar funcionando sobre a
    // chave, e é o que mantém de pé a comparação MONOTÔNICA do X-4 em
    // `rubHealRecordFor` — este conserto reforça aquele em vez de substituí-lo.
    const cedo = playerDayKey(new Date('2026-08-05T12:00:00Z'), BRASIL);
    expect(cedo).toBe('Wed Aug 05 2026');
    expect(new Date(cedo).toDateString(), 'ida e volta por Date.parse').toBe(cedo);
    expect(Date.parse(playerDayKey(INSTANTE, TOQUIO)))
      .toBeGreaterThan(Date.parse(playerDayKey(INSTANTE, BRASIL)));
  });
});

describe('MIGRAÇÃO: no fuso de casa a troca é invisível', () => {
  it('âncora igual ao offset do aparelho devolve EXATAMENTE `toDateString()`', () => {
    // Roda em qualquer fuso de CI: a âncora é derivada do próprio relógio da
    // máquina. É esta igualdade que garante "nenhum teto devolvido, nenhum
    // ritual reaberto" para quem nunca saiu de casa.
    const agora = new Date();
    const casa: PlayerDayAnchor = { offsetMs: deviceOffsetMs(agora) };
    expect(playerDayKey(agora, casa)).toBe(agora.toDateString());
    expect(playerDayKey(INSTANTE, { offsetMs: deviceOffsetMs(INSTANTE) }))
      .toBe(INSTANTE.toDateString());
  });

  it('save SEM âncora se comporta como sempre se comportou', () => {
    // O intervalo entre a atualização e o primeiro load. Nada pode mudar aí,
    // senão a migração deixa de ser invisível para TODO MUNDO.
    expect(playerDayKey(INSTANTE, undefined)).toBe(INSTANTE.toDateString());
    expect(playerDayKey(INSTANTE, {})).toBe(INSTANTE.toDateString());
    expect(anchorOffsetMs(undefined, INSTANTE)).toBeNull();
    expect(anchorOffsetMs({}, INSTANTE)).toBeNull();
  });

  it('a âncora do save VENCE — ela não anda com o avião de quem viaja', () => {
    const jaTem = { zone: 'America/Sao_Paulo' };
    expect(resolvePlayerDayAnchor(jaTem, 'Asia/Tokyo', INSTANTE)).toBe(jaTem);
  });

  it('sem âncora: primeiro o fuso do onboarding, depois o offset deste aparelho', () => {
    expect(resolvePlayerDayAnchor(undefined, 'Asia/Tokyo', INSTANTE)).toEqual({ zone: 'Asia/Tokyo' });
    expect(resolvePlayerDayAnchor(undefined, undefined, INSTANTE))
      .toEqual({ offsetMs: deviceOffsetMs(INSTANTE) });
    // Fuso de perfil corrompido não pode derrubar o load: cai no aparelho.
    expect(resolvePlayerDayAnchor(undefined, 'Marte/Olympus', INSTANTE))
      .toEqual({ offsetMs: deviceOffsetMs(INSTANTE) });
  });

  it('o save é dado NÃO confiável e a higienização trata isso', () => {
    expect(sanitizePlayerDayAnchor(undefined)).toBeUndefined();
    expect(sanitizePlayerDayAnchor('America/Sao_Paulo')).toBeUndefined();
    expect(sanitizePlayerDayAnchor([1, 2])).toBeUndefined();
    expect(sanitizePlayerDayAnchor({ zone: 'Marte/Olympus' })).toBeUndefined();
    expect(sanitizePlayerDayAnchor({ zone: 'America/Sao_Paulo' })).toEqual({ zone: 'America/Sao_Paulo' });
    // Offset absurdo deslocaria o dia do jogador por semanas e o teto nunca
    // mais zeraria — o furo de volta, pela porta do save adulterado.
    expect(sanitizePlayerDayAnchor({ offsetMs: 99 * 3600000 })).toBeUndefined();
    expect(sanitizePlayerDayAnchor({ offsetMs: Number.NaN })).toBeUndefined();
    expect(sanitizePlayerDayAnchor({ offsetMs: -3 * 3600000 })).toEqual({ offsetMs: -3 * 3600000 });
    // Fuso ilegível + offset bom: sobra o offset, e a leitura não paga
    // try/catch em silêncio a cada chamada.
    expect(sanitizePlayerDayAnchor({ zone: 'Marte/Olympus', offsetMs: 0 })).toEqual({ offsetMs: 0 });
  });
});

describe('X-4 fechado: o teto de carinho não estreia mais cedo no aparelho adiantado', () => {
  /* ⚠️ Este é o teste do RESÍDUO de `careCaps.fuso.test.ts`, invertido. Lá ele
     trava o que o conserto anterior NÃO fazia; aqui ele passa a valer, e a razão
     é a única possível: os dois aparelhos deixaram de discordar do dia. */
  it('carinho gasto no Brasil às 23h continua gasto no Japão às 11h — MESMO INSTANTE', () => {
    const chave = playerDayKey(INSTANTE, BRASIL);
    const caps = { rubHeal: { date: chave, healed: RUB_HEAL_DAILY_CAP } };
    // O "outro aparelho" é a MESMA âncora lida de outro lugar do mundo: é isso
    // que o save sincronizado entrega, e é onde o resíduo vivia.
    expect(rubHealFor(caps, playerDayKey(INSTANTE, BRASIL)).healed).toBe(RUB_HEAL_DAILY_CAP);
  });

  it('N repiques entre os dois aparelhos custam UM teto, e não estreiam o de amanhã', () => {
    let caps = { rubHeal: { date: playerDayKey(INSTANTE, BRASIL), healed: RUB_HEAL_DAILY_CAP } };
    // Alternar de aparelho a cada minuto — o gesto real do furo.
    for (let i = 0; i < 6; i++) {
      const agora = new Date(INSTANTE.getTime() + i * 60000);
      const registro = rubHealFor(caps, playerDayKey(agora, BRASIL));
      expect(registro.healed, `repique ${i} devolveu teto`).toBe(RUB_HEAL_DAILY_CAP);
      caps = { rubHeal: registro };
    }
  });

  it('e um dia que passou DE VERDADE continua zerando', () => {
    const ontem = playerDayKey(new Date(INSTANTE.getTime() - 24 * 3600000), BRASIL);
    expect(ontem).toBe('Tue Aug 25 2026');
    expect(rubHealFor({ rubHeal: { date: ontem, healed: RUB_HEAL_DAILY_CAP } },
      playerDayKey(INSTANTE, BRASIL)).healed).toBe(0);
  });
});

describe('o check-in matinal é UM por dia do JOGADOR, não por dia de aparelho', () => {
  it('carimbado no Brasil às 23h, não reabre no Japão às 11h', () => {
    const estado = {
      lastCheckInDate: playerDayKey(INSTANTE, BRASIL),
      playerDayTz: BRASIL,
    };
    expect(needsCheckIn(estado, INSTANTE)).toBe(false);
    // E o mesmo save aberto um minuto depois, do outro lado do mundo: o
    // relógio do aparelho não entra na conta.
    expect(needsCheckIn(estado, new Date(INSTANTE.getTime() + 60000))).toBe(false);
  });

  it('mas na virada do dia DO JOGADOR o ritual volta — senão o conserto é uma tranca', () => {
    const estado = {
      lastCheckInDate: playerDayKey(INSTANTE, BRASIL),
      playerDayTz: BRASIL,
    };
    // 2h depois: 01:00 de 27/ago em São Paulo. Virou.
    expect(needsCheckIn(estado, new Date(INSTANTE.getTime() + 2 * 3600000))).toBe(true);
  });

  it('save sem âncora se comporta como antes', () => {
    const agora = new Date();
    expect(needsCheckIn({ lastCheckInDate: agora.toDateString() }, agora)).toBe(false);
  });
});

describe('o teto do dreno de cocô para de ser furado por troca de fuso', () => {
  /* Aqui o furo custava CORAÇÃO, não um carinho: um aparelho que lesse um `day`
     com outro nome achava que o dia do teto não tinha começado e devolvia ao
     dreno o direito de cobrar `MAX_HEARTS_LOST_PER_DAY` inteiro de novo. */
  // Tipado como `PoopDrainState` de propósito: `applyPoopDrain` é genérico em
  // `<T extends PoopDrainState>` e devolve `T`, então um literal inferido sem
  // `poopDrainCharge` esconderia o campo justamente na saída que interessa.
  const base: PoopDrainState = {
    healthPoints: 4,
    poopEventsShown: [0],
    poopEventsCompleted: [],
    poopPenaltyClockAt: INSTANTE.getTime() - 7 * POOP_DRAIN_PERIOD_MS,
    lastResetDate: playerDayKey(INSTANTE, BRASIL),
    // #58b (22/09/2026): sem `saveDay` o dreno lê SAVE NOVO e a carência
    // `NEW_SAVE_GRACE_DAYS` absorve a cobrança que este teste quer medir.
    lastDayReport: { saveDay: 90 },
    playerDayTz: BRASIL,
  };

  it('o gasto do dia é lido pela chave do jogador, com o relógio de qualquer aparelho', () => {
    const cobrado = applyPoopDrain(base, { now: INSTANTE.getTime(), isSleeping: false });
    expect(cobrado.poopDrainCharge?.day).toBe('Wed Aug 26 2026');
    expect(cobrado.poopDrainCharge?.hearts).toBe(MAX_HEARTS_LOST_PER_DAY);
    expect(chargedToday(cobrado, INSTANTE.getTime() + 60000)).toBe(MAX_HEARTS_LOST_PER_DAY);
  });

  it('a segunda passada, um minuto depois, NÃO cobra o teto de novo', () => {
    const cobrado = applyPoopDrain(base, { now: INSTANTE.getTime(), isSleeping: false });
    const hpDepoisDaPrimeira = cobrado.healthPoints;
    expect(hpDepoisDaPrimeira).toBeLessThan(base.healthPoints);

    // Relógio reancorado em `now`; empurra 7 períodos para o tick valer.
    const denovo = applyPoopDrain(
      { ...cobrado, poopPenaltyClockAt: cobrado.poopPenaltyClockAt - 7 * POOP_DRAIN_PERIOD_MS },
      { now: INSTANTE.getTime() + 60000, isSleeping: false },
    );
    expect(denovo.healthPoints, 'o teto do dia já foi gasto').toBe(hpDepoisDaPrimeira);
  });

  it('mas o teto de AMANHÃ existe — o conserto não é "nunca mais perde coração"', () => {
    const cobrado = applyPoopDrain(base, { now: INSTANTE.getTime(), isSleeping: false });
    // 26h depois: 27/ago no Brasil, dia novo do jogador.
    const amanha = INSTANTE.getTime() + 26 * 3600000;
    expect(chargedToday(cobrado, amanha)).toBe(0);
  });
});

describe('o humor do dia é UMA entrada por dia do jogador', () => {
  it('responder de novo do outro aparelho SUBSTITUI, não acumula', () => {
    // "Responder de novo no mesmo dia SUBSTITUI" é regra escrita de `mood.ts`.
    // Com o dia do aparelho ela virava "acumula" entre fusos, e a média de
    // `moodSummary` passava a ser puxada por um dia contado duas vezes.
    const chave = playerDayKey(INSTANTE, BRASIL);
    let log = recordMood(undefined, chave, 2);
    log = recordMood(log, playerDayKey(new Date(INSTANTE.getTime() + 60000), BRASIL), 5);
    expect(log).toHaveLength(1);
    expect(moodFor(log, chave)).toBe(5);
  });
});
