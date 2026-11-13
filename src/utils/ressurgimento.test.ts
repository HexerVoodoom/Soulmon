import { describe, it, expect } from 'vitest';
import { ACTIVITY_CATALOG } from '../data/activityCatalog';
import { RESSURGIMENTO_ITEMS } from '../data/ressurgimentoCatalog';
import { recommendStarterSet } from './recommend';
import { PATH_COPY, PATH_TITLE, PATH_HINT } from './purposePaths';
import { PURPOSE_PATHS, emptyPurpose, sanitizePurpose, setPath } from './purpose';
import {
  RESSURG_ACTIVE_CAP, RESSURG_BASE_IDS, RESSURG_COPY, RESSURG_STEP, SUPPORT_CARD_MAX_DISMISSALS,
  dismissSupportCard, ressurgInitialSet, ressurgNextSuggestions, showSupportCard, weeksOnPath,
} from './ressurgimento';

// Vetos da pesquisa (§3): rótulo clínico, promessa, culpa, pressão de rede, dieta/peso/horas de sono.
const VETOS = /depress|burnout|deprimid|vai melhorar|cura\b|curar|trata\b|tratar|tratamento|terapia|funciona\b|comprovad|falh|fracass|culp|você precisa|não fique sozinho|dieta|jejum|caloria|emagrec|detox|peso\b|horas de sono|\bdepress|burn-?out|will get better|\bcures?\b|\btreat|therapy|\bworks\b|proven|failed|failure|guilt|you need to|do not be alone|\bdiet\b|fasting|calori|weight|detox|hours of sleep/i;

const byId = new Map(ACTIVITY_CATALOG.map(i => [i.id, i]));

describe('lista-base do Ressurgimento', () => {
  it('21 ids únicos (os 22 cuidados, com a arrumada repetida), todos existem no catálogo, nenhum de TCC', () => {
    expect(RESSURG_BASE_IDS).toHaveLength(21);
    for (const id of RESSURG_BASE_IDS) expect(byId.has(id), id).toBe(true);
    expect(RESSURG_BASE_IDS).not.toContain('mente-registro-pensamentos');
    expect(RESSURG_BASE_IDS).not.toContain('mente-exposicao-leve');
  });

  it('os 10 `ressurg-*` existem no catálogo, têm 3 níveis, nível 1 de esforço 1 e ficam fora do starter dos outros caminhos', () => {
    expect(RESSURGIMENTO_ITEMS).toHaveLength(10);
    for (const it of RESSURGIMENTO_ITEMS) {
      expect(it.id.startsWith('ressurg-')).toBe(true);
      expect(byId.get(it.id)).toBe(it);
      expect(it.levels).toHaveLength(3);
      expect(it.levels[0].effort).toBe(1);
      expect(it.pathOnly).toBe('ressurgimento');
    }
    for (const areas of [['corpo'], ['casa'], ['relacoes'], ['corpo', 'casa', 'relacoes']] as const) {
      const set = recommendStarterSet({ areas: [...areas] as never, struggles: ['comecar', 'energia'] as never, strengths: [] }, ACTIVITY_CATALOG);
      expect(set.some(i => i.id.startsWith('ressurg-'))).toBe(false);
    }
  });

  it('linguagem e vetos: nenhum texto do caminho carrega rótulo clínico, promessa, culpa, dieta, peso ou horas de sono (PT e EN)', () => {
    const textos: string[] = [];
    for (const it of RESSURGIMENTO_ITEMS) {
      textos.push(it.name.pt, it.name.en, it.why.pt, it.why.en, it.anchorSuggestion?.pt ?? '', it.anchorSuggestion?.en ?? '');
      for (const l of it.levels) textos.push(l.target.pt, l.target.en);
    }
    for (const c of Object.values(RESSURG_COPY)) textos.push(c.pt, c.en);
    for (const c of Object.values(PATH_COPY)) textos.push(c.name.pt, c.name.en, c.text.pt, c.text.en);
    textos.push(PATH_TITLE.pt, PATH_TITLE.en, PATH_HINT.pt, PATH_HINT.en);
    for (const t of textos) expect(t, t).not.toMatch(VETOS);
    for (const it of RESSURGIMENTO_ITEMS) {
      expect(it.name.pt && it.name.en && it.why.pt && it.why.en).toBeTruthy();
      for (const l of it.levels) expect(l.target.pt && l.target.en).toBeTruthy();
    }
  });

  it('as 3 cartas têm nome e texto nos dois idiomas, e o nome do caminho não rotula a pessoa', () => {
    expect(PURPOSE_PATHS).toEqual(['ambicao', 'satisfacao', 'ressurgimento']);
    for (const p of PURPOSE_PATHS) { expect(PATH_COPY[p].name.pt && PATH_COPY[p].name.en && PATH_COPY[p].text.pt && PATH_COPY[p].text.en).toBeTruthy(); }
    expect(PATH_COPY.ressurgimento.text.pt).toBe('Quero me reerguer.');
  });
});

describe('entrada gradual', () => {
  it('o conjunto inicial tem 3-4 itens diários de 2 minutos (nível 1)', () => {
    const ini = ressurgInitialSet(ACTIVITY_CATALOG);
    expect(ini.length).toBeGreaterThanOrEqual(3);
    expect(ini.length).toBeLessThanOrEqual(4);
    expect(ini.map(i => i.id)).toEqual(['corpo-beber-agua', 'ressurg-comer-algo', 'ressurg-luz-do-dia', 'ressurg-dentes']);
    for (const i of ini) expect(i.levels[0].effort).toBe(1);
  });

  it('depois do inicial entra pouco por vez (no máximo 2) e só da semana certa; nada de semanal no primeiro conjunto', () => {
    const ativos = new Set(ressurgInitialSet(ACTIVITY_CATALOG).map(i => i.id));
    expect(ressurgNextSuggestions(ACTIVITY_CATALOG, ativos, 0)).toEqual([]);
    const s2 = ressurgNextSuggestions(ACTIVITY_CATALOG, ativos, 2);
    expect(s2.length).toBeLessThanOrEqual(RESSURG_STEP);
    expect(s2.map(i => i.id)).toEqual(['ressurg-cama', 'relacoes-mensagem']);
    const semanaisCedo = ressurgNextSuggestions(ACTIVITY_CATALOG, ativos, 2).filter(i => ['ressurg-aparencia', 'ressurg-lixo', 'casa-arrumar-10min', 'relacoes-tempo-com-alguem'].includes(i.id));
    expect(semanaisCedo).toEqual([]);
    for (const w of [2, 4, 6, 10]) for (const i of ressurgNextSuggestions(ACTIVITY_CATALOG, ativos, w)) expect(RESSURG_BASE_IDS).toContain(i.id);
  });

  it('respeita o teto de 7 ativos e não repete o que já está ativo', () => {
    const sete = new Set(RESSURG_BASE_IDS.slice(0, RESSURG_ACTIVE_CAP));
    expect(ressurgNextSuggestions(ACTIVITY_CATALOG, sete, 20)).toEqual([]);
    const seis = new Set(RESSURG_BASE_IDS.slice(0, RESSURG_ACTIVE_CAP - 1));
    const s = ressurgNextSuggestions(ACTIVITY_CATALOG, seis, 20);
    expect(s).toHaveLength(1);
    expect(seis.has(s[0].id)).toBe(false);
  });
});

describe('o caminho e a rede de apoio', () => {
  it('trocar de carta é livre, não apaga nada e só guarda o dia da escolha', () => {
    let p = setPath(undefined, 'ambicao', new Date(2026, 10, 1));
    p = { ...p, priorities: ['a'] };
    const q = setPath(p, 'ressurgimento', new Date(2026, 10, 20));
    expect(q.path).toBe('ressurgimento');
    expect(q.pathAt).toBe('2026-11-20');
    expect(q.priorities).toEqual(['a']);
    expect(setPath(q, 'ressurgimento', new Date(2027, 0, 1))).toBe(q);
    expect(sanitizePurpose({ path: 'ressurgimento', pathAt: '2026-11-20', supportDismissed: 9 })).toMatchObject({ path: 'ressurgimento', pathAt: '2026-11-20', supportDismissed: 2 });
  });

  it('semanas desde a escolha; o cartão de apoio só aparece no Ressurgimento, a partir da 3ª semana, e silencia depois de 2 dispensas', () => {
    const p = setPath(emptyPurpose(), 'ressurgimento', new Date(2026, 10, 1));
    expect(weeksOnPath(p, new Date(2026, 10, 7))).toBe(0);
    expect(weeksOnPath(p, new Date(2026, 10, 15))).toBe(2);
    expect(showSupportCard(p, new Date(2026, 10, 8))).toBe(false);
    expect(showSupportCard(p, new Date(2026, 10, 15))).toBe(true);
    expect(showSupportCard(setPath(emptyPurpose(), 'satisfacao', new Date(2026, 10, 1)), new Date(2026, 11, 30))).toBe(false);
    const d1 = dismissSupportCard(p)!;
    expect(showSupportCard(d1, new Date(2026, 10, 15))).toBe(true);
    const d2 = dismissSupportCard(d1)!;
    expect(d2.supportDismissed).toBe(SUPPORT_CARD_MAX_DISMISSALS);
    expect(showSupportCard(d2, new Date(2026, 10, 30))).toBe(false);
    expect(dismissSupportCard(d2)!.supportDismissed).toBe(SUPPORT_CARD_MAX_DISMISSALS);
  });
});
