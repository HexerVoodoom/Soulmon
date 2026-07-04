import { useState } from 'react';
import { DungeonGame } from './DungeonGame';
import { DinoGame } from './DinoGame';
import { RPSGame } from './RPSGame';
import { ShopModal } from './ShopModal';
import type { Language } from '../utils/i18n';

/**
 * "Atividades" page — interactive minigames hub.
 * All games award 🎖️ gamePoints (accumulate only, for now — see docs/SHOP-PLAN.md).
 * Balance: Dungeon 4-12/enemy +10 clear · Dino floor(score/100) · RPS +5/match.
 */
export function ActivitiesPage({ evolutionStage, language, theme = 'default', totalPoints, ownedBackgrounds, equippedBackground, equippedEvoItem, onDungeonEnter, onDungeonLose, onDungeonHeartDrop, onEarnPoints, onShopBuy, onEquipBackground }: {
  evolutionStage: string;
  language: Language;
  theme?: 'default' | 'win98' | 'glitch';
  totalPoints: number;
  ownedBackgrounds: string[];
  equippedBackground: string | null;
  equippedEvoItem: string | null;
  onDungeonEnter: () => { ok: true; level: number; best: number } | { ok: false; reason: 'hp' | 'limit' };
  onDungeonLose: () => void;
  onDungeonHeartDrop: () => boolean;
  onEarnPoints: (pts: number) => void;
  onShopBuy: (itemId: string) => boolean;
  onEquipBackground: (id: string | null) => void;
}) {
  const isPt = language === 'pt-BR';
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const [openGame, setOpenGame] = useState<'dungeon' | 'dino' | 'rps' | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const mono = { fontFamily: 'monospace' as const };

  const cards: { key: 'dungeon' | 'dino' | 'rps'; icon: string; title: string; desc: string; pts: string }[] = [
    {
      key: 'dungeon', icon: '⚔️',
      title: isPt ? 'Masmorra' : 'Dungeon',
      desc: isPt
        ? 'Escada de inimigos (bebê→mega) que sobe de nível a cada onda. Perder custa 1 coração! Pode dropar coraçãozinho.'
        : 'Enemy ladder (baby→mega) that levels up each wave. Losing costs 1 heart! Can drop a little heart.',
      pts: isPt ? 'Pontos por inimigo + ranking' : 'Points per enemy + ranking',
    },
    {
      key: 'dino', icon: '🦖',
      title: isPt ? 'Corrida do Dino' : 'Dino Runner',
      desc: isPt ? 'Pule os obstáculos e corra o máximo que conseguir.' : 'Jump the obstacles and run as far as you can.',
      pts: isPt ? '1 🎖️ a cada 100 de score' : '1 🎖️ per 100 score',
    },
    {
      key: 'rps', icon: '✊',
      title: isPt ? 'Pedra, Papel e Tesoura' : 'Rock, Paper, Scissors',
      desc: isPt ? 'Clássico duelo contra o seu Digimon. Melhor de 5.' : 'The classic duel against your Digimon. First to 3.',
      pts: isPt ? '5 🎖️ por vitória' : '5 🎖️ per match win',
    },
  ];

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2
          className={isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-900'}
          style={{ ...mono, fontSize: '1.05rem', fontWeight: 700 }}
        >
          🎮 {isPt ? 'Atividades' : 'Activities'}
        </h2>
        <span
          className={`px-3 py-1 rounded-full ${isGlitch ? 'bg-[#00ffff]/10 text-[#00ffff]' : isWin98 ? 'bg-white text-black border border-gray-400' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}
          style={{ ...mono, fontSize: '0.8rem', fontWeight: 700 }}
          title={isPt ? 'Pontos de minijogos (em breve: loja!)' : 'Minigame points (shop coming soon!)'}
        >
          🎖️ {totalPoints}
        </span>
      </div>
      <p className={isGlitch ? 'text-[#5fbcbc]' : isWin98 ? 'text-gray-700' : 'text-gray-500'}
         style={{ ...mono, fontSize: '0.78rem' }}>
        {isPt ? 'Minijogos para se divertir e acumular pontos com seu Digimon.' : 'Minigames to have fun and earn points with your Digimon.'}
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
                : 'bg-white shadow-sm ring-1 ring-gray-200/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{c.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-900'}
                      style={{ ...mono, fontSize: '0.9rem', fontWeight: 700 }}>
                  {c.title}
                </span>
                <span className={`px-2 py-[2px] rounded-full ${isGlitch ? 'bg-[#00ffff]/10 text-[#5fbcbc]' : 'bg-gray-100 text-gray-500'}`}
                      style={{ ...mono, fontSize: '0.6rem' }}>
                  {c.pts}
                </span>
              </div>
              <p className={isGlitch ? 'text-[#5fbcbc]' : isWin98 ? 'text-gray-700' : 'text-gray-500'}
                 style={{ ...mono, fontSize: '0.72rem', marginTop: 2 }}>
                {c.desc}
              </p>
            </div>
            <span className={isGlitch ? 'text-[#00ffff]' : 'text-gray-400'} style={{ fontSize: '1.1rem' }}>›</span>
          </div>
        </button>
      ))}

      {/* 🛒 Shop entry — deliberately 8-bit */}
      <button
        onClick={() => setShopOpen(true)}
        className="w-full text-left cursor-pointer active:scale-[0.99] transition-all"
        style={{
          fontFamily: "'Courier New', monospace",
          background: '#0d1420',
          border: '3px solid #4ade80',
          boxShadow: '4px 4px 0 #000',
          padding: '14px 16px',
          imageRendering: 'pixelated',
        }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>🛒</span>
          <div className="flex-1">
            <span style={{ color: '#4ade80', fontWeight: 800, fontSize: '0.9rem', letterSpacing: 2, textShadow: '2px 2px 0 #000' }}>
              {isPt ? 'LOJA' : 'SHOP'}
            </span>
            <p style={{ color: '#9fb2d8', fontSize: '0.7rem', marginTop: 2 }}>
              {isPt ? 'Chips, coraçõezinhos, itens de digievolução e cenários!' : 'Chips, little hearts, digivolution items and backdrops!'}
            </p>
          </div>
          <span style={{ color: '#facc15', fontWeight: 800, fontSize: '0.85rem', textShadow: '2px 2px 0 #000' }}>
            🎖️ {totalPoints}
          </span>
        </div>
      </button>

      {shopOpen && (
        <ShopModal
          language={language}
          points={totalPoints}
          ownedBackgrounds={ownedBackgrounds}
          equippedBackground={equippedBackground}
          equippedEvoItem={equippedEvoItem}
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
          onEarnPoints={onEarnPoints}
          onExit={() => setOpenGame(null)}
        />
      )}
      {openGame === 'dino' && (
        <DinoGame
          evolutionStage={evolutionStage}
          language={language}
          onEarnPoints={onEarnPoints}
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
