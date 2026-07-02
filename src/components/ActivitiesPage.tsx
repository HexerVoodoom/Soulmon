import { useState } from 'react';
import { DungeonGame } from './DungeonGame';
import type { Language } from '../utils/i18n';

/**
 * "Atividades" page — interactive minigames hub.
 * Dungeon is playable; Dino Runner and Rock-Paper-Scissors are placeholders
 * (see CLAUDE.md: they follow this page's card pattern when implemented).
 */
export function ActivitiesPage({ evolutionStage, language, theme = 'default', onDungeonReward }: {
  evolutionStage: string;
  language: Language;
  theme?: 'default' | 'win98' | 'glitch';
  onDungeonReward: () => string | null;
}) {
  const isPt = language === 'pt-BR';
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const [openGame, setOpenGame] = useState<'dungeon' | null>(null);
  const mono = { fontFamily: 'monospace' as const };

  const cards: { key: string; icon: string; title: string; desc: string; ready: boolean }[] = [
    {
      key: 'dungeon', icon: '⚔️',
      title: isPt ? 'Masmorra' : 'Dungeon',
      desc: isPt
        ? 'Batalhas por turno com barra de precisão. Vença inimigos e ganhe comida!'
        : 'Turn-based battles with a timing bar. Beat enemies and earn food!',
      ready: true,
    },
    {
      key: 'dino', icon: '🦖',
      title: isPt ? 'Corrida do Dino' : 'Dino Runner',
      desc: isPt ? 'Pule os obstáculos e corra o máximo que conseguir.' : 'Jump the obstacles and run as far as you can.',
      ready: false,
    },
    {
      key: 'rps', icon: '✊',
      title: isPt ? 'Pedra, Papel e Tesoura' : 'Rock, Paper, Scissors',
      desc: isPt ? 'Clássico duelo contra o seu Digimon.' : 'The classic duel against your Digimon.',
      ready: false,
    },
  ];

  return (
    <div className="p-4 space-y-3">
      <h2
        className={isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-900'}
        style={{ ...mono, fontSize: '1.05rem', fontWeight: 700 }}
      >
        🎮 {isPt ? 'Atividades' : 'Activities'}
      </h2>
      <p className={isGlitch ? 'text-[#5fbcbc]' : isWin98 ? 'text-gray-700' : 'text-gray-500'}
         style={{ ...mono, fontSize: '0.78rem' }}>
        {isPt ? 'Minijogos para se divertir com seu Digimon.' : 'Minigames to have fun with your Digimon.'}
      </p>

      {cards.map(c => (
        <button
          key={c.key}
          disabled={!c.ready}
          onClick={() => c.ready && setOpenGame(c.key as 'dungeon')}
          className={`w-full text-left rounded-2xl p-4 transition-all ${
            isGlitch
              ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/30'
              : isWin98
                ? 'win98-button bg-white'
                : 'bg-white shadow-sm ring-1 ring-gray-200/50'
          } ${c.ready ? 'cursor-pointer active:scale-[0.99]' : 'opacity-55 cursor-default'}`}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{c.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-900'}
                      style={{ ...mono, fontSize: '0.9rem', fontWeight: 700 }}>
                  {c.title}
                </span>
                {!c.ready && (
                  <span className={`px-2 py-[2px] rounded-full ${isGlitch ? 'bg-[#00ffff]/10 text-[#5fbcbc]' : 'bg-gray-100 text-gray-400'}`}
                        style={{ ...mono, fontSize: '0.6rem' }}>
                    {isPt ? 'EM BREVE' : 'COMING SOON'}
                  </span>
                )}
              </div>
              <p className={isGlitch ? 'text-[#5fbcbc]' : isWin98 ? 'text-gray-700' : 'text-gray-500'}
                 style={{ ...mono, fontSize: '0.72rem', marginTop: 2 }}>
                {c.desc}
              </p>
            </div>
            {c.ready && <span className={isGlitch ? 'text-[#00ffff]' : 'text-gray-400'} style={{ fontSize: '1.1rem' }}>›</span>}
          </div>
        </button>
      ))}

      {openGame === 'dungeon' && (
        <DungeonGame
          evolutionStage={evolutionStage}
          language={language}
          onReward={onDungeonReward}
          onExit={() => setOpenGame(null)}
        />
      )}
    </div>
  );
}
