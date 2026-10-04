// @vitest-environment jsdom
/**
 * O DUELO DA ARENA com ENERGIA (04/10/2026, REGISTRO §20.10) na cena em tela cheia (§20.9).
 *
 * O pet golpeia SOZINHO e se defende sozinho; cada lutador tem UMA barra de energia (ataque dado +
 * sofrido + cheer); a barra de cheer (24 toques, lenta) despeja energia no pet; energia cheia = o
 * ESPECIAL da ficha, com o ANEL (PvE); o especial do inimigo pode ser esquivado deslizando o dedo.
 * O caminho antigo (carga em turnos + golpe de torcida ×1,35) está atrás de `ARENA_ENERGY_ENABLED`
 * e a barra de ataque atrás de `ARENA_TIMING_ATTACK_ENABLED` (cobertos pelos testes de `arena.test.ts`).
 *
 * Ritmo (`utils/combatFx.ts`): cada lado leva `PVE_STEP_MS` (1,7 s) por golpe.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { ArenaGame } from './ArenaGame';
import {
  ARENA_AUTO_ACC, ARENA_ENERGY_ENABLED, ARENA_TIMING_ATTACK_ENABLED, SPECIAL_EFFECTS, playerHitDamage,
} from '../utils/arena';
import { CHEER_TAPS_FULL, ENERGY_CHEER, ENERGY_MAX, RING_MULT } from '../utils/energia';

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

/** O golpe do pet CHEGA em ~1,7 s (lead 0,94 s + projétil 0,76 s). */
const GOLPE_MS = 1800;
/** Uma ida-e-volta com UM inimigo. */
const IDA_MS = 3600;

async function entrar(language: 'pt-BR' | 'en-US' = 'pt-BR', onExit: () => void = () => {}) {
  renderWithCss(<ArenaGame evolutionStage="rookie" language={language} onExit={onExit} />);
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  fireEvent.click(screen.getByRole('button', { name: /Entrar na Arena|Enter the Arena/i }));
}
const camada = () => document.querySelector('[data-torcida-layer]') as HTMLElement;
const gauge = () => document.querySelector('[data-torcida-gauge]') as HTMLElement;
const ratio = () => parseFloat(gauge().getAttribute('data-torcida-ratio') ?? 'NaN');
const avancar = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const energia = (de: 'me' | 'foe') => Number(document.querySelector(`[data-stage-plate="${de}"] [data-stage-energy]`)?.getAttribute('aria-valuenow'));
const hit = vi.mocked(playerHitDamage);
const mascote = () => screen.getByRole('button', { name: 'Torcer pelo seu Soulmon' });

beforeEach(() => { vi.useFakeTimers(); hit.mockClear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Duelo da Arena — a cena em tela cheia com energia', () => {
  it('a luta é a CENA: tela cheia, lutadores grandes, HP E ENERGIA em cima de cada um, mascote da torcida, sem texto explicativo', async () => {
    await entrar();
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull();
    expect(document.querySelector('[data-stage-sprite="me"]')).not.toBeNull();
    expect(document.querySelector('[data-stage-sprite="foe"]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="me"] [data-stage-energy]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="foe"] [data-stage-energy]')).not.toBeNull();
    expect(document.querySelector('[data-stage-close]')).not.toBeNull();
    expect(document.querySelector('[data-cheer-mascot]')).not.toBeNull();
    // A faixinha antiga (o visor 348×160) e a carga em bolinhas não existem mais na luta.
    expect(document.querySelector('[data-visor-pet]')).toBeNull();
    expect(document.querySelector('[data-arena-charge]')).toBeNull();
    // Nada de frase explicativa: o "?" é o InfoTip.
    expect(screen.queryByText(/ataca sozinho/i)).toBeNull();
    expect(screen.queryByText(/Toque em qualquer lugar/i)).toBeNull();
    expect(document.querySelector('[data-info-tip]')).not.toBeNull();
  });

  it('as flags: a energia está LIGADA, a barra de ataque DESLIGADA e não há "Atacar!" na tela', async () => {
    expect(ARENA_ENERGY_ENABLED).toBe(true);
    expect(ARENA_TIMING_ATTACK_ENABLED).toBe(false);
    await entrar();
    expect(screen.queryByText('Atacar!')).toBeNull();
    expect(gauge()).not.toBeNull();
    expect(ratio()).toBe(0);
  });

  it('a explicação da intro mora atrás do "?" (InfoTip), não solta na tela', async () => {
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={() => {}} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(screen.queryByText(/luta sozinho/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Como funciona o Duelo' }));
    const texto = document.body.textContent ?? '';
    expect(texto).toMatch(/barra de cheer/i);
    expect(texto).toMatch(/anel/i);
    expect(texto).toMatch(/deslize/i);
  });

  it('o ritmo: nada acontece antes de ~1 s e o golpe só chega depois do projétil (~1,7 s)', async () => {
    await entrar();
    await avancar(800);
    expect(hit).not.toHaveBeenCalled();
    expect(document.querySelector('[data-stage-fx]')).toBeNull(); // ainda nem começou a ação
    await avancar(500); // a ação visual já saiu, o dano ainda não chegou
    expect(document.querySelector('[data-stage-fx]')).not.toBeNull();
    expect(hit).not.toHaveBeenCalled();
    await avancar(GOLPE_MS - 1300);
    expect(hit).toHaveBeenCalledTimes(1);
  });

  it('sem torcer: o pet ataca sozinho com a precisão fixa, golpe-base (multiplicador 1), e o inimigo revida', async () => {
    await entrar();
    await avancar(GOLPE_MS);
    expect(hit).toHaveBeenCalledTimes(1);
    const [, acc, , skillMult] = hit.mock.calls[0];
    expect(acc).toBe(ARENA_AUTO_ACC);
    expect(skillMult ?? 1).toBe(1);
    expect(energia('me')).toBeGreaterThan(0); // o ataque DADO encheu a barra do pet
    expect(energia('foe')).toBeGreaterThan(0); // e o SOFRIDO a do inimigo
    // A esquiva por timing saiu: nenhuma barra, o pet se defende sozinho nos golpes normais.
    expect(screen.queryByText('Desviar!')).toBeNull();
    await avancar(IDA_MS);
    expect(hit).toHaveBeenCalledTimes(2); // e o turno volta para o ataque
  });

  it('o revide mostra o ataque do inimigo com a arte do ELEMENTO dele', async () => {
    await entrar();
    await avancar(GOLPE_MS + 1300);
    const fx = [...document.querySelectorAll('[data-stage-fx] img')].map(i => i.getAttribute('src') ?? '');
    expect(fx.length).toBeGreaterThan(0);
    for (const src of fx) expect(src).toMatch(/fx-[a-z_]+-(cast|aura|slash|impact|defended|orb)/);
  });
});

describe('Duelo da Arena — a barra de cheer e a energia', () => {
  it('tocar em qualquer lugar enche a barra de cheer DEVAGAR: 24 toques; cheia, despeja energia no pet e zera', async () => {
    await entrar();
    for (let i = 0; i < CHEER_TAPS_FULL - 1; i++) fireEvent.pointerDown(camada());
    expect(ratio()).toBeCloseTo((CHEER_TAPS_FULL - 1) / CHEER_TAPS_FULL, 1);
    expect(energia('me')).toBe(0);
    fireEvent.pointerDown(camada());
    expect(ratio()).toBe(0); // a barra zerou
    expect(energia('me')).toBe(ENERGY_CHEER); // e a energia do pet subiu um tanto maior que um golpe
  });

  it('o MASCOTE torce (e grita); o botão de sair não vira torcida', async () => {
    await entrar();
    const sair = screen.getByRole('button', { name: /^Sair$/ });
    fireEvent.pointerDown(sair);
    expect(ratio()).toBe(0);
    fireEvent.click(mascote());
    expect(ratio()).toBeGreaterThan(0);
    expect(document.querySelector('[data-cheer-bubble]')?.textContent).toBe('VAI!');
  });

  it('energia cheia: o golpe seguinte é o ESPECIAL e pede o ANEL; o toque na hora certa dá o multiplicador ÓTIMO', async () => {
    await entrar();
    for (let i = 0; i < CHEER_TAPS_FULL * 3; i++) fireEvent.click(mascote()); // 3 despejos: a barra enche
    expect(energia('me')).toBe(ENERGY_MAX);
    await avancar(1000); // o respiro antes do golpe do pet
    const ring = document.querySelector('[data-stage-ring]') as HTMLElement;
    expect(ring).not.toBeNull();
    expect(document.querySelector('[data-stage-charging]')).not.toBeNull(); // o pet carrega
    expect(hit).not.toHaveBeenCalled(); // o golpe só sai depois do toque
    const alvo = Number(ring.getAttribute('data-ring-target'));
    expect(alvo).toBeGreaterThan(1000);
    await avancar(alvo); // o anel encosta no alvo
    fireEvent.pointerDown(document.body); // toque em qualquer lugar
    await avancar(1100);
    expect(hit).toHaveBeenCalledTimes(1);
    const [, acc, , skillMult] = hit.mock.calls[0];
    expect(acc).toBe(ARENA_AUTO_ACC);
    // o especial da ficha genérica (combate_fisico) × a nota ÓTIMA do anel
    expect(skillMult).toBeCloseTo(SPECIAL_EFFECTS.combate_fisico.mult * RING_MULT.otimo, 5);
    expect(document.querySelector('[data-stage-ring]')).toBeNull();
    // gastou a barra
    expect(energia('me')).toBeLessThan(ENERGY_MAX / 2);
  });

  it('sem tocar o anel: o especial sai mesmo assim, só mais fraco (nota ruim) — agir bem é que rende mais', async () => {
    await entrar();
    for (let i = 0; i < CHEER_TAPS_FULL * 3; i++) fireEvent.click(mascote());
    await avancar(1000);
    expect(document.querySelector('[data-stage-ring]')).not.toBeNull();
    await avancar(2600); // o anel passa e acaba o respiro
    await avancar(1100);
    expect(hit).toHaveBeenCalledTimes(1);
    expect(hit.mock.calls[0][3]).toBeCloseTo(SPECIAL_EFFECTS.combate_fisico.mult * RING_MULT.ruim, 5);
  });

  it('com o anel na tela o toque é do anel: não conta como cheer', async () => {
    await entrar();
    for (let i = 0; i < CHEER_TAPS_FULL * 3; i++) fireEvent.click(mascote());
    await avancar(1000);
    const antes = ratio();
    fireEvent.pointerDown(camada());
    expect(ratio()).toBe(antes);
  });
});

describe('Duelo da Arena — sair e idiomas', () => {
  it('sair da luta pede CONFIRMAÇÃO (a corrida se perde), pausa a luta e só então chama onExit', async () => {
    const onExit = vi.fn();
    await entrar('pt-BR', onExit);
    fireEvent.click(screen.getByRole('button', { name: /^Sair$/ }));
    expect(onExit).not.toHaveBeenCalled();
    expect(document.querySelector('[data-stage-confirm]')).not.toBeNull();
    // Pausada: o relógio não anda enquanto a pergunta está aberta.
    await avancar(IDA_MS * 2);
    expect(hit).not.toHaveBeenCalled();
    // "Continuar" fecha e a luta segue.
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(document.querySelector('[data-stage-confirm]')).toBeNull();
    await avancar(GOLPE_MS);
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
    expect(ratio()).toBe(0);
  });

  it('em inglês: "Cheer" e nada de português na luta', async () => {
    await entrar('en-US');
    const cheer = screen.getByRole('button', { name: 'Cheer for your Soulmon' });
    for (let i = 0; i < CHEER_TAPS_FULL * 3; i++) fireEvent.click(cheer);
    await avancar(1000);
    const texto = document.body.textContent ?? '';
    for (const palavra of ['Torcer', 'torcida', 'sozinho', 'Rodada', 'Você', 'Continuar', 'Golpear']) {
      expect(texto.includes(palavra), `"${palavra}" vazou para a tela em inglês`).toBe(false);
    }
    expect(screen.getByRole('button', { name: 'Strike' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Leave$/ }));
    expect(screen.getByRole('button', { name: 'Keep going' })).toBeTruthy();
  });
});
