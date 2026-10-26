import { useState, useEffect, type CSSProperties } from 'react';
import { Icon } from './ui/Icon';
import { AlertLine, ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { FULL_UNLOCK_SKU, DEMO_ACTIVITY_TOTAL_CAP } from '../utils/monetization';
import { useUnlockPriceLabel } from '../utils/priceLabel';
import { purchase, restorePurchases, isBillingAvailable, useStoreOpen, billingDisabledMessage } from '../utils/playBilling';
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
/** `reveal-demo` = o convite do REVEAL DEMO (13.19), a casa da 13.1. */
export type { UnlockReason } from './unlockReason';
import type { UnlockReason } from './unlockReason';

interface UnlockAccountModalProps {
  language: Language;
  reason: UnlockReason;
  /** Chamado só depois de o SERVIDOR confirmar a compra. */
  onUnlocked: (ent: Entitlement) => void;
  onClose: () => void;
}

/**
 * Uma vantagem (canvas Conta, `Desbloquear.dc.html`): `check_circle` 20 FILL
 * `primary-ink` pelado + a manchete 14. Sem card, sem placa atrás do glifo.
 * A linha de apoio (`desc`) fica no `title` do elemento — o wireframe
 * aprovado desenha só a manchete, e a folha inteira cabe antes da dobra.
 */
function Perk({ title, desc }: { title: string; desc: string }) {
  return (
    <p className="sm2-conta-perk" title={desc}>
      <Icon name="check_circle" size={20} fill={1} tone="primary" style={{ flexShrink: 0 }} />
      {title}
    </p>
  );
}

export function UnlockAccountModal({ language, reason, onUnlocked, onClose }: UnlockAccountModalProps) {
  // WP5.8 — o preço que o Play vai cobrar NESTE aparelho; fora do Android
  // nativo cai na constante publicada (`utils/priceLabel.ts`).
  const isPt = language === 'pt-BR';
  const precoLabel = useUnlockPriceLabel(isPt);
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

  /* Kill-switch `BILLING_DISABLED`: o "Desbloquear" some; "Restaurar" fica
     (restaurar o que já foi pago continua valendo com a loja fechada). */
  const lojaAberta = useStoreOpen();
  const lojaFechada = isBillingAvailable() && lojaAberta === false;

  /** O código do motivo (`billing-error-5`, `product-not-found`…) vai no fim da mensagem: é o que o suporte precisa para saber o que a Play respondeu. */
  const motivoCurto = (reason: string | undefined) => (reason && /^[a-z0-9-]{3,40}$/.test(reason) ? ` (${reason})` : '');

  const handleBuy = async () => {
    if (!isBillingAvailable()) { setMessage(unavailable); return; }
    setLoading('buy');
    setMessage(null);
    const result = await purchase(FULL_UNLOCK_SKU);
    setLoading(null);
    if (result.ok) { onUnlocked(result.ent); return; }
    setMessage(result.reason === 'billing-disabled' ? billingDisabledMessage(isPt) : result.reason === 'cancelled'
      ? (isPt ? 'Compra cancelada.' : 'Purchase cancelled.')
      : (isPt
        ? `Não foi possível concluir a compra agora. Tente de novo em instantes.${motivoCurto(result.reason)}`
        : `Couldn't complete the purchase right now. Please try again shortly.${motivoCurto(result.reason)}`));
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
      dismissOnBackdrop={false} /* formulário de conta com texto digitado */
      onClose={onClose}
      language={language}
      title={isPt ? 'Seu Soulmon cresce porque você cresce' : 'Your Soulmon grows because you do'}
      maxWidth={440}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {lojaFechada && <p data-unlock-closed style={{ ...sm2Hint, margin: 0 }}>{billingDisabledMessage(isPt)}</p>}
          {!lojaFechada && <button
            type="button"
            onClick={handleBuy}
            disabled={loading !== null}
            aria-busy={loading === 'buy' || undefined}
            style={{ ...sm2Button('primary', loading !== null), width: '100%' }}
          >
            {loading === 'buy'
              ? <><Icon name="sync" size={20} tone="inherit" className="sm2-kit-spin" />{isPt ? 'Comprando…' : 'Purchasing…'}</>
              : (isPt ? `Desbloquear — ${precoLabel}` : `Unlock — ${precoLabel}`)}
          </button>}
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
            style={{ ...sm2Button('outline', loading !== null), width: '100%' }}
          >
            {isPt ? 'Agora não' : 'Not now'}
          </button>
          <button
            type="button"
            onClick={handleRestore}
            disabled={loading !== null}
            aria-busy={loading === 'restore' || undefined}
            style={{ ...sm2Button('quiet', loading !== null), width: '100%' }}
          >
            {loading === 'restore'
              ? <><Icon name="sync" size={20} tone="inherit" className="sm2-kit-spin" />{isPt ? 'Restaurando…' : 'Restoring…'}</>
              : (isPt ? 'Já comprei — restaurar' : 'Already bought — restore')}
          </button>
        </div>
      }
    >
      <p style={{ ...sm2Text, margin: 0 }}>
        {reason === 'ovo'
          ? (isPt
            // §81: o cristal do onboarding guarda a criatura que as respostas acabaram de desenhar.
            ? 'O cristal guarda um Soulmon feito de quem você é: o ritual nasce das suas respostas, e só você terá esta criatura.'
            : 'The crystal holds a Soulmon made from who you are: the ritual is born from your answers, and only you will have this creature.')
          : reason === 'task-limit'
          ? (isPt
            ? `No modo grátis cabem ${DEMO_ACTIVITY_TOTAL_CAP} hábitos ativos (os diários; tarefas agendadas não contam) — a rotina inteira do Rookie. `
              + 'Quem evolui com o próprio Soulmon vai além desse teto.'
            : `The free mode holds ${DEMO_ACTIVITY_TOTAL_CAP} active daily habits (scheduled tasks do not count) — the whole Rookie routine. `
              + 'Evolving your own Soulmon is what takes you past that ceiling.')
          : (isPt
            // WP5.9 (decisão D12): a copy dizia que os três caminhos "levam ao
            // mesmo lugar", como se fosse equivalência. `getDemoCreatureStages`
            // monta três galhos com o MESMO nome e a MESMA descrição: a forma
            // existe, a diferença não. Dizer isso é mais honesto que prometer
            // paridade — e não é castigo, é a descrição do que a demonstração é.
            ? 'Árvore de um personagem de demonstração: os três caminhos terminam na mesma criatura. A do oráculo nasce de você, e cada galho leva a uma forma diferente.'
            : "A demo character's tree: the three paths end at the same creature. An oracle creature is born from you, and each branch leads to a different form.")}
      </p>

      <div className="sm2-conta-perks">
        <Perk
          title={isPt ? 'Sua criatura, só sua' : 'Your creature, yours alone'}
          desc={isPt ? 'O ritual do oráculo gera um Soulmon a partir de quem você é' : 'The oracle ritual generates a Soulmon from who you are'} />
        {/* `park` (uma árvore) e não `account_tree`: a fonte é subsetada por
            `icon_names` e este nome NÃO está no inventário — o ícone saía
            vazio. Ver `src/styles/iconInventory.contract.test.ts`. */}
        <Perk
          title={isPt ? 'A árvore inteira' : 'The whole tree'}
          desc={isPt ? 'Cada galho leva a uma forma diferente, decidida por como você cuida' : 'Each branch leads to a different form, decided by how you care'} />
        {/* C-S1: o terceiro perk era "Reroll liberado (custa Créditos)" —
            vender gasto FUTURO dentro da própria oferta. Trocado pelo modelo
            do Finch: o que se compra é a continuidade do app, dita sem drama. */}
        <Perk
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
      <p style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>
        {isPt
          ? 'Pagar nunca deixa sua criatura mais forte. Não tem como.'
          : "Paying never makes your creature stronger. It can't."}
      </p>

      {/* A recusa/cancelamento da compra: `role=alert` em ÂMBAR (D-K7 —
          filete 3px + `gold-ink`), sem caixa; o modal fica. */}
      {message && <AlertLine>{message}</AlertLine>}
    </ModalSheet>
  );
}

// O convite saiu para `UnlockNudge.tsx` (entra no chunk de entrada; o modal, não): reexportado aqui para quem já importa daqui.
export { UnlockNudge } from './UnlockNudge';
