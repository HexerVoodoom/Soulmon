// @vitest-environment jsdom
/**
 * A ARENA em GRUPO no núcleo v3 (PR3b, contexto §2.15–§2.17), na cena em tela cheia.
 *
 * O pet golpeia SOZINHO e se defende sozinho; cada lutador tem UMA barra de energia; a barra de cheer
 * (24 toques, lenta) despeja energia no pet; energia cheia = o ESPECIAL da ficha, com o ANEL (o relógio do
 * núcleo PAUSA); o especial do inimigo pode ser esquivado deslizando o dedo; o especial em ÁREA bate em todos
 * os alvos do círculo. O relógio é o do núcleo (`groupFightSteps`, em segundos).
 *
 * ⚠️ O núcleo roda de VERDADE. O que o teste instrumenta é a ENTRADA: um envoltório de `groupFightSteps`
 * (`vi.mock`) que (a) põe energia inicial, (b) encolhe a vida de quem precisa cair rápido e (c) anota a
 * resposta que a cena deu a cada `cast` — o ponto onde o anel e a esquiva viram multiplicador.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ArenaGame } from './ArenaGame';
import { CHEER_TAPS_FULL } from '../utils/energia';
import { SPECIAL_INTRO_MS } from '../utils/combatFx';
import type { StageSkills } from '../utils/soulProfile/ficha/skills';

const H = vi.hoisted(() => ({
  startEnergy: [] as (number | undefined)[],
  foeHp: 1,
  playerHp: 1,
  forceDraw: false,
  calls: 0,
  answers: [] as { who: number; ans: number | undefined }[],
  cheerSeen: 0,
}));

vi.mock('../utils/combate/group', async importOriginal => {
  const real = await importOriginal<typeof import('../utils/combate/group')>();
  return {
    ...real,
    groupFightSteps: function* (player: never, foes: never[], opts: never) {
      const n = H.calls++;
      if (H.forceDraw) return { winner: 'draw', t: 1, hpLeft: 0, energyLeft: 0, casts: 0 };
      const p = player as { combatant: { hp: number } };
      const o = opts as { startEnergy?: number; cheerDrain?: () => number };
      const drain = o.cheerDrain;
      const g = real.groupFightSteps(
        { ...p, combatant: { ...p.combatant, hp: p.combatant.hp * H.playerHp } } as never,
        (foes as { combatant: { hp: number } }[]).map(f => ({ ...f, combatant: { ...f.combatant, hp: f.combatant.hp * H.foeHp } })) as never,
        { ...o, startEnergy: H.startEnergy[n] ?? o.startEnergy, cheerDrain: drain ? () => { const k = drain(); H.cheerSeen += k; return k; } : undefined } as never,
      );
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

const POOL = [{
  nome: 'irrelevante', elementos: ['fogo'],
  atributos: { forca: 5, inteligencia: 5, velocidade: 5, magia: 5 },
  tamanho: 'medio', hostilidade: 5,
}];
vi.mock('../utils/arena', async importOriginal => {
  const real = await importOriginal<typeof import('../utils/arena')>();
  return { ...real, loadBestiaryPool: vi.fn(async () => POOL) };
});
vi.mock('../utils/sounds', () => ({ playAttack: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playTaskComplete: vi.fn(), playFeed: vi.fn() }));
vi.mock('../utils/sprites', () => ({
  getDungeonEnemySprite: () => ({ sprite: 'x.png', name: 'x', line: 'x' }),
  getSpriteForStage: () => 'pet.png',
}));

function skillsCom(escola: string): Partial<Record<string, StageSkills>> {
  const area = escola === 'conjuracao' || escola === 'longo_alcance' ? { tipo: 'circulo', raioMetros: 4 } : { tipo: 'unico' };
  const mk = (tipo: 'basica' | 'especial') => ({
    tipo, nome: { pt: tipo === 'especial' ? 'Lâmina do Crepúsculo' : 'Golpe', en: tipo === 'especial' ? 'Dusk Blade' : 'Strike' },
    descricao: { pt: 'd', en: 'd' }, elementoId: 'agua', elementoNome: { pt: 'Água', en: 'Water' },
    escolaId: escola, recursoId: 'furia', custo: tipo === 'basica' ? 'baixo' : 'alto', area,
  });
  return { rookie: { basica: mk('basica'), especial: mk('especial') } as unknown as StageSkills };
}

async function entrar(opts: { language?: 'pt-BR' | 'en-US'; escola?: string; onExit?: () => void; onEarnPoints?: (n: number) => void } = {}) {
  renderWithCss(
    <ArenaGame
      evolutionStage="rookie" language={opts.language ?? 'pt-BR'} skills={skillsCom(opts.escola ?? 'combate_fisico')}
      onExit={opts.onExit ?? (() => {})} onEarnPoints={opts.onEarnPoints}
    />,
  );
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  fireEvent.click(screen.getByRole('button', { name: /Entrar na Arena|Enter the Arena/i }));
  await avancar(10);
}
const camada = () => document.querySelector('[data-torcida-layer]') as HTMLElement;
const gauge = () => document.querySelector('[data-cheer-mascot]') as HTMLElement;
const ratio = () => parseFloat(gauge().getAttribute('data-torcida-ratio') ?? 'NaN');
const avancar = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const energia = (de: 'me' | 'foe') => Number(document.querySelector(`[data-stage-plate="${de}"] [data-stage-energy]`)?.getAttribute('aria-valuenow'));
const mascote = () => screen.getByRole('button', { name: 'Torcer pelo seu Soulmon' });
const numeros = () => document.querySelectorAll('[data-stage-dmg]');
const noAnel = () => document.querySelector('[data-stage-ring]') as HTMLElement | null;

/**
 * Existe um botão com esse nome? Varredura barata de `<button>` (texto ou aria-label).
 * O `screen.queryByRole` recalcula a árvore de acessibilidade inteira (e o estilo
 * computado de cada nó) a CADA tick de 100 ms de `ate()`: era o grosso dos 14 s da
 * vitória de 5 rodadas sob carga. A asserção final ainda usa `getByRole` (o nome
 * acessível de verdade); só a ESPERA, que roda centenas de vezes, ficou barata.
 */
const temBotao = (nome: string) => [...document.querySelectorAll('button')]
  .some(b => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim() === nome);

/** Avança de 100 em 100 ms até a condição valer (ou `maxMs`). */
async function ate(cond: () => boolean, maxMs = 30_000) {
  for (let t = 0; t < maxMs && !cond(); t += 100) await avancar(100);
  return cond();
}
/** Vence a rodada atual (foes frágeis) e abre a próxima. */
async function proximaRodada() {
  expect(await ate(() => temBotao('Próxima rodada'))).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Próxima rodada' }));
  await avancar(10);
}

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(H, { startEnergy: [], foeHp: 1, playerHp: 1, forceDraw: false, calls: 0, answers: [], cheerSeen: 0 });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('Arena em grupo — a cena', () => {
  it('a luta é a CENA: tela cheia, HP e ENERGIA em cima do pet, mascote da torcida, sem texto explicativo; só o chefe tem barra de energia', async () => {
    await entrar();
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull();
    expect(document.querySelector('[data-stage-sprite="me"]')).not.toBeNull();
    expect(document.querySelector('[data-stage-sprite="foe"]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="me"] [data-stage-energy]')).not.toBeNull();
    // A rodada 1 é UM inimigo médio, sem especial: sem barra de energia (o chefe, na 5, tem).
    expect(document.querySelector('[data-stage-plate="foe"] [data-stage-energy]')).toBeNull();
    expect(document.querySelector('[data-stage-close]')).not.toBeNull();
    expect(document.querySelector('[data-cheer-mascot]')).not.toBeNull();
    expect(document.querySelector('[data-visor-pet]')).toBeNull();
    expect(screen.queryByText('Atacar!')).toBeNull();
    expect(screen.queryByText(/ataca sozinho/i)).toBeNull();
    expect(document.querySelector('[data-info-tip]')).toBeNull(); // A7: nenhum "?" dentro da luta
    expect(ratio()).toBe(0);
  });

  it('a explicação da intro mora atrás do "?" (InfoTip) e fala do grupo, do anel e da esquiva', async () => {
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={() => {}} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(screen.queryByText(/luta e se defende sozinho/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Como funciona o Duelo' }));
    const texto = document.body.textContent ?? '';
    expect(texto).toMatch(/barra de cheer/i);
    expect(texto).toMatch(/anel/i);
    expect(texto).toMatch(/deslize/i);
    expect(texto).toMatch(/ao mesmo tempo/i);
  });

  it('o relógio é o do núcleo: nada chega antes do primeiro evento, e os números só aparecem no IMPACTO', async () => {
    await entrar();
    expect(numeros()).toHaveLength(0);
    let visto = false;
    let fx = false;
    for (let t = 0; t < 8000 && !visto; t += 100) {
      await avancar(100);
      fx = fx || document.querySelector('[data-stage-fx]') !== null;
      visto = numeros().length > 0;
    }
    expect(fx, 'a animação do golpe começa antes do número').toBe(true);
    expect(visto, 'o primeiro golpe chega em até 8 s').toBe(true);
  });
});

describe('Arena em grupo — a barra de cheer (a torcida)', () => {
  it('24 toques enchem a barra de cheer DEVAGAR; cheia, ela despeja UMA descarga no núcleo e zera', async () => {
    await entrar();
    // 12 toques por janela de 3 s da luta: nenhum passa do teto de 16
    for (let i = 0; i < 12; i++) fireEvent.pointerDown(camada());
    await avancar(3100);
    for (let i = 0; i < CHEER_TAPS_FULL - 12 - 1; i++) fireEvent.pointerDown(camada());
    expect(ratio()).toBeCloseTo((CHEER_TAPS_FULL - 1) / CHEER_TAPS_FULL, 1);
    expect(H.cheerSeen).toBe(0);
    fireEvent.pointerDown(camada());
    expect(ratio()).toBe(0);
    await avancar(3000); // o núcleo recolhe a descarga no passo seguinte do relógio
    expect(H.cheerSeen).toBe(1);
  });

  it('toque a mais não rende: no máximo 16 toques por janela de 3 s da luta', async () => {
    await entrar();
    const m = mascote(); // uma consulta por papel, não 40 (cada `getByRole` varre a árvore)
    for (let i = 0; i < 40; i++) fireEvent.click(m);
    expect(ratio()).toBeCloseTo(16 / CHEER_TAPS_FULL, 2);
  });

  it('o MASCOTE torce (e grita); o botão de sair não vira torcida', async () => {
    await entrar();
    fireEvent.pointerDown(screen.getByRole('button', { name: /^Sair$/ }));
    expect(ratio()).toBe(0);
    fireEvent.click(mascote());
    expect(ratio()).toBeGreaterThan(0);
    expect(document.querySelector('[data-cheer-bubble]')?.textContent).toBe('VAI!');
  });

  it('antes da luta (intro) o toque não vale nada', async () => {
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={() => {}} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    for (let i = 0; i < 10; i++) fireEvent.pointerDown(camada());
    fireEvent.click(screen.getByRole('button', { name: /Entrar na Arena/i }));
    expect(ratio()).toBe(0);
  });
});

describe('Arena em grupo — o cast do pet: o anel e o relógio PAUSADO', () => {
  it('energia cheia: o núcleo pede o ANEL, o relógio PAUSA, e o toque na hora certa devolve o multiplicador ÓTIMO (1,08)', async () => {
    H.startEnergy = [100];
    await entrar();
    expect(noAnel(), 'o cast sai no instante 0').not.toBeNull();
    expect(document.querySelector('[data-stage-charging]')).not.toBeNull();
    // O relógio está pausado: 6 s depois nada aconteceu na luta e a energia do pet segue cheia no núcleo.
    await avancar(500);
    expect(numeros()).toHaveLength(0);
    expect(H.answers).toHaveLength(0);
    const alvo = Number(noAnel()?.getAttribute('data-ring-target'));
    expect(alvo).toBeGreaterThan(1000);
    await avancar(alvo - 500); // o anel encosta no alvo
    fireEvent.pointerDown(document.body);
    await avancar(10);
    expect(H.answers).toEqual([{ who: 0, ans: expect.closeTo(1.08, 6) }]);
    expect(noAnel()).toBeNull();
    // o nome do especial da ficha no cast
    expect(document.querySelector('[data-stage-special]')?.textContent).toBe('Lâmina do Crepúsculo');
    await avancar(1200);
    // gastou a barra: UMA barra, UM uso
    expect(energia('me')).toBeLessThan(50);
  });

  it('sem tocar o anel: o especial sai mesmo assim, só mais fraco (nota ruim = 0,92)', async () => {
    H.startEnergy = [100];
    await entrar();
    expect(noAnel()).not.toBeNull();
    expect(await ate(() => noAnel() === null, 6000)).toBe(true);
    expect(H.answers).toEqual([{ who: 0, ans: expect.closeTo(0.92, 6) }]);
  });

  it('com o anel na tela o toque é do anel: não conta como cheer', async () => {
    H.startEnergy = [100];
    await entrar();
    const antes = ratio();
    fireEvent.pointerDown(camada());
    expect(ratio()).toBe(antes);
  });

  it('o relógio pausa para valer na confirmação de sair, e segue depois', async () => {
    await entrar();
    fireEvent.click(screen.getByRole('button', { name: /^Sair$/ }));
    expect(document.querySelector('[data-stage-confirm]')).not.toBeNull();
    await avancar(20_000);
    expect(numeros()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await ate(() => numeros().length > 0, 8000)).toBe(true);
  });

  it('movimento reduzido: o anel segue desenhado por JS (é a mecânica essencial)', async () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
    }));
    H.startEnergy = [100];
    await entrar();
    expect(noAnel()).not.toBeNull();
  });
});

describe('Arena em grupo — o especial em ÁREA e o único', () => {
  /** Vence as rodadas 1 a 3 (inimigos frágeis) e deixa a tela no começo da 4 (três inimigos). */
  async function ate4(escola: string) {
    H.foeHp = 0.01;
    H.startEnergy = [undefined, undefined, undefined, 100];
    await entrar({ escola });
    for (let r = 1; r <= 3; r++) await proximaRodada();
  }
  async function especialNaRodada4(escola: string) {
    await ate4(escola);
    expect(noAnel(), 'a rodada 4 abre com o cast').not.toBeNull();
    expect(document.querySelectorAll('[data-stage-sprite="foe"]')).toHaveLength(3);
    await avancar(1500);
    fireEvent.pointerDown(document.body);
    await avancar(1100 + SPECIAL_INTRO_MS); // a cena do especial (PR18) e depois o especial chega no alvo
    return numeros().length;
  }
  it('conjuração (círculo de 4 m): o especial desenha o hit nos TRÊS alvos do evento', async () => {
    expect(await especialNaRodada4('conjuracao')).toBe(3);
  });
  it('combate físico (alvo único): o mesmo especial, mas um hit só', async () => {
    expect(await especialNaRodada4('combate_fisico')).toBe(1);
  });
});

describe('Arena em grupo — derrota, empate e vitória (sem custo, texto neutro)', () => {
  it('derrota: a run acaba sem pontos, com texto neutro, e dá para tentar de novo', async () => {
    H.playerHp = 0.0001;
    const onEarn = vi.fn();
    await entrar({ onEarnPoints: onEarn });
    expect(await ate(() => screen.queryByText('Você caiu') !== null, 30_000)).toBe(true);
    expect(screen.getByText(/Não custou nenhum coração — só a run/)).toBeTruthy();
    expect(document.querySelector('[data-battle-stage]')).toBeNull();
    expect(onEarn).not.toHaveBeenCalled();
    H.playerHp = 1;
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    await avancar(10);
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull();
  });

  it('empate: encerra a run, sem custo, em PT e em EN (texto neutro, sem "perdeu")', async () => {
    H.forceDraw = true;
    await entrar();
    expect(await ate(() => screen.queryByText('Empate') !== null, 5000)).toBe(true);
    expect(screen.getByText(/Vocês caíram juntos na rodada 1\. Não custou nenhum coração — só a run\./)).toBeTruthy();
    cleanup();
    H.calls = 0;
    await entrar({ language: 'en-US' });
    expect(await ate(() => screen.queryByText('A draw') !== null, 5000)).toBe(true);
    expect(screen.getByText(/You went down together in round 1\. It cost no hearts — only the run\./)).toBeTruthy();
    expect(screen.queryByText(/lost|derrota|perdeu/i)).toBeNull();
  });

  it('o save não é tocado: a Arena não escreve em `hp`, nem em corações (§20.1)', () => {
    const fonte = readFileSync(resolve(__dirname, 'ArenaGame.tsx'), 'utf8');
    expect(fonte).not.toMatch(/setGameState|setHearts|careBar|hearts\s*[-+]=/);
    const hook = readFileSync(resolve(__dirname, 'games/useGroupBattle.ts'), 'utf8');
    expect(hook).not.toMatch(/setGameState/);
  });

  it('vitória: as 5 rodadas na sequência (1·2·1·3·1 inimigos), 50 Bits e a rodada 5 tem o chefe com barra de energia', async () => {
    H.foeHp = 0.01;
    const onEarn = vi.fn();
    await entrar({ onEarnPoints: onEarn });
    const contagem: number[] = [];
    for (let r = 1; r <= 4; r++) {
      contagem.push(document.querySelectorAll('[data-stage-sprite="foe"]').length);
      await proximaRodada();
    }
    contagem.push(document.querySelectorAll('[data-stage-sprite="foe"]').length);
    expect(contagem).toEqual([1, 2, 1, 3, 1]);
    expect(document.querySelector('[data-stage-plate="foe"] [data-stage-energy]')).not.toBeNull(); // o chefe
    expect(await ate(() => temBotao('Terminar'))).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Terminar' }));
    expect(screen.getByText('Arena vencida!')).toBeTruthy();
    expect(onEarn).toHaveBeenCalledWith(50);
  });
});

describe('Arena em grupo — sair e idiomas', () => {
  it('sair da luta pede CONFIRMAÇÃO (a corrida se perde) e só então chama onExit', async () => {
    const onExit = vi.fn();
    await entrar({ onExit });
    fireEvent.click(screen.getByRole('button', { name: /^Sair$/ }));
    expect(onExit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(document.querySelector('[data-stage-confirm]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Sair$/ }));
    fireEvent.click(document.querySelector('[data-stage-confirm-leave]') as HTMLElement);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('em inglês: "Cheer" e nada de português na luta', async () => {
    H.startEnergy = [100];
    await entrar({ language: 'en-US' });
    const texto = document.body.textContent ?? '';
    for (const palavra of ['Torcer', 'torcida', 'sozinho', 'Rodada', 'Você', 'Continuar', 'Golpear']) {
      expect(texto.includes(palavra), `"${palavra}" vazou para a tela em inglês`).toBe(false);
    }
    expect(screen.getByRole('button', { name: 'Strike' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Leave$/ }));
    expect(screen.getByRole('button', { name: 'Keep going' })).toBeTruthy();
  });
});
