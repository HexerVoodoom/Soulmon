/**
 * CONTRATO "um sprite tem UM elemento" (dono, 30/10/2026). Tabela e evidência: docs/ELEMENTO-POR-SPRITE.md.
 * Reprova se: um arquivo de criatura não tem elemento no mapa canônico; o elemento de um combinado ≠ o id fundido do manifest;
 * um simulado ≠ o elemento do prompt com que a arte foi gerada; os golpes do pet ≠ o elemento do sprite do pet.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { SPRITE_ELEMENT, BOSS_ELEMENT, LINE_ELEMENT, DESAFIANTE_ELEMENT, lineElementOf, rosterEntryElement } from './spriteElement';
import { ENEMY_ROSTER } from './enemyRoster';
import { NOVOS_DATA } from './novosSoulmonData';
import { petElementOf, STARTER_ELEMENT } from './starterElements';
import { fighterIdentity, fighterIdentityFromFx } from './fighterIdentity';
import { dungeonEnemyElement, opponentElementFor } from './combatFx';
import { BOSS_ROSTER } from '../data/bossRoster';

const ART = path.resolve(__dirname, '../assets/soulmon');
const ls = (d: string) => fs.readdirSync(path.join(ART, d)).filter(f => f.endsWith('.png'));
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_');

/** O elemento do PROMPT de cada simulado (campo `base` de prompts.json do lote; a paleta do prompt confere). Embutido: não lê E:. */
const PROMPT_ELEMENT: Record<string, string> = {"sim_0001":"planta","sim_0002":"industrial","sim_0003":"luz","sim_0004":"luz","sim_0005":"agua","sim_0006":"luz","sim_0007":"planta","sim_0008":"industrial","sim_0009":"terra","sim_0010":"industrial","sim_0011":"luz","sim_0012":"fogo","sim_0013":"sombra","sim_0014":"terra","sim_0015":"ar","sim_0016":"industrial","sim_0017":"fogo","sim_0018":"ar","sim_0019":"terra","sim_0020":"fogo","sim_0021":"planta","sim_0022":"ar","sim_0023":"ar","sim_0024":"fogo","sim_0025":"fogo","sim_0026":"ar","sim_0027":"agua","sim_0028":"agua","sim_0029":"luz","sim_0030":"terra","sim_0031":"sombra","sim_0032":"sombra","sim_0033":"planta","sim_0034":"fogo","sim_0035":"industrial","sim_0036":"fogo","sim_0037":"sombra","sim_0038":"terra","sim_0039":"ar","sim_0040":"terra","sim_0041":"luz","sim_0042":"sombra","sim_0043":"terra","sim_0044":"industrial","sim_0045":"sombra","sim_0046":"planta","sim_0047":"sombra","sim_0048":"terra","sim_0049":"industrial","sim_0050":"luz"};
const NOME_DIFERE = new Set(['fossil', 'melodia', 'orvalho', 'circulo_feerico', 'lamina_purpurina', 'brinquedo']);
const ORACLE_IDS = ['agua', 'fogo', 'terra', 'ar', 'sombra', 'luz', 'planta', 'industrial'];

describe('todo arquivo de criatura tem elemento', () => {
  it('novos/: o prefixo do arquivo é o elemento (20)', () => {
    const els = new Set(ls('novos').map(f => f.split('-')[0]));
    expect(els.size).toBe(20);
    for (const el of els) expect(SPRITE_ELEMENT['novo:' + el], el).toBe(el);
    expect(new Set(NOVOS_DATA.map(n => n.element))).toEqual(els);
  });
  it('combinados/: elemento = id fundido do manifest, 211 de 211', () => {
    const man = JSON.parse(fs.readFileSync(path.join(ART, 'novos-' + 'arquivo/manifest.json'), 'utf8')).combined as { n: number; file: string; combination: string; components: string[] }[];
    const files = ls('novos-' + 'arquivo/combinados');
    expect(files.length).toBe(211);
    expect(man.length).toBe(211);
    for (const m of man) {
      const num = String(m.n).padStart(3, '0');
      expect(files, num).toContain(m.file.replace('combinados/', ''));
      const slug = m.file.replace(/^combinados\/\d{3}-/, '').replace(/\.png$/, '');
      expect(SPRITE_ELEMENT['cmb:' + num], num).toBe(slug);
      // o nome de exibição do manifest só difere do id em 6 casos conhecidos (id do jogo = slug do arquivo)
      if (!NOME_DIFERE.has(slug)) expect(norm(m.combination), num).toBe(slug);
      expect(fs.existsSync(path.join(ART, 'elementos/el-' + slug + '.png')), 'ícone ' + slug).toBe(true);
    }
    for (const e of ENEMY_ROSTER.filter(x => x.kind === 'combinado')) {
      expect(e.element).toBe(SPRITE_ELEMENT['cmb:' + e.artFile!.split('-')[0]]);
      expect(rosterEntryElement(e)).toBe(e.element);
      // componentes de 2 elementos batem com o manifest
      const m = man.find(x => String(x.n).padStart(3, '0') === e.artFile!.split('-')[0]);
      if (!m) continue; // lotes 1-3 (212-261): sem PNG/manifest ainda — cobertos por elementosLote{1,2,3}.test.ts
      expect([...e.elements]).toEqual(m.components.slice(0, 2));
    }
  });
  it('inimigos-api, iniciais, linhas, chefes, desafiantes', () => {
    for (const f of ls('inimigos-api')) expect(SPRITE_ELEMENT['api:' + f.split('-')[0]], f).toBeTruthy();
    for (const id of Object.keys(STARTER_ELEMENT)) expect(SPRITE_ELEMENT['starter:' + id], id).toBe(STARTER_ELEMENT[id as keyof typeof STARTER_ELEMENT]);
    for (const l of new Set(ls('lines').map(f => f.split('-')[0]))) expect(SPRITE_ELEMENT['line:' + l], l).toBeTruthy();
    for (const f of ls('bosses')) expect(SPRITE_ELEMENT['boss:' + f.replace(/^boss-/, '').replace(/\.png$/, '').replace(/-full$/, '')], f).toBeTruthy();
    for (const f of ls('desafiantes')) expect(SPRITE_ELEMENT['desafiante:npc-' + f.replace(/^(npc-desafiante|soulmon)-/, '').split(/[-.]/)[0]], f).toBeTruthy();
  });
  it('chefes: o elemento é o 1º do roster; as linhas antigas mostram a arte de um chefe', () => {
    for (const b of BOSS_ROSTER) expect(BOSS_ELEMENT[b.id], b.id).toBe(b.elements[0].id);
    expect(Object.keys(BOSS_ELEMENT).length).toBe(BOSS_ROSTER.length);
    for (const l of Object.keys(LINE_ELEMENT)) expect(lineElementOf(l)).toBeTruthy();
    expect(Object.keys(DESAFIANTE_ELEMENT).length).toBe(3);
  });
});

describe('sem hash/sorteio de elemento para arte conhecida', () => {
  it('inimigo de linha antiga usa o elemento do chefe; oponente sem elemento é neutro', () => {
    for (const l of Object.keys(LINE_ELEMENT)) expect(dungeonEnemyElement({ stage: l + '-ultimate' })).toBe(lineElementOf(l));
    expect(opponentElementFor({ id: 'p1', element: null })).toBe('neutro');
    expect(dungeonEnemyElement({ stage: 'x' })).toBe('neutro');
  });
});

describe('simulados: elemento = o do prompt (embutido)', () => {
  it('50 de 50, e o fallback de arte tem o MESMO elemento', async () => {
    // @ts-ignore JS do servidor
    const { SIMULADOS, ART_LINE_BY_ELEMENT } = await import('../../functions/api/_simulados.data.js');
    expect(SIMULADOS.length).toBe(50);
    for (const s of SIMULADOS) {
      expect(ORACLE_IDS).toContain(PROMPT_ELEMENT[s.id]);
      expect(s.element, s.id).toBe(PROMPT_ELEMENT[s.id]);
      if (s.artLine) expect(STARTER_ELEMENT[s.artLine as keyof typeof STARTER_ELEMENT] ?? LINE_ELEMENT[s.artLine], s.id).toBe(s.element);
      expect(s.artLine, s.id).toBe(ART_LINE_BY_ELEMENT[s.element] ?? '');
    }
  });
});

describe('pet: golpes = elemento do sprite do pet', () => {
  const ficha = (el: string): Record<string, unknown> => ({ basica: { elementoId: el, escolaId: 'combate_fisico', formaDoElemento: false }, especial: { elementoId: el, escolaId: 'combate_fisico', familia: 'direct' } });
  it('oráculo (8 ids) e iniciais: básico e especial = petElementOf, mesmo com a ficha dizendo outro', () => {
    for (const id of ORACLE_IDS) {
      const pet = petElementOf({ soulmonMeta: { dominantElement: id } })!;
      expect(pet).toBe(id);
      const ident = fighterIdentity({ ...ficha('vileza'), elementoDominante: { id: 'morte' } } as never, pet);
      expect(ident.basico.elemento).toBe(pet);
      expect(ident.especial.elemento).toBe(pet);
    }
    for (const [id, el] of Object.entries(STARTER_ELEMENT)) {
      const ident = fighterIdentity(ficha('arcano') as never, petElementOf({ demoCharacterId: id }));
      expect([ident.basico.elemento, ident.especial.elemento]).toEqual([el, el]);
    }
  });
  it('oponente do servidor: o fx publicado é o elemento do sprite dele', () => {
    const id = fighterIdentityFromFx({ basica: null, especial: null, familia: null, elBasica: 'fogo', elEspecial: 'fogo' }, 'neutro');
    expect([id.basico.elemento, id.especial.elemento]).toEqual(['fogo', 'fogo']);
  });
});
