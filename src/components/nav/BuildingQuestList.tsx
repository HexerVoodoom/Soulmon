import type { Language } from '../../utils/i18n';
import type { BuildingId } from '../../utils/gates';
import { exploracaoLots, jogosLots } from '../../utils/playAreaLots';
import { arenaLots, laboratorioLots, hallLots } from '../../utils/areaSheetCopy';
import { LISTED_QUEST_BUILDINGS, questStatus, type BuildingQuestState } from '../../utils/buildingQuests';
import { questText } from '../../utils/buildingQuestsCopy';
import { ClaimButton, MissionCard, type MissionEntry } from './MissionCard';

export interface BuildingQuestsProps {
  state: BuildingQuestState | undefined;
  /** Dia do JOGADOR (`playerDayKey`). */
  day: string;
  bondLevel: number;
  onClaim: (id: BuildingId) => void;
  /** Leva ao prédio da missão (a folha do lote aberta), como a linha do Passeio (dono, 11/10/2026). */
  onGo?: (id: BuildingId) => void;
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
 * "Escrever no caderno"), a linha só APONTA; a ação real (guardar um registro) a deixa pronta e o "Resgatar" paga. SEM lista de materiais: o material
 * continua sendo pago pelo modelo, mas nenhuma tela de missão o mostra. Só vive no menu da Home,
 * nunca dentro do prédio. Sem cobrança: quem não escreveu não perde nada.
 */
export function buildingQuestEntries({ language, state, day, bondLevel, onClaim, onGo }: BuildingQuestsProps & { language: Language }): MissionEntry[] {
  const isPt = language === 'pt-BR';
  return LISTED_QUEST_BUILDINGS.filter(id => questStatus(state, day, id, bondLevel) !== 'locked').map(id => {
    const st = questStatus(state, day, id, bondLevel);
    const status = st === 'claimed' ? 'claimed' : st === 'ready' ? 'ready' : 'open';
    return {
      key: `building:${id}`,
      state: status,
      node: (
        <MissionCard
          key={`building:${id}`}
          language={language}
          attrs={{ 'data-building-quest': id, 'data-status': st }}
          status={status}
          title={questText(day, id, isPt)}
          reward={isPt ? '+1 material' : '+1 material'}
          /* Toda missão com lugar próprio NAVEGA até ele (dono, 11/10/2026) — mesmo desenho do Passeio. */
          onGo={onGo ? () => onGo(id) : undefined}
          goAttr="data-building-go"
          goValue={id}
          action={<ClaimButton language={language} attrs={{ 'data-claim': id }} onClick={() => onClaim(id)} />}
        />
      ),
    };
  });
}
