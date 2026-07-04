import { useState, useRef, useEffect } from 'react';
import { getSpriteForStage } from '../utils/sprites';
import { playTaskComplete, playDegenerate, playFeed } from '../utils/sounds';
import { BITS_ICON } from '../utils/currency';
import type { Language } from '../utils/i18n';

/**
 * Rock-Paper-Scissors vs the pet. First to 3 round-wins takes the match.
 * Scoring: 🪙 +5 Bits on a match victory (luck-based game → flat, modest reward).
 */
type Hand = 0 | 1 | 2; // rock, paper, scissors
const HANDS = ['✊', '✋', '✌️'];
const MATCH_POINTS = 5;
const WINS_NEEDED = 3;

export function RPSGame({ evolutionStage, language, onEarnPoints, onExit }: {
  evolutionStage: string;
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
  const mono = { fontFamily: 'monospace' as const };

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
        setRoundMsg(isPt ? 'Seu Digimon venceu a rodada!' : 'Your Digimon won the round!');
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'linear-gradient(180deg, #0b0f17 0%, #1a1426 100%)', display: 'flex', flexDirection: 'column', color: '#e8eefc' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <span style={{ ...mono, fontWeight: 800, fontSize: '0.95rem', letterSpacing: 1 }}>
          ✊ {isPt ? 'PEDRA · PAPEL · TESOURA' : 'ROCK · PAPER · SCISSORS'}
        </span>
        <button onClick={onExit} style={{ ...mono, background: 'rgba(255,255,255,0.08)', border: '1px solid #2c3a52', color: '#e8eefc', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          {isPt ? 'Sair' : 'Exit'}
        </button>
      </div>

      {/* Scoreboard */}
      <p style={{ ...mono, textAlign: 'center', fontSize: '1rem', fontWeight: 800 }}>
        {isPt ? 'Você' : 'You'} {playerWins} × {petWins} Digimon
        <span style={{ color: '#5d729c', fontSize: '0.7rem' }}> ({isPt ? 'melhor de 5' : 'first to 3'})</span>
      </p>

      {/* Arena */}
      <div style={{ flex: 1, margin: 16, borderRadius: 12, border: '1px solid #2c3a52', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <img src={getSpriteForStage(evolutionStage)} alt="pet"
             style={{ width: 88, height: 88, objectFit: 'contain', imageRendering: 'pixelated', animation: 'dungeon-idle 1.4s ease-in-out infinite' }} />
        <div style={{ fontSize: '2.6rem', minHeight: 52, lineHeight: 1 }}>
          {thinking ? '💭' : petHand !== null ? HANDS[petHand] : ''}
        </div>
        <p style={{ ...mono, fontSize: '0.9rem', fontWeight: 700, minHeight: 22 }}>
          {matchOver === 'won' ? (isPt ? `🏆 Você venceu! ${BITS_ICON} +${MATCH_POINTS} Bits` : `🏆 You won! ${BITS_ICON} +${MATCH_POINTS} Bits`)
            : matchOver === 'lost' ? (isPt ? '💀 Seu Digimon venceu a partida!' : '💀 Your Digimon won the match!')
            : roundMsg}
        </p>
        <div style={{ fontSize: '2.2rem', minHeight: 44, lineHeight: 1 }}>
          {playerHand !== null ? HANDS[playerHand] : ''}
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: 16 }}>
        {matchOver ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={restart}
              style={{ ...mono, flex: 1, padding: '12px 0', borderRadius: 8, border: 'none', background: '#4ade80', color: '#0b0f17', fontWeight: 800, cursor: 'pointer' }}>
              {isPt ? 'REVANCHE' : 'REMATCH'}
            </button>
            <button onClick={onExit}
              style={{ ...mono, flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid #2c3a52', background: 'transparent', color: '#e8eefc', fontWeight: 800, cursor: 'pointer' }}>
              {isPt ? 'SAIR' : 'EXIT'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            {HANDS.map((h, i) => (
              <button key={h} onClick={() => play(i as Hand)} disabled={thinking}
                style={{ flex: 1, padding: '14px 0', borderRadius: 10, border: '1px solid #2c3a52', background: thinking ? '#131a26' : '#1c2636', fontSize: '1.7rem', cursor: 'pointer' }}>
                {h}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
