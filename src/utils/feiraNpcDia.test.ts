/**
 * A fala do mercador depois do desafio (dono, 16/11/2026): o que o jogador achou hoje, o que o clã achou (só o agregado) e amanhã.
 */
import { describe, it, expect } from 'vitest';
import { feiraNpcDia } from './feiraNpcDia';
import type { FeiraVolta } from './feiraVolta';
import type { FeiraResumo } from './feira';

const boss: FeiraVolta = { day: 'd', seen: true, kind: 'evento', evento: { k: 1, kind: 'boss', level: 3, bossId: 'arauto-do-fim', element: 'fogo', bossHpPct: 62, canAttack: false } };
const resumoBoss: FeiraResumo = { state: 'boss', level: 3, bossId: 'arauto-do-fim', bossHpPct: 62 };

describe('feiraNpcDia', () => {
  it('PT: o que o jogador achou, o clã (agregado) e o convite de amanhã com a hora', () => {
    const f = feiraNpcDia('pt-BR', boss, resumoBoss, '06:00');
    expect(f.hoje).toBe('Hoje o seu Soulmon trouxe Arauto do Fim do caminho, e você o enfrentou.');
    expect(f.cla).toContain('Arauto do Fim');
    expect(f.cla).toContain('62%');
    expect(f.amanha).toContain('06:00');
    expect(f.amanha).toMatch(/investigar de novo/);
  });
  it('EN: mesmas três falas', () => {
    const f = feiraNpcDia('en-US', boss, resumoBoss, '6:00 AM');
    expect(f.hoje).toBe('Today your Soulmon brought Herald of the End back from the path, and you faced it.');
    expect(f.cla).toContain('62%');
    expect(f.amanha).toBe('Tomorrow, from 6:00 AM, the path will have more. Send your Soulmon to investigate again.');
  });
  it('cada tipo de volta tem a sua fala, e sem registro cai na fala geral', () => {
    const r: FeiraResumo = { state: 'rest', level: 1 };
    const kinds: FeiraVolta[] = [
      { day: 'd', seen: true, kind: 'achado', achado: { bits: 5 } }, { day: 'd', seen: true, kind: 'nada' },
    ];
    const falas = kinds.map(k => feiraNpcDia('pt-BR', k, r, '06:00').hoje);
    expect(new Set(falas).size).toBe(2);
    expect(feiraNpcDia('pt-BR', null, undefined, '06:00').hoje).toBe('Hoje o seu Soulmon voltou da investigação.');
  });
  it('clã: chefe caído, desafio com e sem marcas, caminho calmo, sem resumo', () => {
    expect(feiraNpcDia('pt-BR', null, { ...resumoBoss, bossHpPct: 0 }, 'x').cla).toMatch(/já caiu/);
    expect(feiraNpcDia('pt-BR', null, { state: 'trail', level: 1, marks: 4 }, 'x').cla).toMatch(/4 marcas/);
    expect(feiraNpcDia('pt-BR', null, { state: 'trail', level: 1, marks: 0 }, 'x').cla).toMatch(/primeira marca/);
    expect(feiraNpcDia('pt-BR', null, { state: 'rest', level: 1 }, 'x').cla).toMatch(/tranquilo/);
    expect(feiraNpcDia('pt-BR', null, undefined, 'x').cla).toMatch(/foi para a roda/);
  });
  it('voz de mundo: nada de "arquivo", ".exe", HP ou dano', () => {
    for (const lang of ['pt-BR', 'en-US'] as const) {
      const f = feiraNpcDia(lang, boss, resumoBoss, '06:00');
      expect(Object.values(f).join(' ')).not.toMatch(/arquivo|file|\.exe|\bhp\b|dano|damage/i);
    }
  });
});
