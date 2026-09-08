/**
 * A aventura da noite (`docs/PLANO-TAREFAS.md` §2.4).
 *
 * A maior parte destes testes existe para proteger as quatro regras escritas no
 * topo de `adventure.ts` — e a primeira delas é a que mais importa:
 *
 *  1. **Nenhum dia volta de mãos vazias.** O relatório de um dia ruim é o
 *     momento mais frágil do app. Se um dia alguém "otimizar" isto para exigir
 *     a meta, terá transformado o relatório num segundo lugar onde a pessoa
 *     perde algo — que é a cobrança que a essência declarada proíbe.
 *  2. **Não paga nada** (decisão do dono): o módulo não devolve nem conhece
 *     Bits, item ou atributo.
 *  3. **Determinismo por dia**: reabrir não re-sorteia.
 *  4. **O dia mexe na CHANCE, nunca no acesso**: não existe achado reservado a
 *     quem teve um dia bom.
 */
import { describe, it, expect } from 'vitest';
import {
  ADVENTURE_CATALOG,
  ADVENTURE_ODDS,
  adventureOfDay,
  adventureRarity,
  rollAdventure,
  collectAdventure,
  findById,
  type AdventureRarity,
} from './adventure';

const IDS = ADVENTURE_CATALOG.map(a => a.id);

describe('catálogo', () => {
  it('todo achado tem id único', () => {
    expect(new Set(IDS).size).toBe(IDS.length);
  });

  it('todo achado fala os DOIS idiomas, em título e em texto', () => {
    // Guard vivo do mesmo contrato que `i18nSemPtSozinho` cobra na UI: aqui o
    // texto nasce no catálogo, então é aqui que ele tem de ser cobrado.
    for (const a of ADVENTURE_CATALOG) {
      expect(a.titlePt.trim(), a.id).toBeTruthy();
      expect(a.titleEn.trim(), a.id).toBeTruthy();
      expect(a.textPt.trim(), a.id).toBeTruthy();
      expect(a.textEn.trim(), a.id).toBeTruthy();
      expect(a.titlePt, a.id).not.toBe(a.titleEn);
      expect(a.textPt, a.id).not.toBe(a.textEn);
    }
  });

  it('as três faixas existem e nenhuma está vazia', () => {
    for (const r of ['common', 'rare', 'legendary'] as AdventureRarity[]) {
      expect(ADVENTURE_CATALOG.filter(a => a.rarity === r).length, r).toBeGreaterThan(0);
    }
  });

  it('todo achado tem glifo — a estrutura já aceita arte por cima', () => {
    for (const a of ADVENTURE_CATALOG) expect(a.emoji.trim(), a.id).toBeTruthy();
  });

  it('nenhum achado carrega recompensa material', () => {
    // Decisão do dono (08/09/2026): a recompensa é narrativa. Se um campo de
    // Bits/item aparecer aqui, o relatório vira lugar de perder coisa.
    for (const a of ADVENTURE_CATALOG) {
      const chaves = Object.keys(a).sort();
      expect(chaves, a.id).toEqual(['emoji', 'id', 'rarity', 'textEn', 'textPt', 'titleEn', 'titlePt']);
    }
  });
});

describe('NENHUM dia volta de mãos vazias', () => {
  it('dia zerado ainda traz um achado', () => {
    const a = adventureOfDay([], 0, 6, '2026-09-08');
    expect(a).toBeTruthy();
    expect(a.textPt.length).toBeGreaterThan(0);
  });

  it('em 400 dias seguidos, todos trazem algo — inclusive os zerados', () => {
    for (let i = 0; i < 400; i++) {
      const a = adventureOfDay([], 0, 6, `dia-${i}`);
      expect(a, `dia ${i}`).toBeTruthy();
      expect(IDS, `dia ${i}`).toContain(a.id);
    }
  });

  it('sem nada cadastrado (meta 0) também traz — e não é penalizado', () => {
    // Não há o que cumprir, então não faz sentido receber a chance mais baixa
    // por um dia que o próprio jogo decidiu não cobrar.
    const semMeta = contarRaridades((s) => adventureRarity(0, 0, s));
    const cumpriu = contarRaridades((s) => adventureRarity(6, 6, s));
    expect(semMeta.common).toBeCloseTo(cumpriu.common, -2);
  });
});

/** Distribui 4000 seeds e conta as faixas — a chance é estatística, não fixa. */
function contarRaridades(fn: (seed: number) => AdventureRarity) {
  const c = { common: 0, rare: 0, legendary: 0 };
  for (let s = 1; s <= 4000; s++) c[fn(s)]++;
  return c;
}

describe('o dia mexe na CHANCE, nunca no acesso', () => {
  it('cumprir a meta aumenta a chance de raro e de lendário', () => {
    const bom = contarRaridades(s => adventureRarity(6, 6, s));
    const ruim = contarRaridades(s => adventureRarity(0, 6, s));
    expect(bom.rare + bom.legendary).toBeGreaterThan(ruim.rare + ruim.legendary);
  });

  it('mas o dia parado NUNCA zera raro nem lendário', () => {
    // É a linha que separa isto de um battle pass. Se cair, alguém transformou
    // a chance num portão.
    const ruim = contarRaridades(s => adventureRarity(0, 6, s));
    expect(ruim.rare).toBeGreaterThan(0);
    expect(ruim.legendary).toBeGreaterThan(0);
  });

  it('nenhuma faixa de chance é zero na tabela', () => {
    for (const f of ADVENTURE_ODDS) {
      expect(f.rare, `minRatio ${f.minRatio}`).toBeGreaterThan(0);
      expect(f.legendary, `minRatio ${f.minRatio}`).toBeGreaterThan(0);
    }
  });

  it('todo achado do catálogo é alcançável por quem teve um dia ruim', () => {
    // Sorteia muitos dias ruins e confere que a coleção inteira sai.
    const vistos = new Set<string>();
    const colecao: string[] = [];
    for (let i = 0; i < 4000 && vistos.size < IDS.length; i++) {
      const a = adventureOfDay(colecao, 0, 6, `ruim-${i}`);
      if (!vistos.has(a.id)) { vistos.add(a.id); colecao.push(a.id); }
    }
    expect([...vistos].sort()).toEqual([...IDS].sort());
  });

  it('a proporção nunca passa de 1 — fazer o dobro da meta não compra sorte extra', () => {
    const meta = contarRaridades(s => adventureRarity(6, 6, s));
    const dobro = contarRaridades(s => adventureRarity(60, 6, s));
    expect(dobro).toEqual(meta);
  });
});

describe('determinismo', () => {
  it('o mesmo dia devolve sempre o mesmo achado', () => {
    const a = adventureOfDay([], 4, 6, '2026-09-08');
    for (let i = 0; i < 20; i++) {
      expect(adventureOfDay([], 4, 6, '2026-09-08').id).toBe(a.id);
    }
  });

  it('dias diferentes não são todos iguais', () => {
    // Guard contra o determinismo virar constante: uma seed ignorada passaria
    // no teste acima e daria o mesmo achado para sempre.
    const ids = new Set(Array.from({ length: 30 }, (_, i) => adventureOfDay([], 4, 6, `d${i}`).id));
    expect(ids.size).toBeGreaterThan(1);
  });

  it('não usa `Math.random` — nada muda entre execuções', () => {
    const original = Math.random;
    Math.random = () => 0.999999;
    const a = adventureOfDay([], 4, 6, '2026-09-08');
    Math.random = () => 0.000001;
    const b = adventureOfDay([], 4, 6, '2026-09-08');
    Math.random = original;
    expect(a.id).toBe(b.id);
  });
});

describe('a coleção avança', () => {
  it('prefere um achado que a pessoa ainda não tem', () => {
    const comuns = ADVENTURE_CATALOG.filter(a => a.rarity === 'common').map(a => a.id);
    const jaTem = comuns.slice(0, comuns.length - 1);
    expect(rollAdventure(jaTem, 'common', 12345)).toBe(comuns[comuns.length - 1]);
  });

  it('faixa esgotada repete em vez de devolver nada', () => {
    const comuns = ADVENTURE_CATALOG.filter(a => a.rarity === 'common').map(a => a.id);
    const id = rollAdventure(comuns, 'common', 999);
    expect(comuns).toContain(id);
  });
});

describe('o diário', () => {
  it('guarda o achado com a data', () => {
    const d = collectAdventure([], 'adv-orvalho', '2026-09-08');
    expect(d).toEqual([{ id: 'adv-orvalho', day: '2026-09-08' }]);
  });

  it('é idempotente e mantém a data da PRIMEIRA vez', () => {
    // A data é o que faz a coleção ser história em vez de lista. Sobrescrever
    // com a data de hoje apagaria "esse foi na primeira semana".
    const um = collectAdventure([], 'adv-orvalho', '2026-09-08');
    const dois = collectAdventure(um, 'adv-orvalho', '2026-12-25');
    expect(dois).toEqual([{ id: 'adv-orvalho', day: '2026-09-08' }]);
  });

  it('não muta o diário recebido', () => {
    const antes = [{ id: 'adv-orvalho', day: '2026-09-08' }];
    collectAdventure(antes, 'adv-cometa', '2026-09-09');
    expect(antes).toHaveLength(1);
  });
});

describe('id órfão não quebra a tela', () => {
  it('`findById` de um id inexistente devolve undefined', () => {
    expect(findById('adv-que-nao-existe')).toBeUndefined();
  });

  it('e `adventureOfDay` sempre devolve algo do catálogo', () => {
    const a = adventureOfDay(['adv-que-nao-existe'], 3, 6, 'x');
    expect(IDS).toContain(a.id);
  });
});
