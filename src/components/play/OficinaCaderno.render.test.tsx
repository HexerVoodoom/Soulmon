// @vitest-environment jsdom
/**
 * Oficina do Foco e Caderno (04/10/2026, `docs/PLANO-OFICINA-FOCO.md`): o timer segue o relógio
 * (mockado), o "foquei" é só local, e o Caderno é privado, apagável e mostra a linha de apoio.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { createElement, useState } from 'react';
import { OficinaSheet } from './OficinaSheet';
import { CadernoSheet } from './CadernoSheet';
import { FOCO_TECNICAS } from '../../data/focoTecnicas';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import type { CadernoEntry } from '../../utils/cadernoSave';
import { clearLegacy, loadLegacyEntries, mergeEntries } from '../../utils/cadernoSave';
import { isVibrateOn, setVibrateOn, fireEndNotice } from '../../utils/focoTimer';

const DIA = '2026-10-04';
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 4, 10, 0, 0)); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

const q = (c: HTMLElement, s: string) => c.querySelector(s) as HTMLElement | null;

describe('Oficina do Foco', () => {
  it('uma card por técnica, em lista de cards separados; explicação atrás de InfoTip (nunca corrida na tela)', () => {
    const { container } = render(createElement(OficinaSheet, { language: 'pt-BR', todayKey: DIA }));
    expect(container.querySelectorAll('[data-oficina-tecnica]').length).toBe(FOCO_TECNICAS.length);
    expect(FOCO_TECNICAS.length).toBeGreaterThanOrEqual(5);
    expect(FOCO_TECNICAS.length).toBeLessThanOrEqual(7);
    const texto = container.textContent ?? '';
    for (const t of FOCO_TECNICAS) expect(texto, t.id).not.toContain(t.howPt.slice(0, 40));
  });

  it('iniciar 25/5, o relógio segue o horário de verdade, termina, "Foquei" registra e abre a pausa', () => {
    const { container } = render(createElement(OficinaSheet, { language: 'pt-BR', todayKey: DIA }));
    expect(q(container, '[data-oficina-clock]')!.textContent).toBe('25:00');
    fireEvent.click(q(container, '[data-oficina-start]')!);
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(q(container, '[data-oficina-clock]')!.textContent).toBe('24:00');
    // Salto de relógio (aba em segundo plano): sem ticks intermediários.
    act(() => { vi.setSystemTime(new Date(2026, 9, 4, 10, 26, 0)); vi.advanceTimersByTime(1000); });
    expect(q(container, '[data-oficina-fim]')).not.toBeNull();
    expect(q(container, '[data-oficina-clock]')!.textContent).toBe('00:00');
    fireEvent.click(q(container, '[data-oficina-foquei]')!);
    expect(q(container, '[data-oficina-hoje]')!.textContent).toContain('1');
    expect(q(container, '[data-oficina-clock]')!.textContent).toBe('05:00');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.FOCO_SESSIONS)!)[DIA].n).toBe(1);
  });

  it('pausar congela o relógio; cancelar volta ao início e limpa o storage do timer', () => {
    const { container } = render(createElement(OficinaSheet, { language: 'en-US', todayKey: DIA }));
    fireEvent.click(q(container, '[data-oficina-start]')!);
    act(() => { vi.advanceTimersByTime(30_000); });
    fireEvent.click(q(container, '[data-oficina-pause]')!);
    act(() => { vi.advanceTimersByTime(600_000); });
    expect(q(container, '[data-oficina-clock]')!.textContent).toBe('24:30');
    fireEvent.click(q(container, '[data-oficina-resume]')!);
    fireEvent.click(q(container, '[data-oficina-cancel]')!);
    expect(q(container, '[data-oficina-start]')).not.toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.FOCO_TIMER)).toBeNull();
  });

  it('reabrir a folha com um timer salvo retoma de onde o relógio está', () => {
    const a = render(createElement(OficinaSheet, { language: 'pt-BR', todayKey: DIA }));
    fireEvent.click(q(a.container, '[data-oficina-start]')!);
    a.unmount();
    act(() => { vi.setSystemTime(new Date(2026, 9, 4, 10, 10, 0)); });
    const b = render(createElement(OficinaSheet, { language: 'pt-BR', todayKey: DIA }));
    expect(q(b.container, '[data-oficina-clock]')!.textContent).toBe('15:00');
  });
});

/** A folha com estado de verdade (o `App` aplica as funções puras sobre `prev`). */
let ultimo: CadernoEntry[] = [];
function Viva({ inicial = [] }: { inicial?: CadernoEntry[] }) {
  const [c, set] = useState(inicial);
  ultimo = c;
  return createElement(CadernoSheet, { language: 'pt-BR', todayKey: DIA, entries: c, onChange: f => set(f) });
}

describe('Caderno', () => {
  it('guardar entrega a entrada ao save (estado), limpa o campo, NÃO usa o storage local; apagar tudo esvazia', () => {
    const { container } = render(createElement(Viva));
    const botoes = Array.from(container.querySelectorAll('[role="radio"]')) as HTMLElement[];
    fireEvent.click(botoes.find(b => b.textContent === 'Escrita livre')!);
    fireEvent.change(q(container, '[data-caderno-texto]')!, { target: { value: 'Um dia tranquilo.' } });
    fireEvent.click(q(container, '[data-caderno-guardar]')!);
    expect(q(container, '[data-caderno-ok]')).not.toBeNull();
    expect(ultimo[0].text).toBe('Um dia tranquilo.');
    expect(localStorage.getItem(STORAGE_KEYS.CADERNO)).toBeNull();
    expect((q(container, '[data-caderno-texto]') as HTMLTextAreaElement).value).toBe('');
    expect(q(container, '[data-caderno-apoio]')).toBeNull();
    fireEvent.click(q(container, '[data-caderno-apagar-tudo]')!);
    fireEvent.click(q(container, '[data-caderno-apagar-confirma]')!);
    expect(ultimo).toEqual([]);
    expect(q(container, '[data-caderno-lista]')).toBeNull();
  });

  it('apagar UMA entrada tira só ela', () => {
    const base = [{ id: 'a', day: DIA, formato: 'livre', text: 'um', at: 2 }, { id: 'b', day: DIA, formato: 'livre', text: 'dois', at: 1 }] as CadernoEntry[];
    const { container } = render(createElement(Viva, { inicial: base }));
    fireEvent.click(q(container, '[data-caderno-apagar="a"]')!);
    expect(ultimo.map(e => e.id)).toEqual(['b']);
  });

  it('texto que sugere sofrimento mostra a linha de apoio (CVV 188), sem bloquear o guardar', () => {
    const { container } = render(createElement(Viva));
    const botoes = Array.from(container.querySelectorAll('[role="radio"]')) as HTMLElement[];
    fireEvent.click(botoes.find(b => b.textContent === 'Escrita livre')!);
    fireEvent.change(q(container, '[data-caderno-texto]')!, { target: { value: 'nao quero mais viver' } });
    expect(q(container, '[data-caderno-apoio]')!.textContent).toContain('188');
    expect((q(container, '[data-caderno-guardar]') as HTMLButtonElement).disabled).toBe(false);
  });

  it('nada de sequência, total ou cobrança na folha', () => {
    const { container } = render(createElement(Viva));
    expect(container.textContent).not.toMatch(/sequência|streak|faltam|ainda não escreveu|Bits|XP|d+ entradas/i);
  });

  it('migração única: as anotações legadas do localStorage entram no save e a chave some', () => {
    localStorage.setItem(STORAGE_KEYS.CADERNO, JSON.stringify([{ id: 'leg-1', day: DIA, formato: 'gratidao', text: 'antigo', at: 5 }, { lixo: true }]));
    const legado = loadLegacyEntries();
    expect(legado.map(e => e.id)).toEqual(['leg-1']);
    const noSave = mergeEntries([{ id: 'novo', day: DIA, formato: 'livre', text: 'x', at: 9 }], legado);
    expect(noSave.map(e => e.id)).toEqual(['novo', 'leg-1']);
    expect(mergeEntries(noSave, legado).length).toBe(2);
    clearLegacy();
    expect(localStorage.getItem(STORAGE_KEYS.CADERNO)).toBeNull();
    expect(loadLegacyEntries()).toEqual([]);
  });
});

describe('vibração ao fim do foco — ligada por padrão, com interruptor', () => {
  it('padrão LIGADA; desligar e religar vale para o aviso de fim', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    expect(isVibrateOn()).toBe(true);
    fireEndNotice({ title: 'a', body: 'b' });
    expect(vibrate).toHaveBeenCalledTimes(1);
    setVibrateOn(false);
    expect(isVibrateOn()).toBe(false);
    fireEndNotice({ title: 'a', body: 'b' });
    expect(vibrate).toHaveBeenCalledTimes(1);
    setVibrateOn(true);
    fireEndNotice({ title: 'a', body: 'b' });
    expect(vibrate).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});
