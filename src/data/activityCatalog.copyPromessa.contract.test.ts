/**
 * A2 da revisão de psicologia (docs/reviews/2026-09-28-catalogo-psicologia.md):
 * nenhum item da área "mente" pode prometer tratamento na copy que o
 * jogador lê (`why`/`target`, PT e EN). O nome técnico da abordagem pode
 * aparecer em `evidence.refs`/`evidence.note` — é citação, não promessa.
 */
import { describe, it, expect } from 'vitest';
import { ACTIVITY_CATALOG } from './activityCatalog';

const PROMESSA = /trat|cur[ae]|terapia|treat|cure|therapy/i;

/**
 * O disclaimer certo (A1/A2) evita as próprias palavras de promessa —
 * "não é uma intervenção clínica" em vez de "não é tratamento". Isso é
 * deliberado: um regex que tolerasse "não trata" também deixaria passar
 * "trata muito bem [de verdade]" por engano de contexto. Nomear a técnica
 * (TCC, reestruturação cognitiva) sem as palavras vetadas continua permitido
 * — só `evidence.refs`/`evidence.note` podem citar "terapia"/"treatment" ao
 * nomear o desenho do estudo original.
 */
describe('copy da área mente nunca promete tratamento', () => {
  const itensMente = ACTIVITY_CATALOG.filter((i) => i.area === 'mente');

  it('autoverificação: existem itens de mente para testar', () => {
    expect(itensMente.length).toBeGreaterThan(0);
  });

  it.each(itensMente.map((i) => [i.id, i] as const))('%s: why/target não prometem tratamento', (_id, item) => {
    expect(item.why.pt).not.toMatch(PROMESSA);
    expect(item.why.en).not.toMatch(PROMESSA);
    for (const level of item.levels) {
      expect(level.target.pt).not.toMatch(PROMESSA);
      expect(level.target.en).not.toMatch(PROMESSA);
    }
  });
});
