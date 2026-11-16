import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  HEX_CROWN_EFFECTS, HEX_CROWN_VARIANTS, HEX_COSTS, HEX_SLOTS, HEX_MAX_OWNED, hexCost, hexOverrides, hexFamily, hexValuesOf, parseHexItem, sanitizeHexsmith,
} from './hexsmith';
import { CROWN_ONLY_FAMILIES, SPECIAL_FAMILIES } from './combate/specials';
import { eEvocador, companheiroAtivo } from './companheiroInvocado';
import { hexCrownValueCopy } from './hexsmithCopy';
import { resolveHexCrownArt } from '../assets/soulmon/hex';

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

describe('a Hexsmith nunca liga nem desliga a invocação (decisão 2)', () => {
  it('eEvocador lê só estágio e ficha: a assinatura não aceita item da Hexsmith', () => {
    expect(eEvocador.length).toBe(2);
    expect(eEvocador('rookie', { escolaDominante: 'combate_fisico' })).toBe(eEvocador('rookie', { escolaDominante: 'combate_fisico' }));
    expect(typeof companheiroAtivo).toBe('function');
  });
  it('grep de importação cruzada: companheiroInvocado*.ts não importa hexsmith e hexsmith*.ts não importa companheiroInvocado', () => {
    const dir = __dirname;
    const arquivos = readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.includes('.test.'));
    for (const f of arquivos) {
      const src = readFileSync(join(dir, f), 'utf8');
      const imports = src.split('\n').filter((l) => /^\s*(import|export)\b.*\bfrom\b/.test(l)).join('\n');
      if (f.startsWith('companheiroInvocado')) expect(imports, f).not.toMatch(/hexsmith/i);
      if (f.startsWith('hexsmith')) expect(imports, f).not.toMatch(/companheiroInvocado/);
    }
  });
  it('nenhum slot nem valor da Hexsmith carrega invocação', () => {
    for (const s of HEX_SLOTS) for (const v of hexValuesOf(s)) expect(String(v).toLowerCase()).not.toMatch(/invoc|summon|evoca|companheiro/);
  });
});
