/**
 * A FAIXA DA ARENA (11/10/2026): derivada das duas camadas da trilha (nenhum asset novo) + percussão procedural.
 * Trava os FATOS que a mantêm em fase com as camadas e o que a faz ser a "outra música" (e não um ruído).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ataquesDaArena, BPM_DA_ARENA, DURACAO_DO_LOOP_DA_ARENA_S, PADRAO_ARENA, sintetizarPercussaoDaArena } from './trilhaArena';
import { BPM_DA_TRILHA, CAMADAS_DA_TRILHA, COMPASSOS_DA_TRILHA, RAZAO_DA_ARENA } from './sonsAssets';

describe('o manifesto das camadas bate com o BPM e os compassos declarados', () => {
  it.each(Object.keys(CAMADAS_DA_TRILHA) as Array<keyof typeof CAMADAS_DA_TRILHA>)('%s: duração = 12 compassos de 4 tempos a 100 BPM', (n) => {
    expect(CAMADAS_DA_TRILHA[n].duracaoS).toBeCloseTo((60 / BPM_DA_TRILHA) * 4 * COMPASSOS_DA_TRILHA, 6);
  });
});

describe('o loop da percussão fecha no MESMO ponto das camadas aceleradas (em fase, sem relógio)', () => {
  it('o loop da percussão = a duração das camadas ÷ a razão', () => {
    expect(BPM_DA_ARENA).toBeCloseTo(BPM_DA_TRILHA * RAZAO_DA_ARENA, 9);
    for (const c of Object.values(CAMADAS_DA_TRILHA)) {
      expect(DURACAO_DO_LOOP_DA_ARENA_S).toBeCloseTo(c.duracaoS / RAZAO_DA_ARENA, 6);
    }
  });

  it('o buffer tem exatamente o loop inteiro e é determinístico (mesma entrada, mesmos bytes)', () => {
    const a = sintetizarPercussaoDaArena(8000);
    const b = sintetizarPercussaoDaArena(8000);
    expect(a.length).toBe(Math.round(DURACAO_DO_LOOP_DA_ARENA_S * 8000));
    expect(Array.from(a.slice(0, 2000))).toEqual(Array.from(b.slice(0, 2000)));
  });
});

describe('a percussão é uma levada de verdade', () => {
  it('bumbo nos tempos 1 e 3 (+ o contratempo), caixa nos 2 e 4, e a virada no último compasso de cada quatro', () => {
    const at = ataquesDaArena();
    const passo = 60 / BPM_DA_ARENA / 2;
    const bumbosPorCompasso = PADRAO_ARENA.bumbo.reduce<number>((a, b) => a + b, 0);
    expect(at.bumbo.length).toBe(bumbosPorCompasso * COMPASSOS_DA_TRILHA);
    expect(at.chimbal.length).toBe(8 * COMPASSOS_DA_TRILHA);
    // o 1º compasso: caixa nos passos 2 e 6 (tempos 2 e 4)
    expect(at.caixa.slice(0, 2).map(t => Math.round(t / passo))).toEqual([2, 6]);
    // o 4º compasso (c=3) troca a caixa pela virada (passos 5, 6, 7)
    const noCompasso4 = at.caixa.filter(t => t >= 3 * 8 * passo - 1e-9 && t < 4 * 8 * passo - 1e-9).map(t => Math.round(t / passo) - 24);
    expect(noCompasso4).toEqual([5, 6, 7]);
  });

  it('tem energia nos ataques e silêncio entre eles; o pico é o declarado (o nível relativo é de loudness.ts)', () => {
    const taxa = 8000;
    const x = sintetizarPercussaoDaArena(taxa);
    let pico = 0; for (const v of x) pico = Math.max(pico, Math.abs(v));
    expect(pico).toBeCloseTo(0.5, 3);
    const primeiroBumbo = Math.round(ataquesDaArena().bumbo[0] * taxa);
    let e = 0; for (let i = primeiroBumbo; i < primeiroBumbo + 400; i++) e += x[i] * x[i];
    expect(e).toBeGreaterThan(1);
  });

  it('é código, não asset: nenhum arquivo, hash ou byte novo (S9/S6) e nenhuma melodia (nada com altura que brigue com as camadas)', () => {
    const fonte = readFileSync(join(__dirname, 'trilhaArena.ts'), 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(fonte).not.toMatch(/sha256|\.webm|\.m4a|fetch\(/);
    expect(fonte).not.toMatch(/Math\.random/); // determinístico
  });
});
