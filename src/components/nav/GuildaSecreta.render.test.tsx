// @vitest-environment jsdom
/** A entrada SECRETA da Guilda (dono, 05/11/2026): segurar o cristal por 3 s, sem feedback nenhum; e o mapa abre direto o NPC. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { MapPage } from './MapPage';
import { GuildaMapPage, GUILDA_PREDIOS } from './GuildaMapPage';

const props = { language: 'en-US' as const, onOpenArea: () => {}, bits: 0, emblems: 0, credits: 0 };

describe('entrada secreta', () => {
  afterEach(() => { vi.useRealTimers(); });

  function alvo(onSecretoGuilda: () => void) {
    const { container } = render(<MapPage {...props} onSecretoGuilda={onSecretoGuilda} />);
    return container.querySelector('[data-map-cristal]') as HTMLElement;
  }

  it('só abre com 3 s inteiros segurando', () => {
    vi.useFakeTimers();
    const abrir = vi.fn();
    const el = alvo(abrir);
    fireEvent.pointerDown(el);
    vi.advanceTimersByTime(2999);
    expect(abrir).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(abrir).toHaveBeenCalledTimes(1);
  });

  it('soltar antes cancela', () => {
    vi.useFakeTimers();
    const abrir = vi.fn();
    const el = alvo(abrir);
    fireEvent.pointerDown(el);
    vi.advanceTimersByTime(2000);
    fireEvent.pointerUp(el);
    vi.advanceTimersByTime(5000);
    expect(abrir).not.toHaveBeenCalled();
  });

  it('não anuncia nada: sem botão, sem rótulo, sem cursor, escondido do leitor de tela', () => {
    const el = alvo(() => {});
    expect(el.tagName).toBe('DIV');
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('aria-label')).toBeNull();
    expect(el.textContent).toBe('');
    expect(el.style.cursor).toBe('');
  });
});

describe('mapa da Guilda', () => {
  it('as três Ordens abrem o NPC delas; Remendados e Desfeitos abrem o próprio NPC', () => {
    const { container } = render(<GuildaMapPage language="en-US" onClose={() => {}} hoje={null} dayKey="2026-11-05" onAccept={() => {}} onConfirm={() => {}} />);
    expect(Object.keys(GUILDA_PREDIOS).length).toBe(5);
    fireEvent.click(container.querySelector('[data-guilda-predio="rompente"]')!);
    expect(document.querySelector('[data-merc-lider="rompente"]')).toBeTruthy();
    fireEvent.click(document.querySelector('[data-merc-pensar]')!);
    expect(document.querySelector('[data-merc-lider]')).toBeNull();
    expect(container.textContent).toMatch(/one mission a day/);
    fireEvent.click(container.querySelector('[data-guilda-predio="remendados"]')!);
    expect(document.querySelector('[data-guilda-npc="remendados"]')).toBeTruthy();
  });
});
