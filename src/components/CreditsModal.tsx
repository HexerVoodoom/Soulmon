import { useCreditPackLabels, useUnlockPriceLabel } from '../utils/priceLabel';
import { useState, useEffect } from 'react';
import { Icon } from './ui/Icon';
import { CREDIT_COLOR } from '../utils/currencies';
import { ModalSheet, sm2Hint, sm2TitleStyle } from './form/FormKit';
import {
  CREDIT_PACKS, type CreditPack, ADS_ENABLED, AD_REWARD_CREDITS, AD_DAILY_CAP, REROLL_COST_CREDITS,
} from '../utils/monetization';
import { fetchEntitlement } from '../utils/entitlements';
import { isBillingAvailable } from '../utils/playBilling';
import type { Language } from '../utils/i18n';

/**
 * CRÉDITOS — a moeda de DINHEIRO REAL, e a única das três que vive no
 * servidor (`ent:<saveId>`). Revamp minimalista.
 *
 * ─── O desenho ÚNICO dos Créditos ─────────────────────────────────────────
 * `Icon name="diamond"` FILL em `--sm2-credit-ink` (canvas Loja D-L11: a única
 * moeda com glifo, na cor própria), e **nada mais** — nem `icon-gem.png`,
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
  /** Tem um perfil de oráculo salvo (utils/oracle.ts) — só contas 'paid' têm. */
  canReroll: boolean;
  onWatchAd: () => Promise<boolean>;
  onBuyPack: (pack: CreditPack) => Promise<boolean>;
  /** Abre a Nova Leitura (WP5.7). Não cobra nada — é navegação. */
  onReroll: () => void;
  onClose: () => void;
}

export function CreditsModal({
  language, credits, accountTier, canReroll,
  onWatchAd, onBuyPack, onReroll, onClose,
}: CreditsModalProps) {
  // WP5.8 — o preço que o Play vai cobrar NESTE aparelho; fora do Android
  // nativo cai na constante publicada (`utils/priceLabel.ts`).
  const isPt = language === 'pt-BR';
  const precoLabel = useUnlockPriceLabel(isPt);
  const precosDosPacotes = useCreditPackLabels(isPt);
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

  /**
   * Uma linha-botão (canvas Conta, `Creditos.dc.html`): card SIS-03 inteiro,
   * 56, título 14/500 + linha 12, `chevron_right` 24 `muted` no fim. Os packs
   * levam `diamond` 20 FILL `credit-ink` + "60 Credits" em mono 16 + o preço
   * em mono 12 (D-K3/D-K4: Créditos são dinheiro real, a única moeda com
   * ícone). "Watch ad" e "New Reading" não têm ícone. Inerte por FORMA
   * (D-K5): tracejado 1px `muted` + tinta `muted`, `aria-disabled`, fora do
   * Tab — nunca `opacity` (achado 10).
   */
  const Row = ({ credit, title, hint, hintMono, disabled, onClick }: {
    credit?: boolean;
    title: string;
    hint: string;
    hintMono?: boolean;
    disabled?: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={disabled ? 'sm2-conta-crow is-inert' : 'sm2-conta-crow'}
    >
      <span className="sm2-conta-crow-tx">
        <span className={credit ? 'sm2-conta-crow-t sm2-conta-mono' : 'sm2-conta-crow-t'}>
          {credit && (
            <Icon name="diamond" size={20} fill={1} tone="inherit" style={disabled ? undefined : { color: CREDIT_COLOR }} />
          )}
          {title}
        </span>
        <span className={hintMono ? 'sm2-conta-s sm2-conta-mono' : 'sm2-conta-s'}>{hint}</span>
      </span>
      <Icon name="chevron_right" size={24} tone="muted" style={{ flexShrink: 0 }} />
    </button>
  );

  /* "Earn" / "Spend" em Fredoka 16 (o `.h3` do canvas). */
  const sectionTitle = (text: string) => (
    <h2 className="sm2-title" style={{ ...sm2TitleStyle, fontSize: 'var(--sm2-text-md)', fontWeight: 500, marginTop: 2 }}>{text}</h2>
  );

  return (
    <ModalSheet
      open
      title={isPt ? 'Créditos' : 'Credits'}
      onClose={onClose}
      language={language}
      footer={
        /* O saldo: `diamond` 20 FILL `credit-ink` + o número em mono `ink`. */
        <div className="sm2-conta-bal">
          <Icon name="diamond" size={20} fill={1} tone="inherit" style={{ color: CREDIT_COLOR }} label={isPt ? 'Créditos' : 'Credits'} />
          <b>{credits}</b>
        </div>
      }
    >
      {/* Estado da última ação — sempre no DOM, para o leitor de tela anunciar. */}
      <p
        role="status"
        aria-live="polite"
        style={{
          ...sm2Hint, minHeight: 18, margin: 0,
          /* A falha em `muted` (canvas Loja LOJA-13: "sem vermelho") — a compra
             que não concluiu não é erro do jogador, e o app nunca cobra. */
          fontWeight: message?.ok ? 500 : 400,
          color: message?.ok ? 'var(--sm2-ink)' : 'var(--sm2-muted)',
        }}
      >
        {message?.text ?? (billingAvailable
          ? ''
          : (isPt ? 'Compras só no app Android (Google Play).' : 'Purchases are only available in the Android app (Google Play).'))}
      </p>

      {sectionTitle(isPt ? 'Ganhar' : 'Earn')}

      {/* Duas travas, e a de cá é a que vale hoje: `ADS_ENABLED` é o
          desligamento local (D-13); `adsEnabled` continua sendo a palavra do
          servidor sobre a verificação do AdMob. */}
      {ADS_ENABLED && adsEnabled && (
        <Row
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
          credit
          hintMono
          disabled={busy !== null || !billingAvailable}
          onClick={() => run(pack.id, () => onBuyPack(pack),
            isPt ? `+${pack.credits} créditos.` : `+${pack.credits} credits.`,
            isPt ? 'Compra não concluída.' : 'Purchase not completed.')}
          title={`${pack.credits} ${isPt ? 'Créditos' : 'Credits'}`}
          /* O preço do PACOTE também vem da loja quando ela responde. Era
             `pack.priceLabel` cru — a constante em real, para o planeta
             inteiro. O WP5.8 consertou isso para o desbloqueio completo e
             esqueceu os pacotes, na mesma tela, um andar abaixo. */
          hint={busy === pack.id ? (isPt ? 'Processando…' : 'Processing…') : (precosDosPacotes[pack.id] ?? pack.priceLabel)}
        />
      ))}

      {sectionTitle(isPt ? 'Gastar' : 'Spend')}

      {/* ⚰️ D7+D15: aqui havia "Curar 1 coração agora — 10 créditos". Saiu, e
          com ela o único uso de Créditos que não era cosmético nem identidade.
          Dinheiro não compra a barra de cuidado, sem asterisco. */}

      {/* WP5.7 (H.4) — "Reroll" virou **Nova Leitura**, e a linha virou uma
          NAVEGAÇÃO em vez de uma compra: quem confirma é a tela que mostra as
          perguntas, porque é lá que a pessoa vê o que muda antes de pagar.
          Sortear e cobrar na mesma linha era o formato de caça-níquel. */}
      {accountTier === 'paid' && canReroll && (
        <Row
          disabled={busy !== null}
          onClick={onReroll}
          title={isPt ? 'Nova Leitura' : 'New Reading'}
          /* A declaração de EQUIVALÊNCIA MECÂNICA (D-05) fica aqui, onde o
             dinheiro é pedido — ela sobreviveu à remoção do sorteio porque não
             é sobre sorteio: é sobre dinheiro nunca comprar poder. Mesmas
             respostas, mesma criatura, e todo pet ajuda igual. */
          hint={isPt
            ? `${REROLL_COST_CREDITS} créditos — responda de novo as 6 perguntas e a leitura sai delas. Mesmas respostas, mesma criatura. Todo pet é mecanicamente igual: muda quem sua criatura é, nunca o quanto ela te ajuda.`
            : `${REROLL_COST_CREDITS} credits — answer the 6 questions again and the reading comes from them. Same answers, same creature. Every pet is mechanically equal: it changes who your creature is, never how much it helps you.`}
        />
      )}

      {/* ⚰️ Aqui havia a confirmação em linha do reroll, com o texto "sorteado
          aleatoriamente" e "o sorteio muda quem sua criatura é". Saiu inteira
          em 06/09/2026 (WP5.7 / H.4): não existe mais sorteio, e a confirmação
          mora na `NewReadingModal`, junto das perguntas — confirmar longe do
          que vai mudar é confirmar no escuro. */}

      {accountTier === 'demo' && (
        <p style={{ ...sm2Hint, textAlign: 'center' }}>
          {isPt
            ? `Reroll é exclusivo de contas completas — desbloqueie por ${precoLabel}.`
            : `Reroll is exclusive to unlocked accounts — unlock for ${precoLabel}.`}
        </p>
      )}
    </ModalSheet>
  );
}
