// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MissionMark } from './MissionMark';
import { QUEST_ART, QUEST_EXCLAMACAO_ART } from '../../assets/soulmon/icones-ui';

describe('MissionMark — "!" e "?" são a arte de quest do dono (05/10/2026)', () => {
  it('"available" mostra o "!" em pixel (não o glifo) e "progress" o "?"', () => {
    const a = render(<MissionMark kind="available" isPt />);
    const imgA = a.container.querySelector('img[data-pixel-icon]') as HTMLImageElement;
    expect(imgA.getAttribute('src')).toBe(QUEST_EXCLAMACAO_ART);
    expect(a.container.textContent).not.toContain('exclamation');
    expect(a.container.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Missão disponível');
    a.unmount();
    const p = render(<MissionMark kind="progress" isPt={false} />);
    expect((p.container.querySelector('img[data-pixel-icon]') as HTMLImageElement).getAttribute('src')).toBe(QUEST_ART);
    p.unmount();
    const r = render(<MissionMark kind="ready" isPt={false} />);
    expect((r.container.querySelector('img[data-pixel-icon]') as HTMLImageElement).getAttribute('src')).toBe(QUEST_ART);
    expect(r.container.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Quest ready');
    expect(QUEST_ART).not.toBe(QUEST_EXCLAMACAO_ART);
  });
});

describe('MissionMark — tom azul das missões semanais (07/10/2026)', () => {
  it('tone="blue" pinta pelo token --sm2-primary-ink, sem cor escrita à mão, e mantém o rótulo', () => {
    const r = render(<MissionMark kind="available" tone="blue" isPt={false} />);
    const g = r.container.querySelector('[data-quest-tone="blue"]') as HTMLElement;
    expect(g).not.toBeNull();
    expect(g.style.background).toContain('var(--sm2-primary-ink)');
    expect(r.container.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Quest available');
    expect(r.container.querySelector('img[data-pixel-icon]')).toBeNull();
  });
});
