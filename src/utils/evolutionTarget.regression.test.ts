/**
 * Regressão do bug F2 (run soulmon-02): o destino EXIBIDO discordava do
 * destino COMMITADO.
 *
 * `handleEvolveRequest` (a cerimônia) e o `canEvolve` reimplementavam a
 * derivação do galho e mandavam TODO empate para `data`, sem consultar o ritmo
 * de cuidado; `handleEvolve` chamava `resolveBranch`, que desempata pelo ritmo.
 * Empate poder/benevolência com leitura confiável: a página previa `power`, a
 * cerimônia anunciava `ultimate-harmony`, o save recebia `ultimate-power`.
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

/** A cópia que existia no App.tsx — empate sempre em `harmony`, ritmo ignorado. */
function copiaAntiga(
  powerPoints: number, harmonyPoints: number, benevolencePoints: number,
  evolutionStage: string, unlockedEvolutions: string[],
): string {
  const total = powerPoints + harmonyPoints + benevolencePoints;
  let b: 'power' | 'harmony' | 'benevolence' = 'harmony';
  if (total > 0) {
    const max = Math.max(powerPoints, harmonyPoints, benevolencePoints);
    if (powerPoints === max && powerPoints > harmonyPoints && powerPoints > benevolencePoints) b = 'power';
    else if (benevolencePoints === max && benevolencePoints > powerPoints && benevolencePoints > harmonyPoints) b = 'benevolence';
  }
  return getNextEvolution(evolutionStage, b, unlockedEvolutions);
}

/** Histórico farto e regular = leitura CONFIÁVEL (padrão Constante → poder). */
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
      points: { power: 5, harmony: 0, benevolence: 5 },
      reading: leitura,
      currentBranch: 'harmony',
      evolutionStage: 'champion-power',
      unlockedEvolutions: [],
    });

    // A decisão real (resolveBranch) escolhe o galho do RITMO entre os líderes.
    const doRitmo = patternBranch(leitura.pattern.id);
    expect(['power', 'benevolence']).toContain(doRitmo);
    expect(alvo.branch).toBe(doRitmo);
    expect(alvo.stage).toBe(`ultimate-${alvo.branch}`);

    // E é exatamente aqui que a cópia divergia: ela anunciava `ultimate-harmony`.
    expect(copiaAntiga(5, 0, 5, 'champion-power', [])).toBe('ultimate-harmony');
    expect(alvo.stage).not.toBe(copiaAntiga(5, 0, 5, 'champion-power', []));
  });

  it('empate SEM leitura confiável: cai no galho atual (fallback), não em `data` fixo', () => {
    // Pouco histórico ⇒ carePattern se declara não-confiável e NÃO desempata.
    const fraca = computeCarePattern([{ completedAt: AGORA.toISOString() }], AGORA);
    expect(fraca.confident).toBe(false);

    // Fallback = currentBranch, quando ele está entre os líderes do empate.
    const alvo = evolutionTarget({
      points: { power: 5, harmony: 0, benevolence: 5 },
      reading: fraca,
      currentBranch: 'benevolence',
      evolutionStage: 'champion-benevolence',
      unlockedEvolutions: [],
    });
    expect(alvo.branch).toBe('benevolence');
    expect(alvo.stage).toBe('ultimate-benevolence');

    // A cópia antiga jogava esse mesmo save em `ultimate-harmony`.
    expect(copiaAntiga(5, 0, 5, 'champion-benevolence', [])).toBe('ultimate-harmony');
  });

  it('fallback fora do empate: escolhe um líder, nunca o `data` que perdeu', () => {
    const fraca = computeCarePattern([{ completedAt: AGORA.toISOString() }], AGORA);
    const alvo = evolutionTarget({
      points: { power: 5, harmony: 0, benevolence: 5 },
      reading: fraca,
      currentBranch: 'harmony',
      evolutionStage: 'champion-power',
      unlockedEvolutions: [],
    });
    expect(['power', 'benevolence']).toContain(alvo.branch);
    expect(alvo.branch).not.toBe('harmony');
  });

  it('líder único: atributo manda, ritmo não interfere', () => {
    const leitura = historicoConstante();
    const alvo = evolutionTarget({
      points: { power: 1, harmony: 7, benevolence: 2 },
      reading: leitura,
      currentBranch: 'power',
      evolutionStage: 'rookie',
      unlockedEvolutions: [],
    });
    expect(alvo.branch).toBe('harmony');
    expect(alvo.stage).toBe('champion-harmony');
  });

  it('sem destino: devolve o próprio estágio (é o que trava a cerimônia e o botão)', () => {
    const leitura = historicoConstante();
    const alvo = evolutionTarget({
      points: { power: 3, harmony: 0, benevolence: 0 },
      reading: leitura,
      currentBranch: 'power',
      evolutionStage: 'ultra',
      unlockedEvolutions: [],
    });
    expect(alvo.stage).toBe('ultra');
  });
});
