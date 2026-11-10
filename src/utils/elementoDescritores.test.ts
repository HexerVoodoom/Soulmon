/**
 * Descritores visuais por elemento no prompt de FORMA DE POÇÃO (dono, 10/11/2026): nome + pistas de forma/paleta derivadas dos prompts
 * dos assets; só na forma de poção (elemento efetivo ≠ base); sem poção o prompt é byte a byte o de antes; nunca verde (chroma #00FF00).
 */
import { describe, it, expect } from 'vitest';
import { stagesComElemento, pistasVisuaisDoElemento } from './elementoCombinado';
import { DESCRITORES_ELEMENTO } from './elementoDescritores.data';
import { ESSENCE_ELEMENT_IDS, BASE_ELEMENT_IDS } from './elementDex';

const RAW = 'Generate this RPG creature. Flat dark violet and ash-gray colors.';
const st = [{ stage: 'perfeito', branch: 'poder', imagePrompt: RAW, imagePromptFallback: RAW + ' (fb)' }] as never;
const gen = (id?: string, base?: string) => stagesComElemento(st, undefined, id ? { ultimate: id } : undefined, base)![0] as { imagePrompt: string; imagePromptFallback: string };
const VERDE = /green|lime|verde|mint|teal|emerald|jade|turquoise|seafoam|sage|fern|moss|olive/i;

describe('descritores visuais no prompt da forma de poção', () => {
  it('sem poção: prompt byte a byte idêntico ao cru (conta sem poção não muda)', () => {
    expect(gen(undefined, 'sombra').imagePrompt).toBe(RAW);
    expect(gen(undefined).imagePromptFallback).toBe(RAW + ' (fb)');
  });
  it('poção simples COM prompt-fonte (Marcial, Morte): nome + pistas de forma e paleta', () => {
    const m = gen('marcial', 'sombra').imagePrompt;
    expect(m).toContain('Elemental theme of this form: Martial.');
    expect(m).toContain('Visual cues of this element: crossed blades and cord, steel grey and deep red palette.');
    const d = gen('morte', 'sombra').imagePrompt;
    expect(d).toContain('Elemental theme of this form: Death.');
    expect(d).toContain('Visual cues of this element: bleached branches and pale moths, bone white palette.');
  });
  it('combinado COM prompt-fonte próprio usa o esquema DELE (não a soma dos componentes)', () => {
    const a = gen('armaria', 'sombra').imagePrompt;
    expect(a).toContain('forged blades and anvil sparks');
    expect(a).toContain('Visual cues of this element:');
  });
  it('combinado SEM prompt-fonte (Sabá): só o nome e o elemento principal, sem pistas inventadas', () => {
    const s = gen('sabbat', 'sombra').imagePrompt;
    expect(s).toBe(`${RAW} Elemental theme of this form: Sabbath, with arcano as its main element.`);
    expect(pistasVisuaisDoElemento('sabbat')).toBeUndefined();
  });
  it('a forma cujo elemento é o BASE do Soulmon (a original) leva só o nome, sem pistas', () => {
    const o = gen('sombra', 'sombra').imagePrompt;
    expect(o).toBe(`${RAW} Elemental theme of this form: Shadow.`.replace('Shadow', o.match(/form: ([A-Za-z ]+)\./)![1]));
    expect(o).not.toContain('Visual cues');
  });
  it('nenhum descritor da tabela, nem nenhum prompt final de qualquer elemento do catálogo, tem verde', () => {
    for (const [id, d] of Object.entries(DESCRITORES_ELEMENTO)) {
      expect(`${d.forma ?? ''} ${d.paleta ?? ''}`, id).not.toMatch(VERDE);
      expect(ESSENCE_ELEMENT_IDS, id).toContain(id);
    }
    for (const id of ESSENCE_ELEMENT_IDS) {
      const p = gen(id, 'sombra');
      // só as PISTAS (o nome do elemento, ex.: "Greenhouse", é anterior a este recurso e não é descritor)
      expect(p.imagePrompt.split('Visual cues of this element:')[1] ?? '', id).not.toMatch(VERDE);
      expect(p.imagePromptFallback.split('Visual cues of this element:')[1] ?? '', id).not.toMatch(VERDE);
    }
  });
  it('todos os 20 elementos base têm prompt-fonte (pistas de forma e paleta)', () => {
    for (const b of BASE_ELEMENT_IDS) {
      expect(DESCRITORES_ELEMENTO[b]?.forma || DESCRITORES_ELEMENTO[b]?.paleta, b).toBeTruthy();
    }
  });
});
