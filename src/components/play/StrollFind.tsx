import type { CSSProperties } from 'react';
import { sm2Hint, sm2Text } from '../form/FormKit';
import { RitualGlass } from '../ritual/RitualKit';
import { ADVENTURE_ART } from '../../utils/adventureArt';
import type { AdventureFind } from '../../utils/adventure';
import type { Language } from '../../utils/i18n';

/**
 * O QUE O SOULMON ENCONTROU NO PASSEIO (15/10/2026, pedido do dono; REGISTRO §64). Peça única, usada nos DOIS lugares onde o
 * achado aparece — o passo "From Yesterday's Adventure" do resumo do dia e a folha do Passeio —, para que seja um fluxo só
 * (o achado dentro do contexto do passeio) e não um pop-up com visual próprio. Mantém a regra do beta-2 (4.3): a missão que
 * a pessoa escolheu no dia anterior e o destino dela vêm LIGADOS ao achado. Apresentacional: o sorteio é de fora (determinístico).
 */
export interface StrollFindProps {
  adventure: Pick<AdventureFind, 'id' | 'emoji' | 'titlePt' | 'titleEn' | 'textPt' | 'textEn'>;
  /** Ainda não estava no diário. Muda só o rótulo. */
  isNew?: boolean;
  /** A missão do Passeio cumprida no dia anterior e o destino. Sem ela, só o achado. */
  stroll?: { missionTitle: string; destination: string } | null;
  language: Language;
}

const hint = sm2Hint;
/** O `.card` SIS-03: `surface` + fronteira `line`, raio 12. */
const card: CSSProperties = {
  backgroundColor: 'var(--sm2-surface)',
  border: '1px solid var(--sm2-line)',
  borderRadius: 'var(--sm2-radius-md)',
  boxSizing: 'border-box',
};

export function StrollFind({ adventure, isNew = false, stroll = null, language }: StrollFindProps) {
  const isPt = language === 'pt-BR';
  const art = ADVENTURE_ART[adventure.id];
  return (
    <div data-stroll-find style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {stroll && (
        /* O VÍNCULO: a missão que a pessoa escolheu ontem justifica o destino (que fica em destaque). */
        <div data-stroll-link style={{ ...card, display: 'flex', flexDirection: 'column', gap: 6, padding: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span style={{ ...hint, flex: 'none', minWidth: 72 }}>{isPt ? 'Missão' : 'Mission'}</span>
            <span data-stroll-mission style={{ ...sm2Text, fontWeight: 500 }}>{stroll.missionTitle}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span style={{ ...hint, flex: 'none', minWidth: 72 }}>{isPt ? 'Destino' : 'Destination'}</span>
            <span data-stroll-destination style={{ ...sm2Text, fontWeight: 600, color: 'var(--sm2-gold-ink)' }}>{stroll.destination}</span>
          </div>
        </div>
      )}
      <div style={{ ...card, display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 12px 8px 8px' }}>
        {art
          ? (
            <RitualGlass width={48}>
              <img src={art} alt="" width={48} height={48} style={{ width: 48, height: 48, display: 'block' }} />
            </RitualGlass>
          )
          /* Emoji do catálogo quando a arte ainda não existe — conteúdo, não pixel: fica fora do vidro. */
          : <span aria-hidden style={{ fontSize: 28, lineHeight: '48px', width: 48, textAlign: 'center', flexShrink: 0 }}>{adventure.emoji}</span>}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {isNew && (
            /* `New` no dourado da paleta (tokens do par gold, nunca hex). */
            <span
              data-adventure-new
              style={{
                alignSelf: 'flex-start', padding: '0 8px', borderRadius: 'var(--sm2-radius-sm)',
                backgroundColor: 'var(--sm2-gold-fill)', color: 'var(--sm2-on-gold)',
                fontSize: 'var(--sm2-text-xs)', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase',
              }}
            >
              {isPt ? 'Novo' : 'New'}
            </span>
          )}
          <p style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>{isPt ? adventure.titlePt : adventure.titleEn}</p>
          <p style={hint}>{isPt ? adventure.textPt : adventure.textEn}</p>
        </div>
      </div>
    </div>
  );
}
