/**
 * O VISOR DA FEIRA (`docs/PLANO-GUILDA.md` §9, WPG-10): o fenômeno da semana, em três
 * estados (aberto, ferido, dissipado) e quatro tipos (`fx-fair-*`).
 *
 * A arte real (`utils/fairArt.ts`, rodada 3) é lida por TIPO × ESTADO
 * (`fair-fenomeno-<tipo>-<estado>`); o SVG na paleta do Visor (petróleo, turquesa, cobre,
 * osso) ficou como FALLBACK para id sem arte. Regras que a arte
 * herda e este desenho já cumpre: **sem rosto, sem olho, sem boca, sem barra de HP, sem
 * número, sem letra** — o fenômeno é tempo da Malha (uma camada que não assentou), nunca
 * um inimigo com gente por trás; e nenhum estado se lê como "quanto EU bati" (o servidor
 * só entrega o booleano `ferido`). Nada de magenta, roxo nem rosa.
 *
 * Movimento reduzido: o FX fica parado (a informação é a mesma).
 */
import { FAIR_ART, fairFenomenoId, fairFxId, fairStateOf, type FairState } from '../../utils/fairArt';
import type { GuildRaid } from '../../utils/community';
import { VISOR_ART } from '../../utils/visorScenes';

const PETROL = '#123232';
const SLAB = '#2A5C5A';
const OUTLINE = '#050E0E';
const TURQ = '#6EFFFB';
const COPPER = '#B87333';
const BONE = '#EFE3C2';

export const FEIRA_VISOR_HEIGHT = 176;

interface Slab { x: number; y: number; w: number; h: number; r: number; solta?: boolean }

/** ~7 lajes finas empilhadas e deslocadas, como camadas que não assentaram. */
const OFFS = [0, 4, -3, 5, -4, 3, -2];
const WIDTHS = [52, 46, 54, 44, 50, 42, 36];
const ROTS = [-2, 2, -3, 3, -2, 2, -1];

function slabsFor(state: FairState): Slab[] {
  if (state === 'dissipado') {
    // Tudo se soltou e assentou baixo, pequeno: calmo, nunca ruína.
    const xs = [26, 52, 78, 104, 130, 62, 116];
    const ys = [66, 70, 64, 70, 66, 56, 54];
    return xs.map((x, i) => ({ x, y: ys[i], w: 16 + (i % 3) * 3, h: 4, r: ROTS[i] }));
  }
  const gap = state === 'ferido' ? 12 : 9;
  return WIDTHS.map((w, i) => {
    let x = 80 - w / 2 + OFFS[i];
    let y = 68 - i * gap;
    // Ferido: três lajes soltas, à deriva, e as fendas mais largas.
    const solta = state === 'ferido' && (i === 2 || i === 4 || i === 5);
    if (solta) { x += i === 4 ? -26 : 24; y -= 4; }
    return { x, y, w, h: 6, r: ROTS[i], solta };
  });
}

function Fx({ phenomenon }: { phenomenon: GuildRaid['phenomenon'] }) {
  const common = { className: 'sm2-fair-fx', 'data-fair-fx': phenomenon } as const;
  if (phenomenon === 'nevoa') {
    return (
      <g {...common}>
        {[[6, 22, 70], [70, 40, 84], [20, 58, 96]].map(([x, y, w], i) => (
          <rect key={i} x={x} y={y} width={w} height={6} fill={BONE} opacity={0.22} />
        ))}
      </g>
    );
  }
  if (phenomenon === 'mare') {
    return (
      <g {...common} fill="none" stroke={TURQ} strokeWidth={2}>
        <polyline points="0,74 12,70 24,74 36,70 48,74 60,70 72,74 84,70 96,74 108,70 120,74 132,70 144,74 160,70" />
        <polyline points="0,82 12,78 24,82 36,78 48,82 60,78 72,82 84,78 96,82 108,78 120,82 132,78 144,82 160,78" />
      </g>
    );
  }
  if (phenomenon === 'estatica') {
    return (
      <g {...common} stroke={TURQ} strokeWidth={2}>
        {[[10, 20, 18], [118, 30, 24], [30, 46, 14], [104, 58, 20], [12, 70, 22], [128, 76, 16]].map(([x, y, w], i) => (
          <line key={i} x1={x} y1={y} x2={x + w} y2={y} />
        ))}
      </g>
    );
  }
  return (
    <g {...common} fill={TURQ}>
      {[[14, 18], [36, 44], [22, 68], [128, 22], [144, 50], [120, 70], [96, 14], [60, 12], [44, 78], [138, 80]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={3} height={3} />
      ))}
    </g>
  );
}

export function FeiraVisor({ raid, label, reducedMotion }: { raid: GuildRaid; label: string; reducedMotion: boolean }) {
  const state = fairStateOf(raid);
  const real = FAIR_ART[fairFenomenoId(raid.phenomenon, state)];
  const fxReal = FAIR_ART[fairFxId(raid.phenomenon)];
  const slabs = slabsFor(state);
  const fenda = state === 'ferido' ? 5 : 3; // a luz entre as lajes: mais larga quando a roda já o abalou
  return (
    <span
      className="sm2-viewport-screen sm2-visor sm2-grove-screen"
      data-fair-visor
      data-state={state}
      data-phenomenon={raid.phenomenon}
      data-reduced-motion={reducedMotion ? 'true' : undefined}
      role="img"
      aria-label={label}
      // Fundo pintado `visor-feira` (leva `visores`, 01/10/2026; 696×352 = 2× o visor, então desce a 0,5× exato);
      // o degradê antigo é a reserva do que a imagem não cobrir.
      style={{ height: FEIRA_VISOR_HEIGHT, background: `url(${VISOR_ART.visorFeira}) center bottom/auto 100% no-repeat, linear-gradient(180deg, #030B0B 0%, #0A1E1E 100%)`, backgroundColor: PETROL, imageRendering: 'pixelated' }}
    >
      {real ? (
        <img src={real} alt="" draggable={false} data-fair-fenomeno={`${raid.phenomenon}-${state}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
      ) : (
        <svg viewBox="0 0 160 88" preserveAspectRatio="xMidYMax meet" width="100%" height="100%" shapeRendering="crispEdges" aria-hidden="true" focusable="false" style={{ position: 'absolute', inset: 0 }}>
          {/* O chão do visor: uma linha, nada mais. */}
          <rect x={0} y={82} width={160} height={6} fill={OUTLINE} />
          {slabs.map((s, i) => (
            <g key={i} transform={`rotate(${s.r} ${s.x + s.w / 2} ${s.y + s.h / 2})`} data-fair-slab>
              {/* a fenda de luz turquesa fica ABAIXO de cada laje (nada no dissipado: tudo assentou) */}
              {state !== 'dissipado' && !s.solta && i > 0 && <rect x={s.x + 3} y={s.y + s.h} width={s.w - 6} height={fenda} fill={TURQ} />}
              <rect x={s.x} y={s.y} width={s.w} height={s.h} fill={SLAB} stroke={OUTLINE} strokeWidth={1.5} />
              {i === 3 && state !== 'dissipado' && <rect x={s.x + s.w - 8} y={s.y + 1} width={5} height={s.h - 2} fill={COPPER} />}
            </g>
          ))}
          {!fxReal && <Fx phenomenon={raid.phenomenon} />}
        </svg>
      )}
      {/* O FX real é um MOTIVO 128² (crista, faixa de névoa, faísca, espiral), não um véu:
          desenhado a 0,5× nos dois cantos de cima (o da direita espelhado), para nunca
          cobrir o fenômeno. Em `cover` ele virava blocos de 3–4 px por cima de tudo. */}
      {fxReal && (
        <span className="sm2-fair-fx" data-fair-fx={raid.phenomenon} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <img src={fxReal} alt="" draggable={false} width={64} height={64} style={{ position: 'absolute', left: 10, top: 8, imageRendering: 'pixelated' }} />
          <img src={fxReal} alt="" draggable={false} width={64} height={64} style={{ position: 'absolute', right: 10, top: 8, transform: 'scaleX(-1)', imageRendering: 'pixelated' }} />
        </span>
      )}
      <span className="sm2-viewport-glass" />
    </span>
  );
}
