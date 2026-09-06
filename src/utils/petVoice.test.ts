/**
 * O teste que importa é o de TOM. O produto inteiro se define por não cobrar,
 * e "voz nova" é exatamente onde a cobrança volta a entrar sem ninguém notar —
 * uma frase de encorajamento mal escrita ("você finalmente fez!") desfaz a
 * tese num lugar que nenhum teste de regra alcança.
 */
import { describe, it, expect } from 'vitest';
import { PET_VOICE_LINES, petVoiceLine, type PetVoiceKind } from './petVoice';

const KINDS: PetVoiceKind[] = ['task', 'haunted', 'rub', 'shower', 'milestone'];

/** Cobrança, vergonha e comparação com um passado idealizado. */
const PROIBIDAS_PT = [
  'deveria', 'devia', 'atrasou', 'atrasad', 'falhou', 'falha', 'esqueceu',
  'finalmente', 'até que enfim', 'preguiç', 'desculpa', 'culpa', 'perdeu',
];
const PROIBIDAS_EN = [
  'should', 'late', 'failed', 'failure', 'forgot', 'finally', 'at last',
  'lazy', 'excuse', 'guilt', 'lost',
];

describe('petVoice — nenhuma frase cobra', () => {
  for (const kind of KINDS) {
    it(`'${kind}' não usa palavra de cobrança em PT nem EN`, () => {
      for (const linha of PET_VOICE_LINES[kind].pt) {
        for (const p of PROIBIDAS_PT) {
          expect(linha.toLowerCase(), `"${linha}"`).not.toContain(p);
        }
      }
      for (const linha of PET_VOICE_LINES[kind].en) {
        for (const p of PROIBIDAS_EN) {
          expect(linha.toLowerCase(), `"${linha}"`).not.toContain(p);
        }
      }
    });
  }
});

describe('petVoice — os dois idiomas, sempre', () => {
  it('todo kind tem 3 frases em PT e 3 em EN', () => {
    for (const kind of KINDS) {
      expect(PET_VOICE_LINES[kind].pt, kind).toHaveLength(3);
      expect(PET_VOICE_LINES[kind].en, kind).toHaveLength(3);
    }
  });

  it('nenhuma frase falada carrega emoji', () => {
    // `speak()` remove emoji de qualquer jeito; escrever um aqui é escrever
    // um caractere que nunca vai aparecer, e isso vira mentira no arquivo.
    const emoji = /\p{Extended_Pictographic}/u;
    for (const kind of KINDS) {
      for (const l of [...PET_VOICE_LINES[kind].pt, ...PET_VOICE_LINES[kind].en]) {
        expect(emoji.test(l), l).toBe(false);
      }
    }
  });
});

describe('petVoice — a escolha', () => {
  it('cobre as três frases e nunca sai do intervalo', () => {
    expect(petVoiceLine('task', true, 0)).toBe(PET_VOICE_LINES.task.pt[0]);
    expect(petVoiceLine('task', true, 0.99)).toBe(PET_VOICE_LINES.task.pt[2]);
    // 1 exato e valores fora do intervalo não podem devolver `undefined`.
    expect(petVoiceLine('task', true, 1)).toBe(PET_VOICE_LINES.task.pt[2]);
    expect(petVoiceLine('task', false, -5)).toBe(PET_VOICE_LINES.task.en[0]);
  });

  it('a assombrada fala de alívio, não de conclusão', () => {
    const todas = PET_VOICE_LINES.haunted.pt.join(' ').toLowerCase();
    expect(todas).toMatch(/respira|leve|passado/);
  });
});
