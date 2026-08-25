// ---------------------------------------------------------------------------
// Consentimento + idade mínima — funções PURAS (`now: Date` SEMPRE por
// parâmetro), dono único da regra. O onboarding e os testes chamam daqui; nada
// recalcula idade "na mão" em outro arquivo (footgun 9).
//
// Duas regras vivem aqui:
//  1. **18+ por autodeclaração** (D-06): a MESMA data de nascimento que o mapa
//     astral já pede também confirma a idade mínima. Não existe segundo campo.
//  2. **Prova do consentimento**: timestamp + versão de CADA documento aceito.
//     Guardar só um booleano não diz A QUE texto a pessoa disse sim.
//
// Save antigo (quem já jogava antes destes Termos existirem) **não tem** o
// registro — e isso NUNCA pode virar bloqueio: `normalizeConsent` devolve
// `undefined` e `isAgeBlocked` só bloqueia quando há data e ela é de menor.
// Barrar quem já joga por causa de um campo que não existia no save dele seria
// tirar o jogo de alguém por um problema nosso.
// ---------------------------------------------------------------------------

/** Idade mínima do Soulmon (D-06). */
export const MIN_AGE_YEARS = 18;

/**
 * Versão dos documentos aceitos. Formato de data (AAAA-MM-DD) porque é o mesmo
 * carimbo que aparece no "Última atualização" dos HTMLs — quem lê o save
 * consegue achar o texto exato que foi aceito. **Ao editar `public/termos.html`
 * ou `public/privacidade.html` de forma relevante, suba a versão aqui.**
 */
export const TERMS_VERSION = '2026-08-25';
export const PRIVACY_VERSION = '2026-08-25';

export interface ConsentRecord {
  /** ISO de quando o usuário marcou a caixa. */
  acceptedAt: string;
  termsVersion: string;
  privacyVersion: string;
}

/** O registro a gravar no save quando a pessoa marca a caixa. */
export function buildConsentRecord(now: Date = new Date()): ConsentRecord {
  return {
    acceptedAt: now.toISOString(),
    termsVersion: TERMS_VERSION,
    privacyVersion: PRIVACY_VERSION,
  };
}

/**
 * Idade em anos completos na data `now`. `birthDate` no formato AAAA-MM-DD
 * (o mesmo que o onboarding já monta). Data inválida devolve `null` — quem
 * chama decide, e "não sei a idade" nunca vira "é menor".
 */
export function ageOn(birthDate: string, now: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate ?? '');
  if (!m) return null;
  const year = Number(m[1]), month = Number(m[2]), day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  let age = now.getFullYear() - year;
  const antesDoAniversario =
    now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day);
  if (antesDoAniversario) age -= 1;
  return age;
}

/** ≥18 anos completos. Data ilegível NÃO é considerada maior de idade. */
export function isAdult(birthDate: string, now: Date = new Date()): boolean {
  const age = ageOn(birthDate, now);
  return age !== null && age >= MIN_AGE_YEARS;
}

/**
 * A pergunta que o onboarding faz ao avançar do passo da data: **esta data
 * bloqueia?** Só bloqueia data legível de menor de 18. Sem data (save antigo,
 * campo vazio) o fluxo segue — é a trava que impede barrar quem já joga.
 */
export function isAgeBlocked(birthDate: string | undefined | null, now: Date = new Date()): boolean {
  if (!birthDate) return false;
  const age = ageOn(birthDate, now);
  if (age === null) return false;
  return age < MIN_AGE_YEARS;
}

/**
 * Normalização de load (`?? padrão` SEMPRE — CLAUDE.md): save antigo não tem o
 * campo e volta `undefined`, sem lançar e sem inventar consentimento.
 */
export function normalizeConsent(raw: unknown): ConsentRecord | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.acceptedAt !== 'string' || !r.acceptedAt) return undefined;
  return {
    acceptedAt: r.acceptedAt,
    termsVersion: typeof r.termsVersion === 'string' ? r.termsVersion : 'desconhecida',
    privacyVersion: typeof r.privacyVersion === 'string' ? r.privacyVersion : 'desconhecida',
  };
}
