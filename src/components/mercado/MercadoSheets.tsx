import { missionsDoneFirst } from '../../utils/missionOrder';
import { useState, type CSSProperties } from 'react';
import { PixelTabs } from '../pixel/PixelKit';
import { Icon } from '../ui/Icon';
import { InfoTip } from '../ui/InfoTip';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { achievementTarget } from '../../utils/missionTargets';
import { resolveGo, type MissionNav } from '../nav/MissionCard';
import { UnlockNudge } from '../UnlockAccountModal';
import { STALL_CURRENCIES, stallItems, type MercadoStall } from '../../utils/mercadoCatalog';
import { MISSIONS, MISSION_CATEGORIES, isMissionComplete, type MissionCategory } from '../../utils/missions';
import { SHOP_ITEMS } from '../../utils/shop';
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { MiniGlass } from '../ui/MiniGlass';
import { PixelIcon } from '../ui/PixelIcon';
import { STATUS_ICON_ART } from '../../assets/soulmon/icones-ui/interacao';
import type { CurrencyId } from '../../utils/currencies';
import type { Language } from '../../utils/i18n';
import { GuildOwnedShelf } from './GuildOwnedShelf';
import { SubscriptionShelf } from './SubscriptionShelf';
import { FrameShelf } from './FrameShelf';
import {
  CreditExchange, CurrencyBalance, DecorRuleLine, ShopShelf, ShopStatus, bgThumb, useShopFlash,
  type ShopActions, type ShopOwnership,
} from './ShopShelf';

/**
 * O CONTEÚDO DAS LOJINHAS DO MERCADO (minimal-ui F5) — o que entra dentro do
 * `AreaSheet` quando se toca num lote do Mercado. Mock aprovado:
 * `product/squad-minimal-ui/propostas/loja/mock.html` (4 modais, abas por
 * moeda; Conquistas filtra por categoria).
 *
 * Não reimplementa regra: a vitrine vem de `utils/mercadoCatalog.ts`, a
 * compra de `onBuy` (→ `handleShopBuy`), a troca de `onExchangeCredits`.
 */

/** Cabeçalho fixo da folha (abas + saldo) — não rola junto da prateleira. */
const stickyHead: CSSProperties = {
  position: 'sticky', top: 0, zIndex: 1,
  display: 'flex', flexDirection: 'column', gap: 8,
  paddingBottom: 8,
  backgroundColor: 'var(--sm2-surface)',
};

function currencyLabel(c: CurrencyId, isPt: boolean): string {
  if (c === 'emblems') return isPt ? 'Honra' : 'Honor';
  if (c === 'credits') return isPt ? 'Créditos' : 'Credits';
  return 'Bits';
}

/** Linha de apoio da região viva quando nada aconteceu ainda. */
function idleLine(c: CurrencyId, isPt: boolean): string {
  if (c === 'emblems') return isPt ? 'Honra só vem do Torneio — e só compra cosmético.' : 'Honor only comes from the Tournament — and only buys cosmetics.';
  if (c === 'credits') return isPt ? 'Créditos viram Bits aqui. O contrário não existe.' : "Credits turn into Bits here. There's no way back.";
  return isPt ? 'Ganhe Bits nos minijogos.' : 'Earn Bits in the minigames.';
}

export interface MercadoStallProps extends ShopOwnership, ShopActions {
  stall: MercadoStall;
  language: Language;
  points: number;
  emblems: number;
  credits: number;
  onExchangeCredits: (credits: number) => Promise<boolean>;
  /** WP5.1 — o canal PASSIVO. `demo` vê o convite permanente na aba de Créditos. */
  accountTier?: 'demo' | 'paid';
  onUnlock?: () => void;
}

/** Uma lojinha de compra (Itens, Decoração ou Background), com abas por moeda. */
export function MercadoStallSheet(props: MercadoStallProps) {
  const { stall, language, points, emblems, credits, onExchangeCredits, accountTier, onUnlock } = props;
  const isPt = language === 'pt-BR';
  const tabs = STALL_CURRENCIES[stall];
  const [cur, setCur] = useState<CurrencyId>(tabs[0]);
  const { flash, say } = useShopFlash();
  /** C3: a lojinha da Panora vende DUAS coisas — separadas em Molduras / Backgrounds; a moeda (Bits / Honra) fica dentro de cada uma. */
  const [kind, setKind] = useState<'frames' | 'backgrounds'>('backgrounds');
  const showFrames = stall === 'background' && kind === 'frames';
  const balance = cur === 'emblems' ? emblems : cur === 'credits' ? credits : points;

  return (
    <div data-mercado-stall={stall} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={stickyHead}>
        {stall === 'background' && (
          <PixelTabs
            items={[
              { key: 'frames' as const, label: isPt ? 'Molduras' : 'Frames' },
              { key: 'backgrounds' as const, label: 'Backgrounds' },
            ]}
            value={kind}
            onChange={setKind}
            ariaLabel={isPt ? 'O que a Panora vende' : 'What Panora sells'}
          />
        )}
        {tabs.length > 1 && (
          <PixelTabs
            items={tabs.map(c => ({ key: c, label: currencyLabel(c, isPt) }))}
            value={cur}
            onChange={setCur}
            ariaLabel={isPt ? 'Moeda da lojinha' : 'Stall currency'}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ShopStatus flash={flash} idle={idleLine(cur, isPt)} language={language} />
          </div>
          <CurrencyBalance currency={cur} value={balance} language={language} />
        </div>
      </div>


      {/* D2 (02/10/2026): a regra da decoração no TOPO — quantas peças cabem e onde aparecem. */}
      {stall === 'decoracao' && cur !== 'credits' && <DecorRuleLine language={language} />}

      {/* O que a roda deu (cenários do Bosque, Concha da Maré): só EQUIPA, sem preço.
          NO TOPO, antes de ~20 cenários da loja (QA L3 M4): o que se ganhou não se procura no fim.
          Vazio é silêncio — a seção nem desenha o título. */}
      {cur !== 'credits' && !showFrames && (stall === 'background' || stall === 'decoracao') && (
        <GuildOwnedShelf
          language={language}
          kind={stall === 'background' ? 'bg' : 'furniture'}
          ownership={props}
          actions={props}
        />
      )}
      {/* O conjunto do trimestre da assinatura: sempre visível (escurecido com o porquê
          quando a vitrine está fechada), de graça no resgate, posse permanente depois. */}
      {cur === 'bits' && !showFrames && (stall === 'background' || stall === 'decoracao') && (
        <SubscriptionShelf
          language={language}
          kind={stall === 'background' ? 'bg' : 'furniture'}
          ownership={props}
          actions={props}
        />
      )}
      {cur === 'credits' ? (
        <>
          <CreditExchange language={language} credits={credits} onExchangeCredits={onExchangeCredits} say={say} />
          {/* ─── O CONVITE PERMANENTE (WP5.1, canal PASSIVO) ───────────────
              A pessoa ENCONTRA: fora do cap semanal, não some com
              `offerDismissed`, sem ×. Mora na aba de Créditos (a do dinheiro
              real), DEPOIS do que a pessoa veio ver — nunca na de Emblemas,
              que são cosméticos por regra. */}
          {cur === 'credits' && accountTier === 'demo' && onUnlock && (
            <section data-unlock-passive style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <p style={{ ...sm2Hint, margin: 0 }}>
                {isPt
                  ? 'Sem pressa: isto fica aqui sempre que você quiser olhar.'
                  : 'No rush — this stays here whenever you want to look.'}
              </p>
              <div style={{ maxWidth: 280 }}>
                <UnlockNudge language={language} reason="shop" onOpen={onUnlock} />
              </div>
            </section>
          )}
        </>
      ) : showFrames ? (
        <FrameShelf
          language={language}
          currency={cur}
          balance={balance}
          owned={props.ownedFrames ?? []}
          onBuy={props.onBuyFrame}
        />
      ) : (
        <ShopShelf
          language={language}
          items={stallItems(stall, cur)}
          currency={cur}
          balance={balance}
          ownership={props}
          actions={props}
          say={say}
          flash={flash}
          hideDecorRule
        />
      )}
    </div>
  );
}

function categoryLabel(c: MissionCategory, isPt: boolean): string {
  switch (c) {
    case 'evolution': return isPt ? 'Evolução' : 'Evolution';
    case 'dungeon': return isPt ? 'Masmorra' : 'Dungeon';
    case 'games': return isPt ? 'Jogos' : 'Games';
    case 'constancy': return isPt ? 'Constância' : 'Consistency';
  }
}

/**
 * CONQUISTAS — as missões permanentes (`utils/missions.ts`), filtradas por
 * CATEGORIA em vez de moeda. Cada uma libera a compra de um cenário exclusivo,
 * que é comprado na lojinha de Background (aqui só se lê — não há preço nesta
 * folha, e por isso não há moeda nenhuma nela).
 *
 * WP4.12 (achado E4) vale aqui: sem progresso, NENHUM "0/N" — uma coluna de
 * zeros lê como boletim. A condição em palavras aparece sempre.
 */
export function ConquistasSheet({ language, missionProgress, claimed, onClaim, nav, shop }: {
  language: Language;
  missionProgress: Record<string, number>;
  /** Conquistas já resgatadas (REGISTRO §56). Ausente = save não migrado: cumprida já vale como resgatada. */
  claimed?: readonly string[];
  /** O Resgatar (só no ícone "!" de Missões). Sem ele (prédio do Mercado) a cumprida só aponta onde resgatar. */
  onClaim?: (id: string) => void;
  /** Para onde a conquista leva (REGISTRO §62): só no ícone "!" (no Mercado o jogador já está comprando). */
  nav?: MissionNav;
  /** C2: só no prédio Conquistas do Mercado — liga o Comprar do cenário liberado. Sem isto (ícone "!" de Missões) o card só aponta o Mercado. */
  shop?: { ownedBackgrounds: readonly string[]; balance: number; onBuy: (itemId: string) => boolean };
}) {
  const isPt = language === 'pt-BR';
  /** C2: compra em dois toques (Comprar -> Confirmar), como na prateleira (D1). */
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ id: string; ok: boolean; msg: string } | null>(null);
  const [cat, setCat] = useState<MissionCategory>(MISSION_CATEGORIES[0]);
  const list = missionsDoneFirst(
    MISSIONS.filter(m => m.category === cat),
    m => {
      const feita = isMissionComplete(m.id, missionProgress);
      return !feita ? 'open' : (claimed === undefined || claimed.includes(m.id)) ? 'claimed' : 'ready';
    },
  );

  return (
    <div data-conquistas style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={stickyHead}>
        <PixelTabs
          items={MISSION_CATEGORIES.map(c => ({ key: c, label: categoryLabel(c, isPt) }))}
          value={cat}
          onChange={setCat}
          ariaLabel={isPt ? 'Categoria das conquistas' : 'Achievement category'}
        />
      </div>
      {/* H9 (01/10/2026, navegação do dono): cada conquista é um card que diz
          as DUAS coisas que a pessoa quer saber — COMO se ganha (a condição em
          palavras) e O QUE se ganha (a miniatura do cenário que ela libera). */}
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sm2-space-3, 12px)', listStyle: 'none', margin: 0, padding: 0 }}>
        {list.map(m => {
          const done = isMissionComplete(m.id, missionProgress);
          const resgatada = done && (claimed === undefined || claimed.includes(m.id));
          const go = resolveGo(nav, achievementTarget(m.category), language);
          const cur = Math.min(missionProgress[m.id] ?? 0, m.target);
          const reward = SHOP_ITEMS.find(i => i.id === m.bgReward);
          const rewardName = reward ? (isPt ? reward.namePt : reward.nameEn) : null;
          const thumb = reward ? bgThumb(reward.id) : null;
          return (
            <li
              key={m.id}
              data-mission={m.id}
              data-done={done || undefined}
              style={{
                display: 'flex', flexDirection: 'column', gap: 10, padding: '12px',
                boxSizing: 'border-box', borderRadius: 'var(--sm2-radius-md)',
                // Concluída = anel `primary-ink`; em aberto = tracejado `muted`
                // (estado por FORMA, nunca por opacidade — D-L8). O fundo é o
                // do card do sistema (`surface-2`) nos dois estados — I2.
                border: done ? '1px solid var(--sm2-primary-ink)' : '1px dashed var(--sm2-muted)',
                backgroundColor: 'var(--sm2-surface-2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Ícone PELADO (regra do dono), 24 da escala viva. */}
                <Icon name={m.iconName} size={24} fill={done ? 1 : 0} tone={done ? 'primary' : 'muted'} />
                {go.onGo && !resgatada ? (
                  <button type="button" data-mission-go onClick={go.onGo} style={{ ...sm2Text, flex: 1, minWidth: 0, minHeight: 32, padding: 0, textAlign: 'left', fontWeight: 600, fontFamily: 'var(--sm2-font-display)', color: 'var(--sm2-ink)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>{isPt ? m.namePt : m.nameEn}</button>
                ) : (
                  <span style={{ ...sm2Text, flex: 1, minWidth: 0, fontWeight: 600, fontFamily: 'var(--sm2-font-display)', color: 'var(--sm2-ink)' }}>{isPt ? m.namePt : m.nameEn}</span>
                )}
                {/* K6 (04/10/2026): o "como ganhar" mora atrás do "?" ao lado do nome. */}
                <InfoTip language={language} label={isPt ? `Como ganhar: ${m.namePt}` : `How to earn: ${m.nameEn}`} align="right" style={{ minHeight: 24 }}>
                  <span data-mission-how style={{ display: 'block' }}>{isPt ? m.descPt : m.descEn}</span>
                  {rewardName && !done && (
                    <span style={{ display: 'block', marginTop: 6 }}>
                      {isPt ? 'Cenário exclusivo: a lojinha de Background libera quando esta conquista fecha.' : 'Exclusive scene: the Background stall unlocks it when this achievement is done.'}
                    </span>
                  )}
                </InfoTip>
                {resgatada ? (
                  <Icon name="check_circle" size={24} fill={1} tone="primary" label={isPt ? 'resgatada' : 'claimed'} />
                ) : done ? (
                  onClaim ? (
                    <button type="button" data-claim-mission={m.id} style={sm2Button('primary', false, 'sm')} onClick={() => onClaim(m.id)}>{isPt ? 'Resgatar' : 'Claim'}</button>
                  ) : (
                    <span data-claim-hint style={{ ...sm2Hint, flex: 'none' }}>{isPt ? 'Resgate em Missões (!)' : 'Claim in Missions (!)'}</span>
                  )
                ) : m.target > 1 && cur > 0 ? (
                  <span className="sm2-num" style={{ ...sm2Hint, flex: 'none', whiteSpace: 'nowrap' }}>{cur}/{m.target}</span>
                ) : null}
              </div>
              {go.lockNote && !resgatada && <p data-mission-lock style={{ ...sm2Hint, margin: 0 }}>{go.lockNote}</p>}
              {rewardName && (
                <div data-mission-reward style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <MiniGlass size={52} style={{ width: 96, height: 52, flex: 'none' }}>
                    {thumb
                      ? <img src={thumb} alt="" width={96} height={52} className="sm2-shop-bg" />
                      : <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: PET_BACKGROUNDS[reward!.id]?.css }} />}
                    {!resgatada && <span aria-hidden="true" className="sm2-shop-veil" />}
                  </MiniGlass>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ ...sm2Hint, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
                      {isPt ? 'O que ganha' : 'What you get'}
                    </span>
                    <span style={{ ...sm2Text, fontWeight: 500 }}>{rewardName}</span>
                    {resgatada && !shop && (
                      <span data-mission-buy-hint style={sm2Hint}>{isPt ? 'Resgatada — compre na lojinha de Background, no Mercado.' : 'Claimed — buy it in the Background stall at the Market.'}</span>
                    )}
                    {done && !resgatada && (
                      <span style={sm2Hint}>{isPt ? 'Resgate para liberar a compra no Mercado.' : 'Claim it to unlock buying at the Market.'}</span>
                    )}
                    {aviso?.id === m.id && <span role="status" data-mission-buy-flash style={sm2Hint}>{aviso.msg}</span>}
                  </span>
                  {/* C2: bloqueado = cadeado; liberado = Comprar + preço (ou "Seu" se já comprou). */}
                  {!resgatada ? (
                    <span data-mission-locked aria-label={isPt ? 'bloqueado' : 'locked'} style={{ ...sm2Hint, flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <PixelIcon src={STATUS_ICON_ART.cadeado} size={20} />
                      {isPt ? 'bloqueado' : 'locked'}
                    </span>
                  ) : shop && reward ? (
                    shop.ownedBackgrounds.includes(reward.id) ? (
                      <span data-mission-owned style={{ ...sm2Hint, flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="check_circle" size={20} fill={1} tone="primary" />
                        {isPt ? 'Seu' : 'Yours'}
                      </span>
                    ) : confirmando === m.id ? (
                      <button type="button" data-mission-buy-confirm={reward.id} style={{ ...sm2Button('primary', false, 'sm'), flex: 'none' }}
                        onClick={() => {
                          setConfirmando(null);
                          const ok = shop.onBuy(reward.id);
                          setAviso({ id: m.id, ok, msg: ok ? (isPt ? `${rewardName} comprado.` : `${rewardName} purchased.`) : (isPt ? `Saldo insuficiente para ${rewardName}.` : `Not enough to buy ${rewardName}.`) });
                        }}>
                        {isPt ? `Confirmar ${reward.price} Bits` : `Confirm ${reward.price} Bits`}
                      </button>
                    ) : (
                      <button type="button" data-mission-buy={reward.id} style={{ ...sm2Button('primary', shop.balance < reward.price, 'sm'), flex: 'none' }}
                        aria-label={isPt ? `Comprar ${rewardName} por ${reward.price} Bits` : `Buy ${rewardName} for ${reward.price} Bits`}
                        onClick={() => {
                          if (shop.balance < reward.price) { setAviso({ id: m.id, ok: false, msg: isPt ? `Faltam Bits para ${rewardName}. Eles vêm dos minijogos.` : `Not enough Bits for ${rewardName} yet. They come from the minigames.` }); return; }
                          setAviso(null);
                          setConfirmando(m.id);
                        }}>
                        {isPt ? `Comprar · ${reward.price} Bits` : `Buy · ${reward.price} Bits`}
                      </button>
                    )
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
