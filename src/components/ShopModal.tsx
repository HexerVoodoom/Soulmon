import { useState } from 'react';
import { bitsStyleLight, emblemStyle, BITS_EXCHANGE, CREDIT_COLOR } from '../utils/currencies';
import { FlaskConical, Image as ImageIcon, Award, Check, Sofa, Swords, Gem } from 'lucide-react';
import iconClose from '../assets/soulmon/icons/icon-close.png';
import iconLock from '../assets/soulmon/icons/icon-lock.png';
import { SHOP_ITEMS, TOURNAMENT_ITEMS, type ShopItem } from '../utils/shop';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { DECOR_ART } from '../utils/decorArt';
import { MISSIONS, isShopItemUnlocked } from '../utils/missions';
import { decorFitsSetting, type SlotId } from '../utils/petStage';
import type { Language } from '../utils/i18n';

/**
 * Loja — gasta Bits ganhos nos minijogos. Organizada em abas (Itens /
 * Cenários / Mobílias / Missões). Itens podem estar BLOQUEADOS por missão:
 * renderizam escurecidos com cadeado; tocar mostra como desbloquear. Ícones
 * seguem o estilo lucide do resto do app (item.displayIcon), exceto mobílias
 * (arte pixel real, utils/decorArt.ts) e cenários (thumb do próprio bg); o
 * emoji em item.icon é só a CHAVE de inventário dos consumíveis, nunca visual.
 */
type ShopTab = 'items' | 'bg' | 'furniture' | 'tournament' | 'missions';

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
  /** Renderiza como página cheia dentro do fluxo normal (BottomNav → Loja
   *  virou view de verdade, não modal por cima da tela atual) em vez de
   *  overlay fixo centralizado. */
  asPage?: boolean;
}) {
  const isPt = language === 'pt-BR';
  const [tab, setTab] = useState<ShopTab>('items');
  const [flash, setFlash] = useState<{ id: string; ok: boolean } | null>(null);
  /** Item id whose unlock hint is expanded (tap a locked item to toggle). */
  const [hintFor, setHintFor] = useState<string | null>(null);
  const [exchanging, setExchanging] = useState(false);

  const buy = (item: ShopItem) => {
    const ok = onBuy(item.id);
    setFlash({ id: item.id, ok });
    setTimeout(() => setFlash(null), 900);
    try { navigator.vibrate?.(ok ? 25 : 60); } catch { /* noop */ }
  };

  // How to unlock a locked item (shown when the user taps it).
  const unlockHint = (item: ShopItem): string => {
    if (!item.unlock) return '';
    const m = MISSIONS.find(x => x.id === item.unlock!.missionId);
    if (!m) return '';
    const cur = missionProgress[m.id] ?? 0;
    const prog = m.target > 1 ? ` (${cur}/${m.target})` : '';
    return `${isPt ? 'Missão' : 'Mission'} ${m.icon} ${isPt ? m.namePt : m.nameEn}: ${isPt ? m.descPt : m.descEn}${prog}`;
  };

  const TABS: { key: ShopTab; Icon: typeof FlaskConical; pt: string; en: string }[] = [
    { key: 'items', Icon: FlaskConical, pt: 'Itens', en: 'Items' },
    { key: 'bg', Icon: ImageIcon, pt: 'Cenários', en: 'Backdrops' },
    { key: 'furniture', Icon: Sofa, pt: 'Mobílias', en: 'Furniture' },
    { key: 'tournament', Icon: Swords, pt: 'Torneio', en: 'Tournament' },
    { key: 'missions', Icon: Award, pt: 'Missões', en: 'Missions' },
  ];

  const TAB_ITEMS: Record<Exclude<ShopTab, 'missions'>, ShopItem[]> = {
    items: SHOP_ITEMS.filter(i => i.kind === 'chip' || i.kind === 'heart'),
    bg: SHOP_ITEMS.filter(i => i.kind === 'bg'),
    furniture: SHOP_ITEMS.filter(i => i.kind === 'furniture'),
    tournament: TOURNAMENT_ITEMS,
  };

  /** Saldo da moeda que compra este item. */
  const balanceFor = (item: ShopItem) => (item.currency === 'emblems' ? emblems : points);

  /** Preço com a leitura da moeda certa — nunca o 💎, que é dos Créditos. */
  // No botão primário (roxo) o preço vai em CLARO: o dourado do emblemStyle é
  // escuro e sumia no fundo. A identidade dourada fica no ícone e no saldo.
  const priceLabel = (item: ShopItem) => (item.currency === 'emblems'
    ? <span style={{ ...emblemStyle, color: '#fff' }}>🎖️ {item.price}</span>
    : <>{item.price} Bits</>);

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
    // separa "não combina" de "o app engoliu meu item". O cenário atual manda.
    const stageBg = equippedBackground ? PET_BACKGROUNDS[equippedBackground] : null;
    const showsHere = item.kind !== 'furniture' || !item.slot || !stageBg
      ? true
      : stageBg.slots.includes(item.slot) && decorFitsSetting(item.fits ?? 'any', stageBg.setting);
    // Cada item cobra na SUA moeda — Emblemas não compram item de Bits nem
    // o contrário (ver utils/currencies.ts).
    const affordable = balanceFor(item) >= item.price;
    const flashHere = flash?.id === item.id;
    const showHint = hintFor === item.id;
    const canBuy = unlocked && affordable;
    const Icon = item.displayIcon;

    const iconEl = item.kind === 'bg' ? (
      <div style={{
        width: 44, height: 44, flexShrink: 0, borderRadius: 12,
        backgroundImage: PET_BACKGROUNDS[item.id]?.css, backgroundSize: 'cover', backgroundPosition: 'center',
        filter: unlocked ? 'none' : 'grayscale(0.7) brightness(0.85)',
      }} />
    ) : item.kind === 'furniture' && DECOR_ART[item.id] ? (
      <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, filter: unlocked ? 'none' : 'grayscale(0.7) brightness(0.85)' }}>
        <img src={DECOR_ART[item.id]} alt="" style={{ width: '78%', height: '78%', objectFit: 'contain', imageRendering: 'pixelated' }} />
      </span>
    ) : Icon ? (
      <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, filter: unlocked ? 'none' : 'grayscale(0.7) brightness(0.85)' }}>
        <Icon size={20} strokeWidth={2.2} color="var(--sm-ink)" />
      </span>
    ) : (
      <span style={{ fontSize: '1.6rem', width: 44, height: 44, borderRadius: 12, background: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, filter: unlocked ? 'none' : 'grayscale(0.7) brightness(0.85)' }}>{item.icon}</span>
    );

    return (
      <div
        key={item.id}
        onClick={() => { if (!unlocked) setHintFor(showHint ? null : item.id); }}
        className="sm-card"
        style={{
          padding: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
          cursor: unlocked ? 'default' : 'pointer',
          borderColor: flashHere ? (flash!.ok ? '#22A900' : '#e03131') : undefined,
        }}
      >
        {/* icon (darkened + padlock overlay when locked) */}
        <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
          {iconEl}
          {!unlocked && (
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)', borderRadius: 12 }}>
              <img src={iconLock} alt="" width={20} height={20} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: unlocked ? 'var(--sm-ink)' : 'var(--sm-muted)', fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>
            {isPt ? item.namePt : item.nameEn}
          </p>
          <p style={{ color: 'var(--sm-muted)', fontSize: '0.72rem', margin: 0 }}>
            {isPt ? item.descPt : item.descEn}
          </p>
        </div>
        {/* action */}
        {owned ? (
          <button
            onClick={e => {
              e.stopPropagation();
              // Decoração precisa dizer QUAL espaço mexer: ao desequipar não
              // há item de onde deduzir o slot (era o bug que fazia o botão
              // "Equipado" não desequipar nada).
              if (item.kind === 'bg') onEquip(equipped ? null : item.id);
              else if (item.slot) onEquipFurniture(equipped ? null : item.id, item.slot);
            }}
            className={equipped ? 'sm-btn sm-btn-gold' : 'sm-btn sm-btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '0.7rem' }}>
            {equipped ? <><Check size={14} strokeWidth={3} /> {isPt ? 'Equipado' : 'Equipped'}</> : (isPt ? 'Equipar' : 'Equip')}
          </button>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); if (unlocked) buy(item); else setHintFor(showHint ? null : item.id); }}
            disabled={unlocked && !canBuy}
            className="sm-btn"
            style={{ padding: '9px 14px', fontSize: '0.72rem', flexShrink: 0, minHeight: 38 }}>
            {unlocked ? priceLabel(item) : <img src={iconLock} alt="" width={16} height={16} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />}
          </button>
        )}
        {/* Aviso de composição — só para o que está equipado e não aparece. */}
        {equipped && !showsHere && (
          <p style={{ width: '100%', margin: 0, padding: '8px 10px', background: 'var(--sm-gold-soft)', borderRadius: 10, color: '#8a6113', fontSize: '0.72rem', fontWeight: 600 }}>
            {isPt
              ? 'Equipado, mas não aparece no cenário atual — troque de cenário para vê-lo.'
              : "Equipped, but it doesn't show in the current scene — switch scenes to see it."}
          </p>
        )}
        {/* unlock hint "tooltip" — expands inside the card when tapped */}
        {!unlocked && showHint && (
          <p style={{ width: '100%', margin: 0, padding: '8px 10px', background: 'var(--sm-gold-soft)', borderRadius: 10, color: '#8a6113', fontSize: '0.72rem', fontWeight: 600 }}>
            {isPt ? 'Como desbloquear:' : 'How to unlock:'} {unlockHint(item)}
          </p>
        )}
      </div>
    );
  };

  const renderMissions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ color: 'var(--sm-muted)', fontSize: '0.72rem', textAlign: 'center', margin: 0 }}>
        {isPt
          ? 'Complete missões para liberar a compra de itens exclusivos da loja.'
          : 'Complete missions to unlock the purchase of exclusive shop items.'}
      </p>
      {MISSIONS.map(m => {
        const cur = missionProgress[m.id] ?? 0;
        const done = cur >= m.target;
        const rewardItem = SHOP_ITEMS.find(i => i.id === m.bgReward);
        const rewardName = rewardItem ? (isPt ? rewardItem.namePt : rewardItem.nameEn) : m.bgReward;
        const goToReward = () => { setTab('bg'); setHintFor(rewardItem?.id ?? null); };
        return (
          <div key={m.id} className="sm-card" style={{ padding: 10, display: 'flex', gap: 10, alignItems: 'center', borderColor: done ? '#22A900' : undefined }}>
            <span style={{ fontSize: '1.6rem', width: 44, height: 44, borderRadius: 12, background: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{m.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'var(--sm-ink)', fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>
                {isPt ? m.namePt : m.nameEn}
              </p>
              <p style={{ color: 'var(--sm-muted)', fontSize: '0.72rem', margin: 0 }}>
                {isPt ? m.descPt : m.descEn}
              </p>
              {/* Recompensa — prévia visual do cenário + atalho pra ver na aba Cenários. */}
              <button
                onClick={goToReward}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0 0', padding: '4px 8px 4px 4px',
                  background: 'var(--sm-primary-soft)', border: 'none', borderRadius: 10, cursor: 'pointer',
                }}
              >
                {rewardItem && (
                  <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: PET_BACKGROUNDS[rewardItem.id]?.css, backgroundSize: 'cover' }} />
                )}
                <span style={{ color: 'var(--sm-primary)', fontSize: '0.68rem', fontWeight: 700 }}>
                  {isPt ? 'Libera:' : 'Unlocks:'} {rewardName}
                </span>
              </button>
              <div style={{ marginTop: 6, height: 8, background: 'var(--sm-line)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (cur / m.target) * 100)}%`, height: '100%', background: done ? '#22A900' : 'var(--sm-primary)', transition: 'width 0.3s' }} />
              </div>
              <p style={{ color: done ? '#22A900' : 'var(--sm-muted)', fontSize: '0.66rem', marginTop: 2, marginBottom: 0, fontWeight: 700 }}>
                {done
                  ? (isPt ? `Concluída — ${rewardName} liberado na loja!` : `Done — ${rewardName} unlocked in the shop!`)
                  : m.target === 1 ? (isPt ? 'Pendente' : 'Pending') : `${cur}/${m.target}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );

  const Wrapper = asPage
    ? ({ children }: { children: React.ReactNode }) => <>{children}</>
    : ({ children }: { children: React.ReactNode }) => (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(20,15,40,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          {children}
        </div>
      );

  return (
    <Wrapper>
      <div
        className={asPage ? undefined : 'sm-card'}
        style={asPage
          ? { display: 'flex', flexDirection: 'column' }
          : { background: 'var(--sm-bg)', width: '100%', maxWidth: 420, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Header — em modo página, sem título repetido nem X (a navegação já
            é a barra inferior) e sem fundo/borda própria (a página herda o
            visual do conteúdo ao redor). */}
        <div style={asPage
          ? { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10 }
          : { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--sm-surface)', borderBottom: '1px solid var(--sm-line)' }}>
          {!asPage && (
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--sm-ink)' }}>
              {isPt ? 'Loja' : 'Shop'}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Bits, não Créditos: sem 💎 (o gem é dos créditos comprados com
                dinheiro real). Ver utils/currency.ts. */}
            {tab === 'tournament' ? (
              <span
                className="sm-card"
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px' }}
                title={isPt ? 'Emblemas — ganhe vencendo no Torneio' : 'Emblems — earn them by winning in the Tournament'}
              >
                <span style={{ fontSize: 13 }}>🎖️</span>
                <span style={{ ...emblemStyle, fontSize: '0.85rem' }}>{emblems}</span>
              </span>
            ) : (
              <span
                className="sm-card"
                style={{ display: 'flex', alignItems: 'center', padding: '5px 10px' }}
                title={isPt ? 'Bits — ganhe nos minijogos' : 'Bits — earn them in the minigames'}
              >
                <span style={{ ...bitsStyleLight, fontSize: '0.85rem' }}>{points} Bits</span>
              </span>
            )}
            {!asPage && (
              <button onClick={onClose} className="sm-nav-btn" aria-label={isPt ? 'Fechar' : 'Close'}>
                <img src={iconClose} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', background: 'var(--sm-surface)', borderBottom: '1px solid var(--sm-line)' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setHintFor(null); }}
              style={{
                flex: 1, padding: '10px 2px', border: 'none', cursor: 'pointer', background: 'transparent',
                borderBottom: tab === t.key ? '2.5px solid var(--sm-primary)' : '2.5px solid transparent',
                marginBottom: -1,
                color: tab === t.key ? 'var(--sm-primary)' : 'var(--sm-muted)',
                fontWeight: 700, fontSize: '0.72rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}
            >
              <t.Icon size={17} strokeWidth={2.2} />
              {isPt ? t.pt : t.en}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tab === 'missions'
            ? renderMissions()
            : TAB_ITEMS[tab].map(renderItem)}

          {/* Faltou Bit? Créditos (dinheiro real) viram Bits — nunca o
              contrário, senão dava pra farmar em minijogo a moeda que só o
              dinheiro real deveria abrir (ver utils/currencies.ts). */}
          {tab === 'items' && (
            <div className="sm-card" style={{ padding: 12, marginTop: 4 }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--sm-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Gem size={13} color={CREDIT_COLOR} strokeWidth={2.4} />
                {isPt ? `Trocar Créditos por Bits (você tem ${credits})` : `Swap Credits for Bits (you have ${credits})`}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {BITS_EXCHANGE.map(pack => (
                  <button
                    key={pack.credits}
                    className="sm-btn sm-btn-secondary"
                    disabled={credits < pack.credits || exchanging}
                    onClick={async () => {
                      setExchanging(true);
                      const ok = await onExchangeCredits(pack.credits);
                      setExchanging(false);
                      setFlash({ id: `exch-${pack.credits}`, ok });
                      setTimeout(() => setFlash(null), 900);
                    }}
                    style={{
                      flex: 1, padding: '9px 6px', fontSize: '0.68rem', lineHeight: 1.35,
                      opacity: credits < pack.credits || exchanging ? 0.5 : 1,
                    }}
                  >
                    <span style={{ display: 'block', fontWeight: 700 }}>{pack.credits} 💎</span>
                    <span style={{ ...bitsStyleLight, display: 'block', fontSize: '0.68rem' }}>→ {pack.bits} Bits</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p style={{ color: 'var(--sm-muted)', fontSize: '0.68rem', textAlign: 'center', margin: 0 }}>
            {tab === 'missions'
              ? (isPt ? 'Progresso conta desde o início do jogo.' : 'Progress counts from the very start.')
              : tab === 'tournament'
                ? (isPt ? 'Emblemas só vêm do Torneio — e só compram aqui.' : 'Emblems only come from the Tournament — and only buy here.')
                : (isPt ? 'Ganhe Bits nos minijogos! Itens bloqueados: toque para ver como desbloquear.' : 'Earn Bits in the minigames! Locked items: tap to see how to unlock.')}
          </p>
        </div>
      </div>
    </Wrapper>
  );
}
