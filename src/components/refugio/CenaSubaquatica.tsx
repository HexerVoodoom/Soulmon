import type { CSSProperties } from 'react';

/**
 * CENA SUBAQUÁTICA da Respiração (pedido do dono, 04/11/2026) — tela cheia,
 * calma, em camadas: degradê azul-petróleo, raios de luz balançando devagar,
 * bolhas subindo com a respiração, silhuetas de alga/coral com parallax e o
 * GUIA: uma bolha de sabão em volta do pet, que cresce na inspiração e encolhe na expiração.
 *
 * Arte pintada OPCIONAL em `src/assets/soulmon/respiracao/`:
 *   fundo.webp (fundo opaco) · meio.webp (meio, com alfa) · frente.webp (frente, com alfa).
 * Sem o arquivo, a camada procedural correspondente entra no lugar.
 * Movimento reduzido: cena parada; só o guia muda (opacidade + tamanho em degraus).
 */
const ARTE = import.meta.glob('../../assets/soulmon/respiracao/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
function arte(nome: 'fundo' | 'meio' | 'frente'): string | undefined {
  const k = Object.keys(ARTE).find(p => p.endsWith(`/${nome}.webp`));
  return k ? ARTE[k] : undefined;
}

const CSS = `
@keyframes sm-sub-raio { 0%,100% { transform: rotate(-4deg) translateX(-2%); opacity: .55 } 50% { transform: rotate(4deg) translateX(2%); opacity: .85 } }
@keyframes sm-sub-bolha { 0% { transform: translate(0,0); opacity: 0 } 10% { opacity: .7 } 100% { transform: translate(var(--dx), -110vh); opacity: 0 } }
@keyframes sm-sub-alga { 0%,100% { transform: skewX(-3deg) } 50% { transform: skewX(3deg) } }
@keyframes sm-sub-deriva { 0%,100% { transform: translateX(-1.5%) } 50% { transform: translateX(1.5%) } }
`;

const camada: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' };
/** SVG é elemento substituído: `inset: 0` não o estica (a silhueta parava no meio da tela). A folga de 2% cobre a deriva lateral. */
const silhueta: CSSProperties = { ...camada, left: '-2%', right: 'auto', width: '104%', height: '100%' };
const img = (src: string): CSSProperties => ({ ...camada, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' });

/** Bolhas fixas (determinísticas): posição, tamanho, duração e atraso. */
const BOLHAS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 11) % 100, size: 4 + (i * 7) % 10, dur: 14 + (i * 5) % 12, delay: -((i * 3.7) % 20), dx: ((i % 5) - 2) * 12,
}));

export function CenaSubaquatica({ level, reduced, children }: { level: number; reduced: boolean; children?: React.ReactNode }) {
  const fundo = arte('fundo');
  const meio = arte('meio');
  const frente = arte('frente');
  const anim = (a: string): CSSProperties => (reduced ? {} : { animation: a });
  // As bolhas sobem um pouco junto com a inspiração (a camada inteira se ergue), sem reiniciar animação.
  const ergue = -6 * level;
  return (
    <div data-cena-subaquatica data-reduced={reduced ? '' : undefined} aria-hidden="true" style={{ ...camada, overflow: 'hidden', zIndex: 0 }}>
      <style>{CSS}</style>
      {/* Fundo */}
      {fundo
        ? <div data-camada="fundo-arte" style={img(fundo)} />
        : <div data-camada="fundo" style={{ ...camada, background: 'linear-gradient(180deg, #1f6f86 0%, #134e66 35%, #0b3049 70%, #061a2b 100%)' }} />}
      {/* Raios de luz */}
      <div data-camada="raios" style={{ ...camada, transformOrigin: '50% 0%', ...anim('sm-sub-raio 18s ease-in-out infinite') }}>
        {[18, 38, 58, 76].map((x, i) => (
          <div key={x} style={{
            position: 'absolute', top: '-10%', left: `${x}%`, width: `${10 + (i % 2) * 6}%`, height: '90%',
            background: 'linear-gradient(180deg, rgba(200,245,255,0.28), rgba(200,245,255,0))',
            transform: `skewX(${-12 + i * 7}deg)`, filter: 'blur(6px)',
          }} />
        ))}
      </div>
      {/* Meio: silhuetas de alga/coral (procedural) ou arte */}
      {meio
        ? <div data-camada="meio-arte" style={{ ...img(meio), ...anim('sm-sub-deriva 30s ease-in-out infinite') }} />
        : (
          <svg data-camada="meio" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" style={{ ...silhueta, ...anim('sm-sub-deriva 30s ease-in-out infinite') }}>
            <g fill="#0a2a3d" opacity="0.7">
              <path d="M0 300 C40 250 70 270 110 240 C150 215 190 260 240 235 C290 210 330 250 400 225 L400 300 Z" />
              {[30, 95, 170, 260, 340].map((x, i) => (
                <path key={x} style={{ transformOrigin: `${x}px 300px`, ...anim(`sm-sub-alga ${9 + i * 2}s ease-in-out infinite`) }}
                  d={`M${x} 300 C${x - 10} 260 ${x + 12} 230 ${x - 4} ${190 - i * 8} C${x + 8} ${225 - i * 4} ${x + 6} 265 ${x + 8} 300 Z`} />
              ))}
            </g>
          </svg>
        )}
      {/* Bolhas */}
      {!reduced && (
        <div data-camada="bolhas" style={{ ...camada, transform: `translateY(${ergue}%)`, transition: 'transform 100ms linear' }}>
          {BOLHAS.map((b, i) => (
            <span key={i} style={{
              position: 'absolute', bottom: -20, left: `${b.left}%`, width: b.size, height: b.size, borderRadius: '50%',
              border: '1px solid rgba(220,250,255,0.6)', background: 'rgba(220,250,255,0.12)',
              ['--dx' as string]: `${b.dx}px`,
              animation: `sm-sub-bolha ${b.dur}s linear ${b.delay}s infinite`,
            } as CSSProperties} />
          ))}
        </div>
      )}
      {children}
      {/* Frente */}
      {frente
        ? <div data-camada="frente-arte" style={{ ...img(frente), ...anim('sm-sub-deriva 22s ease-in-out infinite reverse') }} />
        : (
          <svg data-camada="frente" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" style={{ ...silhueta, ...anim('sm-sub-deriva 22s ease-in-out infinite reverse') }}>
            <g fill="#03111c" opacity="0.85">
              <path d="M0 300 L0 270 C20 262 30 280 55 268 C70 250 60 230 80 228 C95 240 90 265 120 272 L150 300 Z" />
              <path d="M260 300 C280 280 300 286 320 262 C330 240 352 246 360 262 C372 280 390 276 400 270 L400 300 Z" />
            </g>
          </svg>
        )}
    </div>
  );
}

/**
 * O guia: uma BOLHA de sabão em volta do pet (16/11/2026, pedido do dono; antes era uma água-viva ao lado dele).
 * `level` 0..1 (vazio..cheio): a bolha, com o pet dentro, cresce na inspiração e encolhe na expiração.
 * Movimento reduzido: tamanho fixo; só a opacidade acompanha o nível.
 */
export function BolhaGuia({ level, reduced, size = 240, children }: { level: number; reduced: boolean; size?: number; children?: React.ReactNode }) {
  const s = reduced ? 1 : 0.62 + 0.38 * level;
  const brilho = 0.3 + 0.6 * level;
  return (
    <div data-respiracao-bubble data-bolha-guia aria-hidden="true" style={{
      position: 'relative', width: size, height: size, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transform: `scale(${s})`, transformOrigin: '50% 50%', borderRadius: '50%',
      transition: reduced ? 'opacity 100ms linear' : 'transform 100ms linear', opacity: reduced ? 0.45 + 0.55 * level : 1,
      background: 'radial-gradient(circle at 50% 50%, rgba(210,250,255,0.04) 0%, rgba(160,235,250,0.10) 62%, rgba(150,235,250,0.30) 88%, rgba(235,253,255,0.55) 97%, rgba(235,253,255,0.25) 100%)',
      boxShadow: `inset 0 0 ${14 + 14 * level}px rgba(190,245,255,0.45), 0 0 ${10 + 22 * level}px rgba(150,240,255,${brilho})`,
      border: '1px solid rgba(230,252,255,0.6)',
    }}>
      {/* reflexos da luz: arco no alto à esquerda e pontinho embaixo à direita */}
      <span style={{ position: 'absolute', left: '14%', top: '10%', width: '38%', height: '20%', borderRadius: '50%', transform: 'rotate(-32deg)', background: 'radial-gradient(ellipse at 40% 50%, rgba(255,255,255,0.75), rgba(255,255,255,0) 70%)' }} />
      <span style={{ position: 'absolute', right: '17%', bottom: '14%', width: '9%', height: '6%', borderRadius: '50%', transform: 'rotate(-32deg)', background: 'rgba(255,255,255,0.55)', filter: 'blur(1px)' }} />
      {/* película irisada fina, só nas bordas */}
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'conic-gradient(from 200deg, rgba(255,160,220,0.14), rgba(120,220,255,0.18), rgba(170,255,200,0.14), rgba(255,200,140,0.10), rgba(255,160,220,0.14))', WebkitMask: 'radial-gradient(circle, transparent 74%, #000 92%)', mask: 'radial-gradient(circle, transparent 74%, #000 92%)' }} />
      {children}
    </div>
  );
}
