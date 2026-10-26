import { describe, it, expect } from 'vitest';
import { LOJA_ITENS, LOJA_COPY_TABLE, LOJA_ID_RE, lojaText } from './guildLoja';
import { DECOR_ART } from './decorArt';
// @ts-expect-error módulo JS do servidor, sem declaração (a verdade do catálogo)
import { LOJA_CATALOGO } from '../../functions/api/_lojaCla.js';

describe('Loja do clã — paridade cliente × servidor', () => {
  it('mesmos ids, mesma ordem, mesmos preços', () => {
    expect(LOJA_ITENS.map(i => ({ id: i.id, preco: i.preco }))).toEqual(LOJA_CATALOGO.map((i: { id: string; preco: number }) => ({ id: i.id, preco: i.preco })));
  });
  it('catálogo de 6 a 10 itens, ids únicos e estáveis, preço inteiro positivo', () => {
    expect(LOJA_ITENS.length).toBeGreaterThanOrEqual(6);
    expect(LOJA_ITENS.length).toBeLessThanOrEqual(10);
    expect(new Set(LOJA_ITENS.map(i => i.id)).size).toBe(LOJA_ITENS.length);
    for (const i of LOJA_ITENS) {
      expect(i.id).toMatch(LOJA_ID_RE);
      expect(Number.isInteger(i.preco) && i.preco > 0).toBe(true);
    }
  });
  it('toda arte existe e nenhum item tem nome vazio (EN e PT)', () => {
    for (const i of LOJA_ITENS) {
      expect(DECOR_ART[i.arte], i.arte).toBeTruthy();
      expect(i.nameEn.trim().length).toBeGreaterThan(0);
      expect(i.namePt.trim().length).toBeGreaterThan(0);
    }
  });
  it('copy: EN e PT em toda chave, sem dígito literal e sem vocabulário de cobrança', () => {
    const veto = [/\bfalt/i, /\bmissing\b/i, /\bprecisa/i, /\bneed/i, /\bdevendo\b/i, /\bowe\b/i, /\bcontribu/i, /\bstreak\b/i, /%/];
    for (const [k, [en, pt]] of Object.entries(LOJA_COPY_TABLE)) {
      expect(en.trim().length, k).toBeGreaterThan(0);
      expect(pt.trim().length, k).toBeGreaterThan(0);
      for (const t of [en, pt]) {
        expect(t, k).not.toMatch(/\d/);
        for (const re of veto) expect(t, `${k} ${re}`).not.toMatch(re);
      }
    }
    expect(lojaText('en-US', 'comprar', { n: 5 })).toBe('Get for 5 Bits');
    expect(lojaText('pt-BR', 'titulo')).toBe('Loja');
  });
});
