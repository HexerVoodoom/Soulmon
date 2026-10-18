/**
 * A FOLHA CHEIA DO BOSQUE (D-32): a ÚNICA porta do panorama, aberta a partir do Salão da Guilda (Hall). É um
 * diálogo de tela cheia com o `GroveVisor` dentro; fecha por botão, Escape e voltar do sistema.
 *
 * O nível de cada árvore vem do SAVE (`arvores`, pico por estação) somado ao que o plantio do clã mostra agora
 * (`getPlantio`, só a estação de hoje). Se a rede falha, o panorama abre mesmo assim, com o que o save sabe.
 * Carregada sob demanda (`lazy` no `GuildSheet`): panorama e árvores não entram no chunk de entrada.
 */
import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useBackLayer } from '../../utils/backStack';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { getPlantio, type PlantioView } from '../../utils/claApi';
import { ESTACOES_BOSQUE, nivelDaArvore, registrarPlantio, type BosqueArvores, type EstacaoBosque } from '../../utils/bosqueArvores';
import { guildText } from '../../utils/guildCopy';
import { playerDayIso, type PlayerDayAnchor } from '../../utils/playerDay';
import type { Language } from '../../utils/i18n';
import { Icon } from '../ui/Icon';
import { GroveVisor } from './GroveVisor';
import { useClaBuilding } from './claUi';

export type OnPlantio = (v: Pick<PlantioView, 'planted' | 'mature' | 'stage' | 'season'>) => void;

interface GroveFolhaProps {
  saveId: string;
  language: Language;
  tz?: PlayerDayAnchor;
  reducedMotion: boolean;
  arvores: BosqueArvores;
  /** Guarda no save o que o plantio mostrou (idempotente). */
  onPlantio?: OnPlantio;
  onClose: () => void;
}

export function GroveFolha({ saveId, language, tz, reducedMotion, arvores, onPlantio, onClose }: GroveFolhaProps) {
  useBackLayer(true, onClose);
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose);
  const { view } = useClaBuilding(() => getPlantio(saveId, tz));

  useEffect(() => { if (view) onPlantio?.(view); }, [view, onPlantio]);

  const niveis = useMemo(() => {
    const hoje = playerDayIso(new Date(), tz); // ISO: o ciclo da estação sai do ano/mês, não de `toDateString`
    const efetivo = view ? registrarPlantio(arvores, view, hoje) : arvores;
    return Object.fromEntries(ESTACOES_BOSQUE.map(e => [e, nivelDaArvore(efetivo, e)])) as Record<EstacaoBosque, number>;
  }, [arvores, view, tz]);

  const titulo = guildText(language, 'guild.bosque.titulo');
  return createPortal(
    <div ref={dialogRef} className="sm2-grove-folha" role="dialog" aria-modal="true" aria-label={titulo} data-grove-folha>
      <div className="sm2-grove-folha-topo">
        <button type="button" className="sm2-grove-folha-fechar" onClick={onClose} aria-label={guildText(language, 'guild.bosque.panorama.fechar')} data-grove-fechar>
          <Icon name="close" size={32} />
        </button>
        <h2 className="sm2-grove-folha-titulo">{titulo}</h2>
      </div>
      <GroveVisor language={language} niveis={niveis} reducedMotion={reducedMotion} label={guildText(language, 'guild.bosque.panorama.aria')} />
    </div>,
    document.body,
  );
}

export default GroveFolha;
