/**
 * A copy dos talentos e a linha "Agora / No grau máximo" (11/10/2026, "as skills não estão legais"): o efeito em palavras vem ANTES do
 * número, cada nó de combate/fenda tem a linha, os números saem das constantes do dono, e a copy não promete o que o código não faz.
 */
import { describe, it, expect } from 'vitest';
import { TALENT_TREE, TALENT_BY_ID, PVE_STEP, ARC_STEP, START_ENERGY_STEP, HEAL_BOOST_STEP, START_SHIELD_STEP } from './talents';
import { TALENT_COPY, talentEffectLine } from './talentCopy';

describe('talentEffectLine', () => {
  it('todo nó de combate e da fenda tem a linha, nas duas línguas; o Comércio não (o número já está na descrição)', () => {
    for (const n of TALENT_TREE) {
      const pt = talentEffectLine(n.id, 1, true), en = talentEffectLine(n.id, 1, false);
      if (n.path === 'comercio') { expect(pt, n.id).toBeNull(); continue; }
      expect(pt, n.id).toMatch(/^Agora: .* · No grau máximo: .*\.$/);
      expect(en, n.id).toMatch(/^Now: .* · At top rank: .*\.$/);
      expect(pt).not.toMatch(/undefined|NaN/); expect(en).not.toMatch(/undefined|NaN/);
    }
    expect(talentEffectLine('tal-xxx', 1, true)).toBeNull();
  });
  it('grau 0 diz "nada ainda"; os números são os das constantes (grau atual e máximo)', () => {
    expect(talentEffectLine('tal-pve-02', 0, true)).toBe(`Agora: nada ainda · No grau máximo: +${(PVE_STEP * 4 * 100).toFixed(1).replace('.', ',')}% de defesa.`);
    expect(talentEffectLine('tal-pve-02', 2, false)).toBe(`Now: +${(PVE_STEP * 2 * 100).toFixed(1)}% defense · At top rank: +${(PVE_STEP * 4 * 100).toFixed(1)}% defense.`);
    expect(talentEffectLine('tal-pve-06', 3, false)).toBe(`Now: +${(ARC_STEP * 3 * 100).toFixed(1)}% rhythm · At top rank: +${(ARC_STEP * 3 * 100).toFixed(1)}% rhythm.`);
  });
  it('traduz o que não é % em unidade de jogo: energia (com os segundos), cura, escudo', () => {
    expect(talentEffectLine('tal-pvp-04', 3, false)).toContain(`${START_ENERGY_STEP * 3} special energy from the start (≈ 4.5 s less waiting)`);
    expect(talentEffectLine('tal-pve-03', 1, true)).toContain(`+${(HEAL_BOOST_STEP * 100).toFixed(1).replace('.', ',')}% do HP máximo na cura entre andares`);
    expect(talentEffectLine('tal-pve-07', 1, false)).toContain(`a shield worth ${Math.round(START_SHIELD_STEP * 100)}% of HP`);
  });
});

describe('a descrição diz o efeito ANTES do número e não promete o que o código não faz', () => {
  it('os nós de ataque/defesa/ritmo abrem pelo efeito ("bate mais forte", "aguenta mais", "mais seguidos")', () => {
    expect(TALENT_COPY['tal-pvp-01'].descEn).toMatch(/^Your Soulmon hits harder/);
    expect(TALENT_COPY['tal-pvp-02'].descEn).toMatch(/^Your Soulmon holds up better/);
    expect(TALENT_COPY['tal-pvp-03'].descEn).toMatch(/^Blows come quicker/);
    expect(TALENT_COPY['tal-pve-01'].descPt).toMatch(/^O seu Soulmon bate mais forte/);
  });
  it('Muro da fenda e Arco de luz dizem a verdade sobre onde são defesa/ritmo de verdade (Fenda) e onde entram no bônus único', () => {
    for (const id of ['tal-pve-02', 'tal-pve-06']) {
      expect(TALENT_COPY[id].descPt, id).toMatch(/Na Fenda/); expect(TALENT_COPY[id].descPt, id).toMatch(/bônus único da fenda/);
      expect(TALENT_COPY[id].descEn, id).toMatch(/Endless Rift/); expect(TALENT_COPY[id].descEn, id).toMatch(/single rift bonus/);
    }
  });
  it('três nós de combate da fenda NÃO são mais o mesmo efeito: os canais são ATK, DEF e SPD', () => {
    const canais = ['tal-pve-01', 'tal-pve-02', 'tal-pve-06'].map((id) => (TALENT_BY_ID.get(id)!.effect as { attr?: string }).attr ?? 'atk');
    expect(new Set(canais).size).toBe(3);
  });
});
