/**
 * Gate dos 7 efeitos de combate (D-86..D-92, 19/10/2026): duração, ausência de clipping, loudness no alvo da categoria,
 * determinismo, mapeamento evento→efeito e mudo. A ESCUTA humana (gate S8) não é medida aqui — está em
 * `scripts/render-sfx-combate.mjs` (WAVs para o dono ouvir).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  NOMES_SFX_DE_COMBATE, PICO_NOMINAL, SFX_DE_COMBATE, renderizarSfx, sfxNoAlvo, type NomeSfxCombate,
} from './sfxCombate';
import { ALVO_LUFS_M, CATEGORIA_DO_SOM, OFFSET_MAX_DB, OFFSET_POR_SOM_DB, TETO_DBTP, TOLERANCIA_LU } from './loudness';
import { lufsMMax, picoDbfs, truePeakDbtp } from '../test/lufsM';
import * as sounds from './sounds';
import { esquecerJanelaDeCoincidencia } from './audioBus';

const SR = 48000;

describe('os 7 efeitos de combate — manifesto', () => {
  it('são exatamente os 7 do pedido, um por ID D-86..D-92, todos "procedural próprio"', () => {
    expect([...NOMES_SFX_DE_COMBATE].sort()).toEqual(
      ['playAttack', 'playAttackRanged', 'playCharge', 'playDefeat', 'playDefend', 'playSpecial', 'playVictory'],
    );
    expect(NOMES_SFX_DE_COMBATE.map(n => SFX_DE_COMBATE[n].id).sort()).toEqual(['D-86', 'D-87', 'D-88', 'D-89', 'D-90', 'D-91', 'D-92']);
    for (const n of NOMES_SFX_DE_COMBATE) {
      expect(SFX_DE_COMBATE[n].origem, n).toBe('procedural próprio');
      expect(CATEGORIA_DO_SOM[n], `${n}: R-CAT (o evento é combate)`).toBe('arcade');
      expect(typeof OFFSET_POR_SOM_DB[n], `${n} tem offset medido`).toBe('number');
    }
  });

  it('o evento → efeito: cada função `play*` do combate existe em sounds.ts', () => {
    for (const n of NOMES_SFX_DE_COMBATE) expect(typeof (sounds as Record<string, unknown>)[n], n).toBe('function');
  });
});

describe.each(NOMES_SFX_DE_COMBATE)('%s', (nome: NomeSfxCombate) => {
  const meta = SFX_DE_COMBATE[nome];
  const nominal = renderizarSfx(nome, SR);
  const noAlvo = sfxNoAlvo(nome, SR, OFFSET_POR_SOM_DB[nome]);

  it('duração: a declarada no manifesto e dentro do teto do pedido (efeitos ≤ 1,2 s; vitória/derrota ≤ 2 s)', () => {
    expect(nominal.length / SR).toBeCloseTo(meta.duracaoS, 2);
    expect(meta.duracaoS).toBeLessThanOrEqual(meta.tetoS);
    expect(meta.tetoS).toBe(nome === 'playVictory' || nome === 'playDefeat' ? 2 : 1.2);
  });

  it('é determinístico (o mesmo sinal em toda renderização) e não tem NaN', () => {
    const outra = renderizarSfx(nome, SR);
    expect(outra).toEqual(nominal);
    expect(nominal.every(Number.isFinite)).toBe(true);
  });

  it('sem clique: começa e termina em silêncio, e não é um sinal vazio', () => {
    expect(Math.abs(nominal[0])).toBeLessThan(1e-3);
    expect(Math.abs(nominal[nominal.length - 1])).toBeLessThan(1e-3);
    expect(picoDbfs(nominal)).toBeCloseTo(20 * Math.log10(PICO_NOMINAL), 2);
  });

  it('sem clipping: pico (true peak, 4×) ≤ −1 dBTP já com o offset de produção', () => {
    expect(picoDbfs(noAlvo)).toBeLessThanOrEqual(TETO_DBTP);
    expect(truePeakDbtp(noAlvo)).toBeLessThanOrEqual(TETO_DBTP);
  });

  it('loudness: o buffer de produção cai no alvo da categoria (LUFS-M máx., ±tolerância do projeto)', () => {
    const medido = lufsMMax(noAlvo, SR);
    expect(Math.abs(medido - ALVO_LUFS_M[CATEGORIA_DO_SOM[nome]])).toBeLessThanOrEqual(TOLERANCIA_LU);
    expect(Math.abs(OFFSET_POR_SOM_DB[nome])).toBeLessThanOrEqual(OFFSET_MAX_DB);
  });
});

describe('o medidor (src/test/lufsM.ts) é o MESMO do arnês antigo', () => {
  it('reproduz o `playFeed`: dois `square` a 0,12 medem −25,39 LUFS-M (= −19,00 com o offset 6,39 de loudness.ts)', () => {
    // O `square` do Chrome é uma PeriodicWave NORMALIZADA ao pico 1: o overshoot de Gibbs da soma de harmônicos (≈1,179) é
    // dividido, o que baixa o sinal em ≈1,43 dB em relação à série de Fourier crua.
    const NORMALIZACAO_CHROME = 1 / 1.179;
    const x = new Float32Array(Math.round(0.16 * SR));
    const sq = (f: number, t0: number, d: number) => {
      for (let i = 0; i < d * SR; i++) {
        const t = i / SR;
        let s = 0;
        for (let k = 1; k * f < SR / 2; k += 2) s += Math.sin(2 * Math.PI * k * f * t) / k;
        const env = Math.min(1, t / 0.005, (d - t) / 0.02);
        x[Math.round(t0 * SR) + i] += 0.12 * env * s * (4 / Math.PI) * NORMALIZACAO_CHROME;
      }
    };
    sq(440, 0, 0.06); sq(330, 0.07, 0.09);
    expect(lufsMMax(x, SR) + OFFSET_POR_SOM_DB.playFeed).toBeCloseTo(ALVO_LUFS_M.cuidado, 0); // ±0,5 dB: o medidor é o do arnês antigo, não outro
  });
});

describe('mudo e gesto: o interruptor de Efeitos silencia os 7', () => {
  const param = () => ({ value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} });
  let contextos = 0;
  let fontes: number[] = [];
  beforeEach(() => {
    contextos = 0; fontes = [];
    const dados = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => dados.get(k) ?? null, setItem: (k: string, v: string) => { dados.set(k, String(v)); },
      removeItem: (k: string) => { dados.delete(k); }, clear: () => dados.clear(), key: () => null, length: 0,
    });
    class Ctx {
      currentTime = 0; sampleRate = 48000; destination = {};
      constructor() { contextos++; }
      createBuffer(_c: number, length: number) { return { length, duration: length / 48000, getChannelData: () => new Float32Array(length) }; }
      createBufferSource() { return { buffer: null as unknown, connect: () => {}, start: () => { fontes.push(1); }, stop: () => {} }; }
      createGain() { return { gain: param(), connect: () => {} }; }
      createBiquadFilter() { return { type: '', Q: { value: 0 }, frequency: param(), connect: () => {} }; }
      createOscillator() { return { type: '', frequency: param(), connect: () => {}, start: () => {}, stop: () => {} }; }
      close() { return Promise.resolve(); }
    }
    vi.stubGlobal('window', { AudioContext: Ctx });
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('MUDO (`SOUND_MUTED`): nenhum dos 7 constrói contexto nem inicia fonte', () => {
    sounds.setMuted(true);
    for (const n of NOMES_SFX_DE_COMBATE) (sounds as unknown as Record<string, () => void>)[n]();
    expect(contextos).toBe(0);
    expect(fontes).toEqual([]);
  });

  it('CONTRAPROVA: ligado, cada um inicia exatamente UMA fonte (buffer procedural no barramento)', () => {
    sounds.setMuted(false);
    for (const n of NOMES_SFX_DE_COMBATE) {
      esquecerJanelaDeCoincidencia();
      const antes = fontes.length;
      (sounds as unknown as Record<string, () => void>)[n]();
      expect(fontes.length - antes, n).toBe(1);
    }
  });

  it('o fonte de sounds.ts não tem alvo de loudness escrito à mão para o combate (footgun 9)', () => {
    const fonte = readFileSync(join(__dirname, 'sounds.ts'), 'utf-8');
    const bloco = fonte.slice(fonte.indexOf('O SOM DO COMBATE'), fonte.indexOf('O SOM DO LEVEL UP'));
    expect(bloco).not.toMatch(/-\d+(\.\d+)?\s*(LUFS|dB)/);
    expect(bloco).toContain('OFFSET_POR_SOM_DB');
  });
});
