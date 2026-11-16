// Companheiro invocado, PR 1 (fundação): regra do gatilho, cache por estágio e tabela provisória de simulados/NPCs.
import { describe, expect, it } from 'vitest';
import {
  ARQUETIPOS_EVOCACAO, COMPANHEIRO_INVOCADO, CRIATURAS_COMPANHEIRO, companheiroAtivo, companheiroDoEstado, companheiroDoEstagio, criaturaConhecida,
  eEvocador, migrarEvocacao, sanitizeEvocacao, type EvocacaoPorEstagio,
} from './companheiroInvocado';
import {
  CHEFES_NOMEADOS_INVOCAM, COMPANHEIROS_POR_COMBATENTE, PAPEL_POR_ELEMENTO, companheiroDoNpc, companheiroDoSimulado, criaturaPorId,
  eEvocadorPorLinha, eNpcInvocador, escolaDoSimulado,
} from './companheiroInvocadoLinhas';
import { SIMULADOS } from '../../functions/api/_simulados.data.js';
import { TOURNAMENT_NPCS } from './tournamentNpcs';
import { CLASS_DATA } from './soulProfile/ficha/buildSheet';
import { CLASS_TITLE_EN, arquetipoIdDoTitulo } from './soulProfile/ficha/classTitle';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import { FICHA_STAGE_ORDER } from './soulProfile/ficha/types';

describe('listas fixas batem com o class-system', () => {
  it('as 32 criaturas são exatamente as do snapshot (sem repetida)', () => {
    expect([...CRIATURAS_COMPANHEIRO].sort()).toEqual(Object.keys(CLASS_DATA.criaturas).sort());
    expect(new Set(CRIATURAS_COMPANHEIRO).size).toBe(32);
  });

  it('os 9 arquétipos de evocação existem no class-system', () => {
    expect(ARQUETIPOS_EVOCACAO).toHaveLength(9);
    for (const id of ARQUETIPOS_EVOCACAO) expect(Object.keys(CLASS_TITLE_EN)).toContain(id);
  });
});

describe('eEvocador / companheiroDoEstagio', () => {
  it('arquétipo da lista vale, qualquer que seja a escola', () => {
    for (const id of ARQUETIPOS_EVOCACAO) expect(eEvocador('rookie', { arquetipoId: id, escolaDominante: 'benca' })).toBe(true);
  });
  it('escola dominante Evocação vale mesmo sem arquétipo', () => {
    expect(eEvocador('mega', { escolaDominante: 'evocacao' })).toBe(true);
    expect(eEvocador('mega', { arquetipoId: 'mago_vermelho', escolaDominante: 'evocacao' })).toBe(true);
  });
  it('nem um nem outro, estágio inválido ou dado ausente = não', () => {
    expect(eEvocador('mega', { arquetipoId: 'mago_vermelho', escolaDominante: 'conjuracao' })).toBe(false);
    expect(eEvocador('mega', { escolaDominante: null })).toBe(false);
    expect(eEvocador('egg', { escolaDominante: 'evocacao' })).toBe(false);
    expect(eEvocador('mega', null)).toBe(false);
    expect(eEvocador('mega', undefined)).toBe(false);
  });
  it('"perde e volta": a criatura só some na forma não evocadora e reaparece quando a forma volta', () => {
    const criaturaId = 'lobo';
    const formas = [
      { estagio: 'rookie', arquetipoId: 'necromante' },
      { estagio: 'champion', arquetipoId: 'mago_vermelho', escolaDominante: 'conjuracao' },
      { estagio: 'ultimate', arquetipoId: 'invocador' },
    ];
    expect(formas.map(f => companheiroDoEstagio({ ...f, criaturaId }))).toEqual(['lobo', null, 'lobo']);
  });
  it('criatura fora das 32 ou lixo = null', () => {
    expect(companheiroDoEstagio({ estagio: 'rookie', criaturaId: 'dragao_azul', arquetipoId: 'bokor' })).toBeNull();
    expect(companheiroDoEstagio({ estagio: 'rookie', criaturaId: 7, arquetipoId: 'bokor' })).toBeNull();
    expect(criaturaConhecida('__proto__')).toBe(false);
  });
});

describe('arquetipoIdDoTitulo (cache antigo sem id)', () => {
  it('lê o id quando existe', () => {
    expect(arquetipoIdDoTitulo({ nome: { pt: 'x', en: 'y' }, origem: 'arquetipo', id: 'bokor' })).toBe('bokor');
  });
  it('sem id, recupera pelo nome EN de TODOS os arquétipos, plenos e diluídos', () => {
    for (const [id, en] of Object.entries(CLASS_TITLE_EN)) {
      expect(arquetipoIdDoTitulo({ nome: { pt: '', en }, origem: 'arquetipo' })).toBe(id);
      expect(arquetipoIdDoTitulo({ nome: { pt: '', en: `${en} Aspirant` }, origem: 'diluido' })).toBe(id);
    }
  });
  it('genérico, lixo e desconhecido = undefined', () => {
    expect(arquetipoIdDoTitulo({ nome: { pt: '', en: 'Fire Adept' }, origem: 'generico' })).toBeUndefined();
    expect(arquetipoIdDoTitulo({ nome: { pt: '', en: 'Fire Adept' }, origem: 'arquetipo' })).toBeUndefined();
    for (const lixo of [null, undefined, 3, 'x', [], { nome: 1 }]) expect(arquetipoIdDoTitulo(lixo)).toBeUndefined();
  });
});

describe('cache soulmonEvocacao', () => {
  it('sanitiza lixo sem lançar e descarta estágio inválido', () => {
    for (const lixo of [null, undefined, 1, 'a', [], [1], true, JSON.parse('{"__proto__":{"evocador":true}}')]) {
      expect(sanitizeEvocacao(lixo)).toBeUndefined();
    }
    expect(sanitizeEvocacao({ rookie: { evocador: 'sim' }, mega: null, egg: { evocador: true } })).toBeUndefined();
    expect(sanitizeEvocacao({ rookie: { evocador: true, arquetipoId: 'bokor' }, mega: { evocador: false, arquetipoId: 9 }, egg: { evocador: true } }))
      .toEqual({ rookie: { evocador: true, arquetipoId: 'bokor' }, mega: { evocador: false } });
    expect(sanitizeEvocacao({ rookie: { evocador: true, arquetipoId: 'x'.repeat(65) } })).toEqual({ rookie: { evocador: true } });
  });

  it('sanitizar duas vezes é igual a uma (idempotente)', () => {
    const v = { rookie: { evocador: true, arquetipoId: 'invocador' }, ultra: { evocador: false } };
    expect(sanitizeEvocacao(sanitizeEvocacao(v))).toEqual(sanitizeEvocacao(v));
  });

  it('migrar: primeiro valor vence, completa o que falta, idempotente e mesma referência quando nada muda', () => {
    const atual: EvocacaoPorEstagio = { rookie: { evocador: true, arquetipoId: 'bokor' } };
    const derivado: EvocacaoPorEstagio = { rookie: { evocador: false }, champion: { evocador: true } };
    const m1 = migrarEvocacao(atual, derivado);
    expect(m1).toEqual({ rookie: { evocador: true, arquetipoId: 'bokor' }, champion: { evocador: true } });
    expect(migrarEvocacao(m1, derivado)).toBe(m1);
    expect(migrarEvocacao(atual, undefined)).toBe(atual);
    expect(migrarEvocacao(undefined, undefined)).toBeUndefined();
    expect(migrarEvocacao(undefined, derivado)).toEqual(derivado);
    expect(atual).toEqual({ rookie: { evocador: true, arquetipoId: 'bokor' } }); // não muta a entrada
  });
});

describe('flag desligada', () => {
  it('a flag nasce desligada e as consultas devolvem null', () => {
    expect(COMPANHEIRO_INVOCADO).toBe(false);
    const cache: EvocacaoPorEstagio = Object.fromEntries(FICHA_STAGE_ORDER.map(s => [s, { evocador: true }]));
    for (const s of FICHA_STAGE_ORDER) expect(companheiroAtivo(s, 'lobo', cache)).toBeNull();
    expect(eEvocadorPorLinha('terra', 'benevolencia')).toBe(false);
    expect(companheiroDoSimulado('sim_0001', 'terra', 'benevolencia')).toBeNull();
    expect(eNpcInvocador('npc-espina')).toBe(false);
    expect(companheiroDoNpc('npc-espina', 'vida')).toBeNull();
  });
});

describe('arquetipoIdDoTitulo: PT/EN, acento e aspirante', () => {
  it('casa pelo nome PT dos 9 evocadores, com acento ou sem, e com "Aspirante a"', () => {
    expect(arquetipoIdDoTitulo({ nome: { pt: 'Xamã Totêmico', en: '' }, origem: 'arquetipo' })).toBe('xama_totemico');
    expect(arquetipoIdDoTitulo({ nome: { pt: 'xama totemico', en: '' }, origem: 'arquetipo' })).toBe('xama_totemico');
    expect(arquetipoIdDoTitulo({ nome: { pt: 'Aspirante a Bokor', en: 'Bokor Aspirant' }, origem: 'diluido' })).toBe('bokor');
    expect(arquetipoIdDoTitulo({ nome: { pt: 'Aspirante a Verdejante', en: '' }, origem: 'diluido' })).toBe('verdejante');
    expect(eEvocador('mega', { arquetipoId: arquetipoIdDoTitulo({ nome: { pt: 'Aspirante a Bokor', en: '' }, origem: 'diluido' }) })).toBe(true);
  });
});

describe('simulados: escola derivada de elemento + linha (opção B)', () => {
  it('tabela papel→escola é a do Oráculo e Evocação só nas 3 células certas', () => {
    expect(escolaDoSimulado('terra', 'poder')).toBe('maldicao');
    expect(escolaDoSimulado('terra', 'harmonia')).toBe('evocacao');
    expect(escolaDoSimulado('vida', 'benevolencia')).toBe('evocacao');
    expect(escolaDoSimulado('morte', 'benevolencia')).toBe('evocacao'); // mágico (padrão) + benevolência
    expect(escolaDoSimulado('morte', 'harmonia')).toBe('conjuracao');
    expect(escolaDoSimulado('fogo', 'benevolencia')).toBe('combate_fisico');
    expect(escolaDoSimulado('terra', 'x')).toBeNull();
    expect(escolaDoSimulado(null, null)).toBeNull();
  });
  it('papéis só de elementos base e papel válido', () => {
    for (const el of Object.keys(PAPEL_POR_ELEMENTO)) expect(CLASS_ELEMENT_ORDER as string[]).toContain(el);
  });
  it('mede os 170 simulados: ~45 evocadores e criatura determinística entre as 32', () => {
    const evoc = SIMULADOS.filter(s => escolaDoSimulado(s.element, s.line) === 'evocacao');
    expect(SIMULADOS).toHaveLength(170);
    console.info(`[medição simulados] evocadores por escola derivada: ${evoc.length}/170`);
    expect(evoc.length).toBeGreaterThan(20);
    expect(evoc.length).toBeLessThan(80);
    for (const s of evoc) {
      const c = criaturaPorId(s.id, s.element);
      expect(criaturaConhecida(c)).toBe(true);
      expect(criaturaPorId(s.id, s.element)).toBe(c);
    }
  });
});

describe('NPCs: só chefes nomeados, por lista explícita', () => {
  it('a lista só tem ids que existem como NPC nomeado e Arena em grupo é 1 por combatente', () => {
    const ids = TOURNAMENT_NPCS.map(n => n.id);
    for (const id of CHEFES_NOMEADOS_INVOCAM) expect(ids).toContain(id);
    expect(COMPANHEIROS_POR_COMBATENTE).toBe(1);
  });
});

describe('companheiroDoEstado (PR 2): a unica porta das telas de luta', () => {
  it('com a flag desligada devolve null mesmo para um save evocador', async () => {
    const { companheiroDoEstado } = await import('./companheiroInvocado');
    const save = { evolutionStage: 'champion', soulmonCompanheiro: { id: 'lobo' }, soulmonEvocacao: { champion: { evocador: true } } };
    expect(companheiroDoEstado(save)).toBeNull();
    expect(companheiroDoEstado(null)).toBeNull();
    expect(companheiroDoEstado({})).toBeNull();
  });
});

describe('Coroa da Hexsmith equipada: o companheiro descansa (H4, decisão do dono 16/11/2026)', () => {
  const cache = { rookie: { evocador: true } } as const;
  const estado = (hexsmith?: unknown) => ({ evolutionStage: 'rookie', soulmonCompanheiro: { id: 'lobo' }, soulmonEvocacao: cache, hexsmith });
  const comCoroa = { owned: ['coroa:direct'], equipped: { coroa: 'coroa:direct' } };
  const comCoroaEfeito = { owned: ['coroa:hot'], equipped: { coroa: 'coroa:hot' } };
  const semEquipar = { owned: ['coroa:direct'], equipped: {} };

  it('evocador sem Coroa invoca; com Coroa equipada = null; desequipar volta', () => {
    expect(companheiroDoEstado(estado(), true)).toBe('lobo');
    expect(companheiroDoEstado(estado(semEquipar), true)).toBe('lobo');
    expect(companheiroDoEstado(estado(comCoroa), true)).toBeNull();
    expect(companheiroDoEstado(estado(comCoroaEfeito), true)).toBeNull();
    expect(companheiroDoEstado(estado({ ...comCoroa, equipped: {} }), true)).toBe('lobo');
  });
  it('Coroa equipada que não está na posse é lixo saneado: não tira o companheiro', () => {
    expect(companheiroDoEstado(estado({ owned: [], equipped: { coroa: 'coroa:direct' } }), true)).toBe('lobo');
  });
  it('não evocador não muda: continua sem companheiro, com ou sem Coroa', () => {
    const naoEvoc = { evolutionStage: 'rookie', soulmonCompanheiro: { id: 'lobo' }, soulmonEvocacao: { rookie: { evocador: false } } } as const;
    expect(companheiroDoEstado({ ...naoEvoc }, true)).toBeNull();
    expect(companheiroDoEstado({ ...naoEvoc, hexsmith: comCoroa }, true)).toBeNull();
  });
  it('flag desligada: sempre null (a Coroa nada muda)', () => {
    expect(companheiroDoEstado(estado(), false)).toBeNull();
    expect(companheiroDoEstado(estado(comCoroa), false)).toBeNull();
  });
});
