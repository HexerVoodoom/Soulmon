/**
 * CONTRATO DE FONTE — admin e corvinho (29/09/2026).
 *
 * 1. A flag `admin` NUNCA é gravada: nem no save (`GameState`), nem no
 *    localStorage. A fonte é a resposta do servidor a cada abertura.
 * 2. Todo ponto que desenha o PET DO JOGADOR resolve a arte pela linha do save
 *    (`spriteLineOf` → `petLine`), e não por `demoCharacterId` cru — senão o
 *    corvinho some naquela superfície e ninguém vê.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(__dirname, '..', '..');
const ler = (rel: string) => readFileSync(join(RAIZ, rel), 'utf8');

describe('admin nunca persiste', () => {
  it('adminFlag.ts não toca storage', () => {
    const src = ler('src/utils/adminFlag.ts').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    expect(src).not.toMatch(/localStorage|sessionStorage|writeLocal|writeFlag|safeStorage|indexedDB/);
  });

  it('GameState não tem campo admin; storageKeys não tem chave de admin', () => {
    expect(ler('src/contexts/GameStateContext.tsx')).not.toMatch(/^\s*(admin|isAdmin|gm)\??\s*:/m);
    expect(ler('src/utils/storageKeys.ts')).not.toMatch(/admin/i);
  });

  it('App.tsx não grava admin no estado nem no aparelho', () => {
    const app = ler('src/App.tsx');
    expect(app).not.toMatch(/\badmin\s*:/);
    expect(app).not.toMatch(/writeLocal\([^)]*admin/i);
    expect(app).toMatch(/setAdminFlag\(adminFromEntitlement\(ent\)\)/);
  });
});

describe('arte do pet resolve pela linha do save em todo ponto que desenha', () => {
  it('App.tsx: nenhum sprite do pet por demoCharacterId cru', () => {
    const app = ler('src/App.tsx');
    expect(app).not.toMatch(/getSpriteForStage\(gameState\.evolutionStage,\s*gameState\.demoCharacterId\)/);
    expect(app).not.toMatch(/demoCharacterId=\{gameState\.demoCharacterId\}/);
    expect(app).toMatch(/const petLine = spriteLineOf\(gameState\)/);
    expect(app).toMatch(/petIsCorvo \? emptySpriteLibrary\(\)/);
    expect(app).toMatch(/petLine,\r?\n\s*trophies/);
  });

  it('desktop: os DOIS snapshots (fetch e save em mãos) usam spriteLineOf', () => {
    const src = ler('desktop/renderer/src/cloudSync.ts');
    expect(src.match(/demoCharacterId: spriteLineOf\(/g)?.length).toBe(2);
  });

  it.each([
    ['src/components/PetPage.tsx', /getSpriteForStage\(.*demoCharacterId\)/],
    ['src/components/EvolutionPath.tsx', /getSpriteForStage\(currentStageId, demoCharacterId\)/],
    ['src/components/CompanionHUD.tsx', /getSpriteForStage\(evolutionStage, demoCharacterId\)/],
    ['src/components/EvolutionCeremony.tsx', /getSpriteForStage\(toStage, demoCharacterId\)/],
    ['src/components/DungeonGame.tsx', /getSpriteForStage\(evolutionStage, demoCharacterId, 256\)/],
    ['src/components/ArenaGame.tsx', /getSpriteForStage\(evolutionStage, demoCharacterId, 256\)/],
    ['src/components/DinoGame.tsx', /getSpriteForStage\(evolutionStage, demoCharacterId, 256\)/],
    ['src/components/NightmareBattle.tsx', /getSpriteForStage\(petStage, demoCharacterId, 256\)/],
    ['src/components/TournamentPage.tsx', /getSpriteForStage\(petStage, petLine, 256\)/],
    ['desktop/renderer/src/cloudSync.ts', /demoCharacterId: spriteLineOf\(/],
  ])('%s', (rel, re) => {
    expect(ler(rel)).toMatch(re);
  });

  it('sprites.ts delega o corvo ao dono único', () => {
    const s = ler('src/utils/sprites.ts');
    expect(s).toMatch(/if \(demoCharacterId === CORVO_LINE\) return corvoSpriteFor\(key, size\)/);
    expect(s).toMatch(/if \(demoCharacterId === CORVO_LINE\) return null;/);
  });
});
