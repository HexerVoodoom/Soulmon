/**
 * BETA12 (B2) — as variantes de fala por caráter obedecem à MESMA régua do resto
 * de `petVoice`: nenhuma frase cobra (PT e EN), os dois idiomas sempre — e a
 * regra nova: nada de "no seu tempo / se quiser / quando estiver pronto".
 * Sem teste (neutro) as falas são as genéricas de sempre.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  ARCHETYPE_VOICE_LINES, PET_VOICE_LINES, petVoiceLine, setPetVoiceArchetype, getPetVoiceArchetype,
} from './petVoice';
import { SOULMON_ARCHETYPES } from './soulmonCharacter';

const PROIBIDAS_PT = [
  'deveria', 'devia', 'atrasou', 'atrasad', 'falhou', 'falha', 'esqueceu',
  'finalmente', 'até que enfim', 'preguiç', 'desculpa', 'culpa', 'perdeu',
];
const PROIBIDAS_EN: RegExp[] = [
  /should/, /late/, /failed/, /failure/, /you forgot/, /finally/, /at last/,
  /lazy/, /excuse/, /guilt/, /lost/,
];
/** O excesso que o dono pediu para tirar (12/11/2026). */
const ENCHIMENTO_PT = /no seu tempo|se quiser|se preferir|quando estiver pronto|quando quiser|sem pressa|à vontade|com calma/i;
const ENCHIMENTO_EN = /at your own pace|if you want|if you like|when you're ready|when you are ready|whenever you|no rush|take your time/i;
/** Saudade/histórico: o corpo dela só guarda o agora (§5.10). */
const HISTORICO = /saudade|miss you|ontem|yesterday|de novo|again|você sempre|you always/i;

afterEach(() => setPetVoiceArchetype('neutro'));

describe('falas por caráter — a régua de tom', () => {
  it('todo arquétipo do Soulmon tem variantes, e só eles', () => {
    expect(Object.keys(ARCHETYPE_VOICE_LINES).sort()).toEqual([...SOULMON_ARCHETYPES].sort());
  });

  for (const arq of SOULMON_ARCHETYPES) {
    const kinds = Object.keys(ARCHETYPE_VOICE_LINES[arq]) as Array<keyof typeof PET_VOICE_LINES>;
    it(`'${arq}': cobre os 5 gestos frequentes, PT e EN em paridade, sem cobrança nem enchimento`, () => {
      expect(kinds.sort()).toEqual(['fine', 'hungry', 'idle', 'rub', 'task']);
      for (const kind of kinds) {
        const v = ARCHETYPE_VOICE_LINES[arq][kind]!;
        expect(v.pt.length, `${arq}/${kind}`).toBeGreaterThanOrEqual(2);
        expect(v.en.length, `${arq}/${kind}`).toBe(v.pt.length);
        for (const l of v.pt) {
          for (const p of PROIBIDAS_PT) expect(l.toLowerCase(), `"${l}"`).not.toContain(p);
          expect(l, `"${l}"`).not.toMatch(ENCHIMENTO_PT);
          expect(l, `"${l}"`).not.toMatch(HISTORICO);
        }
        for (const l of v.en) {
          for (const p of PROIBIDAS_EN) expect(l.toLowerCase(), `"${l}"`).not.toMatch(p);
          expect(l, `"${l}"`).not.toMatch(ENCHIMENTO_EN);
          expect(l, `"${l}"`).not.toMatch(HISTORICO);
        }
      }
    });
  }

  it('as falas genéricas também perderam o enchimento', () => {
    for (const k of Object.keys(PET_VOICE_LINES) as Array<keyof typeof PET_VOICE_LINES>) {
      for (const l of PET_VOICE_LINES[k].pt) expect(l, `${k}: "${l}"`).not.toMatch(ENCHIMENTO_PT);
      for (const l of PET_VOICE_LINES[k].en) expect(l, `${k}: "${l}"`).not.toMatch(ENCHIMENTO_EN);
    }
  });

  it('a fome fala como gente: pergunta da comida', () => {
    expect(PET_VOICE_LINES.hungry.pt).toContain('Tô com fome. Tem comida aí?');
    expect(PET_VOICE_LINES.hungry.en).toContain("I'm hungry. Got any food?");
  });
});

describe('a escolha da fala', () => {
  it('sem teste (neutro) devolve a genérica — nada mudou para quem não fez o teste', () => {
    expect(getPetVoiceArchetype()).toBe('neutro');
    expect(PET_VOICE_LINES.idle.pt).toContain(petVoiceLine('idle', true, 0));
    expect(PET_VOICE_LINES.task.en).toContain(petVoiceLine('task', false, 0.99));
  });

  it('com arquétipo, as variantes entram nos gestos cobertos e a genérica segue nos outros', () => {
    setPetVoiceArchetype('animado');
    expect(ARCHETYPE_VOICE_LINES.animado.hungry!.pt).toContain(petVoiceLine('hungry', true, 0.1));
    expect(ARCHETYPE_VOICE_LINES.animado.task!.en).toContain(petVoiceLine('task', false, 0.9));
    // `haunted` não tem variante: cai na genérica.
    expect(PET_VOICE_LINES.haunted.pt).toContain(petVoiceLine('haunted', true, 0.5));
  });

  it('o parâmetro explícito vale mais que o do módulo; o traço de nascimento vale mais que os dois', () => {
    setPetVoiceArchetype('calmo');
    expect(ARCHETYPE_VOICE_LINES.direto.fine!.pt).toContain(petVoiceLine('fine', true, 0, undefined, 'direto'));
    // `guloso` tem fala própria para `task`.
    expect(petVoiceLine('task', true, 0, 'guloso', 'animado')).toBe('Fez! Isso vira comida, né?');
  });

  it('arquétipo inválido volta ao neutro', () => {
    setPetVoiceArchetype('animado');
    setPetVoiceArchetype('inexistente' as never);
    expect(getPetVoiceArchetype()).toBe('neutro');
    setPetVoiceArchetype(null);
    expect(getPetVoiceArchetype()).toBe('neutro');
  });
});
