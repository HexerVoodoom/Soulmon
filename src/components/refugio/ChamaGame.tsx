import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { MiniGameBaseProps } from '../mente/types';
import { sm2Button, sm2Hint } from '../form/FormKit';
import { GameRoot, GameHeader, VisorSprite } from '../games/GameKit';
import { usePrefersReducedMotion } from '../ui/Viewport';
import { BitsAmount } from '../ui/BitsAmount';
import { getSpriteForStage } from '../../utils/sprites';
import { entrarNaSuperficie } from '../../utils/musica';
import { readLocal, writeLocal } from '../../utils/safeStorage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { tocarSinoChama } from '../../utils/refugio/sinoChama';
import {
  CHAMA_DURACOES_MIN, CHAMA_DURACAO_PADRAO, CHAMA_BITS, faseEm, sessaoMs, chamaVisivel, premioDevido, diaLocal, textoFase,
} from '../../utils/refugio/chama';

/**
 * CHAMA (trataka) — exercício de concentração em tela cheia (pesquisa
 * 2026-11-04, Parte B). Bosque noturno do mundo Soulmon, uma chama pequena no
 * centro, oscilação LENTA (~0,4 Hz, nada piscando: WCAG 2.3.1).
 *
 * Arte opcional: `src/assets/soulmon/chama/fundo.webp`; sem ela, fundo procedural.
 * Prêmio: `CHAMA_BITS` fixos por sessão CONCLUÍDA, 1×/dia; sem placar, sem
 * sequência; sair antes não pune, só não paga. Toque duplo = "voltei"
 * (contagem privada, só aparece no fecho como "você voltou N vezes").
 */
const ARTE = import.meta.glob('../../assets/soulmon/chama/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const FUNDO = Object.entries(ARTE).find(([k]) => k.endsWith('/fundo.webp'))?.[1];

type Tela = 'aviso' | 'setup' | 'run' | 'done';
const TICK_MS = 250;

const CSS = `
@keyframes sm-chama-osc { 0%,100% { transform: scale(1,1) skewX(0deg) } 30% { transform: scale(.97,1.04) skewX(1.5deg) } 65% { transform: scale(1.02,.97) skewX(-1.5deg) } }
@keyframes sm-chama-halo { 0%,100% { opacity: .55 } 50% { opacity: .7 } }
`;

/** A chama procedural: núcleo âmbar, coroa turquesa-cristal; sem branco puro, ~10% da tela. */
export function ChamaViva({ reduced, visivel }: { reduced: boolean; visivel: boolean }) {
  return (
    <div data-chama-viva data-reduced={reduced ? '' : undefined} aria-hidden="true" style={{
      position: 'relative', width: 72, height: 120, opacity: visivel ? 1 : 0, transition: 'opacity 2.5s ease',
    }}>
      <div style={{
        position: 'absolute', left: '50%', top: '55%', width: 220, height: 220, marginLeft: -110, marginTop: -110, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,170,80,0.22) 0%, rgba(80,220,210,0.08) 45%, rgba(0,0,0,0) 70%)',
        animation: reduced ? undefined : 'sm-chama-halo 5s ease-in-out infinite',
      }} />
      <svg viewBox="0 0 60 100" width="100%" height="100%" style={{
        position: 'relative', transformOrigin: '50% 95%',
        animation: reduced ? undefined : 'sm-chama-osc 2.6s ease-in-out infinite',
      }}>
        <defs>
          <radialGradient id="sm-chama-fora" cx="50%" cy="70%" r="60%">
            <stop offset="0" stopColor="#ffd38a" />
            <stop offset="0.55" stopColor="#ff9a3c" stopOpacity="0.9" />
            <stop offset="1" stopColor="#3fd8c8" stopOpacity="0.35" />
          </radialGradient>
          <radialGradient id="sm-chama-dentro" cx="50%" cy="75%" r="50%">
            <stop offset="0" stopColor="#fff1cf" />
            <stop offset="1" stopColor="#ffc46b" stopOpacity="0.8" />
          </radialGradient>
        </defs>
        <path d="M30 4 C40 26 54 40 54 62 C54 82 43 96 30 96 C17 96 6 82 6 62 C6 40 20 26 30 4 Z" fill="url(#sm-chama-fora)" />
        <path d="M30 40 C35 52 42 60 42 72 C42 84 36 92 30 92 C24 92 18 84 18 72 C18 60 25 52 30 40 Z" fill="url(#sm-chama-dentro)" />
      </svg>
      {/* pavio-cristal turquesa */}
      <div style={{ position: 'absolute', left: '50%', bottom: -14, width: 14, height: 18, marginLeft: -7, background: 'linear-gradient(180deg,#7ff3e6,#1b8f8a)', clipPath: 'polygon(50% 0, 100% 40%, 75% 100%, 25% 100%, 0 40%)', opacity: 0.85 }} />
    </div>
  );
}

function FundoBosque() {
  if (FUNDO) return <div data-chama-fundo-arte aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `url(${FUNDO})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.55)' }} />;
  return (
    <div data-chama-fundo aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%, #0f2a2c 0%, #071318 55%, #03080b 100%)' }}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <g fill="#020608" opacity="0.9">
          <path d="M0 300 L0 120 L18 60 L34 125 L50 80 L66 140 L70 300 Z" />
          <path d="M330 300 L334 130 L352 70 L368 135 L384 90 L400 150 L400 300 Z" />
          <path d="M0 300 C80 270 140 285 200 278 C260 272 320 285 400 270 L400 300 Z" />
        </g>
        {/* cristais turquesa discretos no chão */}
        <g fill="#3fd8c8" opacity="0.18">
          <path d="M96 286 l6 -16 l6 16 Z" /><path d="M290 284 l5 -12 l5 12 Z" /><path d="M150 292 l4 -9 l4 9 Z" />
        </g>
      </svg>
    </div>
  );
}

export function ChamaGame({ language, evolutionStage, demoCharacterId, onExit, onEarnPoints, onComplete, agora = () => Date.now() }: MiniGameBaseProps & {
  /** Bits fixos da sessão concluída (funil único do App). */
  onEarnPoints?: (pts: number) => void;
  /** Concluiu (devolve a energia do Refúgio, 1×/dia pelo dono). */
  onComplete?: () => void;
  /** Relógio injetável (testes). */
  agora?: () => number;
}) {
  const isPt = language === 'pt-BR';
  const reduced = usePrefersReducedMotion();
  useEffect(() => entrarNaSuperficie('chama'), []);
  const [tela, setTela] = useState<Tela>(() => (readLocal(STORAGE_KEYS.CHAMA_AVISO) === '1' ? 'setup' : 'aviso'));
  const [minutos, setMinutos] = useState(CHAMA_DURACAO_PADRAO);
  const [olhosFechados, setOlhosFechados] = useState(false);
  const [decorrido, setDecorrido] = useState(0);
  const [voltas, setVoltas] = useState(0);
  const [pago, setPago] = useState(0);
  const [concluiu, setConcluiu] = useState(false);
  const [uiVisivel, setUiVisivel] = useState(true);
  const inicio = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const faseAnterior = useRef(-1);
  const wake = useRef<{ release: () => Promise<void> } | null>(null);
  const ultimoToque = useRef(0);
  const esconder = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pararTudo = () => {
    if (timer.current !== null) { clearInterval(timer.current); timer.current = null; }
    if (esconder.current !== null) { clearTimeout(esconder.current); esconder.current = null; }
    try { void wake.current?.release(); } catch { /* ok */ }
    wake.current = null;
  };
  useEffect(() => pararTudo, []);

  const mostrarUi = () => {
    setUiVisivel(true);
    if (esconder.current !== null) clearTimeout(esconder.current);
    esconder.current = setTimeout(() => setUiVisivel(false), 3000);
  };

  const concluir = () => {
    pararTudo();
    setConcluiu(true);
    const hoje = diaLocal(agora());
    const bits = premioDevido(true, readLocal(STORAGE_KEYS.CHAMA_PAGO), hoje);
    if (bits > 0) { writeLocal(STORAGE_KEYS.CHAMA_PAGO, hoje, { silent: true }); onEarnPoints?.(bits); }
    setPago(bits);
    onComplete?.();
    setTela('done');
  };

  const comecar = () => {
    pararTudo();
    inicio.current = agora();
    faseAnterior.current = 0;
    setDecorrido(0);
    setVoltas(0);
    setPago(0);
    setConcluiu(false);
    setTela('run');
    mostrarUi();
    try {
      const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock;
      wl?.request('screen').then(s => { wake.current = s; }).catch(() => { /* sem wake lock */ });
    } catch { /* sem wake lock */ }
    const total = sessaoMs(minutos);
    timer.current = setInterval(() => {
      const e = agora() - inicio.current;
      if (e >= total) { tocarSinoChama(); concluir(); return; }
      const m = faseEm(minutos, e);
      if (m.indice !== faseAnterior.current) { faseAnterior.current = m.indice; tocarSinoChama(); }
      setDecorrido(e);
    }, TICK_MS);
  };

  const sairNoMeio = () => { pararTudo(); setTela('done'); };

  const onToque = () => {
    const t = agora();
    if (t - ultimoToque.current < 400) { setVoltas(v => v + 1); ultimoToque.current = 0; }
    else ultimoToque.current = t;
    mostrarUi();
  };

  const sprite = getSpriteForStage(evolutionStage, demoCharacterId);
  const title = isPt ? 'Chama' : 'Flame';
  const closeLabel = isPt ? 'Sair' : 'Exit';
  const tinta: CSSProperties = { color: '#dff7f3' };
  const chip = (on: boolean): CSSProperties => ({
    flex: 1, minWidth: 0, minHeight: 44, borderRadius: 12, cursor: 'pointer',
    border: `1px solid ${on ? '#3fd8c8' : 'rgba(223,247,243,0.3)'}`, background: on ? 'rgba(63,216,200,0.16)' : 'rgba(255,255,255,0.04)',
    color: '#dff7f3', fontSize: 'var(--sm2-text-sm)', fontWeight: 500,
  });

  if (tela === 'aviso') {
    return (
      <GameRoot style={{ background: '#03080b' }}>
        <style>{CSS}</style>
        <FundoBosque />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center', ...tinta }}>
          <p data-chama-aviso role="note" style={{ margin: 0, fontSize: 'var(--sm2-text-lg)', lineHeight: 1.45, textAlign: 'center' }}>
            {isPt
              ? 'Pisque à vontade. Se tiver sensibilidade à luz, epilepsia ou problema nos olhos, use o modo olhos fechados.'
              : 'Blink freely. If you have light sensitivity, epilepsy or an eye condition, use eyes-closed mode.'}
          </p>
          <button type="button" data-chama-aviso-ok onClick={() => { writeLocal(STORAGE_KEYS.CHAMA_AVISO, '1', { silent: true }); setTela('setup'); }} style={sm2Button('primary')}>
            {isPt ? 'Entendi' : 'Got it'}
          </button>
          <button type="button" data-chama-aviso-fechados onClick={() => { writeLocal(STORAGE_KEYS.CHAMA_AVISO, '1', { silent: true }); setOlhosFechados(true); setTela('setup'); }} style={{ ...sm2Button('outline'), color: '#dff7f3' }}>
            {isPt ? 'Usar olhos fechados' : 'Use eyes-closed mode'}
          </button>
        </div>
      </GameRoot>
    );
  }

  if (tela === 'setup') {
    return (
      <GameRoot style={{ background: '#03080b' }}>
        <style>{CSS}</style>
        <FundoBosque />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 14, flex: 1, ...tinta }}>
          <GameHeader title={title} closeLabel={closeLabel} onClose={onExit} language={language}
            infoLabel={isPt ? 'Como funciona a Chama' : 'How Flame works'}
            info={isPt
              ? 'Olhe a chama por um minuto, feche os olhos e guarde a imagem por dentro. Repete algumas vezes e termina com as mãos nos olhos. Um sino suave avisa cada troca.'
              : 'Gaze at the flame for a minute, close your eyes and hold the image inside. It repeats a few times and ends with your palms over your eyes. A soft bell marks each change.'} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChamaViva reduced={reduced} visivel={!olhosFechados} />
          </div>
          <div role="group" aria-label={isPt ? 'Duração' : 'Duration'} style={{ display: 'flex', gap: 8 }}>
            {CHAMA_DURACOES_MIN.map(m => (
              <button key={m} type="button" data-chama-min={m} aria-pressed={m === minutos} onClick={() => setMinutos(m)} style={chip(m === minutos)}>{m} min</button>
            ))}
          </div>
          <button type="button" data-chama-olhos-fechados aria-pressed={olhosFechados} onClick={() => setOlhosFechados(v => !v)} style={{ ...chip(olhosFechados), flex: 'none' }}>
            {isPt ? 'Modo olhos fechados' : 'Eyes-closed mode'}
          </button>
          <button type="button" data-chama-start onClick={comecar} style={sm2Button('primary')}>{isPt ? 'Começar' : 'Start'}</button>
          <p style={{ ...sm2Hint, ...tinta, textAlign: 'center', margin: 0 }}>
            {isPt ? 'Concluir a primeira sessão do dia rende ' : 'Finishing your first session of the day gives '}
            <BitsAmount value={CHAMA_BITS} size={12} />
            {isPt ? '. Sair antes não tira nada.' : '. Leaving early costs nothing.'}
          </p>
        </div>
      </GameRoot>
    );
  }

  if (tela === 'done') {
    return (
      <GameRoot style={{ background: '#03080b' }}>
        <style>{CSS}</style>
        <FundoBosque />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 14, flex: 1, justifyContent: 'center', alignItems: 'center', textAlign: 'center', ...tinta }}>
          <VisorSprite src={sprite} size={64} idle={false} data-visor-pet style={{ position: 'relative', left: 'auto', top: 'auto', opacity: 0.9 }} />
          <p role="status" data-chama-done style={{ margin: 0, fontSize: 'var(--sm2-text-lg)' }}>
            {concluiu ? textoFase('fim', isPt, olhosFechados) : (isPt ? 'Tudo bem. A chama espera por você.' : 'All good. The flame will wait for you.')}
          </p>
          {voltas > 0 && (
            <p data-chama-voltas style={{ margin: 0 }}>
              {isPt ? `Você voltou ${voltas} ${voltas === 1 ? 'vez' : 'vezes'}. Voltar é o exercício.` : `You came back ${voltas} ${voltas === 1 ? 'time' : 'times'}. Coming back is the practice.`}
            </p>
          )}
          {pago > 0 && <p data-chama-bits style={{ margin: 0 }}><BitsAmount value={pago} sign="+" /></p>}
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, color: '#dff7f3' }}>{closeLabel}</button>
            <button type="button" onClick={() => setTela('setup')} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0 }}>{isPt ? 'De novo' : 'Again'}</button>
          </div>
        </div>
      </GameRoot>
    );
  }

  // ---- sessão ----
  const m = faseEm(minutos, decorrido);
  const visivel = chamaVisivel(m.fase, olhosFechados);
  const escuro = !visivel;
  return (
    <GameRoot style={{ background: '#000' }}>
      <style>{CSS}</style>
      <div style={{ position: 'absolute', inset: 0, opacity: escuro ? 0.15 : 1, transition: 'opacity 3s ease' }}><FundoBosque /></div>
      <div data-chama-run data-fase={m.fase} onClick={onToque} style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ...tinta }}>
        <ChamaViva reduced={reduced} visivel={visivel} />
        <p aria-live="polite" data-chama-fase-texto style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)', left: 16, right: 16, margin: 0, textAlign: 'center', fontSize: 'var(--sm2-text-md)', opacity: escuro ? 0.55 : 0.8, lineHeight: 1.4 }}>
          {textoFase(m.fase, isPt, olhosFechados)}
        </p>
      </div>
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 6, opacity: uiVisivel ? 1 : 0, transition: 'opacity 1s ease', pointerEvents: uiVisivel ? 'auto' : 'none' }}>
        <p style={{ ...sm2Hint, ...tinta, margin: 0, textAlign: 'center', opacity: 0.7 }}>
          {isPt ? 'Se a mente fugir, toque 2× na tela e volte.' : 'If your mind wanders, double-tap and come back.'}
        </p>
        <button type="button" data-chama-sair onClick={sairNoMeio} style={{ ...sm2Button('quiet'), color: '#dff7f3' }}>{isPt ? 'Terminar' : 'Finish'}</button>
      </div>
    </GameRoot>
  );
}
