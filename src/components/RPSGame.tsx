import { useState, useRef, useEffect } from 'react';
import { PixelButton } from './pixel/PixelKit';
import { Icon } from './ui/Icon';
import rpsScene from '../assets/soulmon/bg/minigame-rps.png';
import { getSpriteForStage } from '../utils/sprites';
import { playTaskComplete } from '../utils/sounds';
import type { Language } from '../utils/i18n';

/**
 * Rock-Paper-Scissors vs the pet. First to 3 round-wins takes the match.
 * Scoring: 🪙 +5 Bits on a match victory (luck-based game → flat, modest reward).
 */
type Hand = 0 | 1 | 2; // rock, paper, scissors
import handRock from '../assets/soulmon/icons/games/hand-rock.png';
import handPaper from '../assets/soulmon/icons/games/hand-paper.png';
import handScissors from '../assets/soulmon/icons/games/hand-scissors.png';

/* As tres PECAS do jogo. Eram emoji do SISTEMA (✊ ✋ ✌️) — os controles
   primarios do minijogo desenhados por outra pessoa, com outra grade e outra
   paleta, dentro do visor. Estava contado como divida de arte nomeada no
   comentario abaixo e em `docs/BACKLOG-ARTE-GERAR.md` (A11); agora e arte
   nossa, na paleta do kit.

   O nome NAO some junto com o emoji: emoji carrega nome acessivel embutido
   ("raised fist"), `<img>` nao carrega nada. Cada peca leva o proprio rotulo
   em PT e EN, senao a troca de arte teria custado a leitura por voz dos tres
   unicos botoes desta tela. */
const HANDS = [
  { art: handRock, pt: 'Pedra', en: 'Rock' },
  { art: handPaper, pt: 'Papel', en: 'Paper' },
  { art: handScissors, pt: 'Tesoura', en: 'Scissors' },
] as const;
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
        // C-2 (run `som-01`): empate e nao-evento — nada mudou de estado, e a UI
        // ja escreve "Empate!". Som para nada acontecer e ruido.
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
          // C-6 (run `som-01`): derrota de minijogo nao usa o som da perda
          // estrutural. A tela de fim de partida ja diz que perdeu.
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
        {/* As PECAS do jogo, agora em arte nossa (ver HANDS no topo). */}
        <div style={{ minHeight: 52, lineHeight: 1, display: 'flex', alignItems: 'center' }}>
          {thinking ? <span className="sm-px-arcade-value" style={{ fontSize: 20 }}>. . .</span>
            : petHand !== null ? <img src={HANDS[petHand].art} alt={isPt ? HANDS[petHand].pt : HANDS[petHand].en} width={52} height={52} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} /> : null}
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
        <div style={{ minHeight: 44, lineHeight: 1, display: 'flex', alignItems: 'center' }}>
          {playerHand !== null ? <img src={HANDS[playerHand].art} alt={isPt ? HANDS[playerHand].pt : HANDS[playerHand].en} width={44} height={44} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} /> : null}
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
              <button key={h.en} onClick={() => play(i as Hand)} disabled={thinking}
                className="sm-px-chip-btn" aria-label={isPt ? h.pt : h.en}
                style={{ flex: 1, padding: '10px 0', color: '#f1edfb', display: 'flex', justifyContent: 'center' }}>
                <img src={h.art} alt="" width={40} height={40} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
