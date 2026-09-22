// ---------------------------------------------------------------------------
// AVISO DE TERMOS ATUALIZADOS — função PURA, dono único da regra.
//
// Decisão #24 do QA geral (21/09/2026): quando `TERMS_VERSION` ou
// `PRIVACY_VERSION` sobem, quem já aceitou a versão anterior vê um BANNER
// informativo — nunca um modal, nunca um re-aceite obrigatório. O motivo é o
// mesmo de `consent.ts`: barrar quem já joga por causa de um texto que mudou
// seria tirar o jogo de alguém por um problema nosso. O aviso existe para que
// a pessoa possa LER, não para colher assinatura.
//
// Quem nunca registrou consentimento (save anterior aos Termos) NÃO vê o
// banner: não existe "versão anterior" para comparar, e o onboarding é o
// lugar do primeiro aceite — não o slot de avisos da Home.
// ---------------------------------------------------------------------------
import type { ConsentRecord } from './consent';

/** Versão em formato de data (AAAA-MM-DD), o único que `consent.ts` grava. */
const VERSAO_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `a` é anterior a `b`? As versões são datas ISO, então a comparação lexical
 * está certa. Versão ilegível (`'desconhecida'`, que `normalizeConsent` põe
 * quando o campo faltava) conta como ANTERIOR: a pessoa aceitou algum texto
 * que não sabemos qual, e o banner só convida a ler.
 */
function anterior(a: string, b: string): boolean {
  if (!VERSAO_RE.test(a)) return true;
  return a < b;
}

/** A marca gravada quando a pessoa toca "Ok": as duas versões que ela viu. */
export function marcaAvisoTermos(termsVersion: string, privacyVersion: string): string {
  return `${termsVersion}|${privacyVersion}`;
}

/**
 * Verdadeiro quando há prova de consentimento a uma versão ANTERIOR à atual
 * de qualquer um dos dois documentos, e o aviso desta versão ainda não foi
 * dispensado (`avisoVisto` é o que `marcaAvisoTermos` gravou, ou `null`).
 */
export function precisaAvisarTermos(
  consent: ConsentRecord | undefined | null,
  termsVersion: string,
  privacyVersion: string,
  avisoVisto: string | null = null,
): boolean {
  if (!consent) return false;
  if (avisoVisto === marcaAvisoTermos(termsVersion, privacyVersion)) return false;
  return anterior(consent.termsVersion, termsVersion) || anterior(consent.privacyVersion, privacyVersion);
}

/** Qual documento mudou desde o aceite — o banner só titula e linka o que mudou. */
export type DocMudado = 'terms' | 'privacy' | 'both';

/**
 * Diz QUAL documento é mais novo que o aceito. Só faz sentido quando
 * `precisaAvisarTermos` é verdadeiro; se nenhum for anterior (não deveria
 * acontecer nesse caso), devolve `'both'` — o banner genérico, nunca um
 * título que afirme uma mudança que não houve num só documento.
 */
export function qualDocMudou(
  consent: ConsentRecord,
  termsVersion: string,
  privacyVersion: string,
): DocMudado {
  const t = anterior(consent.termsVersion, termsVersion);
  const p = anterior(consent.privacyVersion, privacyVersion);
  if (t && !p) return 'terms';
  if (p && !t) return 'privacy';
  return 'both';
}
