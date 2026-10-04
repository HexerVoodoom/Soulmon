// @vitest-environment jsdom
/**
 * Pesadelo (02/10/2026): o convite mostra uma criatura que já existe (C1). A LUTA (04/10/2026,
 * REGISTRO §20.10) é a cena em tela cheia da `BattleStage` — a mesma do Duelo e da Masmorra —
 * com HP e ENERGIA em cima de cada um, o mascote da torcida, a barra de cheer lenta e as duas
 * mecânicas ativas do PvE (o ANEL do especial e a ESQUIVA do especial do pesadelo).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { NightmareBattle } from './NightmareBattle';
import { DUNGEON_LINE_SPRITES } from '../utils/sprites';
import { CHEER_TAPS_FULL, ENERGY_CHEER, ENERGY_MAX, pveFoeHp } from '../utils/energia';
import type { DungeonEnemy } from '../utils/dungeon';

vi.mock('../utils/sounds', () => ({ playFeed: vi.fn() }));

beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.3); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

const inimigo = (hp: number, atk = 1): DungeonEnemy => ({
  name: 'Sombra', stage: 'rookie', sprite: DUNGEON_LINE_SPRITES.lumel.rookie,
  hp, atk, speed: 1, points: 1, dmgReduction: 0,
});

function montar(wave: DungeonEnemy[], cbs: { onWin?: () => void; onLose?: () => void; onClose?: () => void; language?: 'pt-BR' | 'en-US' } = {}) {
  return render(
    <NightmareBattle
      open wave={wave} rarity="common" petStage="rookie" petElement="fogo" language={cbs.language ?? 'pt-BR'}
      onWin={cbs.onWin ?? (() => {})} onLose={cbs.onLose ?? (() => {})} onClose={cbs.onClose ?? (() => {})}
    />,
  );
}
const avancar = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const entrar = () => fireEvent.click(screen.getByRole('button', { name: 'Ficar na frente dele' }));
const ratio = () => parseFloat(document.querySelector('[data-torcida-gauge]')!.getAttribute('data-torcida-ratio') ?? 'NaN');
const energia = (de: 'me' | 'foe') => Number(document.querySelector(`[data-stage-plate="${de}"] [data-stage-energy]`)?.getAttribute('aria-valuenow'));
const mascote = () => screen.getByRole('button', { name: 'Torcer pelo seu Soulmon' });

describe('Pesadelo — convite', () => {
  it('C1: usa uma criatura que já existe (linha própria), não a bolha roxa dungeon-spirit', () => {
    const { container } = montar([inimigo(5)]);
    const img = container.querySelector('[data-visor-enemy]') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(DUNGEON_LINE_SPRITES.ignar.champion);
    expect(img.getAttribute('src') ?? '').not.toMatch(/dungeon-spirit/);
  });
});

describe('Pesadelo — a luta em tela cheia', () => {
  it('a luta é a CENA: tela cheia, lutadores grandes, HP e ENERGIA em cima de cada um, mascote, barra de cheer — sem texto explicativo', () => {
    vi.useFakeTimers();
    montar([inimigo(40)]);
    entrar();
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="me"] [data-stage-energy]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="foe"] [data-stage-energy]')).not.toBeNull();
    expect(document.querySelector('[data-cheer-mascot]')).not.toBeNull();
    expect(document.querySelector('[data-torcida-gauge]')).not.toBeNull();
    expect(document.querySelector('[data-timing-bar]')).toBeNull(); // a TimingBar segue desligada
    expect(document.querySelector('[data-info-tip]')).not.toBeNull();
    expect(screen.queryByText(/torça por ele/i)).toBeNull();
    // o diálogo do convite sai de cena: a luta usa a viewport inteira
    expect(document.querySelector('[role="dialog"]:not([data-stage-confirm])')).toBeNull();
  });

  it('o golpe sai sozinho (~1,7 s) e a defesa automática responde — sem nenhum toque', async () => {
    vi.useFakeTimers();
    montar([inimigo(60)]);
    entrar();
    await avancar(1000);
    expect(document.querySelector('[data-stage-dmg]')).toBeNull();
    await avancar(900);
    expect(document.querySelector('[data-stage-dmg]')).not.toBeNull(); // o dano do pet chegou no impacto
    expect(energia('me')).toBeGreaterThan(0);
    await avancar(1800); // o revide do pesadelo
    expect(energia('foe')).toBeGreaterThan(0);
    expect(screen.queryByText('Desviar!')).toBeNull();
  });

  it('a barra de cheer é LENTA (24 toques) e, cheia, despeja energia no pet', () => {
    vi.useFakeTimers();
    montar([inimigo(60)]);
    entrar();
    for (let i = 0; i < CHEER_TAPS_FULL - 1; i++) fireEvent.click(mascote());
    expect(ratio()).toBeLessThan(1);
    expect(energia('me')).toBe(0);
    fireEvent.click(mascote());
    expect(ratio()).toBe(0);
    expect(energia('me')).toBe(ENERGY_CHEER);
  });

  it('energia cheia: o ESPECIAL pede o ANEL; o toque na hora certa o faz render mais', async () => {
    vi.useFakeTimers();
    montar([inimigo(200)]);
    entrar();
    for (let i = 0; i < CHEER_TAPS_FULL * 3; i++) fireEvent.click(mascote());
    expect(energia('me')).toBe(ENERGY_MAX);
    await avancar(1000);
    const ring = document.querySelector('[data-stage-ring]') as HTMLElement;
    expect(ring).not.toBeNull();
    const alvo = Number(ring.getAttribute('data-ring-target'));
    await avancar(alvo);
    fireEvent.pointerDown(document.body);
    await avancar(1100);
    // o especial ÓTIMO: 0,5 × dmg(4) × 3 × 1,35 = 8,1 → 8 (o golpe normal seria 2)
    const numeros = [...document.querySelectorAll('[data-stage-dmg]')].map(e => e.textContent ?? '');
    expect(numeros.some(t => t.includes('ÓTIMO!') && t.includes('8'))).toBe(true);
  });

  it('o especial do PESADELO carrega e pode ser ESQUIVADO: as setas aparecem e deslizar o dedo reduz o dano', async () => {
    vi.useFakeTimers();
    montar([inimigo(400, 6)]);
    entrar();
    let viuEsquiva = false;
    for (let i = 0; i < 400 && !viuEsquiva; i++) {
      await avancar(250);
      if (document.querySelector('[data-dodge-button]')) viuEsquiva = true;
    }
    expect(viuEsquiva).toBe(true);
    expect(screen.getByRole('button', { name: 'Esquivar para a esquerda' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Esquivar para a direita' }));
    expect(document.querySelector('.sm-bs-lunge')).not.toBeNull(); // o pet desliza
  });

  it('vencer: o último inimigo cai, o Pesadelo entrega as recompensas e a tela volta ao diálogo', async () => {
    vi.useFakeTimers();
    const onWin = vi.fn();
    montar([inimigo(2)], { onWin });
    entrar();
    await avancar(30_000);
    expect(onWin).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Seu Soulmon cuidou da sua noite!')).toBeTruthy();
    expect(document.querySelector('[data-battle-stage]')).toBeNull();
  });

  it('dois inimigos: a energia e a barra de cheer SEGUEM do primeiro para o segundo', async () => {
    vi.useFakeTimers();
    montar([inimigo(2), inimigo(80)]);
    entrar();
    for (let i = 0; i < 10; i++) fireEvent.click(mascote());
    const antes = ratio();
    expect(antes).toBeGreaterThan(0.3);
    await avancar(9000); // o primeiro cai e o segundo entra
    expect(document.querySelector('[data-stage-plate="foe"]')?.textContent).toContain(`/${pveFoeHp(80)}`);
    expect(ratio()).toBe(antes);
    expect(energia('me')).toBeGreaterThan(0);
  });

  it('perder NÃO custa nada: o sonho passou, você acorda bem (onLose só marca a noite)', async () => {
    vi.useFakeTimers();
    const onLose = vi.fn();
    montar([inimigo(900, 400)], { onLose });
    entrar();
    await avancar(120_000);
    expect(onLose).toHaveBeenCalledTimes(1);
    expect(screen.getByText('O sonho passou — e você acorda bem.')).toBeTruthy();
  });

  it('sair da luta pede confirmação, pausa e, ao sair, não custa nada', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    montar([inimigo(60)], { onClose });
    entrar();
    fireEvent.click(screen.getByRole('button', { name: 'Sair do pesadelo' }));
    expect(onClose).not.toHaveBeenCalled();
    await avancar(30_000);
    expect(document.querySelector('[data-stage-dmg]')).toBeNull(); // pausada
    fireEvent.click(document.querySelector('[data-stage-confirm-leave]') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('em inglês: nada de português na luta', () => {
    vi.useFakeTimers();
    montar([inimigo(60)], { language: 'en-US' });
    fireEvent.click(screen.getByRole('button', { name: 'Stand in its way' }));
    expect(screen.getByRole('button', { name: 'Cheer for your Soulmon' })).toBeTruthy();
    const texto = document.body.textContent ?? '';
    for (const palavra of ['Torcer', 'Pesadelo', 'Seu Soulmon', 'Sair']) expect(texto.includes(palavra), palavra).toBe(false);
  });
});
