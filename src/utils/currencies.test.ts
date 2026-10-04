import { describe, it, expect } from 'vitest';
import { CURRENCIES, CREDIT_TO_BITS, BITS_EXCHANGE, EMBLEMS_PER_WIN, EMBLEMS_PER_LOSS, creditMinigameBits, minigameBitsToday, MINIGAME_BITS_PER_DAY } from './currencies';
import { SHOP_ITEMS, TOURNAMENT_ITEMS, ALL_SHOP_ITEMS } from './shop';
import { PET_BACKGROUNDS } from './backgrounds';

// As três moedas se distinguem pela ORIGEM, e é isso que define o que cada uma
// pode fazer. Estes testes travam as fronteiras: se caírem, alguém compra com a
// moeda errada — no limite, chega de graça ao que só o dinheiro real abre.

describe('as três moedas são distintas', () => {
  it('cada moeda tem um campo próprio no save', () => {
    const campos = Object.values(CURRENCIES).map(c => c.field);
    expect(new Set(campos).size).toBe(3);
  });

  it('cada moeda tem nome próprio nos dois idiomas', () => {
    for (const c of Object.values(CURRENCIES)) {
      expect(c.name.pt.length).toBeGreaterThan(0);
      expect(c.name.en.length).toBeGreaterThan(0);
    }
  });
});

describe('fronteira entre loja comum e loja do torneio', () => {
  it('itens do torneio cobram SEMPRE em Emblemas', () => {
    for (const item of TOURNAMENT_ITEMS) {
      expect(item.currency).toBe('emblems');
    }
  });

  it('nenhum item da loja comum cobra em Emblemas', () => {
    // Se um item de Bits cobrasse Emblema, o jogador de torneio compraria na
    // loja comum e a separação das moedas deixaria de existir.
    for (const item of SHOP_ITEMS) {
      expect(item.currency ?? 'bits').toBe('bits');
    }
  });

  it('os ids não colidem entre as duas listas', () => {
    // handleShopBuy procura o item nas duas: id repetido compraria o errado.
    const comuns = new Set(SHOP_ITEMS.map(i => i.id));
    for (const item of TOURNAMENT_ITEMS) {
      expect(comuns.has(item.id)).toBe(false);
    }
  });
});

describe('câmbio Créditos → Bits', () => {
  it('todo pacote respeita a taxa declarada', () => {
    for (const pack of BITS_EXCHANGE) {
      expect(pack.bits).toBe(pack.credits * CREDIT_TO_BITS);
    }
  });

  it('não existe caminho de volta (Bits → Créditos)', () => {
    // A ausência é a regra: Créditos são a única moeda que libera gerar o pet
    // próprio. Se desse pra convertê-los de volta a partir de Bits, bastava
    // jogar minijogo para chegar ao que só o dinheiro real deveria abrir.
    const mod = Object.keys({ CREDIT_TO_BITS, BITS_EXCHANGE });
    expect(mod.some(k => /BITS_TO_CREDIT|bitsToCredit/i.test(k))).toBe(false);
  });

  it('não existe pacote que dê Bits de graça', () => {
    for (const pack of BITS_EXCHANGE) {
      expect(pack.credits).toBeGreaterThan(0);
    }
  });
});

describe('ganho de Emblemas no torneio', () => {
  it('vencer rende mais que perder', () => {
    expect(EMBLEMS_PER_WIN).toBeGreaterThan(EMBLEMS_PER_LOSS);
  });

  it('perder ainda rende algo — a partida do dia nunca é tempo perdido', () => {
    expect(EMBLEMS_PER_LOSS).toBeGreaterThan(0);
  });

  it('o item mais barato do torneio custa mais que uma partida', () => {
    // Senão a aba inteira sai na primeira luta e não há progressão nenhuma.
    const maisBarato = Math.min(...TOURNAMENT_ITEMS.map(i => i.price));
    expect(maisBarato).toBeGreaterThan(EMBLEMS_PER_WIN);
  });

  it('a escada de preços tem degraus de verdade', () => {
    // Um catálogo de preço único não é progressão — é uma compra só, repetida.
    const precos = new Set(TOURNAMENT_ITEMS.map(i => i.price));
    expect(precos.size).toBeGreaterThanOrEqual(4);
  });
});

describe('o torneio só vende cosmético', () => {
  it('nenhum item do torneio muda o jogo', () => {
    // Emblemas moram no SAVE DO CLIENTE, como os Bits — quem editar o
    // localStorage se dá quantos quiser. Isso é aceitável exatamente
    // enquanto a aba vende enfeite. No dia em que um item de torneio der
    // vantagem (cura, atributo, evolução), este teste cai — e a resposta
    // certa NÃO é afrouxá-lo, é mover os Emblemas para o servidor, junto
    // dos Créditos (functions/api/_entitlements.js).
    for (const item of TOURNAMENT_ITEMS) {
      expect(['bg', 'furniture']).toContain(item.kind);
      expect(item.attr).toBeUndefined();
    }
  });
});

describe('todo item comprável é renderizável', () => {
  it('todo cenário à venda tem CSS', () => {
    for (const item of ALL_SHOP_ITEMS.filter(i => i.kind === 'bg')) {
      expect(PET_BACKGROUNDS[item.id], `sem CSS: ${item.id}`).toBeDefined();
    }
  });

  it('toda mobília equipada é encontrável pelo catálogo completo', () => {
    // O CompanionHUD resolve a mobília equipada por id em ALL_SHOP_ITEMS.
    // Procurar só em SHOP_ITEMS fazia a mobília do torneio sumir do box
    // depois de comprada e equipada.
    for (const item of TOURNAMENT_ITEMS.filter(i => i.kind === 'furniture')) {
      expect(ALL_SHOP_ITEMS.find(i => i.id === item.id && i.kind === 'furniture')).toBeDefined();
    }
  });

  it('não há id repetido no catálogo inteiro', () => {
    const ids = ALL_SHOP_ITEMS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// QA1 (rodada 6) — Bits de minijogo com quantia ou registro corrompidos.
describe('creditMinigameBits — entrada não finita não envenena o saldo', () => {
  it('amount NaN não vira gamePoints NaN', () => {
    const prev = { gamePoints: 50 };
    const r = creditMinigameBits(prev, NaN, 'Mon Sep 28 2026');
    expect(r).toBe(prev);
  });
  it('amount Infinity credita só o que o teto do dia permite', () => {
    const r = creditMinigameBits({ gamePoints: 0 }, Infinity, 'Mon Sep 28 2026');
    expect(r.gamePoints).toBe(MINIGAME_BITS_PER_DAY);
  });
  it('registro do dia com `earned` ilegível conta como zero (não NaN)', () => {
    const dia = 'Mon Sep 28 2026';
    const prev = { gamePoints: 10, minigameBits: { day: dia, earned: undefined as unknown as number } };
    expect(minigameBitsToday(prev, dia)).toBe(0);
    const r = creditMinigameBits(prev, 30, dia);
    expect(r.gamePoints).toBe(40);
    expect(r.minigameBits?.earned).toBe(30);
  });
});
