import { useState } from 'react';
import { X, Gem, FlaskConical, Image as ImageIcon, Award, Lock, Check } from 'lucide-react';
import { SHOP_ITEMS, type ShopItem } from '../utils/shop';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { MISSIONS, isShopItemUnlocked } from '../utils/missions';
import type { Language } from '../utils/i18n';

/**
 * Loja — gasta Bits ganhos nos minijogos. Organizada em abas (Itens /
 * Cenários / Missões). Itens podem estar BLOQUEADOS por missão: renderizam
 * escurecidos com cadeado; tocar mostra como desbloquear. Os emojis dos
 * itens são conteúdo do jogo (o que cada item É), não ícones de navegação —
 * mantidos como estão; o chrome do modal usa o design system sm-*.
 */
type ShopTab = 'items' | 'bg' | 'missions';

export function ShopModal({ language, points, ownedBackgrounds, equippedBackground, missionProgress, onBuy, onEquip, onClose }: {
  language: Language;
  points: number;
  ownedBackgrounds: string[];
  equippedBackground: string | null;
  /** Progress per mission id (clamped to its target) — utils/missions.ts. */
  missionProgress: Record<string, number>;
  onBuy: (itemId: string) => boolean;
  onEquip: (id: string | null) => void;
  onClose: () => void;
}) {
  const isPt = language === 'pt-BR';
  const [tab, setTab] = useState<ShopTab>('items');
  const [flash, setFlash] = useState<{ id: string; ok: boolean } | null>(null);
  /** Item id whose unlock hint is expanded (tap a locked item to toggle). */
  const [hintFor, setHintFor] = useState<string | null>(null);

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
    { key: 'missions', Icon: Award, pt: 'Missões', en: 'Missions' },
  ];

  const TAB_ITEMS: Record<Exclude<ShopTab, 'missions'>, ShopItem[]> = {
    items: SHOP_ITEMS.filter(i => i.kind === 'chip' || i.kind === 'heart'),
    bg: SHOP_ITEMS.filter(i => i.kind === 'bg'),
  };

  const renderItem = (item: ShopItem) => {
    const unlocked = isShopItemUnlocked(item, missionProgress);
    const ownedBg = item.kind === 'bg' && ownedBackgrounds.includes(item.id);
    const equipped = ownedBg && equippedBackground === item.id;
    const affordable = points >= item.price;
    const flashHere = flash?.id === item.id;
    const showHint = hintFor === item.id;
    const canBuy = unlocked && affordable;

    const iconEl = item.kind === 'bg' ? (
      <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, background: PET_BACKGROUNDS[item.id]?.css, filter: unlocked ? 'none' : 'grayscale(0.7) brightness(0.85)' }} />
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
              <Lock size={16} color="#fff" strokeWidth={2.4} />
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
        {ownedBg ? (
          <button
            onClick={e => { e.stopPropagation(); onEquip(equipped ? null : item.id); }}
            className={equipped ? 'sm-btn sm-btn-gold' : 'sm-btn sm-btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '0.7rem' }}>
            {equipped ? <><Check size={14} strokeWidth={3} /> {isPt ? 'Equipado' : 'Equipped'}</> : (isPt ? 'Equipar' : 'Equip')}
          </button>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); if (unlocked) buy(item); else setHintFor(showHint ? null : item.id); }}
            disabled={unlocked && !canBuy}
            className="sm-btn"
            style={{ padding: '6px 12px', fontSize: '0.7rem', flexShrink: 0 }}>
            {unlocked ? <><Gem size={13} strokeWidth={2.4} /> {item.price}</> : <Lock size={14} strokeWidth={2.4} />}
          </button>
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
              <p style={{ color: 'var(--sm-primary)', fontSize: '0.68rem', margin: '2px 0 0', fontWeight: 600 }}>
                {isPt ? 'Libera:' : 'Unlocks:'} {rewardItem ? (isPt ? rewardItem.namePt : rewardItem.nameEn) : m.bgReward} ({isPt ? 'aba Cenários' : 'Backdrops tab'})
              </p>
              <div style={{ marginTop: 4, height: 8, background: 'var(--sm-line)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (cur / m.target) * 100)}%`, height: '100%', background: done ? '#22A900' : 'var(--sm-primary)', transition: 'width 0.3s' }} />
              </div>
              <p style={{ color: done ? '#22A900' : 'var(--sm-muted)', fontSize: '0.66rem', marginTop: 2, marginBottom: 0, fontWeight: 700 }}>
                {done
                  ? (isPt ? 'Concluída — item liberado na loja!' : 'Done — item unlocked in the shop!')
                  : m.target === 1 ? (isPt ? 'Pendente' : 'Pending') : `${cur}/${m.target}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(20,15,40,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div className="sm-card" style={{ background: 'var(--sm-bg)', width: '100%', maxWidth: 420, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--sm-surface)', borderBottom: '1px solid var(--sm-line)' }}>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--sm-ink)' }}>
            {isPt ? 'Loja' : 'Shop'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="sm-card" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px' }}>
              <Gem size={14} color="var(--sm-primary)" strokeWidth={2.4} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--sm-ink)' }}>{points}</span>
            </span>
            <button onClick={onClose} className="sm-nav-btn" aria-label={isPt ? 'Fechar' : 'Close'}>
              <X size={18} strokeWidth={2.4} />
            </button>
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
          <p style={{ color: 'var(--sm-muted)', fontSize: '0.68rem', textAlign: 'center', margin: 0 }}>
            {tab === 'missions'
              ? (isPt ? 'Progresso conta desde o início do jogo.' : 'Progress counts from the very start.')
              : (isPt ? 'Ganhe Bits nos minijogos! Itens bloqueados: toque para ver como desbloquear.' : 'Earn Bits in the minigames! Locked items: tap to see how to unlock.')}
          </p>
        </div>
      </div>
    </div>
  );
}
