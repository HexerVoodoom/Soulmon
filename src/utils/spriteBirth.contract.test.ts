import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ts, fonteDe } from '../test/tsAst';
import { emptySpriteLibrary, isNewbornLibrary, recordSprite, recordFailure } from './spriteLibrary';
import { birthBatch, type SpriteTriggerInput } from './spriteTrigger';
import { CARE_PATTERNS, type CareReading } from './carePattern';

/**
 * F-1 — **a ocasião A não tinha chamador.**
 *
 * `birthBatch` existia, era testado e nunca rodava: `App.tsx` não passava
 * `newborn`, então `useSpriteGeneration` caía sempre em `spriteBatch`. Quem
 * paga R$ 29,90 chegava ao reveal e via a MESMA arte de reserva que o demo
 * grátis vê; o primeiro sprite próprio só nascia na véspera da primeira
 * evolução, dias depois.
 *
 * O elo é de FIAÇÃO, e um teste do hook não o pega — ele testa o hook, que
 * sempre esteve certo. Por isso o guard abaixo lê o `App.tsx` no AST e pergunta
 * se o `newborn` chega lá dentro. Textual não serve: `/newborn/` já é satisfeita
 * pelo comentário que explica a decisão (a sexta lição de método deste run).
 */

const SRC = path.resolve(__dirname, '..');

const comSprite = (lib: ReturnType<typeof emptySpriteLibrary>, formId: string) =>
  recordSprite(lib, { url: `https://exemplo.test/${formId}.png`, formId, at: 1_000 }, { adopt: 'now' });

const entrada = (library: ReturnType<typeof emptySpriteLibrary>): SpriteTriggerInput => ({
  evolutionStage: 'rookie',
  currentBranch: 'data',
  unlockedEvolutions: [],
  perfectDays: 0,
  points: { virus: 5, data: 1, vaccine: 1 },
  reading: leituraSemConfianca,
  library,
});

const leituraSemConfianca: CareReading = {
  pattern: CARE_PATTERNS.equilibrado,
  activeDays: 0,
  total: 0,
  concentration: 0.2,
  confident: false,
};

describe('F-1: o acervo vazio é a ocasião A', () => {
  it('acervo recém-criado é recém-nascido', () => {
    expect(isNewbornLibrary(emptySpriteLibrary())).toBe(true);
  });

  it('um sprite já desenhado tira o acervo do nascimento', () => {
    expect(isNewbornLibrary(comSprite(emptySpriteLibrary(), 'rookie'))).toBe(false);
  });

  it('FALHA não conta como nascimento consumido: quem tentou e não saiu ainda é recém-nascido', () => {
    // Importa porque a 1ª tentativa pode morrer em 500 do provedor (X-1). Se a
    // falha "gastasse" o nascimento, o pagante voltaria ao caso que o F-1 existe
    // para consertar — arte de reserva no reveal, sem segunda chance.
    const lib = recordFailure(emptySpriteLibrary(), 'rookie', 'error', { at: 1_000 });
    expect(isNewbornLibrary(lib)).toBe(true);
  });

  /* O lote de nascimento é `rookie` + a forma-destino (`targetFormId`). */
  it('birthBatch nunca redesenha o que já existe — e some quando o lote inteiro saiu', () => {
    const vazio = entrada(emptySpriteLibrary());
    const lote = birthBatch(vazio);
    expect(lote, 'acervo vazio: o lote de nascimento tem de sair').not.toBeNull();
    expect(lote!.occasion).toBe('A');
    expect(lote!.formIds.length).toBeGreaterThan(0);

    // Uma forma do lote já desenhada some do próximo lote: é a razão de ligar o
    // `newborn` não poder gerar duas vezes, mesmo que o efeito rode de novo.
    const parcial = birthBatch(entrada(comSprite(emptySpriteLibrary(), lote!.formIds[0])));
    expect(parcial?.formIds ?? []).not.toContain(lote!.formIds[0]);

    // Lote inteiro desenhado → `null`, sem chamador nenhum precisar saber disso.
    const cheio = lote!.formIds.reduce(comSprite, emptySpriteLibrary());
    expect(birthBatch(entrada(cheio))).toBeNull();
    expect(isNewbornLibrary(cheio), 'e o acervo deixou de ser recém-nascido').toBe(false);
  });
});

describe('F-1: a fiação existe (guard de elo, no AST — comentário não conta)', () => {
  it('App.tsx passa `newborn` para useSpriteGeneration, e não uma constante desligada', async () => {
    const arquivo = path.join(SRC, 'App.tsx');
    const sf = fonteDe(arquivo);

    let valorDeNewborn: string | null = null;
    let achouChamada = false;

    const visita = (node: import('typescript').Node): void => {
      if (
        ts.isCallExpression(node)
        && ts.isIdentifier(node.expression)
        && node.expression.text === 'useSpriteGeneration'
      ) {
        achouChamada = true;
        const arg = node.arguments[0];
        if (arg && ts.isObjectLiteralExpression(arg)) {
          for (const prop of arg.properties) {
            if (ts.isPropertyAssignment(prop) && prop.name.getText(sf) === 'newborn') {
              valorDeNewborn = prop.initializer.getText(sf);
            }
          }
        }
      }
      ts.forEachChild(node, visita);
    };
    visita(sf);

    expect(achouChamada, 'useSpriteGeneration sumiu do App.tsx').toBe(true);
    expect(
      valorDeNewborn,
      'sem `newborn`, birthBatch nunca roda e o pagante vê a arte de reserva no reveal (F-1)',
    ).not.toBeNull();
    expect(
      valorDeNewborn,
      '`newborn: false` (ou ausente) é o bug do F-1 escrito por extenso',
    ).not.toBe('false');
  });
});
