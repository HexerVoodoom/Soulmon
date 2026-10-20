import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ART_LINE_IDS } from '../../functions/api/_artLine.js';
import { CORVO_LINE } from './corvoPet';
import { DEMO_CHARACTER_IDS, DUNGEON_LINE_SPRITES, RETIRED_LINE_IDS, STARTER_SPRITES, getSpriteForStage } from './sprites';
import { isKnownArtLine, opponentIcon, opponentSprite, resolveOpponentLine } from './opponentArt';

// D-60: oponente NUNCA e desenhado com a arvore generica (gato-coruja, arte descartada).

const STAGES = ['rookie', 'champion-power', 'champion-harmony', 'ultimate-benevolence', 'mega-power', 'ultra'];
// D-104: a árvore genérica foi APOSENTADA (arquivos removidos); o que vale agora é só "arte atual" = inicial ou linha vigente.
const atual = new Set<string>([...Object.values(STARTER_SPRITES), ...Object.values(DUNGEON_LINE_SPRITES).flatMap(l => Object.values(l))]);

describe('opponentArt', () => {
  it('D-78: perfil com artLine aposentada desenha um inicial atual, nunca a árvore genérica', () => {
    for (const id of RETIRED_LINE_IDS) for (const st of STAGES) {
      const sp = opponentSprite({ artLine: id, stage: st, id: 'x' });
      expect(atual.has(sp), `${id}:${st}`).toBe(true);
    }
  });

  it('lista fechada do servidor == o que o cliente sabe desenhar', () => {
    const cliente = new Set<string>([...DEMO_CHARACTER_IDS, ...Object.keys(DUNGEON_LINE_SPRITES), ...RETIRED_LINE_IDS, CORVO_LINE]); // D-78: o servidor ainda aceita as 3 aposentadas (perfil antigo)
    expect([...ART_LINE_IDS].sort()).toEqual([...cliente].sort());
  });

  it('com artLine: usa a arte da linha do oponente', () => {
    expect(opponentSprite({ stage: 'rookie', artLine: 'meteoro' })).toBe(STARTER_SPRITES.meteoro);
    expect(opponentSprite({ stage: 'champion-power', artLine: 'kaelen' })).toBe(getSpriteForStage('champion-power', 'kaelen'));
    expect(opponentSprite({ stage: 'mega-power', artLine: CORVO_LINE })).toBe(getSpriteForStage('mega-power', CORVO_LINE));
  });

  it('SEM artLine (oponente antigo): nunca a arvore generica; estavel por identidade', () => {
    for (const artLine of [undefined, null, '', 'nao-existe', 'rookie']) {
      for (const stage of STAGES) {
        const url = opponentSprite({ stage, artLine, id: 'abc' });
        expect(atual.has(url), `${String(artLine)}/${stage}`).toBe(true);
        expect(Object.values(STARTER_SPRITES)).toContain(url);
        expect(opponentSprite({ stage, artLine, id: 'abc' })).toBe(url);
      }
    }
    const linhas = new Set(['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7'].map(id => resolveOpponentLine({ stage: 'rookie', id })));
    expect(linhas.size).toBeGreaterThan(1); // oponentes diferentes se distinguem
  });

  it('icone-ficha so existe para linha da masmorra', () => {
    expect(opponentIcon({ stage: 'champion-power', artLine: 'meteoro' }, 64)).toBeUndefined();
    expect(isKnownArtLine('ignar')).toBe(true); // id aposentado segue lido (save/perfil antigo)
    expect(isKnownArtLine('zzz')).toBe(false);
  });
});

// Régua: arquivo de tela que desenha OUTRA pessoa não chama getSpriteForStage/lineIconForStage com o estágio dela.
describe('régua D-60 — oponente não usa a árvore genérica', () => {
  const walk = (dir: string): string[] => readdirSync(dir).flatMap(n => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(n) && !/\.test\./.test(n) && n !== 'opponentArt.ts' ? [p] : [];
  });
  const RE = /(getSpriteForStage|lineIconForStage)\(\s*(o|r|p|opp|player|opponent|duel\.opp|result\.opponent|oppSide)\.stage\b/;
  it('nenhum call-site passa o estágio de outro jogador sem a linha', () => {
    const isComment = (l: string) => /^\s*(\/\/|\*|\/\*)/.test(l);
    const ruins = walk(join(__dirname, '..')).filter(f => readFileSync(f, 'utf8').split('\n').some(l => !isComment(l) && RE.test(l)));
    expect(ruins.map(f => f.replace(/\\/g, '/').split('/src/')[1])).toEqual([]);
  });
});
