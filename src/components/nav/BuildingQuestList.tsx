import type { Language } from '../../utils/i18n';
import type { BuildingId } from '../../utils/gates';
import { exploracaoLots, jogosLots } from '../../utils/playAreaLots';
import { arenaLots, laboratorioLots, hallLots } from '../../utils/areaSheetCopy';
import { LISTED_QUEST_BUILDINGS, questStatus, type BuildingQuestState } from '../../utils/buildingQuests';
import { questText } from '../../utils/buildingQuestsCopy';
import { sm2Button } from '../form/FormKit';
import { MissionMark } from '../play/MissionMark';

export interface BuildingQuestsProps {
  state: BuildingQuestState | undefined;
  /** Dia do JOGADOR (`playerDayKey`). */
  day: string;
  bondLevel: number;
  onClaim: (id: BuildingId) => void;
}

/** O nome do prédio, do mesmo lugar que o Mapa lê (um dono por rótulo). */
export function nameOf(id: BuildingId, language: Language): string {
  const [area, lot] = id.split('.');
  const lots = area === 'exploracao' ? exploracaoLots(language)
    : area === 'jogos' ? jogosLots(language)
    : area === 'arena' ? arenaLots(language)
    : area === 'laboratorio' ? laboratorioLots(language)
    : hallLots(language);
  return (lots as { id: string; label: string }[]).find(l => l.id === lot)?.label ?? id;
}

/**
 * As missões de prédio do dia que o menu da Home lista (`LISTED_QUEST_BUILDINGS`, hoje o Caderno:
 * "Escrever no caderno"), com o botão de dar como feita. SEM lista de materiais: o material
 * continua sendo pago pelo modelo, mas nenhuma tela de missão o mostra. Só vive no menu da Home,
 * nunca dentro do prédio. Sem cobrança: quem não escreveu não perde nada.
 */
export function BuildingQuestList({ language, state, day, bondLevel, onClaim }: BuildingQuestsProps & { language: Language }) {
  const isPt = language === 'pt-BR';
  const open = LISTED_QUEST_BUILDINGS.filter(id => questStatus(state, day, id, bondLevel) !== 'locked');
  if (open.length === 0) return null;
  return (
    <ul data-building-quests style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {open.map(id => {
        const st = questStatus(state, day, id, bondLevel);
        return (
          <li key={id} data-building-quest={id} data-status={st} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1 }}>📓</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="sm2-title" style={{ display: 'block', fontSize: 'var(--sm2-text-md)' }}>{questText(day, id, isPt)}</span>
            </span>
            {(st === 'available' || st === 'ready') && <MissionMark kind={st === 'ready' ? 'ready' : 'available'} size={24} isPt={isPt} />}
            {st === 'ready' && (
              <button type="button" style={sm2Button('primary', false, 'sm')} data-claim={id} onClick={() => onClaim(id)}>
                {isPt ? 'Feito' : 'Done'}
              </button>
            )}
            {st === 'claimed' && <span style={{ fontSize: 'var(--sm2-text-sm)' }}>{isPt ? 'Feito hoje' : 'Done today'}</span>}
          </li>
        );
      })}
    </ul>
  );
}
