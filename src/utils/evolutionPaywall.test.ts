import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evolutionPaywalled } from './evolutionPaywall';

describe('D8 — paywall da evolução', () => {
  it('flag desligado: nunca trava (idêntico ao atual)', () => {
    for (const s of ['bb', 'rookie', 'champion-power'])
      expect(evolutionPaywalled({ velado: false, accountTier: 'demo', evolutionStage: s })).toBe(false);
  });
  it('grátis no BB evolui para rookie', () => {
    expect(evolutionPaywalled({ velado: true, accountTier: 'demo', evolutionStage: 'bb' })).toBe(false);
  });
  it('grátis no rookie (e acima) NÃO evolui com flag ligado', () => {
    for (const s of ['rookie', 'champion-power', 'ultimate-harmony'])
      expect(evolutionPaywalled({ velado: true, accountTier: 'demo', evolutionStage: s })).toBe(true);
  });
  it('pagante evolui; tier ausente (save antigo) falha aberto', () => {
    expect(evolutionPaywalled({ velado: true, accountTier: 'paid', evolutionStage: 'rookie' })).toBe(false);
    expect(evolutionPaywalled({ velado: true, accountTier: undefined, evolutionStage: 'rookie' })).toBe(false);
  });
  it('paridade com o servidor: geração de formas exige conta paga', () => {
    const src = readFileSync(resolve(__dirname, '../../functions/api/generate-sprite.js'), 'utf8');
    expect(src).toContain('paid-tier-required');
  });
  it('App usa a fonte única nos três pontos', () => {
    const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    expect((app.match(/evolutionPaywalled\(/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });
});
