import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { sanitizeEntitlement } from './entitlements';
import {
  WIDGET_FRAME_ELEMENTS, clearPaidWidgetFrames, effectiveOwnedFrames, getPaidWidgetFrames, grantFrameOnEvolution,
  isWidgetFrameId, resolveWidgetFrame, sanitizeOwnedWidgetFrames, sanitizeSelectedWidgetFrame,
  setPaidWidgetFramesFromEntitlement, widgetFrameDrawableName, widgetFrameElementOfPet, widgetFrameProductId,
  widgetFrameRows, widgetFrameUnlockHint,
} from './widgetFrames';

/** Anel do servidor lido do FONTE (a pasta functions/ é JS puro, sem tipos). */
const COUNTER_RING: string[] = [...(/COUNTER_RING = \[([\s\S]*?)\]/.exec(readFileSync('functions/api/_elementoBase.js', 'utf8'))?.[1] ?? '').matchAll(/'([a-z]+)'/g)].map(m => m[1]);

const evolved = (over: Record<string, unknown> = {}) => ({
  unlockedEvolutions: ['rookie', 'champion'],
  soulmonMeta: { dominantElement: 'sombra' },
  ...over,
});

describe('catálogo das molduras do widget', () => {
  it('são os 20 elementos base, os MESMOS ids do anel do servidor', () => {
    expect(WIDGET_FRAME_ELEMENTS).toHaveLength(20);
    expect([...WIDGET_FRAME_ELEMENTS].sort()).toEqual([...COUNTER_RING].sort());
  });

  it('produto da Play = moldura_<elemento> (o catálogo do servidor está em _billing.moldura.test.js)', () => {
    const ids = WIDGET_FRAME_ELEMENTS.map(widgetFrameProductId);
    expect(ids.every(id => /^moldura_[a-z]+$/.test(id))).toBe(true);
    expect(new Set(ids).size).toBe(20);
    const billing = readFileSync('functions/api/_billing.js', 'utf8');
    expect(billing).toContain("moldura_" + "$" + "{el}");
  });

  it('drawable do Android por elemento', () => {
    expect(widgetFrameDrawableName('fogo')).toBe('moldura_vpet_fogo');
  });

  it('o allowlist do Kotlin tem os mesmos 20 ids', () => {
    const kt = readFileSync('android/app/src/main/java/com/soulmon/widget/WidgetVpet.kt', 'utf8');
    const block = /FRAME_ELEMENTS: Set<String> = setOf\(([\s\S]*?)\)\r?\n/.exec(kt)?.[1] ?? '';
    const ids = [...block.matchAll(/"([a-z]+)"/g)].map(m => m[1]);
    expect([...ids].sort()).toEqual([...WIDGET_FRAME_ELEMENTS].sort());
  });
});

describe('save antigo e lixo', () => {
  it('save sem os campos entra vazio / padrão', () => {
    expect(sanitizeOwnedWidgetFrames(undefined)).toEqual([]);
    expect(sanitizeSelectedWidgetFrame(undefined)).toBeNull();
  });
  it('lixo é descartado, repetido some, ordem mantida', () => {
    expect(sanitizeOwnedWidgetFrames(['fogo', 'x', 7, 'fogo', 'sombra', 'vapor'])).toEqual(['fogo', 'sombra']);
    expect(sanitizeSelectedWidgetFrame('vapor')).toBeNull();
    expect(sanitizeSelectedWidgetFrame('luz')).toBe('luz');
    expect(isWidgetFrameId('__proto__')).toBe(false);
  });
});

describe('liberação na evolução', () => {
  it('evoluiu para um Soulmon de sombra: ganha a moldura de sombra', () => {
    expect(grantFrameOnEvolution(evolved())).toEqual(['sombra']);
  });
  it('elemento derivado vira a base dominante (vapor -> fogo)', () => {
    expect(widgetFrameElementOfPet(evolved({ soulmonMeta: { dominantElement: 'vapor' } }))).toBe('fogo');
    expect(grantFrameOnEvolution(evolved({ soulmonMeta: { dominantElement: 'vapor' } }))).toEqual(['fogo']);
  });
  it('a Poção de Elemento vence o do oráculo (como no combate)', () => {
    expect(grantFrameOnEvolution(evolved({ potionElement: 'luz' }))).toEqual(['luz']);
  });
  it('NÃO duplica: já tem, devolve a MESMA referência', () => {
    const owned = ['sombra'];
    expect(grantFrameOnEvolution(evolved({ widgetFramesOwned: owned }))).toBe(owned);
    const next = grantFrameOnEvolution(evolved());
    expect(next).toEqual(['sombra']);
    expect(grantFrameOnEvolution(evolved({ widgetFramesOwned: next }))).toBe(next);
  });
  it('soma sem tirar o que já tinha', () => {
    expect(grantFrameOnEvolution(evolved({ widgetFramesOwned: ['fogo'] }))).toEqual(['fogo', 'sombra']);
  });
  it('quem nunca evoluiu (inicial) não ganha de graça', () => {
    expect(grantFrameOnEvolution(evolved({ unlockedEvolutions: ['rookie'] }))).toBeUndefined();
    expect(grantFrameOnEvolution({ demoCharacterId: 'meteoro', unlockedEvolutions: ['rookie'] })).toBeUndefined();
  });
  it('sem elemento (corvinho neutro / desconhecido): nada', () => {
    expect(grantFrameOnEvolution(evolved({ soulmonMeta: { creature: 'corvo' } }))).toBeUndefined();
    expect(grantFrameOnEvolution(evolved({ soulmonMeta: null }))).toBeUndefined();
  });
});

describe('compra antes de evoluir', () => {
  beforeEach(() => clearPaidWidgetFrames());

  it('comprada vale já (união), e evoluir depois não duplica nem some', () => {
    setPaidWidgetFramesFromEntitlement({ frames: ['sombra'] });
    expect(effectiveOwnedFrames(undefined, getPaidWidgetFrames())).toEqual(['sombra']);
    const granted = grantFrameOnEvolution(evolved());
    expect(granted).toEqual(['sombra']);
    expect(effectiveOwnedFrames(granted, getPaidWidgetFrames())).toEqual(['sombra']);
  });

  it('o servidor é quem manda: sem `frames` na resposta, a posse paga zera (reembolso); offline mantém', () => {
    setPaidWidgetFramesFromEntitlement({ frames: ['fogo', 'luz'] });
    setPaidWidgetFramesFromEntitlement(null);
    expect(getPaidWidgetFrames()).toEqual(['fogo', 'luz']);
    setPaidWidgetFramesFromEntitlement(sanitizeEntitlement({ tier: 'demo', credits: 0, adsLeft: 0 }) ?? {});
    expect(getPaidWidgetFrames()).toEqual([]);
  });

  it('a resposta do servidor passa pelo sanitizador (id fora do catálogo não entra)', () => {
    const ent = sanitizeEntitlement({ tier: 'demo', credits: 0, adsLeft: 0, frames: ['fogo', 'hack', 'fogo'] });
    expect(ent?.frames).toEqual(['fogo']);
    expect(sanitizeEntitlement({ tier: 'demo', credits: 0, adsLeft: 0 })).not.toHaveProperty('frames');
  });
});

describe('escolha e fallback', () => {
  it('escolhida e possuída vai para o widget; sem posse (reembolso) cai no padrão', () => {
    expect(resolveWidgetFrame('sombra', ['sombra'])).toBe('sombra');
    expect(resolveWidgetFrame('sombra', [])).toBe('');
    expect(resolveWidgetFrame(null, ['sombra'])).toBe('');
    expect(resolveWidgetFrame('vapor', ['vapor'])).toBe('');
    expect(resolveWidgetFrame(undefined, [])).toBe('');
  });
});

describe('linhas do seletor', () => {
  it('estado de cada uma e dica de destravar nas trancadas', () => {
    const rows = widgetFrameRows(['sombra', 'fogo'], 'sombra', 'pt-BR');
    expect(rows).toHaveLength(20);
    expect(rows.find(r => r.id === 'sombra')?.status).toBe('selected');
    expect(rows.find(r => r.id === 'fogo')?.status).toBe('owned');
    expect(rows.find(r => r.id === 'luz')?.status).toBe('locked');
    expect(widgetFrameUnlockHint('luz', 'pt-BR')).toMatch(/evoluir.*Luz.*compre/i);
  });
});

describe('cosmético puro', () => {
  it('o módulo não toca em economia nem em regra de jogo', () => {
    const src = readFileSync('src/utils/widgetFrames.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(src).not.toMatch(/credits|gamePoints|emblems|totalXP|spendCredits/);
  });
});
