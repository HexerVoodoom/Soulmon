import type { CSSProperties } from 'react';
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import type { CrossingArea, Region } from '../../types/travessias';
import { Icon } from '../ui/Icon';

/**
 * O SINAL VISUAL DE UMA TRAVESSIA (02/10/2026, F1 da rodada de ajustes).
 *
 * Só o título não diferenciava as cartas. Cada Travessia agora tem DOIS
 * sinais, os dois com arte que já existe no repo:
 *  · o POSTAL da região dela (os mesmos cenários `PET_BACKGROUNDS` que o
 *    Passeio já mostra nos destinos) — diz ONDE;
 *  · o GLIFO da ÁREA DA VIDA (`CrossingArea`) — diz DE QUE TIPO. As três
 *    Travessias de uma região vêm de áreas diferentes (contrato do
 *    catálogo), então região + área é único por Travessia.
 *
 * PROVISÓRIO: os glifos de área são nomes do subset Material Symbols do app
 * (nenhum é autoral ainda) — estão listados no relatório para o documento de
 * prompts do dono. Trocar por arte própria é só mudar `AREA_ICON`.
 */
export const AREA_ICON: Record<CrossingArea, string> = {
  corpo: 'accessibility_new',
  casa: 'home',
  social: 'groups',
  aprender: 'psychology',
  criar: 'palette',
  mente: 'spa',
  habito: 'event_repeat',
};

/** O nome da área da vida, para o leitor de tela e para a legenda. */
export const AREA_LABEL: Record<CrossingArea, { en: string; pt: string }> = {
  corpo: { en: 'Body', pt: 'Corpo' },
  casa: { en: 'Home', pt: 'Casa' },
  social: { en: 'People', pt: 'Gente' },
  aprender: { en: 'Learning', pt: 'Aprender' },
  criar: { en: 'Making', pt: 'Criar' },
  mente: { en: 'Mind', pt: 'Mente' },
  habito: { en: 'Habit', pt: 'Hábito' },
};

/** O postal da região, decorativo (o nome da região vem sempre escrito ao lado). */
export function RegionPostal({ region, width = 56, height = 44 }: { region: Region; width?: number; height?: number }) {
  const bg = region.bgId ? PET_BACKGROUNDS[region.bgId] : undefined;
  const style: CSSProperties = {
    width, height, flexShrink: 0, borderRadius: 'var(--sm2-radius-sm)',
    background: bg?.css ?? 'radial-gradient(circle at 50% 30%, var(--sm2-surface-2), var(--sm2-bg) 80%)',
    backgroundColor: bg?.baseColor,
    backgroundSize: 'cover', backgroundPosition: 'center bottom',
    imageRendering: 'pixelated',
  };
  return <span aria-hidden="true" data-travessia-postal={region.id} style={style} />;
}

/** O glifo da área da vida de uma Travessia (decorativo; a área também vai escrita). */
export function AreaGlyph({ area, size = 28 }: { area: CrossingArea; size?: number }) {
  return (
    <span aria-hidden="true" data-travessia-area={area} style={{ display: 'inline-flex', flexShrink: 0 }}>
      <Icon name={AREA_ICON[area]} size={size} tone="primary" />
    </span>
  );
}
