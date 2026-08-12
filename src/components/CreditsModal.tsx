import { useState, useEffect } from 'react';
import { Play, ShoppingCart, Loader as LoaderIcon } from 'lucide-react';
import iconGem from '../assets/soulmon/icons/icon-gem.png';
import iconHeart from '../assets/icons/icon-heart-item.png';
import iconReset from '../assets/soulmon/icons/icon-reset.png';
import iconClose from '../assets/soulmon/icons/icon-close.png';
import {
  CREDIT_PACKS, type CreditPack, AD_REWARD_CREDITS, AD_DAILY_CAP, REROLL_COST_CREDITS,
  HEART_COST_CREDITS, FULL_UNLOCK_PRICE_LABEL,
} from '../utils/monetization';
import { fetchEntitlement } from '../utils/entitlements';
import { isBillingAvailable } from '../utils/playBilling';
import type { Language } from '../utils/i18n';

/**
 * Créditos — moeda premium (dinheiro real), separada dos Bits (moeda dos
 * minijogos). Gasta em: reroll de personagem, cura instantânea de coração,
 * itens/cenários da loja (mesmos preços em Bits também funcionam lá — os
 * créditos são um jeito ALTERNATIVO de conseguir, via dinheiro real ou anúncio).
 * SCAFFOLD: compra de pacotes é placeholder (utils/monetization.ts nunca
 * cobra de verdade ainda); anúncio recompensado é simulado (delay, sem SDK).
 */
interface CreditsModalProps {
  language: Language;
  credits: number;
  accountTier: 'demo' | 'paid';
  healthPoints: number;
  maxHealthPoints: number;
  /** Tem um perfil de oráculo salvo (utils/oracle.ts) — só contas 'paid' têm. */
  canReroll: boolean;
  onWatchAd: () => Promise<boolean>;
  onBuyPack: (pack: CreditPack) => Promise<boolean>;
  onInstantHeal: () => Promise<boolean>;
  onReroll: () => Promise<boolean>;
  onClose: () => void;
}

export function CreditsModal({
  language, credits, accountTier, healthPoints, maxHealthPoints, canReroll,
  onWatchAd, onBuyPack, onInstantHeal, onReroll, onClose,
}: CreditsModalProps) {
  const isPt = language === 'pt-BR';
  const [adLoading, setAdLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [packLoading, setPackLoading] = useState<string | null>(null);
  const [rerollLoading, setRerollLoading] = useState(false);
  const [confirmingReroll, setConfirmingReroll] = useState(false);

  // Quantos anúncios ainda cabem hoje — vem do SERVIDOR (o cap que vale é o
  // dele). Enquanto não chega, assume o cheio só pra não piscar desabilitado.
  const [adsLeft, setAdsLeft] = useState(AD_DAILY_CAP);
  // O anúncio recompensado só aparece quando o servidor confirma que a
  // verificação do AdMob está ligada — senão seria um botão que dá crédito
  // sem anúncio nenhum. Começa escondido e só aparece se o servidor liberar.
  const [adsEnabled, setAdsEnabled] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchEntitlement().then(ent => {
      if (cancelled || !ent) return;
      setAdsLeft(ent.adsLeft);
      setAdsEnabled(!!ent.adsEnabled);
    });
    return () => { cancelled = true; };
  }, [credits]);

  const billingAvailable = isBillingAvailable();
  const canHeal = credits >= HEART_COST_CREDITS && healthPoints < maxHealthPoints;
  const canAffordReroll = credits >= REROLL_COST_CREDITS;

  const flash = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(null), 3200); };

  const handleWatchAd = async () => {
    if (adLoading || adsLeft === 0) return;
    setAdLoading(true);
    const ok = await onWatchAd();
    setAdLoading(false);
    if (ok) setAdsLeft(n => Math.max(0, n - 1));
    flash(ok
      ? (isPt ? `+${AD_REWARD_CREDITS} créditos!` : `+${AD_REWARD_CREDITS} credits!`)
      : (isPt ? 'Limite diário de anúncios atingido.' : 'Daily ad limit reached.'));
  };

  const handleBuyPack = async (pack: CreditPack) => {
    if (!billingAvailable) {
      flash(isPt
        ? 'Compras só no app Android (Google Play).'
        : 'Purchases are only available in the Android app (Google Play).');
      return;
    }
    setPackLoading(pack.id);
    const ok = await onBuyPack(pack);
    setPackLoading(null);
    flash(ok
      ? (isPt ? `+${pack.credits} créditos!` : `+${pack.credits} credits!`)
      : (isPt ? 'Compra não concluída.' : 'Purchase not completed.'));
  };

  const handleHeal = async () => {
    const ok = await onInstantHeal();
    flash(ok
      ? (isPt ? '+1 coração curado!' : '+1 heart healed!')
      : (isPt ? 'Não foi possível curar agora.' : 'Could not heal right now.'));
  };

  const handleRerollConfirm = async () => {
    setConfirmingReroll(false);
    setRerollLoading(true);
    const ok = await onReroll();
    setRerollLoading(false);
    flash(ok
      ? (isPt ? 'Novo personagem gerado — você voltou pra Rookie!' : 'New character generated — back to Rookie!')
      : (isPt ? 'Não foi possível fazer o reroll agora.' : 'Could not reroll right now.'));
  };

  const sectionTitle = (text: string) => (
    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sm-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '4px 0 8px' }}>
      {text}
    </p>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(20,15,40,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div className="sm-card" style={{ background: 'var(--sm-bg)', width: '100%', maxWidth: 420, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--sm-surface)', borderBottom: '1px solid var(--sm-line)' }}>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--sm-ink)' }}>
            {isPt ? 'Créditos' : 'Credits'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="sm-card" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px' }}>
              <img src={iconGem} alt="" width={16} height={16} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--sm-ink)' }}>{credits}</span>
            </span>
            <button onClick={onClose} className="sm-nav-btn" aria-label={isPt ? 'Fechar' : 'Close'}>
              <img src={iconClose} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontSize: '0.76rem', color: 'var(--sm-muted)', lineHeight: 1.5, margin: '0 0 4px' }}>
            {isPt
              ? 'Moeda premium (separada dos Bits dos minijogos) — reroll de personagem, cura instantânea e ajuda extra na loja.'
              : "Premium currency (separate from minigame Bits) — character reroll, instant healing, and extra help in the shop."}
          </p>

          {message && (
            <div className="sm-card" style={{ padding: '8px 12px', background: 'var(--sm-primary-soft)', border: 'none' }}>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--sm-primary)', fontWeight: 600 }}>{message}</p>
            </div>
          )}

          {/* Ganhar créditos */}
          {sectionTitle(isPt ? 'Ganhar créditos' : 'Earn credits')}

          {adsEnabled && (
            <button
              onClick={handleWatchAd}
              disabled={adLoading || adsLeft === 0}
              className="sm-card"
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: 12, width: '100%', textAlign: 'left',
                cursor: adsLeft === 0 ? 'default' : 'pointer', opacity: adsLeft === 0 ? 0.55 : 1, border: 'none',
              }}
            >
              <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {adLoading ? <LoaderIcon size={18} strokeWidth={2.2} style={{ animation: 'creditspin 1s linear infinite' }} /> : <Play size={18} strokeWidth={2.2} color="var(--sm-primary)" />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: 'var(--sm-ink)' }}>
                  {isPt ? `Assistir anúncio (+${AD_REWARD_CREDITS})` : `Watch ad (+${AD_REWARD_CREDITS})`}
                </p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--sm-muted)' }}>
                  {adLoading
                    ? (isPt ? 'Carregando anúncio…' : 'Loading ad…')
                    : adsLeft === 0
                      ? (isPt ? 'Limite diário atingido — volte amanhã.' : 'Daily limit reached — come back tomorrow.')
                      : (isPt ? `${adsLeft} de ${AD_DAILY_CAP} restantes hoje` : `${adsLeft} of ${AD_DAILY_CAP} left today`)}
                </p>
              </div>
            </button>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CREDIT_PACKS.map(pack => (
              <div key={pack.id} className="sm-card" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShoppingCart size={17} strokeWidth={2.2} color="var(--sm-muted)" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: 'var(--sm-ink)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <img src={iconGem} alt="" width={15} height={15} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} /> {pack.credits}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--sm-muted)' }}>{pack.priceLabel}</p>
                </div>
                <button
                  onClick={() => handleBuyPack(pack)}
                  disabled={packLoading === pack.id}
                  className="sm-btn sm-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.72rem', flexShrink: 0 }}
                >
                  {packLoading === pack.id
                    ? <LoaderIcon size={14} strokeWidth={2.4} style={{ animation: 'creditspin 1s linear infinite' }} />
                    : (isPt ? 'Comprar' : 'Buy')}
                </button>
              </div>
            ))}
          </div>

          {/* Gastar créditos */}
          {sectionTitle(isPt ? 'Gastar créditos' : 'Spend credits')}

          <button
            onClick={handleHeal}
            disabled={!canHeal}
            className="sm-card"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, width: '100%', textAlign: 'left', border: 'none', cursor: canHeal ? 'pointer' : 'default', opacity: canHeal ? 1 : 0.55 }}
          >
            <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src={iconHeart} alt="" width={20} height={20} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: 'var(--sm-ink)' }}>
                {isPt ? 'Curar 1 coração agora' : 'Heal 1 heart now'}
              </p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--sm-muted)' }}>
                {healthPoints >= maxHealthPoints
                  ? (isPt ? 'Coração já está cheio.' : 'Heart is already full.')
                  : (isPt ? `Custa ${HEART_COST_CREDITS} créditos` : `Costs ${HEART_COST_CREDITS} credits`)}
              </p>
            </div>
          </button>

          {accountTier === 'paid' && canReroll && (
            <button
              onClick={() => setConfirmingReroll(true)}
              disabled={!canAffordReroll || rerollLoading}
              className="sm-card"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, width: '100%', textAlign: 'left', border: 'none', cursor: canAffordReroll ? 'pointer' : 'default', opacity: canAffordReroll ? 1 : 0.55 }}
            >
              <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {rerollLoading ? <LoaderIcon size={18} strokeWidth={2.2} style={{ animation: 'creditspin 1s linear infinite' }} /> : <img src={iconReset} alt="" width={20} height={20} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: 'var(--sm-ink)' }}>
                  {isPt ? 'Reroll de personagem' : 'Character reroll'}
                </p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--sm-muted)' }}>
                  {isPt ? `Custa ${REROLL_COST_CREDITS} créditos — volta pra Rookie com um Soulmon novo` : `Costs ${REROLL_COST_CREDITS} credits — resets to Rookie with a brand-new Soulmon`}
                </p>
              </div>
            </button>
          )}

          {accountTier === 'demo' && (
            <p style={{ fontSize: '0.72rem', color: 'var(--sm-muted)', textAlign: 'center', margin: '4px 0 0', lineHeight: 1.5 }}>
              {isPt
                ? `Reroll é exclusivo de contas completas — desbloqueie por ${FULL_UNLOCK_PRICE_LABEL}.`
                : `Reroll is exclusive to unlocked accounts — unlock for ${FULL_UNLOCK_PRICE_LABEL}.`}
            </p>
          )}
        </div>

        <style>{`@keyframes creditspin{to{transform:rotate(360deg)}}`}</style>
      </div>

      {/* Confirmação de reroll — ação destrutiva (reseta evolução pro Rookie) */}
      {confirmingReroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ zIndex: 130 }}>
          <div className="sm-card p-6 max-w-sm w-full">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--sm-ink)', marginBottom: 16 }}>
              {isPt ? '⚠️ Confirmar reroll' : '⚠️ Confirm reroll'}
            </h3>
            <p style={{ color: 'var(--sm-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
              {isPt
                ? `Isso troca seu Soulmon por um personagem NOVO e reseta sua evolução pra Rookie. Suas atividades, tarefas e Bits continuam. Custa ${REROLL_COST_CREDITS} créditos. Continuar?`
                : `This swaps your Soulmon for a brand-new character and resets your evolution to Rookie. Your activities, tasks, and Bits stay. Costs ${REROLL_COST_CREDITS} credits. Continue?`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmingReroll(false)} className="sm-btn sm-btn-secondary flex-1">
                {isPt ? 'Cancelar' : 'Cancel'}
              </button>
              <button onClick={handleRerollConfirm} className="sm-btn flex-1">
                {isPt ? 'Sim, fazer reroll' : 'Yes, reroll'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
