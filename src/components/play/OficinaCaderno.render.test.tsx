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
function planejarSessao(container: HTMLElement, mode: 'p25' | 'p50' = 'p25', environment = 'forest') {
  fireEvent.change(container.querySelector('[data-oficina-plano] input')!, { target: { value: 'Sessão de teste' } });
  fireEvent.click(container.querySelector('[data-oficina-plano] footer button:last-child')!);
  fireEvent.click(q(container, `[data-focus-environment="${environment}"]`)!);
  if (mode === 'p50') fireEvent.click(Array.from(container.querySelectorAll('[role="radio"]')).find(b => b.textContent === '50 / 10')!);
  for (let i = 0; i < 6; i++) fireEvent.click(container.querySelector('[data-oficina-plano] footer button:last-child')!);
  fireEvent.click(q(container, '[data-oficina-save-session]')!);
}
function iniciarSessao(container: HTMLElement, mode: 'p25' | 'p50' = 'p25', environment = 'forest') {
  planejarSessao(container, mode, environment);
  fireEvent.click(q(container, '[data-oficina-session-pomodoro]')!);
}

describe('Oficina do Foco', () => {
  it('uma card por técnica, em lista de cards separados; explicação atrás de InfoTip (nunca corrida na tela)', () => {
    const { container, getByRole } = render(createElement(OficinaSheet, { language: 'pt-BR', todayKey: DIA }));
    fireEvent.click(getByRole('tab', { name: 'Guias' }));
    expect(container.querySelectorAll('[data-oficina-tecnica]').length).toBe(FOCO_TECNICAS.length);
    expect(FOCO_TECNICAS.length).toBeGreaterThanOrEqual(5);
    expect(FOCO_TECNICAS.length).toBeLessThanOrEqual(7);
    const texto = container.textContent ?? '';
    for (const t of FOCO_TECNICAS) expect(texto, t.id).not.toContain(t.howPt.slice(0, 40));
  });

  it('iniciar 25/5, o relógio segue o horário de verdade, termina, "Foquei" registra e abre a pausa', () => {
    const { container } = render(createElement(OficinaSheet, { language: 'pt-BR', todayKey: DIA }));
    expect(q(container, '[data-oficina-clock]')!.textContent).toBe('25:00');
    iniciarSessao(container);
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
    iniciarSessao(container);
    act(() => { vi.advanceTimersByTime(30_000); });
    fireEvent.click(q(container, '[data-oficina-pause]')!);
    act(() => { vi.advanceTimersByTime(600_000); });
    expect(q(container, '[data-oficina-clock]')!.textContent).toBe('24:30');
    fireEvent.click(q(container, '[data-oficina-resume]')!);
    fireEvent.click(q(container, '[data-oficina-cancel]')!);
    expect(q(container, '[data-oficina-start]')).not.toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.FOCO_TIMER)).toBeNull();
  });

  it('50/10: a sessão escolhe o ritmo, o timer conta 50:00 e a pausa é de 10', () => {
    const { container } = render(createElement(OficinaSheet, { language: 'en-US', todayKey: DIA }));
    iniciarSessao(container, 'p50');
    expect(q(container, '[data-oficina-clock]')!.textContent).toBe('50:00');
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(q(container, '[data-oficina-clock]')!.textContent).toBe('49:00');
    act(() => { vi.setSystemTime(new Date(2026, 9, 4, 10, 51, 0)); vi.advanceTimersByTime(1000); });
    fireEvent.click(q(container, '[data-oficina-foquei]')!);
    expect(q(container, '[data-oficina-clock]')!.textContent).toBe('10:00');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.FOCO_SESSIONS)!)[DIA].n).toBe(1);
  });

  it('cada foco concluído envia o Soulmon ao cenário escolhido e os ciclos completos aumentam a chance seguinte', () => {
    const onFocusReward = vi.fn().mockReturnValue({ accepted: true, chancePercent: 5, items: [{ kind: 'material', id: 'moss', icon: '🌿', namePt: 'Musgo', nameEn: 'Moss' }] });
    const { container } = render(createElement(OficinaSheet, { language: 'pt-BR', todayKey: DIA, onFocusReward }));
    planejarSessao(container, 'p25', 'shore');
    fireEvent.click(q(container, '[data-oficina-session-pomodoro]')!);
    act(() => { vi.setSystemTime(new Date(2026, 9, 4, 10, 26, 0)); vi.advanceTimersByTime(1000); });
    fireEvent.click(q(container, '[data-oficina-foquei]')!);
    expect(onFocusReward.mock.calls[0][0]).toMatchObject({ environment: 'shore', day: DIA });
    expect(onFocusReward.mock.calls[0][1]).toBe(0);
    expect(q(container, '[data-oficina-loot]')!.textContent).toContain('Musgo');
    act(() => { vi.setSystemTime(new Date(2026, 9, 4, 10, 31, 0)); vi.advanceTimersByTime(1000); });
    fireEvent.click(q(container, '[data-oficina-ok]')!);
    expect(container.querySelector('[data-oficina-session-details]')).toBeNull();
    fireEvent.click(q(container, '[data-oficina-session-pomodoro]')!);
    act(() => { vi.setSystemTime(new Date(2026, 9, 4, 10, 57, 0)); vi.advanceTimersByTime(1000); });
    fireEvent.click(q(container, '[data-oficina-foquei]')!);
    expect(onFocusReward.mock.calls[1][1]).toBe(1);
  });

  it('com um timer em curso, tocar num card não troca o ritmo (só abre a explicação)', () => {
    const { container, getByRole } = render(createElement(OficinaSheet, { language: 'en-US', todayKey: DIA }));
    iniciarSessao(container);
    fireEvent.click(getByRole('tab', { name: 'Guides' }));
    fireEvent.click(q(container, '[data-oficina-tecnica="blocos"] [data-oficina-tecnica-btn]')!);
    expect(q(container, '[data-oficina-clock]')!.textContent).toBe('25:00');
    expect(q(container, '[data-oficina-tecnica="blocos"] [data-oficina-tecnica-corpo]')).not.toBeNull();
  });

  it('preparo do foco é uma checklist temporária de ambiente/necessidades, sem gravar item no histórico', () => {
    const { container } = render(createElement(OficinaSheet, { language: 'pt-BR', todayKey: DIA }));
    const preparo = q(container, '[data-oficina-preparo]')!;
    expect(preparo.textContent).toContain('Organizar a estação de trabalho');
    expect(preparo.textContent).toContain('Beber água');
    expect(preparo.textContent).toContain('Comer algo');
    expect(preparo.textContent).toContain('Ir ao banheiro');
    expect(preparo.querySelectorAll('input[type="checkbox"]')).toHaveLength(5);
    fireEvent.click(preparo.querySelector('input[type="checkbox"]')!);
    expect(localStorage.getItem(STORAGE_KEYS.FOCO_WORKSHOPS)).toBeNull();
  });

  it('o fim do Pomodoro não conclui a tarefa antes da sessão; a conclusão só fica no card final', () => {
    const onCompleteTask = vi.fn();
    const { container } = render(createElement(OficinaSheet, {
      language: 'pt-BR', todayKey: DIA,
      tasks: [{ id: 't1', name: 'Enviar proposta', completed: false }], onCompleteTask,
    }));
    fireEvent.change(container.querySelector('[data-oficina-plano] input')!, { target: { value: 'Proposta' } });
    fireEvent.click(Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Próxima etapa')!);
    fireEvent.click(q(container, '[data-focus-environment="forest"]')!);
    fireEvent.change(container.querySelector('[data-oficina-plano] select')!, { target: { value: 't1' } });
    for (let i = 0; i < 6; i++) fireEvent.click(container.querySelector('[data-oficina-plano] footer button:last-child')!);
    fireEvent.click(q(container, '[data-oficina-save-session]')!);
    fireEvent.click(q(container, '[data-oficina-session-pomodoro]')!);
    act(() => { vi.setSystemTime(new Date(2026, 9, 4, 10, 26, 0)); vi.advanceTimersByTime(1000); });
    expect(q(container, '[data-oficina-task-complete]')).toBeNull();
    expect(onCompleteTask).not.toHaveBeenCalled();
  });

  it('separa a sequência de guias; a sequência é linear, sem setas de reordenação', () => {
    const { container, getByRole, getByText } = render(createElement(OficinaSheet, { language: 'pt-BR', todayKey: DIA }));
    expect(container.querySelector('[data-oficina-plano]')!.textContent).toContain('Etapa 1 de 8');
    expect(container.querySelector('[aria-label="Mover etapa para trás"]')).toBeNull();
    expect(container.querySelector('[aria-label="Mover etapa para frente"]')).toBeNull();
    fireEvent.click(getByRole('tab', { name: 'Guias' }));
    expect(container.querySelector('[data-oficina-guias]')).not.toBeNull();
    expect(container.querySelector('[data-oficina-plano]')).toBeNull();
    fireEvent.click(getByRole('tab', { name: 'Sessão' }));
    expect(container.querySelector('[data-oficina-plano]')).not.toBeNull();
    expect(getByText('Próxima etapa')).toBeTruthy();
  });

  it('mantém uma sessão salva em um card expansível, mostra subtópicos, permite editar/excluir e só conclui no final', () => {
    const onCompleteTask = vi.fn();
    const { container, getByLabelText, getByText } = render(createElement(OficinaSheet, {
      language: 'pt-BR', todayKey: DIA,
      tasks: [{ id: 't1', name: 'Enviar proposta', completed: false, steps: [{ id: 's1', label: 'Revisar valores', completed: false }] }], onCompleteTask,
    }));
    fireEvent.change(getByLabelText('Nome da sessão'), { target: { value: 'Fechar proposta' } });
    fireEvent.click(getByText('Próxima etapa'));
    fireEvent.click(q(container, '[data-focus-environment="forest"]')!);
    fireEvent.click(getByText('Próxima etapa'));
    fireEvent.change(container.querySelector('[data-oficina-plano] select')!, { target: { value: 't1' } });
    expect(container.querySelector('[data-oficina-plano] [data-oficina-task-complete]')).toBeNull();
    for (let i = 0; i < 5; i++) fireEvent.click(getByText('Próxima etapa'));
    expect(container.querySelector('[data-oficina-review]')!.textContent).toContain('Enviar proposta');
    expect(container.querySelector('[data-oficina-review]')!.textContent).toContain('Revisar valores');
    fireEvent.click(getByText('Salvar sessão'));
    expect(container.querySelector('[data-oficina-sessao-salva]')!.textContent).toContain('Fechar proposta');
    expect(container.querySelector('[data-oficina-sessao-salva]')!.textContent).toContain('Enviar proposta');
    expect(container.querySelector('[data-oficina-sessao-salva]')!.textContent).toContain('Revisar valores');
    fireEvent.click(getByText('Expandir sessão'));
    expect(container.querySelector('[data-oficina-session-details]')).not.toBeNull();
    expect(container.querySelector('[data-oficina-session-task-list]')!.textContent).toContain('Revisar valores');
    expect(container.querySelector('[data-oficina-session-details]')!.textContent).toContain('Pomodoro 25/5');
    fireEvent.click(getByText('Editar sessão'));
    expect(container.querySelector('[data-oficina-plano]')).not.toBeNull();
    fireEvent.click(getByText('Cancelar'));
    expect(container.querySelector('[data-oficina-sessao-salva]')).not.toBeNull();
    fireEvent.click(getByText('Concluir sessão'));
    expect(onCompleteTask).toHaveBeenCalledWith('t1');
    expect(container.querySelector('[data-oficina-sessao-salva]')!.textContent).toContain('Sessão concluída');
    expect(localStorage.getItem(STORAGE_KEYS.FOCO_WORKSHOP_PLAN)).not.toBeNull();
  });

  it('Brain Dump tem nome e cronômetro próprios; If-Then sugere uma recompensa e a última etapa é revisão', () => {
    const { container, getByLabelText, getByText } = render(createElement(OficinaSheet, { language: 'pt-BR', todayKey: DIA }));
    fireEvent.change(getByLabelText('Nome da sessão'), { target: { value: 'Estudar' } });
    for (let i = 0; i < 5; i++) fireEvent.click(getByText('Próxima etapa'));
    expect(container.querySelectorAll('[data-oficina-if-then] input')[1].getAttribute('placeholder')).toContain('jogar videogame');
    fireEvent.click(getByText('Próxima etapa'));
    expect(container.querySelector('[data-oficina-brain-dump]')!.textContent).toContain('Brain Dump');
    fireEvent.click(getByText('Próxima etapa'));
    expect(container.querySelector('[data-oficina-review]')).not.toBeNull();
    expect(container.textContent).not.toContain('temporary for this session');
  });

  it.each(FOCO_TECNICAS.map(t => [t.id, t] as const))('card "%s": responde ao toque (abre a explicação com a fonte e fecha ao tocar de novo)', (id, t) => {
    const { container, getByRole } = render(createElement(OficinaSheet, { language: 'pt-BR', todayKey: DIA }));
    fireEvent.click(getByRole('tab', { name: 'Guias' }));
    const btn = q(container, `[data-oficina-tecnica="${id}"] [data-oficina-tecnica-btn]`)!;
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(q(container, '[data-oficina-tecnica-corpo]')).toBeNull();
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    const corpo = q(container, `[data-oficina-tecnica="${id}"] [data-oficina-tecnica-corpo]`)!;
    expect(corpo.textContent).toContain(t.howPt.slice(0, 40));
    expect(corpo.textContent).toContain(t.fonte);
    // Sem timer: diz com honestidade que é um guia (sem registro nem recompensa).
    expect(!!q(corpo, '[data-oficina-tecnica-guia]')).toBe(!t.timer);
    expect(q(container, `[data-oficina-tecnica="${id}"] [data-oficina-tecnica-kind]`)!.getAttribute('data-oficina-tecnica-kind')).toBe(t.timer ? 'timer' : 'guia');
    fireEvent.click(btn);
    expect(q(container, '[data-oficina-tecnica-corpo]')).toBeNull();
  });

  it('reabrir a folha com um timer salvo retoma de onde o relógio está', () => {
    const a = render(createElement(OficinaSheet, { language: 'pt-BR', todayKey: DIA }));
    iniciarSessao(a.container);
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

  it('anotações antigas ficam acessíveis em Ver todas e o filtro por dia mostra só a data escolhida', () => {
    const base = [
      { id: 'a', day: '2026-10-04', formato: 'livre', text: 'anotação de hoje', at: 4 },
      { id: 'b', day: '2026-10-03', formato: 'livre', text: 'anotação de ontem', at: 3 },
      { id: 'c', day: '2026-10-02', formato: 'livre', text: 'anotação antiga', at: 2 },
      { id: 'd', day: '2026-10-01', formato: 'livre', text: 'anotação mais antiga', at: 1 },
    ] as CadernoEntry[];
    const { container, getByRole } = render(createElement(Viva, { inicial: base }));
    expect(container.querySelectorAll('[data-caderno-entrada]')).toHaveLength(3);
    fireEvent.click(getByRole('button', { name: 'Ver todas' }));
    expect(container.querySelectorAll('[data-caderno-entrada]')).toHaveLength(4);
    fireEvent.change(getByRole('combobox', { name: 'Filtrar por dia' }), { target: { value: '2026-10-02' } });
    expect(container.querySelectorAll('[data-caderno-entrada]')).toHaveLength(1);
    expect(container.querySelector('[data-caderno-entrada]')!.textContent).toContain('anotação antiga');
    expect(container.textContent).not.toContain('anotação mais antiga');
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
