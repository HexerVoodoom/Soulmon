import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { BASE_ELEMENT_IDS } from './elementDex';
import { CURATED_ELEMENT_IDS } from './elementosCurados';
import { elementoRetroativo, elementoNovoPodeAbrir, elementosNovos, emAtividade, componentesDoElemento, ELEMENTO_NOVO_COPY } from './elementoNovoModal';
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

describe('gate de atividade: a carta só abre no FIM da atividade (REGISTRO §401)', () => {
  it('emAtividade: Arena, Exploração e Jogos sim; Home, Mapa, Mercado e menu não', () => {
    expect(emAtividade('area:arena')).toBe(true);
    expect(emAtividade('area:exploracao')).toBe(true);
    expect(emAtividade('area:jogos')).toBe(true);
    for (const v of ['home', 'map', 'area:mercado', 'area:laboratorio', 'page:settings']) expect(emAtividade(v)).toBe(false);
  });
  it('descoberto numa atividade: espera Home/Mapa/menu, nunca abre dentro dela', () => {
    expect(elementoNovoPodeAbrir(true, 'area:arena')).toBe(false);
    expect(elementoNovoPodeAbrir(true, 'area:jogos')).toBe(false);
    expect(elementoNovoPodeAbrir(true, 'map')).toBe(true);
    expect(elementoNovoPodeAbrir(true, 'home')).toBe(true);
  });
  it('evolução e Feira: abrem onde o jogador está, exceto dentro de uma atividade (então esperam)', () => {
    expect(elementoNovoPodeAbrir(false, 'area:laboratorio')).toBe(true);
    expect(elementoNovoPodeAbrir(false, 'home')).toBe(true);
    expect(elementoNovoPodeAbrir(false, 'area:arena')).toBe(false);
  });
  it('o App usa o portão e só liga a bandeira na luta; a carta espera TODA a sequência da evolução', () => {
    expect(app).toContain('elementoNovoPodeAbrir(elemEsperaSaida, currentView)');
    expect(app).toMatch(/handleElementsDefeated = useCallback\([\s\S]{0,700}setElemEsperaSaida\(true\)/);
    expect(app).toMatch(/elementoNovo: [^\n]*evolutionCeremony === null[^\n]*evolveModalStage === null[^\n]*evoStatsShown === null[^\n]*evoRecap === null/);
  });
});

describe('sem frase de poção na carta (dono, 15/11/2026)', () => {
  it('nenhum copy nem componente do modal fala de poção ou de Laboratório', () => {
    const fontes = [readFileSync('src/utils/elementoNovoModal.ts', 'utf8'), readFileSync('src/components/ElementosNovosModal.tsx', 'utf8')].join('\n');
    expect(fontes).not.toMatch(/poç[aã]o|potion|laborat|craft/i);
    expect(JSON.stringify(ELEMENTO_NOVO_COPY)).not.toMatch(/poç|potion|laborat|craft|invite/i);
  });
});

describe('componentesDoElemento', () => {
  it('base = nenhum; derivado = o par; curado = sua receita (até 4)', () => {
    expect(componentesDoElemento(a)).toEqual([]);
    expect(componentesDoElemento('pantano')).toEqual(['agua', 'terra']);
    expect(Math.max(...CURATED_ELEMENT_IDS.map(i => componentesDoElemento(i).length))).toBe(4);
  });
});
