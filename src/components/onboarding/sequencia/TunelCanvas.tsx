import { useEffect, useRef } from 'react';
import { criarTextura, desenharTunel, TUNEL_H, TUNEL_W } from './tunelRender';

const FRAME_MS = 1000 / 30;

/**
 * Canvas do túnel (cena 2): 320x180 escalado com `image-rendering: pixelated`, 30 fps fixos, pausa com a aba
 * oculta e, com `reduzido`, um único quadro estático (zero movimento). O texto de narração vai em `aria-label`.
 */
export function TunelCanvas({ aria, reduzido }: { aria: string; reduzido: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d') ?? null;
    if (!canvas || !ctx) return; // sem canvas: o fundo escuro do contêiner e a narração seguram a cena
    const img = ctx.createImageData(TUNEL_W, TUNEL_H);
    const buf = new Uint32Array(img.data.buffer);
    const tex = criarTextura();
    const pintar = (t: number) => { desenharTunel(buf, tex, t, !reduzido); ctx.putImageData(img, 0, 0); };
    pintar(0);
    if (reduzido) return;

    let raf = 0;
    let ultimo = 0;
    let t0 = performance.now();
    let pausadoEm = 0;
    const laco = (agora: number) => {
      raf = requestAnimationFrame(laco);
      if (agora - ultimo < FRAME_MS) return;
      ultimo = agora;
      pintar((agora - t0) / 1000);
    };
    const comecar = () => { if (!raf) { if (pausadoEm) { t0 += performance.now() - pausadoEm; pausadoEm = 0; } raf = requestAnimationFrame(laco); } };
    const parar = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; pausadoEm = performance.now(); } };
    const visibilidade = () => { if (document.hidden) parar(); else comecar(); };
    document.addEventListener('visibilitychange', visibilidade);
    if (!document.hidden) comecar();
    return () => { document.removeEventListener('visibilitychange', visibilidade); parar(); };
  }, [reduzido]);

  return (
    <canvas ref={ref} width={TUNEL_W} height={TUNEL_H} role="img" aria-label={aria} data-testid="tunel-canvas"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated', background: '#030c0e' }} />
  );
}
