/**
 * Tamanho do Soulmon por estágio (REGISTRO §150): fatores, raridade, caixa visível e fiação nas telas.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SCALE_STAGES, STAGE_TARGET, SCALE_MIN, SCALE_MAX, BIG_ROOKIE_TARGET, RARE_BIG_ROOKIE_RATE,
  seedUnit, sizeProfileFor, targetFor, petScaleFor, petScaleStyle, scaleStageOf, fillFromRGBA, sizeSeedOf,
} from './spriteScale';

const seeds = Array.from({ length: 4000 }, (_, i) => `criatura-${i}-2026-10-20T10:00:00.000Z`);

describe('alvo por estágio', () => {
  it('padrão: rookie ≤ champion ≤ ultimate ≤ mega ≤ ultra, e o rookie é pequeno', () => {
    const t = SCALE_STAGES.map((s) => STAGE_TARGET[s]);
    for (let i = 1; i < t.length; i++) expect(t[i]).toBeGreaterThanOrEqual(t[i - 1]);
    expect(STAGE_TARGET.rookie).toBeLessThanOrEqual(0.6);
    expect(STAGE_TARGET.rookie).toBeLessThan(STAGE_TARGET.champion);
  });

  it('monotonia vale para TODO porte e toda semente (inclusive o rookie grande)', () => {
    for (const seed of seeds) {
      const perfil = sizeProfileFor(seed);
      const t = SCALE_STAGES.map((s) => targetFor(s, perfil));
      for (let i = 1; i < t.length; i++) expect(t[i]).toBeGreaterThanOrEqual(t[i - 1]);
    }
  });

  it('estágios com sufixo e entrada ruim caem na escada', () => {
    expect(scaleStageOf('champion-power')).toBe('champion');
    expect(scaleStageOf('mega-x')).toBe('mega');
    expect(scaleStageOf('ultra')).toBe('ultra');
    expect(scaleStageOf('qualquer')).toBe('rookie');
    expect(scaleStageOf(undefined)).toBe('rookie');
  });
});

describe('variação por criatura', () => {
  it('é determinística (mesma semente, mesmo porte e mesmo fator)', () => {
    for (const seed of seeds.slice(0, 200)) {
      expect(seedUnit(seed)).toBe(seedUnit(seed));
      expect(petScaleFor('rookie', seed, 0.8)).toBe(petScaleFor('rookie', seed, 0.8));
    }
    expect(sizeProfileFor('')).toBe('standard');
    expect(sizeProfileFor(undefined)).toBe('standard');
  });

  it('rookie grande é exceção rara (< 3%) mas existe', () => {
    const grandes = seeds.filter((s) => sizeProfileFor(s) === 'bigRookie').length / seeds.length;
    expect(RARE_BIG_ROOKIE_RATE).toBeLessThan(0.03);
    expect(grandes).toBeGreaterThan(0);
    expect(grandes).toBeLessThan(0.03);
  });

  it('a imensa maioria dos rookies é pequena; o grande é do tamanho de um estágio avançado', () => {
    const pequenos = seeds.filter((s) => targetFor('rookie', sizeProfileFor(s)) <= STAGE_TARGET.rookie + 1e-9).length / seeds.length;
    expect(pequenos).toBeGreaterThan(0.97);
    expect(BIG_ROOKIE_TARGET).toBeGreaterThanOrEqual(STAGE_TARGET.ultimate);
  });

  it('existe Soulmon que fica pequenininho até o mega (menor que um champion padrão)', () => {
    const tiny = seeds.find((s) => sizeProfileFor(s) === 'tiny');
    expect(tiny).toBeDefined();
    expect(targetFor('mega', 'tiny')).toBeLessThan(STAGE_TARGET.champion);
  });
});

describe('caixa visível (não o canvas)', () => {
  it('a mesma criatura cheia (fill 1) e a folgada (fill 0,5) acabam com a MESMA caixa visível', () => {
    const seed = seeds.find((s) => sizeProfileFor(s) === 'standard')!;
    const cheia = petScaleFor('champion', seed, 1) * 1;
    const folgada = petScaleFor('champion', seed, 0.6) * 0.6;
    expect(cheia * 1).toBeCloseTo(STAGE_TARGET.champion, 5);
    expect(folgada).toBeCloseTo(STAGE_TARGET.champion, 5);
  });

  it('o fator é preso a [SCALE_MIN, SCALE_MAX] e fill ruim cai no padrão', () => {
    expect(petScaleFor('ultra', 'x', 0.1)).toBeLessThanOrEqual(SCALE_MAX);
    expect(petScaleFor('rookie', 'x', 5)).toBeGreaterThanOrEqual(SCALE_MIN);
    expect(petScaleFor('rookie', 'x', NaN)).toBe(petScaleFor('rookie', 'x'));
  });

  it('fillFromRGBA mede a bbox do alfa (lado maior ÷ canvas)', () => {
    const w = 8, h = 8, data = new Uint8ClampedArray(w * h * 4);
    for (let y = 2; y <= 3; y++) for (let x = 1; x <= 4; x++) data[(y * w + x) * 4 + 3] = 255; // 4×2
    expect(fillFromRGBA(data, w, h)).toBeCloseTo(4 / 8, 5);
    expect(fillFromRGBA(new Uint8ClampedArray(w * h * 4), w, h)).toBeGreaterThan(0); // vazio → padrão
  });

  it('o estilo aplicado só escala (propriedade `scale`), com origem nos pés', () => {
    expect(petScaleStyle(0.7)).toEqual({ scale: 0.7, transformOrigin: '50% 100%' });
    expect(petScaleStyle(0.7, 'center').transformOrigin).toBe('50% 50%');
  });

  it('a semente do save vem de demoCharacterId, senão bornAt, senão createdAt', () => {
    expect(sizeSeedOf({ demoCharacterId: 'kaelen', bornAt: 'x' })).toBe('kaelen');
    expect(sizeSeedOf({ bornAt: '2026-10-01' })).toBe('2026-10-01');
    expect(sizeSeedOf({ createdAt: 'c' })).toBe('c');
    expect(sizeSeedOf({})).toBe('');
  });
});

/* ── Fiação: toda tela que desenha o bicho do jogador usa o dono único ── */
const RAIZ = join(__dirname, '..', '..');
const ler = (rel: string) => readFileSync(join(RAIZ, rel), 'utf8');

describe('toda tela que desenha o bicho do jogador usa o dono único', () => {
  const TELAS = [
    'src/components/CompanionHUD.tsx',
    'src/components/PetPage.tsx',
    'src/components/DungeonGame.tsx',
    'src/components/ArenaGame.tsx',
    'src/components/NightmareBattle.tsx',
    'src/components/DuelScreen.tsx',
    'src/components/TournamentPage.tsx',
  ];
  /* Rodada 4 (N2): o porte reduzido vale SÓ na Home e nos combates; nos minigames o bicho tem o tamanho cheio. */
  const MINIGAMES = [
    'src/components/Match3Game.tsx',
    'src/components/DinoGame.tsx',
    'src/components/GoodDream.tsx',
    'src/components/mente/RevisaoGame.tsx',
    'src/components/mente/EcoGame.tsx',
    'src/components/mente/BolhasGame.tsx',
    'src/components/mente/PatchesGame.tsx',
    'src/components/mente/ZipGame.tsx',
    'src/components/refugio/RespiracaoGame.tsx',
  ];
  it.each(MINIGAMES)('%s NÃO reduz o bicho (tamanho cheio)', (rel) => {
    const src = ler(rel);
    expect(src).not.toMatch(/usePetScale/);
    expect(src).toMatch(/PET_SCALE_MINIGAME = 1/);
  });
  it.each(TELAS)('%s lê o fator de usePetScale', (rel) => {
    const src = ler(rel);
    expect(src).toMatch(/usePetScale/);
    // Escala pelo dono: nada de `width: 70`-tipo por conta da tela; o fator vem do hook.
    expect(src).not.toMatch(/STAGE_TARGET|SCALE_MIN|BIG_ROOKIE_TARGET/);
  });

  it('o palco de batalha escala só o lutador que traz `scale` (inimigos ficam como estão)', () => {
    const src = ler('src/components/games/BattleStage.tsx');
    expect(src).toMatch(/f\.scale !== undefined \? petScaleStyle\(f\.scale\)/);
  });

  it('nenhuma tela redeclara a escada de portes (dono único: utils/spriteScale.ts)', () => {
    for (const rel of [...TELAS, ...MINIGAMES]) expect(ler(rel)).not.toMatch(/RARE_BIG_ROOKIE_RATE|sizeProfileFor|targetFor\(/);
  });

  it('o App escreve a semente do save em render', () => {
    expect(ler('src/App.tsx')).toMatch(/setPetSizeSeed\(sizeSeedOf\(gameState\)\)/);
  });
});

describe('contrato do rookie a 50% NO RENDER (REGISTRO §181)', () => {
  it('rookie = 50% do alvo que teria sem a regra; os outros estágios = 100% (inalterados)', async () => {
    const m = await import('./spriteScale');
    expect(m.ROOKIE_RENDER_RATIO).toBe(0.5);
    expect(m.STAGE_TARGET.rookie).toBeCloseTo(m.ROOKIE_BASE_TARGET * 0.5, 10);
    expect(m.STAGE_TARGET).toMatchObject({ champion: 0.66, ultimate: 0.78, mega: 0.9, ultra: 0.96 });
  });
  it('o fator vem do estágio e da caixa visível, não do tamanho do canvas: mesmo bicho, canvas folgado ou justo → mesma altura na tela', async () => {
    const m = await import('./spriteScale');
    // canvas justo (enche 100%) e canvas folgado (enche 80%): lado visível final = fator × preenchimento = alvo
    for (const fill of [1, 0.8]) {
      expect(m.petScaleFor('rookie', '', fill) * fill).toBeCloseTo(m.STAGE_TARGET.rookie, 6);
      expect(m.petScaleFor('champion', '', fill) * fill).toBeCloseTo(m.STAGE_TARGET.champion, 6);
    }
  });
});

describe('ancoragem pelo pé', () => {
  it('bottomFromRGBA acha a última linha opaca; vazio = padrão', async () => {
    const m = await import('./spriteScale');
    const w = 4, h = 10, d = new Uint8Array(w * h * 4);
    d[(6 * w + 1) * 4 + 3] = 255; // última linha opaca = y 6
    expect(m.bottomFromRGBA(d, w, h)).toBeCloseTo(0.7, 6);
    expect(m.bottomFromRGBA(new Uint8Array(w * h * 4), w, h)).toBe(m.DEFAULT_BOTTOM);
  });
  it('feetShiftPx: pé já no padrão = 0; padding embaixo desce; escala reduz o vão; preso a ±45%', async () => {
    const m = await import('./spriteScale');
    expect(m.feetShiftPx(m.DEFAULT_BOTTOM, 1, 200)).toBe(0);
    expect(m.feetShiftPx(0.7, 1, 200)).toBe(48); // (0,3 − 0,06) × 200
    expect(m.feetShiftPx(0.7, 0.5, 200)).toBe(18); // (0,15 − 0,06) × 200
    expect(m.feetShiftPx(0.2, 1, 200)).toBe(90);
    expect(m.feetShiftPx(NaN, 1, 200)).toBe(0);
    expect(m.feetShiftPx(0.7, 1, 0)).toBe(0);
  });
});
