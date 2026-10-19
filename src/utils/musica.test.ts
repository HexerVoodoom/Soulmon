/**
 * O DIRETOR DE MÚSICA (11/10/2026; 19/10/2026): home = tema, masmorra = dungeon theme, torneio/duelo = pvp theme,
 * arena = faixa própria. Mocka os motores e mede as DECISÕES (quem é pausado/pedido), nunca som.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('Pesadelo (15/10/2026): a superfície da trilha de terror', () => {
  it('entrar com música ligada: o tema ganha a pausa `cena`, as faixas de combate saem e o terror é pedido; sair desfaz', () => {
    M.temaOn = true;
    const sair = entrarNaSuperficie('pesadelo');
    expect(superficieAtual()).toBe('pesadelo');
    expect(M.chamadas).toEqual(['consentir', 'combate:true', 'faixa:null', 'combate-faixa:null:true', 'tema-pausa:cena']);
    M.chamadas.length = 0;
    sair();
    expect(superficieAtual()).toBe('casa');
    expect(M.chamadas).toEqual(['combate:false', 'faixa:null', 'combate-faixa:null:true', 'tema-retoma:cena']);
  });
  it('sem nenhuma música ligada o tema não é pausado (o terror nem entra)', () => {
    M.temaOn = false;
    M.combateOn = false;
    entrarNaSuperficie('pesadelo');
    expect(M.chamadas).not.toContain('tema-pausa:cena');
  });
});

describe('a tabela (pura): superfície × preferências → faixa', () => {
  it.each([
    ['casa', true, false, 'tema'],
    ['casa', true, true, 'tema'],          // tema ligado: a Home é do tema, mesmo com a de combate ligada
    ['casa', false, true, null],           // o legado "só o loop → loop na Home" SAIU (19/10/2026)
    ['casa', false, false, null],
    ['masmorra', true, true, 'masmorra'],  // o dungeon theme na masmorra
    ['arena', true, true, 'arena'],        // a faixa própria na arena
    ['torneio', true, true, 'pvp'],        // o pvp theme no torneio e no duelo
    ['duelo', true, true, 'pvp'],
    ['masmorra', false, true, 'masmorra'],
    ['masmorra', true, false, 'tema'],     // sem a música de combate ligada, nada muda: o tema segue
    ['arena', true, false, 'tema'],
    ['duelo', true, false, 'tema'],
    ['torneio', false, false, null],
    ['arena', false, false, null],
  ] as const)('%s tema=%s combate=%s → %s', (s, t, c, esperado) => {
    expect(escolherFaixa(s, t, c)).toBe(esperado);
  });

  it('cada superfície de combate tem a sua faixa; masmorra e arena são diferentes; torneio e duelo dividem o pvp theme', () => {
    expect(FAIXA_DE_COMBATE.masmorra).toBe('masmorra');
    expect(FAIXA_DE_COMBATE.arena).toBe('arena');
    expect(FAIXA_DE_COMBATE.torneio).toBe('pvp');
    expect(FAIXA_DE_COMBATE.duelo).toBe('pvp');
    expect(FAIXA_DE_COMBATE.masmorra).not.toBe(FAIXA_DE_COMBATE.arena);
  });

  it('o lobby do Torneio NÃO é luta; o duelo é', () => {
    expect(SUPERFICIE_EM_COMBATE.torneio).toBe(false);
    expect(SUPERFICIE_EM_COMBATE.duelo).toBe(true);
    expect(SUPERFICIE_EM_COMBATE.casa).toBe(false);
    expect(SUPERFICIE_EM_COMBATE.masmorra).toBe(true);
    expect(SUPERFICIE_EM_COMBATE.pesadelo).toBe(true);
  });
});

describe('o apply: nunca duas músicas ao mesmo tempo', () => {
  it('Home com tema: a trilha não é pedida e o tema não tem motivo de pausa', () => {
    reavaliarMusica();
    expect(M.chamadas).toEqual(['combate:false', 'faixa:null', 'combate-faixa:null:true', 'tema-retoma:cena']);
  });

  it('entrar na masmorra com a música de combate ligada: o tema ganha a pausa `cena` (crossfade) e o dungeon theme é pedido; sair desfaz', () => {
    M.combateOn = true;
    const sair = entrarNaSuperficie('masmorra');
    expect(M.chamadas).toContain('consentir'); // abrir o jogo é o gesto
    expect(M.chamadas).toContain('tema-pausa:cena');
    expect(M.chamadas).toContain('combate-faixa:masmorra:true');
    expect(M.chamadas).toContain('faixa:null'); // o loop NÃO é pedido
    expect(M.chamadas).not.toContain('faixa:masmorra');
    expect(superficieAtual()).toBe('masmorra');
    M.chamadas.length = 0;
    sair();
    expect(superficieAtual()).toBe('casa');
    expect(M.chamadas).toEqual(['combate:false', 'faixa:null', 'combate-faixa:null:true', 'tema-retoma:cena']); // o tema volta de onde parou
  });

  it('torneio pede o pvp theme SEM degrau de combate; o duelo empilhado pede com degrau, e sair do duelo volta ao lobby', () => {
    M.combateOn = true;
    entrarNaSuperficie('torneio');
    expect(M.chamadas).toContain('combate-faixa:pvp:false');
    expect(M.chamadas).toContain('tema-pausa:cena');
    M.chamadas.length = 0;
    const sairDuelo = entrarNaSuperficie('duelo');
    expect(M.chamadas).toContain('combate-faixa:pvp:true');
    M.chamadas.length = 0;
    sairDuelo();
    expect(superficieAtual()).toBe('torneio');
    expect(M.chamadas).toContain('combate-faixa:pvp:false');
  });

  it('a Arena pede a faixa derivada e nenhuma música de combate em streaming', () => {
    M.combateOn = true;
    entrarNaSuperficie('arena');
    expect(M.chamadas).toContain('faixa:arena');
    expect(M.chamadas).toContain('combate-faixa:null:true');
    expect(M.chamadas).toContain('tema-pausa:cena');
  });

  it('com a música de combate DESLIGADA o jogo nem consente nem pede faixa: o tema segue (só mais baixo)', () => {
    M.combateOn = false;
    entrarNaSuperficie('arena');
    expect(M.chamadas).toContain('consentir'); // o consentimento em si é inofensivo: sem a chave ligada o motor o ignora
    expect(M.chamadas).toContain('combate:true');
    expect(M.chamadas).toContain('faixa:null');
    expect(M.chamadas.some(c => c.startsWith('combate-faixa:') && !c.startsWith('combate-faixa:null'))).toBe(false);
    expect(M.chamadas).not.toContain('tema-pausa:cena');
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
