import { useState, useEffect, type CSSProperties } from 'react';
import { Icon } from './ui/Icon';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { FULL_UNLOCK_SKU, FULL_UNLOCK_PRICE_LABEL, DEMO_ACTIVITY_TOTAL_CAP } from '../utils/monetization';
import { purchase, restorePurchases, isBillingAvailable } from '../utils/playBilling';
import type { Entitlement } from '../utils/entitlements';
import type { Language } from '../utils/i18n';
import { track, TELEMETRY_UNLOCK_REASON, unlockReasonCode } from '../utils/telemetry';

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
// UMA ação dominante: "Desbloquear". "Agora não" (WP5.5) tem a mesma largura,
// porque recusar é uma resposta legítima ao convite e não um erro a esconder.
// "Já comprei — restaurar" é uma saída para quem reinstalou, não uma segunda
// oferta, e por isso sussurra (`quiet`).
// ---------------------------------------------------------------------------

/** WP5.1 — `report` é o VALUE MOMENT: o primeiro dia perfeito. É o terceiro
 *  motivo, e o único que não nasce de um limite batido — os outros dois
 *  aparecem quando a pessoa esbarra em algo, este quando ela conseguiu. */
export type UnlockReason = 'task-limit' | 'evolution' | 'report';

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

  // `unlock_view` NÃO é emitido aqui — ele mudou de lugar, de propósito.
  //
  // O evento agora carrega `reason` (de qual dos dois convites a pessoa veio) e
  // `tier`, e quem conhece os dois é o `App.tsx`, que é dono do estado
  // `unlockReason` e do `accountTier`. Emitir daqui TAMBÉM contaria a mesma
  // visualização duas vezes — e um denominador inflado mente para baixo em
  // todas as taxas de conversão. Ver o efeito de `unlockReason` em `App.tsx`.

  const unavailable = isPt
    ? 'A compra acontece pela Google Play, dentro do app Android. No navegador não dá para cobrar.'
    : 'Purchases go through Google Play, inside the Android app. The browser cannot charge you.';

  const handleDismiss = () => {
    // Tradução com dono único (`unlockReasonCode`): o ternário de duas pernas
    // que existia aqui gravava um dispensar vindo do relatório como
    // `task-limit`, contaminando o funil por origem em silêncio.
    track('unlock_dismiss', { reason: unlockReasonCode(reason) });
    onClose();
  };

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
      title={isPt ? 'Seu Soulmon cresce porque você cresce' : 'Your Soulmon grows because you do'}
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
          {/* WP5.5 — "Agora não" com a MESMA largura do primário, logo abaixo
              dele (Mobbin, Character AI). Uma oferta cuja única saída visível é
              o X no canto é uma oferta que encurrala; a recusa declarada é
              parte do convite. Emite `unlock_dismiss` com o mesmo `reason` do
              `unlock_view`, que é o que torna a taxa de recusa POR CONVITE
              calculável. */}
          <button
            type="button"
            onClick={handleDismiss}
            disabled={loading !== null}
            style={{ ...sm2Button('ghost'), width: '100%' }}
          >
            {isPt ? 'Agora não' : 'Not now'}
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
            ? `No modo grátis cabem ${DEMO_ACTIVITY_TOTAL_CAP} hábitos ativos — a rotina inteira do Rookie. `
              + 'Quem evolui com o próprio Soulmon vai além desse teto.'
            : `The free mode holds ${DEMO_ACTIVITY_TOTAL_CAP} active habits — the whole Rookie routine. `
              + 'Evolving your own Soulmon is what takes you past that ceiling.')
          : (isPt
            // WP5.9 (decisão D12): a copy dizia que os três caminhos "levam ao
            // mesmo lugar", como se fosse equivalência. `getDemoCreatureStages`
            // monta três galhos com o MESMO nome e a MESMA descrição: a forma
            // existe, a diferença não. Dizer isso é mais honesto que prometer
            // paridade — e não é castigo, é a descrição do que a demonstração é.
            ? 'Esta é a árvore de um personagem de demonstração: os três caminhos existem, mas terminam na mesma criatura. A do oráculo nasce de você, e cada galho leva a uma forma diferente.'
            : "This is a demo character's tree: the three paths exist, but they end at the same creature. An oracle creature is born from you, and each branch leads to a different form.")}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Perk icon="auto_awesome"
          title={isPt ? 'Sua criatura, só sua' : 'Your creature, yours alone'}
          desc={isPt ? 'O ritual do oráculo gera um Soulmon a partir de quem você é' : 'The oracle ritual generates a Soulmon from who you are'} />
        <Perk icon="account_tree"
          title={isPt ? 'A árvore inteira' : 'The whole tree'}
          desc={isPt ? 'Cada galho leva a uma forma diferente, decidida por como você cuida' : 'Each branch leads to a different form, decided by how you care'} />
        {/* C-S1: o terceiro perk era "Reroll liberado (custa Créditos)" —
            vender gasto FUTURO dentro da própria oferta. Trocado pelo modelo
            do Finch: o que se compra é a continuidade do app, dita sem drama. */}
        <Perk icon="volunteer_activism"
          title={isPt ? 'Ajuda o Soulmon a existir' : 'Keeps Soulmon alive'}
          desc={isPt ? 'Uma pessoa faz este app; a compra é o que paga as contas dele' : 'One person makes this app; the purchase is what pays its bills'} />
      </div>

      <p style={sm2Hint}>
        {isPt
          ? 'Compra única — seu progresso atual continua exatamente como está.'
          : 'One-time purchase — your current progress stays exactly as it is.'}
      </p>

      {/* A frase que fecha a oferta, e que só pôde ser escrita HOJE.
          O C-S1 pediu esta linha e o próprio guarda a barrou: enquanto os
          Créditos compravam coração (direto por 10, ou por 15 via
          Créditos→Bits→💗), ela seria mentira dita no lugar mais caro possível
          — dentro do pedido de dinheiro. As duas peças saíram neste mesmo lote
          (D7+D15), e a frase virou verdade verificável. Se alguém reintroduzir
          qualquer venda que toque HP, é esta linha que passa a mentir. */}
      <p style={{ ...sm2Hint, fontWeight: 500 }}>
        {isPt
          ? 'Pagar nunca deixa sua criatura mais forte. Não tem como.'
          : "Paying never makes your creature stronger. It can't."}
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
      : reason === 'report'
        // Fala do resultado que a pessoa acabou de ter, não do que falta a ela.
        ? (isPt ? 'Quer uma criatura que seja só sua?' : 'Want a creature that is only yours?')
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
