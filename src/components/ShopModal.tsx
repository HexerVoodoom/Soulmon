import { useState } from 'react';
import { SHOP_ITEMS, type ShopItem } from '../utils/shop';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { MISSIONS } from '../utils/missions';
import { getSpriteForStage } from '../utils/sprites';
import { bitsStyle } from '../utils/currency';
import type { Language } from '../utils/i18n';

/**
 * 🛒 8-bit shop — spend Bits (🪙) earned in the minigames.
 * Chunky pixel borders, scanlines, hard shadows: intentionally retro.
 */
export function ShopModal({ language, points, ownedBackgrounds, equippedBackground, equippedEvoItem, missionProgress, onClaimMission, onBuy, onEquip, onClose }: {
  language: Language;
  points: number;
  ownedBackgrounds: string[];
  equippedBackground: string | null;
  equippedEvoItem: string | null;
  /** Progress per mission id (clamped to its target) — utils/missions.ts. */
  missionProgress: Record<string, number>;
  /** Claims a completed mission: unlocks its exclusive background. */
  onClaimMission: (missionId: string) => boolean;
  onBuy: (itemId: string) => boolean;
  onEquip: (id: string | null) => void;
  onClose: () => void;
}) {
  const isPt = language === 'pt-BR';
  const [flash, setFlash] = useState<{ id: string; ok: boolean } | null>(null);
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

  const sections: { title: string; items: ShopItem[] }[] = [
    { title: isPt ? '─ CHIPS DE ATRIBUTO ─' : '─ ATTRIBUTE CHIPS ─', items: SHOP_ITEMS.filter(i => i.kind === 'chip') },
    { title: isPt ? '─ CORAÇÕEZINHOS ─' : '─ LITTLE HEARTS ─', items: SHOP_ITEMS.filter(i => i.kind === 'heart') },
    { title: isPt ? '─ ITENS DE DIGIEVOLUÇÃO ─' : '─ DIGIVOLUTION ITEMS ─', items: SHOP_ITEMS.filter(i => i.kind === 'evo') },
    { title: isPt ? '─ CENÁRIOS DO PET ─' : '─ PET BACKDROPS ─', items: SHOP_ITEMS.filter(i => i.kind === 'bg') },
  ];

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

        {/* Items */}
        <div style={{ overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sections.map(sec => (
            <div key={sec.title}>
              <p style={{ ...px, color: '#9fb2d8', fontSize: '0.72rem', fontWeight: 800, letterSpacing: 1, textAlign: 'center', marginBottom: 8 }}>
                {sec.title}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sec.items.map(item => {
                  const ownedBg = item.kind === 'bg' && ownedBackgrounds.includes(item.id);
                  const equipped = ownedBg && equippedBackground === item.id;
                  const evoActive = item.kind === 'evo' && equippedEvoItem === item.id;
                  const evoBlocked = item.kind === 'evo' && !!equippedEvoItem && !evoActive;
                  const affordable = points >= item.price;
                  const flashHere = flash?.id === item.id;

                  return (
                    <div key={item.id} style={{ ...pixelBox(flashHere ? (flash!.ok ? '#4ade80' : '#f87171') : '#2b3a55'), padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                      {/* icon / bg preview */}
                      {item.kind === 'bg' ? (
                        <div style={{ width: 44, height: 44, flexShrink: 0, border: '2px solid #000', background: PET_BACKGROUNDS[item.id]?.css }} />
                      ) : item.kind === 'evo' && item.evoTarget ? (
                        <img src={getSpriteForStage(item.evoTarget)} alt={item.evoTarget}
                             style={{ width: 44, height: 44, flexShrink: 0, objectFit: 'contain', imageRendering: 'pixelated' }} />
                      ) : (
                        <span style={{ fontSize: '1.7rem', width: 44, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ ...px, color: '#e8eefc', fontWeight: 800, fontSize: '0.8rem' }}>
                          {isPt ? item.namePt : item.nameEn}
                        </p>
                        <p style={{ ...px, color: '#9fb2d8', fontSize: '0.68rem' }}>
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
                          onClick={() => onEquip(equipped ? null : item.id)}
                          style={{ ...px, ...pixelBox(equipped ? '#facc15' : '#60a5fa'), color: equipped ? '#facc15' : '#60a5fa', fontWeight: 800, fontSize: '0.66rem', padding: '6px 8px', cursor: 'pointer', flexShrink: 0 }}>
                          {equipped ? (isPt ? 'EQUIPADO ✓' : 'EQUIPPED ✓') : (isPt ? 'EQUIPAR' : 'EQUIP')}
                        </button>
                      ) : (
                        <button
                          onClick={() => buy(item)}
                          disabled={!affordable || evoActive || evoBlocked}
                          style={{
                            ...px,
                            ...pixelBox(affordable && !evoActive && !evoBlocked ? '#4ade80' : '#374151'),
                            color: affordable && !evoActive && !evoBlocked ? '#4ade80' : '#6b7280',
                            fontWeight: 800, fontSize: '0.7rem', padding: '6px 8px',
                            cursor: affordable && !evoActive && !evoBlocked ? 'pointer' : 'default', flexShrink: 0,
                          }}>
                          {item.price}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {/* 🏅 Missions — exclusive backgrounds, unlocked by playing */}
          <div>
            <p style={{ ...px, color: '#9fb2d8', fontSize: '0.72rem', fontWeight: 800, letterSpacing: 1, textAlign: 'center', marginBottom: 8 }}>
              {isPt ? '─ MISSÕES (CENÁRIOS EXCLUSIVOS) ─' : '─ MISSIONS (EXCLUSIVE BACKDROPS) ─'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MISSIONS.map(m => {
                const cur = missionProgress[m.id] ?? 0;
                const done = cur >= m.target;
                const owned = ownedBackgrounds.includes(m.bgReward);
                const equipped = owned && equippedBackground === m.bgReward;
                const flashHere = flash?.id === m.id;
                return (
                  <div key={m.id} style={{ ...pixelBox(flashHere ? (flash!.ok ? '#4ade80' : '#f87171') : owned ? '#facc15' : '#2b3a55'), padding: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                    {owned ? (
                      <div style={{ width: 44, height: 44, flexShrink: 0, border: '2px solid #000', background: PET_BACKGROUNDS[m.bgReward]?.css }} />
                    ) : (
                      <span style={{ fontSize: '1.7rem', width: 44, textAlign: 'center', flexShrink: 0 }}>{m.icon}</span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ ...px, color: '#e8eefc', fontWeight: 800, fontSize: '0.8rem' }}>
                        {isPt ? m.namePt : m.nameEn}
                      </p>
                      <p style={{ ...px, color: '#9fb2d8', fontSize: '0.68rem' }}>
                        {isPt ? m.descPt : m.descEn}
                        {' · 🖼️ '}
                        {isPt ? PET_BACKGROUNDS[m.bgReward]?.namePt : PET_BACKGROUNDS[m.bgReward]?.nameEn}
                      </p>
                      {/* progress bar */}
                      <div style={{ marginTop: 4, height: 8, background: '#131a26', border: '1px solid #2c3a52', position: 'relative' }}>
                        <div style={{ width: `${Math.min(100, (cur / m.target) * 100)}%`, height: '100%', background: done ? '#4ade80' : '#60a5fa', transition: 'width 0.3s' }} />
                      </div>
                      <p style={{ ...px, color: done ? '#4ade80' : '#5d729c', fontSize: '0.62rem', marginTop: 2, fontWeight: 800 }}>
                        {m.target === 1 ? (done ? (isPt ? 'CONCLUÍDA' : 'DONE') : (isPt ? 'PENDENTE' : 'PENDING')) : `${cur}/${m.target}`}
                      </p>
                    </div>
                    {owned ? (
                      <button
                        onClick={() => onEquip(equipped ? null : m.bgReward)}
                        style={{ ...px, ...pixelBox(equipped ? '#facc15' : '#60a5fa'), color: equipped ? '#facc15' : '#60a5fa', fontWeight: 800, fontSize: '0.66rem', padding: '6px 8px', cursor: 'pointer', flexShrink: 0 }}>
                        {equipped ? (isPt ? 'EQUIPADO ✓' : 'EQUIPPED ✓') : (isPt ? 'EQUIPAR' : 'EQUIP')}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const ok = onClaimMission(m.id);
                          setFlash({ id: m.id, ok });
                          setTimeout(() => setFlash(null), 900);
                          try { navigator.vibrate?.(ok ? 25 : 60); } catch { /* noop */ }
                        }}
                        disabled={!done}
                        style={{
                          ...px,
                          ...pixelBox(done ? '#4ade80' : '#374151'),
                          color: done ? '#4ade80' : '#6b7280',
                          fontWeight: 800, fontSize: '0.66rem', padding: '6px 8px',
                          cursor: done ? 'pointer' : 'default', flexShrink: 0,
                        }}>
                        {isPt ? 'RESGATAR' : 'CLAIM'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <p style={{ ...px, color: '#5d729c', fontSize: '0.64rem', textAlign: 'center' }}>
            {isPt ? 'Ganhe Bits jogando os minijogos!' : 'Earn Bits by playing the minigames!'}
          </p>
        </div>
      </div>
    </div>
  );
}
