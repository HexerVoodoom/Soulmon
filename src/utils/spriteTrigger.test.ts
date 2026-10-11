/**
 * O contrato do gatilho da geração incremental (`spec-geracao-incremental.md` §3).
 *
 * Cada bloco aqui trava uma regra que o gate nomeou como não-negociável. Se um
 * destes cair, alguém gastou dinheiro na forma errada, ou não gastou na certa.
 */
import { describe, it, expect } from 'vitest';
import { ULTRA_PATIENCE_POINTS } from '../types/progression';
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
    currentBranch: 'harmony',
    unlockedEvolutions: [],
    evolutionPoints: 0,
    points: { power: 5, harmony: 1, benevolence: 1 },
    reading: reading(false),
    library: emptySpriteLibrary(),
    ...over,
  };
}

const sprite = (lib: SpriteLibrary, formId: string) =>
  recordSprite(lib, { url: `https://x/${formId}.png`, formId, at: 1 }, { adopt: 'now' });

// ⚰️ **A VÉSPERA (ocasião B, `faltam === 1`) MORREU em 22/09/2026** — D-G8c,
// decisão do dono. Este describe testava que ela disparava um ponto antes, e o
// motivo dela era literal: *"Pra evitar espera, se o pet falta 1 dia pra
// evoluir, ele ja gera baseado nesse dia"*. A decisão nova inverteu o
// propósito — **a espera passou a ser o conteúdo** (é o tempo de incubar), e o
// lote passou para o instante da ELEGIBILIDADE. Os casos foram reescritos, não
// apagados: o que eles protegem (a conta é contra `required`, e cada nível tem
// o seu) continua valendo, só mudou o ponto de disparo.
describe('o lote é contra `required`, e dispara na ELEGIBILIDADE (`faltam <= 0`)', () => {
  // O F1 do gate: com `daysToEvolve` (10) o lote NUNCA partia, porque o
  // jogador evolui em `required` (4) e nunca chega a 9.
  it('rookie: nada a 1 ponto de distância; dispara ao ficar apto', () => {
    expect(pointsToEvolve('rookie', 29)).toBe(1);
    expect(spriteBatch(input({ evolutionPoints: 29 }))).toBeNull();
    expect(spriteBatch(input({ evolutionPoints: 30 }))?.occasion).toBe('C');
    expect(spriteBatch(input({ evolutionPoints: 40 }))?.occasion).toBe('C');
  });

  it('não dispara a dois pontos de distância', () => {
    expect(spriteBatch(input({ evolutionPoints: 2 }))).toBeNull();
  });

  it('a véspera NÃO existe mais: nenhuma entrada produz a ocasião B', () => {
    // A trava que impede a véspera de voltar por descuido. `'B'` continua no
    // tipo como lápide, mas nenhum caminho pode produzi-lo.
    for (let d = 0; d <= 12; d++) {
      expect(spriteBatch(input({ evolutionPoints: d * 3 }))?.occasion ?? 'C').not.toBe('B');
    }
  });

  it('champion/ultimate/mega usam o `required` de cada nível (5/5/6)', () => {
    expect(spriteBatch(input({ evolutionStage: 'champion-power', evolutionPoints: 44 }))).toBeNull();
    expect(spriteBatch(input({ evolutionStage: 'champion-power', evolutionPoints: 45 }))?.occasion).toBe('C');
    expect(spriteBatch(input({ evolutionStage: 'ultimate-power', evolutionPoints: 60 }))?.occasion).toBe('C');
    const megaReady = input({
      evolutionStage: 'mega-power',
      evolutionPoints: 60,
      unlockedEvolutions: ['mega-power', 'mega-harmony', 'mega-benevolence'],
    });
    expect(spriteBatch(megaReady)).toEqual({ occasion: 'C', formIds: ['ultra'] });
  });
});

describe('a forma-destino vem SÓ de `evolutionTarget()`', () => {
  it('segue o atributo líder, e não um literal', () => {
    expect(targetFormId(input({ points: { power: 9, harmony: 1, benevolence: 0 } }))).toBe('champion-power');
    expect(targetFormId(input({ points: { power: 0, harmony: 0, benevolence: 4 } }))).toBe('champion-benevolence');
  });

  it('empate sem leitura confiável cai no `currentBranch`, nunca no literal `harmony`', () => {
    const t = targetFormId(input({
      points: { power: 3, harmony: 0, benevolence: 3 },
      currentBranch: 'benevolence',
      reading: reading(false),
    }));
    expect(t).toBe('champion-benevolence');
  });

  /**
   * ⚠️ Esta era a trava da regra ANTIGA, e ela mudou em 06/09/2026 (WP4.2 /
   * decisão D6). O mega sem as três megas continua sem destino — mas só
   * enquanto o segundo caminho não abriu.
   *
   * O caminho novo é `ULTRA_PATIENCE_DAYS` dias perfeitos como mega. Antes,
   * chegar ao Ultra exigia descer e subir duas vezes, ou seja: o topo do jogo
   * pedia que o jogador machucasse a criatura de propósito. A linha
   * `evolutionPoints: 999` abaixo esperava `null` justamente porque a permanência
   * não valia nada — hoje ela vale, e a forma passa a ser gerável.
   */
  it('mega sem as 3 megas E sem permanência não tem destino (estado DISTANTE)', () => {
    const i = input({ evolutionStage: 'mega-power', evolutionPoints: 60, unlockedEvolutions: ['mega-power'] });
    expect(targetFormId(i)).toBeNull();
    expect(spriteBatch(i)).toBeNull();
    // Logo abaixo do corte também não: o caminho abre no número, não perto dele.
    expect(targetFormId({ ...i, evolutionPoints: ULTRA_PATIENCE_POINTS - 1 })).toBeNull();
  });

  it('mega com PERMANÊNCIA alcança o ultra sem nunca ter degenerado', () => {
    const i = input({
      evolutionStage: 'mega-power',
      evolutionPoints: ULTRA_PATIENCE_POINTS,
      unlockedEvolutions: ['mega-power'],
    });
    expect(targetFormId(i), 'o segundo caminho para o Ultra sumiu').toBe('ultra');
  });

  it('ultra é topo da árvore: nunca gera nada', () => {
    expect(spriteBatch(input({ evolutionStage: 'ultra', evolutionPoints: 999 }))).toBeNull();
  });
});

describe('o gatilho chaveia por `sprites[formId]` AUSENTE', () => {
  it('forma já desenhada não é regerada por gatilho automático', () => {
    const lib = sprite(emptySpriteLibrary(), 'champion-power');
    expect(spriteBatch(input({ evolutionPoints: 29, library: lib }))).toBeNull();
    expect(spriteBatch(input({ evolutionPoints: 30, library: lib }))).toBeNull();
  });

  it('re-subir para OUTRO galho gera de novo — "já passei por essa forma" seria falso', () => {
    // Caminho do `ultra`: caiu de mega-power, re-subiu apontando mega-harmony.
    let lib = sprite(emptySpriteLibrary(), 'mega-power');
    lib = sprite(lib, 'ultimate-harmony');
    const i = input({
      evolutionStage: 'ultimate-harmony',
      evolutionPoints: 60,
      points: { power: 0, harmony: 7, benevolence: 0 },
      unlockedEvolutions: ['mega-power', 'ultimate-harmony'],
      library: lib,
    });
    expect(spriteBatch(i)).toEqual({ occasion: 'C', formIds: ['mega-harmony'] });
  });
});

// O empate continua sendo coberto inteiro — o que mudou é QUANDO (D-G8c). O
// critério (`vesperForms`) migrou da ocasião B para a C sem uma linha de
// diferença: o galho só se resolve no toque da cerimônia, então gerar só o
// preferido reintroduz o risco que a geração antecipada existe para eliminar.
describe('o lote cobre TODOS os líderes empatados (§4)', () => {
  it('empate duplo gera as duas formas', () => {
    const b = spriteBatch(input({ evolutionPoints: 30, points: { power: 4, harmony: 0, benevolence: 4 } }));
    expect(b?.occasion).toBe('C');
    expect(b?.formIds.sort()).toEqual(['champion-benevolence', 'champion-power']);
  });

  it('empate triplo gera as três', () => {
    const b = spriteBatch(input({ evolutionPoints: 30, points: { power: 2, harmony: 2, benevolence: 2 } }));
    expect(b?.formIds).toHaveLength(3);
  });

  it('líder único gera UMA forma — não há dúvida a cobrir', () => {
    const b = spriteBatch(input({ evolutionPoints: 30, points: { power: 9, harmony: 1, benevolence: 0 } }));
    expect(b?.formIds).toEqual(['champion-power']);
  });

  it('sem pontos nenhum, gera só o que `resolveBranch` responde', () => {
    const b = spriteBatch(input({ evolutionPoints: 30, points: { power: 0, harmony: 0, benevolence: 0 } }));
    expect(b?.formIds).toHaveLength(1);
  });

  it('empate triplo a caminho do ultra vira UM pedido, não três iguais', () => {
    const b = spriteBatch(input({
      evolutionStage: 'mega-power',
      evolutionPoints: 60,
      points: { power: 3, harmony: 3, benevolence: 3 },
      unlockedEvolutions: ['mega-power', 'mega-harmony', 'mega-benevolence'],
    }));
    expect(b?.formIds).toEqual(['ultra']);
  });
});

describe('os dois estados terminais, que NÃO são o mesmo', () => {
  it('409 `sprite-form-cap` fecha a forma e deixa as outras abertas', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'champion-power', 'form-cap');
    // Aquela forma sai do lote…
    const tie = spriteBatch(input({ evolutionPoints: 30, points: { power: 4, harmony: 0, benevolence: 4 }, library: lib }));
    expect(tie?.formIds).toEqual(['champion-benevolence']);
    // …e um lote só dela não parte.
    expect(spriteBatch(input({ evolutionPoints: 30, points: { power: 9, harmony: 0, benevolence: 0 }, library: lib }))).toBeNull();
  });

  it('402 `sprite-lifetime-cap` para a conta inteira, em qualquer forma', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'champion-power', 'lifetime-cap');
    expect(spriteBatch(input({ evolutionPoints: 30, points: { power: 0, harmony: 0, benevolence: 9 }, library: lib }))).toBeNull();
    expect(birthBatch(input({ library: lib }))).toBeNull();
  });

  it('falha comum (não terminal) NÃO tira a forma do lote', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'champion-power', 'error');
    expect(spriteBatch(input({ evolutionPoints: 30, points: { power: 9, harmony: 0, benevolence: 0 }, library: lib }))?.formIds)
      .toEqual(['champion-power']);
  });
});

describe('degeneração NÃO gera', () => {
  // A queda em si nunca dispara lote — gastar no pior momento do jogador é a
  // definição de má hora. Se ela deixa o jogador apto a evoluir, quem atende é
  // a ocasião C, quando e se ele abrir a cerimônia.
  it('a queda que deixa `perfectDays >= required` produz o lote da incubação, não um lote antecipado', () => {
    // mega com 10 dias cai para ultimate com max(2, 5) = 5; `required` = 5.
    const caiu = input({ evolutionStage: 'ultimate-harmony', evolutionPoints: 60, points: { power: 0, harmony: 6, benevolence: 0 } });
    const b = spriteBatch(caiu);
    expect(b?.occasion).toBe('C');   // a incubação, não uma véspera
    expect(b?.formIds).toEqual(['mega-harmony']);
  });
});

describe('o lote de nascimento (ocasião A)', () => {
  // ⚠️ Este caso afirmava `['rookie', 'champion-power']` até 22/09/2026. O
  // D-G5b encolheu o nascimento a UMA forma — *"Só nasce o rookie e o restante
  // é sob demanda, na incubação"* (dono). O champion não caiu por descuido.
  it('é SÓ o rookie — o champion previsto nasce na incubação', () => {
    expect(birthBatch(input())?.formIds).toEqual(['rookie']);
  });

  it('não repete o que já existe — com o rookie desenhado, o nascimento não pede nada', () => {
    // Antes sobrava o champion no lote; com o D-G5b o nascimento é uma forma
    // só, então rookie pronto = lote vazio = `null`.
    const lib = sprite(emptySpriteLibrary(), 'rookie');
    expect(birthBatch(input({ library: lib }))).toBeNull();
  });
});
