import type { Language } from '../../utils/i18n';
import type { BuildingId } from '../../utils/gates';
import { exploracaoLots, jogosLots } from '../../utils/playAreaLots';
import { arenaLots, laboratorioLots, hallLots } from '../../utils/areaSheetCopy';
import {
  QUEST_BUILDINGS, MATERIALS, MATERIAL_CAP, materialOf, questStatus, questText, stockOf,
  type BuildingQuestState,
} from '../../utils/buildingQuests';
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
function nameOf(id: BuildingId, language: Language): string {
  const [area, lot] = id.split('.');
  const lots = area === 'exploracao' ? exploracaoLots(language)
    : area === 'jogos' ? jogosLots(language)
    : area === 'arena' ? arenaLots(language)
    : area === 'laboratorio' ? laboratorioLots(language)
    : hallLots(language);
  return (lots as { id: string; label: string }[]).find(l => l.id === lot)?.label ?? id;
}

/**
 * "Dos prédios" / "Buildings": a missão do dia de cada prédio já aberto (uma por prédio, fora do Mercado),
 * com o botão de resgatar o MATERIAL dele, e o inventário de materiais. Material NÃO é moeda: número simples
 * em tinta comum (nunca o estilo de Bits/Emblemas/Créditos). Sem cobrança: quem não entrou não perde nada.
 */
export function BuildingQuestList({ language, state, day, bondLevel, onClaim }: BuildingQuestsProps & { language: Language }) {
  const isPt = language === 'pt-BR';
  const open = QUEST_BUILDINGS.filter(id => questStatus(state, day, id, bondLevel) !== 'locked');
  const owned = MATERIALS.filter(m => stockOf(state, m.id) > 0);
  return (
    <div data-building-quests>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {open.map(id => {
          const st = questStatus(state, day, id, bondLevel);
          const mat = materialOf(id)!;
          return (
            <li key={id} data-building-quest={id} data-status={st} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1 }}>{mat.icon}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="sm2-title" style={{ display: 'block', fontSize: 'var(--sm2-text-md)' }}>{nameOf(id, language)}</span>
                <span style={{ display: 'block', fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-ink-muted, var(--sm2-ink))' }}>
                  {questText(day, id, isPt)} · {isPt ? mat.namePt : mat.nameEn}
                </span>
              </span>
              {(st === 'available' || st === 'ready') && <MissionMark kind={st === 'ready' ? 'ready' : 'available'} size={24} isPt={isPt} />}
              {st === 'ready' && (
                <button type="button" style={sm2Button('primary', false, 'sm')} data-claim={id} onClick={() => onClaim(id)}>
                  {isPt ? 'Pegar' : 'Collect'}
                </button>
              )}
              {st === 'claimed' && <span style={{ fontSize: 'var(--sm2-text-sm)' }}>{isPt ? 'Coletado' : 'Collected'}</span>}
            </li>
          );
        })}
      </ul>
      <p style={{ margin: '10px 0 0', fontSize: 'var(--sm2-text-sm)' }}>
        {isPt ? 'Mais prédios abrem conforme o Vínculo cresce.' : 'More buildings open as your Bond grows.'}
      </p>
      <h4 className="sm2-title" style={{ margin: '16px 0 6px', fontSize: 'var(--sm2-text-md)' }}>{isPt ? 'Materiais' : 'Materials'}</h4>
      {owned.length === 0 ? (
        <p data-materials-empty style={{ margin: 0, fontSize: 'var(--sm2-text-sm)' }}>
          {isPt ? 'Cada prédio guarda um material próprio. Eles servirão para aprimorar equipamentos.' : 'Each building keeps a material of its own. They will be used to upgrade equipment.'}
        </p>
      ) : (
        <ul data-materials style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
          {owned.map(m => (
            <li key={m.id} data-material={m.id} title={`max ${MATERIAL_CAP}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1 }}>{m.icon}</span>
              <span>{isPt ? m.namePt : m.nameEn} ×{stockOf(state, m.id)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
