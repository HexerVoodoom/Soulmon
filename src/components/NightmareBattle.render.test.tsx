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
import { shadowSource } from '../utils/nightmareShadows';
import { NIGHTMARE_KNOBS } from '../utils/dungeonFight';
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
vi.mock('../utils/sounds', () => ({ playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playFeed: vi.fn() }));

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
const entrar = () => fireEvent.click(screen.getByRole('button', { name: 'Encarar o pesadelo' }));
const energia = (de: 'me' | 'foe') => Number(document.querySelector(`[data-stage-plate="${de}"] [data-stage-energy]`)?.getAttribute('aria-valuenow'));
/** Avança de 100 em 100 ms até a condição valer (ou `maxMs`). */
async function ate(cond: () => boolean, maxMs = 60_000) {
  for (let t = 0; t < maxMs && !cond(); t += 100) await avancar(100);
  return cond();
}

describe('Pesadelo — convite', () => {
  it('C1 (15/10/2026): o convite mostra o PRÓPRIO pesadelo da noite (a sombra), não um Soulmon comum nem a bolha dungeon-spirit', () => {
    const sombra = shadowSource(1, 0).src;
    const { container } = montar([{ ...inimigo(), sprite: sombra }]);
    const img = container.querySelector('[data-visor-enemy]') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(sombra);
    expect(img.getAttribute('src') ?? '').not.toMatch(/dungeon-spirit/);
  });
  it('D-69 (19/10/2026): o convite é enxuto — título, nome, UMA frase de descrição e o botão; sem "de manhã…", sem recompensa/"Perder não custa nada", sem dica', () => {
    montar([inimigo()]);
    const texto = document.body.textContent ?? '';
    expect(screen.getByRole('heading', { name: 'Ah, não! Um pesadelo!' })).toBeTruthy();
    expect(document.querySelector('[data-nightmare-name]')?.textContent).toBeTruthy();
    expect(document.querySelector('[data-nightmare-flavor]')?.textContent).toMatch(/^[^.]+\.$/);
    expect(screen.getByRole('button', { name: 'Encarar o pesadelo' })).toBeTruthy();
    expect(document.querySelector('[data-nightmare-rule]')).toBeNull();
    expect(texto).not.toMatch(/De manhã, seu Soulmon conta/);
    expect(texto).not.toMatch(/Perder não custa nada/);
    expect(texto).not.toMatch(/Uma luta só/);
    expect(texto).not.toMatch(/Toque na tela para torcer/);
    expect(texto).not.toMatch(/Bits/);
  });
});

describe('Pesadelo — a luta em tela cheia', () => {
  it('a luta é a CENA: tela cheia, lutadores grandes, HP e ENERGIA do pet, COM o mascote da torcida (15/10/2026) e SEM barra de torcida; os dois objetivos à vista', () => {
    vi.useFakeTimers();
    montar([inimigo()]);
    entrar();
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="me"] [data-stage-energy]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="foe"] [data-stage-energy]')).toBeNull(); // sem especial: sem barra
    expect(document.querySelector('[data-cheer-mascot]')).not.toBeNull();
    expect(document.querySelector('[data-torcida-gauge]')).toBeNull();
    expect(document.querySelector('[data-nightmare-objective="cheer"]')?.getAttribute('data-done')).toBe('false');
    expect(document.querySelector('[data-nightmare-objective="special"]')?.getAttribute('data-done')).toBe('false');
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

  it('COM torcida: tocar na cena enche a barra e despeja a descarga no núcleo (o teto anti-auto-clique segue valendo)', async () => {
    vi.useFakeTimers();
    montar([inimigo({ hpMul: 6 })]);
    entrar();
    await avancar(10);
    for (let i = 0; i < 60; i++) fireEvent.pointerDown(document.querySelector('[data-torcida-layer]')!);
    await avancar(200);
    expect(H.cheerSeen).toBe(0); // 16 toques por janela de 3 s: 24 ainda não chegaram
    await avancar(3100);
    for (let i = 0; i < 60; i++) fireEvent.pointerDown(document.querySelector('[data-torcida-layer]')!);
    await avancar(3000); // o núcleo recolhe a descarga no passo seguinte do relógio
    expect(H.cheerSeen).toBeGreaterThanOrEqual(1);
    expect(document.querySelector('[data-nightmare-objective="cheer"]')?.getAttribute('data-done')).toBe('true');
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
    expect(H.answers[0]).toEqual({ who: 0, ans: NIGHTMARE_KNOBS.ring.otimo }); // direct (padrão) × ofício padrão
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

  it('a vitória é o HP: pesadelo a zero = extinto (mesmo um fraquinho, sem torcida): prêmio e o texto das sombras', async () => {
    vi.useFakeTimers();
    const onWin = vi.fn();
    montar([inimigo({ hpMul: 0.05 })], { onWin });
    entrar();
    expect(await ate(() => onWin.mock.calls.length > 0)).toBe(true);
    expect(screen.getByText('As sombras se dissipam, o pesadelo foi extinto e dá espaço para os sonhos.')).toBeTruthy();
  });

  it('Com torcida + o especial acertado (anel ótimo) o Soulmon vence: prêmio e o texto das sombras', async () => {
    vi.useFakeTimers();
    H.startEnergy = [100];
    const onWin = vi.fn();
    montar([inimigo({ hpMul: 1 })], { onWin });
    entrar();
    // joga como alguém atento: acerta todo anel na hora certa e torce (um toque por passo de 100 ms, o teto da janela segura o resto)
    for (let t = 0; t < 200_000 && onWin.mock.calls.length === 0; t += 100) {
      const ring = document.querySelector('[data-stage-ring]') as HTMLElement | null;
      if (ring) { await avancar(Number(ring.getAttribute('data-ring-target'))); fireEvent.pointerDown(document.body); }
      else fireEvent.pointerDown(document.querySelector('[data-torcida-layer]') ?? document.body);
      await avancar(100);
    }
    expect(onWin).toHaveBeenCalledTimes(1);
    expect(H.cheerSeen).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Seu Soulmon cuidou da sua noite!')).toBeTruthy();
    expect(screen.getByText('As sombras se dissipam, o pesadelo foi extinto e dá espaço para os sonhos.')).toBeTruthy();
    expect(document.querySelector('[data-battle-stage]')).toBeNull();
  });

  it('UMA fase: com um inimigo não há contador de fases na cena', () => {
    vi.useFakeTimers();
    montar([inimigo()]);
    entrar();
    expect(document.body.textContent ?? '').not.toMatch(/\b1\/1\b/);
  });

  it('perder NÃO custa nada: o pesadelo desvanece (onLose só marca a noite)', async () => {
    vi.useFakeTimers();
    const onLose = vi.fn();
    montar([inimigo({ hpMul: 40, bonus: 6 })], { onLose });
    entrar();
    expect(await ate(() => onLose.mock.calls.length > 0, 200_000)).toBe(true);
    expect(onLose).toHaveBeenCalledTimes(1);
    expect(screen.getByText('O pesadelo desvaneceu, mas continua à espreita.')).toBeTruthy();
    // R6 (dono, 19/10/2026): na derrota ficam SÓ o título e o botão — a frase "Nada foi perdido" e o "Amanhã tem outra noite" saíram.
    expect(document.body.textContent).not.toMatch(/Nada foi perdido/);
    expect(document.body.textContent).not.toMatch(/Amanhã tem outra noite/);
    expect(screen.getByRole('button', { name: 'Bom dia!' })).toBeTruthy();
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
    expect(H.answers[0].ans).toBeCloseTo(NIGHTMARE_KNOBS.ring.otimo * 1.1, 9);
  });

  it('em inglês: nada de português na luta', () => {
    vi.useFakeTimers();
    montar([inimigo()], { language: 'en-US' });
    fireEvent.click(screen.getByRole('button', { name: 'Face the nightmare' }));
    const texto = document.body.textContent ?? '';
    for (const palavra of ['Torcer', 'Pesadelo', 'Seu Soulmon', 'Sair']) expect(texto.includes(palavra), palavra).toBe(false);
  });
});

describe('Pesadelo — convite sombrio (REGISTRO §88, D3)', () => {
  it('sem "Agora não"/"Not now"; o botão novo; a sombra tem a camada de glitch', () => {
    const { container } = montar([inimigo()]);
    expect(document.body.textContent).not.toMatch(/Agora não|Not now/);
    expect(screen.getByRole('button', { name: 'Encarar o pesadelo' })).toBeTruthy();
    expect(container.querySelector('[data-nightmare-shadow]') ?? document.querySelector('[data-nightmare-shadow]')).toBeTruthy();
  });
});
