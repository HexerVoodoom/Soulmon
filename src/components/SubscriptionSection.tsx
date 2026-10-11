import { useEffect, useState } from 'react';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';
import { isBillingAvailable, getSubscriptionOffer, purchaseSubscription, useStoreOpen, billingDisabledMessage, type SubscriptionOffer } from '../utils/playBilling';
import {
  SUBSCRIPTION_SKU, manageSubscriptionUrl, subscriptionDisclosure,
  setSubscriptionFromEntitlement, useSubscriptionStatus,
} from '../utils/subscription';

/**
 * Assinatura cosmética trimestral, dentro de "Sua conta" (D10).
 *
 * O que a tela precisa dizer ANTES da compra (política de assinaturas da Play):
 * o preço (o do ProductDetails, na moeda de quem olha — nunca escrito à mão), de
 * quanto em quanto tempo cobra, que renova sozinha e como cancelar. Sem teste
 * grátis, sem urgência, sem "melhor oferta": a voz é a do app, que diz o que é e
 * deixa a pessoa decidir.
 *
 * Sem preço real da Play (web, Play fora, produto ainda não criado) NÃO se oferece
 * a compra. "Gerenciar assinatura" abre a Central de assinaturas da Play no item.
 */
export function SubscriptionSection({ language }: { language: Language }) {
  const isPt = language === 'pt-BR';
  const status = useSubscriptionStatus();
  const available = isBillingAvailable();
  /** Kill-switch `BILLING_DISABLED`: esconde o "Assinar"; gerenciar continua. */
  const lojaAberta = useStoreOpen();
  const lojaFechada = available && lojaAberta === false;
  /** `undefined` = ainda consultando; `null` = a Play não deu preço. */
  const [offer, setOffer] = useState<SubscriptionOffer | null | undefined>(available ? undefined : null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!available) return;
    let cancelled = false;
    getSubscriptionOffer(SUBSCRIPTION_SKU).then(o => { if (!cancelled) setOffer(o); });
    return () => { cancelled = true; };
  }, [available]);

  const date = (ms: number) => new Date(ms).toLocaleDateString(isPt ? 'pt-BR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const disclosure = offer ? subscriptionDisclosure(language, offer.price, offer.period) : null;

  const subscribe = async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    const r = await purchaseSubscription(SUBSCRIPTION_SKU);
    setBusy(false);
    if (r.ok) {
      setSubscriptionFromEntitlement(r.ent);
      setMessage(isPt
        ? 'Assinatura ativa. O conjunto do trimestre está em Cenários e Decoração, na loja.'
        : 'Subscription active. The quarter\'s set is in Scenery and Decor, in the shop.');
      return;
    }
    if (r.reason === 'cancelled') return; // fechar a janela da Play não é erro
    if (r.reason === 'pending') {
      setMessage(isPt
        ? 'Pagamento em análise na Google Play. Quando confirmar, a assinatura abre sozinha.'
        : 'Payment is being reviewed by Google Play. Once confirmed, the subscription opens by itself.');
    } else if (r.reason === 'order-in-use') {
      setMessage(isPt
        ? 'Esta assinatura já está ligada a outra conta Soulmon. Entre com o e-mail usado na compra.'
        : 'This subscription is already linked to another Soulmon account. Sign in with the email used at purchase.');
    } else if (r.reason === 'no-base-offer' || r.reason === 'offer-not-allowed') {
      setMessage(isPt ? 'Essa assinatura não está disponível agora.' : 'This subscription is not available right now.');
    } else {
      setMessage(isPt
        ? 'Não deu para concluir agora. Se a cobrança saiu, a assinatura aparece sozinha quando o app abrir de novo.'
        : 'Could not finish right now. If you were charged, the subscription shows up by itself next time the app opens.');
    }
  };

  return (
    <div data-subscription-section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>
        {isPt ? 'Assinatura de cenários e decoração' : 'Scenery and decor subscription'}
      </p>

      {status.until > 0 && (
        <p data-subscription-status={status.active ? 'active' : 'ended'} style={{ ...sm2Hint, margin: 0 }}>
          {status.active
            ? (isPt ? `Assinatura ativa. Período atual até ${date(status.until)}.` : `Subscription active. Current period until ${date(status.until)}.`)
            : (isPt ? `Sua assinatura terminou em ${date(status.until)}. O que você resgatou continua seu.` : `Your subscription ended on ${date(status.until)}. What you claimed is still yours.`)}
        </p>
      )}

      {!available && (
        <p style={{ ...sm2Hint, margin: 0 }}>
          {isPt ? 'A assinatura fica disponível no app Android (Google Play).' : 'The subscription is available in the Android app (Google Play).'}
        </p>
      )}

      {available && !status.active && offer === undefined && (
        <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Consultando o preço na Google Play…' : 'Checking the price on Google Play…'}</p>
      )}

      {available && !status.active && offer !== undefined && !disclosure && (
        <p style={{ ...sm2Hint, margin: 0 }}>
          {isPt ? 'A assinatura não está disponível agora. Tente de novo mais tarde.' : 'The subscription is not available right now. Try again later.'}
        </p>
      )}

      {lojaFechada && !status.active && (
        <p data-subscription-closed style={{ ...sm2Hint, margin: 0 }}>{billingDisabledMessage(isPt)}</p>
      )}

      {available && !lojaFechada && !status.active && disclosure && (
        <>
          <div data-subscription-disclosure style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {disclosure.map(line => <p key={line} style={{ ...sm2Hint, margin: 0 }}>{line}</p>)}
          </div>
          <button type="button" data-subscription-subscribe onClick={subscribe} disabled={busy} style={{ ...sm2Button('primary', busy), width: '100%' }}>
            {busy
              ? (isPt ? 'Abrindo a Google Play…' : 'Opening Google Play…')
              : (isPt ? `Assinar por ${offer!.price}` : `Subscribe for ${offer!.price}`)}
          </button>
        </>
      )}

      {(available || status.until > 0) && (
        <a
          data-subscription-manage
          href={manageSubscriptionUrl()}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...sm2Button('outline'), width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
        >
          {isPt ? 'Gerenciar assinatura' : 'Manage subscription'}
        </a>
      )}

      <p aria-live="polite" style={{ ...sm2Hint, margin: 0, minHeight: 18 }}>{message}</p>
    </div>
  );
}
