import { describe, it, expect } from 'vitest';
import { rubHealFor, mergeCareCaps } from './careCaps';
import { rubHealRecordFor, rubRefusal, RUB_HEAL_DAILY_CAP } from './careRules';
import { rubDailyCap } from './passives';

/**
 * X-4 — **o teto de carinho era por dia do APARELHO, e o registro mora no SAVE.**
 *
 * Enquanto o registro vivia no `localStorage`, comparar o dia por igualdade
 * bastava: um `date` diferente do de hoje só podia ser de ontem. A fatia 2 moveu
 * o campo para o save, e um mesmo save passou a ser lido por aparelhos em fusos
 * diferentes — que discordam do NOME do dia por `|offsetA − offsetB|` horas
 * todo dia.
 *
 * As duas chaves abaixo são o MESMO INSTANTE visto de dois fusos:
 *
 *     23:00 de 26/ago em São Paulo (UTC−3)  ==  11:00 de 27/ago em Tóquio (UTC+9)
 *
 * Nenhum destes testes precisa mexer no `TZ` do processo: o defeito é da
 * comparação de duas strings de dia, e materializá-las é suficiente para
 * reproduzir o gesto do jogador.
 */

/** `toDateString()` do aparelho ATRASADO (UTC−3) naquele instante. */
const DIA_A = 'Wed Aug 26 2026';
/** `toDateString()` do aparelho ADIANTADO (UTC+9) no MESMO instante. */
const DIA_B = 'Thu Aug 27 2026';
/** E o dia anterior de verdade, que DEVE zerar o teto. */
const ONTEM = 'Tue Aug 25 2026';

describe('X-4: a VOLTA não devolve carinho — o que tornava o furo ilimitado', () => {
  /* O passo que este conserto mata: o aparelho ATRASADO relendo um registro que
     o ADIANTADO acabou de gravar com o nome do dia seguinte. Com igualdade cega,
     cada troca de aparelho invalidava o registro do outro, indefinidamente. */
  it('registro do dia à frente vale — o teto já foi gasto neste instante', () => {
    expect(rubHealFor({ rubHeal: { date: DIA_B, healed: 1 } }, DIA_A).healed).toBe(1);
  });

  it('a recusa acompanha', () => {
    expect(rubRefusal(1, 5, { date: DIA_B, healed: RUB_HEAL_DAILY_CAP }, DIA_A)).toBe('daily-cap');
  });

  it('o Traço Carinhoso mantém o teto dele através da fronteira de fuso', () => {
    const capCarinhoso = rubDailyCap('carinhoso', RUB_HEAL_DAILY_CAP);
    expect(capCarinhoso, 'derivado, não literal: o teste acompanha mudança da base')
      .toBeGreaterThan(RUB_HEAL_DAILY_CAP);
    // Já no teto da BASE, mas abaixo do teto do traço: o carinho ainda sai.
    expect(rubRefusal(1, 5, { date: DIA_B, healed: RUB_HEAL_DAILY_CAP }, DIA_A, 'carinhoso'))
      .toBeUndefined();
    expect(rubRefusal(1, 5, { date: DIA_B, healed: capCarinhoso }, DIA_A, 'carinhoso'))
      .toBe('daily-cap');
  });

  it('N repiques entre os dois aparelhos custam UM teto, não N', () => {
    // O gesto real do furo: alternar de aparelho para reganhar carinho.
    let caps: { rubHeal: { date: string; healed: number } } = {
      rubHeal: { date: DIA_B, healed: RUB_HEAL_DAILY_CAP },
    };
    for (const dia of [DIA_A, DIA_B, DIA_A, DIA_B, DIA_A]) {
      const registro = rubHealFor(caps, dia);
      expect(registro.healed, `repique em ${dia} devolveu teto`).toBe(RUB_HEAL_DAILY_CAP);
      caps = { rubHeal: registro };
    }
  });
});

describe('X-4: o resíduo desta CAMADA — fechado uma camada acima, por playerDay.ts', () => {
  /* ⚠️ Este teste trava o que o conserto NÃO faz, para ninguém achar que o X-4
     está fechado. O aparelho ADIANTADO ainda estreia o teto do dia dele mais
     cedo: ele lê um registro de um dia anterior, que é indistinguível de um
     registro de ontem de verdade sem carimbar o INSTANTE no registro.

     Efeito: no máximo UM teto extra por dia civil, e só para quem alterna
     aparelhos entre fusos. Antes era ilimitado.

     ✅ ATUALIZAÇÃO — o resíduo foi FECHADO, e não aqui. A função abaixo segue
     se comportando exatamente assim, porque o conserto não era comparar melhor:
     era os dois aparelhos pararem de DISCORDAR do dia. Isso mora agora em
     `utils/playerDay.ts` (o dia do jogador em fuso fixo gravado no save), que
     alimenta `todayKey` e fechou junto os três irmãos anunciados aqui —
     `lastCheckInDate`, `moodLog` e `poopDrainCharge`. Ver `playerDay.test.ts`.

     Este teste FICA, e fica invertido de propósito: ele trava o contrato desta
     camada. Se alguém um dia fizer `rubHealRecordFor` aceitar um registro de
     um dia anterior como "provavelmente é outro fuso", a monotonicidade do
     X-4 morre e o furo ILIMITADO volta pela porta de trás. A ordem-consciência
     e a âncora de fuso são camadas distintas, e cada uma tem o seu teste. */
  it('esta camada, sozinha, ainda deixa o dia anterior zerar — e tem de deixar', () => {
    expect(rubHealFor({ rubHeal: { date: DIA_A, healed: RUB_HEAL_DAILY_CAP } }, DIA_B).healed)
      .toBe(0);
  });
});

describe('X-4: um dia que passou de verdade continua zerando', () => {
  it('registro de ONTEM zera o teto — senão o conserto viraria "nunca mais tem carinho"', () => {
    expect(rubHealFor({ rubHeal: { date: ONTEM, healed: 1 } }, DIA_A).healed).toBe(0);
  });

  it('registro do próprio dia é devolvido intacto', () => {
    const registro = { date: DIA_A, healed: 0.5 };
    expect(rubHealRecordFor(registro, DIA_A)).toBe(registro);
  });

  it('data ilegível cai no lado seguro: vale como hoje, não devolve teto de graça', () => {
    expect(rubHealRecordFor({ date: 'lixo', healed: 1 }, DIA_A)).toEqual({ date: DIA_A, healed: 1 });
  });

  it('sem registro nenhum, o teto está inteiro', () => {
    expect(rubHealFor(undefined, DIA_A)).toEqual({ date: DIA_A, healed: 0 });
  });
});

describe('X-4: a fusão do load desempata pelo dia mais recente, não por procedência', () => {
  const AGORA = Date.parse('2026-08-27T02:00:00Z');

  it('o registro mais NOVO ganha, mesmo vindo do aparelho', () => {
    const out = mergeCareCaps({ rubHeal: { date: DIA_A, healed: 1 } }, { rubHeal: { date: DIA_B, healed: 1 } }, AGORA);
    expect(out.rubHeal?.date).toBe(DIA_B);
  });

  it('o registro mais VELHO do aparelho não sobrescreve o do save', () => {
    const out = mergeCareCaps({ rubHeal: { date: DIA_B, healed: 1 } }, { rubHeal: { date: ONTEM, healed: 1 } }, AGORA);
    expect(out.rubHeal?.date).toBe(DIA_B);
  });

  it('mesmo dia nos dois: fica o maior gasto', () => {
    const out = mergeCareCaps({ rubHeal: { date: DIA_A, healed: 0.5 } }, { rubHeal: { date: DIA_A, healed: 1 } }, AGORA);
    expect(out.rubHeal).toEqual({ date: DIA_A, healed: 1 });
  });
});
