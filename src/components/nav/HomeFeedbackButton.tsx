import { homeFeedbackLabel, homeFeedbackMailto } from '../FeedbackLink';
import type { Language } from '../../utils/i18n';

/**
 * FEEDBACK NA HOME (dono, 04/11/2026): logo ABAIXO do avatar do perfil (slot `leading`
 * do `HomeHud`), só o besourinho `bug_report` do Material (SVG inline: fora do subset da fonte), sem rótulo
 * visível — o nome mora no `aria-label`. É um `<a href="mailto:">` como o `ActionRow`
 * das Configurações: no WebView do Capacitor o `mailto:` sai para o app de e-mail do
 * sistema (sem `_blank`, que deixaria uma aba em branco). Alvo de toque 44.
 */
export function HomeFeedbackButton({ language }: { language: Language }) {
  const label = homeFeedbackLabel(language);
  return (
    <a
      href={homeFeedbackMailto({ language })}
      aria-label={label}
      data-home-feedback
      className="sm2-corner-link"
      style={{
        position: 'absolute', top: '100%', left: 0, marginTop: 16, color: 'var(--sm2-ink)',
        // 6, não 5: a cena do pet (`sm-pet-sticky`, z 5) vem depois no DOM e cobria o ícone e o toque.
        zIndex: 6,
        width: 44, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width={28} height={28} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.8))' }}>
        <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z" />
      </svg>
    </a>
  );
}
