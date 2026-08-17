import { useState, useRef, useEffect } from 'react';
import iconRps from '../assets/soulmon/icons/games/icon-game-rps.png';
import iconTrophy from '../assets/soulmon/icons/games/icon-game-tournament.png';
import iconSkull from '../assets/soulmon/icons/icon-skull.png';
import { PixelButton } from './pixel/PixelKit';import iconClose from '../assets/soulmon/icons/icon-close.png';
import { getSpriteForStage } from '../utils/sprites';
import { playTaskComplete, playDegenerate, playFeed } from '../utils/sounds';
import type { Language } from '../utils/i18n';

/**
 * Rock-Paper-Scissors vs the pet. First to 3 round-wins takes the match.
 * Scoring: 🪙 +5 Bits on a match victory (luck-based game → flat, modest reward).
 */
type Hand = 0 | 1 | 2; // rock, paper, scissors
const HANDS = ['✊', '✋', '✌️'];
const MATCH_POINTS = 5;
const WINS_NEEDED = 3;

export function RPSGame({ evolutionStage, demoCharacterId, language, onEarnPoints, onExit }: {
  evolutionStage: string;
  /** Modo demo (utils/monetization.ts): personagem pré-pronto — sobrepõe o sprite do pet. */
  demoCharacterId?: string;
  language: Language;
  onEarnPoints: (pts: number) => void;
  onExit: () => void;
}) {
  const isPt = language === 'pt-BR';
  const [playerWins, setPlayerWins] = useState(0);
  const [petWins, setPetWins] = useState(0);
  const [playerHand, setPlayerHand] = useState<Hand | null>(null);
  const [petHand, setPetHand] = useState<Hand | null>(null);
  const [thinking, setThinking] = useState(false);
  const [roundMsg, setRoundMsg] = useState('');
  const [matchOver, setMatchOver] = useState<'won' | 'lost' | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const play = (hand: Hand) => {
    if (thinking || matchOver) return;
    setPlayerHand(hand);
    setPetHand(null);
    setThinking(true);
    setRoundMsg('');
    timerRef.current = setTimeout(() => {
      const pet = Math.floor(Math.random() * 3) as Hand;
      setPetHand(pet);
      setThinking(false);
      if (pet === hand) {
        playFeed();
        setRoundMsg(isPt ? 'Empate!' : 'Draw!');
        return;
      }
      const playerWon = (hand === 0 && pet === 2) || (hand === 1 && pet === 0) || (hand === 2 && pet === 1);
      if (playerWon) {
        const w = playerWins + 1;
        setPlayerWins(w);
        setRoundMsg(isPt ? 'Você venceu a rodada!' : 'You won the round!');
        if (w >= WINS_NEEDED) {
          playTaskComplete();
          onEarnPoints(MATCH_POINTS);
          setMatchOver('won');
        }
      } else {
        const w = petWins + 1;
        setPetWins(w);
        setRoundMsg(isPt ? 'Seu Soulmon venceu a rodada!' : 'Your Soulmon won the round!');
        if (w >= WINS_NEEDED) {
          playDegenerate();
          setMatchOver('lost');
        }
      }
      try { navigator.vibrate?.(15); } catch { /* noop */ }
    }, 650);
  };

  const restart = () => {
    setPlayerWins(0); setPetWins(0);
    setPlayerHand(null); setPetHand(null);
    setRoundMsg(''); setMatchOver(null);
  };

  return (
    <div className="sm-px-dark-ctx sm-px-arcade-root" style={{ background: 'linear-gradient(180deg, #081a20 0%, #10312f 100%)', color: '#eaf5f2' }}>
      <div className="sm-px-arcade-bar" style={{ margin: '14px 16px 8px', justifyContent: 'space-between' }}>
        <img src={iconRps} alt="" width={22} height={22} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
        <span className="sm-px-arcade-value" style={{ flex: 1, minWidth: 0 }}>
          {isPt ? 'Pedra · Papel · Tesoura' : 'Rock · Paper · Scissors'}
        </span>
        <button onClick={onExit} aria-label={isPt ? 'Sair' : 'Exit'} className="sm-px-arcade-close">
          <img src={iconClose} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
        </button>
      </div>

      {/* Placar */}
      <p className="sm-px-arcade-value" style={{ textAlign: 'center', fontSize: '1rem' }}>
        {isPt ? 'Você' : 'You'} {playerWins} × {petWins} Soulmon
        <span className="sm-px-arcade-label" style={{ display: 'block' }}>{isPt ? 'primeiro a 3' : 'first to 3'}</span>
      </p>

      {/* Arena */}
      <div className="sm-px-card" style={{ flex: 1, margin: 16, backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <img src={getSpriteForStage(evolutionStage, demoCharacterId)} alt="pet"
             style={{ width: 88, height: 88, objectFit: 'contain', imageRendering: 'pixelated', animation: 'dungeon-idle 1.4s ease-in-out infinite' }} />
        {/* Os tres EMOJIS DE MAO sao as PECAS do jogo, nao decoracao: o kit
            nao tem pedra/papel/tesoura e esta rodada nao gera arte. Ficam, e
            estao contados no relatorio como divida de arte nomeada. O que saiu
            foi o emoji ACESSORIO (balao de pensamento, trofeu, caveira) —
            esse sim era decoracao, e tem par no kit. */}
        <div style={{ fontSize: '2.6rem', minHeight: 52, lineHeight: 1 }}>
          {thinking ? <span className="sm-px-arcade-value" style={{ fontSize: 20 }}>. . .</span> : petHand !== null ? HANDS[petHand] : ''}
        </div>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, minHeight: 22, display: 'flex', alignItems: 'center', gap: 6 }}>
          {matchOver === 'won' ? (
            <>
              <img src={iconTrophy} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
              {isPt ? `Você venceu! +${MATCH_POINTS} Bits` : `You won! +${MATCH_POINTS} Bits`}
            </>
          ) : matchOver === 'lost' ? (
            <>
              <img src={iconSkull} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
              {isPt ? 'Seu Soulmon venceu a partida!' : 'Your Soulmon won the match!'}
            </>
          ) : roundMsg}
        </p>
        <div style={{ fontSize: '2.2rem', minHeight: 44, lineHeight: 1 }}>
          {playerHand !== null ? HANDS[playerHand] : ''}
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: '0 16px 16px' }}>
        {matchOver ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ flex: 1 }}>
              <PixelButton size="lg" variant="primary" onClick={restart}>{isPt ? 'Revanche' : 'Rematch'}</PixelButton>
            </span>
            <span style={{ flex: 1 }}>
              <PixelButton size="lg" onClick={onExit}>{isPt ? 'Sair' : 'Exit'}</PixelButton>
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            {HANDS.map((h, i) => (
              <button key={h} onClick={() => play(i as Hand)} disabled={thinking}
                className="sm-px-chip-btn"
                style={{ flex: 1, padding: '16px 0', fontSize: '1.8rem', color: '#f1edfb' }}>
                {h}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
