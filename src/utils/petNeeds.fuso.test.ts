import { describe, it, expect } from 'vitest';
import { needsAttention, play, playedToday, canPlay, PLAY_TIMES_PER_DAY } from './petNeeds';
import type { PetNeedsState } from './petNeeds';
import { playerDayKey, deviceOffsetMs, type PlayerDayAnchor } from './playerDay';

/**
 * `playLog` — o QUINTO irmão da família do dia-do-aparelho.
 * ========================================================
 *
 * O mesmo defeito de `careCaps.rubHeal`, `lastCheckInDate`, `moodLog` e
 * `poopDrainCharge` (commit b8296e0b): um registro diário que MORA NO SAVE,
 * com teto de uma vez por dia (`PLAY_TIMES_PER_DAY`), cuja chave de dia saía de
 * `dayKeyOf(now)` — que é `toDateString()`, isto é, o dia do APARELHO.
 *
 * Ele NÃO é do feitio imune do `feedTimes`: aquele grava o INSTANTE absoluto
 * (`number`, ms de epoch) e compara janela de uma hora, e instante não tem fuso
 * — dois aparelhos leem o mesmo número e chegam à mesma conclusão. `playLog`
 * grava o NOME do dia e compara por igualdade de string; é o formato que carrega
 * o fuso do escritor junto.
 *
 * O CENÁRIO CONCRETO, o mesmo gesto do X-4:
 *
 *   23:00 de 26/ago em São Paulo (UTC−3)  ==  11:00 de 27/ago em Tóquio (UTC+9)
 *
 * O jogador brinca à noite no celular brasileiro: `playLog.date` grava
 * "Wed Aug 26 2026", gasta 1 de energia, ganha o buff de +20% de Bits e um ponto
 * de atributo. Abre o tablet que estava em Tóquio — MESMO INSTANTE, mesma nuvem,
 * mesmo save — e ali `dayKeyOf(now)` diz "Thu Aug 27 2026". `playedToday` devolve
 * `false`, `canPlay` reabre a oferta e `needsAttention` volta a SUGERIR brincar.
 * O teto de 1×/dia vira 2×/dia, e o preço não é cosmético: sai em ponto de
 * atributo (que é o galho de evolução) e num segundo multiplicador de Bits.
 *
 * Nenhum teste aqui mexe no `TZ` do processo — mesma técnica de
 * `careCaps.fuso.test.ts`. O instante é construído em hora LOCAL (meio-dia, para
 * ficar longe de qualquer borda), e a âncora é o offset DESTE aparelho mais 13h.
 * Assim, em qualquer máquina do mundo, o dia do JOGADOR é o dia seguinte ao dia
 * do APARELHO — o segundo aparelho, materializado sem sair do processo.
 */

/** Meio-dia LOCAL: qualquer máquina, longe da meia-noite dos dois lados. */
const AGORA = new Date(2026, 7, 26, 12, 0, 0);
/** A âncora do save: 13h à frente deste aparelho. Fixa, e viaja no save. */
const ANCORA: PlayerDayAnchor = { offsetMs: deviceOffsetMs(AGORA) + 13 * 3600000 };

/** O dia do JOGADOR neste instante (o que o save deve gravar). */
const DIA_JOGADOR = playerDayKey(AGORA, ANCORA);
/** O dia do APARELHO neste instante (o que o código gravava). */
const DIA_APARELHO = AGORA.toDateString();

function estado(over: Partial<PetNeedsState> = {}): PetNeedsState {
  return {
    energyPoints: 5,
    foodInventory: {},
    evolutionStage: 'rookie',
    playerDayTz: ANCORA,
    ...over,
  };
}

describe('o cenário existe: os dois aparelhos discordam do nome do dia', () => {
  it('o dia do jogador e o dia do aparelho são strings diferentes neste instante', () => {
    expect(DIA_JOGADOR).not.toBe(DIA_APARELHO);
  });

  it('a oferta é de UMA vez por dia — é o teto que este arquivo defende', () => {
    expect(PLAY_TIMES_PER_DAY).toBe(1);
  });
});

describe('playLog: o teto de 1×/dia sobrevive à troca de fuso', () => {
  /* O gesto: o celular brasileiro grava com a chave do JOGADOR (é o que o
     `App.tsx` passa depois do conserto). O tablet de Tóquio abre o mesmo save no
     mesmo instante e pergunta ao módulo puro "o que o pet quer agora?". */
  it('quem já brincou hoje não recebe de novo a sugestão de brincar', () => {
    const jaBrincou = estado({ playLog: { date: DIA_JOGADOR } });
    expect(
      needsAttention(jaBrincou, AGORA).map(w => w.kind),
      'o segundo aparelho reabriu a oferta: o teto de 1×/dia virou 2×/dia',
    ).not.toContain('play');
  });

  it('o registro gravado pelo primeiro aparelho é o dia do JOGADOR, não o do aparelho', () => {
    const { state } = play(estado(), DIA_JOGADOR, AGORA);
    expect(state.playLog?.date).toBe(DIA_JOGADOR);
    // E o módulo puro reconhece esse carimbo como "hoje" no outro aparelho.
    expect(playedToday(state, DIA_JOGADOR)).toBe(true);
    expect(canPlay(state, DIA_JOGADOR)).toBe(false);
  });

  it('quem NÃO brincou hoje continua recebendo a oferta — o conserto não fecha a porta', () => {
    expect(needsAttention(estado(), AGORA).map(w => w.kind)).toContain('play');
  });

  it('registro de ONTEM (do jogador) reabre a oferta, como tem de reabrir', () => {
    const ontem = playerDayKey(new Date(AGORA.getTime() - 24 * 3600000), ANCORA);
    expect(ontem).not.toBe(DIA_JOGADOR);
    expect(needsAttention(estado({ playLog: { date: ontem } }), AGORA).map(w => w.kind))
      .toContain('play');
  });
});

describe('migração invisível: save SEM âncora se comporta byte a byte como antes', () => {
  /* A garantia que tornou o b8296e0b seguro de ligar sem migrar campo: sem
     âncora, `playerDayKey` devolve exatamente `toDateString()`. Save antigo não
     perde a brincadeira do dia nem ganha uma de graça. */
  it('sem âncora, o dia do jogador É o dia do aparelho', () => {
    expect(playerDayKey(AGORA, undefined)).toBe(DIA_APARELHO);
  });

  it('sem âncora, quem já brincou hoje (chave do aparelho) segue sem a oferta', () => {
    const semAncora = estado({ playerDayTz: undefined, playLog: { date: DIA_APARELHO } });
    expect(needsAttention(semAncora, AGORA).map(w => w.kind)).not.toContain('play');
  });
});
