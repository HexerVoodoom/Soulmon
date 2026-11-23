import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  HEX_CROWN_EFFECTS, HEX_CROWN_VALUES, HEX_CROWN_VARIANTS, HEX_COSTS, HEX_SLOTS, HEX_MAX_OWNED, hexCost, hexOverrides, hexFamily, hexValuesOf, parseHexItem, sanitizeHexsmith,
} from './hexsmith';
import { CROWN_ONLY_FAMILIES, SPECIAL_FAMILIES } from './combate/specials';
import { eEvocador, companheiroAtivo } from './companheiroInvocado';
import { HEX_UI, hexCrownValueCopy, hexCrownValueDesc } from './hexsmithCopy';
import { resolveHexCrownArt } from '../assets/soulmon/hex';
import { SUBSTANTIVOS_EFEITO, nomeDeLexico, nomeEspecialInimigo } from './soulProfile/ficha/nomeEspecial';

describe('Coroas de efeito (hot, slow, silence)', () => {
  it('cada efeito é aceito, custa o MESMO que a Coroa atual (decisão 4) e tem nome PT/EN', () => {
    for (const e of HEX_CROWN_EFFECTS) {
      expect(parseHexItem(`coroa:${e}`)).toEqual({ slot: 'coroa', value: e });
      expect(hexCost(`coroa:${e}`)).toEqual({ ...HEX_COSTS.coroa });
      const c = hexCrownValueCopy(e);
      expect(c?.en && c.pt).toBeTruthy();
      expect(hexValuesOf('coroa')).toContain(e);
    }
  });
  it('a família-base e o efeito saem de hexOverrides; sem efeito, a Coroa de família segue igual', () => {
    for (const e of HEX_CROWN_EFFECTS) {
      const hx = hexOverrides({ owned: [`coroa:${e}`], equipped: { coroa: `coroa:${e}` } });
      expect(hx.specialFamily).toBe(HEX_CROWN_VARIANTS[e].family);
      expect(hx.specialEffect).toBe(HEX_CROWN_VARIANTS[e].effect);
      expect(hexFamily('direct', hx)).toBe(HEX_CROWN_VARIANTS[e].family);
    }
    const f = hexOverrides({ owned: ['coroa:dot'], equipped: { coroa: 'coroa:dot' } });
    expect(f).toEqual({ specialFamily: 'dot' });
  });
  it('as famílias-base são do motor (nada de família nova nesta trilha) e HEX_MAX_OWNED só cresceu', () => {
    for (const e of HEX_CROWN_EFFECTS) expect(SPECIAL_FAMILIES).toContain(HEX_CROWN_VARIANTS[e].family);
    expect(HEX_MAX_OWNED).toBeGreaterThanOrEqual(3 * 210 + 7 + 2);
  });
  it('leitura tolerante: id desconhecido é descartado item a item e a migração é idempotente', () => {
    const raw = { owned: ['coroa:hot', 'coroa:nao_existe', 'coroa:slow'], equipped: { coroa: 'coroa:nao_existe' } };
    const a = sanitizeHexsmith(raw);
    expect(a.owned).toEqual(['coroa:hot', 'coroa:slow']);
    expect(a.equipped).toEqual({});
    expect(sanitizeHexsmith(a)).toEqual(a);
  });
  it('arte ausente = fallback tolerante (sem quebrar)', () => {
    for (const e of HEX_CROWN_EFFECTS) {
      const url = resolveHexCrownArt(e);
      expect(url === undefined || typeof url === 'string').toBe(true);
    }
  });
});

describe('Coroas de família nova (H2, trilha B: defBuff, atkDebuff, spdDebuff)', () => {
  it('cada uma é aceita, custa o MESMO que a Coroa (HEX_COSTS.coroa), tem nome PT/EN e entra na lista forjável', () => {
    expect([...CROWN_ONLY_FAMILIES]).toEqual(['defBuff', 'atkDebuff', 'spdDebuff']);
    for (const f of CROWN_ONLY_FAMILIES) {
      expect(parseHexItem(`coroa:${f}`)).toEqual({ slot: 'coroa', value: f });
      expect(hexCost(`coroa:${f}`)).toEqual({ ...HEX_COSTS.coroa });
      const c = hexCrownValueCopy(f);
      expect(c?.en && c.pt).toBeTruthy();
      expect(hexValuesOf('coroa')).toContain(f);
    }
  });
  it('são família de verdade (sem efeito) e NUNCA são das sorteáveis; HEX_MAX_OWNED só cresceu', () => {
    for (const f of CROWN_ONLY_FAMILIES) {
      const hx = hexOverrides({ owned: [`coroa:${f}`], equipped: { coroa: `coroa:${f}` } });
      expect(hx).toEqual({ specialFamily: f });
      expect(hexFamily('direct', hx)).toBe(f);
      expect(SPECIAL_FAMILIES as readonly string[]).not.toContain(f);
      const url = resolveHexCrownArt(f);
      expect(url === undefined || typeof url === 'string').toBe(true);
    }
    expect(HEX_MAX_OWNED).toBe(3 * 210 + 7 + HEX_CROWN_EFFECTS.length + CROWN_ONLY_FAMILIES.length + 2);
  });
});

describe('a Hexsmith nunca liga/desliga o gatilho; só a porta do companheiro consulta a Coroa (decisão do dono)', () => {
  it('eEvocador lê só estágio e ficha: a assinatura não aceita item da Hexsmith', () => {
    expect(eEvocador.length).toBe(2);
    expect(eEvocador('rookie', { escolaDominante: 'combate_fisico' })).toBe(eEvocador('rookie', { escolaDominante: 'combate_fisico' }));
    expect(typeof companheiroAtivo).toBe('function');
  });
  it('sentido da dependência: companheiroInvocado*.ts importa hexsmith; hexsmith*.ts NUNCA importa companheiroInvocado (sem ciclo)', () => {
    const dir = __dirname;
    const arquivos = readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.includes('.test.'));
    for (const f of arquivos) {
      const src = readFileSync(join(dir, f), 'utf8');
      const imports = src.split('\n').filter((l) => /^\s*(import|export)\b.*\bfrom\b/.test(l)).join('\n');
      if (f.startsWith('hexsmith')) expect(imports, f).not.toMatch(/companheiroInvocado/);
    }
  });
  it('nenhum slot nem valor da Hexsmith carrega invocação', () => {
    for (const s of HEX_SLOTS) for (const v of hexValuesOf(s)) expect(String(v).toLowerCase()).not.toMatch(/invoc|summon|evoca|companheiro/);
  });
});

describe('texto das 6 Coroas novas e o aviso calmo', () => {
  const seis = [...HEX_CROWN_EFFECTS, ...CROWN_ONLY_FAMILIES];
  it('cada uma tem nome e descrição PT/EN, e os 6 nomes são todos diferentes (sem duas "Lentidão")', () => {
    expect(seis).toHaveLength(6);
    for (const v of seis) {
      const n = hexCrownValueCopy(v);
      const d = hexCrownValueDesc(v);
      expect(n?.en && n.pt, v).toBeTruthy();
      expect(d?.en && d.pt, v).toBeTruthy();
    }
    expect(new Set(seis.map((v) => hexCrownValueCopy(v)!.pt)).size).toBe(6);
    expect(new Set(seis.map((v) => hexCrownValueCopy(v)!.en)).size).toBe(6);
  });
  it('TODA Coroa do catálogo (HEX_CROWN_VALUES) tem descrição PT/EN não vazia, sem "arquivo"/".exe"', () => {
    for (const v of HEX_CROWN_VALUES) {
      const d = hexCrownValueDesc(v);
      expect(d?.en.trim() && d.pt.trim(), v).toBeTruthy();
      expect(`${d!.en} ${d!.pt}`, v).not.toMatch(/arquivo|\.exe|file/i);
    }
  });
  it('o aviso do evocador é calmo: descansa, sem cobrança', () => {
    expect(HEX_UI.companionRests.en).toBe('While the Crown is equipped, your companion rests.');
    expect(HEX_UI.companionRests.pt).toBe('Com a Coroa equipada, o companheiro descansa.');
  });
});

describe('H4: o nome do especial do oponente com Coroa de efeito usa o léxico do efeito', () => {
  const el = { en: 'Fire', pt: 'Fogo' };
  it('slow e silence: o substantivo é do léxico do efeito, e sem efeito segue a família', () => {
    for (const e of ['slow', 'silence'] as const) {
      const n = nomeEspecialInimigo(el, 'x', 'defDebuff', e);
      expect(SUBSTANTIVOS_EFEITO[e].some((s) => n.en.includes(s.en)), e).toBe(true);
    }
    const base = nomeEspecialInimigo(el, 'x', 'defDebuff');
    expect(SUBSTANTIVOS_EFEITO.slow.some((s) => base.en.includes(s.en))).toBe(false);
  });
  it('efeito fora da família-base é ignorado; hot usa o léxico de cura', () => {
    expect(nomeEspecialInimigo(el, 'x', 'dot', 'slow')).toEqual(nomeEspecialInimigo(el, 'x', 'dot'));
    expect(nomeEspecialInimigo(el, 'y', 'shield', 'hot')).toEqual(nomeEspecialInimigo(el, 'y', 'heal'));
  });
  it('nomeDeLexico com efeito recompõe com o léxico do efeito (sem efeito, o da família)', () => {
    const fx = { familia: 'defDebuff', lex: { n: 3, f: 1, el: 'fogo', elB: 'fogo' } };
    expect(nomeDeLexico({ ...fx, efeito: 'slow' })?.en).toContain(SUBSTANTIVOS_EFEITO.slow[3].en);
    expect(nomeDeLexico(fx)?.en).not.toContain(SUBSTANTIVOS_EFEITO.slow[3].en);
  });
});
