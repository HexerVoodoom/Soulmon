/**
 * Regressão do bug F2 (run soulmon-02): o destino EXIBIDO discordava do
 * destino COMMITADO.
 *
 * `handleEvolveRequest` (a cerimônia) e o `canEvolve` reimplementavam a
 * derivação do galho e mandavam TODO empate para `data`, sem consultar o ritmo
 * de cuidado; `handleEvolve` chamava `resolveBranch`, que desempata pelo ritmo.
 * Empate vírus/vacina com leitura confiável: a página previa `virus`, a
 * cerimônia anunciava `ultimate-data`, o save recebia `ultimate-virus`.
 *
 * `copiaAntiga` abaixo é a cópia divergente, LITERAL, como estava no
 * `App.tsx:1783-1789`. Ela existe aqui só para provar que a fonte única
 * discorda dela exatamente no caso que ela errava — não é para ser reusada.
 */
import { describe, it, expect } from 'vitest';
import { evolutionTarget } from './evolutionTarget';
import { computeCarePattern, patternBranch, CARE_WINDOW_DAYS } from './carePattern';
import { getNextEvolution } from './dailyReset';

const AGORA = new Date('2026-08-25T12:00:00Z');

/** A cópia que existia no App.tsx — empate sempre em `data`, ritmo ignorado. */
function copiaAntiga(
  virusPoints: number, dataPoints: number, vaccinePoints: number,
  evolutionStage: string, unlockedEvolutions: string[],
): string {
  const total = virusPoints + dataPoints + vaccinePoints;
  let b: 'virus' | 'data' | 'vaccine' = 'data';
  if (total > 0) {
    const max = Math.max(virusPoints, dataPoints, vaccinePoints);
    if (virusPoints === max && virusPoints > dataPoints && virusPoints > vaccinePoints) b = 'virus';
    else if (vaccinePoints === max && vaccinePoints > virusPoints && vaccinePoints > dataPoints) b = 'vaccine';
  }
  return getNextEvolution(evolutionStage, b, unlockedEvolutions);
}

/** Histórico farto e regular = leitura CONFIÁVEL (padrão Constante → vírus). */
function historicoConstante() {
  const dias: { completedAt: string }[] = [];
  for (let d = 0; d < CARE_WINDOW_DAYS; d++) {
    const dia = new Date(AGORA.getTime() - d * 86400000);
    for (let n = 0; n < 2; n++) dias.push({ completedAt: dia.toISOString() });
  }
  return computeCarePattern(dias, AGORA);
}

describe('forma-destino da evolução — fonte única (F2)', () => {
  it('empate com ritmo CONFIÁVEL: o ritmo desempata, e a cópia antiga errava', () => {
    const leitura = historicoConstante();
    expect(leitura.confident).toBe(true);

    const alvo = evolutionTarget({
      points: { virus: 5, data: 0, vaccine: 5 },
      reading: leitura,
      currentBranch: 'data',
      evolutionStage: 'champion-virus',
      unlockedEvolutions: [],
    });

    // A decisão real (resolveBranch) escolhe o galho do RITMO entre os líderes.
    const doRitmo = patternBranch(leitura.pattern.id);
    expect(['virus', 'vaccine']).toContain(doRitmo);
    expect(alvo.branch).toBe(doRitmo);
    expect(alvo.stage).toBe(`ultimate-${alvo.branch}`);

    // E é exatamente aqui que a cópia divergia: ela anunciava `ultimate-data`.
    expect(copiaAntiga(5, 0, 5, 'champion-virus', [])).toBe('ultimate-data');
    expect(alvo.stage).not.toBe(copiaAntiga(5, 0, 5, 'champion-virus', []));
  });

  it('empate SEM leitura confiável: cai no galho atual (fallback), não em `data` fixo', () => {
    // Pouco histórico ⇒ carePattern se declara não-confiável e NÃO desempata.
    const fraca = computeCarePattern([{ completedAt: AGORA.toISOString() }], AGORA);
    expect(fraca.confident).toBe(false);

    // Fallback = currentBranch, quando ele está entre os líderes do empate.
    const alvo = evolutionTarget({
      points: { virus: 5, data: 0, vaccine: 5 },
      reading: fraca,
      currentBranch: 'vaccine',
      evolutionStage: 'champion-vaccine',
      unlockedEvolutions: [],
    });
    expect(alvo.branch).toBe('vaccine');
    expect(alvo.stage).toBe('ultimate-vaccine');

    // A cópia antiga jogava esse mesmo save em `ultimate-data`.
    expect(copiaAntiga(5, 0, 5, 'champion-vaccine', [])).toBe('ultimate-data');
  });

  it('fallback fora do empate: escolhe um líder, nunca o `data` que perdeu', () => {
    const fraca = computeCarePattern([{ completedAt: AGORA.toISOString() }], AGORA);
    const alvo = evolutionTarget({
      points: { virus: 5, data: 0, vaccine: 5 },
      reading: fraca,
      currentBranch: 'data',
      evolutionStage: 'champion-virus',
      unlockedEvolutions: [],
    });
    expect(['virus', 'vaccine']).toContain(alvo.branch);
    expect(alvo.branch).not.toBe('data');
  });

  it('líder único: atributo manda, ritmo não interfere', () => {
    const leitura = historicoConstante();
    const alvo = evolutionTarget({
      points: { virus: 1, data: 7, vaccine: 2 },
      reading: leitura,
      currentBranch: 'virus',
      evolutionStage: 'rookie',
      unlockedEvolutions: [],
    });
    expect(alvo.branch).toBe('data');
    expect(alvo.stage).toBe('champion-data');
  });

  it('sem destino: devolve o próprio estágio (é o que trava a cerimônia e o botão)', () => {
    const leitura = historicoConstante();
    const alvo = evolutionTarget({
      points: { virus: 3, data: 0, vaccine: 0 },
      reading: leitura,
      currentBranch: 'virus',
      evolutionStage: 'ultra',
      unlockedEvolutions: [],
    });
    expect(alvo.stage).toBe('ultra');
  });
});
