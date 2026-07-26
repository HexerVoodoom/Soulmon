import { useState } from 'react';
import { Gamepad2, Swords, Rabbit, Scissors, ShoppingBag, ChevronRight, Gem } from 'lucide-react';
import { DungeonGame } from './DungeonGame';
import { DinoGame } from './DinoGame';
import { RPSGame } from './RPSGame';
import { ShopModal } from './ShopModal';
import { bitsStyle } from '../utils/currency';
import type { Language } from '../utils/i18n';

/**
 * "Atividades" page — interactive minigames hub.
 * All games award 🪙 Bits (GameState.gamePoints), spent in the shop.
 * Balance: Dungeon points/enemy + wave clear · Dino floor(score/100) · RPS +5/match.
 */
export function ActivitiesPage({ evolutionStage, language, theme = 'default', totalPoints, ownedBackgrounds, equippedBackground, onDungeonEnter, onDungeonLose, onDungeonHeartDrop, onGlitchtama, onDungeonEnemyDefeated, onDinoScore, onEarnPoints, onShopBuy, onEquipBackground, missionProgress }: {
  evolutionStage: string;
  language: Language;
  theme?: 'default' | 'win98' | 'glitch';
  totalPoints: number;
  ownedBackgrounds: string[];
  equippedBackground: string | null;
  onDungeonEnter: () => { ok: true; level: number; best: number } | { ok: false; reason: 'hp' };
  onDungeonLose: () => void;
  onDungeonHeartDrop: () => boolean;
  onGlitchtama: () => void;
  onDungeonEnemyDefeated: () => void;
  onDinoScore: (score: number) => void;
  onEarnPoints: (pts: number) => void;
  onShopBuy: (itemId: string) => boolean;
  onEquipBackground: (id: string | null) => void;
  missionProgress: Record<string, number>;
}) {
  const isPt = language === 'pt-BR';
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const [openGame, setOpenGame] = useState<'dungeon' | 'dino' | 'rps' | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const mono = { fontFamily: 'monospace' as const };

  const cards: { key: 'dungeon' | 'dino' | 'rps'; Icon: typeof Swords; iconColor: string; iconBg: string; title: string; desc: string; pts: string }[] = [
    {
      key: 'dungeon', Icon: Swords, iconColor: '#8b5cf6', iconBg: '#f3e8ff',
      title: isPt ? 'Masmorra' : 'Dungeon',
      desc: isPt
        ? '5 andares retrô, cada um com 6 inimigos e mais forte. Perder custa 1 coração! Reset semanal.'
        : '5 retro floors, each with 6 tougher enemies. Losing costs 1 heart! Weekly reset.',
      pts: isPt ? 'Bits por inimigo + ranking' : 'Bits per enemy + ranking',
    },
    {
      key: 'dino', Icon: Rabbit, iconColor: '#22A900', iconBg: '#eafbe6',
      title: isPt ? 'Corrida do Dino' : 'Dino Runner',
      desc: isPt ? 'Pule os obstáculos e corra o máximo que conseguir.' : 'Jump the obstacles and run as far as you can.',
      pts: isPt ? '1 Bit a cada 100 de score' : '1 Bit per 100 score',
    },
    {
      key: 'rps', Icon: Scissors, iconColor: '#E69600', iconBg: '#fff4e0',
      title: isPt ? 'Pedra, Papel e Tesoura' : 'Rock, Paper, Scissors',
      desc: isPt ? 'Clássico duelo contra o seu Soulmon. Melhor de 5.' : 'The classic duel against your Soulmon. First to 3.',
      pts: isPt ? '5 Bits por vitória' : '5 Bits per match win',
    },
  ];

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2
          className={isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : ''}
          style={isWin98 || isGlitch ? { ...mono, fontSize: '1.05rem', fontWeight: 700 } : { fontSize: '1.15rem', fontWeight: 800, color: 'var(--sm-ink)', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {!isWin98 && !isGlitch && <Gamepad2 size={22} color="var(--sm-primary)" strokeWidth={2.2} />}
          {isWin98 || isGlitch ? '🎮 ' : ''}{isPt ? 'Atividades' : 'Activities'}
        </h2>
        <div className="flex items-center gap-2">
          {(isWin98 || isGlitch) ? (
            <span
              className="px-3 py-1 rounded-md"
              style={{ ...bitsStyle, fontSize: '0.85rem', background: '#0a1408', border: '1px solid rgba(57,255,20,0.4)' }}
              title={isPt ? 'Bits — moeda dos minijogos (gaste na loja!)' : 'Bits — minigame currency (spend in the shop!)'}
            >
              {totalPoints} Bits
            </span>
          ) : (
            <span className="sm-card flex items-center gap-1.5" style={{ padding: '6px 12px' }}>
              <Gem size={15} color="var(--sm-primary)" strokeWidth={2.2} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--sm-ink)' }}>{totalPoints}</span>
            </span>
          )}
          <button
            onClick={() => setShopOpen(true)}
            aria-label={isPt ? 'Loja' : 'Shop'}
            title={isPt ? 'Loja — chips, coraçõezinhos e cenários!' : 'Shop — chips, little hearts and backdrops!'}
            className={isWin98 || isGlitch ? 'cursor-pointer active:scale-[0.97] transition-all' : 'sm-nav-btn'}
            style={isWin98 || isGlitch ? {
              background: '#0d1420',
              border: '3px solid #4ade80',
              boxShadow: '3px 3px 0 #000',
              width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.15rem', lineHeight: 1, imageRendering: 'pixelated',
            } : undefined}
          >
            {isWin98 || isGlitch ? '🛒' : <ShoppingBag size={20} strokeWidth={2.2} />}
          </button>
        </div>
      </div>
      <p className={isGlitch ? 'text-[#5fbcbc]' : isWin98 ? 'text-gray-700' : ''}
         style={isWin98 || isGlitch ? { ...mono, fontSize: '0.78rem' } : { fontSize: '0.8rem', color: 'var(--sm-muted)' }}>
        {isPt ? 'Minijogos para se divertir e acumular pontos com seu Soulmon.' : 'Minigames to have fun and earn points with your Soulmon.'}
      </p>

      {cards.map(c => (
        <button
          key={c.key}
          onClick={() => setOpenGame(c.key)}
          className={`w-full text-left rounded-2xl p-4 transition-all cursor-pointer active:scale-[0.99] ${
            isGlitch
              ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/30'
              : isWin98
                ? 'win98-button bg-white'
                : 'sm-card'
          }`}
        >
          <div className="flex items-center gap-3">
            {isWin98 || isGlitch ? null : (
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, borderRadius: 14, background: c.iconBg }}>
                <c.Icon size={22} color={c.iconColor} strokeWidth={2.2} />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : ''}
                      style={isWin98 || isGlitch ? { ...mono, fontSize: '0.9rem', fontWeight: 700 } : { fontSize: '0.92rem', fontWeight: 700, color: 'var(--sm-ink)' }}>
                  {c.title}
                </span>
                <span className={isGlitch ? 'bg-[#00ffff]/10 text-[#5fbcbc]' : isWin98 ? 'bg-gray-100 text-gray-500' : ''}
                      style={isWin98 || isGlitch ? { ...mono, fontSize: '0.6rem', borderRadius: '9999px', padding: '2px 8px' } : { fontSize: '0.65rem', fontWeight: 600, color: 'var(--sm-muted)', background: 'var(--sm-bg)', borderRadius: 9999, padding: '2px 8px' }}>
                  {c.pts}
                </span>
              </div>
              <p className={isGlitch ? 'text-[#5fbcbc]' : isWin98 ? 'text-gray-700' : ''}
                 style={isWin98 || isGlitch ? { ...mono, fontSize: '0.72rem', marginTop: 2 } : { fontSize: '0.75rem', marginTop: 2, color: 'var(--sm-muted)' }}>
                {c.desc}
              </p>
            </div>
            {isWin98 || isGlitch
              ? <span className={isGlitch ? 'text-[#00ffff]' : 'text-gray-400'} style={{ fontSize: '1.1rem' }}>›</span>
              : <ChevronRight size={18} color="var(--sm-muted)" strokeWidth={2.2} />}
          </div>
        </button>
      ))}

      {shopOpen && (
        <ShopModal
          language={language}
          points={totalPoints}
          ownedBackgrounds={ownedBackgrounds}
          equippedBackground={equippedBackground}
          missionProgress={missionProgress}
          onBuy={onShopBuy}
          onEquip={onEquipBackground}
          onClose={() => setShopOpen(false)}
        />
      )}

      {openGame === 'dungeon' && (
        <DungeonGame
          evolutionStage={evolutionStage}
          language={language}
          onEnter={onDungeonEnter}
          onLose={onDungeonLose}
          onHeartDrop={onDungeonHeartDrop}
          onGlitchtama={onGlitchtama}
          onEnemyDefeated={onDungeonEnemyDefeated}
          onEarnPoints={onEarnPoints}
          onExit={() => setOpenGame(null)}
        />
      )}
      {openGame === 'dino' && (
        <DinoGame
          evolutionStage={evolutionStage}
          language={language}
          onEarnPoints={onEarnPoints}
          onScore={onDinoScore}
          onExit={() => setOpenGame(null)}
        />
      )}
      {openGame === 'rps' && (
        <RPSGame
          evolutionStage={evolutionStage}
          language={language}
          onEarnPoints={onEarnPoints}
          onExit={() => setOpenGame(null)}
        />
      )}
    </div>
  );
}
