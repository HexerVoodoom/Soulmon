/**
 * QA2 (04/10/2026) — missões semanais "em N DIAS" contavam por GESTO:
 *  · `mood-checkins` ("Registre como você estava em 3 dias"): responder de novo
 *    no mesmo dia SUBSTITUI o humor mas somava de novo — 3 toques fechavam a
 *    missão num dia só;
 *  · `rub-days` ("Faça carinho em 4 dias"): cada pedaço de cura do carinho (2–3
 *    por dia, pelo teto diário) somava um "dia".
 * Contrato de fonte (o handler vive no App): só a primeira ocorrência do dia conta.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const app = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');

describe('missões "em N dias" contam um por dia', () => {
  it('humor: só a primeira resposta do dia chama contarMissao', () => {
    const i = app.indexOf('const handlePickMood');
    const bloco = app.slice(i, i + 1200);
    expect(bloco).toMatch(/const primeiraDoDia = moodFor\(gameState\.moodLog, today\) === null/);
    expect(bloco).toMatch(/if \(primeiraDoDia\) contarMissao\('mood-checkins'\)/);
    expect(bloco).not.toMatch(/\n\s*contarMissao\('mood-checkins'\)/);
  });

  it('carinho: só a primeira cura do dia chama contarMissao', () => {
    expect(app).toMatch(/if \(rubHealFor\(gameState\.careCaps, today\)\.healed <= 0\) contarMissao\('rub-days'\)/);
    expect(app).not.toMatch(/\n\s*contarMissao\('rub-days'\)/);
  });
});
