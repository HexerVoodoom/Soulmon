/**
 * O VISOR DA GUERRA (clã-lancamento PR4) — o esquadrão da roda (até 4) de um lado e, do outro, as
 * silhuetas do esquadrão rival (a mesma quantidade). Os rivais são SÓ silhueta: o servidor nunca manda o
 * estágio, a linha nem o nome de uma pessoa de outra clã (LV-G10), então aqui não há o que desenhar além
 * da forma. Dentro do vidro ("O Visor"), sobre o cenário da arena; movimento reduzido para o balanço.
 */
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { sceneCss } from '../../utils/backgroundPortrait';
import { GROUND_Y } from '../../utils/petStage';
import { spriteForMember } from '../../utils/groveStage';
import type { GuildView } from '../../utils/community';

export const GUERRA_VISOR_HEIGHT = 176;

interface Props {
  guild: Pick<GuildView, 'members'>;
  mySprite: string;
  /** Quantas criaturas do esquadrão rival desenhar (2..4). Sem informação, 4. */
  enemyCount: number;
  reducedMotion: boolean;
  label?: string;
}

export function GuerraVisor({ guild, mySprite, enemyCount, reducedMotion, label }: Props) {
  const bg = PET_BACKGROUNDS['bg-arena-spotlight'];
  const outros = guild.members.filter(m => !m.euMesmo).slice(0, 3);
  const nossos = [{ key: 'own', sprite: mySprite }, ...outros.map(m => ({ key: m.id ?? m.name ?? 'm', sprite: spriteForMember(m.id ?? m.name ?? 'm') }))];
  const n = Math.min(4, Math.max(2, enemyCount));
  const xsNossos = nossos.length === 1 ? [26] : [10, 22, 34, 46].slice(0, nossos.length);
  const xsDeles = [90, 78, 66, 54].slice(0, n);
  const size = 56;
  return (
    <span
      className="sm2-viewport-screen sm2-visor sm2-casa-screen"
      data-guerra-visor
      data-reduced-motion={reducedMotion ? 'true' : undefined}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ height: GUERRA_VISOR_HEIGHT, background: bg && `${sceneCss('bg-arena-spotlight')} center bottom / cover no-repeat`, backgroundColor: bg?.baseColor }}
    >
      {nossos.map((c, i) => (
        <img
          key={c.key} src={c.sprite} alt="" width={size} height={size} draggable={false}
          data-guerra-lado="nosso"
          className={reducedMotion ? 'sm2-grove-creature' : 'sm2-grove-creature sm2-grove-bob'}
          style={{ left: `${xsNossos[i]}%`, top: `${GROUND_Y}%`, width: size, height: size, marginTop: -Math.round(size * 0.94), marginLeft: -Math.round(size / 2), animationDelay: reducedMotion ? undefined : `${(i % 3) * 0.4}s` }}
        />
      ))}
      {xsDeles.map((x, i) => (
        <img
          key={i} src={spriteForMember(`rival-${i}`)} alt="" width={size} height={size} draggable={false}
          data-guerra-lado="rival"
          className="sm2-grove-creature"
          style={{ left: `${x}%`, top: `${GROUND_Y}%`, width: size, height: size, marginTop: -Math.round(size * 0.94), marginLeft: -Math.round(size / 2), transform: 'scaleX(-1)', filter: 'brightness(0) invert(1) opacity(0.5)' }}
        />
      ))}
      <span className="sm2-viewport-glass" />
    </span>
  );
}
