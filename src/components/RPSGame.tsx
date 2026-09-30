import { useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import rpsScene from '../assets/soulmon/bg/minigame-rps.png';
import type { Language } from '../utils/i18n';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { GameRoot, GameHeader, GameVisor, phaseTitle } from './games/GameKit';

/**
 * Rock-Paper-Scissors vs the pet. First to 3 round-wins takes the match.
 * Scoring: 🪙 +5 Bits on a match victory (luck-based game → flat, modest reward).
 *
 * Canvas Jogos (DECISÕES §25, D-J10): o placar em Rubik `tabular-nums`; o
 * VISOR 348×144 com a cena `minigame-rps` em `cover`, as duas mãos 128² a 64
 * frente a frente e "VS" em Silkscreen 14 sobre placa — a única palavra pixel
 * da tela, DENTRO do vidro; as três jogadas como chips de TEXTO 44 (as mãos
 * em PNG só aparecem no vidro); "Rematch"/"Exit" no fim. O sprite do pet
 * saiu da cena: o duelo é entre as mãos (o pet é quem joga do outro lado).
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
export const MATCH_POINTS = 5;
export const WINS_NEEDED = 3;

export function RPSGame({ language, onEarnPoints, onExit }: {
  evolutionStage: string;
  /** Modo demo (utils/monetization.ts). Sem uso visual desde o canvas Jogos
   *  (o pet não aparece na cena do PPT — só as mãos), mantido pela assinatura
   *  comum dos minijogos. */
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
          // C-11 (30/09/2026): vencer a partida não é concluir tarefa (R-CAT) — mudo.
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

  const handStyle = (side: 'left' | 'right'): CSSProperties => ({
    position: 'absolute', top: '50%', marginTop: -32, width: 64, height: 64, maxWidth: 'none',
    imageRendering: 'pixelated', display: 'block',
    ...(side === 'left' ? { left: 56 } : { right: 56, transform: 'scaleX(-1)' }),
  });
  const chip: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    minHeight: 44, padding: '0 16px', borderRadius: 999, boxSizing: 'border-box',
    border: '1px solid var(--sm2-muted)', backgroundColor: 'var(--sm2-surface-2)', color: 'var(--sm2-ink)',
    fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)', fontWeight: 500, lineHeight: 'var(--sm2-leading-body)',
    cursor: 'pointer',
  };
  const chipOff: CSSProperties = { ...chip, border: '1px solid var(--sm2-line)', color: 'var(--sm2-muted)', cursor: 'default' };

  return (
    <GameRoot>
      <GameHeader
        title={isPt ? 'Pedra · Papel · Tesoura' : 'Rock · Paper · Scissors'}
        closeLabel={isPt ? 'Sair' : 'Exit'}
        onClose={onExit}
      />

      {/* Placar em Rubik `tabular-nums` (era Silkscreen — V3). */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <p className="sm2-num" style={phaseTitle}>
          {isPt ? 'Você' : 'You'} {playerWins} × {petWins} Soulmon
        </p>
        <p style={sm2Hint}>{isPt ? 'primeiro a 3' : 'first to 3'}</p>
      </div>

      {/* O VISOR 348×144 (D-J10): as mãos 128² a 64 frente a frente e "VS" em
          Silkscreen 14 sobre placa — a única palavra pixel do canvas, DENTRO
          do vidro. As mãos em PNG só aparecem aqui; as jogadas são chips de
          texto embaixo. */}
      <GameVisor height={72} scene={`url(${rpsScene}) center/cover`}>
        {playerHand !== null && (
          <img src={HANDS[playerHand].art} alt={isPt ? HANDS[playerHand].pt : HANDS[playerHand].en} width={64} height={64} style={handStyle('left')} data-hand-you />
        )}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', padding: '4px 8px',
            fontFamily: 'var(--sm2-font-pixel)', fontSize: 'var(--sm2-text-sm)', lineHeight: 1.2, letterSpacing: 0,
            textTransform: 'uppercase', WebkitFontSmoothing: 'none', color: 'var(--sm2-viewport-ink)',
            backgroundColor: 'color-mix(in srgb, var(--sm2-viewport-bg) 78%, transparent)',
            borderRadius: 'var(--sm2-radius-sm)',
          }}
        >
          {thinking ? '. . .' : 'VS'}
        </span>
        {petHand !== null && !thinking && (
          <img src={HANDS[petHand].art} alt={isPt ? HANDS[petHand].pt : HANDS[petHand].en} width={64} height={64} style={handStyle('right')} data-hand-pet />
        )}
      </GameVisor>

      {/* O resultado da rodada / da partida — `role=status`, mesma tinta nos
          dois desfechos (perder uma rodada não é erro). */}
      <p role="status" style={{ ...sm2Text, margin: 0, textAlign: 'center', minHeight: 20 }}>
        {matchOver === 'won'
          ? (isPt ? `Você venceu! +${MATCH_POINTS} Bits` : `You won! +${MATCH_POINTS} Bits`)
          : matchOver === 'lost'
            ? (isPt ? 'Seu Soulmon venceu a partida!' : 'Your Soulmon won the match!')
            : roundMsg}
      </p>

      {matchOver ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={restart} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }}>
            {isPt ? 'Revanche' : 'Rematch'}
          </button>
          <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
            {isPt ? 'Sair' : 'Exit'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {HANDS.map((h, i) => (
            <button key={h.en} type="button" onClick={() => play(i as Hand)} disabled={thinking} style={thinking ? chipOff : chip}>
              {isPt ? h.pt : h.en}
            </button>
          ))}
        </div>
      )}
    </GameRoot>
  );
}
