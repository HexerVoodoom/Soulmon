import { useState, useRef, useEffect } from 'react';
import { PixelButton } from './pixel/PixelKit';
import { Icon } from './ui/Icon';
import rpsScene from '../assets/soulmon/bg/minigame-rps.png';
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
        {/* CHROME: cabecalho, sair e a linha de resultado sao interface. As
            PECAS do jogo (os tres emojis de mao) e o sprite do pet sao a cena
            e ficam como estao. */}
        <Icon name="casino" size={20} />
        <span className="sm-px-arcade-value" style={{ flex: 1, minWidth: 0 }}>
          {isPt ? 'Pedra · Papel · Tesoura' : 'Rock · Paper · Scissors'}
        </span>
        <button onClick={onExit} aria-label={isPt ? 'Sair' : 'Exit'} className="sm-px-arcade-close">
          <Icon name="close" size={20} />
        </button>
      </div>

      {/* Placar */}
      <p className="sm-px-arcade-value" style={{ textAlign: 'center', fontSize: '1rem' }}>
        {isPt ? 'Você' : 'You'} {playerWins} × {petWins} Soulmon
        <span className="sm-px-arcade-label" style={{ display: 'block' }}>{isPt ? 'primeiro a 3' : 'first to 3'}</span>
      </p>

      {/* Arena */}
      {/* A CENA (o cartão da arena) ganha arte; o CHROME em volta continua
          `--sm2-*`, que é a fronteira que esta tela já tinha traçado. O altar
          foi desenhado simétrico e com o centro vazio justamente para o sprite
          e as mãos caírem em cima dele sem disputar leitura. */}
      <div className="sm-px-card" style={{ flex: 1, margin: 16, background: `url(${rpsScene}) center/cover`, boxShadow: 'inset 0 0 60px rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
              {/* Sem `tone`: a tela e escura NOS DOIS temas (`sm-px-dark-ctx`),
                  e um token `--sm2-*-ink` seguiria o tema da PAGINA — o ouro
                  claro (#8A5A2B) sobre #10312f nao passa AA. Herda o
                  #eaf5f2 do contexto, que passa. */}
              <Icon name="emoji_events" size={20} />
              {isPt ? `Você venceu! +${MATCH_POINTS} Bits` : `You won! +${MATCH_POINTS} Bits`}
            </>
          ) : matchOver === 'lost' ? (
            <>
              <Icon name="pets" size={20} />
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
