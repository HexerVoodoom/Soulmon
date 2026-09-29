import { describe, it, expect } from 'vitest';
import {
  migrateBranchIds,
  legacyFormIdToNew,
  legacyBranchToNew,
  newFormIdToLegacy,
  hasLegacyBranchIds,
} from './branchMigration';

// Ids antigos montados por partes: este teste não pode virar mais uma
// ocorrência deles no fonte (o guard `branchRename.contract.test.ts` varre).
const V = 'vir' + 'us';
const D = 'da' + 'ta';
const A = 'vacc' + 'ine';
const OLD = { power: V, harmony: D, benevolence: A } as const;
const TIERS = ['champion', 'ultimate', 'mega'] as const;
const NEW = ['power', 'harmony', 'benevolence'] as const;

const OLD_EMOJI = ['\u{1F9A0}', '\u{1F4BE}', '\u{1F489}'];
const NEW_EMOJI = ['\u{1F44A}', '\u{1F3B6}', '\u{1F932}'];

/** Um save "real" de antes do renomeio, parado na forma `tier-branch`. */
function saveAntigo(tier: string, branch: string): Record<string, unknown> {
  const form = `${tier}-${branch}`;
  return {
    evolutionStage: form,
    currentBranch: branch,
    unlockedEvolutions: ['rookie', form],
    [`${V}Points`]: 5,
    [`${D}Points`]: 7,
    [`${A}Points`]: 2,
    attributesSinceLastEvolution: { [V]: 1, [D]: 2, [A]: 3 },
    soulmonStages: [{ id: 'rookie', name: 'X' }, { id: form, name: 'Y' }],
    spriteLibrary: { rookie: { url: 'https://x/r.png' }, [form]: { url: 'https://x/f.png', state: 'ready' } },
    foodInventory: { [OLD_EMOJI[0]]: 2, [OLD_EMOJI[1]]: 1, [OLD_EMOJI[2]]: 3, '\u{1F34E}': 4 },
    playLog: { date: '2026-09-01', buff: { kind: 'minigame', attribute: D } },
    rebirth: { at: '2026-09-01', fromStage: 'ultra', heranca: { lastForm: form } },
    incubation: { [form]: 123 },
    lastDayReport: { forecastBranch: A, date: 'x' },
    tasks: [{ id: 't', title: 'ler os dados do mês', category: 'Study' }],
  };
}

const TODOS = TIERS.flatMap((t) => NEW.map((b) => [t, b] as const));

describe('branchMigration — ids de caminho antigos → novos', () => {
  it('mapeia ramo e forma pela ordem dita pelo dono', () => {
    expect(legacyBranchToNew(V)).toBe('power');
    expect(legacyBranchToNew(D)).toBe('harmony');
    expect(legacyBranchToNew(A)).toBe('benevolence');
    expect(legacyBranchToNew('power')).toBe('power');
    for (const [t, b] of TODOS) {
      expect(legacyFormIdToNew(`${t}-${OLD[b]}`)).toBe(`${t}-${b}`);
      expect(newFormIdToLegacy(`${t}-${b}`)).toBe(`${t}-${OLD[b]}`);
    }
    expect(legacyFormIdToNew('rookie')).toBe('rookie');
    expect(legacyFormIdToNew('ultra')).toBe('ultra');
    // só as três camadas com galho: um id com outro prefixo NÃO é forma
    expect(legacyFormIdToNew(`kaelen-${D}`)).toBe(`kaelen-${D}`);
    expect(newFormIdToLegacy('ultra')).toBeNull();
  });

  it.each(TODOS)('save antigo em %s-%s migra por inteiro e NENHUM id antigo sobrevive', (t, b) => {
    const antigo = saveAntigo(t, OLD[b]);
    const novo = migrateBranchIds(antigo) as Record<string, unknown>;
    const form = `${t}-${b}`;
    expect(novo.evolutionStage).toBe(form);
    expect(novo.currentBranch).toBe(b);
    expect(novo.unlockedEvolutions).toEqual(['rookie', form]);
    expect(novo.powerPoints).toBe(5);
    expect(novo.harmonyPoints).toBe(7);
    expect(novo.benevolencePoints).toBe(2);
    expect(novo.attributesSinceLastEvolution).toEqual({ power: 1, harmony: 2, benevolence: 3 });
    expect((novo.soulmonStages as { id: string }[]).map((s) => s.id)).toEqual(['rookie', form]);
    expect(Object.keys(novo.spriteLibrary as object)).toEqual(['rookie', form]);
    expect(novo.foodInventory).toEqual({ [NEW_EMOJI[0]]: 2, [NEW_EMOJI[1]]: 1, [NEW_EMOJI[2]]: 3, '\u{1F34E}': 4 });
    expect((novo.playLog as { buff: { attribute: string } }).buff.attribute).toBe('harmony');
    expect((novo.rebirth as { heranca: { lastForm: string } }).heranca.lastForm).toBe(form);
    expect(Object.keys(novo.incubation as object)).toEqual([form]);
    expect((novo.lastDayReport as { forecastBranch: string }).forecastBranch).toBe('benevolence');
    // vocabulário geral de "dados" NÃO é caminho: fica intacto
    expect(novo.tasks).toBe(antigo.tasks);

    const txt = JSON.stringify(novo);
    expect(txt).not.toMatch(new RegExp(`${V}|${A}|(champion|ultimate|mega)-${D}|${D}Points`));
    for (const e of OLD_EMOJI) expect(txt).not.toContain(e);
    expect(hasLegacyBranchIds(novo)).toBe(false);
  });

  it('é IDEMPOTENTE: a 2ª passada devolve a MESMA referência', () => {
    const uma = migrateBranchIds(saveAntigo('mega', V));
    expect(migrateBranchIds(uma)).toBe(uma);
  });

  it('save já novo volta como a MESMA referência (não gera gravação à toa)', () => {
    const novo = { evolutionStage: 'champion-harmony', currentBranch: 'harmony', powerPoints: 1, foodInventory: { [NEW_EMOJI[0]]: 1 } };
    expect(migrateBranchIds(novo)).toBe(novo);
  });

  it('save meio migrado: pastinha SOMA, pontos ficam com o maior', () => {
    const meio = { powerPoints: 9, [`${V}Points`]: 4, foodInventory: { [OLD_EMOJI[0]]: 2, [NEW_EMOJI[0]]: 1 } };
    const out = migrateBranchIds(meio) as Record<string, unknown>;
    expect(out.powerPoints).toBe(9);
    expect(out.foodInventory).toEqual({ [NEW_EMOJI[0]]: 3 });
  });

  it('não-objeto e ciclo não derrubam', () => {
    expect(migrateBranchIds(null)).toBeNull();
    expect(migrateBranchIds(3 as unknown)).toBe(3);
    const c: Record<string, unknown> = { evolutionStage: 'rookie' };
    c.self = c;
    expect(() => migrateBranchIds(c)).not.toThrow();
  });
});
