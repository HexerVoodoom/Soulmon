/**
 * BETA12 (B1) — o caráter do Soulmon a partir do Big Five do teste.
 * Régua: complemento POR DIMENSÃO, neutro sem teste, SIMILAR como opção, o veto
 * de vulnerabilidade manda nos dois modos, e o banco de perguntas NÃO entra no
 * chunk de entrada.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  soulmonCharacterFor, soulmonValue, loadBigFive, sanitizeVoiceMode, isVulnerable,
  SOULMON_ARCHETYPES, SAFE_ARCHETYPES, MIN_ANSWERS_FOR_CHARACTER, type TraitPoints,
} from './soulmonCharacter';
import { ARCHETYPE_VOICE_LINES } from './petVoice';
import { items } from './soulProfile/personality/questions';
import type { Answers } from './soulProfile/personality/types';

/** Pontos 0–100 neutros com UMA dimensão alterada. */
const pts = (over: TraitPoints): TraitPoints => ({
  openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50, ...over,
});
const base = { answered: 20 };

describe('sem teste = Soulmon neutro (§F 4)', () => {
  it('sem pontos, ou com poucas respostas, é neutro e source neutral', () => {
    expect(soulmonCharacterFor({}).archetype).toBe('neutro');
    expect(soulmonCharacterFor({ traitPoints: null, answered: 20 })).toMatchObject({ archetype: 'neutro', source: 'neutral' });
    expect(soulmonCharacterFor({ traitPoints: pts({ extraversion: 95 }), answered: MIN_ANSWERS_FOR_CHARACTER - 1 })).toMatchObject({ archetype: 'neutro', source: 'neutral' });
  });
  it('teste todo no meio = neutro, mas com source test', () => {
    expect(soulmonCharacterFor({ ...base, traitPoints: pts({}) })).toMatchObject({ archetype: 'neutro', source: 'test' });
  });
  it('o padrão do modo é COMPLEMENTAR', () => {
    expect(soulmonCharacterFor({ ...base, traitPoints: pts({}) }).mode).toBe('complementar');
    expect(sanitizeVoiceMode(undefined)).toBeUndefined();
    expect(sanitizeVoiceMode('similar')).toBe('similar');
    expect(sanitizeVoiceMode('qualquer coisa')).toBeUndefined();
    expect(sanitizeVoiceMode({ a: 1 })).toBeUndefined();
  });
});

describe('COMPLEMENTAR: o espelho, dimensão por dimensão (§F 1)', () => {
  const c = (over: TraitPoints) => soulmonCharacterFor({ ...base, traitPoints: pts(over) });
  it('jogador muito extrovertido → Soulmon calmo; jogador reservado → animado', () => {
    expect(c({ extraversion: 95 }).archetype).toBe('calmo');
    expect(c({ extraversion: 5 }).archetype).toBe('animado');
    expect(c({ extraversion: 95 }).traits.extraversion).toBe('low');
    expect(c({ extraversion: 5 }).traits.extraversion).toBe('high');
  });
  it('jogador muito organizado → Soulmon brincalhão; jogador solto → mentor', () => {
    expect(c({ conscientiousness: 95 }).archetype).toBe('brincalhao');
    expect(c({ conscientiousness: 5 }).archetype).toBe('mentor');
  });
  it('jogador muito amável → Soulmon direto; jogador seco → acolhedor', () => {
    expect(c({ agreeableness: 95 }).archetype).toBe('direto');
    expect(c({ agreeableness: 5 }).archetype).toBe('acolhedor');
  });
  it('jogador muito aberto → Soulmon com pé no chão; jogador convencional → curioso', () => {
    expect(c({ openness: 5 }).archetype).toBe('curioso');
    expect(['direto', 'calmo']).toContain(c({ openness: 95 }).archetype);
  });
  it('jogador sensível → Soulmon sereno (calmo)', () => {
    expect(c({ neuroticism: 90 }).archetype).toBe('calmo');
    expect(c({ neuroticism: 90 }).traits.neuroticism).toBe('low');
  });
  it('neuroticismo: jogador estável NÃO ganha um Soulmon ansioso (complemento = neutro)', () => {
    expect(soulmonValue('neuroticism', 5, 'complementar')).toBe(50);
    expect(soulmonCharacterFor({ ...base, traitPoints: pts({ neuroticism: 5 }) }).archetype).toBe('neutro');
  });
  it('as outras dimensões são o espelho exato', () => {
    expect(soulmonValue('extraversion', 80, 'complementar')).toBe(20);
    expect(soulmonValue('openness', 0, 'complementar')).toBe(100);
  });
  it('várias dimensões somam: reservado e solto → Soulmon que anima E guia', () => {
    const r = c({ extraversion: 10, conscientiousness: 10 });
    expect(['animado', 'mentor']).toContain(r.archetype);
  });
  it('é determinística: mesma entrada, mesma voz', () => {
    expect(c({ extraversion: 15, agreeableness: 80 })).toEqual(c({ extraversion: 15, agreeableness: 80 }));
  });
  it('valor fora de 0–100 ou lixo não quebra', () => {
    expect(() => soulmonCharacterFor({ ...base, traitPoints: { extraversion: 999, openness: -5, agreeableness: NaN } })).not.toThrow();
    expect(soulmonCharacterFor({ ...base, traitPoints: { extraversion: NaN } }).archetype).toBe('neutro');
  });
});

describe('SIMILAR: a mesma personalidade do jogador (§B2)', () => {
  const s = (over: TraitPoints, struggles?: Parameters<typeof soulmonCharacterFor>[0]['struggles']) =>
    soulmonCharacterFor({ ...base, traitPoints: pts(over), mode: 'similar', struggles });
  it('jogador extrovertido → Soulmon animado; jogador organizado → mentor', () => {
    expect(s({ extraversion: 95 }).archetype).toBe('animado');
    expect(s({ conscientiousness: 95 }).archetype).toBe('mentor');
    expect(s({ extraversion: 95 }).mode).toBe('similar');
  });
  it('neuroticismo alto no jogador não vira Soulmon ansioso: no máximo neutro', () => {
    expect(soulmonValue('neuroticism', 95, 'similar')).toBe(50);
    expect(soulmonValue('neuroticism', 10, 'similar')).toBe(10);
  });
});

describe('o veto de vulnerabilidade manda nos DOIS modos (§F 12 e 10)', () => {
  it('quem declarou ansiedade/perfeccionismo/cansaço só recebe vozes seguras', () => {
    for (const struggle of ['ansiedade', 'perfeccionismo', 'energia'] as const) {
      expect(isVulnerable([struggle])).toBe(true);
      for (const mode of ['complementar', 'similar'] as const) {
        // Extremos que, sem veto, dariam animado/mentor/direto.
        for (const over of [{ extraversion: 95 }, { extraversion: 5 }, { conscientiousness: 95 }, { conscientiousness: 5 }, { agreeableness: 95 }, { agreeableness: 5 }]) {
          const r = soulmonCharacterFor({ ...base, traitPoints: pts(over), mode, struggles: [struggle] });
          expect(['neutro', ...SAFE_ARCHETYPES], `${struggle}/${mode}/${JSON.stringify(over)} → ${r.archetype}`).toContain(r.archetype);
        }
      }
    }
  });
  it('em SIMILAR com jogador extrovertido e vulnerável, o animado NÃO passa', () => {
    const livre = soulmonCharacterFor({ ...base, traitPoints: pts({ extraversion: 95 }), mode: 'similar' });
    const veto = soulmonCharacterFor({ ...base, traitPoints: pts({ extraversion: 95 }), mode: 'similar', struggles: ['ansiedade'] });
    expect(livre.archetype).toBe('animado');
    expect(veto.archetype).not.toBe('animado');
    expect(veto.vetoed).toBe(true);
  });
  it('o que vai ao chat também é suavizado (nada de conscienciosidade/extroversão altas nem frieza)', () => {
    const r = soulmonCharacterFor({ ...base, traitPoints: pts({ extraversion: 5, conscientiousness: 5, agreeableness: 95 }), struggles: ['ansiedade'] });
    expect(r.traits.extraversion).not.toBe('high');
    expect(r.traits.conscientiousness).not.toBe('high');
    expect(r.traits.agreeableness).not.toBe('low');
  });
  it('dificuldade que não é vulnerável não veta nada', () => {
    expect(isVulnerable(['tempo', 'distracao'])).toBe(false);
    expect(isVulnerable(null)).toBe(false);
    expect(soulmonCharacterFor({ ...base, traitPoints: pts({ extraversion: 5 }), struggles: ['tempo'] }).archetype).toBe('animado');
  });
});

describe('cobertura do mapa', () => {
  it('todas as vozes do Soulmon são alcançáveis por algum perfil e têm falas', () => {
    const alcancados = new Set<string>();
    const extremos = [5, 50, 95];
    for (const o of extremos) for (const c of extremos) for (const e of extremos) for (const a of extremos) for (const n of extremos) {
      for (const mode of ['complementar', 'similar'] as const) {
        alcancados.add(soulmonCharacterFor({ ...base, mode, traitPoints: { openness: o, conscientiousness: c, extraversion: e, agreeableness: a, neuroticism: n } }).archetype);
      }
    }
    for (const a of SOULMON_ARCHETYPES) {
      expect(alcancados.has(a), `${a} inalcançável`).toBe(true);
      expect(ARCHETYPE_VOICE_LINES[a], `${a} sem falas`).toBeDefined();
    }
  });
});

describe('integração com o teste de verdade', () => {
  it('loadBigFive lê as respostas, e responder tudo no polo alto de extroversão rende um Soulmon calmo', async () => {
    const answers: Answers = {};
    for (const it of items) {
      if (it.kind === 'likert' || it.kind === 'frequency') {
        answers[it.id] = { kind: 'likert', value: it.dimension === 'extraversion' ? (it.positive ? 5 : 1) : 3 };
      } else if (it.kind === 'forced-choice') {
        answers[it.id] = { kind: 'forced-choice', choice: it.dimension === 'extraversion' ? 'a' : 'b' };
      }
    }
    const r = await loadBigFive(answers);
    expect(r).not.toBeNull();
    expect(r!.answered).toBeGreaterThanOrEqual(MIN_ANSWERS_FOR_CHARACTER);
    expect(r!.traitPoints.extraversion).toBeGreaterThan(80);
    const c = soulmonCharacterFor({ traitPoints: r!.traitPoints, answered: r!.answered });
    expect(c.traits.extraversion).toBe('low');
  });
  it('lixo no lugar das respostas = nulo, sem lançar', async () => {
    expect(await loadBigFive(undefined)).toBeNull();
    expect(await loadBigFive('x')).toBeNull();
  });
});

describe('contrato de bundle', () => {
  it('soulmonCharacter.ts não importa o banco de perguntas nem o scoring de forma estática (chunk de entrada)', () => {
    const src = readFileSync(resolve(__dirname, 'soulmonCharacter.ts'), 'utf8');
    const estaticos = [...src.matchAll(/^import\s.+from\s+'([^']+)'/gm)].map(m => m[1]);
    for (const i of estaticos) expect(i, i).not.toMatch(/personality\/(questions|scoring)/);
    expect(src).toMatch(/await import\('\.\/soulProfile\/personality\/scoring'\)/);
  });
});
