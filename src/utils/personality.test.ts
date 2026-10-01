import { describe, it, expect } from 'vitest';
import {
  derivePersonality, FALLBACK_PERSONALITY, personalityProfileFromSave, chatSettingsFor,
  VULNERABLE_STRUGGLES,
} from './personality';
import type { StrengthId, StruggleId } from '../types/activityCatalog';

const ALL_STRUGGLES: StruggleId[] = ['comecar', 'constancia', 'esquecer', 'energia', 'ansiedade', 'distracao', 'tempo', 'perfeccionismo'];
const ALL_STRENGTHS: StrengthId[] = ['disciplina', 'curiosidade', 'criatividade', 'sociabilidade', 'organizacao', 'energiaFisica', 'calma', 'persistencia'];

describe('derivePersonality (G7)', () => {
  it('perfil vazio, nulo ou com ids desconhecidos cai no fallback seguro', () => {
    expect(derivePersonality(undefined)).toEqual(FALLBACK_PERSONALITY);
    expect(derivePersonality(null)).toEqual(FALLBACK_PERSONALITY);
    expect(derivePersonality({})).toEqual(FALLBACK_PERSONALITY);
    expect(derivePersonality({ strengths: [], struggles: [] })).toEqual(FALLBACK_PERSONALITY);
    expect(derivePersonality({ strengths: ['xyz' as StrengthId], struggles: [42 as unknown as StruggleId] })).toEqual(FALLBACK_PERSONALITY);
    expect(FALLBACK_PERSONALITY.motivationStyle).toBe('supportive');
  });

  it('ansiedade → voz calma, apoio, pouco emoji', () => {
    expect(derivePersonality({ struggles: ['ansiedade'] })).toEqual({
      tone: 'calm', motivationStyle: 'supportive', emojiIntensity: 'low', source: 'derived',
    });
  });

  it('dificuldade de COMEÇAR é contrabalançada com energia e encorajamento, mesmo com disciplina', () => {
    const p = derivePersonality({ struggles: ['comecar'], strengths: ['disciplina'] });
    expect(p.tone).toBe('energetic');
    expect(p.motivationStyle).toBe('encouraging');
  });

  it('perfeccionismo nunca recebe desafio, mesmo com disciplina e persistência', () => {
    const p = derivePersonality({ struggles: ['perfeccionismo'], strengths: ['disciplina', 'persistencia'] });
    expect(p.motivationStyle).not.toBe('challenging');
    expect(p.tone).toBe('calm');
  });

  it('desafio só com lastro: disciplina/persistência e nenhuma dificuldade vulnerável', () => {
    expect(derivePersonality({ strengths: ['disciplina', 'persistencia'] }).motivationStyle).toBe('challenging');
    expect(derivePersonality({ strengths: ['organizacao'] }).motivationStyle).not.toBe('challenging');
  });

  it('TRAVA: nenhuma combinação com dificuldade vulnerável devolve `challenging`', () => {
    // Varre todas as combinações de até 2 dificuldades × até 2 forças.
    const pairs = <T,>(xs: T[]) => [[], ...xs.map(x => [x]), ...xs.flatMap((a, i) => xs.slice(i + 1).map(b => [a, b]))] as T[][];
    for (const st of pairs(ALL_STRUGGLES)) {
      if (!st.some(s => VULNERABLE_STRUGGLES.includes(s))) continue;
      for (const sg of pairs(ALL_STRENGTHS)) {
        expect(derivePersonality({ struggles: st, strengths: sg }).motivationStyle, `${st}|${sg}`).not.toBe('challenging');
      }
    }
  });

  it('é determinística e nunca devolve emoji alto nem nenhum', () => {
    for (const s of ALL_STRUGGLES) {
      for (const g of ALL_STRENGTHS) {
        const a = derivePersonality({ struggles: [s], strengths: [g] });
        const b = derivePersonality({ struggles: [s], strengths: [g] });
        expect(a).toEqual(b);
        expect(['low', 'medium']).toContain(a.emojiIntensity);
        expect(a.source).toBe('derived');
      }
    }
  });
});

describe('personalityProfileFromSave', () => {
  it('lê `onboardingProfile` do save e higieniza', () => {
    expect(personalityProfileFromSave({ onboardingProfile: { strengths: ['calma', 'nope'], struggles: ['tempo', 'tempo'] } }))
      .toEqual({ strengths: ['calma'], struggles: ['tempo'] });
  });
  it('save sem o campo (ou lixo) → perfil vazio → fallback', () => {
    expect(personalityProfileFromSave({})).toEqual({});
    expect(personalityProfileFromSave(null)).toEqual({});
    expect(personalityProfileFromSave({ onboardingProfile: 'x' })).toEqual({});
    expect(derivePersonality(personalityProfileFromSave({}))).toEqual(FALLBACK_PERSONALITY);
  });
});

describe('chatSettingsFor', () => {
  it('a personalidade é derivada; instruções livres e criatividade antigas continuam', () => {
    const s = chatSettingsFor({ struggles: ['ansiedade'] }, { customKeywords: 'me chama de chefe', temperature: 0.6 });
    expect(s).toEqual({ tone: 'calm', emojiIntensity: 'low', motivationStyle: 'supportive', customKeywords: 'me chama de chefe', temperature: 0.6 });
  });
  it('sem nada guardado, padrões seguros', () => {
    expect(chatSettingsFor(undefined, null)).toEqual({ tone: 'casual', emojiIntensity: 'medium', motivationStyle: 'supportive', customKeywords: '', temperature: 0.85 });
  });
});
