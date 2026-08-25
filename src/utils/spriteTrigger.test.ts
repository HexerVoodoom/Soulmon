/**
 * O contrato do gatilho da geração incremental (`spec-geracao-incremental.md` §3).
 *
 * Cada bloco aqui trava uma regra que o gate nomeou como não-negociável. Se um
 * destes cair, alguém gastou dinheiro na forma errada, ou não gastou na certa.
 */
import { describe, it, expect } from 'vitest';
import { spriteBatch, birthBatch, pointsToEvolve, targetFormId, type SpriteTriggerInput } from './spriteTrigger';
import { emptySpriteLibrary, recordSprite, recordFailure, type SpriteLibrary } from './spriteLibrary';
import { CARE_PATTERNS, type CareReading } from './carePattern';

const reading = (confident: boolean, id: 'constante' | 'explosivo' | 'equilibrado' = 'equilibrado'): CareReading => ({
  pattern: CARE_PATTERNS[id],
  activeDays: confident ? 10 : 0,
  total: confident ? 30 : 0,
  concentration: 0.2,
  confident,
});

function input(over: Partial<SpriteTriggerInput> = {}): SpriteTriggerInput {
  return {
    evolutionStage: 'rookie',
    currentBranch: 'data',
    unlockedEvolutions: [],
    perfectDays: 0,
    points: { virus: 5, data: 1, vaccine: 1 },
    reading: reading(false),
    library: emptySpriteLibrary(),
    ...over,
  };
}

const sprite = (lib: SpriteLibrary, formId: string) =>
  recordSprite(lib, { url: `https://x/${formId}.png`, formId, at: 1 }, { adopt: 'now' });

describe('a véspera é contra `required`, e é `faltam === 1`', () => {
  // O F1 do gate: com `daysToEvolve` (10) o lote de véspera NUNCA partia, porque
  // o jogador evolui em `required` (4) e nunca chega a 9.
  it('rookie: dispara em perfectDays === 3, não em 9', () => {
    expect(pointsToEvolve('rookie', 3)).toBe(1);
    expect(spriteBatch(input({ perfectDays: 3 }))?.occasion).toBe('B');
    expect(spriteBatch(input({ perfectDays: 9 }))?.occasion).toBe('C');
  });

  it('não dispara véspera a dois pontos de distância', () => {
    expect(spriteBatch(input({ perfectDays: 2 }))).toBeNull();
  });

  it('`faltam <= 0` é ocasião C, nunca B — duas ocasiões não disputam o mesmo estado', () => {
    expect(spriteBatch(input({ perfectDays: 4 }))?.occasion).toBe('C');
    expect(spriteBatch(input({ perfectDays: 7 }))?.occasion).toBe('C');
  });

  it('champion/ultimate/mega usam o `required` de cada nível (5/5/6)', () => {
    expect(spriteBatch(input({ evolutionStage: 'champion-virus', perfectDays: 4 }))?.occasion).toBe('B');
    expect(spriteBatch(input({ evolutionStage: 'ultimate-virus', perfectDays: 4 }))?.occasion).toBe('B');
    const megaReady = input({
      evolutionStage: 'mega-virus',
      perfectDays: 5,
      unlockedEvolutions: ['mega-virus', 'mega-data', 'mega-vaccine'],
    });
    expect(spriteBatch(megaReady)).toEqual({ occasion: 'B', formIds: ['ultra'] });
  });
});

describe('a forma-destino vem SÓ de `evolutionTarget()`', () => {
  it('segue o atributo líder, e não um literal', () => {
    expect(targetFormId(input({ points: { virus: 9, data: 1, vaccine: 0 } }))).toBe('champion-virus');
    expect(targetFormId(input({ points: { virus: 0, data: 0, vaccine: 4 } }))).toBe('champion-vaccine');
  });

  it('empate sem leitura confiável cai no `currentBranch`, nunca no literal `data`', () => {
    const t = targetFormId(input({
      points: { virus: 3, data: 0, vaccine: 3 },
      currentBranch: 'vaccine',
      reading: reading(false),
    }));
    expect(t).toBe('champion-vaccine');
  });

  it('mega SEM as 3 megas não tem destino — nada gera (é o estado DISTANTE)', () => {
    const i = input({ evolutionStage: 'mega-virus', perfectDays: 5, unlockedEvolutions: ['mega-virus'] });
    expect(targetFormId(i)).toBeNull();
    expect(spriteBatch(i)).toBeNull();
    expect(spriteBatch({ ...i, perfectDays: 99 })).toBeNull();
  });

  it('ultra é topo da árvore: nunca gera nada', () => {
    expect(spriteBatch(input({ evolutionStage: 'ultra', perfectDays: 99 }))).toBeNull();
  });
});

describe('o gatilho chaveia por `sprites[formId]` AUSENTE', () => {
  it('forma já desenhada não é regerada por gatilho automático', () => {
    const lib = sprite(emptySpriteLibrary(), 'champion-virus');
    expect(spriteBatch(input({ perfectDays: 3, library: lib }))).toBeNull();
    expect(spriteBatch(input({ perfectDays: 4, library: lib }))).toBeNull();
  });

  it('re-subir para OUTRO galho gera de novo — "já passei por essa forma" seria falso', () => {
    // Caminho do `ultra`: caiu de mega-virus, re-subiu apontando mega-data.
    let lib = sprite(emptySpriteLibrary(), 'mega-virus');
    lib = sprite(lib, 'ultimate-data');
    const i = input({
      evolutionStage: 'ultimate-data',
      perfectDays: 5,
      points: { virus: 0, data: 7, vaccine: 0 },
      unlockedEvolutions: ['mega-virus', 'ultimate-data'],
      library: lib,
    });
    expect(spriteBatch(i)).toEqual({ occasion: 'C', formIds: ['mega-data'] });
  });
});

describe('o lote de véspera cobre TODOS os líderes empatados (§4)', () => {
  it('empate duplo gera as duas formas', () => {
    const b = spriteBatch(input({ perfectDays: 3, points: { virus: 4, data: 0, vaccine: 4 } }));
    expect(b?.occasion).toBe('B');
    expect(b?.formIds.sort()).toEqual(['champion-vaccine', 'champion-virus']);
  });

  it('empate triplo gera as três', () => {
    const b = spriteBatch(input({ perfectDays: 3, points: { virus: 2, data: 2, vaccine: 2 } }));
    expect(b?.formIds).toHaveLength(3);
  });

  it('líder único gera UMA forma — não há dúvida a cobrir', () => {
    const b = spriteBatch(input({ perfectDays: 3, points: { virus: 9, data: 1, vaccine: 0 } }));
    expect(b?.formIds).toEqual(['champion-virus']);
  });

  it('sem pontos nenhum, gera só o que `resolveBranch` responde', () => {
    const b = spriteBatch(input({ perfectDays: 3, points: { virus: 0, data: 0, vaccine: 0 } }));
    expect(b?.formIds).toHaveLength(1);
  });

  it('empate triplo na véspera do ultra vira UM pedido, não três iguais', () => {
    const b = spriteBatch(input({
      evolutionStage: 'mega-virus',
      perfectDays: 5,
      points: { virus: 3, data: 3, vaccine: 3 },
      unlockedEvolutions: ['mega-virus', 'mega-data', 'mega-vaccine'],
    }));
    expect(b?.formIds).toEqual(['ultra']);
  });
});

describe('os dois estados terminais, que NÃO são o mesmo', () => {
  it('409 `sprite-form-cap` fecha a forma e deixa as outras abertas', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'champion-virus', 'form-cap');
    // Aquela forma sai do lote…
    const tie = spriteBatch(input({ perfectDays: 3, points: { virus: 4, data: 0, vaccine: 4 }, library: lib }));
    expect(tie?.formIds).toEqual(['champion-vaccine']);
    // …e um lote só dela não parte.
    expect(spriteBatch(input({ perfectDays: 3, points: { virus: 9, data: 0, vaccine: 0 }, library: lib }))).toBeNull();
  });

  it('402 `sprite-lifetime-cap` para a conta inteira, em qualquer forma', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'champion-virus', 'lifetime-cap');
    expect(spriteBatch(input({ perfectDays: 3, points: { virus: 0, data: 0, vaccine: 9 }, library: lib }))).toBeNull();
    expect(birthBatch(input({ library: lib }))).toBeNull();
  });

  it('falha comum (não terminal) NÃO tira a forma do lote', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'champion-virus', 'error');
    expect(spriteBatch(input({ perfectDays: 3, points: { virus: 9, data: 0, vaccine: 0 }, library: lib }))?.formIds)
      .toEqual(['champion-virus']);
  });
});

describe('degeneração NÃO gera', () => {
  // A queda em si nunca dispara lote — gastar no pior momento do jogador é a
  // definição de má hora. Se ela deixa o jogador apto a evoluir, quem atende é
  // a ocasião C, quando e se ele abrir a cerimônia.
  it('a queda que deixa `perfectDays >= required` não produz lote novo de véspera', () => {
    // mega com 10 dias cai para ultimate com max(2, 5) = 5; `required` = 5.
    const caiu = input({ evolutionStage: 'ultimate-data', perfectDays: 5, points: { virus: 0, data: 6, vaccine: 0 } });
    const b = spriteBatch(caiu);
    expect(b?.occasion).toBe('C');   // resgate, não véspera
    expect(b?.formIds).toEqual(['mega-data']);
  });
});

describe('o lote de nascimento (ocasião A)', () => {
  it('é rookie + o galho previsto de champion', () => {
    expect(birthBatch(input())?.formIds).toEqual(['rookie', 'champion-virus']);
  });

  it('não repete o que já existe', () => {
    const lib = sprite(emptySpriteLibrary(), 'rookie');
    expect(birthBatch(input({ library: lib }))?.formIds).toEqual(['champion-virus']);
  });
});
