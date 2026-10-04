// @vitest-environment jsdom
/**
 * QA Rodada 2 (22/09/2026) — extensão do fuzz de `hydrateSave`.
 *
 * O arquivo irmão (`GameStateContext.hydrate.fuzz.test.tsx`) cobre formas
 * hostis ESCOLHIDAS À MÃO. Este varre os 97 campos declarados em `GameState`
 * com o MESMO conjunto de valores hostis, sem escolher — para pegar o campo
 * que ninguém lembrou (a regra do arquivo é "todo campo tem linha em
 * `hydrateSave`"; o `...loadedState` no topo deixa passar o que não tem).
 *
 * Dois consumidores que rodam em TODO render entram na régua além dos que o
 * irmão já usa: `soulmonDisplayName(gameState.soulmonMeta)` (nome do bicho no
 * HUD, widget, aniversário) e a virada do dia.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { useDailyReset } from '../hooks/useDailyReset';
import { soulmonDisplayName } from '../utils/petName';
import { widgetPetName } from '../plugins/SoulmonWidgetPlugin';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { tiredness } from '../utils/petNeeds';
import { restConstancy } from '../utils/restWindow';
import { computeDailyReset } from '../utils/dailyReset';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function ComVirada() {
  const { gameState, setGameState } = useGameState();
  useDailyReset({ gameState: gameState as never, setGameState });
  return <pre data-testid="estado">{JSON.stringify(gameState)}</pre>;
}
function montar() {
  cleanup();
  render(<GameStateProvider><ComVirada /></GameStateProvider>);
  return JSON.parse(screen.getByTestId('estado').textContent!);
}

/** Os 97 campos, lidos do PRÓPRIO tipo — a lista não é copiada à mão. */
function camposDeGameState(): string[] {
  const src = readFileSync(resolve(__dirname, 'GameStateContext.tsx'), 'utf8');
  const bloco = /export interface GameState \{([\s\S]*?)\n\}/.exec(src)?.[1] ?? '';
  return [...bloco.matchAll(/^ {2}([A-Za-z_]+)\??:/gm)].map(m => m[1]);
}

// Só o que sobrevive a JSON.stringify chega ao load (localStorage e nuvem
// são JSON): `Infinity` vira `null`, `-0` vira `0`. Os dois entram mesmo
// assim — o que chega é o `null`/`0`, e é isso que se quer provar.
const HOSTIS: Array<[string, unknown]> = [
  ['null', null],
  ['Infinity (→ null no JSON)', Infinity],
  ['-0', -0],
  ['-1', -1],
  ['1e308', 1e308],
  ['string vazia', ''],
  ['string de 200 KB', 'x'.repeat(200_000)],
  ['"Infinity" como string', 'Infinity'],
  ['objeto no lugar de array', { a: 1 }],
  ['array no lugar de objeto', [1, 2]],
  ['array de null', [null]],
  ['objeto de null', { a: null }],
  ['true', true],
  ['__proto__ poluído', JSON.parse('{"__proto__":{"polluted":1}}')],
];

const BASE = { activities: [], tasks: [], lastResetDate: 'Mon Jan 01 2024' };

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('AUTOVERIFICAÇÃO', () => {
  it('a lista de campos veio do tipo e tem os 100 (+ `crossings`, 30/09/2026; + `onboardingProfile` e `soulTestAnswers`, 01/10/2026; + `hideFromPublicList`, 02/10/2026; + `caderno`, 04/10/2026; + `ownedFrames` e `equippedFrame`, 04/10/2026)', () => {
    const campos = camposDeGameState();
    expect(campos.length).toBe(103);
    expect(campos).toContain('ownedFrames');
    expect(campos).toContain('equippedFrame');
    expect(campos).toContain('caderno');
    expect(campos).toContain("hideFromPublicList");
    expect(campos).toContain('onboardingProfile');
    expect(campos).toContain('soulTestAnswers');
    expect(campos).toContain('conquistasHerdadas');
    expect(campos).toContain('consent');
  });
});

describe('cada um dos 97 campos × valores hostis: o app monta, a virada roda, os consumidores de todo render não lançam', () => {
  for (const campo of camposDeGameState()) {
    it(campo, () => {
      for (const [nome, valor] of HOSTIS) {
        localStorage.clear();
        localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ ...BASE, [campo]: valor }));
        let s: any;
        expect(() => { s = montar(); }, `${campo} = ${nome}: o app não montou`).not.toThrow();
        // Não pode ter caído no freshGameState por exceção: a virada carimbou hoje
        // E o save não foi descartado — `lastResetDate` de BASE existia.
        expect(typeof s.lastResetDate).toBe('string');
        const agora = new Date();
        expect(() => soulmonDisplayName(s.soulmonMeta), `${campo} = ${nome}: soulmonDisplayName`).not.toThrow();
        expect(() => widgetPetName(s.soulmonMeta), `${campo} = ${nome}: widgetPetName`).not.toThrow();
        expect(() => tiredness(s, agora), `${campo} = ${nome}: tiredness`).not.toThrow();
        expect(() => restConstancy(s.rest, agora), `${campo} = ${nome}: restConstancy`).not.toThrow();
        expect(() => computeDailyReset(s, { now: agora } as never), `${campo} = ${nome}: computeDailyReset`).not.toThrow();
        expect(Number.isFinite(s.healthPoints), `${campo} = ${nome}: healthPoints ${s.healthPoints}`).toBe(true);
        expect(Number.isFinite(s.totalXP), `${campo} = ${nome}: totalXP`).toBe(true);
      }
    });
  }
});

describe('campos novos de 21–22/09', () => {
  it('conquistasHerdadas: só ids conhecidos sobrevivem; lixo vira []', () => {
    for (const valor of ['dias-completos-30', { 0: 'dias-completos-30' }, 5, null]) {
      localStorage.clear();
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ ...BASE, conquistasHerdadas: valor }));
      const s = montar();
      expect(Array.isArray(s.conquistasHerdadas), JSON.stringify(valor)).toBe(true);
    }
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ ...BASE, conquistasHerdadas: ['dias-completos-30', 'nao-existe', 7, null, {}] }));
    expect(montar().conquistasHerdadas).toEqual(['dias-completos-30']);
  });

  it('consent: registro sem acceptedAt string some; versões não-string viram "desconhecida"; nunca lança', () => {
    const casos: Array<[unknown, unknown]> = [
      ['sim', undefined],
      [{}, undefined],
      [{ acceptedAt: 5 }, undefined],
      [{ acceptedAt: '' }, undefined],
      [[], undefined],
      [{ acceptedAt: '2026-09-22T00:00:00Z', termsVersion: 5, privacyVersion: null },
        { acceptedAt: '2026-09-22T00:00:00Z', termsVersion: 'desconhecida', privacyVersion: 'desconhecida' }],
    ];
    for (const [entrada, esperado] of casos) {
      localStorage.clear();
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ ...BASE, consent: entrada }));
      const s = montar();
      expect(s.consent, JSON.stringify(entrada)).toEqual(esperado);
    }
  });

  it('soulmonMeta hostil não derruba o nome do bicho (HUD, widget, aniversário leem em todo render)', () => {
    for (const meta of [{ petName: 5 }, { baseName: {} }, { petName: null, baseName: 7 }, 'Bito', 3, [1]]) {
      localStorage.clear();
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ ...BASE, soulmonMeta: meta }));
      const s = montar();
      expect(() => soulmonDisplayName(s.soulmonMeta), JSON.stringify(meta)).not.toThrow();
      expect(typeof widgetPetName(s.soulmonMeta)).toBe('string');
    }
  });
});
