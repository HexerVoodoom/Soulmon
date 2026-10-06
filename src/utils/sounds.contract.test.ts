/**
 * O CONTRATO DO MÓDULO DE SOM — run `som-01`, Fase 2.
 *
 * Três asserções, e cada uma existe porque a Fase 0 mediu um defeito real:
 *
 * 1. **Mudo total.** Com `SOUND_MUTED` ligado, NENHUM caminho de áudio
 *    constrói `AudioContext` nem cria nó. O `sounds.visorTune.test.ts` já
 *    provava isso para UM som; aqui é provado para TODOS os `play*`
 *    exportados, descobertos por reflexão — que é o que transforma "este som
 *    respeita o mudo" em "nenhum caminho respeita menos". O app tem de
 *    funcionar 100% mudo (`contexto.md` §3: o perfil "em público" é punido por
 *    qualquer som não solicitado).
 * 2. **Todo `play*` exportado tem chamador em produção.** ⚠️ Esta asserção
 *    **nasceria mentindo** antes desta fatia: `playPoopAlert` e `playMenuOpen`
 *    tinham zero call-sites, e `playPoopClean` tinha um call-site
 *    **inalcançável** (o clique no cocô está desligado por código em
 *    `CareSystem.tsx`, então só o banho chegava lá — corte C-9). Os três foram
 *    apagados nesta fatia; é por isso que o teste nasce verde de verdade.
 * 3. **`playDegenerate` tem UM chamador, e é a degeneração real.** É o corte
 *    C-6 travado contra regressão: `DinoGame` tocava o som de perder a forma
 *    quando `pts === 0`, ou seja, quando o score fica ABAIXO de 100 — a
 *    primeira partida de quem está aprendendo o minijogo recebia o som da
 *    única perda estrutural que o produto admite. `CLAUDE.md` (tabela ⚔️) diz
 *    por escrito que "o jogo NUNCA cobra da barra que representa o cuidado"
 *    numa derrota de minijogo; o som contradizia a regra escrita.
 *
 * **A D11 não é medida aqui, de propósito.** `sounds.ts` não tem uma ocorrência
 * de `document.hidden` — a fronteira mora no CHAMADOR, e ler o fonte do módulo
 * atrás dela só encontraria a ausência. Quem mede é `som-cortes.render.test.tsx`
 * (e `sintonia-chiado.render.test.tsx`, o precedente): espiona o módulo e
 * renderiza quem chama.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import * as sounds from './sounds';
import { esquecerJanelaDeCoincidencia } from './audioBus';

/* ── 1. Mudo total ──────────────────────────────────────────────────────── */

/** Conta TODA construção de contexto e TODA criação de nó. */
function instalarAudioFalso() {
  let contextos = 0;
  const nos: string[] = [];

  const param = () => ({
    value: 0,
    setValueAtTime: () => {},
    linearRampToValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
  });

  class ContextoFalso {
    currentTime = 0;
    sampleRate = 48000;
    destination = {};
    constructor() { contextos++; }
    createBuffer(_ch: number, length: number) {
      nos.push('buffer');
      return { getChannelData: () => new Float32Array(length) };
    }
    createBufferSource() {
      nos.push('bufferSource');
      return { buffer: null, connect: () => {}, start: () => {}, stop: () => {} };
    }
    createBiquadFilter() {
      nos.push('biquad');
      return { type: '', Q: { value: 0 }, frequency: param(), connect: () => {} };
    }
    createOscillator() {
      nos.push('oscillator');
      return { type: '', frequency: param(), connect: () => {}, start: () => {}, stop: () => {} };
    }
    createGain() {
      nos.push('gain');
      return { gain: param(), connect: () => {} };
    }
    close() { return Promise.resolve(); }
  }

  vi.stubGlobal('window', { AudioContext: ContextoFalso });
  return { get contextos() { return contextos; }, nos };
}

function instalarStorageEmMemoria() {
  const dados = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => { dados.set(k, String(v)); },
    removeItem: (k: string) => { dados.delete(k); },
    clear: () => dados.clear(),
    key: (i: number) => [...dados.keys()][i] ?? null,
    get length() { return dados.size; },
  });
}

/** Todos os `play*` exportados, descobertos por reflexão — sem lista digitada. */
const CAMINHOS = Object.entries(sounds)
  .filter(([n, v]) => n.startsWith('play') && typeof v === 'function') as [string, () => void][];

let audio: ReturnType<typeof instalarAudioFalso>;

beforeEach(() => {
  instalarStorageEmMemoria();
  vi.useFakeTimers();
  audio = instalarAudioFalso();
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('o mudo é global, não por som', () => {
  it('a reflexão encontra os caminhos de áudio (o teste não pode passar por lista vazia)', () => {
    expect(CAMINHOS.length).toBe(11); // 8 + os 3 do combate (PR18: playAttack, playSpecial, playVictory)
  });

  it('MUDO: nenhum `play*` constrói AudioContext nem cria nó', () => {
    sounds.setMuted(true);
    for (const [, fn] of CAMINHOS) fn();
    expect(audio.contextos, 'algum caminho construiu contexto no mudo').toBe(0);
    expect(audio.nos, 'algum caminho criou nó de áudio no mudo').toEqual([]);
  });

  it('CONTRAPROVA: com som ligado, todo `play*` de fato cria nó (o guard não passa por inércia)', () => {
    sounds.setMuted(false);
    for (const [nome, fn] of CAMINHOS) {
      // Cada `play*` deste laco e um GESTO diferente. Sem declarar isso, a
      // R-EX (P-1) leria os 8 como um gesto so — que e exatamente o que ela
      // manda fazer — e 7 deles nao criariam no nenhum.
      esquecerJanelaDeCoincidencia();
      const antes = audio.nos.length;
      fn();
      expect(audio.nos.length, `${nome} não criou nó nenhum: guard verde pelo motivo errado`)
        .toBeGreaterThan(antes);
    }
  });
});

/* ── 2 e 3. Chamadores ──────────────────────────────────────────────────── */

const RAIZ = join(__dirname, '..');
const DONO = join('utils', 'sounds.ts');

/** Fontes de produção de `src/`: sem testes, sem o próprio dono do módulo. */
function fontesDeProducao(dir: string, acc: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) { fontesDeProducao(caminho, acc); continue; }
    if (!/\.tsx?$/.test(nome)) continue;
    if (/\.(test|spec)\.tsx?$/.test(nome)) continue;
    if (relative(RAIZ, caminho) === DONO) continue;
    acc.push(caminho);
  }
  return acc;
}

/** `símbolo → arquivos de produção que o INVOCAM` (a chamada, não o import). */
function chamadoresPorSimbolo(): Map<string, string[]> {
  const mapa = new Map<string, string[]>(CAMINHOS.map(([n]) => [n, []]));
  for (const arquivo of fontesDeProducao(RAIZ)) {
    const fonte = readFileSync(arquivo, 'utf-8');
    for (const [nome] of CAMINHOS) {
      // `nome(` sem `function`/`import` antes: é invocação, não declaração.
      if (new RegExp(`(?<![\\w.])${nome}\\s*\\(`).test(fonte)) {
        mapa.get(nome)!.push(relative(RAIZ, arquivo).replace(/\\/g, '/'));
      }
    }
  }
  return mapa;
}

describe('nenhum som órfão: todo `play*` exportado tem chamador', () => {
  const mapa = chamadoresPorSimbolo();

  it('a varredura enxerga os fontes (não pode passar por lista vazia)', () => {
    expect(fontesDeProducao(RAIZ).length).toBeGreaterThan(100);
  });

  it.each(CAMINHOS.map(([n]) => n))('%s é chamado em produção', nome => {
    expect(
      mapa.get(nome),
      `${nome} é exportado e ninguém chama — som órfão. Ou ele ganha dono, ou sai do módulo (foi o que aconteceu com playPoopAlert, playMenuOpen e playPoopClean na Fase 2 do run som-01).`,
    ).not.toHaveLength(0);
  });

  it('C-6: `playDegenerate` é EXCLUSIVO da degeneração real — um chamador, e é o App', () => {
    expect(
      mapa.get('playDegenerate'),
      'derrota de minijogo voltou a usar o som da perda estrutural: é a inversão que o C-6 corrigiu',
    ).toEqual(['App.tsx']);
  });

  it('C-6: o `DinoGame` não alcança som de degeneração por caminho nenhum', () => {
    const fonte = readFileSync(join(RAIZ, 'components', 'DinoGame.tsx'), 'utf-8');
    expect(
      fonte.includes('playDegenerate'),
      'score < 100 (`pts === 0`) tocava o som de perder a forma — a primeira partida de quem está aprendendo o minijogo era sonorizada como punição',
    ).toBe(false);
  });
});
