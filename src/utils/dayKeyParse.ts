/**
 * Lê uma chave de dia como dia LOCAL do aparelho.
 *
 * `new Date('YYYY-MM-DD')` é meia-noite UTC: em fuso negativo (todo o Brasil)
 * cai no dia ANTERIOR. Este é o único leitor de chave de dia que não erra isso.
 * Aceita as duas formas que o app grava: `YYYY-MM-DD` e a de `toDateString`
 * (`Mon Oct 12 2026`, que o `Date` já lê como local). Ilegível → `null`.
 */
export function parseDayKeyLocal(key: string): Date | null {
  if (typeof key !== 'string' || !key) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (iso) {
    const [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
    const date = new Date(y, m - 1, d);
    // 2026-02-31 rolaria para março: recusa em vez de adivinhar.
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
  }
  const nativo = new Date(key);
  return Number.isNaN(nativo.getTime()) ? null : nativo;
}
