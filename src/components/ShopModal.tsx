import { useState, type CSSProperties, type ReactNode } from 'react';
import { bitsStyle, emblemStyle, BITS_EXCHANGE, CREDIT_COLOR } from '../utils/currencies';
import { Icon } from './ui/Icon';
import { MiniGlass } from './ui/MiniGlass';
import { ModalSheet, Segment, sm2Button, sm2Hint, sm2Text, sm2TitleStyle } from './form/FormKit';
import { SHOP_ITEMS, TOURNAMENT_ITEMS, type ShopItem } from '../utils/shop';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { DECOR_ART } from '../utils/decorArt';
import { ITEM_ART } from '../utils/itemArt';
import { MISSIONS, isShopItemUnlocked } from '../utils/missions';
import { decorFitsSetting, type SlotId } from '../utils/petStage';
import type { WeeklyMission, WeeklyMissionId } from '../utils/weeklyMissions';
import { UnlockNudge } from './UnlockAccountModal';
import type { Language } from '../utils/i18n';

/**
 * LOJA — canvas "Loja" (identidade, DECISÕES §26, D-L1…D-L11).
 *
 * ─── O aparelho em vetor, pixel só no vidro (D-L1, D-L2, D-L3) ─────────────
 * Cada card é um botão SIS-03 inteiro; o item é a ARTE REAL dentro de um
 * mini-visor sem anel (`MiniGlass`): 72² para chip (96² → 48, 0,5×) e mobília
 * (0,5× do nativo), 96×52 para cenário (a miniatura 96×52 de
 * `backgrounds/thumbs/`, derivada da ilustração 1200×648 — rodada 2 da
 * `squad-arte`, 21/09/2026; cenário sem miniatura cai na ilustração reduzida).
 * O emoji continua sendo a CHAVE (`item.icon` indexa `ITEM_ART`), nunca o
 * desenho.
 *
 * ─── Estados por FORMA, nunca por alfa (D-L6, D-L7, D-L8, D-L9) ───────────
 *   · travado    → borda tracejada `muted`, nome `muted`, véu `color-mix` no
 *                  vidro, `lock` 18 + "locked" numa tag `aria-hidden`;
 *                  `aria-disabled`, fora da ordem de foco.
 *   · equipado   → anel 2px `primary-ink` por FORA do vidro + tag
 *                  `check_circle` na COLUNA DE TEXTO (X1: à direita, a tag
 *                  espremia o nome — o nome nunca quebra, ellipsis).
 *   · comprado   → "Equip" = outline 44 dentro do card (o card é o alvo).
 *   · sem saldo  → o preço esmaece por TINTA (`muted`); no toque, SÓ o filete
 *                  1px `gold-ink` + a região `status` em `gold-ink` (X2: a
 *                  copy do card não muda — dourado é a cor do convite). O
 *                  `danger` não entra nesta tela: o app nunca cobra.
 *
 * ─── AS TRÊS MOEDAS (regra de produto, D-L4, D-L10, D-L11) ─────────────────
 *   Bits      → "N Bits" em `--sm2-font-mono` 16 `primary-ink` (`bitsStyle`),
 *               SEM ícone, sem chip — no saldo, no preço, na região e no toast.
 *   Emblemas  → `military_tech` FILL + número em serifa `gold-ink`
 *               (`emblemStyle`) — saldo, preço e prêmio da missão.
 *   Créditos  → `diamond` FILL em `--sm2-credit-ink`, só na troca.
 *
 * O saldo é UMA leitura só (a moeda do segmento) num `<p>` com texto — não
 * `aria-label` em `<span>` (X6); a única região `status` é a do flash.
 */

type ShopSegment = 'shop' | 'tournament';

/** Ícone ao lado de palavra, na mesma linha: saldo, cabeçalho da troca. */
const ICON_INLINE = 20;
/** Ícone dentro de tag (check_circle, lock, military_tech do prêmio). O canvas
 *  desenha 18; a escala viva (`tokens.md` §6.1, guard `iconScale.contract`) só
 *  tem 20/24/32 — a régua vence o canvas. */
const ICON_TAG = 20;

/** Mini-visor de item/decoração (D-L3: o slot SIS-07 alargado a 72). */
const GLASS_ITEM = 72;
/** Mini-visor de cenário (D-L3: miniatura 96×52 a 1×). */
const GLASS_BG_W = 96;
const GLASS_BG_H = 52;

/**
 * As miniaturas 96×52 por id de cenário (`thumbs/<id>.png`, R2-1). Glob eager
 * no molde de `attackFxArt.ts`: o Vite empacota cada PNG estaticamente e o
 * mapa devolve `undefined` para cenário sem miniatura → cai na ilustração
 * 1200×648 reduzida por CSS (o que era antes).
 */
const BG_THUMBS: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob('../assets/backgrounds/thumbs/*.png', { eager: true, import: 'default' }) as Record<string, string>)
    .map(([p, url]) => [p.replace(/^.*\/([^/]+)\.png$/, '$1'), url]),
);

/** Bits e Emblemas: exatamente o que `utils/currencies.ts` define — SEM override
 *  de cor (o canvas segue `bitsStyle`, X4). */
const bitsNum: CSSProperties = { ...bitsStyle, fontSize: 'var(--sm2-text-md)' };
const emblemNum: CSSProperties = { ...emblemStyle, fontSize: 'var(--sm2-text-lg)' };

/** Tag SIS (chip.tag): 28 de altura, `surface-2`, raio 999, texto 12. */
const tagStyle: CSSProperties = {
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
function Bits({ value, dim = false, sign = '' }: { value: number; dim?: boolean; sign?: string }) {
  return (
    <span className="sm2-num" style={{ ...bitsNum, display: 'inline-flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap', color: dim ? 'var(--sm2-muted)' : bitsNum.color }}>
      {sign}{value}<span style={unitStyle}>Bits</span>
    </span>
  );
}

/** Extrai a URL da arte de um cenário pintado; `null` para gradiente. */
function bgImage(css: string | undefined): string | null {
  const m = css?.match(/url\((['"]?)(.*?)\1\)/);
  return m ? m[2] : null;
}

export function ShopModal({
  language, points, ownedBackgrounds, equippedBackground, ownedFurniture, equippedDecor,
  missionProgress, emblems, credits, onBuy, onExchangeCredits, onEquip, onEquipFurniture, onClose,
  weeklyMissions, onClaimWeekly, accountTier, onUnlock,
  asPage = false,
}: {
  language: Language;
  points: number;
  ownedBackgrounds: string[];
  equippedBackground: string | null;
  ownedFurniture: string[];
  /** Decoração equipada por espaço do palco (utils/petStage.ts). */
  equippedDecor: Partial<Record<SlotId, string>>;
  /** Progress per mission id (clamped to its target) — utils/missions.ts. */
  missionProgress: Record<string, number>;
  /** Emblemas (moeda do Torneio) e Créditos (dinheiro real) — ver utils/currencies.ts. */
  emblems: number;
  credits: number;
  onBuy: (itemId: string) => boolean;
  /** Troca Créditos por Bits. Devolve false se o servidor recusar o gasto. */
  onExchangeCredits: (credits: number) => Promise<boolean>;
  onEquip: (id: string | null) => void;
  /** `id` null limpa o espaço; o slot é sempre obrigatório. */
  onEquipFurniture: (id: string | null, slot: SlotId) => void;
  onClose: () => void;
  /** WP4.7 — as 3 missões da semana + o progresso, prontos. Vêm de fora porque
   *  a semana e o progresso moram no save e esta tela não decide nada. */
  weeklyMissions?: { mission: WeeklyMission; count: number; done: boolean; claimed: boolean }[];
  /** Paga os Emblemas de uma missão pronta. Idempotente do outro lado. */
  onClaimWeekly?: (id: WeeklyMissionId) => void;
  /** WP5.1 — o canal PASSIVO. `demo` vê o convite permanente aqui. */
  accountTier?: 'demo' | 'paid';
  onUnlock?: () => void;
  /** Renderiza como página cheia dentro do fluxo normal em vez de folha. */
  asPage?: boolean;
}) {
  const isPt = language === 'pt-BR';
  const [seg, setSeg] = useState<ShopSegment>('shop');
  /** Última compra/troca: alimenta a região `aria-live` e o filete do card. */
  const [flash, setFlash] = useState<{ id: string; ok: boolean; msg: ReactNode } | null>(null);
  const [exchanging, setExchanging] = useState<number | null>(null);

  const say = (id: string, ok: boolean, msg: ReactNode) => {
    setFlash({ id, ok, msg });
    setTimeout(() => setFlash(f => (f && f.id === id ? null : f)), 2600);
    try { navigator.vibrate?.(ok ? 25 : 60); } catch { /* noop */ }
  };

  const buy = (item: ShopItem) => {
    const name = isPt ? item.namePt : item.nameEn;
    const ok = onBuy(item.id);
    say(item.id, ok, ok
      ? (isPt ? `${name} comprado.` : `${name} purchased.`)
      : (isPt ? `Saldo insuficiente para ${name}.` : `Not enough to buy ${name}.`));
  };

  /** Missão que destrava o item + progresso, na LINHA do item. */
  const lockLine = (item: ShopItem): string => {
    const m = MISSIONS.find(x => x.id === item.unlock?.missionId);
    if (!m) return '';
    const cur = Math.min(missionProgress[m.id] ?? 0, m.target);
    /* WP4.12 (achado E4) — ZERO NÃO É PROGRESSO, é a ausência dele. Com
       progresso REAL o número volta, porque aí ele descreve um caminho que já
       começou. */
    const prog = m.target > 1 && cur > 0 ? ` · ${cur}/${m.target}` : '';
    return `${isPt ? m.descPt : m.descEn}${prog}`;
  };

  const sections: { key: string; title: string; items: ShopItem[] }[] = seg === 'tournament'
    ? [{ key: 'tournament', title: isPt ? 'Prêmios do Torneio' : 'Tournament rewards', items: TOURNAMENT_ITEMS }]
    : [
        { key: 'items', title: isPt ? 'Itens' : 'Items', items: SHOP_ITEMS.filter(i => i.kind === 'chip' || i.kind === 'heart') },
        { key: 'bg', title: isPt ? 'Cenários' : 'Backdrops', items: SHOP_ITEMS.filter(i => i.kind === 'bg') },
        { key: 'furniture', title: isPt ? 'Mobílias' : 'Furniture', items: SHOP_ITEMS.filter(i => i.kind === 'furniture') },
      ];

  /** O MINI-VISOR do card (D-L2/D-L3): a arte real num vidro sem anel.
   *  `locked` põe o véu (placa sobre o vidro, não alfa na arte — D-L8);
   *  `selected` acende o anel 2px por FORA (D-L9). */
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
    // Decoração é indexada pelo ID do item; consumível pelo EMOJI (a chave de
    // inventário dele, utils/itemArt.ts).
    const png = DECOR_ART[item.id] ?? ITEM_ART[item.icon];
    // Peça de CHÃO é 104×16: a 0,5× vira uma tira de 8px que lê como vidro
    // vazio. Chão é textura, então fica a 1× (escala inteira) e o vidro recorta
    // as pontas — um pedaço honesto dela. Todo o resto é objeto: 0,5× inteiro.
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
    // Decoração equipada num cenário onde ela não aparece: dizer isso é o que
    // separa "não combina" de "o app engoliu meu item".
    const stageBg = equippedBackground ? PET_BACKGROUNDS[equippedBackground] : null;
    const showsHere = item.kind !== 'furniture' || !item.slot || !stageBg
      ? true
      : stageBg.slots.includes(item.slot) && decorFitsSetting(item.fits ?? 'any', stageBg.setting);
    // Cada item cobra na SUA moeda — Emblemas não compram item de Bits nem o
    // contrário (ver utils/currencies.ts).
    const isEmblem = item.currency === 'emblems';
    const affordable = (isEmblem ? emblems : points) >= item.price;
    const name = isPt ? item.namePt : item.nameEn;
    const failing = flash?.id === item.id && !flash.ok;

    // O CARD INTEIRO é o alvo — não um botão de 60px no canto.
    const action = owned
      ? () => { if (item.kind === 'bg') onEquip(equipped ? null : item.id); else if (item.slot) onEquipFurniture(equipped ? null : item.id, item.slot); }
      : unlocked ? () => buy(item) : undefined;

    const status = owned
      ? (equipped ? (isPt ? 'Equipado' : 'Equipped') : (isPt ? 'Equipar' : 'Equip'))
      : null;

    const sub = !unlocked ? lockLine(item)
      : equipped && !showsHere ? (isPt ? 'Não aparece no cenário atual' : "Doesn't show in the current scene")
      : (isPt ? item.descPt : item.descEn);

    return (
      <button
        key={item.id}
        type="button"
        className={`sm2-shop-item${unlocked ? '' : ' is-locked'}`}
        onClick={action}
        /* Travado: `aria-disabled` + fora do Tab (o canvas: sem `fo`), nunca o
           `disabled` nativo — ele traz a opacidade do browser (D-L8). */
        aria-disabled={unlocked ? undefined : true}
        tabIndex={unlocked ? undefined : -1}
        aria-label={unlocked
          ? `${name} — ${owned ? status : `${item.price} ${isEmblem ? (isPt ? 'Emblemas' : 'Emblems') : 'Bits'}`}`
          : `${name} — ${isPt ? 'bloqueado' : 'locked'}: ${lockLine(item)}`}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          minHeight: 64, padding: '8px 12px', textAlign: 'left', boxSizing: 'border-box',
          borderRadius: 'var(--sm2-radius-lg)',
          border: unlocked ? '1px solid var(--sm2-line)' : '1px dashed var(--sm2-muted)',
          backgroundColor: unlocked ? 'var(--sm2-surface)' : 'transparent',
          // A recusa: SÓ o filete âmbar (inset, sem mudar a caixa) — D-L7/X2.
          boxShadow: failing ? 'inset 0 0 0 1px var(--sm2-gold-ink)' : 'none',
          cursor: action ? 'pointer' : 'default',
          transition: 'box-shadow var(--sm2-dur-tap) var(--sm2-ease)',
        }}
      >
        {art(item, !unlocked, equipped)}

        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ ...sm2Text, fontWeight: 500, color: unlocked ? 'var(--sm2-ink)' : 'var(--sm2-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          {sub && <span style={sm2Hint}>{sub}</span>}
          {/* "Equipped" desce para a coluna de texto (X1): o slot aceso já diz;
              a tag não disputa a linha com o nome. */}
          {equipped && (
            <span style={{ ...tagStyle, alignSelf: 'flex-start', marginTop: 2, color: 'var(--sm2-primary-ink)' }}>
              <Icon name="check_circle" size={ICON_TAG} fill={1} tone="primary" />
              {status}
            </span>
          )}
        </span>

        {/* A coluna da direita: tag "locked", "Equip", ou o preço. */}
        {!unlocked ? (
          <span aria-hidden="true" style={{ ...tagStyle, color: 'var(--sm2-muted)' }}>
            <Icon name="lock" size={ICON_TAG} tone="muted" />
            {isPt ? 'bloqueado' : 'locked'}
          </span>
        ) : owned ? (
          !equipped && (
            <span style={{ ...sm2Button('outline', false, 'sm'), padding: '0 12px', flex: 'none' }}>{status}</span>
          )
        ) : isEmblem ? (
          <span className="sm2-num" style={{ ...emblemNum, display: 'inline-flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap', flex: 'none', color: affordable ? emblemNum.color : 'var(--sm2-muted)' }}>
            {item.price}<span style={unitStyle}>{isPt ? 'Emblemas' : 'Emblems'}</span>
          </span>
        ) : (
          <Bits value={item.price} dim={!affordable} />
        )}
      </button>
    );
  };

  /** Saldo — UMA leitura só, a da moeda que compra o que está na tela. É um
   *  `<p>` com texto (não `aria-label` em `<span>` — X6); a região viva é a do
   *  flash, uma só. */
  const balance = seg === 'tournament' ? (
    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
      <Icon name="military_tech" size={ICON_INLINE} fill={1} tone="gold" />
      <span className="sm2-num" style={emblemNum}>{emblems}</span>
      <span style={{ ...unitStyle, marginLeft: 2 }}>{isPt ? 'Emblemas' : 'Emblems'}</span>
    </p>
  ) : (
    <p style={{ margin: 0 }}><Bits value={points} /></p>
  );

  const exchange = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
      <p style={{ ...sm2Text, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Créditos: a única moeda com glifo, na cor própria (D-L11). */}
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
            onClick={async () => {
              setExchanging(pack.credits);
              let ok = false;
              try { ok = await onExchangeCredits(pack.credits); } finally { setExchanging(null); }
              say(`exch-${pack.credits}`, ok, ok
                ? <><Bits value={pack.bits} sign="+" />.</>
                : (isPt ? 'A troca não foi concluída. Tente de novo.' : 'The swap did not go through. Try again.'));
            }}
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
    </div>
  );

  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Uma ação dominante: comprar. O segmento troca a MOEDA, e só isso.
          Ativo em `primary-soft` + `primary-ink` + borda (D-L5): "onde estou"
          não é ação, a placa cheia é do primário. */}
      <div role="radiogroup" aria-label={isPt ? 'Moeda da loja' : 'Shop currency'} style={{ display: 'flex', gap: 8 }}>
        <Segment tonal selected={seg === 'shop'} onSelect={() => setSeg('shop')} label={isPt ? 'Loja' : 'Shop'} />
        <Segment tonal selected={seg === 'tournament'} onSelect={() => setSeg('tournament')} label={isPt ? 'Torneio' : 'Tournament'} />
      </div>

      {/* Estado de compra/troca. Existe sempre no DOM: região viva que aparece
          vazia não é anunciada quando o texto chega em alguns leitores. A
          recusa é ÂMBAR de convite, nunca `danger` (D-L7). */}
      <p
        role="status"
        aria-live="polite"
        style={{
          ...sm2Hint, minHeight: 18, margin: 0,
          fontWeight: flash ? 500 : 400,
          color: flash ? (flash.ok ? 'var(--sm2-ink)' : 'var(--sm2-gold-ink)') : 'var(--sm2-muted)',
        }}
      >
        {flash ? flash.msg : (seg === 'tournament'
          ? (isPt ? 'Emblemas só vêm do Torneio — e só compram aqui.' : 'Emblems only come from the Tournament — and only buy here.')
          : (isPt ? 'Ganhe Bits nos minijogos.' : 'Earn Bits in the minigames.'))}
      </p>

      {/* ─── AS MISSÕES DA SEMANA ────────────────────────────────────────
          Ficam no TOPO do segmento Torneio, e a posição é o argumento: aqui
          é onde os Emblemas são gastos, e a missão é de onde eles vêm.

          Nenhuma missão premia CONTAGEM DE TAREFAS: é proibição escrita do
          `CLAUDE.md`, e o pool inteiro é de cuidado e presença (há teste
          varrendo). */}
      {seg === 'tournament' && (weeklyMissions?.length ?? 0) > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 className="sm2-title" style={sm2TitleStyle}>{isPt ? 'Missões da semana' : 'This week'}</h2>
          {weeklyMissions!.map(({ mission, count, done, claimed }) => (
            <div
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
                {/* Progresso só quando ele JÁ COMEÇOU (WP4.12): `0/3` é a
                    ausência de progresso, e uma coluna de zeros lê como boletim. */}
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
                  aria-label={isPt ? `Receber ${mission.emblems} Emblemas` : `Claim ${mission.emblems} Emblems`}
                  style={{ ...sm2Button('primary', false, 'sm'), whiteSpace: 'nowrap', flex: 'none', gap: 4 }}
                >
                  <Icon name="military_tech" size={ICON_TAG} fill={1} tone="inherit" />
                  <span className="sm2-num" style={{ ...emblemStyle, color: 'inherit', fontSize: 'var(--sm2-text-md)' }}>+{mission.emblems}</span>
                </button>
              ) : (
                <span aria-label={isPt ? `${mission.emblems} Emblemas` : `${mission.emblems} Emblems`} role="img" style={{ ...tagStyle, color: 'var(--sm2-gold-ink)' }}>
                  <Icon name="military_tech" size={ICON_TAG} fill={1} tone="gold" />
                  <span className="sm2-num" style={{ ...emblemStyle, fontSize: 'var(--sm2-text-md)' }}>+{mission.emblems}</span>
                </span>
              )}
            </div>
          ))}
        </section>
      )}

      {sections.map(sec => (
        <section key={sec.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 className="sm2-title" style={sm2TitleStyle}>{sec.title}</h2>
          {sec.items.length === 0
            ? <p style={sm2Hint}>{isPt ? 'Nada por aqui ainda.' : 'Nothing here yet.'}</p>
            : sec.items.map(renderItem)}
        </section>
      ))}

      {/* ─── O CONVITE PERMANENTE (WP5.1, canal PASSIVO) ─────────────────
          Este a pessoa ENCONTRA: fora do cap semanal, não some com
          `offerDismissed`, sem ×. Fica no fim da lista, depois do que a pessoa
          veio ver. Loja que abre na vitrine paga é loja que não confia no
          próprio catálogo. Âmbar de convite (`auto_awesome` `gold-ink`). */}
      {seg === 'shop' && accountTier === 'demo' && onUnlock && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
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

      {seg === 'shop' && exchange}
    </div>
  );

  if (asPage) return <div style={{ paddingBottom: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', minHeight: 44 }}>{balance}</div>
    {body}
  </div>;

  return (
    <ModalSheet
      open
      title={isPt ? 'Loja' : 'Shop'}
      onClose={onClose}
      language={language}
      footer={<div style={{ display: 'flex', justifyContent: 'flex-end' }}>{balance}</div>}
    >
      {body}
    </ModalSheet>
  );
}
