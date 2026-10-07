// Regressão do "o cocô aparece e some": a tira de uma passada terminava em
// `-sheet-w` (fora da imagem) e `forwards` segurava o vazio após 450 ms.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpriteAnim } from './SpriteAnim';
import { CareSystem } from '../CareSystem';
import { ANIM_ART } from '../../utils/animArt';

const css = readFileSync('src/index.css', 'utf8');

describe('SpriteAnim hold', () => {
  it('hold usa keyframe que termina no último quadro, não na borda vazia', () => {
    const html = renderToStaticMarkup(<SpriteAnim sheet={ANIM_ART.poopPlop} hold />);
    expect(html).toContain('sm-sheet-hold');
    expect(html).toContain('steps(2, end) forwards');
    const kf = css.match(/@keyframes sm-sheet-hold \{[^}]*\{([^}]*)\}/)![1];
    expect(kf).toContain('/ var(--sm-sheet-frames)'); // N-1 células, não N
    expect(kf).toContain('+ var(--sm-sheet-w)');
  });
  it('o cocô do CareSystem usa hold e não tem timeout de remoção', () => {
    const html = renderToStaticMarkup(
      <CareSystem careEvent={{ type: 'poop', requestTime: 1, showSprite: true }} onCareEventComplete={() => {}} />,
    );
    expect(html).toContain('data-care-poop');
    expect(html).toContain('sm-sheet-hold');
    expect(readFileSync('src/components/CareSystem.tsx', 'utf8')).not.toMatch(/setTimeout|onAnimationEnd/);
  });
});
