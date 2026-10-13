import type { CSSProperties } from 'react';
import { Icon } from './ui/Icon';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { useUnlockPriceLabel } from '../utils/priceLabel';
import { DEMO_ACTIVITY_TOTAL_CAP } from '../utils/monetization';
import type { Language } from '../utils/i18n';
import type { UnlockReason } from './unlockReason';

/**
 * Convite discreto — uma linha clicável, sem badge piscando nem contagem
 * regressiva. Só aparece para contas 'demo', e só no contexto que o justifica.
 *
 * `variant='reveal'` é o caso de quem JÁ pagou e saiu do ritual pela metade:
 * não há mais nada a vender, só um ritual a terminar.
 */
export function UnlockNudge({ language, reason, variant = 'buy', onOpen, trailingSpace = 0 }: {
  language: Language;
  reason: UnlockReason;
  variant?: 'buy' | 'reveal';
  onOpen: () => void;
  /** Espaço reservado à DIREITA, em px, para um controle irmão sobreposto
   *  (o × do reveal demo, B8 de 01/10/2026). 0 = o desenho de sempre. */
  trailingSpace?: number;
}) {
  // WP5.8 — o preço que o Play vai cobrar NESTE aparelho; fora do Android
  // nativo cai na constante publicada (`utils/priceLabel.ts`).
  const isPt = language === 'pt-BR';
  const precoLabel = useUnlockPriceLabel(isPt);

  /* Canvas Atividades `CriarTetoDemo` (ATIV-16): uma LINHA-BOTÃO `outline`
     64 — `surface` + fronteira `muted`, ícone 24 pelado (`lock_open` em cobre
     quando é o teto; `auto_awesome` ciano nos outros motivos), título 14/500
     em `ink`, subtítulo 12 `muted`, `chevron_right` `muted`. Passivo, sem
     dismiss. Era uma placa `primary-soft`. */
  /* Canvas Conta `Convites` (aceite (d) do guarda, §29): `maxWidth 280` em
     todos os convites — a assimetria diz "opcional". */
  const nudgeStyle: CSSProperties = {
    ...sm2Button('outline'),
    width: '100%', maxWidth: 280, minHeight: reason === 'evolution' || reason === 'reveal-demo' ? 56 : 64, justifyContent: 'flex-start', gap: 12,
    padding: reason === 'evolution' || reason === 'reveal-demo' ? '10px 12px' : '8px 16px', textAlign: 'left',
    ...(trailingSpace > 0 ? { paddingRight: 12 + trailingSpace } : {}),
  };
  const isCap = variant !== 'reveal' && reason === 'task-limit';
  /* Canvas Evolução D-E7 (`ConviteDemo`/`ConvitePago`, EVO-11/12): na página
     de Evolução o convite é ÂMBAR de convite — `auto_awesome` 24 FILL 1 em
     `gold-ink` pelado, card-botão 56, sem chevron (PRINCÍPIOS §8: âmbar =
     convite, nunca cobrança). A recusa `not-paid` do renascimento usa a
     MESMA peça. Os outros motivos seguem o canvas Atividades. */
  const isEvo = reason === 'evolution';
  /* Canvas Loja D-L7/LOJA-08: o convite passivo da Loja é a MESMA peça âmbar
     (`auto_awesome` FILL `gold-ink`), com o `chevron_right` no fim. */
  /* Canvas Onboarding-oráculo (RevealDemo, 13.1): a MESMA peça âmbar, 280,
     `auto_awesome` FILL `gold-ink`, sem chevron — o × 44 ao lado é o "Not
     now"; a manchete fala do que a pessoa acabou de ver. */
  const isRevealDemo = reason === 'reveal-demo';
  const isGoldInvite = isEvo || reason === 'shop' || isRevealDemo;

  const head = variant === 'reveal'
    ? (isPt ? 'Falta revelar a sua criatura' : 'Your creature is still unrevealed')
    : reason === 'task-limit'
      /* Achado 11 do canvas Atividades: "sem limite" foi VETADO pelo guarda —
         o pago também tem teto (`activityCapFor`). O teto CRESCE com a
         evolução; é isso que se promete. */
      ? (isPt ? 'Quer um teto que cresce com você?' : 'Want a ceiling that grows with you?')
      : reason === 'report' || isRevealDemo
        // Fala do resultado que a pessoa acabou de ter, não do que falta a ela.
        ? (isPt ? 'Quer uma criatura que seja só sua?' : 'Want a creature that is only yours?')
        : reason === 'shop'
          /* O canal PASSIVO (WP5.1): a pessoa veio à Loja por conta própria,
             então o convite não precisa convencer de nada — só estar ali. Sem
             urgência, sem "última chance": este card não tem prazo, e dizer
             isso é o que o separa de uma faixa promocional. */
          ? (isPt ? 'A criatura própria fica por aqui' : 'The custom creature lives here')
          : (isPt ? 'Quer a SUA árvore de evoluções?' : 'Want YOUR own evolution tree?');

  const sub = variant === 'reveal'
    ? (isPt
      ? 'Você já desbloqueou o completo — responda o ritual quando quiser.'
      : 'You already unlocked the full game — answer the ritual whenever you like.')
    : (isPt
      ? `Desbloqueie o Soulmon completo por ${precoLabel} — seu progresso continua.`
      : `Unlock the full Soulmon for ${precoLabel} — your progress stays.`);

  return (
    <button type="button" onClick={onOpen} style={nudgeStyle}>
      <Icon
        name={isCap ? 'lock_open' : 'auto_awesome'}
        size={24}
        fill={isGoldInvite ? 1 : 0}
        tone={isCap || isGoldInvite ? 'gold' : 'primary'}
        style={{ flexShrink: 0 }}
      />
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          display: 'block', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)',
          fontWeight: 500, lineHeight: 'var(--sm2-leading-body)', color: 'var(--sm2-ink)',
        }}>
          {head}
        </span>
        <span style={{
          display: 'block', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-xs)', fontWeight: 400,
          lineHeight: 'var(--sm2-leading-body)', color: 'var(--sm2-muted)',
        }}>
          {sub}
        </span>
      </span>
      {!isEvo && !isRevealDemo && <Icon name="chevron_right" size={24} tone="muted" style={{ flexShrink: 0 }} />}
    </button>
  );
}
