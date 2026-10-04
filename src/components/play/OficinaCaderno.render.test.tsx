// @vitest-environment jsdom
/**
 * Oficina do Foco e Caderno (04/10/2026, `docs/PLANO-OFICINA-FOCO.md`): o timer segue o relógio
 * (mockado), o "foquei" é só local, e o Caderno é privado, apagável e mostra a linha de apoio.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { createElement } from 'react';
import { OficinaSheet } from './OficinaSheet';
import { CadernoSheet } from './CadernoSheet';
import { FOCO_TECNICAS } from '../../data/focoTecnicas';
import { STORAGE_KEYS } from '../../utils/storageKeys';

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

describe('Caderno', () => {
  it('guardar grava só no storage local, limpa o campo e a entrada pode ser apagada', () => {
    const { container } = render(createElement(CadernoSheet, { language: 'pt-BR', todayKey: DIA }));
    // 'livre' e 'gratidao' usam textarea; 'tres-coisas' usa 3 campos. Vamos de "Escrita livre".
    const botoes = Array.from(container.querySelectorAll('[role="radio"]')) as HTMLElement[];
    fireEvent.click(botoes.find(b => b.textContent === 'Escrita livre')!);
    const ta = q(container, '[data-caderno-texto]') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: 'Um dia tranquilo.' } });
    fireEvent.click(q(container, '[data-caderno-guardar]')!);
    expect(q(container, '[data-caderno-ok]')).not.toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.CADERNO)!)[0].text).toBe('Um dia tranquilo.');
    expect((q(container, '[data-caderno-texto]') as HTMLTextAreaElement).value).toBe('');
    expect(q(container, '[data-caderno-apoio]')).toBeNull();
    fireEvent.click(q(container, '[data-caderno-apagar-tudo]')!);
    fireEvent.click(q(container, '[data-caderno-apagar-confirma]')!);
    expect(localStorage.getItem(STORAGE_KEYS.CADERNO)).toBeNull();
    expect(q(container, '[data-caderno-lista]')).toBeNull();
  });

  it('texto que sugere sofrimento mostra a linha de apoio (CVV 188), sem bloquear o guardar', () => {
    const { container } = render(createElement(CadernoSheet, { language: 'pt-BR', todayKey: DIA }));
    const botoes = Array.from(container.querySelectorAll('[role="radio"]')) as HTMLElement[];
    fireEvent.click(botoes.find(b => b.textContent === 'Escrita livre')!);
    fireEvent.change(q(container, '[data-caderno-texto]')!, { target: { value: 'nao quero mais viver' } });
    const apoio = q(container, '[data-caderno-apoio]')!;
    expect(apoio.textContent).toContain('188');
    expect((q(container, '[data-caderno-guardar]') as HTMLButtonElement).disabled).toBe(false);
  });

  it('nada de sequência, total ou cobrança na folha', () => {
    const { container } = render(createElement(CadernoSheet, { language: 'pt-BR', todayKey: DIA }));
    expect(container.textContent).not.toMatch(/sequência|streak|faltam|ainda não escreveu|Bits|XP|\d+ entradas/i);
  });

  it('o Caderno não importa rede nem save (privacidade por construção)', async () => {
    const { readFileSync } = await import('node:fs'); const { join } = await import('node:path');
    const src = readFileSync(join(process.cwd(), 'src/utils/cadernoLocal.ts'), 'utf8');
    expect(src).not.toMatch(/from\s+['"][^'"]*(cloudSave|telemetry|fetch|sync|api)/i);
    expect(src).not.toMatch(/\bfetch\(|XMLHttpRequest|sendBeacon/);
  });
});
