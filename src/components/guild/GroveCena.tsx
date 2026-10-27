/**
 * A CENA DO BOSQUE NO CLÃ (D-49/D-55/D-56, 19/10/2026) — o Bosque é UM cenário só: o prédio do Hall, o "Enter the Grove" e
 * a ficha do Clã são três portas para o MESMO lugar. Aqui é a janela dele na ficha do Clã: o recorte do panorama pintado
 * (`assets/bosque`) com os membros andando (`GroveWalkers`, os mesmos do panorama). Substitui o antigo visor vetorial da
 * Casa (retângulos de cobre/turquesa e o cristal em losango) e o espaço pixelado: nada de desenho em SVG aqui.
 *
 * Os itens que os membros puseram na casa (um cantinho por pessoa) viram uma fileirinha de arte no canto, sem nome nem número.
 */
import type { ReactNode } from 'react';
import { PANORAMA_SRC } from '../../assets/bosque';
import { DECOR_ART } from '../../utils/decorArt';
import { guildText } from '../../utils/guildCopy';
import type { GuildView } from '../../utils/community';
import type { Language } from '../../utils/i18n';
import { GroveWalkers } from './GroveWalkers';

/** Sprites da janela (escala menor que a do panorama: a janela tem ~1/3 da largura útil). */
export const SPRITE_CENA = { own: 52, other: 40 } as const;

interface GroveCenaProps {
  language: Language;
  guild: Pick<GuildView, 'members' | 'casa'>;
  mySprite: string;
  reducedMotion: boolean;
  /** Desenhado sobre o panorama, sob os membros (ex.: a arvorezinha plantada da estacao). */
  children?: ReactNode;
}

export function GroveCena({ language, guild, mySprite, reducedMotion, children }: GroveCenaProps) {
  const slots = (guild.casa?.slots ?? []).filter(sl => DECOR_ART[sl.item]);
  return (
    <div className="sm2-grove-cena" data-grove-cena role="group" aria-label={guildText(language, 'guild.bosque.cena.aria')}>
      <img src={PANORAMA_SRC} alt="" loading="lazy" decoding="async" draggable={false} className="sm2-grove-cena-img" data-grove-cena-img />
      {children}
      <GroveWalkers language={language} guild={guild} mySprite={mySprite} reducedMotion={reducedMotion} sizes={SPRITE_CENA} baseY={70} faixa={6} />
      {slots.length > 0 && (
        <ul className="sm2-grove-cena-slots" data-grove-cena-slots>
          {slots.map(sl => (
            <li key={sl.memberId} data-casa-slot={sl.euMesmo ? 'own' : 'other'}>
              <img src={DECOR_ART[sl.item]} alt="" width={22} height={22} draggable={false} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
