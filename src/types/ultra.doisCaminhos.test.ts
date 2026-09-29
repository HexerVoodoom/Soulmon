/**
 * WP4.2 (decisão D6) — o Ultra deixa de exigir um ato de descuido.
 *
 * ─── O que havia ─────────────────────────────────────────────────────────
 * O topo abria com as TRÊS megas desbloqueadas. Como a árvore sobe por um galho
 * de cada vez, ter as três exigia **descer e subir de novo, duas vezes**. Ou
 * seja: o jogo pedia que o jogador degenerasse a criatura de propósito para
 * progredir — e a tela dessa degeneração diz "você vai perder o progresso" e
 * "NÃO pode ser desfeita", enquadramento de PERDA num passo obrigatório.
 *
 * Contradizia a tese em dois lugares: a criatura é declaradamente "o que dói
 * perder", e um app de cuidado que exige descuido para avançar está pedindo a
 * coisa errada.
 *
 * ─── O que este teste trava ──────────────────────────────────────────────
 * Que os dois caminhos existam e sejam INDEPENDENTES — e, principalmente, que
 * o da permanência não dependa de `unlockedEvolutions`. Se um dia alguém
 * "otimizar" `canReachUltra` e reintroduzir a exigência da coleção, é aqui que
 * quebra.
 */
import { describe, it, expect } from 'vitest';
import { canReachUltra, ULTRA_PATIENCE_DAYS, FORM_REQUIREMENTS } from './progression';
import { getNextEvolution } from '../utils/dailyReset';

const TRES_MEGAS = ['mega-power', 'mega-harmony', 'mega-benevolence'];

describe('os dois caminhos para o Ultra (WP4.2 / D6)', () => {
  it('coleção: as três megas continuam abrindo o topo', () => {
    expect(canReachUltra({ unlockedEvolutions: TRES_MEGAS, perfectDays: 0 })).toBe(true);
  });

  it('permanência: dias perfeitos como mega abrem o topo SEM nenhuma mega extra', () => {
    expect(canReachUltra({ unlockedEvolutions: ['mega-power'], perfectDays: ULTRA_PATIENCE_DAYS }))
      .toBe(true);
    // E sem NENHUMA forma registrada — o caminho não depende da coleção.
    expect(canReachUltra({ perfectDays: ULTRA_PATIENCE_DAYS })).toBe(true);
  });

  it('abaixo do corte, nenhum caminho — a porta abre no número, não perto dele', () => {
    expect(canReachUltra({ unlockedEvolutions: ['mega-power'], perfectDays: ULTRA_PATIENCE_DAYS - 1 }))
      .toBe(false);
    expect(canReachUltra({ unlockedEvolutions: ['mega-power', 'mega-harmony'], perfectDays: 0 }))
      .toBe(false);
  });

  it('save sem os campos não quebra e não abre o topo de graça', () => {
    expect(canReachUltra({})).toBe(false);
  });

  it('a árvore respeita os dois: mega + permanência devolve `ultra`', () => {
    expect(getNextEvolution('mega-power', 'power', ['mega-power'], ULTRA_PATIENCE_DAYS)).toBe('ultra');
    expect(getNextEvolution('mega-power', 'power', TRES_MEGAS, 0)).toBe('ultra');
    // Sem nenhum dos dois, o mega continua sendo o próprio destino ("distante").
    expect(getNextEvolution('mega-power', 'power', ['mega-power'], 3)).toBe('mega-power');
  });

  it('o Ultra continua sendo o topo — dele não sai mais nada', () => {
    expect(getNextEvolution('ultra', 'harmony', TRES_MEGAS, 999)).toBe('ultra');
  });

  it('a permanência é mais longa que o gate normal de evolução, e por muito', () => {
    // Se `ULTRA_PATIENCE_DAYS` chegar perto do `required` do mega, o topo
    // deixa de ser topo — vira só mais um degrau.
    expect(ULTRA_PATIENCE_DAYS).toBeGreaterThan(FORM_REQUIREMENTS.mega.required * 5);
  });

  it('nenhum caminho para o Ultra passa por degenerar', () => {
    // A trava conceitual do pacote: existe pelo menos um caminho alcançável a
    // partir de UMA linha só de evolução, sem nunca ter descido.
    const soUmGalho = ['rookie', 'champion-power', 'ultimate-power', 'mega-power'];
    expect(canReachUltra({ unlockedEvolutions: soUmGalho, perfectDays: ULTRA_PATIENCE_DAYS }))
      .toBe(true);
  });
});
