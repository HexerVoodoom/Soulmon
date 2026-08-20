import { useState } from 'react';
import { bitsStyle, emblemStyle, BITS_EXCHANGE } from '../utils/currencies';
import { Icon } from './ui/Icon';
import { ModalSheet, Segment, sm2Button, sm2Hint, sm2Text, sm2TitleStyle } from './form/FormKit';
import { SHOP_ITEMS, TOURNAMENT_ITEMS, type ShopItem } from '../utils/shop';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { DECOR_ART } from '../utils/decorArt';
import { MISSIONS, isShopItemUnlocked } from '../utils/missions';
import { decorFitsSetting, type SlotId } from '../utils/petStage';
import type { Language } from '../utils/i18n';

/**
 * LOJA — revamp minimalista (Pokémon Sleep / Duolingo).
 *
 * ─── O que foi CORTADO, e por quê ──────────────────────────────────────────
 *
 * 1. **As 5 abas viraram 2 segmentos.** A única troca de contexto real numa
 *    loja é a MOEDA: Bits e Emblemas não se misturam (regra de produto), então
 *    "Loja" e "Torneio" são coisas diferentes de verdade. Itens / Cenários /
 *    Mobílias não são: são o mesmo gesto (comprar com Bits) fatiado em três
 *    cliques. Viraram SEÇÕES de um scroll vertical único — o padrão do Pokémon
 *    Sleep. Aba que só filtra a mesma moeda é navegação cobrando pedágio.
 *
 * 2. **A aba Missões morreu.** Ela existia para explicar por que 6 cenários
 *    estavam com cadeado — e explicava LONGE do cadeado, com o card da missão
 *    ainda carregando um botão "Libera: X" que levava de volta para a aba de
 *    Cenários. Agora o próprio card bloqueado diz a missão e o progresso
 *    (`3/100`) na linha de baixo. A lista de missões É a lista dos 6 cadeados,
 *    no lugar onde a recompensa importa. Some junto o estado `hintFor` (tocar
 *    para revelar): informação que decide a compra não pode depender de um
 *    toque exploratório.
 *
 * 3. **Toda a arte de ícone de interface.** 8 PNGs do kit + os 15 símbolos
 *    vetoriais de terceiro que `utils/shop.ts` importava. O card mostra o que o item É: prévia CSS
 *    do cenário, arte pixel da decoração, emoji do consumível (que é CONTEÚDO
 *    da pastinha, não ícone de sistema). Item sem arte não ganha um ícone
 *    decorativo — ganha espaço.
 *
 * ─── AS TRÊS MOEDAS (regra de produto, com teste travando) ─────────────────
 *
 *   Bits      → número em fonte de calculadora, **sem ícone nenhum**. A
 *               ausência de ícone É a distinção; é o que torna impossível
 *               repetir o bug do gem compartilhado.
 *   Emblemas  → `military_tech` em ouro + número com serifa.
 *   Créditos  → `diamond`, tom primário. UM desenho no app inteiro: o emoji
 *               de gem e o `icon-gem.png` que conviviam NESTA tela morreram aqui.
 *
 * A cor dos números saiu de `#39ff14`/`#b8860b` (hardcoded em currencies.ts,
 * ambos reprovados em AA sobre uma das superfícies) para os tokens de TINTA.
 * A identidade continua na FAMÍLIA tipográfica, que é o que currencies.ts
 * possui — e que continua sendo a fonte da verdade.
 */

type ShopSegment = 'shop' | 'tournament';

/** Bits: exatamente o que `utils/currencies.ts` define — SEM override.
 *
 *  Havia aqui um `color: var(--sm2-ink)` por cima do estilo da moeda. Ele
 *  anulava o token da moeda (`--sm2-primary-ink`) no call-site e fazia o
 *  número dos Bits sair na mesma tinta do texto corrido: a distinção das três
 *  moedas passava a depender só da família tipográfica, num número de 12px.
 *  Era o padrão "inline vence o token" que o próprio `currencies.ts` declara
 *  ter eliminado, reintroduzido um nível acima.
 *
 *  Não havia motivo de contraste: `--sm2-primary-ink` MEDIDO sobre as três
 *  superfícies onde os Bits aparecem passa AA nos dois temas —
 *  bg 5,55 / 13,21 · surface 6,02 / 11,12 · surface-2 5,28 / 9,43 (claro /
 *  escuro), todos ≥ 4,5:1. O override era custo puro. */
const bitsNum = bitsStyle;
/** Emblemas: serifa de medalha, em ouro-TINTA (nunca o `*-fill`). Também sem
 *  override — `emblemStyle` já é `--sm2-gold-ink`; repetir a cor aqui era o
 *  mesmo call-site vencendo o token, só que por acaso com o valor certo. */
const emblemNum = emblemStyle;

export function ShopModal({
  language, points, ownedBackgrounds, equippedBackground, ownedFurniture, equippedDecor,
  missionProgress, emblems, credits, onBuy, onExchangeCredits, onEquip, onEquipFurniture, onClose,
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
  /** Renderiza como página cheia dentro do fluxo normal em vez de folha. */
  asPage?: boolean;
}) {
  const isPt = language === 'pt-BR';
  const [seg, setSeg] = useState<ShopSegment>('shop');
  /** Última compra/troca: alimenta a região `aria-live` e o realce do card. */
  const [flash, setFlash] = useState<{ id: string; ok: boolean; msg: string } | null>(null);
  const [exchanging, setExchanging] = useState<number | null>(null);

  const say = (id: string, ok: boolean, msg: string) => {
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
    const prog = m.target > 1 ? ` · ${cur}/${m.target}` : '';
    return `${isPt ? m.descPt : m.descEn}${prog}`;
  };

  const sections: { key: string; title: string; items: ShopItem[] }[] = seg === 'tournament'
    ? [{ key: 'tournament', title: isPt ? 'Prêmios do Torneio' : 'Tournament rewards', items: TOURNAMENT_ITEMS }]
    : [
        { key: 'items', title: isPt ? 'Itens' : 'Items', items: SHOP_ITEMS.filter(i => i.kind === 'chip' || i.kind === 'heart') },
        { key: 'bg', title: isPt ? 'Cenários' : 'Backdrops', items: SHOP_ITEMS.filter(i => i.kind === 'bg') },
        { key: 'furniture', title: isPt ? 'Mobílias' : 'Furniture', items: SHOP_ITEMS.filter(i => i.kind === 'furniture') },
      ];

  /** A arte do item É o item: prévia do cenário, pixel da decoração, ou o
   *  emoji do consumível (conteúdo da pastinha). Nunca um ícone decorativo. */
  const art = (item: ShopItem, dim: boolean) => {
    const css = item.kind === 'bg' ? PET_BACKGROUNDS[item.id]?.css : undefined;
    const png = DECOR_ART[item.id];
    return (
      <span
        aria-hidden="true"
        style={{
          width: 56, height: 56, flexShrink: 0, borderRadius: 'var(--sm2-radius-md)', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: css ?? 'var(--sm2-surface-2)', backgroundSize: 'cover',
          // 28px era o único tamanho fora da escala nesta tela. O emoji é
          // CONTEÚDO, mas ainda é um glifo medido pelo audit — vai para o
          // degrau que existe.
          opacity: dim ? 0.4 : 1, fontSize: 'var(--sm2-text-2xl)', lineHeight: 1,
        }}
      >
        {png
          ? <img src={png} alt="" width={48} height={48} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
          : css ? null : item.icon}
      </span>
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

    // O CARD INTEIRO é o alvo (régua 5) — não um botão de 60px no canto.
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
        onClick={action}
        disabled={!action}
        aria-label={unlocked
          ? `${name} — ${owned ? status : `${item.price} ${isEmblem ? (isPt ? 'Emblemas' : 'Emblems') : 'Bits'}`}`
          : `${name} — ${isPt ? 'bloqueado' : 'locked'}: ${lockLine(item)}`}
        style={{
          display: 'flex', alignItems: 'center', gap: 14, width: '100%',
          minHeight: 76, padding: 12, textAlign: 'left',
          border: failing ? '1px solid var(--sm2-danger-ink)' : '1px solid transparent',
          // Era 16px — um quarto raio na Loja, fora dos três degraus. Card é
          // `--sm2-radius-lg`.
          borderRadius: 'var(--sm2-radius-lg)',
          backgroundColor: 'var(--sm2-surface)',
          cursor: action ? 'pointer' : 'default',
          transition: 'border-color var(--sm2-dur-tap) var(--sm2-ease)',
        }}
      >
        {art(item, !unlocked)}

        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ ...sm2Text, fontWeight: 500, color: unlocked ? 'var(--sm2-ink)' : 'var(--sm2-muted)' }}>{name}</span>
          {sub && <span style={{ ...sm2Hint, color: failing ? 'var(--sm2-danger-ink)' : 'var(--sm2-muted)' }}>{sub}</span>}
        </span>

        {/* Ação/preço. Ícone pelado, nunca dentro de caixa. */}
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          {!unlocked ? (
            <Icon name="lock" size={22} tone="muted" />
          ) : owned ? (
            equipped
              ? <Icon name="check_circle" size={24} fill={1} tone="primary" label={isPt ? 'Equipado' : 'Equipped'} />
              : <span style={{ ...sm2Text, color: 'var(--sm2-primary-ink)', fontWeight: 500 }}>{status}</span>
          ) : isEmblem ? (
            <>
              <Icon name="military_tech" size={20} tone="gold" />
              <span className="sm2-num" style={{ ...emblemNum, opacity: affordable ? 1 : 0.5 }}>{item.price}</span>
            </>
          ) : (
            <span className="sm2-num" style={{ ...bitsNum, opacity: affordable ? 1 : 0.5 }}>{item.price}</span>
          )}
        </span>
      </button>
    );
  };

  /** Saldo — uma leitura só, a da moeda que compra o que está na tela. */
  const balance = seg === 'tournament' ? (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon name="military_tech" size={22} tone="gold" label={isPt ? 'Emblemas' : 'Emblems'} />
      <span className="sm2-num" style={emblemNum}>{emblems}</span>
    </span>
  ) : (
    <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
      <span className="sm2-num" style={bitsNum}>{points}</span>
      <span style={{ ...sm2Hint, fontWeight: 500 }}>Bits</span>
    </span>
  );

  const exchange = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
      <span style={{ ...sm2Hint, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="diamond" size={18} tone="primary" label={isPt ? 'Créditos' : 'Credits'} />
        {isPt ? `Trocar Créditos por Bits — você tem ${credits}` : `Swap Credits for Bits — you have ${credits}`}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        {BITS_EXCHANGE.map(pack => {
          const busy = exchanging === pack.credits;
          const can = credits >= pack.credits && exchanging === null;
          return (
            <button
              key={pack.credits}
              type="button"
              disabled={!can}
              aria-label={isPt ? `Trocar ${pack.credits} Créditos por ${pack.bits} Bits` : `Swap ${pack.credits} Credits for ${pack.bits} Bits`}
              onClick={async () => {
                setExchanging(pack.credits);
                let ok = false;
                try { ok = await onExchangeCredits(pack.credits); } finally { setExchanging(null); }
                say(`exch-${pack.credits}`, ok, ok
                  ? (isPt ? `+${pack.bits} Bits.` : `+${pack.bits} Bits.`)
                  : (isPt ? 'A troca não foi concluída. Tente de novo.' : 'The swap did not go through. Try again.'));
              }}
              style={{ ...sm2Button(can ? 'ghost' : 'ghost', !can), flex: 1, gap: 4 }}
            >
              <Icon name={busy ? 'sync' : 'diamond'} size={16} tone={can ? 'primary' : 'muted'} />
              <span className="sm2-num">{pack.credits}</span>
              <Icon name="arrow_forward" size={14} tone="muted" />
              <span className="sm2-num" style={{ ...bitsNum, fontSize: 'var(--sm2-text-xs)' }}>{pack.bits}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Uma ação dominante: comprar. O segmento troca a MOEDA, e só isso. */}
      <div role="radiogroup" aria-label={isPt ? 'Moeda da loja' : 'Shop currency'} style={{ display: 'flex', gap: 8 }}>
        <Segment selected={seg === 'shop'} onSelect={() => setSeg('shop')} label={isPt ? 'Loja' : 'Shop'} />
        <Segment selected={seg === 'tournament'} onSelect={() => setSeg('tournament')} label={isPt ? 'Torneio' : 'Tournament'} />
      </div>

      {/* Estado de compra/troca. Existe sempre no DOM: região viva que aparece
          vazia não é anunciada quando o texto chega em alguns leitores. */}
      <p
        role="status"
        aria-live="polite"
        style={{
          ...sm2Hint, minHeight: 18, margin: 0,
          color: flash ? (flash.ok ? 'var(--sm2-primary-ink)' : 'var(--sm2-danger-ink)') : 'var(--sm2-muted)',
        }}
      >
        {flash ? flash.msg : (seg === 'tournament'
          ? (isPt ? 'Emblemas só vêm do Torneio — e só compram aqui.' : 'Emblems only come from the Tournament — and only buy here.')
          : (isPt ? 'Ganhe Bits nos minijogos.' : 'Earn Bits in the minigames.'))}
      </p>

      {sections.map(sec => (
        <section key={sec.key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="sm2-title" style={sm2TitleStyle}>{sec.title}</h2>
          {sec.items.length === 0
            ? <p style={sm2Hint}>{isPt ? 'Nada por aqui ainda.' : 'Nothing here yet.'}</p>
            : sec.items.map(renderItem)}
        </section>
      ))}

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
