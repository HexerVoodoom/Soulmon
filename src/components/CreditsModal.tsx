import { useState, useEffect } from 'react';
import { Icon } from './ui/Icon';
import { ModalSheet, sm2Button, sm2Hint, sm2Text, sm2TitleStyle } from './form/FormKit';
import {
  CREDIT_PACKS, type CreditPack, AD_REWARD_CREDITS, AD_DAILY_CAP, REROLL_COST_CREDITS,
  HEART_COST_CREDITS, FULL_UNLOCK_PRICE_LABEL,
} from '../utils/monetization';
import { fetchEntitlement } from '../utils/entitlements';
import { isBillingAvailable } from '../utils/playBilling';
import type { Language } from '../utils/i18n';

/**
 * CRÉDITOS — a moeda de DINHEIRO REAL, e a única das três que vive no
 * servidor (`ent:<saveId>`). Revamp minimalista.
 *
 * ─── O desenho ÚNICO dos Créditos ─────────────────────────────────────────
 * `Icon name="diamond"` com tom primário, e **nada mais** — nem `icon-gem.png`,
 * nem o emoji de gem, que antes conviviam com este modal e com a loja na mesma
 * sessão. Bits continuam sem ícone; Emblemas são `military_tech` em ouro.
 * Três moedas, três leituras que não se confundem (regra de produto, com
 * teste travando as fronteiras).
 *
 * ─── O que foi CORTADO ────────────────────────────────────────────────────
 * · Os 3 ícones vetoriais de terceiro (Play, ShoppingCart, Loader) e 4 PNGs.
 * · **O quadrado de 40px atrás de cada ícone** — ícone nunca dentro de box
 *   (regra do dono). O ícone fica pelado; o alvo de 44px é da LINHA.
 * · **A roda de carregamento** e o `@keyframes` inline que a movia. Botão que
 *   está trabalhando DIZ que está trabalhando; um disco girando não informa
 *   nada que a palavra não informe, e custava uma animação por modal.
 * · **O overlay de confirmação do reroll.** Ação destrutiva continua exigindo
 *   confirmação — mas ela acontece NA LINHA, sem uma segunda camada por cima
 *   de um modal que já é uma camada.
 * · O parágrafo que explicava o que são Créditos: a tela inteira é isso.
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
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [confirmingReroll, setConfirmingReroll] = useState(false);

  // Quantos anúncios ainda cabem hoje — vem do SERVIDOR (o cap que vale é o
  // dele). Enquanto não chega, assume o cheio só pra não piscar desabilitado.
  const [adsLeft, setAdsLeft] = useState(AD_DAILY_CAP);
  // O anúncio recompensado só aparece quando o servidor confirma que a
  // verificação do AdMob está ligada — senão seria um botão que dá crédito sem
  // anúncio nenhum. Começa escondido e só aparece se o servidor liberar (é
  // também o comportamento certo offline: some, em vez de prometer e falhar).
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

  const flash = (text: string, ok: boolean) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 3200);
  };

  /** Toda ação que fala com o servidor passa por aqui: um só dono do estado
   *  "trabalhando", e `finally` sempre — sem ele uma exceção deixava o botão
   *  preso para sempre numa tela que cobra dinheiro real. */
  const run = async (key: string, fn: () => Promise<boolean>, okMsg: string, failMsg: string) => {
    if (busy) return;
    setBusy(key);
    let ok = false;
    try { ok = await fn(); } finally { setBusy(null); }
    flash(ok ? okMsg : failMsg, ok);
    return ok;
  };

  /** Uma linha de ação. O ícone é pelado; a LINHA inteira é o alvo de 44px+. */
  const Row = ({ icon, tone, title, hint, disabled, onClick }: {
    icon: string;
    tone: 'primary' | 'gold' | 'danger' | 'muted';
    title: string;
    hint: string;
    disabled?: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
        minHeight: 64, padding: 12, borderRadius: 16, textAlign: 'left',
        border: '1px solid transparent', backgroundColor: 'var(--sm2-surface-2)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Icon name={icon} size={26} tone={disabled ? 'muted' : tone} />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ ...sm2Text, fontWeight: 500 }}>{title}</span>
        <span style={sm2Hint}>{hint}</span>
      </span>
    </button>
  );

  const sectionTitle = (text: string) => (
    <h2 className="sm2-title" style={{ ...sm2TitleStyle, marginTop: 4 }}>{text}</h2>
  );

  return (
    <ModalSheet
      open
      title={isPt ? 'Créditos' : 'Credits'}
      onClose={onClose}
      language={language}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="diamond" size={22} tone="primary" label={isPt ? 'Créditos' : 'Credits'} />
          <span className="sm2-num" style={{ ...sm2Text, fontWeight: 500 }}>{credits}</span>
        </div>
      }
    >
      {/* Estado da última ação — sempre no DOM, para o leitor de tela anunciar. */}
      <p
        role="status"
        aria-live="polite"
        style={{
          ...sm2Hint, minHeight: 18, margin: 0,
          color: message ? (message.ok ? 'var(--sm2-primary-ink)' : 'var(--sm2-danger-ink)') : 'var(--sm2-muted)',
        }}
      >
        {message?.text ?? (billingAvailable
          ? ''
          : (isPt ? 'Compras só no app Android (Google Play).' : 'Purchases are only available in the Android app (Google Play).'))}
      </p>

      {sectionTitle(isPt ? 'Ganhar' : 'Earn')}

      {adsEnabled && (
        <Row
          icon="play_arrow"
          tone="primary"
          disabled={busy === 'ad' || adsLeft === 0}
          onClick={() => run('ad', onWatchAd,
            isPt ? `+${AD_REWARD_CREDITS} créditos.` : `+${AD_REWARD_CREDITS} credits.`,
            isPt ? 'Limite diário de anúncios atingido.' : 'Daily ad limit reached.')
            .then(ok => { if (ok) setAdsLeft(n => Math.max(0, n - 1)); })}
          title={isPt ? `Assistir anúncio (+${AD_REWARD_CREDITS})` : `Watch ad (+${AD_REWARD_CREDITS})`}
          hint={busy === 'ad'
            ? (isPt ? 'Carregando anúncio…' : 'Loading ad…')
            : adsLeft === 0
              ? (isPt ? 'Limite de hoje atingido — volte amanhã.' : 'Today\'s limit reached — come back tomorrow.')
              : (isPt ? `${adsLeft} de ${AD_DAILY_CAP} restantes hoje` : `${adsLeft} of ${AD_DAILY_CAP} left today`)}
        />
      )}

      {CREDIT_PACKS.map(pack => (
        <Row
          key={pack.id}
          icon="diamond"
          tone="primary"
          disabled={busy !== null || !billingAvailable}
          onClick={() => run(pack.id, () => onBuyPack(pack),
            isPt ? `+${pack.credits} créditos.` : `+${pack.credits} credits.`,
            isPt ? 'Compra não concluída.' : 'Purchase not completed.')}
          title={`${pack.credits} ${isPt ? 'Créditos' : 'Credits'}`}
          hint={busy === pack.id ? (isPt ? 'Processando…' : 'Processing…') : pack.priceLabel}
        />
      ))}

      {sectionTitle(isPt ? 'Gastar' : 'Spend')}

      <Row
        icon="favorite"
        tone="danger"
        disabled={!canHeal || busy !== null}
        onClick={() => run('heal', onInstantHeal,
          isPt ? '+1 coração curado.' : '+1 heart healed.',
          isPt ? 'Não foi possível curar agora.' : 'Could not heal right now.')}
        title={isPt ? 'Curar 1 coração agora' : 'Heal 1 heart now'}
        hint={healthPoints >= maxHealthPoints
          ? (isPt ? 'Coração já está cheio.' : 'Heart is already full.')
          : (isPt ? `${HEART_COST_CREDITS} créditos` : `${HEART_COST_CREDITS} credits`)}
      />

      {accountTier === 'paid' && canReroll && !confirmingReroll && (
        <Row
          icon="replay"
          tone="gold"
          disabled={!canAffordReroll || busy !== null}
          onClick={() => setConfirmingReroll(true)}
          title={isPt ? 'Reroll de personagem' : 'Character reroll'}
          hint={isPt
            ? `${REROLL_COST_CREDITS} créditos — volta pra Rookie com um Soulmon novo`
            : `${REROLL_COST_CREDITS} credits — resets to Rookie with a brand-new Soulmon`}
        />
      )}

      {/* Confirmação NA LINHA: ação destrutiva continua confirmada, sem abrir
          uma segunda camada por cima de uma camada. */}
      {confirmingReroll && (
        <div style={{ padding: 12, borderRadius: 16, backgroundColor: 'var(--sm2-surface-2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ ...sm2Text, margin: 0, display: 'flex', gap: 10 }}>
            <Icon name="warning" size={22} tone="danger" />
            {isPt
              ? `Troca seu Soulmon por um NOVO e reseta a evolução pra Rookie. Atividades, tarefas e Bits continuam. Custa ${REROLL_COST_CREDITS} créditos.`
              : `Swaps your Soulmon for a brand-new one and resets evolution to Rookie. Activities, tasks and Bits stay. Costs ${REROLL_COST_CREDITS} credits.`}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={{ ...sm2Button('ghost'), flex: 1 }} onClick={() => setConfirmingReroll(false)}>
              {isPt ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="button"
              style={{ ...sm2Button('primary', busy === 'reroll'), flex: 1 }}
              disabled={busy === 'reroll'}
              onClick={() => {
                setConfirmingReroll(false);
                void run('reroll', onReroll,
                  isPt ? 'Novo personagem gerado — você voltou pra Rookie.' : 'New character generated — back to Rookie.',
                  isPt ? 'Não foi possível fazer o reroll agora.' : 'Could not reroll right now.');
              }}
            >
              {busy === 'reroll' ? (isPt ? 'Gerando…' : 'Generating…') : (isPt ? 'Sim, fazer reroll' : 'Yes, reroll')}
            </button>
          </div>
        </div>
      )}

      {accountTier === 'demo' && (
        <p style={{ ...sm2Hint, textAlign: 'center' }}>
          {isPt
            ? `Reroll é exclusivo de contas completas — desbloqueie por ${FULL_UNLOCK_PRICE_LABEL}.`
            : `Reroll is exclusive to unlocked accounts — unlock for ${FULL_UNLOCK_PRICE_LABEL}.`}
        </p>
      )}
    </ModalSheet>
  );
}
