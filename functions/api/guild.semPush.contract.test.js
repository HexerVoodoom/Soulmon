import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * LV-G4 / WPG-9 (`PLANO-GUILDA.md` §10.9, §13): a Guilda NUNCA dispara push —
 * nem sobre outro membro, nem "a guilda precisa de você", nem "a Feira está
 * aberta". A régua lê o FONTE de todo caminho que monta ou entrega push: se
 * alguém escrever `guild`/`coop`/`grupo`/`guilda`/`feira`/`bosque` ali, fica
 * vermelho antes de chegar ao aparelho.
 */
const RAIZ = resolve(__dirname, '../..');
const ARQUIVOS = [
  'workers/push-scheduler.js',
  'workers/fcm.js',
  'workers/webpush.js',
  'functions/api/_pushCopy.js',
  'functions/api/_pushTargets.js',
  'functions/api/_pushIdentity.js',
  'functions/api/subscribe.js',
  'functions/api/fcm-subscribe.js',
  'src/utils/notifications.ts',
  'src/components/NotificationManager.tsx',
];
const VETADO = /guild|guilda|coop|grupo|\bgroup\b|feira|\bfair\b|bosque|\bgrove\b/i;

describe('a Guilda não manda push (LV-G4)', () => {
  it('todos os arquivos de push existem (a régua não passa por arquivo sumido)', () => {
    for (const f of ARQUIVOS) expect(existsSync(resolve(RAIZ, f)), f).toBe(true);
  });

  for (const f of ARQUIVOS) {
    it(`${f} não cita guild/coop/grupo/Feira/Bosque`, () => {
      // Comentário não vira push; código e string viram. Linhas que são só
      // comentário (`//`, `*`, `/*`) ficam de fora; o resto é varrido inteiro.
      const linhas = readFileSync(resolve(RAIZ, f), 'utf8').split('\n');
      const achados = linhas.map((l, i) => [i + 1, l])
        .filter(([, l]) => !/^\s*(\/\/|\*|\/\*)/.test(l))
        .filter(([, l]) => VETADO.test(l));
      expect(achados, f).toEqual([]);
    });
  }

  it('a rota da Guilda não importa nada de push', () => {
    for (const f of ['functions/api/guild.js', 'functions/api/_coop.js']) {
      const src = readFileSync(resolve(RAIZ, f), 'utf8');
      expect(src, f).not.toMatch(/from '\.\/_push|webpush|fcm|PUSH_SUBSCRIPTIONS/);
    }
  });
});
