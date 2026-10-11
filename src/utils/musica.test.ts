/**
 * O DIRETOR DE MÚSICA (11/10/2026): home = tema, masmorra = loop, arena = faixa própria. Mocka os dois motores e
 * mede as DECISÕES (quem é pausado/pedido), nunca som.
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
vi.mock('./tema', () => ({
  temaPreferido: () => M.temaOn,
  pausarTema: (m: string) => { M.chamadas.push(`tema-pausa:${m}`); },
  retomarTema: (m: string) => { M.chamadas.push(`tema-retoma:${m}`); },
  definirTemaEmCombate: (on: boolean) => { M.chamadas.push(`combate:${on}`); },
}));

import { entrarNaSuperficie, escolherFaixa, esquecerMusica, FAIXA_DE_COMBATE, reavaliarMusica, superficieAtual } from './musica';

beforeEach(() => { M.temaOn = true; M.combateOn = false; M.chamadas.length = 0; esquecerMusica(); });

describe('a tabela (pura): superfície × preferências → faixa', () => {
  it.each([
    ['casa', true, false, 'tema'],
    ['casa', true, true, 'tema'],          // tema ligado: a Home é do tema, mesmo com a de combate ligada
    ['casa', false, true, 'loop'],         // legado: só o loop ligado → o loop também na Home
    ['casa', false, false, null],
    ['masmorra', true, true, 'masmorra'],  // o LOOP na masmorra
    ['arena', true, true, 'arena'],        // a faixa própria na arena
    ['masmorra', false, true, 'masmorra'],
    ['masmorra', true, false, 'tema'],     // sem a música de combate ligada, nada muda: o tema segue
    ['arena', true, false, 'tema'],
    ['arena', false, false, null],
  ] as const)('%s tema=%s combate=%s → %s', (s, t, c, esperado) => {
    expect(escolherFaixa(s, t, c)).toBe(esperado);
  });

  it('cada superfície de combate tem a sua faixa, e elas são diferentes', () => {
    expect(FAIXA_DE_COMBATE.masmorra).toBe('masmorra');
    expect(FAIXA_DE_COMBATE.arena).toBe('arena');
    expect(FAIXA_DE_COMBATE.masmorra).not.toBe(FAIXA_DE_COMBATE.arena);
  });
});

describe('o apply: nunca duas músicas ao mesmo tempo', () => {
  it('Home com tema: a trilha não é pedida e o tema não tem motivo de pausa', () => {
    reavaliarMusica();
    expect(M.chamadas).toEqual(['combate:false', 'faixa:null', 'tema-retoma:cena']);
  });

  it('entrar na masmorra com a música de combate ligada: o tema ganha a pausa `cena` (crossfade) e o loop é pedido; sair desfaz', () => {
    M.combateOn = true;
    const sair = entrarNaSuperficie('masmorra');
    expect(M.chamadas).toContain('consentir'); // abrir o jogo é o gesto
    expect(M.chamadas).toContain('tema-pausa:cena');
    expect(M.chamadas).toContain('faixa:masmorra');
    expect(superficieAtual()).toBe('masmorra');
    M.chamadas.length = 0;
    sair();
    expect(superficieAtual()).toBe('casa');
    expect(M.chamadas).toEqual(['combate:false', 'faixa:null', 'tema-retoma:cena']); // o tema volta de onde parou
  });

  it('com a música de combate DESLIGADA o jogo nem consente nem pede faixa: o tema segue (só mais baixo)', () => {
    M.combateOn = false;
    entrarNaSuperficie('arena');
    expect(M.chamadas).toContain('consentir'); // o consentimento em si é inofensivo: sem a chave ligada o motor o ignora
    expect(M.chamadas).toContain('combate:true');
    expect(M.chamadas).toContain('faixa:null');
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
