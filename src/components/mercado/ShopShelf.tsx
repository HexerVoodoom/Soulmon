import { useState, type CSSProperties, type ReactNode } from 'react';
import { bitsStyle, emblemStyle, BITS_EXCHANGE, CREDIT_COLOR, CREDIT_TO_BITS, EMBLEMS_PER_LOSS, EMBLEMS_PER_WIN, MINIGAME_BITS_PER_DAY, type CurrencyId } from '../../utils/currencies';
import { Icon } from '../ui/Icon';
import { InfoTip } from '../ui/InfoTip';
import { BackArrow } from '../ui/BackArrow';
import { MiniGlass } from '../ui/MiniGlass';
import { BitsIcon } from '../ui/BitsIcon';
import { DecorFitTag, ShopItemSheet } from './ShopItemSheet';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import type { ShopItem } from '../../utils/shop';
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { DECOR_ART } from '../../utils/decorArt';
import { ITEM_ART } from '../../utils/itemArt';
import { MISSIONS, isShopItemUnlocked } from '../../utils/missions';
import { itemCurrency } from '../../utils/mercadoCatalog';
import type { SlotId } from '../../utils/petStage';
import { decorBlockReason, decorReasonText, decorRuleText } from '../../utils/decorRules';
import type { WeeklyMission, WeeklyMissionId } from '../../utils/weeklyMissions';
import type { Language } from '../../utils/i18n';

/**
 * A PRATELEIRA — as peças da loja, reempacotadas para morar dentro do
 * `AreaSheet` (minimal-ui F5). Tudo aqui veio da `ShopModal` (canvas "Loja",
 * DECISÕES §26, D-L1…D-L11), que saiu: a mesma prateleira agora serve as
 * lojinhas do Mercado e a loja de Emblemas do Torneio, e a regra de compra
 * continua fora daqui (`onBuy` → `handleShopBuy` do `App.tsx`).
 *
 * ─── O aparelho em vetor, pixel só no vidro (D-L1, D-L2, D-L3) ─────────────
 * Cada card é um botão SIS-03 inteiro; o item é a ARTE REAL dentro de um
 * mini-visor sem anel (`MiniGlass`): 72² para chip e mobília (0,5×), 96×52
 * para cenário (miniatura de `backgrounds/thumbs/`). O emoji é a CHAVE
 * (`item.icon` indexa `ITEM_ART`), nunca o desenho.
 *
 * ─── Estados por FORMA, nunca por alfa (D-L6…D-L9) ────────────────────────
 *   · travado    → borda tracejada `muted`, véu no vidro, tag "locked",
 *                  `aria-disabled`, fora do Tab;
 *   · equipado   → anel 2px `primary-ink` por FORA do vidro + tag
 *                  `check_circle` na coluna de texto;
 *   · comprado   → "Equip" outline dentro do card, na seção "Já são seus" do
 *                  topo — nunca mais misturado ao que está à venda (H7);
 *   · sem saldo  → preço em tinta `muted`; no toque abre o "como conseguir"
 *                  (`HowToEarnSheet`, H8 de 01/10/2026). Nunca `danger`.
 *
 * ─── AS TRÊS MOEDAS (regra de produto, D-L4, D-L10, D-L11) ─────────────────
 *   Bits      → "N Bits" em mono `primary-ink` (`bitsStyle`) com a moeda própria
 *               (`BitsIcon`, I4 de 02/10/2026) antes do número.
 *   Emblemas  → `military_tech` FILL + número em serifa `gold-ink`.
 *   Créditos  → `diamond` FILL em `--sm2-credit-ink`, só na troca.
 */

/** Ícone ao lado de palavra, na mesma linha: saldo, cabeçalho da troca. */
const ICON_INLINE = 20;
/** Ícone dentro de tag (check_circle, lock, military_tech do prêmio) — o
 *  canvas desenha 18; a escala viva (`tokens.md` §6.1) só tem 20/24/32. */
const ICON_TAG = 20;

/** Mini-visor de item/decoração (D-L3). */
const GLASS_ITEM = 72;
/** Mini-visor de cenário (D-L3: miniatura 96×52 a 1×). */
const GLASS_BG_W = 96;
const GLASS_BG_H = 52;

const BG_THUMBS: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob('../../assets/backgrounds/thumbs/*.png', { eager: true, import: 'default' }) as Record<string, string>)
    .map(([p, url]) => [p.replace(/^.*\/([^/]+)\.png$/, '$1'), url]),
);

const bitsNum: CSSProperties = { ...bitsStyle, fontSize: 'var(--sm2-text-md)' };
const emblemNum: CSSProperties = { ...emblemStyle, fontSize: 'var(--sm2-text-lg)' };

/** Tag SIS (chip.tag): 28 de altura, `surface-2`, raio 999, texto 12. */
export const shopTagStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 28, padding: '0 8px',
  borderRadius: 999, backgroundColor: 'var(--sm2-surface-2)', flex: 'none',
  fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-xs)', fontWeight: 500,
  lineHeight: 'var(--sm2-leading-body)', whiteSpace: 'nowrap',
};

/** "Bits" / "Emblems" ao lado do número: Rubik 12 `muted`. */
const unitStyle: CSSProperties = {
  fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-xs)', fontWeight: 400,
  letterSpacing: 0, color: 'var(--sm2-muted)',
};

/** "N Bits" — o valor em mono `primary-ink`, a unidade em Rubik `muted`. */
export function Bits({ value, dim = false, sign = '' }: { value: number; dim?: boolean; sign?: string }) {
  return (
    <span className="sm2-num" style={{ ...bitsNum, display: 'inline-flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap', color: dim ? 'var(--sm2-muted)' : bitsNum.color }}>
      <BitsIcon size={20} />{sign}{value}<span style={unitStyle}>Bits</span>
    </span>
  );
}

/**
 * O SALDO — UMA leitura só, a da moeda que compra o que está na tela. É um
 * `<p>` com texto (não `aria-label` em `<span>` — X6). Mostrar as três juntas
 * aqui seria justamente o que a regra das moedas proíbe: saldo de uma moeda
 * ao lado do preço de outra.
 */
export function CurrencyBalance({ currency, value, language }: { currency: CurrencyId; value: number; language: Language }) {
  const isPt = language === 'pt-BR';
  if (currency === 'emblems') {
    return (
      <p data-balance="emblems" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Icon name="military_tech" size={ICON_INLINE} fill={1} tone="gold" />
        <span className="sm2-num" style={emblemNum}>{value}</span>
        <span style={{ ...unitStyle, marginLeft: 2 }}>{isPt ? 'Honra' : 'Honor'}</span>
      </p>
    );
  }
  if (currency === 'credits') {
    return (
      <p data-balance="credits" style={{ ...sm2Text, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Icon name="diamond" size={ICON_INLINE} fill={1} tone="inherit" style={{ color: CREDIT_COLOR, flexShrink: 0 }} />
        <span className="sm2-num">{value}</span>
        <span style={{ ...unitStyle, marginLeft: 2 }}>{isPt ? 'Créditos' : 'Credits'}</span>
      </p>
    );
  }
  return <p data-balance="bits" style={{ margin: 0 }}><Bits value={value} /></p>;
}

/** Extrai a URL da arte de um cenário pintado; `null` para gradiente. */
function bgImage(css: string | undefined): string | null {
  const m = css?.match(/url\((['"]?)(.*?)\1\)/);
  return m ? m[2] : null;
}

/** Miniatura de um cenário (a mesma da prateleira): o thumb de
 *  `backgrounds/thumbs/`, ou a arte pintada; `null` para gradiente puro.
 *  As Conquistas (H9) mostram com ela o cenário que a missão libera. */
export function bgThumb(id: string): string | null {
  return BG_THUMBS[id] ?? bgImage(PET_BACKGROUNDS[id]?.css);
}

/** Última compra/troca: alimenta a região `aria-live` e o filete do card. */
export interface ShopFlash { id: string; ok: boolean; msg: ReactNode }

/** O "falar" da loja: região `status` + vibração curta. Um por prateleira. */
export function useShopFlash() {
  const [flash, setFlash] = useState<ShopFlash | null>(null);
  const say = (id: string, ok: boolean, msg: ReactNode) => {
    setFlash({ id, ok, msg });
    setTimeout(() => setFlash(f => (f && f.id === id ? null : f)), 2600);
    try { navigator.vibrate?.(ok ? 25 : 60); } catch { /* noop */ }
  };
  return { flash, say };
}

/** A região viva da prateleira. Existe sempre no DOM (região que aparece vazia
 *  não é anunciada em alguns leitores). Recusa é ÂMBAR, nunca `danger`. */
export function ShopStatus({ flash, idle }: { flash: ShopFlash | null; idle: ReactNode }) {
  return (
    <p
      role="status"
      aria-live="polite"
      style={{
        ...sm2Hint, minHeight: 18, margin: 0,
        fontWeight: flash ? 500 : 400,
        color: flash ? (flash.ok ? 'var(--sm2-ink)' : 'var(--sm2-gold-ink)') : 'var(--sm2-muted)',
      }}
    >
      {flash ? flash.msg : idle}
    </p>
  );
}

export interface ShopOwnership {
  ownedBackgrounds: string[];
  equippedBackground: string | null;
  ownedFurniture: string[];
  /** Decoração equipada por espaço do palco (utils/petStage.ts). */
  equippedDecor: Partial<Record<SlotId, string>>;
  /** Progresso por missão (utils/missions.ts) — decide o cadeado. */
  missionProgress: Record<string, number>;
}

export interface ShopActions {
  /** A compra. Quem decide é o `handleShopBuy` do `App.tsx`; devolve false na recusa. */
  onBuy: (itemId: string) => boolean;
  onEquip: (id: string | null) => void;
  /** `id` null limpa o espaço; o slot é sempre obrigatório. */
  onEquipFurniture: (id: string | null, slot: SlotId) => void;
}

/**
 * A lista de itens de UMA moeda. `balance` é o saldo DESSA moeda — o
 * "sem saldo" de cada card é lido contra ele, e é por isso que a prateleira
 * recusa item de outra moeda (ele seria julgado contra o saldo errado).
 */
export function ShopShelf({
  language, items, currency, balance, ownership, actions, say, flash, emptyHint, hideDecorRule = false,
}: {
  language: Language;
  items: ShopItem[];
  currency: 'bits' | 'emblems';
  balance: number;
  ownership: ShopOwnership;
  actions: ShopActions;
  say: (id: string, ok: boolean, msg: ReactNode) => void;
  flash: ShopFlash | null;
  emptyHint?: string;
  /** A lojinha de Decoração já desenha a regra no topo da folha. */
  hideDecorRule?: boolean;
}) {
  const isPt = language === 'pt-BR';
  const { ownedBackgrounds, equippedBackground, ownedFurniture, equippedDecor, missionProgress } = ownership;
  // Defesa das três moedas: item cobrado em outra moeda não entra nesta
  // prateleira, mesmo que alguém o passe por engano.
  const shelf = items.filter(i => itemCurrency(i) === currency);
  /** Item que a pessoa tocou sem saldo — abre o "como conseguir" (H8). */
  const [need, setNeed] = useState<ShopItem | null>(null);
  /** Item tocado COM saldo — espera o "Confirmar" (D1, 02/10/2026). */
  const [confirming, setConfirming] = useState<ShopItem | null>(null);
  /** Item tocado — abre a folha do item (preview grande + comprar/equipar, I5). */
  const [picked, setPicked] = useState<ShopItem | null>(null);

  const isOwned = (item: ShopItem) =>
    (item.kind === 'bg' && ownedBackgrounds.includes(item.id))
    || (item.kind === 'furniture' && ownedFurniture.includes(item.id));
  // H7 (01/10/2026, navegação do dono): o que a pessoa JÁ TEM (comprado, ou
  // ganho — o sofá da escada do Vínculo, a Concha da Feira) não aparece mais
  // À VENDA. Continua alcançável para equipar, numa seção própria no topo.
  const owned = shelf.filter(isOwned);
  const forSale = shelf.filter(i => !isOwned(i));

  const buy = (item: ShopItem) => {
    const name = isPt ? item.namePt : item.nameEn;
    // H8: sem saldo, a compra nem é tentada — abre o modalzinho que diz de
    // onde vem a moeda (as regras reais, lidas das constantes dos donos).
    if (balance < item.price) { setNeed(item); return; }
    // D1 (02/10/2026, navegação do dono): o toque NÃO compra mais — abre a
    // confirmação (custo + saldo depois). A compra de fato é `confirmBuy`.
    setConfirming(item);
  };

  const confirmBuy = (item: ShopItem) => {
    const name = isPt ? item.namePt : item.nameEn;
    setConfirming(null);
    const ok = actions.onBuy(item.id);
    say(item.id, ok, ok
      ? (isPt ? `${name} comprado.` : `${name} purchased.`)
      : (isPt ? `Saldo insuficiente para ${name}.` : `Not enough to buy ${name}.`));
  };

  /** Missão que destrava o item + progresso, na LINHA do item. */
  const lockLine = (item: ShopItem): string => {
    const m = MISSIONS.find(x => x.id === item.unlock?.missionId);
    if (!m) return '';
    const cur = Math.min(missionProgress[m.id] ?? 0, m.target);
    /* WP4.12 (achado E4) — ZERO NÃO É PROGRESSO, é a ausência dele. */
    const prog = m.target > 1 && cur > 0 ? ` · ${cur}/${m.target}` : '';
    return `${isPt ? m.descPt : m.descEn}${prog}`;
  };

  const art = (item: ShopItem, locked: boolean, selected: boolean) => {
    const ring: CSSProperties = selected ? { boxShadow: '0 0 0 2px var(--sm2-primary-ink)' } : {};
    const veil = locked && <span aria-hidden="true" className="sm2-shop-veil" />;
    if (item.kind === 'bg') {
      const bg = PET_BACKGROUNDS[item.id];
      const src = BG_THUMBS[item.id] ?? bgImage(bg?.css);
      return (
        <MiniGlass size={GLASS_ITEM} style={{ width: GLASS_BG_W, height: GLASS_BG_H, ...ring }}>
          {src
            ? <img src={src} alt="" width={GLASS_BG_W} height={GLASS_BG_H} className="sm2-shop-bg" />
            : <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: bg?.css }} />}
          {veil}
        </MiniGlass>
      );
    }
    const png = DECOR_ART[item.id] ?? ITEM_ART[item.icon];
    // Peça de CHÃO fica a 1× (textura; o vidro recorta), o resto a 0,5×.
    const scale = item.slot === 'rug' ? 1 : 0.5;
    return (
      <MiniGlass size={GLASS_ITEM} style={ring}>
        {png
          ? <img src={png} alt="" className="sm2-shop-art" style={{ transform: `translate(-50%, -50%) scale(${scale})` }} />
          : <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1 }}>{item.icon}</span>}
        {veil}
      </MiniGlass>
    );
  };

  const renderItem = (item: ShopItem) => {
    const unlocked = isShopItemUnlocked(item, missionProgress);
    const isEquippable = item.kind === 'bg' || item.kind === 'furniture';
    const ownedList = item.kind === 'bg' ? ownedBackgrounds : item.kind === 'furniture' ? ownedFurniture : [];
    const owned = isEquippable && ownedList.includes(item.id);
    const equippedId = item.kind === 'bg' ? equippedBackground
      : item.kind === 'furniture' && item.slot ? (equippedDecor[item.slot] ?? null)
      : null;
    const equipped = owned && equippedId === item.id;
    const stageBg = equippedBackground ? PET_BACKGROUNDS[equippedBackground] : null;
    // D2 (02/10/2026): o MOTIVO de a peça não aparecer no cenário atual, na linha do item.
    const blocked = item.kind === 'furniture' ? decorBlockReason(item, stageBg) : null;
    const isEmblem = currency === 'emblems';
    const affordable = balance >= item.price;
    const name = isPt ? item.namePt : item.nameEn;
    const failing = flash?.id === item.id && !flash.ok;

    // I5 (02/10/2026): o toque abre a FOLHA DO ITEM; comprar/equipar vivem nela.
    const action = unlocked ? () => setPicked(item) : undefined;

    const status = owned
      ? (equipped ? (isPt ? 'Equipado' : 'Equipped') : (isPt ? 'Equipar' : 'Equip'))
      : null;

    const sub = !unlocked ? lockLine(item)
      : (isPt ? item.descPt : item.descEn);

    return (
      <button
        key={item.id}
        type="button"
        data-shop-item={item.id}
        className={`sm2-shop-item${unlocked ? '' : ' is-locked'}`}
        onClick={action}
        aria-disabled={unlocked ? undefined : true}
        tabIndex={unlocked ? undefined : -1}
        aria-label={unlocked
          ? `${name} — ${owned ? status : `${item.price} ${isEmblem ? (isPt ? 'Honra' : 'Honor') : 'Bits'}`}`
          : `${name} — ${isPt ? 'bloqueado' : 'locked'}: ${lockLine(item)}`}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          minHeight: 64, padding: '8px 12px', textAlign: 'left', boxSizing: 'border-box',
          borderRadius: 'var(--sm2-radius-lg)',
          border: unlocked ? '1px solid var(--sm2-line)' : '1px dashed var(--sm2-muted)',
          backgroundColor: unlocked ? 'var(--sm2-surface)' : 'transparent',
          boxShadow: failing ? 'inset 0 0 0 1px var(--sm2-gold-ink)' : 'none',
          cursor: action ? 'pointer' : 'default',
          transition: 'box-shadow var(--sm2-dur-tap) var(--sm2-ease)',
        }}
      >
        {art(item, !unlocked, equipped)}

        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ ...sm2Text, fontWeight: 500, color: unlocked ? 'var(--sm2-ink)' : 'var(--sm2-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          {item.kind === 'furniture' && <DecorFitTag fits={item.fits} isPt={isPt} />}
          {sub && <span style={sm2Hint}>{sub}</span>}
          {unlocked && blocked && (
            <span data-decor-reason={blocked} style={{ ...sm2Hint, color: 'var(--sm2-gold-ink)' }}>{decorReasonText(blocked, isPt)}</span>
          )}
          {equipped && (
            <span style={{ ...shopTagStyle, alignSelf: 'flex-start', marginTop: 2, color: 'var(--sm2-primary-ink)' }}>
              <Icon name="check_circle" size={ICON_TAG} fill={1} tone="primary" />
              {status}
            </span>
          )}
        </span>

        {!unlocked ? (
          <span aria-hidden="true" style={{ ...shopTagStyle, color: 'var(--sm2-muted)' }}>
            <Icon name="lock" size={ICON_TAG} tone="muted" />
            {isPt ? 'bloqueado' : 'locked'}
          </span>
        ) : owned ? (
          !equipped && (
            <span style={{ ...sm2Button('outline', false, 'sm'), padding: '0 12px', flex: 'none' }}>{status}</span>
          )
        ) : isEmblem ? (
          <span className="sm2-num" style={{ ...emblemNum, display: 'inline-flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap', flex: 'none', color: affordable ? emblemNum.color : 'var(--sm2-muted)' }}>
            {item.price}<span style={unitStyle}>{isPt ? 'Honra' : 'Honor'}</span>
          </span>
        ) : (
          <Bits value={item.price} dim={!affordable} />
        )}
      </button>
    );
  };

  const groupHead: CSSProperties = { ...sm2Hint, margin: '4px 0 0', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 };

  return (
    <div data-shop-shelf={currency} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sm2-space-2, 8px)' }}>
      {!hideDecorRule && shelf.some(i => i.kind === 'furniture') && <DecorRuleLine language={language} />}
      {shelf.length === 0
        ? <p style={{ ...sm2Hint, textAlign: 'center', padding: '16px 0', margin: 0 }}>{emptyHint ?? (isPt ? 'Nada por aqui ainda.' : 'Nothing here yet.')}</p>
        : (
          <>
            {owned.length > 0 && (
              <section data-shop-owned aria-label={isPt ? 'Já são seus' : 'Already yours'} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sm2-space-2, 8px)' }}>
                <h3 style={groupHead}>{isPt ? 'Já são seus' : 'Already yours'}</h3>
                {owned.map(renderItem)}
              </section>
            )}
            <section data-shop-for-sale aria-label={isPt ? 'À venda' : 'For sale'} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sm2-space-2, 8px)' }}>
              {owned.length > 0 && <h3 style={groupHead}>{isPt ? 'À venda' : 'For sale'}</h3>}
              {forSale.length === 0
                ? <p style={{ ...sm2Hint, textAlign: 'center', padding: '16px 0', margin: 0 }}>{isPt ? 'Tudo daqui já é seu.' : 'Everything here is already yours.'}</p>
                : forSale.map(renderItem)}
            </section>
          </>
        )}
      <ShopItemSheet
        item={picked}
        language={language}
        currency={currency}
        balance={balance}
        owned={!!picked && isOwned(picked)}
        equipped={!!picked && isOwned(picked) && (picked.kind === 'bg' ? equippedBackground === picked.id : picked.slot ? equippedDecor[picked.slot] === picked.id : false)}
        onClose={() => setPicked(null)}
        onBuy={it => { setPicked(null); buy(it); }}
        onEquip={it => {
          const eq = it.kind === 'bg' ? equippedBackground === it.id : it.slot ? equippedDecor[it.slot] === it.id : false;
          setPicked(null);
          if (it.kind === 'bg') actions.onEquip(eq ? null : it.id); else if (it.slot) actions.onEquipFurniture(eq ? null : it.id, it.slot);
        }}
        bitsPrice={(v, dim) => <Bits value={v} dim={dim} />}
        emblemPrice={(v, dim) => (
          <span className="sm2-num" style={{ ...emblemNum, display: 'inline-flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap', color: dim ? 'var(--sm2-muted)' : emblemNum.color }}>
            {v}<span style={unitStyle}>{isPt ? 'Honra' : 'Honor'}</span>
          </span>
        )}
      />
      <PurchaseConfirmSheet
        open={!!confirming}
        language={language}
        question={confirming
          ? <PurchaseQuestion name={isPt ? confirming.namePt : confirming.nameEn} price={confirming.price} currency={currency} isPt={isPt} />
          : null}
        balance={balance}
        cost={confirming?.price ?? 0}
        currency={currency}
        onCancel={() => setConfirming(null)}
        onConfirm={() => { if (confirming) confirmBuy(confirming); }}
      />
      <HowToEarnSheet item={need} currency={currency} language={language} onClose={() => setNeed(null)} />
    </div>
  );
}

/**
 * A REGRA DA DECORAÇÃO, no topo da tela (D2, 02/10/2026): quantas peças cabem
 * e onde elas aparecem. Texto único (`utils/decorRules.ts`) para a loja e para
 * a loja de Honra do Torneio dizerem a mesma coisa.
 */
export function DecorRuleLine({ language }: { language: Language }) {
  const t = decorRuleText(language === 'pt-BR');
  return (
    <div data-decor-rule style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <p style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>{language === 'pt-BR' ? 'Regra da decoração' : 'Decoration rule'}</p>
      {/* I13 (02/10/2026): a regra inteira mora atrás do "?" (texto único em `decorRules`). */}
      <InfoTip language={language} label={language === 'pt-BR' ? 'Como funciona a decoração' : 'How decoration works'} align="right">
        <span style={{ display: 'block', fontWeight: 500 }}>{t.limit}</span>
        <span style={{ display: 'block', marginTop: 6 }}>{t.scenes}</span>
      </InfoTip>
    </div>
  );
}

/** Nome da moeda, para a linha de saldo da confirmação. */
function unitName(currency: CurrencyId, isPt: boolean): string {
  if (currency === 'emblems') return isPt ? 'Honra' : 'Honor';
  if (currency === 'credits') return isPt ? 'Créditos' : 'Credits';
  return 'Bits';
}

/** "Comprar X por N Bits?" — a pergunta da confirmação (D1). */
export function PurchaseQuestion({ name, price, currency, isPt }: {
  name: string; price: number; currency: CurrencyId; isPt: boolean;
}) {
  return (
    <>
      {isPt ? 'Comprar ' : 'Buy '}<strong>{name}</strong>{isPt ? ' por ' : ' for '}
      <span className="sm2-num">{price}</span> {unitName(currency, isPt)}?
    </>
  );
}

/**
 * D1 (02/10/2026, navegação do dono) — CONFIRMAR A COMPRA. Comprar no Mercado
 * deixou de ser um toque só: o card abre esta folha com a pergunta, o custo e
 * o saldo antes e depois, e só o "Confirmar" gasta. É o mesmo vocabulário do
 * "como conseguir" (L10): informação sóbria, sem urgência. Cancelar e a seta
 * de voltar (padrão do app) fecham sem gastar nada. Vale para item, decoração,
 * cenário e para a troca de Créditos — qualquer saída de moeda do Mercado.
 *
 * Só abre com saldo: o caso sem saldo continua sendo o "como conseguir".
 */
export function PurchaseConfirmSheet({ open, language, question, balance, cost, currency, onCancel, onConfirm }: {
  open: boolean;
  language: Language;
  question: ReactNode;
  /** Saldo da moeda que paga, antes da compra. */
  balance: number;
  cost: number;
  currency: CurrencyId;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isPt = language === 'pt-BR';
  const unit = unitName(currency, isPt);
  const row: CSSProperties = { ...sm2Text, margin: 0, display: 'flex', justifyContent: 'space-between', gap: 12 };
  return (
    <ModalSheet open={open} title={isPt ? 'Confirmar compra' : 'Confirm purchase'} onClose={onCancel} language={language} maxWidth={420}>
      <div data-purchase-confirm style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BackArrow onClick={onCancel} language={language} style={{ margin: '-8px 0 -4px -10px' }} />
        <p data-purchase-question style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>{question}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={row}><span style={sm2Hint}>{isPt ? 'Custo' : 'Cost'}</span><span className="sm2-num" data-purchase-cost>{cost} {unit}</span></p>
          <p style={row}><span style={sm2Hint}>{isPt ? 'Saldo agora' : 'Balance now'}</span><span className="sm2-num">{balance} {unit}</span></p>
          <p style={row}><span style={sm2Hint}>{isPt ? 'Saldo depois' : 'Balance after'}</span><span className="sm2-num" data-purchase-after>{Math.max(0, balance - cost)} {unit}</span></p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" data-purchase-cancel onClick={onCancel} style={{ ...sm2Button('outline'), flex: 1 }}>
            {isPt ? 'Cancelar' : 'Cancel'}
          </button>
          <button type="button" data-purchase-ok onClick={onConfirm} style={{ ...sm2Button('primary'), flex: 1 }}>
            {isPt ? 'Confirmar' : 'Confirm'}
          </button>
        </div>
      </div>
    </ModalSheet>
  );
}

/**
 * H8 (01/10/2026, navegação do dono) — "COMO CONSEGUIR": tocar num item sem
 * saldo abre esta folhinha em vez de só avisar "saldo insuficiente". Ela diz,
 * em texto sóbrio (L10 da bíblia: a informação nunca é só ficção), DE ONDE
 * vem a moeda — e os números saem das constantes dos donos, nunca de texto à
 * mão: o teto diário dos minijogos (`MINIGAME_BITS_PER_DAY`), a troca de
 * Créditos (`CREDIT_TO_BITS`) e a Honra por partida (`EMBLEMS_PER_WIN`/`_LOSS`).
 * Sem "faltam N", sem contagem regressiva, sem urgência: é mapa, não cobrança.
 */
export function HowToEarnSheet({ item, currency, language, onClose }: {
  item: ShopItem | null;
  currency: 'bits' | 'emblems';
  language: Language;
  onClose: () => void;
}) {
  const isPt = language === 'pt-BR';
  const name = item ? (isPt ? item.namePt : item.nameEn) : '';
  const isEmblem = currency === 'emblems';
  const title = isEmblem
    ? (isPt ? 'Como conseguir Honra' : 'How to get Honor')
    : (isPt ? 'Como conseguir Bits' : 'How to get Bits');
  const ways: { key: string; icon: string; text: string }[] = isEmblem
    ? [
        {
          key: 'torneio', icon: 'military_tech',
          text: isPt
            ? `No Torneio, na Arena: ${EMBLEMS_PER_WIN} de Honra por vitória e ${EMBLEMS_PER_LOSS} por partida que não vence.`
            : `In the Tournament, in the Arena: ${EMBLEMS_PER_WIN} Honor per win and ${EMBLEMS_PER_LOSS} per match you don't win.`,
        },
        {
          key: 'semana', icon: 'flag',
          text: isPt
            ? 'As missões da semana, também no Torneio, pagam Honra.'
            : "The week's missions, also in the Tournament, pay Honor.",
        },
      ]
    : [
        {
          key: 'jogos', icon: 'casino',
          text: isPt
            ? `Nos minijogos: a Masmorra (Exploração), o Salão de Jogos e o Ateliê da Mente (Jogos) pagam Bits — até ${MINIGAME_BITS_PER_DAY} por dia, somando todos.`
            : `In the minigames: the Dungeon (Exploration), the Game Hall and the Mind Workshop (Games) pay Bits — up to ${MINIGAME_BITS_PER_DAY} a day, all together.`,
        },
        {
          key: 'creditos', icon: 'diamond',
          text: isPt
            ? `Créditos viram Bits na lojinha de Itens, na aba Créditos: ${CREDIT_TO_BITS} Bits por Crédito.`
            : `Credits turn into Bits in the Items stall, on the Credits tab: ${CREDIT_TO_BITS} Bits per Credit.`,
        },
      ];
  return (
    <ModalSheet open={!!item} title={title} onClose={onClose} language={language} maxWidth={480}>
      <div data-how-to-earn={currency} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ ...sm2Text, margin: 0 }}>
          {isEmblem
            ? (isPt ? `${name} custa ${item?.price ?? 0} de Honra.` : `${name} costs ${item?.price ?? 0} Honor.`)
            : (isPt ? `${name} custa ${item?.price ?? 0} Bits.` : `${name} costs ${item?.price ?? 0} Bits.`)}
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ways.map(w => (
            <li key={w.key} data-how-to-earn-way={w.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Icon name={w.icon} size={24} tone={isEmblem ? 'gold' : 'primary'} fill={1} />
              <span style={{ ...sm2Text, flex: 1, minWidth: 0 }}>{w.text}</span>
            </li>
          ))}
        </ul>
        <button type="button" data-how-to-earn-ok onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }}>
          {isPt ? 'Entendi' : 'Got it'}
        </button>
      </div>
    </ModalSheet>
  );
}

/** A troca Créditos → Bits (a única coisa que Créditos fazem no Mercado).
 *  Não existe o caminho contrário — ver `utils/currencies.ts`. */
export function CreditExchange({ language, credits, onExchangeCredits, say }: {
  language: Language;
  credits: number;
  /** Devolve false se o servidor recusar o gasto. */
  onExchangeCredits: (credits: number) => Promise<boolean>;
  say: (id: string, ok: boolean, msg: ReactNode) => void;
}) {
  const isPt = language === 'pt-BR';
  const [exchanging, setExchanging] = useState<number | null>(null);
  /** Pacote tocado — a troca gasta Créditos, então também espera o "Confirmar" (D1). */
  const [pending, setPending] = useState<(typeof BITS_EXCHANGE)[number] | null>(null);
  const doExchange = async (pack: (typeof BITS_EXCHANGE)[number]) => {
    setPending(null);
    setExchanging(pack.credits);
    let ok = false;
    try { ok = await onExchangeCredits(pack.credits); } finally { setExchanging(null); }
    say(`exch-${pack.credits}`, ok, ok
      ? <><Bits value={pack.bits} sign="+" />.</>
      : (isPt ? 'A troca não foi concluída. Tente de novo.' : 'The swap did not go through. Try again.'));
  };
  return (
    <div data-credit-exchange style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
      <p style={{ ...sm2Text, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="diamond" size={ICON_INLINE} fill={1} tone="inherit" style={{ color: CREDIT_COLOR, flexShrink: 0 }} />
        <span>
          {isPt ? 'Trocar Créditos por Bits — você tem ' : 'Swap Credits for Bits — you have '}
          <span className="sm2-num">{credits}</span>
        </span>
      </p>
      {BITS_EXCHANGE.map(pack => {
        const busy = exchanging === pack.credits;
        const can = credits >= pack.credits && exchanging === null;
        return (
          <button
            key={pack.credits}
            type="button"
            disabled={!can}
            aria-busy={busy || undefined}
            aria-label={isPt ? `Trocar ${pack.credits} Créditos por ${pack.bits} Bits` : `Swap ${pack.credits} Credits for ${pack.bits} Bits`}
            onClick={() => setPending(pack)}
            style={{ ...sm2Button('outline', !can), width: '100%', gap: 8 }}
          >
            {busy && <Icon name="sync" size={ICON_INLINE} tone="muted" />}
            <span>
              {isPt ? 'Trocar ' : 'Swap '}<span className="sm2-num">{pack.credits}</span>{isPt ? ' Créditos por ' : ' Credits for '}
            </span>
            <span className="sm2-num" style={{ ...bitsNum, color: can ? bitsNum.color : 'var(--sm2-muted)' }}>{pack.bits} Bits</span>
          </button>
        );
      })}
      <PurchaseConfirmSheet
        open={!!pending}
        language={language}
        question={pending
          ? <>
              {isPt ? 'Trocar ' : 'Swap '}<span className="sm2-num">{pending.credits}</span>
              {isPt ? ' Créditos por ' : ' Credits for '}<span className="sm2-num">{pending.bits}</span> Bits?
            </>
          : null}
        balance={credits}
        cost={pending?.credits ?? 0}
        currency="credits"
        onCancel={() => setPending(null)}
        onConfirm={() => { if (pending) void doExchange(pending); }}
      />
    </div>
  );
}

/**
 * AS MISSÕES DA SEMANA (WP4.7) — pagas em Emblemas. Moram no Torneio, onde os
 * Emblemas são gastos: a torneira e o ralo na mesma folha.
 *
 * Nenhuma missão premia CONTAGEM DE TAREFAS (proibição escrita do CLAUDE.md;
 * há teste varrendo o pool).
 */
export function WeeklyMissionList({ language, weeklyMissions, onClaimWeekly }: {
  language: Language;
  weeklyMissions: { mission: WeeklyMission; count: number; done: boolean; claimed: boolean }[];
  onClaimWeekly?: (id: WeeklyMissionId) => void;
}) {
  const isPt = language === 'pt-BR';
  if (weeklyMissions.length === 0) {
    return <p style={{ ...sm2Hint, textAlign: 'center', padding: '16px 0', margin: 0 }}>{isPt ? 'As missões da semana aparecem aqui.' : "This week's missions show up here."}</p>;
  }
  return (
    <ul data-weekly-missions style={{ display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'none', margin: 0, padding: 0 }}>
      {weeklyMissions.map(({ mission, count, done, claimed }) => (
        <li
          key={mission.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, minHeight: 56, padding: '8px 12px',
            boxSizing: 'border-box',
            borderRadius: 'var(--sm2-radius-lg)', border: '1px solid var(--sm2-line)',
            backgroundColor: 'var(--sm2-surface)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Missão paga vira registro: tinta `muted`, nunca `opacity`. */}
            <p style={{ ...sm2Text, margin: 0, color: claimed ? 'var(--sm2-muted)' : 'var(--sm2-ink)' }}>{isPt ? mission.descPt : mission.descEn}</p>
            {/* Progresso só quando ele JÁ COMEÇOU (WP4.12). */}
            {!done && count > 0 && (
              <>
                <p className="sm2-num" style={{ ...sm2Hint, margin: 0 }}>{count}/{mission.target}</p>
                <span aria-hidden="true" className="sm2-shop-meter" style={{ width: 120 }}>
                  <i style={{ width: `${Math.round(Math.min(1, count / mission.target) * 100)}%` }} />
                </span>
              </>
            )}
          </div>
          {claimed ? (
            <span style={{ ...sm2Hint, whiteSpace: 'nowrap', flex: 'none' }}>{isPt ? 'recebido' : 'claimed'}</span>
          ) : done ? (
            <button
              type="button"
              onClick={() => onClaimWeekly?.(mission.id)}
              aria-label={isPt ? `Receber ${mission.emblems} de Honra` : `Claim ${mission.emblems} Honor`}
              style={{ ...sm2Button('primary', false, 'sm'), whiteSpace: 'nowrap', flex: 'none', gap: 4 }}
            >
              <Icon name="military_tech" size={ICON_TAG} fill={1} tone="inherit" />
              <span className="sm2-num" style={{ ...emblemStyle, color: 'inherit', fontSize: 'var(--sm2-text-md)' }}>+{mission.emblems}</span>
            </button>
          ) : (
            <span aria-label={isPt ? `${mission.emblems} de Honra` : `${mission.emblems} Honor`} role="img" style={{ ...shopTagStyle, color: 'var(--sm2-gold-ink)' }}>
              <Icon name="military_tech" size={ICON_TAG} fill={1} tone="gold" />
              <span className="sm2-num" style={{ ...emblemStyle, fontSize: 'var(--sm2-text-md)' }}>+{mission.emblems}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
