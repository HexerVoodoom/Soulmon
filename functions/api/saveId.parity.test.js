/**
 * GUARD DE DUPLICAÇÃO DE REGRA — derivação do `saveId`.
 *
 * A regra "e-mail → SHA-256(`soulmon:` + e-mail normalizado) → 32 hex" tem
 * TRÊS implementações, em três árvores com três ciclos de deploy:
 *
 *   src/utils/cloudSave.ts        → app web/APK (Pages, deploy automático)
 *   desktop/renderer/src/cloudSync.ts → overlay Electron (release próprio)
 *   functions/api/_auth.js        → autorização no servidor (Pages)
 *
 * Divergir NÃO dá erro: o desktop passa a ler um save que não existe, e o
 * servidor passa a devolver 403 para todo usuário autenticado. Já aconteceu
 * uma vez — o código do desktop veio do DigiApp com o salt `digiapp:`.
 *
 * `desktop/renderer/src/cloudSync.test.ts` já cobria DUAS das três cópias
 * (app ↔ desktop). A do SERVIDOR, que é a que decide 403, estava fora — e é a
 * única cujo defeito tranca todo mundo para fora do próprio save.
 *
 * Este guard é COMPORTAMENTAL: executa as três sobre o mesmo corpus. Não olha
 * nome de função nem texto de código, então uma reescrita que mude a forma mas
 * preserve o resultado passa — e uma que preserve a forma e mude o resultado
 * (trocar o salt, tirar o `.slice(0, 32)`, esquecer o `toLowerCase`) cai.
 */
import { describe, it, expect } from 'vitest';
import { emailToSaveId as doServidor } from './_auth.js';
import { emailToSaveId as doApp } from '../../src/utils/cloudSave';
import { emailToSaveId as doDesktop } from '../../desktop/renderer/src/cloudSync';

const IMPLS = { app: doApp, desktop: doDesktop, servidor: doServidor };

// Corpus escolhido pelos modos de falha reais: caixa (o servidor recebe o
// e-mail do token do Firebase, que preserva a caixa digitada no cadastro),
// espaço em volta (campo de texto do desktop), acento e `+tag` do Gmail.
const CORPUS = [
  'mateus@exemplo.com',
  'A@B.COM',
  '  espaco@x.com  ',
  'MaTeUs.SpRnD@gmail.com',
  'usuario+soulmon@gmail.com',
  'josé@exemplo.com.br',
  'x@y.co',
];

describe('as três cópias da derivação do saveId concordam', () => {
  for (const email of CORPUS) {
    it(`mesmo saveId em app/desktop/servidor para ${JSON.stringify(email)}`, async () => {
      const [a, d, s] = await Promise.all([doApp(email), doDesktop(email), doServidor(email)]);
      expect({ desktop: d, servidor: s }).toEqual({ desktop: a, servidor: a });
    });
  }

  it('o formato bate com o VALID_ID do servidor (^[a-zA-Z0-9_-]{8,64}$)', async () => {
    for (const [nome, fn] of Object.entries(IMPLS)) {
      expect(await fn('mateus@exemplo.com'), nome).toMatch(/^[a-f0-9]{32}$/);
    }
  });

  it('as três normalizam caixa e espaço da MESMA forma', async () => {
    for (const [nome, fn] of Object.entries(IMPLS)) {
      expect(await fn(' Mateus@Exemplo.com '), nome).toBe(await fn('mateus@exemplo.com'));
    }
  });
});

describe('AUTOVERIFICAÇÃO — o guard enxerga cada modo de divergência real', () => {
  // Uma quarta implementação SINTÉTICA, com os três defeitos que já existiram
  // ou que uma edição descuidada produz. Se qualquer um destes passasse pelo
  // guard acima, o guard seria decoração.
  const hex = buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  const sha = async s => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));

  const defeituosas = {
    'salt do DigiApp (o bug que já aconteceu)': async e => (await sha(`digiapp:${e.trim().toLowerCase()}`)).slice(0, 32),
    'sem o slice(0, 32) → 403 em todo usuário': async e => sha(`soulmon:${e.trim().toLowerCase()}`),
    'sem toLowerCase → dois saves para o mesmo e-mail': async e => (await sha(`soulmon:${e.trim()}`)).slice(0, 32),
    'sem trim → o campo do desktop cria save órfão': async e => (await sha(`soulmon:${e.toLowerCase()}`)).slice(0, 32),
  };

  for (const [motivo, impl] of Object.entries(defeituosas)) {
    it(`divergiria: ${motivo}`, async () => {
      const iguais = await Promise.all(CORPUS.map(async e => (await impl(e)) === (await doApp(e))));
      expect(iguais, 'esta cópia defeituosa passaria despercebida').toContain(false);
    });
  }
});
