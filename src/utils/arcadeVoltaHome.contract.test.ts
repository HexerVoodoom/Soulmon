import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const app = readFileSync(join(__dirname, '..', 'App.tsx'), 'utf8');

/**
 * §487 (correção): o jogo aberto pelo Fliperama volta à HOME, não ao prédio/mapa. O `popstate` do `App` fechava a camada aberta (a folha do
 * Salão, que reabre ao sair do jogo) ou seguia o grafo (de uma área, o "voltar" leva ao MAPA). A volta do Fliperama tem de ser tratada ANTES.
 */
describe('volta do Fliperama à Home (contrato do popstate)', () => {
  it('o popstate trata a volta do Fliperama antes de fechar camada e antes do grafo', () => {
    const iPop = app.indexOf('const onPop = () => {');
    const iFlip = app.indexOf('voltaDoFlipperamaRef.current', iPop);
    const iLayer = app.indexOf('closeTopBackLayer()', iPop);
    const iGrafo = app.indexOf('viewBack(currentViewRef.current)', iPop);
    expect(iPop).toBeGreaterThan(0);
    expect(iFlip).toBeGreaterThan(iPop);
    expect(iFlip).toBeLessThan(iLayer);
    expect(iFlip).toBeLessThan(iGrafo);
    expect(app.slice(iFlip, iLayer)).toContain("setCurrentView('home')");
  });
  it('sair do jogo do Fliperama arma a volta e desfaz a navegação', () => {
    const i = app.indexOf('const voltarAHomeDoJogo = useCallback');
    const corpo = app.slice(i, i + 700);
    expect(corpo).toContain('voltaDoFlipperamaRef.current = true');
    expect(corpo).toContain('window.history.back()');
    expect(corpo).toContain("setCurrentView('home')");
  });
});
