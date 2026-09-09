/**
 * O OVERLAY tem UM copiador de snapshot — e este teste lê o FONTE.
 *
 * ## Por que ler o fonte, e não importar
 *
 * `menu.ts` toca o DOM no topo do módulo, então **nenhum teste em `node`
 * consegue importá-lo**. O `CLAUDE.md` diz isso com todas as letras e diz
 * também o que essa cegueira já custou: *"foi assim que o teto de carinho
 * ficou por aparelho sem ninguém ver."*
 *
 * O precedente de guard nessa situação já existe no projeto —
 * `src/plugins/widgetSemCobranca.contract.test.ts` lê Kotlin pelo mesmo
 * motivo. Este arquivo faz o mesmo com TypeScript.
 *
 * ## O que ele prende
 *
 * Até 09/09/2026, `syncNow` copiava os DEZ campos de `RemoteSnapshot` para o
 * estado à mão, e `applySnapshot` — dez linhas abaixo, no mesmo arquivo —
 * copiava os mesmos dez. Duas cópias da mesma regra. Elas concordavam naquele
 * dia; o que não existia era garantia de continuarem concordando, num arquivo
 * que nenhum teste alcança. Acrescentar um 11º campo ao snapshot chegaria por
 * um caminho e não pelo outro, **em silêncio** — e o sintoma apareceria como
 * "o overlay mostra um número velho", que é indepurável de fora.
 *
 * Hoje `syncNow` chama `applySnapshot`. Os dois casos abaixo são o que impede
 * a cópia de voltar e o que obriga o copiador a acompanhar o TIPO.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/* ⚠️ Este guard mora em `src/` e não em `desktop/`, de propósito: o
   `desktop/tsconfig.json` não carrega os tipos de node, então um teste que lê
   arquivo não compila lá. O precedente é `src/plugins/widgetSemCobranca.contract.test.ts`,
   que lê Kotlin de `android/` pelo mesmo motivo — guard de superfície que a
   suíte não importa vive onde a suíte consegue rodá-lo. */
const OVERLAY = resolve(__dirname, '../../desktop/renderer/src');
const ler = (nome: string) => readFileSync(join(OVERLAY, nome), 'utf8');

/** Corpo de uma função de nível superior, por nome. */
function corpoDe(src: string, nome: string): string {
  const i = src.indexOf(`function ${nome}(`);
  expect(i, `não achei \`function ${nome}\` em menu.ts`).toBeGreaterThan(-1);
  const abre = src.indexOf('{', i);
  let nivel = 0;
  for (let k = abre; k < src.length; k++) {
    if (src[k] === '{') nivel++;
    else if (src[k] === '}') {
      nivel--;
      if (nivel === 0) return src.slice(abre, k + 1);
    }
  }
  throw new Error(`não consegui fechar o corpo de ${nome}`);
}

/** Os campos declarados em `RemoteSnapshot` (`cloudSync.ts`). */
function camposDoSnapshot(): string[] {
  const src = ler('cloudSync.ts');
  const i = src.indexOf('export interface RemoteSnapshot {');
  expect(i, 'RemoteSnapshot saiu de cloudSync.ts').toBeGreaterThan(-1);
  const bloco = src.slice(i, src.indexOf('\n}', i));
  const campos: string[] = [];
  for (const linha of bloco.split('\n').slice(1)) {
    const m = /^\s*([A-Za-z_$][\w$]*)\??\s*:/.exec(linha);
    if (m) campos.push(m[1]);
  }
  return campos;
}

describe('🔴 o overlay tem UM copiador de snapshot', () => {
  it('AUTOVERIFICAÇÃO: a leitura do tipo acha os campos de verdade', () => {
    // Guard que lê zero campo passa sempre — e o caso principal abaixo
    // depende inteiramente desta lista.
    const campos = camposDoSnapshot();
    expect(campos.length, 'não extraí campo nenhum de RemoteSnapshot').toBeGreaterThanOrEqual(8);
    for (const esperado of ['stage', 'hearts', 'maxHearts', 'energy', 'foodInventory', 'tasks']) {
      expect(campos, `"${esperado}" deveria estar em RemoteSnapshot`).toContain(esperado);
    }
  });

  it('`applySnapshot` copia TODO campo de `RemoteSnapshot`', () => {
    // É este caso que fica vermelho no dia em que alguém acrescenta um campo
    // ao snapshot e esquece o copiador. O sintoma que ele evita — "o overlay
    // mostra um número velho" — não tem como ser depurado de fora.
    const corpo = corpoDe(ler('menu.ts'), 'applySnapshot');
    const faltando = camposDoSnapshot().filter(c => !new RegExp(`\\bs\\.${c}\\b`).test(corpo));
    expect(
      faltando,
      'campo novo em RemoteSnapshot que `applySnapshot` não copia — o overlay mostraria o valor antigo, sem erro nenhum',
    ).toEqual([]);
  });

  it('🔴 `syncNow` NÃO copia os campos de novo — ela delega', () => {
    /* A cópia que estava aqui é a que este arquivo existe para impedir. Um
       `state.hearts = s.hearts` dentro de `syncNow` significa que voltou a
       existir um segundo copiador, e o primeiro campo esquecido não faz
       ninguém saber. */
    const corpo = corpoDe(ler('menu.ts'), 'syncNow');
    expect(corpo, '`syncNow` tem que passar pelo copiador único').toContain('applySnapshot(');

    const recopiados = camposDoSnapshot()
      .filter(c => new RegExp(`state\\.${c}\\s*=`).test(corpo));
    expect(
      recopiados,
      '`syncNow` voltou a copiar campo do snapshot à mão; chame `applySnapshot`',
    ).toEqual([]);
  });

  it('🔴 a formatação da data NÃO voltou para o arquivo cego', () => {
    /* `lastSyncLabel` fazia `new Date(state.lastSyncAt).toLocaleString()`
       inline. Como `loadState` não valida campo, um `lastSyncAt` corrompido no
       localStorage imprimia **"Última sincronização: Invalid Date"** — valor
       cru do JavaScript na tela, a mesma classe do `undefined partida(s)` que
       o `TournamentPage` já registra.

       A lógica foi para `state.ts` (`formatLastSync`), que é importável e tem
       teste próprio (`desktop/renderer/src/formatLastSync.test.ts`). Este caso
       impede o cálculo de voltar para cá, onde ninguém consegue medi-lo. */
    const src = ler('menu.ts');
    expect(src, 'o rótulo tem que delegar').toContain('formatLastSync(state.lastSyncAt');
    expect(src, 'a formatação inline voltou').not.toMatch(/new Date\(state\.lastSyncAt\)/);
  });

  it('o que é SÓ de `syncNow` continua nela — o e-mail', () => {
    // O oposto do erro anterior: delegar demais e perder o que é próprio da
    // função. O e-mail não vem do snapshot, então tem que ser atribuído aqui.
    const corpo = corpoDe(ler('menu.ts'), 'syncNow');
    expect(corpo).toMatch(/state\.syncEmail\s*=/);
  });
});
