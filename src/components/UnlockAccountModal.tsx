import { useState, useEffect, type CSSProperties } from 'react';
import { Icon } from './ui/Icon';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { FULL_UNLOCK_SKU, FULL_UNLOCK_PRICE_LABEL, DEMO_ACTIVITY_DAILY_CAP } from '../utils/monetization';
import { purchase, restorePurchases, isBillingAvailable } from '../utils/playBilling';
import type { Entitlement } from '../utils/entitlements';
import type { Language } from '../utils/i18n';
import { track } from '../utils/telemetry';

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
//
// UMA ação dominante: "Desbloquear". "Já comprei — restaurar" é uma saída para
// quem reinstalou, não uma segunda oferta, e por isso sussurra (`quiet`).
// ---------------------------------------------------------------------------

export type UnlockReason = 'task-limit' | 'evolution';

interface UnlockAccountModalProps {
  language: Language;
  reason: UnlockReason;
  /** Chamado só depois de o SERVIDOR confirmar a compra. */
  onUnlocked: (ent: Entitlement) => void;
  onClose: () => void;
}

/** Uma vantagem: ícone pelado + duas linhas. Sem card, sem placa atrás do glifo. */
function Perk({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <Icon name={icon} size={24} tone="primary" style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ minWidth: 0 }}>
        <p style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>{title}</p>
        <p style={sm2Hint}>{desc}</p>
      </div>
    </div>
  );
}

export function UnlockAccountModal({ language, reason, onUnlocked, onClose }: UnlockAccountModalProps) {
  const isPt = language === 'pt-BR';
  const [loading, setLoading] = useState<'buy' | 'restore' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // `unlock_view` — o denominador da conversão. Na MONTAGEM, porque este modal
  // só existe quando foi aberto por toque (nunca abre sozinho, ver o cabeçalho),
  // então montar É ver. `track` já ignora app oculto e não carrega prop nenhuma:
  // de qual dos dois convites (`reason`) a pessoa veio é dado que o schema atual
  // não tem — acrescentar isso é outro run, não improviso aqui.
  useEffect(() => { track('unlock_view'); }, []);

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

  return (
    <ModalSheet
      open
      onClose={onClose}
      language={language}
      title={isPt ? 'Soulmon completo' : 'Full Soulmon'}
      maxWidth={440}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            type="button"
            onClick={handleBuy}
            disabled={loading !== null}
            style={{ ...sm2Button('primary', loading !== null), width: '100%' }}
          >
            {loading === 'buy'
              ? <><Icon name="sync" size={20} className="animate-spin" />{isPt ? 'Comprando…' : 'Purchasing…'}</>
              : (isPt ? `Desbloquear — ${FULL_UNLOCK_PRICE_LABEL}` : `Unlock — ${FULL_UNLOCK_PRICE_LABEL}`)}
          </button>
          <button
            type="button"
            onClick={handleRestore}
            disabled={loading !== null}
            style={{ ...sm2Button('quiet'), width: '100%' }}
          >
            {loading === 'restore'
              ? <><Icon name="sync" size={20} className="animate-spin" />{isPt ? 'Restaurando…' : 'Restoring…'}</>
              : (isPt ? 'Já comprei — restaurar' : 'Already bought — restore')}
          </button>
        </div>
      }
    >
      <p style={{ ...sm2Text, margin: 0 }}>
        {reason === 'task-limit'
          ? (isPt
            ? `No modo grátis dá para criar ${DEMO_ACTIVITY_DAILY_CAP} atividade por dia.`
            : `The free mode lets you create ${DEMO_ACTIVITY_DAILY_CAP} activity a day.`)
          : (isPt
            ? 'Esta é a árvore de um personagem de demonstração — os três caminhos levam ao mesmo lugar.'
            : "This is a demo character's tree — all three paths lead to the same place.")}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Perk icon="auto_awesome"
          title={isPt ? 'Sua criatura, só sua' : 'Your creature, yours alone'}
          desc={isPt ? 'O ritual do oráculo gera um Soulmon a partir de quem você é' : 'The oracle ritual generates a Soulmon from who you are'} />
        <Perk icon="add"
          title={isPt ? 'Atividades sem limite' : 'Unlimited activities'}
          desc={isPt ? 'Cadastre quantas rotinas quiser, todo dia' : 'Add as many routines as you like, every day'} />
        <Perk icon="refresh"
          title={isPt ? 'Reroll liberado' : 'Reroll unlocked'}
          desc={isPt ? 'Gere uma criatura nova quando quiser (custa Créditos)' : 'Generate a brand-new creature whenever you want (costs Credits)'} />
      </div>

      <p style={sm2Hint}>
        {isPt
          ? 'Compra única — seu progresso atual continua exatamente como está.'
          : 'One-time purchase — your current progress stays exactly as it is.'}
      </p>

      {/* Estado de erro do fluxo de compra. Tinta de perigo, sem placa
          vermelha: é informação, não alarme. */}
      {message && (
        <p role="alert" style={{ ...sm2Hint, color: 'var(--sm2-danger-ink)' }}>{message}</p>
      )}
    </ModalSheet>
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

  const nudgeStyle: CSSProperties = {
    width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
    borderRadius: 12, border: '1px solid var(--sm2-line)',
    backgroundColor: 'var(--sm2-primary-soft)',
  };

  const head = variant === 'reveal'
    ? (isPt ? 'Falta revelar a sua criatura' : 'Your creature is still unrevealed')
    : reason === 'task-limit'
      ? (isPt ? 'Quer criar sem limite?' : 'Want to create without limits?')
      : (isPt ? 'Quer a SUA árvore de evoluções?' : 'Want YOUR own evolution tree?');

  const sub = variant === 'reveal'
    ? (isPt
      ? 'Você já desbloqueou o completo — responda o ritual quando quiser.'
      : 'You already unlocked the full game — answer the ritual whenever you like.')
    : (isPt
      ? `Desbloqueie o Soulmon completo por ${FULL_UNLOCK_PRICE_LABEL} — seu progresso continua.`
      : `Unlock the full Soulmon for ${FULL_UNLOCK_PRICE_LABEL} — your progress stays.`);

  return (
    <button type="button" onClick={onOpen} style={nudgeStyle}>
      <Icon name="auto_awesome" size={20} tone="primary" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'block', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)',
          fontWeight: 500, color: 'var(--sm2-primary-ink)',
        }}>
          {head}
        </span>
        <span style={{
          display: 'block', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-xs)',
          lineHeight: 'var(--sm2-leading-body)', color: 'var(--sm2-ink)',
        }}>
          {sub}
        </span>
      </span>
      <Icon name="chevron_right" size={20} tone="muted" style={{ flexShrink: 0 }} />
    </button>
  );
}
