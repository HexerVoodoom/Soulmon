// @vitest-environment jsdom
/**
 * O DUELO DA ARENA com TORCIDA por toques (H14, 02/10/2026, REGISTRO §20) na CENA NOVA
 * em tela cheia (rodada 5 / I10, §20.9).
 *
 * O pet golpeia SOZINHO; o dono torce tocando em qualquer lugar; o gauge cheio
 * (16 toques) vira um golpe de torcida gasto pelo pet. A esquiva SAIU
 * (TORC-3): o pet se defende sozinho (`utils/autoDefesa.ts`). O caminho antigo (barra de ataque) está atrás de
 * `ARENA_TIMING_ATTACK_ENABLED` e é coberto por `ArenaGame.render.test.tsx`.
 *
 * Ritmo (`utils/combatFx.ts`): o golpe do pet CHEGA ~2,2 s depois de abrir o turno
 * (a ação visual começa antes: investida/projétil) e o revide ~1,1 s depois de abrir.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { ArenaGame } from './ArenaGame';
import {
  ARENA_AUTO_ACC, ARENA_TIMING_ATTACK_ENABLED, ARENA_TORCIDA_MULT, playerHitDamage,
} from '../utils/arena';
import { TORCIDA_TAPS_FULL } from '../utils/torcida';

const POOL = [{
  nome: 'irrelevante', elementos: ['fogo'],
  atributos: { forca: 5, inteligencia: 5, velocidade: 5, magia: 5 },
  tamanho: 'medio', hostilidade: 5,
}];

vi.mock('../utils/arena', async importOriginal => {
  const real = await importOriginal<typeof import('../utils/arena')>();
  return {
    ...real,
    loadBestiaryPool: vi.fn(async () => POOL),
    playerHitDamage: vi.fn(real.playerHitDamage),
  };
});
vi.mock('./pixel/TimingBar', () => ({
  TimingBar: ({ label, onStop }: { label: string; onStop: (a: number) => void }) => (
    <button onClick={() => onStop(1)}>{label}</button>
  ),
}));
vi.mock('../utils/sounds', () => ({ playTaskComplete: vi.fn(), playFeed: vi.fn() }));
vi.mock('../utils/sprites', () => ({
  getDungeonEnemySprite: () => ({ sprite: 'x.png', name: 'x', line: 'x' }),
  getSpriteForStage: () => 'pet.png',
}));

/** O golpe do pet chega em ≤ 2,4 s; o revide, em ≤ 1,4 s depois. */
const GOLPE_MS = 2500;
const TURNO_MS = 2500 + 1500;

async function entrar(language: 'pt-BR' | 'en-US' = 'pt-BR', onExit: () => void = () => {}) {
  renderWithCss(<ArenaGame evolutionStage="rookie" language={language} onExit={onExit} />);
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  fireEvent.click(screen.getByRole('button', { name: /Entrar na Arena|Enter the Arena/i }));
}
const camada = () => document.querySelector('[data-torcida-layer]') as HTMLElement;
const gauge = () => document.querySelector('[data-torcida-gauge]') as HTMLElement;
const fase = () => document.querySelector('[data-arena-fase]')?.getAttribute('data-arena-fase');
const avancar = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const hit = vi.mocked(playerHitDamage);

beforeEach(() => { vi.useFakeTimers(); hit.mockClear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Duelo da Arena — a cena em tela cheia', () => {
  it('a luta é a CENA: tela cheia, o seu Soulmon e o inimigo, HP nos pés, X no canto direito, sem texto explicativo', async () => {
    await entrar();
    const cena = document.querySelector('[data-battle-stage]');
    expect(cena).not.toBeNull();
    expect(document.querySelector('[data-stage-sprite="me"]')).not.toBeNull();
    expect(document.querySelector('[data-stage-sprite="foe"]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="me"]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="foe"]')).not.toBeNull();
    expect(document.querySelector('[data-stage-close]')).not.toBeNull();
    // A faixinha antiga (o visor 348×160) não existe mais na luta.
    expect(document.querySelector('[data-visor-pet]')).toBeNull();
    // Nada de frase explicativa: o "?" é o InfoTip.
    expect(screen.queryByText(/ataca sozinho/i)).toBeNull();
    expect(screen.queryByText(/Toque em qualquer lugar/i)).toBeNull();
    expect(document.querySelector('[data-info-tip]')).not.toBeNull();
  });

  it('a barra de ataque está DESLIGADA (flag) e o gauge de torcida aparece na luta', async () => {
    expect(ARENA_TIMING_ATTACK_ENABLED).toBe(false);
    await entrar();
    expect(screen.queryByText('Atacar!')).toBeNull();
    expect(gauge()).not.toBeNull();
    expect(gauge().getAttribute('data-torcida-full')).toBe('0');
  });

  it('a intro explica a torcida e que o Soulmon se defende sozinho', async () => {
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={() => {}} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(document.querySelector('[data-arena-torcida-legenda]')?.textContent).toMatch(/torce tocando na tela/i);
    expect(document.querySelector('[data-arena-torcida-legenda]')?.textContent).toMatch(/se defende sozinho/i);
  });

  it('o ritmo é LENTO: nada acontece antes de ~1,4 s e o golpe só chega depois do projétil', async () => {
    await entrar();
    avancar(1000);
    expect(hit).not.toHaveBeenCalled();
    expect(document.querySelector('[data-stage-fx]')).toBeNull(); // ainda nem começou a ação
    avancar(600); // 1,6 s: a ação visual já saiu, o dano ainda não chegou
    expect(document.querySelector('[data-stage-fx]')).not.toBeNull();
    expect(hit).not.toHaveBeenCalled();
    avancar(GOLPE_MS - 1600);
    expect(hit).toHaveBeenCalledTimes(1);
  });

  it('sem torcer: o pet ataca sozinho com a precisão fixa, golpe-base (multiplicador 1), e a defesa abre', async () => {
    await entrar();
    avancar(GOLPE_MS);
    expect(hit).toHaveBeenCalledTimes(1);
    const [, acc, , skillMult] = hit.mock.calls[0];
    expect(acc).toBe(ARENA_AUTO_ACC);
    expect(skillMult ?? 1).toBe(1); // a torcida só soma: sem toque, é o golpe de sempre
    // A esquiva por timing saiu (TORCIDA-3): nenhuma barra, o pet se defende sozinho.
    expect(screen.queryByText('Desviar!')).toBeNull();
    expect(fase()).toBe('defender');
  });

  it('a defesa é AUTOMÁTICA: sem nenhum toque, o revide se resolve sozinho e o turno volta para o ataque', async () => {
    await entrar();
    avancar(GOLPE_MS);
    expect(fase()).toBe('defender');
    avancar(1500);
    expect(fase()).toBe('atacar');
    avancar(GOLPE_MS);
    expect(hit).toHaveBeenCalledTimes(2);
  });

  it('o revide mostra o ataque do inimigo (investida/projétil do ELEMENTO dele) e, ao defender, o escudo', async () => {
    await entrar();
    avancar(GOLPE_MS);
    avancar(800); // o revide já saiu
    const fx = [...document.querySelectorAll('[data-stage-fx] img')].map(i => i.getAttribute('src') ?? '');
    expect(fx.length).toBeGreaterThan(0);
    // Todas as figuras do FX vêm da arte de skill (`fx-<elemento>-<estado>.png`).
    for (const src of fx) expect(src).toMatch(/fx-[a-z_]+-(cast|aura|slash|impact|defended|orb)/);
  });

  it('tocar em qualquer lugar enche o gauge; cheio, o pet GASTA num golpe ×torcida e o gauge zera', async () => {
    await entrar();
    for (let i = 0; i < TORCIDA_TAPS_FULL; i++) fireEvent.pointerDown(camada());
    expect(gauge().getAttribute('data-torcida-full')).toBe('1');
    avancar(GOLPE_MS);
    expect(hit).toHaveBeenCalledTimes(1);
    expect(hit.mock.calls[0][3]).toBe(ARENA_TORCIDA_MULT);
    expect(gauge().getAttribute('data-torcida-full')).toBe('0');
  });

  it('o golpe da torcida é o ESPECIAL na cena: o conjurador solta o círculo e o projétil grande', async () => {
    await entrar();
    for (let i = 0; i < TORCIDA_TAPS_FULL; i++) fireEvent.pointerDown(camada());
    avancar(1600);
    const classes = [...document.querySelectorAll('[data-stage-fx]')].map(e => e.getAttribute('data-stage-fx'));
    expect(classes).toContain('sm-bs-cast');
    expect(classes).toContain('sm-bs-fly');
  });

  it('toque a mais não rende: 40 toques valem o mesmo golpe que 16, e o excedente não sobra', async () => {
    await entrar();
    for (let i = 0; i < 40; i++) fireEvent.pointerDown(camada());
    avancar(GOLPE_MS);
    expect(hit.mock.calls[0][3]).toBe(ARENA_TORCIDA_MULT);
    expect(gauge().getAttribute('data-torcida-full')).toBe('0');
  });

  it('gauge pela metade não vira golpe de torcida e SOBRA para o próximo turno', async () => {
    await entrar();
    for (let i = 0; i < TORCIDA_TAPS_FULL - 3; i++) fireEvent.pointerDown(camada());
    avancar(GOLPE_MS);
    expect(hit.mock.calls[0][3] ?? 1).toBe(1);
    expect(gauge().getAttribute('data-torcida-full')).toBe('0');
    // 13 toques ficaram guardados: mais 3 enchem o gauge para o turno seguinte.
    for (let i = 0; i < 3; i++) fireEvent.pointerDown(camada());
    expect(gauge().getAttribute('data-torcida-full')).toBe('1');
  });

  it('o botão Torcer! torce (teclado e leitor de tela) e o de sair não vira torcida', async () => {
    await entrar();
    const sair = screen.getByRole('button', { name: /^Sair$/ });
    fireEvent.pointerDown(sair);
    expect(gauge().getAttribute('data-torcida-full')).toBe('0');
    const torcer = screen.getByRole('button', { name: 'Torcer pelo seu Soulmon' });
    for (let i = 0; i < TORCIDA_TAPS_FULL; i++) fireEvent.click(torcer);
    expect(gauge().getAttribute('data-torcida-full')).toBe('1');
  });

  it('sair da luta pede CONFIRMAÇÃO (a corrida se perde), pausa a luta e só então chama onExit', async () => {
    const onExit = vi.fn();
    await entrar('pt-BR', onExit);
    fireEvent.click(screen.getByRole('button', { name: /^Sair$/ }));
    expect(onExit).not.toHaveBeenCalled();
    expect(document.querySelector('[data-stage-confirm]')).not.toBeNull();
    // Pausada: o relógio não anda enquanto a pergunta está aberta.
    avancar(TURNO_MS * 2);
    expect(hit).not.toHaveBeenCalled();
    // "Continuar" fecha e a luta segue.
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(document.querySelector('[data-stage-confirm]')).toBeNull();
    avancar(GOLPE_MS);
    expect(hit).toHaveBeenCalledTimes(1);
    // Agora sai de verdade.
    fireEvent.click(screen.getByRole('button', { name: /^Sair$/ }));
    fireEvent.click(document.querySelector('[data-stage-confirm-leave]') as HTMLElement);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('antes da luta (intro) o toque não vale nada', async () => {
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={() => {}} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    for (let i = 0; i < 10; i++) fireEvent.pointerDown(camada());
    fireEvent.click(screen.getByRole('button', { name: /Entrar na Arena/i }));
    expect(gauge().getAttribute('data-torcida-full')).toBe('0');
  });

  it('em inglês: "Cheer!" e nada de português na luta', async () => {
    await entrar('en-US');
    expect(screen.getByRole('button', { name: 'Cheer for your Soulmon' })).toBeTruthy();
    const texto = document.body.textContent ?? '';
    for (const palavra of ['Torcer', 'torcida', 'sozinho', 'Rodada', 'Você', 'Continuar']) {
      expect(texto.includes(palavra), `"${palavra}" vazou para a tela em inglês`).toBe(false);
    }
    fireEvent.click(screen.getByRole('button', { name: /^Leave$/ }));
    expect(screen.getByRole('button', { name: 'Keep going' })).toBeTruthy();
  });
});
