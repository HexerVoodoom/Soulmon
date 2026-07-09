import { useState } from 'react';
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
export function ActivitiesPage({ evolutionStage, language, theme = 'default', totalPoints, ownedBackgrounds, equippedBackground, equippedEvoItem, onDungeonEnter, onDungeonLose, onDungeonHeartDrop, onDungeonDigimental, onGlitchtama, onItemDrop, onEarnPoints, onShopBuy, onEquipBackground }: {
  evolutionStage: string;
  language: Language;
  theme?: 'default' | 'win98' | 'glitch';
  totalPoints: number;
  ownedBackgrounds: string[];
  equippedBackground: string | null;
  equippedEvoItem: string | null;
  onDungeonEnter: () => { ok: true; level: number; best: number } | { ok: false; reason: 'hp' };
  onDungeonLose: () => void;
  onDungeonHeartDrop: () => boolean;
  onDungeonDigimental: () => string | null;
  onGlitchtama: () => void;
  onItemDrop: (emoji: string) => string;
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
        ? '5 andares retrô, cada um com 6 inimigos e mais forte. Perder custa 1 coração! Reset semanal.'
        : '5 retro floors, each with 6 tougher enemies. Losing costs 1 heart! Weekly reset.',
      pts: isPt ? 'Bits por inimigo + ranking' : 'Bits per enemy + ranking',
    },
    {
      key: 'dino', icon: '🦖',
      title: isPt ? 'Corrida do Dino' : 'Dino Runner',
      desc: isPt ? 'Pule os obstáculos e corra o máximo que conseguir.' : 'Jump the obstacles and run as far as you can.',
      pts: isPt ? '1 Bit a cada 100 de score' : '1 Bit per 100 score',
    },
    {
      key: 'rps', icon: '✊',
      title: isPt ? 'Pedra, Papel e Tesoura' : 'Rock, Paper, Scissors',
      desc: isPt ? 'Clássico duelo contra o seu Digimon. Melhor de 5.' : 'The classic duel against your Digimon. First to 3.',
      pts: isPt ? '5 Bits por vitória' : '5 Bits per match win',
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
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-md"
            style={{ ...bitsStyle, fontSize: '0.85rem', background: '#0a1408', border: '1px solid rgba(57,255,20,0.4)' }}
            title={isPt ? 'Bits — moeda dos minijogos (gaste na loja!)' : 'Bits — minigame currency (spend in the shop!)'}
          >
            {totalPoints} Bits
          </span>
          {/* 🛒 Shop entry — deliberately 8-bit */}
          <button
            onClick={() => setShopOpen(true)}
            aria-label={isPt ? 'Loja' : 'Shop'}
            title={isPt ? 'Loja — chips, coraçõezinhos, itens de digievolução e cenários!' : 'Shop — chips, little hearts, digivolution items and backdrops!'}
            className="cursor-pointer active:scale-[0.97] transition-all"
            style={{
              background: '#0d1420',
              border: '3px solid #4ade80',
              boxShadow: '3px 3px 0 #000',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.15rem',
              lineHeight: 1,
              imageRendering: 'pixelated',
            }}
          >
            🛒
          </button>
        </div>
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
          onDigimentalDrop={onDungeonDigimental}
          onGlitchtama={onGlitchtama}
          onEarnPoints={onEarnPoints}
          onExit={() => setOpenGame(null)}
        />
      )}
      {openGame === 'dino' && (
        <DinoGame
          evolutionStage={evolutionStage}
          language={language}
          onEarnPoints={onEarnPoints}
          onItemDrop={onItemDrop}
          onExit={() => setOpenGame(null)}
        />
      )}
      {openGame === 'rps' && (
        <RPSGame
          evolutionStage={evolutionStage}
          language={language}
          onEarnPoints={onEarnPoints}
          onItemDrop={onItemDrop}
          onExit={() => setOpenGame(null)}
        />
      )}
    </div>
  );
}
