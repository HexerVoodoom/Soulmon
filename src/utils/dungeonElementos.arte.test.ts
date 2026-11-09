import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ELEMENTOS_DA_MASMORRA } from './dungeonElementos';
import { dungeonWaveOf } from './dungeonAway';
import { ENEMY_ROSTER, pickEnemy } from './enemyRoster';
import { rosterSpriteOf } from './novosSoulmon';
import { COMBINADOS_ART, PARALELOS_ART } from './enemyRosterArt';
import { PARALELOS_DATA } from './enemyRosterData';

/**
 * Fenda Sem Fim temática (09/11/2026; dono: inimigos de "Chama Azul" pareciam a criatura de Vigor).
 * Para TODO elemento que pode aparecer na Fenda: o inimigo sorteado é DAQUELE elemento, tem arte, e a arte não é o quebra-galho de
 * `enemyRosterArt.ts` (rookie da criatura base do 1º componente) — exceto os que estão na dívida de arte declarada abaixo.
 */
const SEM_ARTE_PROPRIA = ['alto_forno', 'bencao_feerica', 'clareira', 'colosso_blindado', 'corte_feerica', 'floresta_ancestral'];

const baseRookie = (el: string) => rosterSpriteOf(ENEMY_ROSTER.find(e => e.kind === 'base' && e.element === el && e.stage === 'rookie')!);

describe('Fenda Sem Fim: a arte do inimigo é do elemento da camada', () => {
  for (const el of ELEMENTOS_DA_MASMORRA) {
    it(`elemento ${el}`, () => {
      const e = pickEnemy(Number.POSITIVE_INFINITY, () => 0.3, { element: el, stage: 'rookie' });
      expect(e.element, 'caiu no sorteio comum').toBe(el);
      const s = rosterSpriteOf(e);
      expect(s, 'sem arte').toBeTruthy();
      if (e.kind === 'combinado') {
        const base = e.elements.map(baseRookie);
        if (SEM_ARTE_PROPRIA.includes(el)) expect(base, `${el} ganhou arte própria: tire da lista`).toContain(s);
        else expect(base, `${el} usa o rookie de ${e.elements.join('/')}`).not.toContain(s);
      } else if (e.kind === 'base') {
        expect(s).toContain(`/${el}-`);
      }
    });
    it(`onda da camada de ${el} só tem esse elemento`, () => {
      const w = dungeonWaveOf(1, ELEMENTOS_DA_MASMORRA.indexOf(el) * 2 + 1, 30, 'mega');
      for (const f of w) if (f.element) expect(f.element).toBe(el);
    });
  }
  it('nenhum PNG combinado é compartilhado, salvo os da dívida de arte', () => {
    const porUrl = new Map<string, string[]>();
    for (const [k, u] of Object.entries(COMBINADOS_ART)) porUrl.set(u, [...(porUrl.get(u) ?? []), k]);
    const dup = [...porUrl.values()].filter(v => v.length > 1).flat().map(k => k.replace(/^\d+-/, '')).sort();
    expect(dup).toEqual(SEM_ARTE_PROPRIA.filter(x => dup.includes(x)).sort());
  });
});

/** SHA-256 do PNG ANTIGO de `009-chama_azul` (Embaha, urso-centopeia marrom que parecia a criatura de Vigor). Nunca mais pode ser a arte de Chama Azul. */
const SHA_009_ANTIGO = '3b2cf6b62189a76209246f89152bab17215e412066fb3b31fe36ed3c733a5003';
const sha = (f: string) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const ART = path.resolve(__dirname, '../assets/soulmon/novos-arquivo');

describe('Chama Azul nunca mais mostra o urso marrom (09/11/2026)', () => {
  it('o arquivo 009 não é mais o PNG antigo, e nenhum PNG do app tem os bytes dele', () => {
    expect(sha(path.join(ART, 'combinados/009-chama_azul.png'))).not.toBe(SHA_009_ANTIGO);
    const todos = [...fs.readdirSync(path.join(ART, 'combinados')).map(f => 'combinados/' + f), ...fs.readdirSync(path.join(ART, 'paralelos')).map(f => 'paralelos/' + f)];
    for (const f of todos) expect(sha(path.join(ART, f)), f).not.toBe(SHA_009_ANTIGO);
  });
  it('toda entrada do roster de Chama Azul, em qualquer estágio, tem arte e não é o antigo; champion/ultimate são as formas novas', () => {
    const doEl = ENEMY_ROSTER.filter(e => e.element === 'chama_azul');
    expect(doEl.map(e => e.stage).sort()).toEqual(['champion', 'rookie', 'ultimate']);
    for (const e of doEl) {
      const s = rosterSpriteOf(e);
      expect(s, e.key).toBeTruthy();
      if (e.kind === 'paralelo') expect(s).toBe(PARALELOS_ART[e.artFile!]);
    }
    for (const stage of ['rookie', 'champion', 'ultimate'] as const) {
      const e = pickEnemy(30, () => 0.1, { element: 'chama_azul', stage });
      expect(e.element).toBe('chama_azul');
      expect(e.stage).toBe(stage);
      if (stage !== 'rookie') expect(e.kind).toBe('paralelo');
    }
  });
  it('as 10 formas paralelas têm arte própria e cada uma é única (nenhum PNG repetido)', () => {
    expect(PARALELOS_DATA).toHaveLength(5);
    const hashes = Object.keys(PARALELOS_ART).map(k => sha(path.join(ART, 'paralelos', k + '.png')));
    expect(hashes).toHaveLength(10);
    expect(new Set(hashes).size).toBe(10);
  });
});
