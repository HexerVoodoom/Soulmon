/** §385: seleção múltipla cortada pelo teto vira aviso com quantos entraram. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { habitCapPartialText } from './habitCreate';

describe('habitCapPartialText', () => {
  it('entrou tudo (ou nada pedido): sem aviso', () => {
    expect(habitCapPartialText(3, 3, false)).toBeNull();
    expect(habitCapPartialText(0, 0, true)).toBeNull();
  });
  it('cortado: EN primeiro e PT', () => {
    expect(habitCapPartialText(1, 3, false)).toBe('Limit reached: 1 of 3 habits were added');
    expect(habitCapPartialText(0, 2, true)).toBe('Limite atingido: entraram 0 de 2 hábitos');
  });
  it('App: o "Hoje" e o catálogo do onboarding avisam pelo mesmo texto', () => {
    const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    expect(app.match(/habitCapPartialText\(/g)?.length).toBe(2);
    const onb = app.slice(app.indexOf('<CatalogOnboardingFlow'), app.indexOf('markCatalogOnboardingSeen', app.indexOf('<CatalogOnboardingFlow')));
    expect(onb).toMatch(/habitCapPartialText\(entraram, pedidas\.length/);
    const hoje = app.slice(app.indexOf('onAcceptSuggestions='), app.indexOf('return novas.slice(0, criados)'));
    expect(hoje).toMatch(/habitCapPartialText\(criados, novas\.length/);
  });
});
