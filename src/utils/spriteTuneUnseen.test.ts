import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  emptySpriteLibrary, normalizeSpriteLibrary, recordSprite, tuneVisor, revertVisor,
  markTuneSeen, cardState,
} from './spriteLibrary';

/**
 * X-3 — **a adoção automática estava LIGADA com a superfície de aviso DESLIGADA.**
 *
 * A virada do dia adota o sprite próprio sem gesto nenhum do jogador (§2.3.1).
 * Quem nunca abre a aba Evolução acordava com o rosto do bicho trocado e nada
 * dizia nada:
 *
 *  - `tunedAnnouncement` subia do hook e **ninguém lia** — estado morto;
 *  - a copy `NOVO` existia e `cardState` sabia produzi-la, mas era
 *    **inalcançável em runtime**: ninguém passava `unseen`, e não havia produtor
 *    de `unseen` nenhum — nada no save marcava "visto";
 *  - `aria-live` ligado a sprite: zero ocorrências no projeto.
 *
 * A marca mora no SAVE de propósito. Um flag de sessão sumiria no primeiro
 * reload, que é exatamente o caso do achado.
 */

const SRC = path.resolve(__dirname, '..');
const FORM = 'champion-data';

const comSprite = (formId: string) =>
  recordSprite(emptySpriteLibrary(), { url: `u/${formId}`, formId, at: 1_000 }, { adopt: 'ask' });

const ctx = (unseen: boolean) => ({
  generating: [] as string[], imminent: false, reachable: true, online: true, unseen,
});

describe('X-3: a adoção SEM gesto deixa rastro; a com gesto, não', () => {
  it('adoção automática marca a forma como não vista', () => {
    const lib = tuneVisor(comSprite(FORM), FORM, { auto: true });
    expect(lib.tunedUnseen).toEqual([FORM]);
    expect(cardState(lib, FORM, ctx(lib.tunedUnseen.includes(FORM)))).toBe('NOVO');
  });

  it('o toque do jogador NÃO marca — ele já viu', () => {
    const lib = tuneVisor(comSprite(FORM), FORM);
    expect(lib.tunedUnseen).toEqual([]);
    expect(cardState(lib, FORM, ctx(false))).toBe('PROPRIO');
  });

  it('marcar duas vezes não duplica', () => {
    const uma = tuneVisor(comSprite(FORM), FORM, { auto: true });
    expect(tuneVisor(uma, FORM, { auto: true }).tunedUnseen).toEqual([FORM]);
  });

  it('ver limpa a marca, e limpar de novo é no-op sem cópia', () => {
    const lib = tuneVisor(comSprite(FORM), FORM, { auto: true });
    const visto = markTuneSeen(lib, FORM);
    expect(visto.tunedUnseen).toEqual([]);
    expect(markTuneSeen(visto, FORM), 'nada a fazer devolve o MESMO objeto').toBe(visto);
  });

  it('reverter também conta como ter visto', () => {
    const lib = tuneVisor(comSprite(FORM), FORM, { auto: true });
    expect(revertVisor(lib, FORM).tunedUnseen).toEqual([]);
  });

  it('sobrevive ao save: `tunedUnseen` é normalizado na volta, e lixo é descartado', () => {
    const lib = tuneVisor(comSprite(FORM), FORM, { auto: true });
    const daNuvem = normalizeSpriteLibrary(JSON.parse(JSON.stringify(lib)));
    expect(daNuvem.tunedUnseen, 'flag de sessão sumiria aqui — e some no reload do jogador')
      .toEqual([FORM]);

    const sujo = normalizeSpriteLibrary({ tunedUnseen: [FORM, 42, null, 'ultra'] });
    expect(sujo.tunedUnseen).toEqual([FORM, 'ultra']);

    expect(normalizeSpriteLibrary({}).tunedUnseen, 'save antigo não tem o campo').toEqual([]);
  });
});

describe('X-3: a superfície existe (guards de elo, no AST — comentário não conta)', () => {
  /* Textual não serve: `/NOVO/` e `/aria-live/` já eram satisfeitas por copy e
     por comentário enquanto nada renderizava. Sexta lição de método do run. */
  const lerAst = async (arquivo: string) => {
    const mod = await import('typescript');
    const ts = ((mod as { default?: typeof import('typescript') }).default
      ?? mod) as typeof import('typescript');
    const caminho = path.join(SRC, arquivo);
    return {
      ts,
      sf: ts.createSourceFile(
        caminho, fs.readFileSync(caminho, 'utf8'),
        ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX,
      ),
    };
  };

  it('o App tem uma região `aria-live` que consome o anúncio do hook', async () => {
    const { ts, sf } = await lerAst('App.tsx');
    let achou = false;
    const visita = (node: import('typescript').Node): void => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const temLive = node.attributes.properties.some(
          a => ts.isJsxAttribute(a) && a.name.getText(sf) === 'aria-live');
        if (temLive && /visorAnunciou|tunedAnnouncement/.test(node.parent.getText(sf))) achou = true;
      }
      ts.forEachChild(node, visita);
    };
    visita(sf);
    expect(
      achou,
      'o anúncio do hook não chega a nenhuma região viva — era estado morto (X-3)',
    ).toBe(true);
  });

  it('o EvolutionPath passa `unseen` para o cardState', async () => {
    const { ts, sf } = await lerAst('components/EvolutionPath.tsx');
    let unseen: string | null = null;
    const visita = (node: import('typescript').Node): void => {
      if (
        ts.isCallExpression(node)
        && ts.isIdentifier(node.expression)
        && node.expression.text === 'cardState'
      ) {
        const arg = node.arguments[2];
        if (arg && ts.isObjectLiteralExpression(arg)) {
          for (const prop of arg.properties) {
            if (ts.isPropertyAssignment(prop) && prop.name.getText(sf) === 'unseen') {
              unseen = prop.initializer.getText(sf);
            }
          }
        }
      }
      ts.forEachChild(node, visita);
    };
    visita(sf);
    expect(unseen, 'sem `unseen`, o estado NOVO é inalcançável em runtime').not.toBeNull();
    expect(unseen).not.toBe('false');
  });
});
