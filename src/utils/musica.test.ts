/**
 * O DIRETOR DE MÚSICA (11/10/2026; 19/10/2026): home = tema; masmorra, arena, torneio e duelo = `combate`; pesadelo =
 * `pesadelo`. Mocka os motores e mede as DECISÕES (quem é pausado/pedido), nunca som.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';

const M = vi.hoisted(() => ({
  temaOn: true, combateOn: false,
  chamadas: [] as string[],
}));

vi.mock('./trilha', () => ({
  pedirFaixa: (f: string | null) => { M.chamadas.push(`faixa:${f}`); },
  consentirNestaSessao: () => { M.chamadas.push('consentir'); },
  trilhaPreferida: () => M.combateOn,
}));
vi.mock('./musicaDeCombate', () => ({
  pedirMusicaDeCombate: (f: string | null, c = true) => { M.chamadas.push(`combate-faixa:${f}:${c}`); },
}));
vi.mock('./tema', () => ({
  temaPreferido: () => M.temaOn,
  pausarTema: (m: string) => { M.chamadas.push(`tema-pausa:${m}`); },
  retomarTema: (m: string) => { M.chamadas.push(`tema-retoma:${m}`); },
  definirTemaEmCombate: (on: boolean) => { M.chamadas.push(`combate:${on}`); },
}));

import {
  entrarNaSuperficie, escolherFaixa, esquecerMusica, FAIXA_DE_COMBATE, reavaliarMusica, superficieAtual, SUPERFICIE_EM_COMBATE,
} from './musica';

beforeEach(() => { M.temaOn = true; M.combateOn = false; M.chamadas.length = 0; esquecerMusica(); });

const SAI_DO_TEMA = ['combate-faixa:null:true', 'tema-retoma:cena'];

describe('Pesadelo: a faixa própria, e só ela soa', () => {
  it('(b) entrar com a música de combate ligada: tema pausado (`cena`), loop null e o `pesadelo` pedido; sair desfaz', () => {
    M.combateOn = true;
    const sair = entrarNaSuperficie('pesadelo');
    expect(superficieAtual()).toBe('pesadelo');
    expect(M.chamadas).toEqual(['consentir', 'combate:true', 'faixa:null', 'tema-pausa:cena', 'combate-faixa:pesadelo:true']);
    M.chamadas.length = 0;
    sair();
    expect(superficieAtual()).toBe('casa');
    expect(M.chamadas).toEqual(['combate:false', 'faixa:null', ...SAI_DO_TEMA]);
  });
  it('interruptor de combate desligado: o Pesadelo segue como as outras (tema mais baixo, nada de faixa de combate)', () => {
    M.combateOn = false;
    entrarNaSuperficie('pesadelo');
    expect(M.chamadas).toContain('combate:true');
    expect(M.chamadas).toContain('tema-retoma:cena');
    expect(M.chamadas).not.toContain('tema-pausa:cena');
    expect(M.chamadas).not.toContain('combate-faixa:pesadelo:true');
  });
  it('sem nenhuma música ligada o tema não é pausado e nada é pedido', () => {
    M.temaOn = false;
    M.combateOn = false;
    entrarNaSuperficie('pesadelo');
    expect(M.chamadas).not.toContain('tema-pausa:cena');
    expect(M.chamadas.some(c => c.startsWith('combate-faixa:') && !c.startsWith('combate-faixa:null'))).toBe(false);
  });
  it('pesadelo aninhado sobre a masmorra: combate → pesadelo → combate, sempre com o loop null', () => {
    M.combateOn = true;
    entrarNaSuperficie('masmorra');
    expect(M.chamadas).toContain('combate-faixa:combate:true');
    M.chamadas.length = 0;
    const sair = entrarNaSuperficie('pesadelo');
    expect(M.chamadas).toContain('combate-faixa:pesadelo:true');
    expect(M.chamadas).not.toContain('combate-faixa:combate:true');
    M.chamadas.length = 0;
    sair();
    expect(M.chamadas).toContain('combate-faixa:combate:true');
    expect(M.chamadas.filter(c => c.startsWith('faixa:')).every(c => c === 'faixa:null')).toBe(true);
  });
});

describe('a tabela (pura): superfície × preferências → faixa', () => {
  it.each([
    ['casa', true, false, 'tema'],
    ['casa', true, true, 'tema'],          // tema ligado: a Home é do tema, mesmo com a de combate ligada
    ['casa', false, true, null],           // o legado "só o loop → loop na Home" SAIU (19/10/2026)
    ['casa', false, false, null],
    ['masmorra', true, true, 'combate'],
    ['arena', true, true, 'combate'],
    ['torneio', true, true, 'combate'],
    ['duelo', true, true, 'combate'],
    ['pesadelo', true, true, 'pesadelo'],
    ['masmorra', false, true, 'combate'],
    ['pesadelo', false, true, 'pesadelo'],
    ['masmorra', true, false, 'tema'],     // sem a música de combate ligada, nada muda: o tema segue
    ['arena', true, false, 'tema'],
    ['duelo', true, false, 'tema'],
    ['pesadelo', true, false, 'tema'],
    ['torneio', false, false, null],
    ['arena', false, false, null],
    ['pesadelo', false, false, null],
  ] as const)('%s tema=%s combate=%s → %s', (s, t, c, esperado) => {
    expect(escolherFaixa(s, t, c)).toBe(esperado);
  });

  it('(a) as 4 superfícies de combate pedem `combate`; o pesadelo pede `pesadelo`', () => {
    for (const s of ['masmorra', 'arena', 'torneio', 'duelo'] as const) expect(FAIXA_DE_COMBATE[s]).toBe('combate');
    expect(FAIXA_DE_COMBATE.pesadelo).toBe('pesadelo');
  });

  it('(c) o lobby do Torneio NÃO é luta; o duelo é', () => {
    expect(SUPERFICIE_EM_COMBATE.torneio).toBe(false);
    expect(SUPERFICIE_EM_COMBATE.duelo).toBe(true);
    expect(SUPERFICIE_EM_COMBATE.casa).toBe(false);
    expect(SUPERFICIE_EM_COMBATE.masmorra).toBe(true);
    expect(SUPERFICIE_EM_COMBATE.arena).toBe(true);
    expect(SUPERFICIE_EM_COMBATE.pesadelo).toBe(true);
  });
});

describe('o apply: nunca duas músicas ao mesmo tempo', () => {
  it('Home com tema: nada de combate e o tema não tem motivo de pausa', () => {
    reavaliarMusica();
    expect(M.chamadas).toEqual(['combate:false', 'faixa:null', ...SAI_DO_TEMA]);
  });

  it.each(['masmorra', 'arena', 'torneio', 'duelo'] as const)('(a) %s com combate ligado: tema pausado (`cena`), `combate` pedido, loop null', (s) => {
    M.combateOn = true;
    const sair = entrarNaSuperficie(s);
    expect(M.chamadas).toContain('consentir'); // abrir o jogo é o gesto
    expect(M.chamadas).toContain('tema-pausa:cena');
    expect(M.chamadas).toContain(`combate-faixa:combate:${SUPERFICIE_EM_COMBATE[s]}`);
    expect(M.chamadas).toContain('faixa:null'); // o loop NÃO é pedido
    expect(M.chamadas.filter(c => c.startsWith('faixa:') && c !== 'faixa:null')).toEqual([]);
    expect(superficieAtual()).toBe(s);
    M.chamadas.length = 0;
    sair();
    expect(superficieAtual()).toBe('casa');
    expect(M.chamadas).toEqual(['combate:false', 'faixa:null', ...SAI_DO_TEMA]); // o tema volta de onde parou
  });

  it('(c) torneio pede `combate` SEM degrau; o duelo empilhado pede COM degrau, e sair do duelo volta ao lobby', () => {
    M.combateOn = true;
    entrarNaSuperficie('torneio');
    expect(M.chamadas).toContain('combate-faixa:combate:false');
    M.chamadas.length = 0;
    const sairDuelo = entrarNaSuperficie('duelo');
    expect(M.chamadas).toContain('combate-faixa:combate:true');
    M.chamadas.length = 0;
    sairDuelo();
    expect(superficieAtual()).toBe('torneio');
    expect(M.chamadas).toContain('combate-faixa:combate:false');
  });

  it.each(['masmorra', 'arena', 'torneio', 'duelo', 'pesadelo'] as const)('(d) %s com combate DESLIGADO: o tema segue (só mais baixo), nenhuma faixa de combate', (s) => {
    M.combateOn = false;
    entrarNaSuperficie(s);
    expect(M.chamadas).toContain('consentir'); // inofensivo: sem a chave ligada o motor o ignora
    expect(M.chamadas).toContain(`combate:${SUPERFICIE_EM_COMBATE[s]}`);
    expect(M.chamadas).toContain('faixa:null');
    expect(M.chamadas.some(c => c.startsWith('combate-faixa:') && !c.startsWith('combate-faixa:null'))).toBe(false);
    expect(M.chamadas).not.toContain('tema-pausa:cena');
    expect(M.chamadas).toContain('tema-retoma:cena');
  });

  it('sair de uma superfície aninhada volta à ANTERIOR, e sair duas vezes é inofensivo', () => {
    M.combateOn = true;
    const sairMasmorra = entrarNaSuperficie('masmorra');
    const sairArena = entrarNaSuperficie('arena');
    expect(superficieAtual()).toBe('arena');
    sairArena();
    expect(superficieAtual()).toBe('masmorra');
    sairArena(); // idempotente
    expect(superficieAtual()).toBe('masmorra');
    sairMasmorra();
    expect(superficieAtual()).toBe('casa');
  });
});

describe('(e) R-NOVA: o diretor e o motor das músicas de combate não chamam nenhum play*', () => {
  it.each(['musica.ts', 'musicaDeCombate.ts'])('%s não importa `./sounds` para tocar SFX', (arq) => {
    const src = readFileSync(new URL(`./${arq}`, import.meta.url), 'utf-8');
    expect(src).not.toMatch(/\bplay[A-Z]\w*\(/);
    expect(src).not.toMatch(/import\s*\{[^}]*\bplay\w*[^}]*\}\s*from\s*['"]\.\/sounds['"]/);
  });
});
