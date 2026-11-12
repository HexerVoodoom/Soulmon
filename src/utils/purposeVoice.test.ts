import { describe, it, expect } from 'vitest';
import { PURPOSE_VOICE_LINES, isBadDay, markSpoken, purposeVoiceKey, purposeVoiceLine, WEEK_GAP_DAYS } from './purposeVoice';
import { MOTIVE_KEYS, emptyPurpose, setGoal, setMotive } from './purpose';

// A mesma régua de `petVoice.carater.test.ts`: nada de cobrança, nada de enchimento, nada de histórico.
const PROIBIDAS_PT = ['deveria', 'devia', 'atrasou', 'atrasad', 'falhou', 'falha', 'esqueceu', 'finalmente', 'até que enfim', 'preguiç', 'desculpa', 'culpa', 'perdeu', 'prometo', 'garant'];
const PROIBIDAS_EN: RegExp[] = [/should/, /late/, /failed/, /failure/, /you forgot/, /finally/, /at last/, /lazy/, /excuse/, /guilt/, /lost/, /promise/, /guarantee/];
const ENCHIMENTO_PT = /no seu tempo|se quiser|se preferir|quando estiver pronto|quando quiser|sem pressa|à vontade|com calma/i;
const ENCHIMENTO_EN = /at your own pace|if you want|if you like|when you're ready|when you are ready|whenever you|no rush|take your time/i;
const HISTORICO = /saudade|miss you|ontem|yesterday|de novo|again|você sempre|you always/i;

const com = (voice = true) => {
  let p = setGoal(emptyPurpose(), { text: 'Correr 5 km', areas: [] }, new Date(2026, 0, 1));
  p = setMotive(p, { key: 'health', phrase: 'frase privada' });
  return { ...p, prefs: { voiceReminder: voice } };
};

describe('purposeVoice: a régua de tom', () => {
  it('toda chave tem falas PT/EN em paridade, sem cobrança, enchimento ou histórico', () => {
    for (const k of MOTIVE_KEYS) {
      const v = PURPOSE_VOICE_LINES[k];
      expect(v.pt.length, k).toBeGreaterThanOrEqual(2);
      expect(v.en.length, k).toBe(v.pt.length);
      for (const l of v.pt) {
        for (const p of PROIBIDAS_PT) expect(l.toLowerCase(), l).not.toContain(p);
        expect(l, l).not.toMatch(ENCHIMENTO_PT);
        expect(l, l).not.toMatch(HISTORICO);
      }
      for (const l of v.en) {
        for (const p of PROIBIDAS_EN) expect(l.toLowerCase(), l).not.toMatch(p);
        expect(l, l).not.toMatch(ENCHIMENTO_EN);
        expect(l, l).not.toMatch(HISTORICO);
      }
    }
  });
  it('a fala usa a categoria, nunca o texto livre da pessoa', () => {
    for (const k of MOTIVE_KEYS) for (const l of [...PURPOSE_VOICE_LINES[k].pt, ...PURPOSE_VOICE_LINES[k].en]) expect(l).not.toContain('frase privada');
    expect(purposeVoiceLine('health', true, 0)).toBe(PURPOSE_VOICE_LINES.health.pt[0]);
    expect(purposeVoiceLine('health', false, 0.99)).toBe(PURPOSE_VOICE_LINES.health.en.at(-1));
  });
});

describe('purposeVoice: quando fala', () => {
  const base = { today: '2026-03-10', trigger: 'milestone' as const, badDay: false };
  it('fala em gatilho positivo, num dia que não foi ruim', () => {
    expect(purposeVoiceKey({ ...base, purpose: com() })).toBe('health');
  });
  it('NUNCA depois de um dia ruim', () => {
    expect(purposeVoiceKey({ ...base, purpose: com(), badDay: true })).toBeNull();
    expect(isBadDay({ mood: 2, lastDay: null })).toBe(true);
    expect(isBadDay({ mood: 4, lastDay: { done: 1, required: 3 } })).toBe(true);
    expect(isBadDay({ mood: 4, lastDay: { done: 3, required: 3 } })).toBe(false);
    expect(isBadDay({ mood: null, lastDay: null })).toBe(false);
  });
  it('no máximo 1 por semana', () => {
    const p = markSpoken(com(), '2026-03-10')!;
    expect(purposeVoiceKey({ ...base, today: '2026-03-10', purpose: p })).toBeNull();
    expect(purposeVoiceKey({ ...base, today: '2026-03-16', purpose: p })).toBeNull();
    expect(purposeVoiceKey({ ...base, today: `2026-03-${10 + WEEK_GAP_DAYS}`, purpose: p })).toBe('health');
  });
  it('desligável; sem objetivo ou motivo, não fala', () => {
    expect(purposeVoiceKey({ ...base, purpose: com(false) })).toBeNull();
    expect(purposeVoiceKey({ ...base, purpose: undefined })).toBeNull();
    expect(purposeVoiceKey({ ...base, purpose: setGoal(emptyPurpose(), { text: 'abc', areas: [] }, new Date(2026, 0, 1)) })).toBeNull();
  });
});
