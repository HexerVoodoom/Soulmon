import { useSyncExternalStore } from 'react';
import type { Entitlement } from './entitlements';
import type { Language } from './i18n';

/**
 * ASSINATURA COSMÉTICA TRIMESTRAL — o lado do CLIENTE (D10, `docs/ASSINATURA-SPEC.md`).
 *
 * O que ela é: um conjunto cosmético (cenário + decoração) por trimestre, a
 * R$ 9,90 a cada 3 meses, SEM teste grátis. O que ela NUNCA é: Créditos,
 * benefício de cuidado, nem retirada do que já foi resgatado.
 *
 * A vigência mora FORA do GameState de propósito: ela vem do servidor (que
 * perguntou à Google), fica numa store de módulo e só é lida pela vitrine e pela
 * tela de Configurações. Ficar fora do save é o que impede regra de jogo de
 * esbarrar nela — o guard `src/security/subscriptionBoundary.contract.test.ts`
 * trava o resto.
 */

/** Id do produto de assinatura no Play Console (espelha `SUBSCRIPTION_SKU` do servidor). */
export const SUBSCRIPTION_SKU = 'soulmon_cosmetic_quarterly';

/** `applicationId` do app — o `package` do link da Central de assinaturas. */
export const ANDROID_PACKAGE = 'com.hexervoodoom.soulmon';

/**
 * Link oficial para gerenciar/cancelar uma assinatura específica na Play
 * (https://developer.android.com/google/play/billing/subscriptions#deep-link).
 */
export function manageSubscriptionUrl(sku: string = SUBSCRIPTION_SKU, pkg: string = ANDROID_PACKAGE): string {
  return `https://play.google.com/store/account/subscriptions?sku=${encodeURIComponent(sku)}&package=${encodeURIComponent(pkg)}`;
}

// ───────────────────────────────────────────────────────────── a store ──

export interface SubscriptionStatus {
  /** A vitrine do trimestre está aberta (servidor + Google disseram que sim). */
  active: boolean;
  /** Fim do período atual, epoch ms (0 = nunca assinou). */
  until: number;
}

const NEVER: SubscriptionStatus = { active: false, until: 0 };
let current: SubscriptionStatus = NEVER;
const listeners = new Set<() => void>();

export function getSubscriptionStatus(): SubscriptionStatus {
  return current;
}

/**
 * Atualiza a store com a resposta do servidor. `null` (offline, sem sessão) NÃO
 * fecha a vitrine: na dúvida mantém o último estado conhecido — o servidor é
 * quem manda, e o que já foi resgatado vive no save de qualquer forma.
 */
export function setSubscriptionFromEntitlement(ent: Pick<Entitlement, 'subActive' | 'subUntil'> | null): void {
  if (!ent) return;
  const next: SubscriptionStatus = { active: ent.subActive === true, until: ent.subUntil ?? 0 };
  if (next.active === current.active && next.until === current.until) return;
  current = next;
  listeners.forEach(l => l());
}

/** Só para os testes. */
export function _resetSubscriptionStatus(): void {
  current = NEVER;
  listeners.forEach(l => l());
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export function useSubscriptionStatus(): SubscriptionStatus {
  return useSyncExternalStore(subscribe, getSubscriptionStatus, getSubscriptionStatus);
}

// ─────────────────────────────────────────────────── texto de divulgação ──

/**
 * O período ISO 8601 da Play → "a cada 3 meses". `null` quando o período não é
 * um que sabemos dizer: sem frase certa não se oferece a compra.
 */
export function periodPhrase(period: string, language: Language): string | null {
  const pt = language === 'pt-BR';
  switch (period) {
    case 'P1W': return pt ? 'a cada semana' : 'every week';
    case 'P1M': return pt ? 'todo mês' : 'every month';
    case 'P2M': return pt ? 'a cada 2 meses' : 'every 2 months';
    case 'P3M': return pt ? 'a cada 3 meses' : 'every 3 months';
    case 'P6M': return pt ? 'a cada 6 meses' : 'every 6 months';
    case 'P1Y': return pt ? 'todo ano' : 'every year';
    default: return null;
  }
}

/**
 * A divulgação PRÉ-COMPRA (política de assinaturas da Play): preço localizado,
 * periodicidade, renovação automática, como cancelar — e o que NÃO muda.
 * Voz do app: diz o que é, sem pressão, sem urgência fabricada.
 */
export function subscriptionDisclosure(language: Language, price: string, period: string): string[] | null {
  const when = periodPhrase(period, language);
  if (!when) return null;
  if (language === 'pt-BR') {
    return [
      'Um conjunto novo de cenário e decoração a cada trimestre. É só enfeite: não dá Créditos e não muda o cuidado nem a força do seu Soulmon.',
      `${price} ${when}. A assinatura renova sozinha ${when} até você cancelar. A cobrança é da Google Play.`,
      'O que você resgatou fica seu para sempre, mesmo se cancelar.',
      'Para cancelar, toque em "Gerenciar assinatura" (Google Play). Cancelar vale a partir da próxima renovação: o período já pago continua.',
    ];
  }
  return [
    'A new set of scenery and decor every quarter. Purely decorative: it gives no Credits and changes nothing about your Soulmon\'s care or strength.',
    `${price} ${when}. The subscription renews automatically ${when} until you cancel. Google Play handles billing.`,
    'Everything you claimed stays yours forever, even if you cancel.',
    'To cancel, tap "Manage subscription" (Google Play). Canceling takes effect at the next renewal: the period you already paid for continues.',
  ];
}
