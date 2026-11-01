import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { generateOracle } from '../test/oracleSync';
import { setVeladoTester } from './bbStage';

const INPUT = { fullName: 'Maria da Silva', birthDate: '1990-08-15', birthTime: '14:30', birthPlace: 'São Paulo, Brasil' };
afterEach(() => setVeladoTester(false));

describe('prompt do estágio bb (D31)', () => {
  it('interruptor desligado: o resultado do oráculo é idêntico ao de antes (sem bbPrompts)', () => {
    expect(generateOracle(INPUT).creature.bbPrompts).toBeUndefined();
  });
  it('ligado: bebê redondo, cláusula anti-franquia, fallback sem referências', () => {
    setVeladoTester(true);
    const on = generateOracle(INPUT);
    const bb = on.creature.bbPrompts!;
    expect(bb.imagePrompt).toContain('a tiny newborn baby creature, very round and chubby, soft blob-like body');
    expect(bb.imagePrompt).toContain('Baby stage: the smallest, cutest form');
    expect(bb.imagePrompt).toContain('Do not copy any existing franchise character');
    expect(bb.imagePrompt).toContain('Digimon'); // 1ª tentativa cita referências de gênero
    expect(bb.imagePromptFallback).not.toContain('Digimon');
    expect(bb.imagePromptFallback).toContain('Do not copy any existing franchise character');
  });
});

describe('D32: o upgrade não gera BB', () => {
  it('handleUpgradeRevealed e a geração de formas não tocam no BB exclusivo', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const ini = app.indexOf('const handleUpgradeRevealed');
    const fim = app.indexOf('useCallback', ini + 40);
    const corpo = app.slice(ini, ini + 6000);
    expect(corpo).not.toMatch(/gerarBBExclusivo|bbPrompts|obterBBExclusivo|formId: 'bb'/);
    expect(fim).toBeGreaterThan(ini);
    // o único chamador de `gerarBBExclusivo` é o nascimento (obterBBExclusivo), nunca o upgrade
    expect(app.match(/gerarBBExclusivo\(/g)).toHaveLength(1);
  });
});
