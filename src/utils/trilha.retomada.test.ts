// @vitest-environment jsdom
/**
 * AUDITORIA DA MÚSICA (11/10/2026): "às vezes parece que não toca". Cada teste aqui é um achado, reproduzido contra o
 * motor falso (que só tem o bastante do Web Audio para `comecar()` chegar a `start`): o que se mede é a ORDEM e o ESTADO
 * (contexto retomado? fonte viva no contexto vigente? faixa certa?), nunca som.
 *
 *  1. voltar para a aba deixava o contexto `suspended` com as fontes ligadas e ninguém mandava `resume()`;
 *  2. o `resume()` só saía DEPOIS do `await` da carga (fora da pilha do gesto → o iOS recusa);
 *  3. contexto fechado (pagehide → bfcache) deixava a voz "tocando" em silêncio para sempre;
 *  4. `busTrilha` em 0 quando o storage falha (janela privada) → tocava mudo;
 *  5. roteamento por faixa: troca de faixa é crossfade, nasce desligada e só por gesto.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

const E = vi.hoisted(() => ({
  ctxs: [] as Array<Record<string, any>>,
  atual: null as null | Record<string, any>,
  ligada: false,
  busTrilha: null as null | { gain: { value: number } },
  retomadas: 0,
  nascerSuspenso: false,
}));

vi.mock('./audioBus', () => {
  const novoCtx = () => {
    const c: Record<string, any> = {
      state: E.nascerSuspenso ? 'suspended' : 'running', currentTime: 0, sampleRate: 48000, fontes: [] as any[], ganhos: [] as any[], resumes: 0,
      resume() { c.resumes++; c.state = 'running'; return Promise.resolve(); },
      createGain() {
        const g = { gain: { value: 1, rampas: [] as number[], cancelScheduledValues() {}, setValueAtTime() {}, linearRampToValueAtTime(v: number) { this.rampas.push(v); } }, connect() {}, disconnect() {} };
        c.ganhos.push(g); return g;
      },
      createBuffer: (_n: number, len: number) => ({ length: len, duration: len / 48000, copyToChannel() {} }),
      createBufferSource() {
        const f = { buffer: null as any, loop: false, loopStart: 0, loopEnd: 0, playbackRate: { value: 1 }, parou: false, connect() {}, disconnect() {}, start() {}, stop(t?: number) { if (t === undefined || t <= c.currentTime) f.parou = true; } };
        c.fontes.push(f); return f;
      },
    };
    E.ctxs.push(c);
    return c;
  };
  return {
    garantirBarramento: () => {
      if (!E.atual || E.atual.state === 'closed') { E.atual = novoCtx(); E.busTrilha = { gain: { value: 0 } }; }
      return { ctx: E.atual, busTrilha: E.busTrilha };
    },
    definirTrilhaLigada: (v: boolean) => { E.ligada = v; },
    trilhaLigada: () => E.ligada,
    retomarContexto: () => { E.retomadas++; if (E.atual && E.atual.state === 'suspended') void E.atual.resume(); },
  };
});
vi.mock('./sonsAssets', async (orig) => ({
  ...(await orig<typeof import('./sonsAssets')>()),
  carregarAsset: async () => ({ duration: 30 }),
}));
vi.mock('./sounds', () => ({ isMuted: () => false }));

import {
  ligarTrilha, desligarTrilha, pedirFaixa, trilhaTocando, camadasTocando, faixaTocando, esquecerTrilha, consentirNestaSessao, aoGestoSonoro,
} from './trilha';
import { GANHO_MUSICA_DB, OFFSET_MUSICA_EM_COMBATE_DB, TRIM_FAIXA_ARENA_DB, TRIM_TRILHA_POR_CAMADAS_DB, db2lin } from './loudness';
import { RAZAO_DA_ARENA } from './sonsAssets';

const tick = () => new Promise(r => setTimeout(r, 0));
const escondida = (v: boolean) => {
  Object.defineProperty(document, 'hidden', { configurable: true, value: v });
  document.dispatchEvent(new Event('visibilitychange'));
};

// A percussão da Arena é um chunk sob demanda (`import('./trilhaArena')`): aquece o módulo para o `tick` curto bastar.
beforeAll(async () => { await import('./trilhaArena'); });

beforeEach(() => {
  esquecerTrilha();
  E.ctxs.length = 0; E.atual = null; E.ligada = false; E.busTrilha = null; E.retomadas = 0; E.nascerSuspenso = false;
  escondida(false);
});

describe('achado 2 — o resume sai SÍNCRONO, na pilha do gesto', () => {
  it('com o contexto suspenso, `ligarTrilha()` já chamou resume() antes de qualquer await', () => {
    E.nascerSuspenso = true; // autoplay: o contexto nasce suspenso
    ligarTrilha();
    expect(E.atual!.resumes).toBe(1); // sem `await tick()`: foi síncrono, ainda na pilha do gesto
  });
});

describe('achado 1 — voltar para a aba retoma o contexto suspenso', () => {
  it('aba oculta → visível com o contexto `suspended` e a voz viva: resume() é chamado e a voz continua a mesma', async () => {
    ligarTrilha();
    await tick();
    expect(trilhaTocando()).toBe(true);
    const fontesAntes = E.atual!.fontes.length;
    E.atual!.state = 'suspended'; // o audioBus suspendeu com a aba oculta
    escondida(true);
    escondida(false);
    await tick();
    expect(E.retomadas).toBeGreaterThan(0);
    expect(E.atual!.state).toBe('running');
    expect(E.atual!.fontes.length).toBe(fontesAntes); // não recomeçou a música: só destravou o contexto
    expect(trilhaTocando()).toBe(true);
  });

  it('aba oculta NUNCA retoma nem começa (D11)', async () => {
    ligarTrilha();
    await tick();
    const n = E.retomadas;
    escondida(true);
    expect(E.retomadas).toBe(n);
  });
});

describe('achado 3 — contexto fechado (pagehide → bfcache) refaz a voz', () => {
  it('voz presa a um contexto `closed` é descartada e recriada no contexto vigente', async () => {
    ligarTrilha();
    await tick();
    const velho = E.atual!;
    velho.state = 'closed'; // o `pagehide` do audioBus fechou o contexto
    window.dispatchEvent(new Event('pageshow'));
    await tick();
    expect(E.atual).not.toBe(velho);
    expect(trilhaTocando()).toBe(true);
    expect(E.atual!.fontes.length).toBe(2);
    expect(velho.fontes.every((f: any) => f.parou)).toBe(true);
  });
});

describe('achado 4 — quem toca com consentimento abre o bus', () => {
  it('o busTrilha nasce em 0 (flag não persistiu) e a trilha o abre ao tocar', async () => {
    ligarTrilha();
    await tick();
    expect(E.busTrilha!.gain.value).toBe(1);
  });
});

describe('o ganho vem da política (loudness.ts), nunca de literal', () => {
  it('loop = trim das 2 camadas + ganho de reprodução; masmorra desce o degrau do combate', async () => {
    ligarTrilha();
    await tick();
    const alvo = (g: any) => g.gain.rampas[g.gain.rampas.length - 1];
    const loop = E.atual!.ganhos[0];
    expect(alvo(loop)).toBeCloseTo(db2lin(TRIM_TRILHA_POR_CAMADAS_DB[2] + GANHO_MUSICA_DB), 9);
    pedirFaixa('masmorra');
    await tick();
    // mesmo material → o MESMO ganho desliza (a música não recomeça)
    expect(E.atual!.fontes.length).toBe(2);
    expect(alvo(loop)).toBeCloseTo(db2lin(TRIM_TRILHA_POR_CAMADAS_DB[2] + GANHO_MUSICA_DB + OFFSET_MUSICA_EM_COMBATE_DB), 9);
    expect(faixaTocando()).toBe('masmorra');
  });
});

describe('roteamento por faixa (nasce desligada, só por gesto, crossfade)', () => {
  it('sem gesto nesta sessão, pedir uma faixa NÃO toca nada (D11/S2)', async () => {
    pedirFaixa('arena');
    await tick();
    expect(trilhaTocando()).toBe(false);
    expect(E.ctxs.length).toBe(0); // nem o contexto nasceu
  });

  it('consentir (abrir a arena com a chave ligada) + pedir a faixa: toca a ARENA — camadas a 1,2× + percussão', async () => {
    E.ligada = true;
    consentirNestaSessao();
    pedirFaixa('arena');
    await tick();
    expect(faixaTocando()).toBe('arena');
    const fontes = E.atual!.fontes;
    expect(fontes.length).toBe(3); // base + ritmo + percussão procedural
    expect(camadasTocando()).toBe(3);
    expect(fontes.filter((f: any) => f.playbackRate.value === RAZAO_DA_ARENA).length).toBe(2);
    expect(fontes[2].loop).toBe(true);
    // trim da faixa derivada entra no ganho
    const g = E.atual!.ganhos[0];
    expect(g.gain.rampas.at(-1)).toBeCloseTo(db2lin(TRIM_TRILHA_POR_CAMADAS_DB[2] + GANHO_MUSICA_DB + OFFSET_MUSICA_EM_COMBATE_DB + TRIM_FAIXA_ARENA_DB), 9);
  });

  it('trocar masmorra → arena é CROSSFADE: a voz velha desce e para, a nova sobe (nunca duas soando no fim)', async () => {
    vi.useFakeTimers();
    try {
      E.ligada = true;
      consentirNestaSessao();
      pedirFaixa('masmorra');
      await vi.advanceTimersByTimeAsync(5);
      const velhaFontes = [...E.atual!.fontes];
      const velhoGanho = E.atual!.ganhos[0];
      pedirFaixa('arena');
      await vi.advanceTimersByTimeAsync(5);
      expect(velhoGanho.gain.rampas.at(-1)).toBe(0);            // a velha desce em rampa
      expect(velhaFontes.some((f: any) => f.parou)).toBe(false); // ainda não cortou: é o crossfade
      expect(faixaTocando()).toBe('arena');
      await vi.advanceTimersByTimeAsync(2000);
      expect(velhaFontes.every((f: any) => f.parou)).toBe(true); // passada a rampa, só a nova resta
    } finally { vi.useRealTimers(); }
  });

  it('pedir null para; o consentimento é por sessão e a chave desligada não o dá', async () => {
    E.ligada = false;
    consentirNestaSessao();
    pedirFaixa('masmorra');
    await tick();
    expect(trilhaTocando()).toBe(false);
    E.ligada = true;
    aoGestoSonoro(); // o primeiro gesto sonoro com a preferência ligada dá o consentimento
    await tick();
    expect(trilhaTocando()).toBe(true);
    pedirFaixa(null);
    expect(trilhaTocando()).toBe(false);
    desligarTrilha();
  });
});
