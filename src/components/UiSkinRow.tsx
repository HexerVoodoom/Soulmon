import { Segment } from './form/FormKit';
import { useUiSkin } from '../contexts/UiSkinContext';
import { UI_SKIN_OPTION_ENABLED, type UiSkin } from '../utils/uiSkin';
import type { Language } from '../utils/i18n';

function UiSkinRowInner({ language }: { language: Language }) {
  const { skin, setSkin } = useUiSkin();
  const isPt = language === 'pt-BR';
  const opcoes: { k: UiSkin; l: string }[] = [
    { k: 'arte', l: isPt ? 'Padrão (com arte)' : 'Standard (with art)' },
    { k: 'minimal', l: isPt ? 'Minimalista' : 'Minimal' },
  ];
  return (
    <div className="sm2-conta-rg">
      <span className="sm2-conta-rg-lb" id="sm-conta-ui-lb">{isPt ? 'Interface' : 'Interface'}</span>
      <div role="radiogroup" aria-labelledby="sm-conta-ui-lb" className="sm2-conta-rg-seg">
        {opcoes.map(o => (
          <Segment key={o.k} tonal selected={skin === o.k} onSelect={() => setSkin(o.k)} label={o.l} />
        ))}
      </div>
    </div>
  );
}

/**
 * Opção "Interface" de Configurações. Atrás de `UI_SKIN_OPTION_ENABLED` (ver
 * `utils/uiSkin.ts`) até a pele minimalista existir. Desligada, não renderiza
 * nada e nem lê o contexto (o hook só roda no componente interno).
 */
export function UiSkinRow({ language, enabled = UI_SKIN_OPTION_ENABLED }: { language: Language; enabled?: boolean }) {
  if (!enabled) return null;
  return <UiSkinRowInner language={language} />;
}
