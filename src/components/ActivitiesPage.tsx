import { useState } from 'react';
import { Gamepad2, Swords, Rabbit, Scissors, Trophy, ChevronRight } from 'lucide-react';
import { DungeonGame } from './DungeonGame';
import { DinoGame } from './DinoGame';
import { RPSGame } from './RPSGame';
import { bitsStyleLight } from '../utils/currency';
import type { Language } from '../utils/i18n';

/**
 * "Atividades" page — interactive minigames hub (+ Tournament, which lives
 * here alongside the minigames rather than as its own bottom-nav view).
 * All games award 🪙 Bits (GameState.gamePoints), spent in the shop (its own
 * bottom-nav entry now — kept out of the minigames hub).
 * Balance: Dungeon points/enemy + wave clear · Dino floor(score/100) · RPS +5/match.
 */
export function ActivitiesPage({ evolutionStage, demoCharacterId, language, totalPoints, onDungeonEnter, onDungeonLose, onDungeonHeartDrop, onGlitchtama, onDungeonEnemyDefeated, onDinoScore, onEarnPoints, onOpenTournament }: {
  evolutionStage: string;
  /** Modo demo (utils/monetization.ts): personagem pré-pronto — sobrepõe o sprite do pet nos minijogos. */
  demoCharacterId?: string;
  language: Language;
  totalPoints: number;
  onDungeonEnter: () => { ok: true; level: number; best: number };
  onDungeonLose: () => void;
  onDungeonHeartDrop: () => boolean;
  onGlitchtama: () => void;
  onDungeonEnemyDefeated: () => void;
  onDinoScore: (score: number) => void;
  onEarnPoints: (pts: number) => void;
  onOpenTournament: () => void;
}) {
  const isPt = language === 'pt-BR';
  const [openGame, setOpenGame] = useState<'dungeon' | 'dino' | 'rps' | null>(null);

  // Torneio fica ACIMA e separado dos minigames (seção própria) — não é mais
  // só mais um card na mesma lista.
  const tournamentCard = {
    key: 'tournament' as const, Icon: Trophy, iconColor: '#d9a441', iconBg: '#fbf1dd',
    title: isPt ? 'Torneio' : 'Tournament',
    desc: isPt ? 'PvP assíncrono contra outros jogadores. Rodada toda semana.' : 'Asynchronous PvP against other players. A round every week.',
    pts: isPt ? '5 partidas/dia' : '5 matches/day',
    onClick: onOpenTournament,
  };

  const cards: { key: 'dungeon' | 'dino' | 'rps'; Icon: typeof Swords; iconColor: string; iconBg: string; title: string; desc: string; pts: string; onClick: () => void }[] = [
    {
      key: 'dungeon', Icon: Swords, iconColor: '#8b5cf6', iconBg: '#f3e8ff',
      title: isPt ? 'Masmorra' : 'Dungeon',
      desc: isPt
        ? '5 andares retrô, cada um com 6 inimigos e mais forte. Perder custa a run, nunca seus corações. Reset semanal.'
        : '5 retro floors, each with 6 tougher enemies. Losing costs you the run, never your hearts. Weekly reset.',
      pts: isPt ? 'Bits por inimigo + ranking' : 'Bits per enemy + ranking',
      onClick: () => setOpenGame('dungeon'),
    },
    {
      key: 'dino', Icon: Rabbit, iconColor: '#22A900', iconBg: '#eafbe6',
      title: isPt ? 'Corrida do Dino' : 'Dino Runner',
      desc: isPt ? 'Pule os obstáculos e corra o máximo que conseguir.' : 'Jump the obstacles and run as far as you can.',
      pts: isPt ? '1 Bit a cada 100 de score' : '1 Bit per 100 score',
      onClick: () => setOpenGame('dino'),
    },
    {
      key: 'rps', Icon: Scissors, iconColor: '#E69600', iconBg: '#fff4e0',
      title: isPt ? 'Pedra, Papel e Tesoura' : 'Rock, Paper, Scissors',
      desc: isPt ? 'Clássico duelo contra o seu Soulmon. Primeiro a 3 vitórias.' : 'The classic duel against your Soulmon. First to 3.',
      pts: isPt ? '5 Bits por vitória' : '5 Bits per match win',
      onClick: () => setOpenGame('rps'),
    },
  ];

  const renderCard = (c: { key: string; Icon: typeof Swords; iconColor: string; iconBg: string; title: string; desc: string; pts: string; onClick: () => void }) => (
    <button
      key={c.key}
      onClick={c.onClick}
      className="w-full text-left rounded-2xl p-4 transition-all cursor-pointer active:scale-[0.99] sm-card"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, borderRadius: 14, background: c.iconBg }}>
          <c.Icon size={22} color={c.iconColor} strokeWidth={2.2} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--sm-ink)' }}>
              {c.title}
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--sm-muted)', background: 'var(--sm-bg)', borderRadius: 9999, padding: '2px 8px' }}>
              {c.pts}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', marginTop: 2, color: 'var(--sm-muted)' }}>
            {c.desc}
          </p>
        </div>
        <ChevronRight size={18} color="var(--sm-muted)" strokeWidth={2.2} />
      </div>
    </button>
  );

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--sm-ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Gamepad2 size={22} color="var(--sm-primary)" strokeWidth={2.2} />
          {isPt ? 'Atividades' : 'Activities'}
        </h2>
        <span
          className="sm-card flex items-center"
          style={{ padding: '6px 12px' }}
          title={isPt ? 'Bits — moeda dos minijogos (gaste na loja!)' : 'Bits — minigame currency (spend in the shop!)'}
        >
          {/* Sem 💎: aquele ícone é dos Créditos (dinheiro real). Ver utils/currency.ts. */}
          <span style={{ ...bitsStyleLight, fontSize: '0.85rem' }}>{totalPoints} Bits</span>
        </span>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--sm-muted)' }}>
        {isPt ? 'Minijogos para se divertir e acumular pontos com seu Soulmon.' : 'Minigames to have fun and earn points with your Soulmon.'}
      </p>

      {/* Torneio — separado, acima dos minigames */}
      {renderCard(tournamentCard)}

      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'var(--sm-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          paddingTop: 4,
          borderTop: '1px solid var(--sm-line)',
        }}
      >
        {isPt ? 'Minijogos' : 'Minigames'}
      </div>

      {cards.map(renderCard)}

      {openGame === 'dungeon' && (
        <DungeonGame
          evolutionStage={evolutionStage}
          demoCharacterId={demoCharacterId}
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
          demoCharacterId={demoCharacterId}
          language={language}
          onEarnPoints={onEarnPoints}
          onScore={onDinoScore}
          onExit={() => setOpenGame(null)}
        />
      )}
      {openGame === 'rps' && (
        <RPSGame
          evolutionStage={evolutionStage}
          demoCharacterId={demoCharacterId}
          language={language}
          onEarnPoints={onEarnPoints}
          onExit={() => setOpenGame(null)}
        />
      )}
    </div>
  );
}
