// @vitest-environment jsdom
/**
 * O tour do corvo: o fluxo inteiro (Next até o fim), Skip em qualquer passo,
 * Esc, a11y do diálogo, conteúdo sem cobrança e sem número escrito à mão.
 * A fiação no App (flag gravada uma vez, replay sem marca) é guard de fonte em
 * `filaDeAvisos.contract.test.ts` e foi conferida no navegador.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { WelcomeTour } from './WelcomeTour';
import {
  TOUR_STEPS, TOUR_GUIDE_NAME, TOUR_STARTING_GOAL, needsWelcomeTour, tourText,
  MAP_TOUR_STEPS, MAP_TOUR_AREA_ORDER, needsMapTutorial, sanitizeMapTutorialSeen,
} from '../utils/welcomeTour';
import { FORM_REQUIREMENTS } from '../types/progression';
import { AREAS, areaLabel } from '../navigation';
import { BUILDING_GATES } from '../utils/gates';
import { BUILDING_INTRO_COPY } from '../utils/buildingIntroCopy';

beforeEach(() => {
  try { localStorage.clear(); } catch { /* jsdom */ }
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => cleanup());

const stepId = (c: HTMLElement) => c.querySelector('[data-welcome-tour]')!.getAttribute('data-step');

describe('WelcomeTour — fluxo', () => {
  it('Next percorre os seis passos na ordem e o último ("Let\'s go") termina como finished', () => {
    const onDone = vi.fn();
    const { container } = render(<WelcomeTour language="en-US" onDone={onDone} />);
    const ids: string[] = [];
    for (let i = 0; i < TOUR_STEPS.length; i++) {
      ids.push(stepId(container)!);
      const next = container.querySelector('[data-wt-next]') as HTMLElement;
      expect(next.textContent).toBe(i === TOUR_STEPS.length - 1 ? "Let's go" : 'Next');
      expect(onDone).not.toHaveBeenCalled();
      fireEvent.click(next);
    }
    expect(ids).toEqual(TOUR_STEPS.map(s => s.id));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith('finished');
  });

  it('Back volta um passo; no primeiro não existe', () => {
    const { container } = render(<WelcomeTour language="en-US" onDone={() => {}} />);
    expect(container.querySelector('[data-wt-back]')).toBeNull();
    fireEvent.click(container.querySelector('[data-wt-next]')!);
    expect(stepId(container)).toBe('tasks');
    fireEvent.click(container.querySelector('[data-wt-back]')!);
    expect(stepId(container)).toBe('hello');
  });

  it('Skip está visível em TODO passo e pula (skipped) sem repetir', () => {
    for (let k = 0; k < TOUR_STEPS.length; k++) {
      const onDone = vi.fn();
      const { container, unmount } = render(<WelcomeTour language="en-US" onDone={onDone} />);
      for (let j = 0; j < k; j++) fireEvent.click(container.querySelector('[data-wt-next]')!);
      const skip = container.querySelector('[data-wt-skip]') as HTMLElement;
      expect(skip).not.toBeNull();
      fireEvent.click(skip);
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onDone).toHaveBeenCalledWith('skipped');
      unmount();
    }
  });

  it('Esc pula', () => {
    const onDone = vi.fn();
    render(<WelcomeTour language="en-US" onDone={onDone} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDone).toHaveBeenCalledWith('skipped');
  });

  it('é um diálogo modal nomeado pelo título do passo, com o corvo decorativo', () => {
    const { container } = render(<WelcomeTour language="en-US" onDone={() => {}} />);
    const dlg = screen.getByRole('dialog');
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    const labelId = dlg.getAttribute('aria-labelledby')!;
    expect(container.ownerDocument.getElementById(labelId)!.textContent).toBe('Welcome');
    const raven = container.querySelector('[data-wt-raven]')!;
    expect(raven.getAttribute('alt')).toBe('');
    expect(container.textContent).toContain(TOUR_GUIDE_NAME);
  });

  it('o tour inicial NÃO tem mais mapa nem prédios (14/10/2026): tudo isso vive no tutorial do mapa', () => {
    expect(TOUR_STEPS.map(s => s.id)).toEqual(['hello', 'tasks', 'why', 'evolution', 'care', 'corners']);
    expect(TOUR_STEPS.some(s => s.areas || s.part === 2)).toBe(false);
  });
});

describe('Tutorial do mapa (MAP_TOUR_STEPS)', () => {
  it('um cartão por ÁREA, na ordem do mapa, e um prédio por linha: os 22 prédios, cada um UMA vez', () => {
    const areas = MAP_TOUR_STEPS.filter(s => s.areas).map(s => s.id);
    expect(areas).toEqual(MAP_TOUR_AREA_ORDER.map(a => `map-${a}`));
    expect(new Set(MAP_TOUR_AREA_ORDER).size).toBe(AREAS.length);
    const nomes = MAP_TOUR_STEPS.flatMap(s => s.areas ?? []).map(r => r.name.en);
    expect(nomes.sort()).toEqual(Object.keys(BUILDING_GATES).map(id => BUILDING_INTRO_COPY[id as keyof typeof BUILDING_INTRO_COPY].place.en).sort());
  });
  it('PT-BR e EN em TODA string, com os títulos das áreas reais', () => {
    for (const s of MAP_TOUR_STEPS) {
      expect(s.title.pt).toBeTruthy(); expect(s.speech.pt).toBeTruthy();
      for (const r of s.areas ?? []) { expect(r.name.pt).toBeTruthy(); expect(r.line.pt).toBeTruthy(); expect(r.line.en.length).toBeLessThan(90); }
    }
    expect(MAP_TOUR_STEPS.find(s => s.id === 'map-laboratorio')!.title.pt).toBe(areaLabel('laboratorio', true));
  });
  it('a Masmorra está listada e dita como aberta desde o primeiro dia', () => {
    const exp = MAP_TOUR_STEPS.find(s => s.id === 'map-exploracao')!;
    expect(exp.areas!.some(r => r.name.en === 'Dungeon')).toBe(true);
    expect(exp.speech.en).toMatch(/day one/);
  });
  it('sanitizeMapTutorialSeen: boolean respeita; save com progresso ou tour visto = true; save vazio = false', () => {
    expect(sanitizeMapTutorialSeen(false, { activities: [{}] })).toBe(false);
    expect(sanitizeMapTutorialSeen(true, {})).toBe(true);
    expect(sanitizeMapTutorialSeen(undefined, { activities: [{}] })).toBe(true);
    expect(sanitizeMapTutorialSeen(undefined, { completedTasks: [{}] })).toBe(true);
    expect(sanitizeMapTutorialSeen(undefined, { perfectDays: 2 })).toBe(true);
    expect(sanitizeMapTutorialSeen(undefined, {}, true)).toBe(true);
    expect(sanitizeMapTutorialSeen('lixo', {})).toBe(false);
    expect(sanitizeMapTutorialSeen(undefined, null)).toBe(false);
  });
  it('needsMapTutorial: só no mapa, nunca visto e sem o tour básico na frente', () => {
    expect(needsMapTutorial({ seen: false, onMap: true, welcomeTourOpen: false })).toBe(true);
    expect(needsMapTutorial({ seen: false, onMap: false, welcomeTourOpen: false })).toBe(false);
    expect(needsMapTutorial({ seen: true, onMap: true, welcomeTourOpen: false })).toBe(false);
    expect(needsMapTutorial({ seen: undefined, onMap: true, welcomeTourOpen: false })).toBe(false);
    expect(needsMapTutorial({ seen: false, onMap: true, welcomeTourOpen: true })).toBe(false);
  });
});

describe('WelcomeTour — conteúdo', () => {
  const todos = [...TOUR_STEPS, ...MAP_TOUR_STEPS].flatMap(s => [s.title.en, s.speech.en, s.title.pt ?? '', s.speech.pt ?? '', ...(s.areas ?? []).flatMap(a => [a.name.en, a.line.en, a.line.pt ?? ''])]);

  it('sem vocabulário vetado nem verbo de cobrança', () => {
    // Os termos dos caminhos antigos são montados em pedaços: a régua `branchRename.contract` reprova a grafia literal em qualquer fonte.
    const antigos = ['vi' + 'rus', 'vac' + 'cine', 'vac' + 'ina'].join('|');
    const vetado = new RegExp(`tamer|domador|treinador|digievolu|digital world|mundo digital|${antigos}|streak|deserve|good job|well done|you must|you should|you failed|penalt|punish|debt`, 'i');
    for (const t of todos) expect(t).not.toMatch(vetado);
  });

  it('é inglês: nenhuma string só-português, e o pt-BR cai no inglês por enquanto', () => {
    for (const s of TOUR_STEPS) {
      expect(s.speech.pt).toBeUndefined();
      expect(tourText(s.speech, 'pt-BR')).toBe(s.speech.en);
      expect(tourText(s.speech, 'en-US')).toBe(s.speech.en);
    }
    expect(tourText({ en: 'a', pt: 'b' }, 'pt-BR')).toBe('b');
  });

  it('o número da meta vem da constante, não de texto à mão', () => {
    expect(TOUR_STARTING_GOAL).toBe(FORM_REQUIREMENTS.rookie.required);
    expect(TOUR_STEPS.find(s => s.id === 'why')!.speech.en).toContain(`about ${FORM_REQUIREMENTS.rookie.required} tasks`);
    const fonte = readFileSync('src/utils/welcomeTour.ts', 'utf8');
    expect(fonte).toContain('FORM_REQUIREMENTS.rookie.required');
  });

  it('explica tarefas, evolução manual, Missões e Mochila', () => {
    const txt = todos.join(' ');
    expect(txt).toMatch(/tasks/i);
    expect(txt).toMatch(/evolution/i);
    expect(txt).toMatch(/you pick the moment/i);
    expect(txt).toMatch(/Missions/);
    expect(txt).toMatch(/first time you open the map/);
    expect(txt).toMatch(/Bag/);
    expect(txt).toMatch(/Replay|replay/);
  });

  it('a superfície é muda e sem recompensa (R-NOVA)', () => {
    const src = readFileSync('src/components/WelcomeTour.tsx', 'utf8');
    expect(src).not.toMatch(/utils\/sounds|audioBus|trilha|gamePoints|totalXP|setGameState/);
  });
});

describe('fiação do tutorial do mapa no App (guard de fonte)', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  it('item PRÓPRIO da fila (mapTutorial) na NpcSequence — sem sistema paralelo; "visto" gravado AO MOSTRAR, num updater puro', () => {
    expect((app.match(/<WelcomeTour /g) ?? [])).toHaveLength(1);
    expect(app).not.toContain('MAP_TOUR_STEPS');
    expect(app).toContain("{interstitial === 'mapTutorial' && (");
    expect(app).toContain('mapTutorial: mapTutorialOpen,');
    expect(app).toContain("} else if (id === 'mapTutorial') {");
    expect(app).toContain('setGameState(prev => (prev.mapTutorialSeen === true ? prev : { ...prev, mapTutorialSeen: true }))');
    expect(app).toContain("onMap: currentView === 'map'");
  });
  it('o save carrega o campo pela migração segura e o jogador novo nasce com false', () => {
    const ctx = readFileSync('src/contexts/GameStateContext.tsx', 'utf8');
    expect(ctx).toContain('sanitizeMapTutorialSeen(loadedState.mapTutorialSeen');
    expect(ctx).toContain('mapTutorialSeen: false,');
  });
});

describe('needsWelcomeTour', () => {
  it('só quando nunca visto E sem conclusão no save', () => {
    expect(needsWelcomeTour({ shown: false, jaConcluiuAlgo: false })).toBe(true);
    expect(needsWelcomeTour({ shown: true, jaConcluiuAlgo: false })).toBe(false);
    expect(needsWelcomeTour({ shown: false, jaConcluiuAlgo: true })).toBe(false);
  });
});
