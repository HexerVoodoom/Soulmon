/**
 * O VISOR DA CASA (guilda-lancamento PR2) — a árvore mecânica com o cristal no centro, que cresce com o
 * que a roda faz junto: ganha ramos, folhas de latão, flores e cristais. As criaturas da roda (até
 * quatro, a sua primeiro) ficam na linha do chão; cada item posto pelos membros aparece num pedestal.
 *
 * "O Visor": o desenho vive DENTRO do vidro (`.sm2-viewport-screen`), em SVG de arestas retas, na paleta
 * do aparelho (petróleo, turquesa, cobre, osso) — nada de magenta, roxo nem rosa. O fundo é o cenário
 * do Bosque (`bg-guild-<estágio>`); a casa é uma camada por cima, decidida por `nivelIndex` (0..5), sem
 * ler pontos nenhum (o cliente não os tem). Flores e cristais saem de posições FIXAS por índice:
 * a mesma casa desenha igual em qualquer aparelho. Movimento reduzido: o brilho do cristal fica parado.
 */
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { sceneCss } from '../../utils/backgroundPortrait';
import { GROUND_Y } from '../../utils/petStage';
import { spriteForMember } from '../../utils/groveStage';
import { DECOR_ART } from '../../utils/decorArt';
import type { GuildView } from '../../utils/community';

export const CASA_VISOR_HEIGHT = 176;
const W = 320;
const H = CASA_VISOR_HEIGHT;
const GROUND = Math.round((H * GROUND_Y) / 100);

const PETROL = '#123232';
const SLAB = '#2A5C5A';
const OUTLINE = '#050E0E';
const TURQ = '#6EFFFB';
const COPPER = '#B87333';
const BONE = '#EFE3C2';
const BRASS = '#C9A34A';

// Tabelas por nível (0 = Fagulha … 5 = Aurora).
const TRUNK_H = [8, 30, 44, 52, 56, 60];
const BRANCHES = [0, 1, 2, 3, 3, 4];
const LEAVES = [0, 0, 6, 8, 8, 10];
const FLOWERS = [0, 0, 0, 5, 8, 10];
const CRYSTALS = [0, 0, 0, 0, 5, 9];
const CORE = [7, 9, 11, 13, 17, 21];

/** Posições fixas em volta da copa: [dx, dy] relativos ao topo do tronco. */
const CROWN: ReadonlyArray<readonly [number, number]> = [
  [-34, 6], [34, 4], [-20, -16], [22, -18], [0, -26], [-44, -8], [46, -10], [-8, 14], [12, 16], [0, -6],
];
const GROUND_SPOTS: ReadonlyArray<number> = [58, 262, 92, 232, 40, 282, 120, 204, 20];

interface CasaVisorProps {
  guild: Pick<GuildView, 'size' | 'members' | 'bosque' | 'casa'>;
  mySprite: string;
  reducedMotion: boolean;
  label?: string;
}

export function CasaVisor({ guild, mySprite, reducedMotion, label }: CasaVisorProps) {
  const lvl = Math.min(5, Math.max(0, guild.casa?.nivelIndex ?? 0));
  const bgId = `bg-guild-${guild.bosque.stage ?? 'clareira'}`;
  const bg = PET_BACKGROUNDS[bgId];
  const cx = W / 2;
  const topY = GROUND - TRUNK_H[lvl];
  // Até quatro criaturas: a sua primeiro, depois os outros por ordem de chegada.
  const outros = guild.members.filter(m => !m.euMesmo).slice(0, 3);
  const bichos = [{ key: 'own', own: true, sprite: mySprite }, ...outros.map(m => ({ key: m.id ?? m.name ?? 'm', own: false, sprite: spriteForMember(m.id ?? m.name ?? 'm') }))];
  const posicoes = bichos.length === 4 ? [12, 28, 72, 88] : bichos.length === 3 ? [14, 30, 86] : bichos.length === 2 ? [20, 80] : [22];
  const slots = guild.casa?.slots ?? [];

  return (
    <span
      className="sm2-viewport-screen sm2-visor sm2-casa-screen"
      data-casa-visor
      data-level={lvl}
      data-reduced-motion={reducedMotion ? 'true' : undefined}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ height: H, background: bg && `${sceneCss(bgId)} center bottom / auto 100% no-repeat`, backgroundColor: bg?.baseColor }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMax meet" shapeRendering="crispEdges" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <g transform={`translate(${cx} ${GROUND}) scale(1.3) translate(${-cx} ${-GROUND})`} data-casa-arvore>
        {/* base: o disco de latão em que a árvore está plantada */}
        <rect x={cx - 26} y={GROUND - 4} width={52} height={6} fill={COPPER} stroke={OUTLINE} strokeWidth={1.5} />
        {/* tronco com dentes de engrenagem */}
        <rect x={cx - 6} y={topY} width={12} height={TRUNK_H[lvl]} fill={SLAB} stroke={OUTLINE} strokeWidth={1.5} data-casa-tronco />
        {lvl >= 1 && [0, 1, 2, 3].map(i => (
          <rect key={i} x={cx - 9} y={topY + 6 + i * 11} width={4} height={4} fill={COPPER} stroke={OUTLINE} strokeWidth={1} />
        ))}
        {/* ramos */}
        {Array.from({ length: BRANCHES[lvl] }, (_, i) => {
          const dir = i % 2 === 0 ? -1 : 1;
          const by = topY + 10 + Math.floor(i / 2) * 12;
          return <rect key={i} x={dir < 0 ? cx - 6 - 24 : cx + 6} y={by} width={24} height={4} fill={SLAB} stroke={OUTLINE} strokeWidth={1} data-casa-ramo />;
        })}
        {/* folhas de latão */}
        {CROWN.slice(0, LEAVES[lvl]).map(([dx, dy], i) => (
          <rect key={i} x={cx + dx - 5} y={topY + dy - 4} width={10} height={8} fill={BRASS} stroke={OUTLINE} strokeWidth={1.2} data-casa-folha />
        ))}
        {/* flores: osso com miolo de cobre, nas pontas */}
        {CROWN.slice(0, FLOWERS[lvl]).map(([dx, dy], i) => (
          <g key={i} data-casa-flor>
            <rect x={cx + dx - 3} y={topY + dy - 14} width={6} height={6} fill={BONE} stroke={OUTLINE} strokeWidth={1} />
            <rect x={cx + dx - 1} y={topY + dy - 12} width={2} height={2} fill={COPPER} />
          </g>
        ))}
        {/* cristais de chão */}
        {GROUND_SPOTS.slice(0, CRYSTALS[lvl]).map((x, i) => {
          const h = 8 + (i % 3) * 5;
          return <polygon key={i} points={`${x},${GROUND} ${x - 4},${GROUND - h * 0.6} ${x},${GROUND - h} ${x + 4},${GROUND - h * 0.6}`} fill={TURQ} fillOpacity={0.85} stroke={OUTLINE} strokeWidth={1} data-casa-cristal />;
        })}
        {/* o cristal no centro da copa */}
        <g className={reducedMotion ? undefined : 'sm2-casa-glow'} data-casa-nucleo>
          <polygon
            points={`${cx},${topY - CORE[lvl] - 4} ${cx + CORE[lvl] * 0.7},${topY - 4} ${cx},${topY + CORE[lvl] * 0.6 - 4} ${cx - CORE[lvl] * 0.7},${topY - 4}`}
            fill={TURQ} stroke={OUTLINE} strokeWidth={1.5}
          />
          <polygon points={`${cx},${topY - CORE[lvl] - 4} ${cx + 2},${topY - 4} ${cx},${topY + CORE[lvl] * 0.6 - 4}`} fill={BONE} fillOpacity={0.55} />
        </g>
        </g>
        {/* pedestais dos itens: um por membro que pôs algo, em ordem de chegada */}
        {slots.map((sl, i) => {
          const n = slots.length;
          const x = n === 1 ? cx + 70 : 30 + (i * (W - 60)) / (n - 1);
          const art = DECOR_ART[sl.item];
          return (
            <g key={sl.memberId} data-casa-slot={sl.euMesmo ? 'own' : 'other'}>
              <rect x={x - 12} y={H - 10} width={24} height={6} fill={PETROL} stroke={OUTLINE} strokeWidth={1.2} />
              {art
                ? <image href={art} x={x - 11} y={H - 34} width={22} height={22} preserveAspectRatio="xMidYMax meet" style={{ imageRendering: 'pixelated' }} />
                : <rect x={x - 5} y={H - 20} width={10} height={10} fill={BONE} stroke={OUTLINE} strokeWidth={1} />}
            </g>
          );
        })}
      </svg>
      {bichos.map((c, i) => {
        const size = c.own ? 72 : 52;
        return (
          <img
            key={c.key}
            src={c.sprite}
            alt=""
            width={size}
            height={size}
            draggable={false}
            data-casa-creature={c.own ? 'own' : 'other'}
            className={reducedMotion ? 'sm2-grove-creature' : 'sm2-grove-creature sm2-grove-bob'}
            style={{
              left: `${posicoes[i]}%`,
              top: `${GROUND_Y}%`,
              width: size, height: size,
              marginTop: -Math.round(size * 0.94),
              marginLeft: -Math.round(size / 2),
              animationDelay: reducedMotion ? undefined : `${(i % 3) * 0.4}s`,
            }}
          />
        );
      })}
      <span className="sm2-viewport-glass" />
    </span>
  );
}
