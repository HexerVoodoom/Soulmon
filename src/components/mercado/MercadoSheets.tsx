import { missionsInQueueOrder } from '../../utils/missionOrder';
import { useState, type CSSProperties } from 'react';
import { PixelTabs } from '../pixel/PixelKit';
import { Icon } from '../ui/Icon';
import { BitsAmount } from '../ui/BitsAmount';
import { BitsIcon } from '../ui/BitsIcon';
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
import { CREDIT_COLOR, type CurrencyId } from '../../utils/currencies';
import type { Language } from '../../utils/i18n';
import { elementsMatchingBases, isPotionUnlocked } from '../../utils/elementPotion';
import { essenceName, ESSENCE_MAX_PER_ELEMENT } from '../../utils/essences';
import { essencePackPrice, ESSENCE_PACK_SIZES } from '../../utils/essenceShop';
import { ElementBaseSlots, ElementIcon, emptySlots } from '../ElementBaseSlots';
import { GuildOwnedShelf } from './GuildOwnedShelf';
import { SubscriptionShelf } from './SubscriptionShelf';
import { FrameShelf } from './FrameShelf';
import {
  CreditExchange, CurrencyBalance, PurchaseConfirmSheet, DecorRuleLine, ShopShelf, ShopStatus, WeeklyMissionList, bgThumb, useShopFlash,
  type ShopActions, type ShopOwnership,
} from './ShopShelf';
import type { WeeklyMission, WeeklyMissionId } from '../../utils/weeklyMissions';

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

/**
 * D-25 (19/10/2026): a moeda da lojinha em PÍLULAS com ícone — Bits (moeda própria) e Honor (medalha dourada),
 * uma fileira só. Escolha única (`tablist`/`tab`); o nome da pílula é o texto ("Bits", "Honor"), o ícone é
 * decorativo. Cada moeda mantém o ícone e a tinta próprios: nunca Bits e Honra com o mesmo ícone.
 */
export function CurrencyPills({ tabs, value, onChange, isPt }: {
  tabs: readonly CurrencyId[]; value: CurrencyId; onChange: (c: CurrencyId) => void; isPt: boolean;
}) {
  return (
    <div role="tablist" aria-label={isPt ? 'Moeda da lojinha' : 'Stall currency'} data-currency-pills style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {tabs.map(c => {
        const on = c === value;
        return (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={on}
            data-currency-pill={c}
            className={on ? 'sm2-kit-chip sm2-kit-chip-on' : 'sm2-kit-chip'}
            onClick={() => onChange(c)}
          >
            {c === 'bits' ? <BitsIcon size={20} />
              : c === 'emblems' ? <Icon name="military_tech" size={20} fill={1} tone="gold" />
              : <Icon name="diamond" size={20} fill={1} tone="inherit" style={{ color: CREDIT_COLOR }} />}
            <span>{currencyLabel(c, isPt)}</span>
          </button>
        );
      })}
    </div>
  );
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
  /** D-24: a aba em que a lojinha de Background abre (o Perfil leva a `frames`). Padrão: `backgrounds`. */
  initialKind?: StallKind;
  /** D-58: as missões da semana (pagas em Honra) moram no TOPO da aba Honra do Mercado. Sem elas, a aba não as desenha. */
  weekly?: { mission: WeeklyMission; count: number; done: boolean; claimed: boolean }[];
  onClaimWeekly?: (id: WeeklyMissionId) => void;
}

/** As duas abas da lojinha de Background (D-24): Backgrounds à esquerda (abre nela), Frames à direita. */
export type StallKind = 'backgrounds' | 'frames';
export const STALL_KIND_ORDER: readonly StallKind[] = ['backgrounds', 'frames'];

/** Uma lojinha de compra (Itens, Decoração ou Background), com abas por moeda. */
export function MercadoStallSheet(props: MercadoStallProps) {
  const { stall, language, points, emblems, initialKind, weekly, onClaimWeekly } = props;
  const isPt = language === 'pt-BR';
  const tabs = STALL_CURRENCIES[stall];
  const [cur, setCur] = useState<'bits' | 'emblems'>(tabs[0] as 'bits' | 'emblems');
  const { flash, say } = useShopFlash();
  /** C3: a lojinha da Panora vende DUAS coisas — separadas em Backgrounds / Frames; a moeda (Bits / Honra) fica dentro de cada uma. */
  const [kind, setKind] = useState<StallKind>(initialKind ?? 'backgrounds');
  const showFrames = stall === 'background' && kind === 'frames';
  const balance = cur === 'emblems' ? emblems : points;

  return (
    <div data-mercado-stall={stall} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={stickyHead}>
        {stall === 'background' && (
          <PixelTabs
            items={STALL_KIND_ORDER.map(k => ({ key: k, label: k === 'frames' ? (isPt ? 'Molduras' : 'Frames') : 'Backgrounds' }))}
            value={kind}
            onChange={setKind}
            ariaLabel={isPt ? 'O que a Panora vende' : 'What Panora sells'}
          />
        )}
        {tabs.length > 1 && (
          <CurrencyPills tabs={tabs} value={cur} onChange={c => setCur(c as 'bits' | 'emblems')} isPt={isPt} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ShopStatus flash={flash} idle={idleLine(cur, isPt)} language={language} />
          </div>
          <CurrencyBalance currency={cur} value={balance} language={language} />
        </div>
      </div>


      {/* D-58 (19/10/2026): as missões da semana (pagas em Honra) abrem a aba Honra — a torneira ao lado do ralo, e só ali. */}
      {cur === 'emblems' && weekly && weekly.length > 0 && (
        <section data-mercado-weekly aria-label={isPt ? 'Missões da semana' : 'Weekly missions'} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 className="sm2-title" style={{ margin: 0, fontSize: 'var(--sm2-text-md)' }}>{isPt ? 'Esta semana' : 'This week'}</h3>
          <WeeklyMissionList language={language} weeklyMissions={weekly} onClaimWeekly={onClaimWeekly} />
        </section>
      )}

      {/* D2 (02/10/2026): a regra da decoração no TOPO — quantas peças cabem e onde aparecem. */}
      {stall === 'decoracao' && <DecorRuleLine language={language} />}

      {/* O que a roda deu (cenários do Bosque, Concha da Maré): só EQUIPA, sem preço.
          NO TOPO, antes de ~20 cenários da loja (QA L3 M4): o que se ganhou não se procura no fim.
          Vazio é silêncio — a seção nem desenha o título. */}
      {!showFrames && (stall === 'background' || stall === 'decoracao') && (
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
      {showFrames ? (
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
          // B1: cenário de conquista só se compra no prédio Conquistas; aqui só aparece se já é seu (para equipar).
          items={stallItems(stall, cur).filter(i => i.unlock?.kind !== 'mission' || props.ownedBackgrounds.includes(i.id) || (props.ownedFurniture ?? []).includes(i.id))}
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
  const list = missionsInQueueOrder(
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
          const resgatada = done && (!m.bgReward || claimed === undefined || claimed.includes(m.id));
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
                      <button type="button" data-mission-buy-confirm={reward.id} aria-label={isPt ? `Confirmar ${reward.price} Bits` : `Confirm ${reward.price} Bits`} style={{ ...sm2Button('primary', false, 'sm'), flex: 'none' }}
                        onClick={() => {
                          setConfirmando(null);
                          const ok = shop.onBuy(reward.id);
                          setAviso({ id: m.id, ok, msg: ok ? (isPt ? `${rewardName} comprado.` : `${rewardName} purchased.`) : (isPt ? `Saldo insuficiente para ${rewardName}.` : `Not enough to buy ${rewardName}.`) });
                        }}>
                        {isPt ? 'Confirmar' : 'Confirm'} <BitsAmount value={reward.price} size={16} style={{ color: 'inherit' }} />
                      </button>
                    ) : (
                      <button type="button" data-mission-buy={reward.id} style={{ ...sm2Button('primary', shop.balance < reward.price, 'sm'), flex: 'none' }}
                        aria-label={isPt ? `Comprar ${rewardName} por ${reward.price} Bits` : `Buy ${rewardName} for ${reward.price} Bits`}
                        onClick={() => {
                          if (shop.balance < reward.price) { setAviso({ id: m.id, ok: false, msg: isPt ? `Faltam Bits para ${rewardName}. Eles vêm dos minijogos.` : `Not enough Bits for ${rewardName} yet. They come from the minigames.` }); return; }
                          setAviso(null);
                          setConfirmando(m.id);
                        }}>
                        {isPt ? 'Comprar' : 'Buy'} · <BitsAmount value={reward.price} size={16} style={{ color: 'inherit' }} />
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


// ─────────────────────────────────────────────────────────────────────────────
// CAMBISTA (30/10/2026, dono) — o prédio da troca. Abas: Bits (a troca Créditos → Bits e o convite
// passivo, que moravam na lojinha de Itens), Essências (compra por Créditos no servidor, §205;
// sem campo novo no save) e Outros (reservada para futuros itens, como energia).
// ─────────────────────────────────────────────────────────────────────────────

export type CambistaTab = 'bits' | 'essences' | 'other';
export const CAMBISTA_TABS: readonly CambistaTab[] = ['bits', 'essences', 'other'];

export interface CambistaSheetProps {
  language: Language;
  credits: number;
  onExchangeCredits: (credits: number) => Promise<boolean>;
  /** WP5.1 — o canal PASSIVO. `demo` vê o convite permanente na aba Bits (a do dinheiro real). */
  accountTier?: 'demo' | 'paid';
  onUnlock?: () => void;
  /** Elementos desbloqueados na Biblioteca (`defeatedElements`): o resto aparece como "???". */
  unlockedElements?: readonly string[];
  /** Saldo de essências (só para mostrar "você tem N" e o teto). */
  essences?: Record<string, number>;
  /** §205: compra no SERVIDOR (preço, saldo e trancado decididos lá). Sem a prop, a lista é só vitrine. */
  onBuyEssence?: (element: string, qty: number) => Promise<boolean>;
}

export function CambistaSheet({ language, credits, onExchangeCredits, accountTier, onUnlock, unlockedElements, essences, onBuyEssence }: CambistaSheetProps) {
  const isPt = language === 'pt-BR';
  const [tab, setTab] = useState<CambistaTab>('bits');
  const [slots, setSlots] = useState<(string | null)[]>(emptySlots);
  const { flash, say } = useShopFlash();
  const [pendingEss, setPendingEss] = useState<{ id: string; qty: number; price: number } | null>(null);
  const [buyingEss, setBuyingEss] = useState(false);
  const confirmEssence = async () => {
    const p = pendingEss;
    if (!p || !onBuyEssence) return;
    setPendingEss(null);
    setBuyingEss(true);
    try { await onBuyEssence(p.id, p.qty); } finally { setBuyingEss(false); }
  };
  const label = (t: CambistaTab) => t === 'bits' ? 'Bits' : t === 'essences' ? (isPt ? 'Essências' : 'Essences') : (isPt ? 'Outros' : 'Other');
  return (
    <div data-cambista data-cambista-tab={tab} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={stickyHead}>
        <PixelTabs
          items={CAMBISTA_TABS.map(t => ({ key: t, label: label(t) }))}
          value={tab}
          onChange={setTab}
          ariaLabel={isPt ? 'O que o Cambista troca' : 'What the Exchanger trades'}
        />
        {tab === 'bits' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ShopStatus flash={flash} idle={idleLine('credits', isPt)} language={language} />
            </div>
            <CurrencyBalance currency="credits" value={credits} language={language} />
          </div>
        )}
      </div>

      {tab === 'bits' && (
        <>
          <CreditExchange language={language} credits={credits} onExchangeCredits={onExchangeCredits} say={say} />
          {/* ─── O CONVITE PERMANENTE (WP5.1, canal PASSIVO) ───────────────
              A pessoa ENCONTRA: fora do cap semanal, não some com `offerDismissed`, sem ×.
              Mora na aba do dinheiro real, DEPOIS do que a pessoa veio ver. */}
          {tab === 'bits' && accountTier === 'demo' && onUnlock && (
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
      )}

      {tab === 'essences' && (
        <section data-cambista-essences aria-label={isPt ? 'Essências' : 'Essences'} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ ...sm2Hint, margin: 0, flex: 1, minWidth: 0 }}>
              {isPt ? 'Essências por Créditos: 1 por elemento base, 2 por par, 3 por tripla. Pacote de 5 sai com 10% de desconto.' : 'Essences for Credits: 1 per base element, 2 per pair, 3 per triple. A pack of 5 is 10% off.'}
            </p>
            <CurrencyBalance currency="credits" value={credits} language={language} />
          </div>
          <p style={{ ...sm2Hint, margin: 0 }}>
            {isPt ? 'Filtre por até 3 elementos base: aparecem só as essências que contêm todos eles.' : 'Filter by up to 3 base elements: only essences that contain all of them are listed.'}
          </p>
          <ElementBaseSlots slots={slots} isPt={isPt} onChange={(i, id) => setSlots(v => v.map((x, j) => (j === i ? id : x)))} />
          <ul data-cambista-essence-list style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2, maxHeight: 320, overflowY: 'auto' }}>
            {elementsMatchingBases(slots).map(id => {
              const known = isPotionUnlocked(id, unlockedElements);
              const owned = essences?.[id] ?? 0;
              const name = known ? essenceName(id, isPt) : '???';
              return (
                <li key={id} data-essence-row={id} data-essence-locked={known ? undefined : ''} style={{ opacity: known ? 1 : 0.6, minHeight: 40, display: 'flex', alignItems: 'center', gap: 8, ...sm2Text }}>
                  {known ? <ElementIcon id={id} size={24} /> : <span aria-hidden="true" style={{ width: 24, textAlign: 'center' }}>?</span>}
                  <span style={{ flex: 1, minWidth: 0 }} aria-label={known ? undefined : (isPt ? 'Elemento ainda não desbloqueado na Biblioteca' : 'Element not yet unlocked in the Library')}>
                    {name}
                    {known && <span data-essence-owned className="sm2-num" style={{ ...sm2Hint, marginLeft: 6 }}>×{owned}</span>}
                  </span>
                  {known && onBuyEssence ? ESSENCE_PACK_SIZES.map(qty => {
                    const price = essencePackPrice(id, qty);
                    const can = price > 0 && credits >= price && !buyingEss && owned + qty <= ESSENCE_MAX_PER_ELEMENT;
                    return (
                      <button
                        key={qty}
                        type="button"
                        data-essence-buy={qty}
                        disabled={!can}
                        aria-label={isPt ? `Comprar ${qty} ${name} por ${price} ${price === 1 ? 'Crédito' : 'Créditos'}` : `Buy ${qty} ${name} for ${price} ${price === 1 ? 'Credit' : 'Credits'}`}
                        onClick={() => setPendingEss({ id, qty, price })}
                        style={{ ...sm2Button('outline', !can), flexShrink: 0, padding: '4px 8px', gap: 4 }}
                      >
                        <span>{qty === 1 ? (isPt ? 'Comprar' : 'Buy') : '×5'}</span>
                        <Icon name="diamond" size={20} fill={1} tone="inherit" style={{ color: CREDIT_COLOR }} />
                        <span className="sm2-num" data-essence-price>{price}</span>
                      </button>
                    );
                  }) : (
                    <span style={{ ...sm2Hint, flexShrink: 0 }}>{known ? (isPt ? `${essencePackPrice(id, 1)} Créd.` : `${essencePackPrice(id, 1)} Cr.`) : (isPt ? 'trancado' : 'locked')}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <PurchaseConfirmSheet
            open={!!pendingEss}
            language={language}
            question={pendingEss
              ? (isPt
                ? <>Comprar <span className="sm2-num">{pendingEss.qty}</span> {essenceName(pendingEss.id, true)}?</>
                : <>Buy <span className="sm2-num">{pendingEss.qty}</span> {essenceName(pendingEss.id, false)}?</>)
              : null}
            balance={credits}
            cost={pendingEss?.price ?? 0}
            currency="credits"
            onCancel={() => setPendingEss(null)}
            onConfirm={() => { void confirmEssence(); }}
          />
        </section>
      )}

      {tab === 'other' && (
        <p data-cambista-other style={{ ...sm2Hint, margin: 0 }}>
          {isPt ? 'Em breve: outras trocas, como energia.' : 'Coming soon: other trades, like energy.'}
        </p>
      )}
    </div>
  );
}
