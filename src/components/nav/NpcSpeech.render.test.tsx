// @vitest-environment jsdom
/**
 * I1 (02/10/2026): a fala do NPC da folha do lote surge letra a letra, o
 * balão reserva a altura final, o toque completa sem fechar a folha, e a fala
 * é dita UMA vez por abertura.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import { NpcSpeech } from './NpcSpeech';
import { AreaSheet } from './AreaSheet';
import { lotNpcVoice } from '../../utils/areaNpcVoice';

beforeEach(() => {
  vi.useFakeTimers();
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('NpcSpeech', () => {
  it('a fala começa vazia e vai surgindo; o balão tem o texto inteiro reservado', () => {
    const { container } = render(<NpcSpeech name="Lamela" line="Fique à vontade para olhar." />);
    const shown = () => container.querySelector('[data-typewriter-shown]')!.textContent;
    expect(shown()).toBe('');
    expect(container.querySelector('[data-typewriter-rest]')!.textContent).toBe('Fique à vontade para olhar.');
    act(() => { vi.advanceTimersByTime(30 * 5); });
    expect(shown()).toBe('Fique');
    // o balão mantém a marca que o CSS de viewport baixa usa
    expect(container.querySelector('[data-area-sheet-npc-line]')).not.toBeNull();
  });

  it('enquanto fala, o toque completa na hora e NÃO sobe para o backdrop; depois, é transparente ao toque', () => {
    const onBackdrop = vi.fn();
    const { container } = render(<div onClick={onBackdrop}><NpcSpeech name="Lamela" line="Uma fala." /></div>);
    const balloon = container.querySelector('[data-area-sheet-npc-line]') as HTMLElement;
    expect(balloon.style.pointerEvents).toBe('auto');
    fireEvent.click(balloon);
    expect(onBackdrop).not.toHaveBeenCalled();
    expect(container.querySelector('[data-typewriter-shown]')!.textContent).toBe('Uma fala.');
    expect(balloon.style.pointerEvents).toBe('none');
  });
});

describe('AreaSheet › NPC do Mercado', () => {
  it('a lojinha de Itens abre com o NPC (Lamela) e a fala dele, dita uma vez por abertura', () => {
    const voice = lotNpcVoice('mercado', 'itens', 'pt-BR');
    const props = { areaId: 'mercado' as const, lotId: 'itens', language: 'pt-BR' as const, title: 'Itens', closeLabel: 'Fechar', onClose: () => {} };
    const { container, rerender } = render(<AreaSheet {...props} open />);
    expect(container.querySelector('[data-area-sheet-npc]')).not.toBeNull();
    expect(container.querySelector('[data-typewriter-sr]')!.textContent).toBe(voice.line);
    act(() => { vi.advanceTimersByTime(30 * voice.line.length + 100); });
    expect(container.querySelector('[data-typewriter-done]')!.getAttribute('data-typewriter-done')).toBe('true');
    // fechar e reabrir: nova abertura, a fala recomeça
    rerender(<AreaSheet {...props} open={false} />);
    rerender(<AreaSheet {...props} open />);
    expect(container.querySelector('[data-typewriter-shown]')!.textContent).toBe('');
  });
});

describe('NpcSpeech › QA3 — trocar a fala recomeça limpo', () => {
  it('depois de completar a fala A, a fala B volta a digitar e a aceitar toque (done/skip não vazam)', () => {
    const { container, rerender } = render(<NpcSpeech name="Lamela" line="Fala A." />);
    const balloon = () => container.querySelector('[data-area-sheet-npc-line]') as HTMLElement;
    fireEvent.click(balloon()); // completa A
    expect(balloon().style.pointerEvents).toBe('none');
    rerender(<NpcSpeech name="Lamela" line="Outra fala, bem maior." />);
    expect(container.querySelector('[data-typewriter-shown]')!.textContent).toBe('');
    expect(balloon().style.pointerEvents).toBe('auto');
  });
});
