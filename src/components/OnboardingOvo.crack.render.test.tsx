// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { OvoCristal, OVO_TOQUES_PARA_BOTOES } from './OnboardingOvo';

afterEach(cleanup);

const montar = (language: 'pt-BR' | 'en-US') => renderWithCss(
  <OvoCristal language={language} comprado={false} ocupado={false} onConhecer={() => {}} onGuia={() => {}} onChocar={() => {}} />,
);

/** QA L11-06 (decisão do dono, 21/10/2026): ao tocar o cristal, "crack" sobre ele, maior que o texto de torcida (13 px). */
describe('cristal do onboarding — "crack" a cada toque', () => {
  it('não existe antes do 1º toque e aparece, grande e decorativo, a cada toque (PT e EN)', () => {
    for (const lang of ['pt-BR', 'en-US'] as const) {
      const { container, unmount } = montar(lang);
      expect(container.querySelector('[data-ovo-crack]')).toBeNull();
      fireEvent.click(container.querySelector('[data-ovo-cristal]') as HTMLElement);
      const crack = container.querySelector('[data-ovo-crack]') as HTMLElement;
      expect(crack.textContent).toBe('crack');
      expect(crack.getAttribute('aria-hidden')).toBe('true');
      expect(parseFloat(crack.style.fontSize)).toBeGreaterThan(13); // maior que o texto de torcida
      unmount();
    }
  });

  it('o balanço do cristal já existia: cada toque reinicia a animação (não foi duplicado) e as 5 batidas seguem', () => {
    const { container } = montar('en-US');
    const cristal = container.querySelector('[data-ovo-cristal]') as HTMLElement;
    for (let i = 0; i < OVO_TOQUES_PARA_BOTOES; i++) fireEvent.click(cristal);
    expect(cristal.getAttribute('data-ovo-toques')).toBe(String(OVO_TOQUES_PARA_BOTOES));
    expect(container.querySelector('[data-ovo-botoes]')).toBeTruthy();
    expect(container.querySelectorAll('[data-ovo-crack]').length).toBe(1); // um por vez
  });
});
