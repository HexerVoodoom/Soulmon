import { useState } from 'react';
import type { Language } from '../../utils/i18n';
import { MAPA_PALCO_STYLE, type LotBounds } from '../../utils/areaLotGeometry';
import { useBackLayer } from '../../utils/backStack';
import type { MercOrdem } from '../../utils/mercMissionSave';
import { ModalSheet, sm2Text } from '../form/FormKit';
import { arteOnboarding } from '../onboarding/sequencia/assets';
import { Icon } from '../ui/Icon';
import bgGuilda from '../../assets/soulmon/mapa/bg-guilda.png';

export type GuildaPredio = MercOrdem | 'remendados' | 'desfeitos';

/** Os cinco prédios pintados no mapa da Guilda (05/11/2026, dono), em % da imagem, com a medida de `LOT_PINTADO`. */
export const GUILDA_PREDIOS: Record<GuildaPredio, { rect: LotBounds; pt: string; en: string }> = {
  filtrador: { rect: [0, 10, 31, 33], pt: 'Filtradores', en: 'Filterers' },
  tecelao: { rect: [32, 5, 68, 26], pt: 'Tecelões', en: 'Weavers' },
  rompente: { rect: [69, 11, 100, 32], pt: 'Rompentes', en: 'Breakers' },
  remendados: { rect: [1, 44, 53, 64], pt: 'Remendados', en: 'Patched Ones' },
  desfeitos: { rect: [60, 49, 100, 74], pt: 'Desfeitos', en: 'Undone' },
};

/** As duas Ordens sem missão ainda: o toque abre só o NPC. */
const SO_NPC = {
  remendados: { retrato: 'velado-anciao.png', pt: 'O Ancião', en: 'The Elder', falaPt: 'Aqui ninguém pergunta como você chegou. Descanse um pouco.', falaEn: 'No one here asks how you arrived. Rest a while.' },
  desfeitos: { retrato: 'desfeito.png', pt: 'Um Desfeito', en: 'One of the Undone', falaPt: 'Esta torre não te chamou. Volte.', falaEn: 'This tower did not call you. Go back.' },
} as const;

/** A GUILDA DOS MERCENÁRIOS: mapa de um nível só, sem área interna; cada prédio abre direto o NPC. Fica por cima do Mapa até o jogador voltar. */
export function GuildaMapPage({ language, onClose, onOpenOrdem }: { language: Language; onClose: () => void; onOpenOrdem: (ordem: MercOrdem) => void }) {
  const isPt = language === 'pt-BR';
  const [npc, setNpc] = useState<keyof typeof SO_NPC | null>(null);
  useBackLayer(true, onClose);
  const aberto = npc ? SO_NPC[npc] : null;
  return (
    <section
      data-guilda-map
      aria-label={isPt ? 'Guilda dos Mercenários' : 'Mercenary Guild'}
      style={{ position: 'fixed', inset: 0, zIndex: 30, overflow: 'hidden', containerType: 'size', background: `url(${bgGuilda}) center / cover no-repeat, var(--sm2-bg)` }}
    >
      <div style={MAPA_PALCO_STYLE}>
        {(Object.keys(GUILDA_PREDIOS) as GuildaPredio[]).map(id => {
          const { rect: b, pt, en } = GUILDA_PREDIOS[id];
          return (
            <button
              key={id}
              type="button"
              data-guilda-predio={id}
              onClick={() => (id === 'remendados' || id === 'desfeitos' ? setNpc(id) : onOpenOrdem(id))}
              aria-label={isPt ? pt : en}
              style={{
                position: 'absolute', left: `${b[0]}%`, top: `${b[1]}%`, width: `${b[2] - b[0]}%`, height: `${b[3] - b[1]}%`,
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', pointerEvents: 'auto',
              }}
            >
              <span
                style={{
                  position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)', whiteSpace: 'nowrap',
                  padding: '3px 10px', borderRadius: 999, background: 'color-mix(in srgb, #06171A 82%, transparent)', border: '1px solid rgba(200, 150, 80, .75)',
                  boxShadow: '0 1px 4px rgba(0,0,0,.55)',
                  fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-xs)', fontWeight: 800, letterSpacing: '0.06em', color: '#E9F5F2',
                }}
              >
                {isPt ? pt : en}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        data-guilda-voltar
        onClick={onClose}
        aria-label={isPt ? 'Voltar ao Mapa' : 'Back to the Map'}
        style={{ position: 'absolute', left: 12, top: 'calc(12px + env(safe-area-inset-top, 0px))', width: 44, height: 44, display: 'grid', placeItems: 'center', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <Icon name="arrow_back" size={32} tone="gold" />
      </button>
      {npc && aberto && (
        <ModalSheet open onClose={() => setNpc(null)} language={language} maxWidth={440} title={isPt ? aberto.pt : aberto.en}>
          <div data-guilda-npc={npc} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <img src={arteOnboarding(aberto.retrato)} alt="" aria-hidden="true" style={{ width: 160, height: 160, objectFit: 'contain' }} />
            <p style={{ ...sm2Text, margin: 0, textAlign: 'center' }}>{isPt ? aberto.falaPt : aberto.falaEn}</p>
          </div>
        </ModalSheet>
      )}
    </section>
  );
}
