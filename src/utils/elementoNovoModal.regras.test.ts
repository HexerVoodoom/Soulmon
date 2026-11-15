import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { BASE_ELEMENT_IDS } from './elementDex';
import { elementoRetroativo, elementoNovoPodeAbrir, elementosNovos } from './elementoNovoModal';
import { applyElementUnlockOnEvolve } from './elementUnlockOnEvolve';

const [a] = BASE_ELEMENT_IDS;
const app = readFileSync('src/App.tsx', 'utf8');

describe('retroativo: Soulmon já evoluído com elemento ainda não desbloqueado (REGISTRO §396, dono 15/11/2026)', () => {
  it('acha o elemento do Soulmon atual quando ele não está no dex', () => {
    expect(elementoRetroativo({ potionElement: a, defeatedElements: [] as string[] })).toBe(a);
    expect(elementoRetroativo({ potionElement: a, defeatedElements: undefined })).toBe(a);
  });
  it('não acha nada quando já está no dex, é corvinho (neutro fora do catálogo) ou não há elemento', () => {
    expect(elementoRetroativo({ potionElement: a, defeatedElements: [a] })).toBeUndefined();
    expect(elementoRetroativo({ defeatedElements: [] as string[] })).toBeUndefined();
  });
  it('é no máximo 1 e idempotente: depois do desbloqueio, a próxima abertura não acha mais nada', () => {
    const antes = { potionElement: a, defeatedElements: [] as string[] };
    const depois = applyElementUnlockOnEvolve(antes);
    expect(depois.defeatedElements).toEqual([a]);
    expect(elementoRetroativo(depois)).toBeUndefined();
    // e o que entrou vira "novo" para o modal (baseline = dex da abertura, sem ele)
    expect(elementosNovos(depois.defeatedElements, new Set<string>())).toEqual([a]);
  });
  it('o App aplica o retroativo uma vez, só depois do onboarding, e NÃO o absorve em silêncio', () => {
    expect(app).toContain('elementoRetroativo(');
    expect(app).toMatch(/elementoRetroativo\([^)]*\)[\s\S]{0,400}applyElementUnlockOnEvolve/);
    // o baseline é o dex da abertura SEM o retroativo (senão o modal nunca abriria)
    expect(app).toContain('elemVistosRef.current = new Set(lista)');
  });
});

describe('luta que desbloqueia: o modal espera voltar à Home', () => {
  it('origem luta: só abre na Home; as outras origens abrem onde o jogador está', () => {
    expect(elementoNovoPodeAbrir(true, 'area:jogos')).toBe(false);
    expect(elementoNovoPodeAbrir(true, 'map')).toBe(false);
    expect(elementoNovoPodeAbrir(true, 'home')).toBe(true);
    expect(elementoNovoPodeAbrir(false, 'area:laboratorio')).toBe(true);
  });
  it('o App liga o portão na luta (handleElementsDefeated) e o usa no ready da fila', () => {
    expect(app).toContain('elementoNovoPodeAbrir(elemEsperaHome, currentView)');
    expect(app).toMatch(/handleElementsDefeated = useCallback\([\s\S]{0,700}setElemEsperaHome\(true\)/);
  });
});
