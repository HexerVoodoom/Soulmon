import { StrollScene } from './StrollScene';
import { rosterSpriteOf } from '../utils/novosSoulmon';
import type { StrollNowScene as Scene } from '../utils/strollNow';
import type { Language } from '../utils/i18n';

/**
 * A cena do Passeio que roda NA HORA do "Concluir" (REGISTRO §413): a mesma `StrollScene` do resumo da noite, alimentada por
 * `applyStrollNow`. O Soulmon avistado já entrou no Drive quando a cena abre (o pagamento é do `applyStrollNow`), então o OK
 * e o "Pular" não gravam nada. Fechar leva à Home. Peça à parte para o `App` carregá-la sob demanda (orçamento de bytes).
 */
export function StrollNowScene({ scene, playerSprite, language, onClose }: { scene: Scene; playerSprite?: string | null; language: Language; onClose: () => void }) {
  const e = scene.discovery;
  return (
    <StrollScene
      regionId={scene.regionId}
      bgId={scene.bgId}
      playerSprite={playerSprite}
      adventure={scene.adventure}
      adventureIsNew={scene.adventureIsNew}
      stroll={scene.stroll}
      discovery={e ? { key: e.key, name: e.name, element: e.element, sprite: rosterSpriteOf(e) } : null}
      onDiscover={() => {}}
      onFinish={onClose}
      finishLabel={language === 'pt-BR' ? 'Voltar para casa' : 'Back home'}
      onGoHome={onClose}
      language={language}
    />
  );
}
