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

describe('WP3.10 — o traço de nascimento na voz', () => {
  it('o traço substitui a fala genérica onde tem fala própria', () => {
    const generica = petVoiceLine('rub', true, 0);
    const carinhoso = petVoiceLine('rub', true, 0, 'carinhoso');
    expect(carinhoso).not.toBe(generica);
  });

  it('sem fala para AQUELE gesto, cai na genérica — nada de enchimento', () => {
    // Preencher a matriz inteira só para ela existir produz frase forçada, e
    // frase forçada lê como enchimento.
    expect(petVoiceLine('shower', true, 0, 'carinhoso')).toBe(petVoiceLine('shower', true, 0));
  });

  it('traço desconhecido (save de outra versão) não quebra nem cala o pet', () => {
    expect(petVoiceLine('task', true, 0, 'inexistente')).toBe(petVoiceLine('task', true, 0));
    expect(petVoiceLine('task', true, 0, undefined)).toBeTruthy();
  });

  it('as falas de traço também não cobram, e existem nos dois idiomas', () => {
    for (const [traco, gesto] of [['guloso', 'task'], ['teimoso', 'haunted'], ['sortudo', 'rare'], ['madrugador', 'shower'], ['carinhoso', 'rub']] as const) {
      for (const isPt of [true, false]) {
        const l = petVoiceLine(gesto, isPt, 0, traco);
        expect(l).toBeTruthy();
        expect(l).not.toBe(petVoiceLine(gesto, isPt, 0));
        for (const p of ['deveria', 'should', 'falhou', 'failed', 'finally', 'finalmente']) {
          expect(l.toLowerCase()).not.toContain(p);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// A FALA DO DIA RUIM (auditoria de 06/09/2026).
//
// O `CompanionHUD` tinha duas escadas de `pick()` inline com as frases de HP
// baixo e de ócio — fora do alcance deste arquivo e, portanto, fora do teste
// de palavras de cobrança que existe logo acima. A pior delas era
// `'HP baixo...'`: a criatura-alma da pessoa anunciando o próprio dano com o
// nome da variável, no dia em que a pessoa não conseguiu cuidar de si.
// ---------------------------------------------------------------------------
describe('a fala de HP baixo vira a atenção para a pessoa', () => {
  it('nenhuma frase lê o medidor em voz alta', () => {
    const todas = [...PET_VOICE_LINES.lowHp.pt, ...PET_VOICE_LINES.lowHp.en];
    for (const f of todas) {
      expect(f).not.toMatch(/\bHP\b/i);
      expect(f).not.toMatch(/coraç|heart|energia|energy|barra|bar\b/i);
    }
  });

  it('pelo menos uma pergunta pela PESSOA, não pelo pet', () => {
    const pt = PET_VOICE_LINES.lowHp.pt.join(' ');
    const en = PET_VOICE_LINES.lowHp.en.join(' ');
    expect(pt).toMatch(/VOCÊ|você/);
    expect(en).toMatch(/YOU|you/);
  });

  it('o ócio convida, nunca lista o que falta', () => {
    const todas = [...PET_VOICE_LINES.idle.pt, ...PET_VOICE_LINES.idle.en];
    for (const f of todas) {
      expect(f).not.toMatch(/tarefa|task|falta|left|complet/i);
    }
  });
});
