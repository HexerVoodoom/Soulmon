// ---------------------------------------------------------------------------
// CONJUNTO FUNDADOR (23/11/2026, decisão do dono) — 4 prêmios por DIAS ACUMULADOS com ≥ 1 tarefa/atividade concluída
// (não consecutivos): 1 dia = Fundo, 2 = Moldura, 3 = Retrato, 5 = Cristal Fundador. Vale para todos os jogadores.
// Quem JÁ TEM CONTA (save sem o campo `fundadorPremios` e com Soulmon criado) recebe os 4 de uma vez na carga, uma vez só.
// Conta nova nasce com `fundadorPremios: []` e progride pelos dias. Sem backfill por histórico.
//
// Módulo PURO e leve (entra no chunk de entrada): só ids e contas. O catálogo visual (fundo, moldura) é lazy em
// `fundadorCatalogo.ts`; o retrato mora em `assets/avatares`; o cristal em `cristalFundador.ts`. Espelho do servidor: `functions/api/_fundador.js`.
// Cosmético puro: nada daqui toca economia. Todas as funções devolvem o MESMO objeto quando nada muda (idempotência barata).
// ---------------------------------------------------------------------------
import { playerDayIso, type PlayerDayAnchor } from './playerDay';

export const FUNDADOR_FUNDO_ID = 'founder-fundo';
export const FUNDADOR_MOLDURA_ID = 'founder-moldura';
export const FUNDADOR_RETRATO_ID = 'founder-retrato';
export const FUNDADOR_CRISTAL_ID = 'furn-cristal-fundador';

/** Marcos: dias acumulados → prêmio. Ordem = ordem de entrega. */
export const FUNDADOR_MARCOS: ReadonlyArray<{ dias: number; premio: string }> = [
  { dias: 1, premio: FUNDADOR_FUNDO_ID },
  { dias: 2, premio: FUNDADOR_MOLDURA_ID },
  { dias: 3, premio: FUNDADOR_RETRATO_ID },
  { dias: 5, premio: FUNDADOR_CRISTAL_ID },
];
export const FUNDADOR_PREMIOS: readonly string[] = FUNDADOR_MARCOS.map(m => m.premio);
/** Teto sanitário do contador (o marco máximo é 5; o teto só protege de lixo). */
export const FUNDADOR_DIAS_MAX = 100000;

export interface FundadorEstado {
  fundadorDias?: number;
  fundadorUltimoDia?: string;
  fundadorPremios?: string[];
  ownedBackgrounds?: string[];
  ownedFrames?: string[];
  ownedFurniture?: string[];
  playerDayTz?: PlayerDayAnchor;
  evolutionStage?: string;
  activities?: unknown[];
  completedTasks?: unknown[];
}

const com = (l: string[] | undefined, id: string): string[] | undefined => (l?.includes(id) ? undefined : [...(l ?? []), id]);

/** Grava a POSSE de um prêmio (fundo/moldura/cristal; o retrato é posse só por `fundadorPremios`). `includes` antes de gravar. */
function darPosse<S extends FundadorEstado>(s: S, premio: string): S {
  if (premio === FUNDADOR_FUNDO_ID) { const l = com(s.ownedBackgrounds, premio); return l ? { ...s, ownedBackgrounds: l } : s; }
  if (premio === FUNDADOR_MOLDURA_ID) { const l = com(s.ownedFrames, premio); return l ? { ...s, ownedFrames: l } : s; }
  if (premio === FUNDADOR_CRISTAL_ID) { const l = com(s.ownedFurniture, premio); return l ? { ...s, ownedFurniture: l } : s; }
  return s;
}

/** O save já tem Soulmon criado? (conta existente, para a regra de migração). */
export function temSoulmonCriado(s: FundadorEstado): boolean {
  return typeof s.evolutionStage === 'string' || (s.activities?.length ?? 0) > 0 || (s.completedTasks?.length ?? 0) > 0;
}

/** O jogador ganhou este prêmio do Fundador? (o retrato só aparece na grade de avatares para quem o ganhou). */
export function temPremioFundador(s: Pick<FundadorEstado, 'fundadorPremios'>, premio: string): boolean {
  return !!s.fundadorPremios?.includes(premio);
}

/**
 * Concessão da CARGA (idempotente): conta existente (campo ausente + Soulmon criado) recebe os 4; conta sem Soulmon ainda ganha `[]`
 * (nunca cai no critério legado depois); e TODO id de `fundadorPremios` tem a posse garantida (cura posse perdida, ex.: renascimento).
 * Devolve o MESMO objeto se nada muda.
 */
export function concederFundador<S extends FundadorEstado>(estado: S): S {
  let s = estado;
  if (!Array.isArray(s.fundadorPremios)) {
    s = { ...s, fundadorPremios: temSoulmonCriado(s) ? [...FUNDADOR_PREMIOS] : [] };
  }
  for (const id of s.fundadorPremios!) s = darPosse(s, id);
  return s;
}

/**
 * Uma tarefa/atividade foi CONCLUÍDA agora: soma 1 dia acumulado se o dia do jogador é novo (≠ `fundadorUltimoDia`) e entrega
 * os prêmios cujo marco foi alcançado. Mesmo dia = no-op (mesmo objeto). O dia vem de `playerDayIso` (âncora `playerDayTz`).
 */
export function registrarDiaComTarefa<S extends FundadorEstado>(estado: S, agora: Date): S {
  // Aqui NUNCA vale o critério de conta existente (quem decide é a carga, `hydrateSave`): campo ausente conta como lista vazia.
  const base = Array.isArray(estado.fundadorPremios) ? concederFundador(estado) : concederFundador({ ...estado, fundadorPremios: [] });
  const hoje = playerDayIso(agora, base.playerDayTz);
  if (base.fundadorUltimoDia === hoje) return base;
  const dias = Math.min(FUNDADOR_DIAS_MAX, (Number.isFinite(base.fundadorDias) ? Math.max(0, Math.floor(base.fundadorDias!)) : 0) + 1);
  let s: S = { ...base, fundadorDias: dias, fundadorUltimoDia: hoje };
  const premios = [...(s.fundadorPremios ?? [])];
  for (const m of FUNDADOR_MARCOS) {
    if (dias >= m.dias && !premios.includes(m.premio)) { premios.push(m.premio); s = darPosse(s, m.premio); }
  }
  return { ...s, fundadorPremios: premios };
}

/** Saneamento de carga (leitura tolerante). `undefined` = campo ausente (conta existente). */
export function sanitizeFundadorPremios(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return FUNDADOR_PREMIOS.filter(id => raw.includes(id));
}
export function sanitizeFundadorDias(raw: unknown): number {
  return typeof raw === 'number' && Number.isFinite(raw) ? Math.min(FUNDADOR_DIAS_MAX, Math.max(0, Math.floor(raw))) : 0;
}
export function sanitizeFundadorUltimoDia(raw: unknown): string | undefined {
  return typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
}

/** CONCEDENTE DEV (painel de GM, só admin/dono): os 4 prêmios + posse de uma vez, idempotente. Não mexe nos dias acumulados. */
export function concederTodosFundador<S extends FundadorEstado>(estado: S): S {
  let s: S = { ...estado, fundadorPremios: [...FUNDADOR_PREMIOS] };
  for (const id of FUNDADOR_PREMIOS) s = darPosse(s, id);
  const mesmo = estado.fundadorPremios?.length === FUNDADOR_PREMIOS.length && FUNDADOR_PREMIOS.every(id => estado.fundadorPremios!.includes(id)) && s.ownedBackgrounds === estado.ownedBackgrounds && s.ownedFrames === estado.ownedFrames && s.ownedFurniture === estado.ownedFurniture;
  return mesmo ? estado : s;
}
