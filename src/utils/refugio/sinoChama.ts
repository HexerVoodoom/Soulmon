/**
 * O sino suave da CHAMA + vibração curta — avisa a troca de fase quando os
 * olhos estão fechados (pesquisa 2026-11-04, Parte B). Pedido explícito do dono:
 * a Chama é o único exercício calmo que soa, e só nas transições.
 * Respeita o mudo global (`isMuted`) e a preferência de vibração (`isVibrateOn`).
 */
import { isMuted } from '../sounds';
import { isVibrateOn } from '../focoTimer';

let ctx: AudioContext | null = null;

export function tocarSinoChama(): void {
  try { if (isVibrateOn()) navigator.vibrate?.(60); } catch { /* sem vibração */ }
  if (isMuted()) return;
  try {
    const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    const t0 = ctx.currentTime;
    // Sino: fundamental + parciais inarmônicos, ataque macio, decaimento longo e baixo volume.
    for (const [f, g] of [[528, 0.07], [1320, 0.025], [2112, 0.012]] as const) {
      const o = ctx.createOscillator();
      const v = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      v.gain.setValueAtTime(0.0001, t0);
      v.gain.exponentialRampToValueAtTime(g, t0 + 0.04);
      v.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2);
      o.connect(v).connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + 3.3);
    }
  } catch { /* sem áudio */ }
}
