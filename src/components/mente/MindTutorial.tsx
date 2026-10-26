import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { usePrefersReducedMotion } from '../ui/Viewport';
import { getSpriteForStage } from '../../utils/sprites';
import { MINI_FX } from '../../utils/visorScenes';
import type { Language } from '../../utils/i18n';
import { GameRoot, GameHeader } from '../games/GameKit';
import type { MindGameId } from '../../utils/mente/mindTutorials';

/**
 * TUTORIAL DA 1ª ABERTURA dos jogos do Ateliê da Mente (26/10/2026): 4 passos, cada um uma frase + uma mini-demonstração
 * com as pedras/números/retângulos do próprio jogo (CSS puro; movimento reduzido = quadro final parado). Voz do app: descreve o
 * que o jogo pede, sem cobrar nem prometer efeito. Regras conferidas em `EcoGame`/`ZipGame`/`PatchesGame`.
 * Mora no chunk lazy de cada jogo — nada disto entra no JS de entrada. O "visto" NÃO é gravado aqui: o jogo grava AO MOSTRAR.
 */

const PAL = ['var(--sm2-primary-soft)', 'color-mix(in srgb, var(--sm2-gold-fill) 38%, transparent)', 'color-mix(in srgb, var(--sm2-credit-ink) 30%, transparent)', 'var(--sm2-surface-2)'];
const cell: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
  border: '1px solid var(--sm2-muted)', borderRadius: 6, fontFamily: 'var(--sm2-font-text)',
  fontSize: 'var(--sm2-text-sm)', fontWeight: 600, color: 'var(--sm2-ink)', transition: 'background-color 200ms',
};

function Grid({ cols, rows, size = 44, children }: { cols: number; rows: number; size?: number; children: (i: number) => ReactNode }) {
  return (
    <div data-tut-grid style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${size}px)`, gridTemplateRows: `repeat(${rows}, ${size}px)`, gap: 3 }}>
      {Array.from({ length: cols * rows }, (_, i) => children(i))}
    </div>
  );
}

function Stone({ i, on = false, badge }: { i: number; on?: boolean; badge?: number }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', transition: 'transform 150ms, filter 150ms', transform: on ? 'scale(1.15)' : undefined, filter: on ? 'drop-shadow(0 0 8px var(--sm2-primary-fill))' : undefined, opacity: on ? 1 : 0.75 }}>
      <img src={MINI_FX.pedras[i as 0 | 1 | 2 | 3]} alt="" aria-hidden="true" draggable={false} width={44} height={44} style={{ display: 'block' }} />
      {badge !== undefined && <span style={{ ...sm2Hint, position: 'absolute', right: -6, top: -8, fontWeight: 700, color: 'var(--sm2-ink)' }}>{badge}</span>}
    </span>
  );
}

interface Step { pt: string; en: string; art: (t: number, pet: string) => ReactNode }

const Pet = ({ pet }: { pet: string }) => <img src={pet} alt="" aria-hidden="true" draggable={false} width={64} height={64} style={{ display: 'block', imageRendering: 'pixelated' }} />;
const Row = ({ children }: { children: ReactNode }) => <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>{children}</div>;

// Trilha 3×3 em serpentina: 1@0, 2@5, 3@6, 4@8.
const ZIP_PATH = [0, 1, 2, 5, 4, 3, 6, 7, 8];
const ZIP_NUM: Record<number, number> = { 0: 1, 5: 2, 6: 3, 8: 4 };
// Colcha 4×4: retângulos { r, c, h, w, pista }.
const PATCH = [
  { r: 0, c: 0, h: 2, w: 2, n: 4 }, { r: 0, c: 2, h: 4, w: 1, n: 4 },
  { r: 0, c: 3, h: 2, w: 1, n: 2 }, { r: 2, c: 0, h: 2, w: 2, n: 4 }, { r: 2, c: 3, h: 2, w: 1, n: 2 },
];
const inRect = (p: { r: number; c: number; h: number; w: number }, i: number) =>
  Math.floor(i / 4) >= p.r && Math.floor(i / 4) < p.r + p.h && (i % 4) >= p.c && (i % 4) < p.c + p.w;

const SEQ = [0, 2, 1];
const STEPS: Record<MindGameId, Step[]> = {
  eco: [
    { pt: 'Seu Soulmon canta uma sequência de pedras.', en: 'Your Soulmon sings a sequence of stones.', art: (t, pet) => <Row><Pet pet={pet} /><Stone i={SEQ[t % 3]} on /></Row> },
    { pt: 'Repare na ordem em que elas acendem.', en: 'Notice the order they light up in.', art: t => <Row>{[0, 1, 2, 3].map(i => <Stone key={i} i={i} on={SEQ[t % 3] === i} />)}</Row> },
    { pt: 'Sua vez: toque as pedras na mesma ordem.', en: 'Your turn: tap the stones in the same order.', art: t => <Row>{[0, 1, 2, 3].map(i => <Stone key={i} i={i} on={SEQ[t % 3] === i} badge={SEQ.indexOf(i) >= 0 ? SEQ.indexOf(i) + 1 : undefined} />)}</Row> },
    { pt: 'A cada acerto, o eco ganha mais uma pedra.', en: 'With each hit, the echo grows by one stone.', art: t => <Row>{[0, 2, 1, 3].slice(0, 3 + (t % 2)).map((s, k) => <Stone key={k} i={s} on badge={k + 1} />)}</Row> },
  ],
  zip: [
    { pt: 'Ligue os números em ordem, do 1 ao último.', en: 'Connect the numbers in order, from 1 to the last.', art: t => (
      <Grid cols={3} rows={3}>{i => <span key={i} style={{ ...cell, backgroundColor: ZIP_NUM[i] === (t % 4) + 1 ? PAL[0] : PAL[3] }}>{ZIP_NUM[i] ?? ''}</span>}</Grid>
    ) },
    { pt: 'Faça UM caminho contínuo, sem tirar o dedo.', en: 'Draw ONE continuous path, without lifting your finger.', art: t => {
      const n = 1 + (t % ZIP_PATH.length);
      return <Grid cols={3} rows={3}>{i => <span key={i} style={{ ...cell, backgroundColor: ZIP_PATH.indexOf(i) < n ? PAL[0] : PAL[3] }}>{ZIP_NUM[i] ?? ''}</span>}</Grid>;
    } },
    { pt: 'O caminho passa por TODAS as casas, sem cruzar.', en: 'The path covers EVERY cell, without crossing.', art: () => (
      <Grid cols={3} rows={3}>{i => <span key={i} style={{ ...cell, backgroundColor: PAL[0] }}>{ZIP_NUM[i] ?? ''}</span>}</Grid>
    ) },
    { pt: 'Arraste, ou toque numa casa vizinha. Tocar numa casa do caminho volta até ela.', en: 'Drag, or tap a neighbouring cell. Tapping a cell on the path steps back to it.', art: t => {
      const n = 4 + (t % 3);
      return <Grid cols={3} rows={3}>{i => <span key={i} style={{ ...cell, backgroundColor: ZIP_PATH.indexOf(i) < n ? PAL[0] : PAL[3], outline: ZIP_PATH[n - 1] === i ? '2px solid var(--sm2-primary-ink)' : 'none' }}>{ZIP_NUM[i] ?? ''}</span>}</Grid>;
    } },
  ],
  patches: [
    { pt: 'Divida a grade inteira em retângulos.', en: 'Split the whole grid into rectangles.', art: t => {
      const n = 1 + (t % PATCH.length);
      const owner = (i: number) => PATCH.findIndex((p, k) => k < n && inRect(p, i));
      return <Grid cols={4} rows={4} size={40}>{i => <span key={i} style={{ ...cell, backgroundColor: owner(i) >= 0 ? PAL[owner(i) % 3] : PAL[3] }} />}</Grid>;
    } },
    { pt: 'Cada retângulo tem exatamente uma pista.', en: 'Each rectangle holds exactly one clue.', art: () => {
      const owner = (i: number) => PATCH.findIndex(p => inRect(p, i));
      const head = (i: number) => PATCH.findIndex(p => p.r * 4 + p.c === i);
      return <Grid cols={4} rows={4} size={40}>{i => <span key={i} style={{ ...cell, backgroundColor: PAL[owner(i) % 3] }}>{head(i) >= 0 ? PATCH[head(i)].n : ''}</span>}</Grid>;
    } },
    { pt: 'A pista diz a área: quantas casas o retângulo cobre.', en: 'The clue is the area: how many cells the rectangle covers.', art: t => {
      const n = 1 + (t % 4);
      return <Grid cols={4} rows={2} size={40}>{i => <span key={i} style={{ ...cell, backgroundColor: i % 4 < 2 ? PAL[0] : PAL[3], opacity: i % 4 < 2 && ((i % 4) + 2 * Math.floor(i / 4)) >= n ? 0.4 : 1 }}>{i === 0 ? 4 : ''}</span>}</Grid>;
    } },
    { pt: 'Às vezes uma pedra dá a forma: triângulo é alto, losango é largo, quadrado é quadrado.', en: 'Sometimes a stone hints the shape: triangle is tall, diamond is wide, square is square.', art: t => <Row>{[1, 3, 2].map((s, k) => <Stone key={s} i={s} on={t % 3 === k} />)}</Row> },
  ],
};

const TICK_MS = 750;

/** O tutorial: passos com "Próximo", "Pular" e, no último, "Entendi, jogar". `onDone` serve aos dois (o visto já foi gravado ao mostrar). */
export function MindTutorial({ game, language, evolutionStage, demoCharacterId, onDone }: {
  game: MindGameId; language: Language; evolutionStage: string; demoCharacterId?: string; onDone: () => void;
}) {
  const isPt = language === 'pt-BR';
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  const [t, setT] = useState(0);
  const steps = STEPS[game];
  const last = step === steps.length - 1;
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setT(x => x + 1), TICK_MS);
    return () => clearInterval(id);
  }, [reduced, step]);
  const pet = getSpriteForStage(evolutionStage, demoCharacterId);
  const s = steps[step];
  // Movimento reduzido: quadro fixo (o 3º) de cada demonstração.
  const frame = reduced ? 2 : t;
  return (
    <section data-mind-tutorial={game} aria-label={isPt ? 'Como se joga' : 'How to play'} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
      <div role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1} style={{ display: 'flex', gap: 8 }}>
        {steps.map((_, i) => <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', boxSizing: 'border-box', backgroundColor: i === step ? 'var(--sm2-primary-fill)' : 'transparent', border: i === step ? 'none' : '2px solid var(--sm2-muted)' }} />)}
      </div>
      <div data-mind-tutorial-art style={{ minHeight: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', borderRadius: 'var(--sm2-radius-md)', backgroundColor: 'var(--sm2-surface-2)' }}>
        {s.art(frame, pet)}
      </div>
      <p data-mind-tutorial-text style={{ ...sm2Text, margin: 0, textAlign: 'center', maxWidth: 320 }}>{isPt ? s.pt : s.en}</p>
      <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 348 }}>
        {!last && <button type="button" data-mind-tutorial-skip onClick={onDone} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>{isPt ? 'Pular' : 'Skip'}</button>}
        <button type="button" data-mind-tutorial-next onClick={() => (last ? onDone() : setStep(step + 1))} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }}>
          {last ? (isPt ? 'Entendi, jogar' : 'Got it, play') : (isPt ? 'Próximo' : 'Next')}
        </button>
      </div>
    </section>
  );
}

/** Contrato que o `App` injeta nos jogos (ausente = sem tutorial automático, ex.: modo desafio do Calabouço). */
export interface MindTutorialProp { seen: boolean; onShown: () => void }

/**
 * Estado do tutorial de um jogo: abre sozinho na 1ª vez (`seen === false`) e GRAVA AO MOSTRAR (`onShown` uma vez, no mount);
 * `show()` reabre sob demanda (botão "Como se joga") sem gravar nada.
 */
export function useMindTutorial(tutorial: MindTutorialProp | undefined) {
  const [open, setOpen] = useState(() => tutorial?.seen === false);
  const fired = useRef(false);
  useEffect(() => {
    if (open && !fired.current && tutorial?.seen === false) { fired.current = true; tutorial.onShown(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { open, show: () => setOpen(true), hide: () => setOpen(false) };
}

/** Tela do tutorial no lugar da rodada: o header do jogo fica, e o × dele sai do jogo (= pulado, o visto já foi gravado). */
export function MindTutorialScreen({ game, title, language, evolutionStage, demoCharacterId, onExit, onDone }: {
  game: MindGameId; title: string; language: Language; evolutionStage: string; demoCharacterId?: string; onExit: () => void; onDone: () => void;
}) {
  const isPt = language === 'pt-BR';
  return (
    <GameRoot>
      <GameHeader title={title} closeLabel={isPt ? 'Sair' : 'Exit'} onClose={onExit} />
      <MindTutorial game={game} language={language} evolutionStage={evolutionStage} demoCharacterId={demoCharacterId} onDone={onDone} />
    </GameRoot>
  );
}

/** Link dentro do "Como se joga" (o "i"): reabre o tutorial. */
export function MindTutorialLink({ language, onClick }: { language: Language; onClick: () => void }) {
  const isPt = language === 'pt-BR';
  return (
    <button type="button" data-mind-tutorial-open onClick={onClick} style={{ ...sm2Button('outline'), marginTop: 8, minHeight: 44, padding: '0 12px' }}>
      {isPt ? 'Ver o tutorial' : 'Watch the tutorial'}
    </button>
  );
}
