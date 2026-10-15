import { describe, it, expect } from 'vitest';
import { SPRITE_FACING_PROMPT } from '../spritePose';
import { generateOracle } from '../../test/oracleSync';
import type { OracleInput } from '../oracle';
import {
  CHAMPION_MORPHS_EXTRA, PERFECT_MORPHS_EXTRA, MEGA_MORPHS_EXTRA, ELEMENT_MOTIFS, THEME_MOTIFS,
} from './formas';
import { REALM_MOTIFS } from './formasReino';

const mk = (i: number): OracleInput => ({
  fullName: `Pessoa Teste ${i} Silva`,
  birthDate: `${1960 + (i % 50)}-${String(1 + (i % 12)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`,
  birthTime: `${String(i % 24).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
  birthPlace: `Cidade ${i % 97}, Brasil`,
});

// Frases de design (dono, 15/10/2026, REGISTRO 64/69): cada estágio leva a frase
// de ALIGNMENT_DESIGNS + 2 itens de TYPE_LOOK; o motivo de elemento e o de reino
// são eixos separados e nunca repetem entre as evoluções do mesmo usuário.
describe('eixos de forma da evolução', () => {
  const N = 300;
  const results = Array.from({ length: N }, (_, i) => generateOracle(mk(i), 1000 + i));

  it('pools finais: morfologias >= 40 por estágio; motivos por elemento e tema', () => {
    expect(CHAMPION_MORPHS_EXTRA.length).toBeGreaterThanOrEqual(16);
    expect(PERFECT_MORPHS_EXTRA.length).toBeGreaterThanOrEqual(19);
    expect(MEGA_MORPHS_EXTRA.length).toBeGreaterThanOrEqual(19);
    for (const l of Object.values(ELEMENT_MOTIFS)) expect(l.length).toBeGreaterThanOrEqual(8);
    expect(Object.keys(THEME_MOTIFS)).toHaveLength(11);
    expect(Object.keys(REALM_MOTIFS)).toHaveLength(9);
  });

  it('determinismo: mesma entrada, mesmos prompts', () => {
    const a = generateOracle(mk(5), 12345).creature.stages.map(s => s.imagePrompt);
    const b = generateOracle(mk(5), 12345).creature.stages.map(s => s.imagePrompt);
    expect(a).toEqual(b);
  });

  it('todo estágio leva design + looks, nas duas variantes, abaixo do teto', () => {
    for (const r of results.slice(0, 60)) {
      for (const s of r.creature.stages) {
        for (const p of [s.imagePrompt, s.imagePromptFallback]) {
          expect(p).toMatch(/-attribute design language/);
          expect(p).toContain('Distinguishing features: ');
          expect(p).toContain('#00FF00');
          expect(p.length).toBeLessThan(2500);
        }
      }
    }
  });

  it('sem repetição de morfologia nem de motivo dentro de um usuário', () => {
    for (const r of results) {
      const lv = r.creature.stages.filter(s => s.branch).map(s => s.imagePrompt);
      const shapes = lv.map(p => /(?:evolved into a larger, more defined version of its own species, |transformed into |final form, it is )(.+?), with /.exec(p)?.[1]);
      expect(shapes.every(Boolean)).toBe(true);
      expect(new Set(shapes).size).toBe(shapes.length);
      const motifs = lv.map(p => /, with ([^.]+?)\. (?:Its body|Habitat|It carries)/.exec(p)?.[1]);
      expect(new Set(motifs).size).toBe(motifs.length);
    }
  });

  it('nenhuma morfologia de champion domina (> 12% dos usuários)', () => {
    const count = new Map<string, number>();
    for (const r of results) for (const s of r.creature.stages.filter(x => x.stage === 'champion')) {
      const m = /species, (.+?), with /.exec(s.imagePrompt)?.[1] ?? '?';
      count.set(m, (count.get(m) ?? 0) + 1);
    }
    const max = Math.max(...count.values());
    expect(max / (N * 3)).toBeLessThan(0.12);
    expect(count.size).toBeGreaterThanOrEqual(25);
  });

  it('motivos de elemento, tema e reino não contêm vocabulário proibido (5.8/7.2.1)', () => {
    const all = JSON.stringify([ELEMENT_MOTIFS, THEME_MOTIFS, REALM_MOTIFS]);
    expect(all).not.toMatch(/archive|library|memory|cracked|patched|\bscar(s|red)?\b|wound/i);
  });

  // Decisão do dono (15/10/2026): rosto neutro, sem expressão nem "fofura".
  it('rosto neutro: cláusula constante e nenhum vocabulário de expressão nos prompts', () => {
    const clause = 'Simple neutral face with minimal facial detail, small plain eyes, no smile, no frown.';
    const FACE = /smile|smirk|grin|scowl|snarl|frown|eyes?|eyed|cheek|expression|gaze|stare|look|cute|huggable|fluff|plush|mouth|fang|maw|gape|brow|bfaces?b|glare|squint/i;
    for (const r of results.slice(0, 150)) for (const s of r.creature.stages) {
      for (const p of [s.imagePrompt, s.imagePromptFallback]) {
        expect(p).toContain(clause);
        const body = p.split(clause).join('').split(SPRITE_FACING_PROMPT).join('');
        const m = FACE.exec(body.split('the creature itself contains no green and no green fringe:')[1] ?? '');
        expect(m ? `${m[0]} :: ${body.slice(Math.max(0, body.indexOf(m[0]) - 60), body.indexOf(m[0]) + 60)}` : null).toBeNull();
      }
    }
  });
});
