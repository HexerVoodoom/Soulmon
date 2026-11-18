// @vitest-environment jsdom
/**
 * INÍCIO BB — o CHOCAR em tela cheia (dono, 17/11/2026): tocar até o cristal rachar; ao rachar aparece o BB e SÓ ENTÃO,
 * com a imagem carregada, a apresentação ("Hi, I'm …"). Nunca texto antes da arte.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { ChocarBB } from './ChocarBB';
import { LUZ_EXPANDE_MS, OVO_TOQUES_PARA_BOTOES } from './OnboardingOvo';

let imagens: Array<{ onload: (() => void) | null; onerror: (() => void) | null; src: string }> = [];
class FakeImage { onload: (() => void) | null = null; onerror: (() => void) | null = null; src = ''; constructor() { imagens.push(this); } }

beforeEach(() => {
  vi.useFakeTimers();
  imagens = [];
  vi.stubGlobal('Image', FakeImage);
  window.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

const falas = ["Hi, I'm Bolid.\nI'm a digital counterpart of your soul, and we grow together.", 'I really like fruit.'];

function tocarAteRachar() {
  for (let i = 0; i < OVO_TOQUES_PARA_BOTOES; i++) fireEvent.click(document.querySelector('[data-chocar-cristal]')!);
}

describe('ChocarBB', () => {
  it('EN: convida a tocar; cada toque racha mais; sem apresentação antes de rachar', () => {
    renderWithCss(<ChocarBB language="en-US" spriteUrl="blob:bb" nome="Bolid" falas={falas} onDone={() => {}} />);
    expect(screen.getByText('Your Soulmon wants out. Tap the crystal.')).toBeTruthy();
    fireEvent.click(document.querySelector('[data-chocar-cristal]')!);
    fireEvent.click(document.querySelector('[data-chocar-cristal]')!);
    expect(document.querySelector('[data-chocar-rachadura]')?.getAttribute('data-chocar-rachadura')).toBe('1');
    expect(screen.getByText('Keep tapping.')).toBeTruthy();
    expect(document.querySelector('[data-npc-sequence]')).toBeNull();
    expect(document.body.textContent).not.toContain("Hi, I'm Bolid");
  });

  it('rachou + arte carregada: o BB aparece e a apresentação vem com ele; fim chama onDone', () => {
    const onDone = vi.fn();
    renderWithCss(<ChocarBB language="en-US" spriteUrl="blob:bb" nome="Bolid" falas={falas} onDone={onDone} />);
    act(() => { imagens[0].onload?.(); });
    tocarAteRachar();
    act(() => { vi.advanceTimersByTime(LUZ_EXPANDE_MS + 10); });
    const seq = document.querySelector('[data-npc-sequence]') as HTMLElement;
    expect(seq).toBeTruthy();
    expect((seq.querySelector('[data-npc-art]') as HTMLImageElement).getAttribute('src')).toBe('blob:bb');
    expect(seq.textContent).toContain("Hi, I'm Bolid.");
    fireEvent.click(seq.querySelector('[data-npc-skip]')!);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('rachou ANTES de a arte carregar: espera ("Almost there…"), sem texto de apresentação; carregou → apresentação', () => {
    renderWithCss(<ChocarBB language="en-US" spriteUrl="blob:bb" nome="Bolid" falas={falas} onDone={() => {}} />);
    tocarAteRachar();
    act(() => { vi.advanceTimersByTime(LUZ_EXPANDE_MS + 10); });
    expect(document.querySelector('[data-npc-sequence]')).toBeNull();
    expect(screen.getByText('Almost there…')).toBeTruthy();
    act(() => { imagens[0].onload?.(); });
    expect(document.querySelector('[data-npc-sequence]')).toBeTruthy();
  });

  it('PT: textos em português; arte que falhou sai por "Continuar" sem apresentação', () => {
    const onDone = vi.fn();
    renderWithCss(<ChocarBB language="pt-BR" spriteUrl="blob:bb" nome="Bolid" falas={falas} onDone={onDone} />);
    expect(screen.getByText('Seu Soulmon quer sair. Toque no cristal.')).toBeTruthy();
    act(() => { imagens[0].onerror?.(); });
    tocarAteRachar();
    act(() => { vi.advanceTimersByTime(LUZ_EXPANDE_MS + 10); });
    expect(document.querySelector('[data-npc-sequence]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(onDone).toHaveBeenCalled();
  });
});
