import { useId } from 'react';
import type { SeloPanel } from '../../utils/mente/selo';

/** O selo arcano do Selo Faltante, em SVG (fica fora de SeloGame para o tutorial importar sem ciclo). Nasce mudo. */
const SHAPE_NAMES = [
  { pt: 'círculo', en: 'circle' }, { pt: 'triângulo', en: 'triangle' }, { pt: 'quadrado', en: 'square' },
  { pt: 'losango', en: 'diamond' }, { pt: 'hexágono', en: 'hexagon' },
];
const FILL_NAMES = [{ pt: 'vazio', en: 'hollow' }, { pt: 'meio cheio', en: 'half filled' }, { pt: 'cheio', en: 'filled' }];

const R_SHAPE = 11;
function shapePath(shape: number): string {
  const poly = (n: number, rot: number) => Array.from({ length: n }, (_, i) => {
    const a = rot + (i * 2 * Math.PI) / n;
    return `${(R_SHAPE * Math.cos(a)).toFixed(2)},${(R_SHAPE * Math.sin(a)).toFixed(2)}`;
  }).join(' L ');
  switch (shape) {
    case 0: return `M ${R_SHAPE},0 A ${R_SHAPE},${R_SHAPE} 0 1,1 ${-R_SHAPE},0 A ${R_SHAPE},${R_SHAPE} 0 1,1 ${R_SHAPE},0 Z`;
    case 1: return `M ${poly(3, -Math.PI / 2)} Z`;
    case 2: return `M ${poly(4, Math.PI / 4)} Z`;
    case 3: return `M ${poly(4, -Math.PI / 2)} Z`;
    default: return `M ${poly(6, 0)} Z`;
  }
}

/** Descrição falada do selo (leitor de tela): o jogo não depende só da forma desenhada. */
export function seloLabel(p: SeloPanel, isPt: boolean): string {
  const s = SHAPE_NAMES[p.shape][isPt ? 'pt' : 'en'];
  const f = FILL_NAMES[p.fill][isPt ? 'pt' : 'en'];
  const marks = [0, 1, 2, 3].filter(b => p.marks & (1 << b)).length;
  return isPt
    ? `${s} ${f}, ${p.count} ${p.count === 1 ? 'ponto' : 'pontos'}, gema na posição ${p.dir + 1}, ${marks} ${marks === 1 ? 'marca' : 'marcas'}`
    : `${f} ${s}, ${p.count} ${p.count === 1 ? 'dot' : 'dots'}, gem at position ${p.dir + 1}, ${marks} ${marks === 1 ? 'mark' : 'marks'}`;
}

/** Um selo: anel, 4 folhas-marca no anel, gema numa das 8 direções, pontos em volta da forma central. */
export function SeloSeal({ panel, size }: { panel: SeloPanel; size: number }) {
  const uid = useId().replace(/:/g, '');
  const clip = `selo-half-${uid}`;
  const ink = 'var(--sm2-ink)';
  const leaf = 'var(--sm2-primary-fill)';
  const gem = 'var(--sm2-gold-fill)';
  const d = shapePath(panel.shape);
  const gemA = (panel.dir * Math.PI) / 4 - Math.PI / 2;
  return (
    <svg viewBox="-34 -34 68 68" width={size} height={size} aria-hidden="true" data-selo-seal style={{ display: 'block', flex: 'none' }}>
      <defs>
        <clipPath id={clip}><rect x={-20} y={0} width={40} height={20} /></clipPath>
      </defs>
      <circle r={27} fill="none" stroke={ink} strokeOpacity={0.55} strokeWidth={1.5} />
      {[0, 1, 2, 3].map(b => {
        if (!(panel.marks & (1 << b))) return null;
        const a = Math.PI / 4 + (b * Math.PI) / 2 - Math.PI / 2;
        const deg = (a * 180) / Math.PI + 90;
        return (
          <path key={b} data-selo-mark={b} d="M 0,-5 C 3,-2 3,2 0,5 C -3,2 -3,-2 0,-5 Z" fill={leaf}
            transform={`translate(${(30 * Math.cos(a)).toFixed(2)},${(30 * Math.sin(a)).toFixed(2)}) rotate(${deg.toFixed(1)})`} />
        );
      })}
      <circle data-selo-gem={panel.dir} cx={(27 * Math.cos(gemA)).toFixed(2)} cy={(27 * Math.sin(gemA)).toFixed(2)} r={4} fill={gem} stroke={ink} strokeWidth={1} />
      {Array.from({ length: panel.count }, (_, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / panel.count;
        return <circle key={i} data-selo-dot cx={(18 * Math.cos(a)).toFixed(2)} cy={(18 * Math.sin(a)).toFixed(2)} r={2.2} fill={ink} />;
      })}
      {panel.fill === 2 && <path d={d} fill={leaf} />}
      {panel.fill === 1 && <path d={d} fill={leaf} clipPath={`url(#${clip})`} />}
      <path d={d} fill="none" stroke={ink} strokeWidth={1.8} strokeLinejoin="round" data-selo-shape={panel.shape} data-selo-fill={panel.fill} />
    </svg>
  );
}

