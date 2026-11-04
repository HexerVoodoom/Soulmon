import { PixelIcon } from '../ui/PixelIcon';
import { homeFeedbackLabel, homeFeedbackMailto } from '../FeedbackLink';
import type { Language } from '../../utils/i18n';

/**
 * FEEDBACK NA HOME (dono, 04/11/2026): logo ABAIXO do avatar do perfil (slot `leading`
 * do `HomeHud`), só o ícone `enviar` (aviãozinho de papel, arte do squad), sem rótulo
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
        position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 5,
        width: 44, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <PixelIcon name="enviar" size={32} />
    </a>
  );
}
