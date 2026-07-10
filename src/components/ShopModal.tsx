import { useState } from 'react';
import { SHOP_ITEMS, DROP_EVO_ITEMS, type ShopItem } from '../utils/shop';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { MISSIONS, isShopItemUnlocked } from '../utils/missions';
import { getSpriteForStage } from '../utils/sprites';
import { bitsStyle } from '../utils/currency';
import type { Language } from '../utils/i18n';

/**
 * 🛒 8-bit shop — spend Bits (🪙) earned in the minigames.
 * Organized in TABS (Items / Digivolution / Backdrops / Missions).
 * Items can be LOCKED behind a first drop or a mission: they still render,
 * darkened with a padlock — tapping shows how to unlock. Chunky pixel
 * borders, scanlines, hard shadows: intentionally retro.
 */
type ShopTab = 'items' | 'evo' | 'bg' | 'missions';

export function ShopModal({ language, points, ownedBackgrounds, equippedBackground, equippedEvoItem, missionProgress, droppedItems, onBuy, onEquip, onClose }: {
  language: Language;
  points: number;
  ownedBackgrounds: string[];
  equippedBackground: string | null;
  equippedEvoItem: string | null;
  /** Progress per mission id (clamped to its target) — utils/missions.ts. */
  missionProgress: Record<string, number>;
  /** Shop item ids that have EVER dropped (unlocks drop-gated purchases). */
  droppedItems: string[];
  onBuy: (itemId: string) => boolean;
  onEquip: (id: string | null) => void;
  onClose: () => void;
}) {
  const isPt = language === 'pt-BR';
  const [tab, setTab] = useState<ShopTab>('items');
  const [flash, setFlash] = useState<{ id: string; ok: boolean } | null>(null);
  /** Item id whose unlock hint is expanded (tap a locked item to toggle). */
  const [hintFor, setHintFor] = useState<string | null>(null);
  const px = { fontFamily: "'Courier New', monospace" as const };

  // 8-bit building blocks
  const pixelBox = (color = '#2b3a55'): React.CSSProperties => ({
    background: '#0d1420',
    border: `3px solid ${color}`,
    boxShadow: `4px 4px 0 #000`,
    borderRadius: 0,
  });

  const buy = (item: ShopItem) => {
    const ok = onBuy(item.id);
    setFlash({ id: item.id, ok });
    setTimeout(() => setFlash(null), 900);
    try { navigator.vibrate?.(ok ? 25 : 60); } catch { /* noop */ }
  };

  // How to unlock a locked item (shown when the user taps it).
  const unlockHint = (item: ShopItem): string => {
    if (!item.unlock) return '';
    if (item.unlock.kind === 'drop') return isPt ? item.unlock.hintPt : item.unlock.hintEn;
    const m = MISSIONS.find(x => x.id === (item.unlock as { missionId: string }).missionId);
    if (!m) return '';
    const cur = missionProgress[m.id] ?? 0;
    const prog = m.target > 1 ? ` (${cur}/${m.target})` : '';
    return `${isPt ? 'Missão' : 'Mission'} ${m.icon} ${isPt ? m.namePt : m.nameEn}: ${isPt ? m.descPt : m.descEn}${prog}`;
  };

  const TABS: { key: ShopTab; icon: string; pt: string; en: string }[] = [
    { key: 'items', icon: '🧪', pt: 'ITENS', en: 'ITEMS' },
    { key: 'evo', icon: '🧬', pt: 'EVOLUÇÃO', en: 'EVOLUTION' },
    { key: 'bg', icon: '🖼️', pt: 'CENÁRIOS', en: 'BACKDROPS' },
    { key: 'missions', icon: '🏅', pt: 'MISSÕES', en: 'MISSIONS' },
  ];

  const TAB_ITEMS: Record<Exclude<ShopTab, 'missions'>, ShopItem[]> = {
    items: SHOP_ITEMS.filter(i => i.kind === 'chip' || i.kind === 'heart'),
    evo: [...SHOP_ITEMS.filter(i => i.kind === 'evo'), ...DROP_EVO_ITEMS],
    bg: SHOP_ITEMS.filter(i => i.kind === 'bg'),
  };

  const renderItem = (item: ShopItem) => {
    const unlocked = isShopItemUnlocked(item, droppedItems, missionProgress);
    const ownedBg = item.kind === 'bg' && ownedBackgrounds.includes(item.id);
    const equipped = ownedBg && equippedBackground === item.id;
    const evoActive = item.kind === 'evo' && equippedEvoItem === item.id;
    // Direct-equip evo items block each other; inventory-based ones don't.
    const evoBlocked = item.kind === 'evo' && !item.inventoryEmoji && !!equippedEvoItem && !evoActive;
    const affordable = points >= item.price;
    const flashHere = flash?.id === item.id;
    const showHint = hintFor === item.id;
    const canBuy = unlocked && affordable && !evoActive && !evoBlocked;

    const iconEl = item.kind === 'bg' ? (
      <div style={{ width: 44, height: 44, flexShrink: 0, border: '2px solid #000', background: PET_BACKGROUNDS[item.id]?.css, filter: unlocked ? 'none' : 'brightness(0.35) grayscale(0.6)' }} />
    ) : item.kind === 'evo' && item.evoTarget ? (
      <img src={getSpriteForStage(item.evoTarget)} alt={item.evoTarget}
           style={{ width: 44, height: 44, flexShrink: 0, objectFit: 'contain', imageRendering: 'pixelated', filter: unlocked ? 'none' : 'brightness(0.3) grayscale(0.8)' }} />
    ) : (
      <span style={{ fontSize: '1.7rem', width: 44, textAlign: 'center', flexShrink: 0, filter: unlocked ? 'none' : 'brightness(0.4) grayscale(0.8)' }}>{item.icon}</span>
    );

    return (
      <div
        key={item.id}
        onClick={() => { if (!unlocked) setHintFor(showHint ? null : item.id); }}
        style={{ ...pixelBox(flashHere ? (flash!.ok ? '#4ade80' : '#f87171') : '#2b3a55'), padding: 10, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', cursor: unlocked ? 'default' : 'pointer' }}
      >
        {/* icon (darkened + padlock overlay when locked) */}
        <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
          {iconEl}
          {!unlocked && (
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', textShadow: '0 1px 3px #000' }}>
              🔒
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ ...px, color: unlocked ? '#e8eefc' : '#7c8db0', fontWeight: 800, fontSize: '0.8rem' }}>
            {isPt ? item.namePt : item.nameEn}
          </p>
          <p style={{ ...px, color: unlocked ? '#9fb2d8' : '#5d729c', fontSize: '0.68rem' }}>
            {isPt ? item.descPt : item.descEn}
          </p>
          {evoActive && (
            <p style={{ ...px, color: '#facc15', fontSize: '0.66rem', fontWeight: 800 }}>
              ★ {isPt ? 'EQUIPADO — aguardando evolução' : 'EQUIPPED — waiting for evolution'}
            </p>
          )}
        </div>
        {/* action */}
        {ownedBg ? (
          <button
            onClick={e => { e.stopPropagation(); onEquip(equipped ? null : item.id); }}
            style={{ ...px, ...pixelBox(equipped ? '#facc15' : '#60a5fa'), color: equipped ? '#facc15' : '#60a5fa', fontWeight: 800, fontSize: '0.66rem', padding: '6px 8px', cursor: 'pointer', flexShrink: 0 }}>
            {equipped ? (isPt ? 'EQUIPADO ✓' : 'EQUIPPED ✓') : (isPt ? 'EQUIPAR' : 'EQUIP')}
          </button>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); if (unlocked) buy(item); else setHintFor(showHint ? null : item.id); }}
            disabled={unlocked && !canBuy}
            style={{
              ...px,
              ...pixelBox(!unlocked ? '#374151' : canBuy ? '#4ade80' : '#374151'),
              color: !unlocked ? '#6b7280' : canBuy ? '#4ade80' : '#6b7280',
              fontWeight: 800, fontSize: '0.7rem', padding: '6px 8px',
              cursor: !unlocked || canBuy ? 'pointer' : 'default', flexShrink: 0,
            }}>
            {unlocked ? item.price : '🔒'}
          </button>
        )}
        {/* unlock hint "tooltip" — expands inside the card when tapped */}
        {!unlocked && showHint && (
          <p style={{ ...px, width: '100%', margin: 0, padding: '6px 8px', background: '#101c14', border: '2px solid #facc15', color: '#facc15', fontSize: '0.66rem', fontWeight: 800 }}>
            🔓 {isPt ? 'Como desbloquear:' : 'How to unlock:'} {unlockHint(item)}
          </p>
        )}
      </div>
    );
  };

  const renderMissions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ ...px, color: '#9fb2d8', fontSize: '0.68rem', textAlign: 'center' }}>
        {isPt
          ? 'Complete missões para LIBERAR A COMPRA de itens exclusivos da loja.'
          : 'Complete missions to UNLOCK the purchase of exclusive shop items.'}
      </p>
      {MISSIONS.map(m => {
        const cur = missionProgress[m.id] ?? 0;
        const done = cur >= m.target;
        const rewardItem = SHOP_ITEMS.find(i => i.id === m.bgReward);
        return (
          <div key={m.id} style={{ ...pixelBox(done ? '#4ade80' : '#2b3a55'), padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: '1.7rem', width: 44, textAlign: 'center', flexShrink: 0 }}>{m.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ ...px, color: '#e8eefc', fontWeight: 800, fontSize: '0.8rem' }}>
                {isPt ? m.namePt : m.nameEn}
              </p>
              <p style={{ ...px, color: '#9fb2d8', fontSize: '0.68rem' }}>
                {isPt ? m.descPt : m.descEn}
              </p>
              <p style={{ ...px, color: '#60a5fa', fontSize: '0.64rem' }}>
                🔓 {isPt ? 'Libera:' : 'Unlocks:'} {rewardItem ? (isPt ? rewardItem.namePt : rewardItem.nameEn) : m.bgReward} ({isPt ? 'aba Cenários' : 'Backdrops tab'})
              </p>
              <div style={{ marginTop: 4, height: 8, background: '#131a26', border: '1px solid #2c3a52' }}>
                <div style={{ width: `${Math.min(100, (cur / m.target) * 100)}%`, height: '100%', background: done ? '#4ade80' : '#60a5fa', transition: 'width 0.3s' }} />
              </div>
              <p style={{ ...px, color: done ? '#4ade80' : '#5d729c', fontSize: '0.62rem', marginTop: 2, fontWeight: 800 }}>
                {done
                  ? (isPt ? 'CONCLUÍDA ✓ — item liberado na loja!' : 'DONE ✓ — item unlocked in the shop!')
                  : m.target === 1 ? (isPt ? 'PENDENTE' : 'PENDING') : `${cur}/${m.target}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(4,6,12,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div style={{ ...pixelBox('#4ade80'), width: '100%', maxWidth: 420, maxHeight: '88vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        {/* scanlines */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 4px)' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '3px solid #4ade80', background: '#101c14' }}>
          <span style={{ ...px, color: '#4ade80', fontWeight: 800, fontSize: '1rem', letterSpacing: 2, textShadow: '2px 2px 0 #000' }}>
            🛒 {isPt ? 'LOJA' : 'SHOP'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ ...bitsStyle, fontSize: '0.9rem' }}>
              {points} Bits
            </span>
            <button onClick={onClose}
              style={{ ...px, ...pixelBox('#f87171'), color: '#f87171', fontWeight: 800, padding: '2px 10px', cursor: 'pointer', fontSize: '0.85rem' }}>
              X
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '3px solid #2b3a55', background: '#0a111c' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setHintFor(null); }}
              style={{
                ...px, flex: 1, padding: '8px 2px', border: 'none', cursor: 'pointer',
                background: tab === t.key ? '#14231a' : 'transparent',
                borderBottom: tab === t.key ? '3px solid #4ade80' : '3px solid transparent',
                marginBottom: -3,
                color: tab === t.key ? '#4ade80' : '#5d729c',
                fontWeight: 800, fontSize: '0.62rem', letterSpacing: 0.5,
              }}
            >
              <span style={{ fontSize: '0.95rem', display: 'block' }}>{t.icon}</span>
              {isPt ? t.pt : t.en}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tab === 'missions'
            ? renderMissions()
            : TAB_ITEMS[tab].map(renderItem)}
          <p style={{ ...px, color: '#5d729c', fontSize: '0.64rem', textAlign: 'center' }}>
            {tab === 'missions'
              ? (isPt ? 'Progresso conta desde o início do jogo.' : 'Progress counts from the very start.')
              : (isPt ? 'Ganhe Bits nos minijogos! Itens com 🔒: toque para ver como desbloquear.' : 'Earn Bits in the minigames! 🔒 items: tap to see how to unlock.')}
          </p>
        </div>
      </div>
    </div>
  );
}
