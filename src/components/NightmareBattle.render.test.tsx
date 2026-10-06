// @vitest-environment jsdom
/**
 * Pesadelo (02/10/2026): o convite mostra uma criatura que já existe (C1). A LUTA é a cena em tela cheia
 * da `BattleStage` — a mesma do Duelo, da Arena e da Masmorra. Combate v3 (PR4, contexto §2.18): o motor é o
 * núcleo (`groupFightSteps` com 1 inimigo por vez, HP e energia carregados), o relógio da cena é o do núcleo
 * (`useGroupBattle`) e as regras de cada luta são as da Masmorra (`utils/dungeonFight.ts`).
 *
 * ⚠️ O núcleo roda de VERDADE. O que o teste instrumenta é a ENTRADA: um envoltório de `groupFightSteps`
 * (`vi.mock`) que põe energia inicial e anota a resposta que a cena deu a cada `cast` (o ponto onde o anel e
 * a esquiva viram multiplicador) e as descargas de cheer que o núcleo recolheu.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { NightmareBattle } from './NightmareBattle';
import { DUNGEON_LINE_SPRITES } from '../utils/sprites';
import { RING_MULT } from '../utils/energia';
import type { DungeonEnemy } from '../utils/dungeon';
import { REFERENCE_BUILDS, combatantAt } from '../utils/combate/level';
import { specialOf } from '../utils/combate/specials';
import type { FightSide } from '../utils/combate/fight';

const H = vi.hoisted(() => ({
  startEnergy: [] as (number | undefined)[],
  calls: 0,
  answers: [] as { who: number; ans: number | undefined }[],
  cheerSeen: 0,
}));

vi.mock('../utils/combate/group', async importOriginal => {
  const real = await importOriginal<typeof import('../utils/combate/group')>();
  return {
    ...real,
    groupFightSteps: function* (player: never, foes: never, opts: never) {
      const n = H.calls++;
      const o = opts as { startEnergy?: number; cheerDrain?: () => number };
      const drain = o.cheerDrain;
      const g = real.groupFightSteps(player, foes, {
        ...o, startEnergy: H.startEnergy[n] ?? o.startEnergy,
        cheerDrain: drain ? () => { const k = drain(); H.cheerSeen += k; return k; } : undefined,
      } as never);
      let r = g.next();
      while (!r.done) {
        const ans: number | undefined = yield r.value;
        if (r.value.kind === 'cast') H.answers.push({ who: r.value.who, ans });
        r = g.next(ans);
      }
      return r.value;
    },
  };
});
vi.mock('../utils/sounds', () => ({ playFeed: vi.fn() }));

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.3);
  Object.assign(H, { startEnergy: [], calls: 0, answers: [], cheerSeen: 0 });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

/** Um inimigo do Pesadelo de força declarada (L1, espelho balanceado: `hpMul` × vida, `bonus` de dano, com ou sem especial). */
const foeDe = (o: { hpMul?: number; bonus?: number; special?: boolean } = {}): FightSide => {
  const b = combatantAt(1, REFERENCE_BUILDS.balanced);
  return { combatant: { ...b, hp: b.hp * (o.hpMul ?? 1), bonus: o.bonus ?? -0.95 }, special: o.special ? specialOf('direct') : null };
};
const inimigo = (o: Parameters<typeof foeDe>[0] = {}): DungeonEnemy => ({
  name: 'Sombra', stage: 'rookie', sprite: DUNGEON_LINE_SPRITES.lumel.rookie, points: 1, slot: 0, floor: 1, foe: foeDe(o),
});

function montar(wave: DungeonEnemy[], cbs: { onWin?: () => void; onLose?: () => void; onClose?: () => void; language?: 'pt-BR' | 'en-US'; profissao?: string } = {}) {
  return render(
    <NightmareBattle
      open wave={wave} rarity="common" petStage="rookie" petElement="fogo" language={cbs.language ?? 'pt-BR'} profissao={cbs.profissao}
      onWin={cbs.onWin ?? (() => {})} onLose={cbs.onLose ?? (() => {})} onClose={cbs.onClose ?? (() => {})}
    />,
  );
}
const avancar = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const entrar = () => fireEvent.click(screen.getByRole('button', { name: 'Ficar na frente dele' }));
const energia = (de: 'me' | 'foe') => Number(document.querySelector(`[data-stage-plate="${de}"] [data-stage-energy]`)?.getAttribute('aria-valuenow'));
/** Avança de 100 em 100 ms até a condição valer (ou `maxMs`). */
async function ate(cond: () => boolean, maxMs = 60_000) {
  for (let t = 0; t < maxMs && !cond(); t += 100) await avancar(100);
  return cond();
}

describe('Pesadelo — convite', () => {
  it('C1: usa uma criatura que já existe (linha própria), não a bolha roxa dungeon-spirit', () => {
    const { container } = montar([inimigo()]);
    const img = container.querySelector('[data-visor-enemy]') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(DUNGEON_LINE_SPRITES.ignar.champion);
    expect(img.getAttribute('src') ?? '').not.toMatch(/dungeon-spirit/);
  });
});

describe('Pesadelo — a luta em tela cheia', () => {
  it('a luta é a CENA: tela cheia, lutadores grandes, HP e ENERGIA do pet, SEM mascote nem barra de torcida (§2.19) — sem texto explicativo; só quem tem especial mostra a energia', () => {
    vi.useFakeTimers();
    montar([inimigo()]);
    entrar();
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="me"] [data-stage-energy]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="foe"] [data-stage-energy]')).toBeNull(); // sem especial: sem barra
    expect(document.querySelector('[data-cheer-mascot]')).toBeNull();
    expect(document.querySelector('[data-torcida-gauge]')).toBeNull();
    expect(document.querySelector('[data-timing-bar]')).toBeNull(); // a TimingBar segue desligada
    expect(document.querySelector('[data-info-tip]')).toBeNull(); // A7: nenhum "?" dentro da luta
    expect(screen.queryByText(/torça por ele/i)).toBeNull();
    // o diálogo do convite sai de cena: a luta usa a viewport inteira
    expect(document.querySelector('[role="dialog"]:not([data-stage-confirm])')).toBeNull();
  });

  it('o inimigo com especial (o slot mega) mostra a barra de energia dele', () => {
    vi.useFakeTimers();
    montar([inimigo({ special: true })]);
    entrar();
    expect(document.querySelector('[data-stage-plate="foe"] [data-stage-energy]')).not.toBeNull();
  });

  it('o golpe sai sozinho e a defesa automática responde — sem nenhum toque; o número só chega no IMPACTO', async () => {
    vi.useFakeTimers();
    montar([inimigo({ hpMul: 3 })]);
    entrar();
    expect(document.querySelector('[data-stage-dmg]')).toBeNull();
    expect(await ate(() => document.querySelector('[data-stage-dmg]') !== null, 8000)).toBe(true);
    expect(energia('me')).toBeGreaterThan(0);
    expect(screen.queryByText('Desviar!')).toBeNull();
  });

  it('sem torcida: nenhum botão de torcer, e tocar na cena não despeja nada no núcleo', async () => {
    vi.useFakeTimers();
    montar([inimigo({ hpMul: 6 })]);
    entrar();
    await avancar(10);
    expect(screen.queryByRole('button', { name: /Torcer|Cheer/ })).toBeNull();
    for (let i = 0; i < 60; i++) fireEvent.pointerDown(document.querySelector('[data-torcida-layer]')!);
    await avancar(3100);
    expect(H.cheerSeen).toBe(0);
  });

  it('energia cheia: o ESPECIAL pede o ANEL (o relógio pausa); o toque na hora certa devolve o multiplicador ÓTIMO ao núcleo', async () => {
    vi.useFakeTimers();
    H.startEnergy = [100];
    montar([inimigo({ hpMul: 6 })]);
    entrar();
    expect(await ate(() => document.querySelector('[data-stage-ring]') !== null, 5000)).toBe(true);
    const ring = document.querySelector('[data-stage-ring]') as HTMLElement;
    await avancar(Number(ring.getAttribute('data-ring-target')));
    fireEvent.pointerDown(document.body);
    await avancar(1200);
    expect(H.answers[0]).toEqual({ who: 0, ans: RING_MULT.otimo }); // direct (padrão) × ofício padrão
  });

  it('o especial do PESADELO carrega e pode ser ESQUIVADO: as setas aparecem e deslizar o dedo vira a nota da esquiva', async () => {
    vi.useFakeTimers();
    montar([inimigo({ hpMul: 40, bonus: -0.5, special: true })]);
    entrar();
    expect(await ate(() => document.querySelector('[data-dodge-button]') !== null, 200_000)).toBe(true);
    expect(screen.getByRole('button', { name: 'Esquivar para a esquerda' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Esquivar para a direita' }));
    expect(document.querySelector('.sm-bs-lunge')).not.toBeNull(); // o pet desliza
  });

  it('vencer: o último inimigo cai, o Pesadelo entrega as recompensas e a tela volta ao diálogo', async () => {
    vi.useFakeTimers();
    const onWin = vi.fn();
    montar([inimigo({ hpMul: 0.05 })], { onWin });
    entrar();
    expect(await ate(() => onWin.mock.calls.length > 0)).toBe(true);
    expect(onWin).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Seu Soulmon cuidou da sua noite!')).toBeTruthy();
    expect(document.querySelector('[data-battle-stage]')).toBeNull();
  });

  it('dois inimigos: a energia SEGUE do primeiro para o segundo', async () => {
    vi.useFakeTimers();
    montar([inimigo({ hpMul: 0.2 }), inimigo({ hpMul: 8 })]);
    entrar();
    await avancar(10);
    // o primeiro cai e o segundo entra (o núcleo é chamado de novo)
    expect(await ate(() => H.calls >= 2)).toBe(true);
    await avancar(100);
    expect(energia('me')).toBeGreaterThan(0); // a energia do pet atravessou a troca
  });

  it('perder NÃO custa nada: o sonho passou, você acorda bem (onLose só marca a noite)', async () => {
    vi.useFakeTimers();
    const onLose = vi.fn();
    montar([inimigo({ hpMul: 40, bonus: 6 })], { onLose });
    entrar();
    expect(await ate(() => onLose.mock.calls.length > 0, 200_000)).toBe(true);
    expect(onLose).toHaveBeenCalledTimes(1);
    expect(screen.getByText('O sonho passou — e você acorda bem.')).toBeTruthy();
  });

  it('sair da luta pede confirmação, pausa e, ao sair, não custa nada', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    montar([inimigo({ hpMul: 3 })], { onClose });
    entrar();
    fireEvent.click(screen.getByRole('button', { name: 'Sair do pesadelo' }));
    expect(onClose).not.toHaveBeenCalled();
    await avancar(30_000);
    expect(document.querySelector('[data-stage-dmg]')).toBeNull(); // pausada
    fireEvent.click(document.querySelector('[data-stage-confirm-leave]') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('o ofício vale aqui como na Masmorra: o cast do pet sai × `jeito.dmg` (artesão 1,1)', async () => {
    vi.useFakeTimers();
    H.startEnergy = [100];
    montar([inimigo({ hpMul: 6 })], { profissao: 'artesao' });
    entrar();
    expect(await ate(() => document.querySelector('[data-stage-ring]') !== null, 5000)).toBe(true);
    const ring = document.querySelector('[data-stage-ring]') as HTMLElement;
    await avancar(Number(ring.getAttribute('data-ring-target')));
    fireEvent.pointerDown(document.body);
    await avancar(1200);
    expect(H.answers[0].ans).toBeCloseTo(RING_MULT.otimo * 1.1, 9);
  });

  it('em inglês: nada de português na luta', () => {
    vi.useFakeTimers();
    montar([inimigo()], { language: 'en-US' });
    fireEvent.click(screen.getByRole('button', { name: 'Stand in its way' }));
    expect(screen.queryByRole('button', { name: 'Cheer for your Soulmon' })).toBeNull();
    const texto = document.body.textContent ?? '';
    for (const palavra of ['Torcer', 'Pesadelo', 'Seu Soulmon', 'Sair']) expect(texto.includes(palavra), palavra).toBe(false);
  });
});
