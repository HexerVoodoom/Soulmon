import { useState } from 'react';
import { Sparkles, Infinity as InfinityIcon, Shuffle, LoaderCircle } from 'lucide-react';
import iconClose from '../assets/soulmon/icons/icon-close.png';
import { FULL_UNLOCK_SKU, FULL_UNLOCK_PRICE_LABEL, DEMO_ACTIVITY_DAILY_CAP } from '../utils/monetization';
import { purchase, restorePurchases, isBillingAvailable } from '../utils/playBilling';
import type { Entitlement } from '../utils/entitlements';
import type { Language } from '../utils/i18n';

// ---------------------------------------------------------------------------
// Desbloqueio completo DENTRO do jogo.
//
// Até aqui a compra só existia na tela inicial — que o jogador vê uma vez e
// nunca mais. Quem entrou pelo caminho grátis (o principal) não tinha por onde
// comprar depois, mesmo querendo. Estes dois componentes resolvem isso sem
// virar anúncio: o convite (UnlockNudge) só aparece nos dois momentos em que a
// falta do desbloqueio é sentida de verdade —
//   'task-limit'  → bateu o limite de criação do modo grátis
//   'evolution'   → está olhando a árvore de um personagem que não é dele
// e o modal só abre por toque, nunca sozinho.
// ---------------------------------------------------------------------------

export type UnlockReason = 'task-limit' | 'evolution';

interface UnlockAccountModalProps {
  language: Language;
  reason: UnlockReason;
  /** Chamado só depois de o SERVIDOR confirmar a compra. */
  onUnlocked: (ent: Entitlement) => void;
  onClose: () => void;
}

export function UnlockAccountModal({ language, reason, onUnlocked, onClose }: UnlockAccountModalProps) {
  const isPt = language === 'pt-BR';
  const [loading, setLoading] = useState<'buy' | 'restore' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const unavailable = isPt
    ? 'A compra acontece pela Google Play, dentro do app Android. No navegador não dá para cobrar.'
    : 'Purchases go through Google Play, inside the Android app. The browser cannot charge you.';

  const handleBuy = async () => {
    if (!isBillingAvailable()) { setMessage(unavailable); return; }
    setLoading('buy');
    setMessage(null);
    const result = await purchase(FULL_UNLOCK_SKU);
    setLoading(null);
    if (result.ok) { onUnlocked(result.ent); return; }
    setMessage(result.reason === 'cancelled'
      ? (isPt ? 'Compra cancelada.' : 'Purchase cancelled.')
      : (isPt
        ? 'Não foi possível concluir a compra agora. Tente de novo em instantes.'
        : "Couldn't complete the purchase right now. Please try again shortly."));
  };

  // Quem reinstalou o app (ou trocou de aparelho) já pagou — sem isto,
  // pagaria de novo.
  const handleRestore = async () => {
    if (!isBillingAvailable()) { setMessage(unavailable); return; }
    setLoading('restore');
    setMessage(null);
    const result = await restorePurchases();
    setLoading(null);
    if (result.ok && result.ent.tier === 'paid') { onUnlocked(result.ent); return; }
    setMessage(result.ok
      ? (isPt
        ? 'Restauramos suas compras, mas o desbloqueio completo não está nesta conta Google.'
        : 'Purchases restored, but the full unlock is not on this Google account.')
      : result.reason === 'nothing-to-restore'
        ? (isPt ? 'Nenhuma compra encontrada nesta conta Google.' : 'No purchase found on this Google account.')
      : result.reason === 'order-in-use'
        ? (isPt
          ? 'Essa compra já está vinculada a outra conta Soulmon. Entre com o e-mail que você usou na compra.'
          : 'That purchase is already tied to another Soulmon account. Sign in with the email you bought it with.')
        : (isPt ? 'Não foi possível restaurar agora.' : 'Could not restore right now.'));
  };

  const perk = (Icon: typeof Sparkles, title: string, desc: string) => (
    <div className="sm-card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        width: 38, height: 38, borderRadius: 12, background: 'var(--sm-primary-soft)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} strokeWidth={2.2} color="var(--sm-primary)" />
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: 'var(--sm-ink)' }}>{title}</p>
        <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--sm-muted)', lineHeight: 1.45 }}>{desc}</p>
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(20,15,40,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
    }}>
      <div className="sm-card" style={{
        background: 'var(--sm-bg)', width: '100%', maxWidth: 400, maxHeight: '88vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: 'var(--sm-surface)', borderBottom: '1px solid var(--sm-line)',
        }}>
          <span style={{ fontWeight: 800, fontSize: '1.02rem', color: 'var(--sm-ink)' }}>
            {isPt ? 'Soulmon completo' : 'Full Soulmon'}
          </span>
          <button onClick={onClose} className="sm-nav-btn" aria-label={isPt ? 'Fechar' : 'Close'}>
            <img src={iconClose} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--sm-ink)', lineHeight: 1.55, margin: '0 0 2px' }}>
            {reason === 'task-limit'
              ? (isPt
                ? `No modo grátis dá para criar ${DEMO_ACTIVITY_DAILY_CAP} atividade por dia. No completo, quantas você quiser — e o pet é uma criatura gerada só pra você.`
                : `The free mode lets you create ${DEMO_ACTIVITY_DAILY_CAP} activity a day. In the full game, as many as you want — and your pet is a creature generated just for you.`)
              : (isPt
                ? 'Esta é a árvore de um personagem de demonstração: os três caminhos levam ao mesmo lugar. A sua criatura tem uma árvore própria, com uma forma diferente em cada linha.'
                : "This is a demo character's tree: all three paths lead to the same place. Your own creature has its own tree, with a different form on each line.")}
          </p>

          {perk(Sparkles,
            isPt ? 'Sua criatura, só sua' : 'Your creature, yours alone',
            isPt ? 'O ritual do oráculo gera um Soulmon a partir de quem você é' : 'The oracle ritual generates a Soulmon from who you are')}
          {perk(InfinityIcon,
            isPt ? 'Atividades sem limite' : 'Unlimited activities',
            isPt ? 'Cadastre quantas rotinas quiser, todo dia' : 'Add as many routines as you like, every day')}
          {perk(Shuffle,
            isPt ? 'Reroll liberado' : 'Reroll unlocked',
            isPt ? 'Dá para gerar uma criatura nova quando quiser (custa Créditos)' : 'Generate a brand-new creature whenever you want (costs Credits)')}

          <p style={{ fontSize: '0.74rem', color: 'var(--sm-muted)', margin: '2px 0 0', lineHeight: 1.5 }}>
            {isPt
              ? 'Compra única — seu progresso atual continua exatamente como está.'
              : 'One-time purchase — your current progress stays exactly as it is.'}
          </p>

          {message && (
            <p style={{ fontSize: '0.76rem', color: '#e0483e', margin: '2px 0 0', lineHeight: 1.5 }}>{message}</p>
          )}
        </div>

        <div style={{ padding: 14, borderTop: '1px solid var(--sm-line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="sm-btn" style={{ width: '100%' }} onClick={handleBuy} disabled={loading !== null}>
            {loading === 'buy'
              ? <LoaderCircle size={18} strokeWidth={2.4} style={{ animation: 'unlockspin 1.1s linear infinite' }} />
              : (isPt ? `Desbloquear — ${FULL_UNLOCK_PRICE_LABEL}` : `Unlock — ${FULL_UNLOCK_PRICE_LABEL}`)}
          </button>
          <button className="sm-btn sm-btn-secondary" style={{ width: '100%' }} onClick={handleRestore} disabled={loading !== null}>
            {loading === 'restore'
              ? <LoaderCircle size={16} strokeWidth={2.4} style={{ animation: 'unlockspin 1.1s linear infinite' }} />
              : (isPt ? 'Já comprei — restaurar' : 'Already bought — restore')}
          </button>
        </div>
        <style>{`@keyframes unlockspin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

/**
 * Convite discreto — uma linha clicável, sem badge piscando nem contagem
 * regressiva. Só aparece para contas 'demo', e só no contexto que o justifica.
 *
 * `variant='reveal'` é o caso de quem JÁ pagou e saiu do ritual pela metade:
 * não há mais nada a vender, só um ritual a terminar.
 */
export function UnlockNudge({ language, reason, variant = 'buy', onOpen }: {
  language: Language;
  reason: UnlockReason;
  variant?: 'buy' | 'reveal';
  onOpen: () => void;
}) {
  const isPt = language === 'pt-BR';
  if (variant === 'reveal') {
    return (
      <button
        onClick={onOpen}
        className="sm-card"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
          textAlign: 'left', border: 'none', cursor: 'pointer', background: 'var(--sm-primary-soft)',
        }}
      >
        <Sparkles size={16} strokeWidth={2.2} color="var(--sm-primary)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--sm-primary)' }}>
            {isPt ? 'Falta revelar a sua criatura' : 'Your creature is still unrevealed'}
          </span>
          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--sm-ink)', lineHeight: 1.45 }}>
            {isPt
              ? 'Você já desbloqueou o completo — responda o ritual quando quiser.'
              : 'You already unlocked the full game — answer the ritual whenever you like.'}
          </span>
        </span>
      </button>
    );
  }
  return (
    <button
      onClick={onOpen}
      className="sm-card"
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
        textAlign: 'left', border: 'none', cursor: 'pointer', background: 'var(--sm-primary-soft)',
      }}
    >
      <Sparkles size={16} strokeWidth={2.2} color="var(--sm-primary)" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--sm-primary)' }}>
          {reason === 'task-limit'
            ? (isPt ? 'Quer criar sem limite?' : 'Want to create without limits?')
            : (isPt ? 'Quer a SUA árvore de evoluções?' : 'Want YOUR own evolution tree?')}
        </span>
        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--sm-ink)', lineHeight: 1.45 }}>
          {isPt
            ? `Desbloqueie o Soulmon completo por ${FULL_UNLOCK_PRICE_LABEL} — seu progresso continua.`
            : `Unlock the full Soulmon for ${FULL_UNLOCK_PRICE_LABEL} — your progress stays.`}
        </span>
      </span>
    </button>
  );
}
