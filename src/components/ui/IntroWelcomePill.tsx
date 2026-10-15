import { resolveLanguage } from '../../utils/i18n';
import { readLocal } from '../../utils/safeStorage';
import { STORAGE_KEYS } from '../../utils/storageKeys';

/**
 * PÍLULA "Welcome" da intro (REGISTRO §79, dono 15/10/2026: "coloca um PNG por
 * cima, uma pílula escrito WELCOME"). A arte do vídeo/pôster traz texto PINTADO
 * ("VERSION 1.2" errada, "LOADING DATA...", barra, "SOUL_LINK ESTABLISHED"); a
 * pílula é opaca e cobre isso. CSS puro (não PNG): respeita PT/EN, usa token e a
 * fonte do visor, e acompanha a arte em qualquer proporção porque é ancorada na
 * CAIXA DO VÍDEO (cover 9:16 reproduzido em `cq`), não na janela. Decorativa:
 * `aria-hidden` e sem toque — o alvo "Skip/Tap to start" do pai segue dono do nome.
 */
export function IntroWelcomePill() {
  const isPt = resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE)) === 'pt-BR';
  return (
    <span className="sm2-intro-stage" aria-hidden="true" data-testid="intro-welcome-stage">
      <span className="sm2-intro-art">
        <span className="sm2-intro-pill" data-testid="intro-pill-welcome">{isPt ? 'Bem-vindo' : 'Welcome'}</span>
      </span>
    </span>
  );
}
