/**
 * O VISOR DO BOSQUE (`docs/PLANO-GUILDA.md` §6, WPG-11): o cenário do estágio da
 * roda e as criaturas na linha do chão.
 *
 * "O Visor" (`docs/manual/04-IDENTIDADE-VISUAL.md` §1): o pixel art vive SÓ
 * dentro do vidro (`.sm2-viewport-screen`); estágio, linha e fio ficam no
 * aparelho, fora dele (o painel de `GuildSheet`). O que se desenha aqui é
 * decidido por `utils/groveStage.ts` (puro e testado): 5–12 membros → só a sua
 * criatura; ≤4 → todos, em ordem de chegada, sem estado de presença.
 *
 * O cenário é `bg-guild-<estágio>` de `PET_BACKGROUNDS` — hoje placeholder em
 * gradiente; a arte pintada troca só o `css`. Movimento reduzido: as criaturas
 * ficam paradas (a informação é a mesma — o vidro é o mesmo).
 */
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { GROUND_Y } from '../../utils/petStage';
import { groveCreatures } from '../../utils/groveStage';
import type { GuildView } from '../../utils/community';

export const GROVE_VISOR_HEIGHT = 176;

interface GroveVisorProps {
  guild: Pick<GuildView, 'size' | 'members' | 'bosque'>;
  /** A criatura de quem olha (o App sabe o estágio dela). */
  mySprite: string;
  reducedMotion: boolean;
  /** Nome acessível do vidro, já no idioma (`guild.aria.bosque`); ausente = decorativo. */
  label?: string;
}

export function GroveVisor({ guild, mySprite, reducedMotion, label }: GroveVisorProps) {
  // Sem estágio ainda, o chão é o da Clareira: o cenário nasce antes do nome.
  const bg = PET_BACKGROUNDS[`bg-guild-${guild.bosque.stage ?? 'clareira'}`];
  const criaturas = groveCreatures(guild);
  return (
    <span
      className="sm2-viewport-screen sm2-visor sm2-grove-screen"
      data-guild-visor
      data-stage={guild.bosque.stage ?? ''}
      data-reduced-motion={reducedMotion ? 'true' : undefined}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ height: GROVE_VISOR_HEIGHT, background: bg?.css, backgroundColor: bg?.baseColor }}
    >
      {criaturas.map((c, i) => (
        <img
          key={c.key}
          src={c.own ? mySprite : (c.sprite ?? undefined)}
          alt=""
          width={c.size}
          height={c.size}
          draggable={false}
          data-grove-creature={c.own ? 'own' : 'other'}
          className={reducedMotion ? 'sm2-grove-creature' : 'sm2-grove-creature sm2-grove-bob'}
          style={{
            left: `${c.x}%`,
            top: `${GROUND_Y}%`,
            width: c.size,
            height: c.size,
            // Os pés do sprite caem ~6% acima da borda inferior da caixa; sobe menos para pousar na linha.
            marginTop: -Math.round(c.size * 0.94),
            marginLeft: -Math.round(c.size / 2),
            animationDelay: reducedMotion ? undefined : `${(i % 3) * 0.4}s`,
          }}
        />
      ))}
      <span className="sm2-viewport-glass" />
    </span>
  );
}
