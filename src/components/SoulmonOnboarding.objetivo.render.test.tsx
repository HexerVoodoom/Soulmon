// @vitest-environment jsdom
/**
 * OBJETIVO ANUAL (12/11/2026, E1/E2): três passos novos DEPOIS das áreas e ANTES das dificuldades (destino, porquê, obstáculo),
 * todos puláveis; o rascunho do portão guarda o que foi escrito; o ponto de partida ganha o objetivo no topo e a estrela de
 * prioridade (no máximo 3); o que foi escrito chega ao `onComplete` em `purpose`.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { ateAsMetas, escolherCarta, responderPerguntas, responderNome, responderNascimento } from '../test/metasOnboarding';
import { onboardingStepCode } from '../utils/telemetry';
import { RESSURG_BASE_IDS } from '../utils/ressurgimento';
import { entrarNaDemoPeloOvo } from '../test/ovoOnboarding';

const btn = (nome: string | RegExp) => screen.getByRole('button', { name: nome }) as HTMLButtonElement;

function passarPortao() {
  fireEvent.click(screen.getByText('I have read and agree to the Terms of Use and the Privacy Policy'));
  fireEvent.click(screen.getByText('I am 18 or older'));
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
}

/** Os campos moram em chunk lazy: espera o campo do destino aparecer. */
async function campoDoDestino(): Promise<HTMLInputElement> {
  return (await screen.findByLabelText('A year from now, where do you want to be?')) as HTMLInputElement;
}

beforeAll(() => { vi.setConfig({ testTimeout: 30_000 }); });
beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); installFakeStorage(); });
afterEach(() => { vi.useRealTimers(); });

async function ateOsPassos() {
  renderWithCss(<SoulmonOnboarding onComplete={vi.fn()} />);
  passarPortao();
  await ateAsMetas(false, 'Corvo Azul', 'ambicao');
  fireEvent.click(screen.getByRole('group').querySelector('button')!); // 1ª área
  fireEvent.click(btn('Continue'));
}

describe('onboarding — o destino, o porquê e o obstáculo (E1)', () => {
  it('depois das áreas vem o destino; exige >=3 caracteres OU pular', async () => {
    await ateOsPassos();
    expect(screen.getByText('A year from now, where do you want to be?', { selector: 'h2' })).toBeTruthy();
    const campo = await campoDoDestino();
    const cont = btn('Continue');
    expect(cont.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(cont); // trancado: não avança
    expect(screen.getByText('A year from now, where do you want to be?', { selector: 'h2' })).toBeTruthy();
    fireEvent.change(campo, { target: { value: 'ab' } });
    expect(btn('Continue').getAttribute('aria-disabled')).toBe('true');
    fireEvent.change(campo, { target: { value: 'Correr 5 km sem dor' } });
    expect(btn('Continue').getAttribute('aria-disabled')).toBeNull();
  });

  it('o campo aceita no máximo 200 caracteres e os exemplos por área só PREENCHEM o campo', async () => {
    await ateOsPassos();
    const campo = await campoDoDestino();
    expect(campo.maxLength).toBe(200);
    const exemplo = document.querySelector('[data-purpose-year] button[aria-pressed]') as HTMLElement | null;
    expect(exemplo).toBeTruthy();
    fireEvent.click(exemplo!);
    expect(campo.value.length).toBeGreaterThan(3);
    // ainda na mesma tela: tocar um exemplo não avança
    expect(screen.getByText('A year from now, where do you want to be?', { selector: 'h2' })).toBeTruthy();
  });

  it('com destino: porquê -> obstáculo -> dificuldades; voltar e avançar funcionam', async () => {
    await ateOsPassos();
    fireEvent.change(await campoDoDestino(), { target: { value: 'Correr 5 km sem dor' } });
    fireEvent.click(btn('Continue'));
    expect(screen.getByText('Why does this matter to you?')).toBeTruthy();
    expect(await screen.findByText('Taking care of my health')).toBeTruthy();
    fireEvent.click(btn('Continue'));
    expect(screen.getByText('What tends to get in the way?')).toBeTruthy();
    fireEvent.click(btn('Continue'));
    expect(screen.getByText('What gets in your way the most?')).toBeTruthy();
    fireEvent.click(btn('Back'));
    expect(screen.getByText('What tends to get in the way?')).toBeTruthy();
    fireEvent.click(btn('Back'));
    expect(screen.getByText('Why does this matter to you?')).toBeTruthy();
    fireEvent.click(btn('Back'));
    expect((await campoDoDestino()).value).toBe('Correr 5 km sem dor'); // o que foi escrito continua lá
  });

  it('pular o destino pula também o porquê e o obstáculo; voltar das dificuldades volta ao destino', async () => {
    await ateOsPassos();
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    expect(screen.getByText('What gets in your way the most?')).toBeTruthy();
    fireEvent.click(btn('Back'));
    expect(screen.getByText('A year from now, where do you want to be?', { selector: 'h2' })).toBeTruthy();
  });

  it('o rascunho do portão guarda o destino e o motivo: fechar o app e voltar traz tudo', async () => {
    await ateOsPassos();
    fireEvent.change(await campoDoDestino(), { target: { value: 'Ter calma no dia a dia' } });
    fireEvent.click(btn('Continue'));
    fireEvent.click(await screen.findByRole('button', { name: 'Taking care of my health' }));
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.GATE_DRAFT)!);
    expect(raw.purpose.goalText).toBe('Ter calma no dia a dia');
    expect(raw.purpose.motiveKey).toBe('health');
    expect(raw.step).toBe(-17);
  });

  it('o ponto de partida mostra o objetivo no topo e deixa marcar até 3 prioridades; a 4ª mostra aviso', async () => {
    const onComplete = vi.fn();
    renderWithCss(<SoulmonOnboarding onComplete={onComplete} />);
    passarPortao();
    await ateAsMetas(false, 'Ana Lua', 'ambicao');
    // 3 áreas: o ponto de partida traz mais de 3 itens (com 1 área sobram só 3)
    for (const o of Array.from(screen.getByRole('group').querySelectorAll('button')).slice(0, 3)) fireEvent.click(o);
    fireEvent.click(btn('Continue'));
    fireEvent.change(await campoDoDestino(), { target: { value: 'Correr 5 km sem dor' } });
    fireEvent.click(btn('Continue')); // -> porquê
    fireEvent.click(await screen.findByRole('button', { name: 'Taking care of my health' }));
    fireEvent.click(btn('Continue')); // -> obstáculo
    fireEvent.click(btn('Skip for now')); // pula o obstáculo
    for (const o of Array.from(screen.getByRole('group').querySelectorAll('button')).slice(0, 3)) fireEvent.click(o); // dificuldades
    fireEvent.click(btn('Continue'));
    for (const o of Array.from(screen.getByRole('group').querySelectorAll('button')).slice(0, 3)) fireEvent.click(o); // forças
    fireEvent.click(btn('Continue'));
    expect(screen.getByText('To get there, what will you do?')).toBeTruthy();
    expect(document.querySelector('[data-starter-goal]')!.textContent).toContain('Correr 5 km sem dor');
    await screen.findAllByRole('button', { name: 'Mark as priority' });
    const estrelas = () => Array.from(document.querySelectorAll('[data-priority-star]')) as HTMLElement[];
    expect(estrelas().length).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < 3; i++) fireEvent.click(estrelas()[i]);
    expect(estrelas().filter(e => e.getAttribute('aria-pressed') === 'true')).toHaveLength(3);
    fireEvent.click(estrelas()[3]);
    expect(estrelas().filter(e => e.getAttribute('aria-pressed') === 'true')).toHaveLength(3); // a 4ª não entra
    expect(document.querySelector('[data-priority-limit]')).toBeTruthy();
    // chega ao fim: o destino, o motivo e as 3 prioridades vão em `purpose`
    fireEvent.click(btn('Continue'));
    responderNascimento();
    entrarNaDemoPeloOvo();
    const data = onComplete.mock.calls[0][0];
    expect(data.purpose.goalText).toBe('Correr 5 km sem dor');
    expect(data.purpose.motive).toEqual({ key: 'health' });
    expect(data.purpose.priorityItemIds).toHaveLength(3);
    expect(data.purpose.plan).toBeUndefined();
  });

  it('quem pulou o destino chega ao fim SEM `purpose`', async () => {
    const onComplete = vi.fn();
    renderWithCss(<SoulmonOnboarding onComplete={onComplete} />);
    passarPortao();
    await ateAsMetas(false, 'Ana Lua', 'ambicao');
    fireEvent.click(screen.getByRole('group').querySelector('button')!);
    fireEvent.click(btn('Continue'));
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    for (let i = 0; i < 2; i++) { fireEvent.click(screen.getByRole('group').querySelector('button')!); fireEvent.click(btn('Continue')); }
    expect(screen.queryByText('To get there, what will you do?')).toBeNull();
    expect(document.querySelector('[data-priority-star]')).toBeNull();
    fireEvent.click(btn('Continue'));
    responderNascimento();
    entrarNaDemoPeloOvo();
    expect(onComplete.mock.calls[0][0].purpose).toBeUndefined();
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  });
});

describe('onboarding — as 3 cartas (PLANO §2b)', () => {
  const ateAsCartas = async () => {
    renderWithCss(<SoulmonOnboarding onComplete={vi.fn()} />);
    passarPortao();
    responderNome('Corvo Azul');
    await responderPerguntas();
  };

  it('as cartas vêm DEPOIS do teste e ANTES das áreas: 3 cartas lado a lado, sem escolher nada ainda', async () => {
    await ateAsCartas();
    expect(screen.getByText('Where are you right now?', { selector: 'h2' })).toBeTruthy();
    expect(document.querySelectorAll('[data-path-card]')).toHaveLength(3);
    expect(screen.queryByText('What do you want to improve?')).toBeNull();
    expect(onboardingStepCode(-19)).toBe(5); // código de telemetria próprio, sem colidir com outro passo
  });

  it('tocar a carta a traz à frente (diálogo, fundo escuro, X); "Escolher outra" e o X voltam sem escolher', async () => {
    await ateAsCartas();
    fireEvent.click(document.querySelector('[data-path-card="ressurgimento"]')!);
    const d = document.querySelector('[data-path-dialog]') as HTMLElement;
    expect(d.getAttribute('role')).toBe('dialog');
    expect(d.getAttribute('aria-modal')).toBe('true');
    expect(d.style.backgroundColor).toContain('rgba');
    expect(document.querySelector('[data-path-close]')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Choose this card' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Choose another' }));
    expect(document.querySelector('[data-path-dialog]')).toBeNull();
    fireEvent.click(document.querySelector('[data-path-card="satisfacao"]')!);
    fireEvent.click(document.querySelector('[data-path-close]')!);
    expect(document.querySelector('[data-path-dialog]')).toBeNull();
    fireEvent.click(document.querySelector('[data-path-card="ambicao"]')!);
    fireEvent.keyDown(document.querySelector('[data-path-dialog]')!, { key: 'Escape' });
    expect(document.querySelector('[data-path-dialog]')).toBeNull();
    expect(screen.getByText('Where are you right now?', { selector: 'h2' })).toBeTruthy(); // nada foi escolhido
  });

  it('Satisfação = o fluxo de sempre: áreas direto, sem destino; a seta de voltar leva às cartas', async () => {
    await ateAsCartas();
    escolherCarta('satisfacao');
    expect(screen.getByText('What do you want to improve?')).toBeTruthy();
    fireEvent.click(screen.getByRole('group').querySelector('button')!);
    fireEvent.click(btn('Continue'));
    expect(screen.getByText('What gets in your way the most?')).toBeTruthy(); // sem o passo do destino
    fireEvent.click(btn('Back'));
    fireEvent.click(btn('Back'));
    expect(screen.getByText('Where are you right now?', { selector: 'h2' })).toBeTruthy();
  });

  it('Ambição liga o fluxo do objetivo (destino logo depois das áreas)', async () => {
    await ateAsCartas();
    escolherCarta('ambicao');
    fireEvent.click(screen.getByRole('group').querySelector('button')!);
    fireEvent.click(btn('Continue'));
    expect(screen.getByText('A year from now, where do you want to be?', { selector: 'h2' })).toBeTruthy();
  });

  it('Ressurgimento: sem áreas/dificuldades/forças, o ponto de partida traz 3-4 itens de 2 min da lista-base; grava `path` e nenhum objetivo', async () => {
    const onComplete = vi.fn();
    renderWithCss(<SoulmonOnboarding onComplete={onComplete} />);
    passarPortao();
    await ateAsMetas(false, 'Ana Lua', 'ressurgimento');
    expect(screen.getByText('Let us go slowly')).toBeTruthy();
    expect(screen.queryByText('What do you want to improve?')).toBeNull();
    const itens = Array.from(document.querySelectorAll('[data-starter-item]')).map(e => e.getAttribute('data-starter-item')!);
    expect(itens.length).toBeGreaterThanOrEqual(3);
    expect(itens.length).toBeLessThanOrEqual(4);
    for (const id of itens) expect(RESSURG_BASE_IDS).toContain(id);
    expect(document.querySelector('[data-priority-star]')).toBeNull(); // sem objetivo, sem prioridades
    expect(document.body.textContent).not.toMatch(/depress|failed|diet|weight/i);
    fireEvent.click(btn('Back'));
    expect(screen.getByText('Where are you right now?', { selector: 'h2' })).toBeTruthy();
    escolherCarta('ressurgimento');
    fireEvent.click(btn('Continue'));
    responderNascimento();
    entrarNaDemoPeloOvo();
    const data = onComplete.mock.calls[0][0];
    expect(data.path).toBe('ressurgimento');
    expect(data.purpose).toBeUndefined();
    expect(data.catalogChoice.itemIds).toEqual(itens);
    expect(data.catalogChoice.areas).toEqual([]);
  });

  it('o rascunho do portão guarda o caminho', async () => {
    await ateAsCartas();
    escolherCarta('satisfacao');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.GATE_DRAFT)!).purpose.path).toBe('satisfacao');
  });
});
