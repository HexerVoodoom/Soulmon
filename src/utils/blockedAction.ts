/**
 * AVISO PADRÃO DE AÇÃO BLOQUEADA (pedido do dono, 09/11/2026): toda ação que o jogador tenta e não pode abre o MESMO
 * modalzinho (`BlockedActionModal`) dizendo POR QUÊ. Esta função é PURA: recebe o motivo tipado e devolve o texto PT/EN.
 * Nada de botão desabilitado mudo, toast solto ou silêncio — o botão bloqueado continua com cara de bloqueado, mas tocável.
 */
import type { BuildingId } from './gates';

export type BlockedKind = 'energia' | 'recursos' | 'missao' | 'ticket' | 'nivel' | 'espera' | 'limite' | 'demo' | 'outro';

/** Um item que falta: nome nos dois idiomas, quanto tem e quanto precisa. */
export interface BlockedMissing { namePt: string; nameEn: string; have: number; need: number }

/** Onde conseguir: o nome do lugar (tocável) e o prédio de destino. `itemPt/itemEn` nomeia o recurso quando há mais de um. */
export interface BlockedSource { lugarPt: string; lugarEn: string; rota: BuildingId; itemPt?: string; itemEn?: string }

export interface BlockedReason {
  kind: BlockedKind;
  faltam?: readonly BlockedMissing[];
  fonte?: readonly BlockedSource[];
  /** missao: tarefas que faltam; nivel: o nível exigido; espera: minutos que faltam. */
  n?: number;
  /** Texto livre (kind 'outro'/'demo' ou complemento). */
  textoPt?: string;
  textoEn?: string;
}

export interface BlockedExplanation { title: string; lines: string[]; sources: { label: string; prefix: string; rota: BuildingId }[] }

const lista = (f: readonly BlockedMissing[], isPt: boolean): string[] =>
  f.map(m => isPt
    ? `${m.namePt}: tem ${m.have}, precisa de ${m.need} (faltam ${Math.max(0, m.need - m.have)})`
    : `${m.nameEn}: have ${m.have}, need ${m.need} (${Math.max(0, m.need - m.have)} missing)`);

export function explainBlocked(r: BlockedReason, isPt: boolean): BlockedExplanation {
  const faltam = (r.faltam ?? []).filter(m => m.need > m.have);
  const lines: string[] = [];
  let title: string;
  switch (r.kind) {
    case 'energia':
      title = isPt ? 'Você não tem energia suficiente' : 'You don’t have enough energy';
      lines.push(...lista(faltam, isPt));
      break;
    case 'ticket':
      title = isPt ? 'Você não tem tickets suficientes' : 'You don’t have enough tickets';
      lines.push(...lista(faltam, isPt));
      break;
    case 'recursos':
      title = faltam.length === 1
        ? (isPt ? `Você não tem ${faltam[0].namePt} suficiente` : `You don’t have enough ${faltam[0].nameEn}`)
        : (isPt ? 'Você não tem os recursos necessários' : 'You don’t have the resources needed');
      lines.push(...lista(faltam, isPt));
      break;
    case 'missao': {
      const n = Math.max(1, r.n ?? 1);
      title = isPt ? `Complete mais ${n} ${n === 1 ? 'tarefa' : 'tarefas'} para poder fazer isso` : `Complete ${n} more ${n === 1 ? 'task' : 'tasks'} to do this`;
      break;
    }
    case 'nivel':
      title = isPt ? `Disponível a partir do nível ${r.n ?? '?'}` : `Available from level ${r.n ?? '?'}`;
      break;
    case 'espera': {
      const n = Math.max(1, r.n ?? 1);
      title = isPt ? `Volte daqui a ${n} min` : `Come back in ${n} min`;
      break;
    }
    case 'limite':
      title = isPt ? 'Você já chegou ao limite de hoje' : 'You’ve reached today’s limit';
      break;
    case 'demo':
      title = isPt ? 'Indisponível na demonstração' : 'Not available in the demo';
      break;
    default:
      title = isPt ? 'Ainda não dá para fazer isso' : 'You can’t do this yet';
  }
  const extra = isPt ? r.textoPt : r.textoEn;
  if (extra) lines.push(extra);
  const sources = (r.fonte ?? []).map(s => {
    const item = isPt ? s.itemPt : s.itemEn;
    const prefix = item
      ? (isPt ? `${item} pode ser obtido em` : `${item} can be found at`)
      : (isPt ? 'Este recurso pode ser obtido em' : 'This resource can be found at');
    return { prefix, label: isPt ? s.lugarPt : s.lugarEn, rota: s.rota };
  });
  return { title, lines, sources };
}

/** Navegação do "onde conseguir": o modal só PEDE; quem escuta é o `App` (mesmo caminho do "Ir lá" da Mochila). */
export const GO_TO_BUILDING_EVENT = 'soulmon:go-to-building';
export function requestGoToBuilding(rota: BuildingId): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<BuildingId>(GO_TO_BUILDING_EVENT, { detail: rota }));
}
