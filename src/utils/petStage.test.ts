import { describe, it, expect } from 'vitest';
import {
  GROUND_Y, DECOR_SLOTS, SLOT_ORDER, decorFitsSetting, slotBoxStyle, applyDecorEquip, type SlotId,
} from './petStage';
import { PET_BACKGROUNDS } from './backgrounds';
import { ALL_SHOP_ITEMS, isGuildReward } from './shop';

// A composição do palco só funciona enquanto TODAS as peças concordam sobre a
// mesma geometria. Estes testes travam esse acordo: se um cair, a decoração
// flutua, some, ou aparece onde não faz sentido — e nada disso dá erro em
// tempo de execução, o jogador só vê feio.

describe('geometria do palco', () => {
  it('a linha do chão é a mesma dos pés do pet', () => {
    // O sprite tem 80px e é centrado em 50% de um palco de 250px com
    // marginTop -20px → base em (125 - 20 + 80) / 250 = 74%. Mudar o sprite ou
    // o palco sem mudar GROUND_Y faz TODA a decoração flutuar.
    const spriteBase = (250 * 0.5 - 20 + 80) / 250 * 100;
    expect(GROUND_Y).toBeCloseTo(spriteBase, 5);
  });

  it('todo slot declarado está na ordem de desenho, e vice-versa', () => {
    expect([...SLOT_ORDER].sort()).toEqual(Object.keys(DECOR_SLOTS).sort());
  });

  it('slot pendurado declara a própria altura; os de chão não precisam', () => {
    for (const slot of Object.values(DECOR_SLOTS)) {
      if (slot.anchor === 'hang') expect(slot.y, `${slot.id} sem y`).toBeGreaterThan(0);
    }
  });

  it('nenhum slot de chão fica no centro exato — é onde o pet mais anda', () => {
    const chao = Object.values(DECOR_SLOTS).filter(s => s.anchor === 'ground');
    for (const s of chao) expect(Math.abs(s.x - 50), `${s.id} no centro`).toBeGreaterThan(2);
  });

  it('os slots de chão não se sobrepõem', () => {
    // Duas peças na mesma faixa horizontal viram uma pilha, não composição.
    // 300px é a largura útil do palco num aparelho de 412px.
    const STAGE_W = 300;
    const chao = Object.values(DECOR_SLOTS)
      .filter(s => s.anchor === 'ground')
      .map(s => ({ id: s.id, l: (s.x / 100) * STAGE_W - s.w / 2, r: (s.x / 100) * STAGE_W + s.w / 2 }))
      .sort((a, b) => a.l - b.l);
    for (let i = 1; i < chao.length; i++) {
      expect(chao[i].l, `${chao[i - 1].id} × ${chao[i].id}`).toBeGreaterThanOrEqual(chao[i - 1].r);
    }
  });

  it('a peça apoiada no chão sobe a própria altura; a pendurada não', () => {
    expect(slotBoxStyle(DECOR_SLOTS['floor-left']).marginTop).toBe(-DECOR_SLOTS['floor-left'].h);
    expect(slotBoxStyle(DECOR_SLOTS.wall).marginTop).toBe(0);
    expect(slotBoxStyle(DECOR_SLOTS.wall).top).toBe(`${DECOR_SLOTS.wall.y}%`);
    expect(slotBoxStyle(DECOR_SLOTS['floor-left']).top).toBe(`${GROUND_Y}%`);
  });
});

describe('cenários', () => {
  it('todo cenário declara onde se passa e que espaços oferece', () => {
    for (const [id, bg] of Object.entries(PET_BACKGROUNDS)) {
      expect(['indoor', 'outdoor', 'void'], id).toContain(bg.setting);
      expect(Array.isArray(bg.slots), id).toBe(true);
    }
  });

  it('cenário abstrato não oferece espaço nenhum', () => {
    // 'void' é a saída honesta para cenas sem chão legível (matriz, LCD, fundo
    // do mar): melhor não aceitar decoração do que aceitar e desenhar torto.
    for (const [id, bg] of Object.entries(PET_BACKGROUNDS)) {
      if (bg.setting === 'void') expect(bg.slots, id).toHaveLength(0);
      else expect(bg.slots.length, id).toBeGreaterThan(0);
    }
  });

  it('todo espaço oferecido existe de verdade', () => {
    for (const [id, bg] of Object.entries(PET_BACKGROUNDS)) {
      for (const slot of bg.slots) expect(DECOR_SLOTS[slot], `${id} → ${slot}`).toBeDefined();
    }
  });

  it('todo cenário com chão declara o horizonte', () => {
    for (const [id, bg] of Object.entries(PET_BACKGROUNDS)) {
      if (bg.setting === 'void') expect(bg.horizonY, id).toBeUndefined();
      else expect(bg.horizonY, `${id} sem horizonte`).toBeGreaterThan(0);
    }
  });

  it('o horizonte fica ACIMA da linha do chão em todo cenário', () => {
    // É a regra que sustenta a composição inteira: se o chão só começar
    // depois de GROUND_Y, o pet e a decoração ficam apoiados no céu.
    for (const [id, bg] of Object.entries(PET_BACKGROUNDS)) {
      if (bg.horizonY === undefined) continue;
      expect(bg.horizonY, `${id}: horizonte abaixo do chão`).toBeLessThanOrEqual(GROUND_Y);
    }
  });

  it('o horizonte declarado existe mesmo no CSS do cenário', () => {
    // Guarda contra deriva entre o número e o desenho. Olha SÓ as camadas
    // verticais (linear-gradient(180deg …)): a primeira versão deste teste
    // procurava '74%' no CSS inteiro e passava por causa da coordenada X de
    // uma estrela — verde falso, não verificava nada.
    for (const [id, bg] of Object.entries(PET_BACKGROUNDS)) {
      if (bg.horizonY === undefined) continue;
      // Cenário PINTADO (`url(...)`) não tem camada de CSS onde o número
      // pudesse aparecer: quem garante o horizonte dele é a arte ter sido
      // encomendada com o chão na linha do palco (ver utils/backgrounds.ts).
      // Exigir gradiente aqui obrigaria a inventar uma camada falsa só para
      // satisfazer o teste — que é o oposto de guardar contra deriva.
      if (bg.css.trimStart().startsWith('url(')) continue;
      const camadas = bg.css
        .split(/(?<=,\s?)(?=[a-z-]*gradient\()/)
        .filter(l => /^(repeating-)?linear-gradient\(180deg/.test(l.trim()));
      expect(camadas.length, `${id} sem camada vertical`).toBeGreaterThan(0);
      expect(
        camadas.some(l => l.includes(`${bg.horizonY}%`)),
        `${id}: horizonte ${bg.horizonY}% não aparece em nenhuma camada vertical`,
      ).toBe(true);
    }
  });
});

describe('itens de decoração', () => {
  const decor = ALL_SHOP_ITEMS.filter(i => i.kind === 'furniture');

  it('toda decoração declara espaço e compatibilidade', () => {
    for (const item of decor) {
      expect(item.slot, `${item.id} sem slot`).toBeDefined();
      expect(DECOR_SLOTS[item.slot as SlotId], `${item.id} → slot inexistente`).toBeDefined();
      expect(['indoor', 'outdoor', 'any'], item.id).toContain(item.fits ?? 'any');
    }
  });

  it('todo espaço tem pelo menos uma decoração que o ocupa', () => {
    // Espaço sem item é buraco no catálogo: o cenário reserva a área e nada
    // nunca aparece nela.
    for (const slot of SLOT_ORDER) {
      expect(decor.some(i => i.slot === slot), `nada ocupa '${slot}'`).toBe(true);
    }
  });

  it('cenário de exterior tem o que colocar em cada espaço de chão', () => {
    // A maioria dos cenários é externa; um catálogo só de móvel de sala deixa
    // esses jogadores sem decoração nenhuma.
    for (const slot of ['floor-left', 'floor-right'] as SlotId[]) {
      const cabe = decor.some(i => i.slot === slot && decorFitsSetting(i.fits ?? 'any', 'outdoor'));
      expect(cabe, `nada de exterior ocupa '${slot}'`).toBe(true);
    }
  });

  it('a vitrine de troféus é comprada com Emblemas', () => {
    // O espaço da vitrine existe por causa do Torneio; abri-lo pra Bits
    // esvaziaria o sentido de ganhar troféu.
    // A única exceção é a CONQUISTA da Guilda (`GUILD_ITEMS`, Concha da Maré): não se compra com
    // moeda nenhuma — só o resgate da Feira a concede (`shopBuy` a recusa: 'not-for-sale').
    const vitrines = decor.filter(i => i.slot === 'trophy' && !isGuildReward(i));
    expect(vitrines.length).toBeGreaterThan(0);
    for (const v of vitrines) expect(v.currency, v.id).toBe('emblems');
    for (const g of decor.filter(i => i.slot === 'trophy' && isGuildReward(i))) expect(g.price, g.id).toBe(0);
  });
});

describe('compatibilidade decoração × cenário', () => {
  it('cenário abstrato não recebe nada, nem o que serve pra tudo', () => {
    expect(decorFitsSetting('any', 'void')).toBe(false);
    expect(decorFitsSetting('indoor', 'void')).toBe(false);
    expect(decorFitsSetting('outdoor', 'void')).toBe(false);
  });

  it('móvel de interior não vai parar num cenário aberto', () => {
    expect(decorFitsSetting('indoor', 'outdoor')).toBe(false);
    expect(decorFitsSetting('outdoor', 'indoor')).toBe(false);
  });

  it("'any' serve nos dois cenários reais", () => {
    expect(decorFitsSetting('any', 'indoor')).toBe(true);
    expect(decorFitsSetting('any', 'outdoor')).toBe(true);
  });
});

describe('equipar e desequipar', () => {
  it('equipar ocupa o espaço', () => {
    expect(applyDecorEquip({}, 'furn-sofa', 'floor-left')).toEqual({ 'floor-left': 'furn-sofa' });
  });

  it('DESEQUIPAR limpa o espaço', () => {
    // Regressão: a primeira versão deduzia o slot a partir do id do item e,
    // ao desequipar (id null), não achava nada e devolvia o estado intocado —
    // o botão "Equipado" simplesmente não fazia nada.
    const antes = { 'floor-left': 'furn-sofa', trophy: 'furniture-podium' } as Partial<Record<SlotId, string>>;
    expect(applyDecorEquip(antes, null, 'floor-left')).toEqual({ trophy: 'furniture-podium' });
  });

  it('desequipar um espaço não mexe nos outros', () => {
    const antes = { rug: 'furn-rug', wall: 'furn-picture' } as Partial<Record<SlotId, string>>;
    expect(applyDecorEquip(antes, null, 'rug')).toEqual({ wall: 'furn-picture' });
  });

  it('equipar no mesmo espaço SUBSTITUI — um espaço, um item', () => {
    const antes = { 'floor-left': 'furn-sofa' } as Partial<Record<SlotId, string>>;
    expect(applyDecorEquip(antes, 'furn-campfire', 'floor-left')).toEqual({ 'floor-left': 'furn-campfire' });
  });

  it('não muda o objeto original', () => {
    const antes = { 'floor-left': 'furn-sofa' } as Partial<Record<SlotId, string>>;
    applyDecorEquip(antes, null, 'floor-left');
    expect(antes).toEqual({ 'floor-left': 'furn-sofa' });
  });

  it('desequipar um espaço já vazio não quebra', () => {
    expect(applyDecorEquip({}, null, 'wall')).toEqual({});
  });
});
