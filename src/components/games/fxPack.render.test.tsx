// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ResultScreen, type ResultScreenProps } from './ResultScreen';
import { ResultBanner, SpriteFx, bannerForOutcome } from '../ui/SpriteFx';
import { Celebration } from '../ui/Celebration';
import { BUILDING_PLATE, RESULT_BANNER, SCENE_BG } from '../../utils/fxPackArt';
import { AreaScene } from '../nav/AreaScene';
import { DUEL_SCENE } from '../../utils/dungeonScenes';

afterEach(cleanup);
const src = (p: string) => readFileSync(resolve(__dirname, '../..', p), 'utf8');

const base = (over: Partial<ResultScreenProps> = {}): ResultScreenProps => ({
  language: 'en-US', outcome: 'win', gameName: 'G', title: 'Round cleared', line: 'x',
  hero: { label: 'Score', value: 1 }, petSrc: 'pet.png', onPlayAgain: () => {}, onHome: () => {}, homeLabel: 'Home',
  ledger: [{ key: 'bits', kind: 'bits', value: 5 }], instant: true, ...over,
});

describe('títulos de resultado (P1/P2/P3)', () => {
  it('cada outcome do ResultScreen mostra o banner certo e mantém o título em texto', () => {
    for (const [o, kind] of [['win', 'win'], ['record', 'win'], ['tired', 'lose'], ['calm', 'draw']] as const) {
      const { unmount } = render(<ResultScreen {...base({ outcome: o, recordNote: 'New best' })} />);
      const img = document.querySelector('[data-result-banner]') as HTMLImageElement;
      expect(img.getAttribute('data-result-banner')).toBe(kind);
      expect(img.getAttribute('src')).toBe(RESULT_BANNER[kind]);
      unmount();
    }
    for (const [o, kind] of [['win', 'victory'], ['record', 'victory'], ['tired', 'defeat'], ['calm', 'draw']] as const) {
      const { unmount } = render(<ResultScreen {...base({ outcome: o, recordNote: 'New best', bannerSet: 'epic' })} />);
      const img = document.querySelector('[data-result-banner]') as HTMLImageElement;
      expect(img.getAttribute('data-result-banner')).toBe(kind);
      expect(img.getAttribute('src')).toBe(RESULT_BANNER[kind]);
      expect(document.querySelector('[data-result-title]')!.textContent).toBe('Round cleared');
      unmount();
    }
  });
  it('aria-label/alt em PT e EN', () => {
    const pt = render(<ResultBanner kind="defeat" isPt width={200} />);
    expect(pt.container.querySelector('img')!.getAttribute('aria-label')).toBe('Derrota');
    pt.unmount();
    const w = render(<ResultBanner kind="lose" isPt width={200} />);
    expect(w.container.querySelector('img')!.getAttribute('aria-label')).toBe('Derrota');
    w.unmount();
    const en = render(<ResultBanner kind="draw" isPt={false} />);
    expect(en.container.querySelector('img')!.getAttribute('alt')).toBe('Draw');
  });
  it('mapa de desfecho', () => {
    expect([bannerForOutcome('win'), bannerForOutcome('record'), bannerForOutcome('tired'), bannerForOutcome('calm')]).toEqual(['win', 'win', 'lose', 'draw']);
    expect([bannerForOutcome('win', 'epic'), bannerForOutcome('record', 'epic'), bannerForOutcome('tired', 'epic'), bannerForOutcome('calm', 'epic')]).toEqual(['victory', 'victory', 'defeat', 'draw']);
  });
  it('Torneio, RPS, Arena e Duelo usam a tela/peça com banner', () => {
    for (const f of ['components/TournamentPage.tsx', 'components/RPSGame.tsx', 'components/ArenaGame.tsx']) expect(src(f)).toMatch(/<ResultScreen/);
    expect(src('components/DuelScreen.tsx')).toMatch(/<ResultBanner/);
    expect(src('components/TournamentPage.tsx')).toMatch(/bannerSet="epic"/);
  });
});

describe('FX por folha', () => {
  it('SpriteFx é decorativo, anima por folha e declara o quadro parado do movimento reduzido', () => {
    const { container } = render(<SpriteFx sheet="bau" size={72} still="last" />);
    const el = container.querySelector('[data-sprite-fx="bau"]') as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('data-fxs-still')).toBe('last');
    expect(el.style.backgroundImage).toContain('bau-sheet');
    const css = src('index.css');
    expect(css).toMatch(/\.sm-fxs\s*\{[^}]*steps\(1, end\)/);
    expect(css).toContain('.sm-fxs { animation: none; } .sm-fxs[data-fxs-still="hide"] { display: none; }');
  });
  it('Celebration e ResultScreen (vitória) levam as folhas de recompensa e baú', () => {
    const c = render(<Celebration />);
    expect(c.container.querySelector('[data-celebration-fx]')).toBeTruthy();
    c.unmount();
    render(<ResultScreen {...base()} />);
    expect(document.querySelector('[data-result-reward-fx]')).toBeTruthy();
    expect(document.querySelector('[data-result-chest-fx]')).toBeTruthy();
  });
  it('derrota não leva chuva de recompensa nem baú', () => {
    render(<ResultScreen {...base({ outcome: 'tired' })} />);
    expect(document.querySelector('[data-result-reward-fx]')).toBeNull();
    expect(document.querySelector('[data-result-chest-fx]')).toBeNull();
  });
  it('Match3 e Cerimônia ligam a fusão e a evolução', () => {
    expect(src('components/Match3Game.tsx')).toMatch(/sheet="fusao"/);
    expect(src('components/EvolutionCeremony.tsx')).toMatch(/sheet="evolucao"/);
  });
});

describe('fundos e placa', () => {
  it('fundos aplicados em Fusion, Torneio, Duelo e Evolução', () => {
    expect(src('components/Match3Game.tsx')).toMatch(/SCENE_BG\.fusion/);
    expect(src('components/TournamentPage.tsx')).toMatch(/SCENE_BG\.torneioLobby/);
    expect(src('components/EvolutionCeremony.tsx')).toMatch(/SCENE_BG\.evolucao/);
    expect(src('components/DuelScreen.tsx')).toMatch(/DUEL_SCENE\.bg/);
    expect(DUEL_SCENE.bg).toContain('duelo-bg');
    for (const u of Object.values(SCENE_BG)) expect(u).toBeTruthy();
  });
  it('placa de prédio é a border-image do rótulo do lote no AreaScene', () => {
    const { container } = render(
      <AreaScene areaId="mercado" language="en-US" lots={[{ id: 'loja', label: 'Shop', left: '50%', top: '60%', ariaLabel: 'Shop', onOpen: () => {} }]} />,
    );
    const label = container.querySelector('[data-area-lot-label]') as HTMLElement | null;
    expect(label).toBeTruthy();
    expect(label!.textContent).toBe('Shop');
    expect(label!.hasAttribute('data-area-lot-plate')).toBe(true);
    expect(label!.style.borderImage || label!.getAttribute('style') || '').toContain(BUILDING_PLATE.split('/').pop()!.split('.')[0]);
  });
});
