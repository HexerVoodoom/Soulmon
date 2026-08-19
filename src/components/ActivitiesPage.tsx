import { useState } from 'react';
import iconGamepad from '../assets/soulmon/icons/games/icon-game-activities.png';
import iconSwords from '../assets/soulmon/icons/games/icon-game-dungeon.png';
import iconDino from '../assets/soulmon/icons/games/icon-game-dino.png';
import iconScissors from '../assets/soulmon/icons/games/icon-game-rps.png';
import iconTrophy from '../assets/soulmon/icons/games/icon-game-tournament.png';
import { DungeonGame } from './DungeonGame';
import { DinoGame } from './DinoGame';
import { RPSGame } from './RPSGame';
import { bitsStyle } from '../utils/currency';
import { PixelChip, PixelTag } from './pixel/PixelKit';
import type { Language } from '../utils/i18n';
import iconChevronRight from '../assets/soulmon/icons/icon-chevron-right.png';

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
    key: 'tournament' as const, icon: iconTrophy,
    title: isPt ? 'Torneio' : 'Tournament',
    desc: isPt ? 'PvP assíncrono contra outros jogadores. Rodada toda semana.' : 'Asynchronous PvP against other players. A round every week.',
    pts: isPt ? '5 partidas/dia' : '5 matches/day',
    onClick: onOpenTournament,
  };

  const cards: { key: 'dungeon' | 'dino' | 'rps'; icon: string; title: string; desc: string; pts: string; onClick: () => void }[] = [
    {
      key: 'dungeon', icon: iconSwords,
      title: isPt ? 'Masmorra' : 'Dungeon',
      desc: isPt
        ? '5 andares retrô, cada um com 6 inimigos e mais forte. Perder custa a run, nunca seus corações. Reset semanal.'
        : '5 retro floors, each with 6 tougher enemies. Losing costs you the run, never your hearts. Weekly reset.',
      pts: isPt ? 'Bits por inimigo + ranking' : 'Bits per enemy + ranking',
      onClick: () => setOpenGame('dungeon'),
    },
    {
      key: 'dino', icon: iconDino,
      title: isPt ? 'Corrida do Dino' : 'Dino Runner',
      desc: isPt ? 'Pule os obstáculos e corra o máximo que conseguir.' : 'Jump the obstacles and run as far as you can.',
      pts: isPt ? '1 Bit a cada 100 de score' : '1 Bit per 100 score',
      onClick: () => setOpenGame('dino'),
    },
    {
      key: 'rps', icon: iconScissors,
      title: isPt ? 'Pedra, Papel e Tesoura' : 'Rock, Paper, Scissors',
      desc: isPt ? 'Clássico duelo contra o seu Soulmon. Primeiro a 3 vitórias.' : 'The classic duel against your Soulmon. First to 3.',
      pts: isPt ? '5 Bits por vitória' : '5 Bits per match win',
      onClick: () => setOpenGame('rps'),
    },
  ];

  const renderCard = (c: { key: string; icon: string; title: string; desc: string; pts: string; onClick: () => void }) => (
    <button
      key={c.key}
      onClick={c.onClick}
      className="w-full text-left sm-px-card sm-px-card-tap"
      style={{ padding: 14 }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center shrink-0" style={{ width: 52, height: 52 }}>
          <img src={c.icon} alt="" width={48} height={48} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
        </div>
        {/* P2: a etiqueta ("+5 Bits", "5 partidas/dia") dividia a LINHA do
            título — em PT-BR os nomes longos quebravam em duas linhas por
            causa dela. A etiqueta desce para a linha da descrição, que é
            onde mora o resto do metadado; o título passa a ter a largura
            inteira, e `minWidth: 0` deixa o flex encolher em vez de vazar. */}
        <div className="flex-1" style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: 'var(--sm-ink)' }}>
            {c.title}
          </span>
          <div className="flex items-center gap-2" style={{ marginTop: 3 }}>
            <PixelTag>{c.pts}</PixelTag>
            <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--sm-muted)', minWidth: 0 }}>
              {c.desc}
            </p>
          </div>
        </div>
        {/* P1: a setinha era `ChevronRight` da lucide — traço vetorial de
            2,2px ao lado de sprites pixelados de 48px, e o único line-art que
            sobrava na tela. Virou o caractere `>` da fonte bitmap como
            paliativo, porque o kit não tinha "seta". Agora tem: chevron
            desenhado na grade do kit (18/08/2026), que é a mesma linguagem dos
            sprites ao lado. `aria-hidden` porque o card inteiro já é o botão. */}
        <img
          src={iconChevronRight}
          alt=""
          aria-hidden="true"
          width={14}
          height={14}
          style={{ flexShrink: 0, imageRendering: 'pixelated', opacity: 0.75 }}
        />
      </div>
    </button>
  );

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        {/* Título de página em bitmap (0.95rem, não 1.15: a Silkscreen é
            bem mais larga e "Atividades" quebrava a linha ao lado da cápsula
            de Bits). O PARÁGRAFO abaixo continua sans — é texto de leitura. */}
        <h2 className="sm-px-heading" style={{ fontSize: '0.95rem', color: 'var(--sm-ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={iconGamepad} alt="" width={24} height={24} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
          {isPt ? 'Atividades' : 'Activities'}
        </h2>
        {/* Sem gem: aquele icone e dos Creditos (dinheiro real). O valor
            mantem a fonte de calculadora obrigatoria dos Bits; so o rotulo
            da capsula e bitmap. Ver utils/currencies.ts. */}
        <PixelChip
          label="Bits"
          title={isPt ? 'Bits — moeda dos minijogos (gaste na loja!)' : 'Bits — minigame currency (spend in the shop!)'}
          value={<span style={{ ...bitsStyle, fontSize: '0.85rem' }}>{totalPoints}</span>}
        />
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--sm-muted)' }}>
        {isPt ? 'Minijogos para se divertir e acumular pontos com seu Soulmon.' : 'Minigames to have fun and earn points with your Soulmon.'}
      </p>

      {/* Torneio — separado, acima dos minigames */}
      {renderCard(tournamentCard)}

      <div
        className="sm-px-heading"
        style={{
          fontSize: '0.62rem',
          color: 'var(--sm-muted)',
          paddingTop: 6,
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
