// ---------------------------------------------------------------------------
// A versão gravada na prova de consentimento tem que ser a do texto publicado.
//
// `buildConsentRecord` (`consent.ts`) grava `TERMS_VERSION`/`PRIVACY_VERSION`
// no save para dizer A QUE texto a pessoa disse sim. Os textos são HTML
// estático em `public/`, com o carimbo "Última atualização" / "Last updated".
// Achado do QA geral de 21/09/2026: a política foi republicada em 08/09 e a
// constante ficou em 25/08 — duas semanas de provas apontando para um texto
// que não era o publicado. Um comentário pedindo "suba a versão aqui" não
// pega nada; este teste pega.
//
// Contrato: a data PT e a data EN de cada HTML são a mesma, e batem com a
// constante em formato AAAA-MM-DD.
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TERMS_VERSION, PRIVACY_VERSION } from './consent';

const MESES_PT: Record<string, string> = {
  janeiro: '01', fevereiro: '02', março: '03', abril: '04', maio: '05', junho: '06',
  julho: '07', agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12',
};
const MESES_EN: Record<string, string> = {
  January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
  July: '07', August: '08', September: '09', October: '10', November: '11', December: '12',
};

function ler(nome: string): string {
  return readFileSync(resolve(__dirname, '../../public', nome), 'utf8');
}

/** "Última atualização: 21 de setembro de 2026" → "2026-09-21" */
function dataPt(html: string): string | null {
  const m = /Última atualização:\s*(\d{1,2}) de ([a-zç]+) de (\d{4})/i.exec(html);
  if (!m) return null;
  const mes = MESES_PT[m[2].toLowerCase()];
  return mes ? `${m[3]}-${mes}-${m[1].padStart(2, '0')}` : null;
}

/** "Last updated: September 21, 2026" → "2026-09-21" */
function dataEn(html: string): string | null {
  const m = /Last updated:\s*([A-Z][a-z]+) (\d{1,2}), (\d{4})/.exec(html);
  if (!m) return null;
  const mes = MESES_EN[m[1]];
  return mes ? `${m[3]}-${mes}-${m[2].padStart(2, '0')}` : null;
}

describe('versão do consentimento × "Última atualização" dos HTMLs', () => {
  it.each([
    ['termos.html', TERMS_VERSION],
    ['privacidade.html', PRIVACY_VERSION],
  ])('%s: PT, EN e a constante concordam', (arquivo, constante) => {
    const html = ler(arquivo);
    const pt = dataPt(html);
    const en = dataEn(html);
    expect(pt, `carimbo PT ilegível em ${arquivo}`).not.toBeNull();
    expect(en, `carimbo EN ilegível em ${arquivo}`).not.toBeNull();
    expect(pt).toBe(en);
    expect(constante).toBe(pt);
  });

  it('as constantes têm formato AAAA-MM-DD', () => {
    for (const v of [TERMS_VERSION, PRIVACY_VERSION]) expect(v).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
