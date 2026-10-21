import { STORAGE_KEYS, RECONCILE_KEYS } from './storageKeys';
import { readLocal, writeLocal } from './safeStorage';
import { lerAnel, empurrarNoAnel, saveTemProgresso } from './backupRing';
import { migrateBranchIds } from './branchMigration';
import { gravarRevisao } from './saveRevision';
import { isDemoMode, type DemoCarrier } from './demoMode';
import { lerNuvem, cloudSave } from './cloudSave';
import { soulmonDisplayName } from './petName';
import { STAGE_NAMES } from './oracle/base';

/**
 * L08-04 — "Restaurar backup". Lógica pura da tela de Configurações > Seus dados.
 *
 * LISTA as cópias que o aparelho guarda (anel, quarentena, vaga única da adoção)
 * e restaura uma delas — ou o arquivo exportado por `montarBackupLocal`.
 *
 * Restaurar é destrutivo para o que está no aparelho agora, então a ordem é
 * fixa e cada passo só avança se o anterior deu certo:
 *   1. valida a cópia (objeto simples que o `migrateBranchIds` aceita; o hydrate
 *      do boot sanea o resto);
 *   2. guarda o estado ATUAL no anel (`antes-de-restaurar`). Falhou = aborta,
 *      nada é trocado ('sem-copia');
 *   3. grava `GAME_STATE` ('storage' se a cota negar);
 *   4. NÃO troca a identidade (`SAVE_ID` fica);
 *   5. com conta e fora da demo, sobe para a nuvem agora (gesto explícito).
 *      Falha de rede aqui NÃO desfaz a restauração local: o próximo save do app
 *      sobe. Quem chama recarrega a página depois de 'ok'.
 * Nunca lança.
 */

export type FonteDaCopia = 'anel' | 'quarentena' | 'conflito' | 'arquivo';

export interface CopiaDoAparelho {
  /** Chave estável para a lista. */
  id: string;
  fonte: FonteDaCopia;
  /** ISO; '' quando desconhecido. */
  salvoEm: string;
  motivo: string;
  saveId: string;
  state: Record<string, unknown>;
}

export type ErroDeArquivo = 'json' | 'formato' | 'estado';
export type LeituraDeArquivo = { ok: true; copia: CopiaDoAparelho } | { ok: false; erro: ErroDeArquivo };
export type ResultadoRestauracao = 'ok' | 'invalido' | 'sem-copia' | 'storage';

export const ARQUIVO_FORMATO = 'soulmon-local-backup-v1';

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Objeto simples que passa na porta única de load e tem o que mostrar. Nunca lança. */
function estadoRestauravel(state: unknown): state is Record<string, unknown> {
  try {
    if (!ehObjeto(state)) return false;
    const m = migrateBranchIds(state);
    return ehObjeto(m) && saveTemProgresso(m);
  } catch { return false; }
}

function str(v: unknown): string { return typeof v === 'string' ? v : ''; }

function jsonOuNada(texto: string | null): unknown {
  if (!texto) return undefined;
  try { return JSON.parse(texto); } catch { return undefined; }
}

/** As cópias que o aparelho guarda, da mais nova para a mais antiga (sem data vai ao fim). Nunca lança. */
export function listarCopiasDoAparelho(): CopiaDoAparelho[] {
  const out: CopiaDoAparelho[] = [];
  try {
    lerAnel().forEach((c, i) => {
      if (estadoRestauravel(c.state)) {
        out.push({ id: `anel-${i}`, fonte: 'anel', salvoEm: c.salvoEm, motivo: c.motivo, saveId: c.saveId, state: c.state });
      }
    });
  } catch { /* melhor esforço */ }
  try {
    const q = jsonOuNada(readLocal(STORAGE_KEYS.SAVE_QUARANTINE));
    // Texto cru e possivelmente cortado: só entra se virar objeto restaurável.
    if (ehObjeto(q) && typeof q.cru === 'string' && q.cortado !== true) {
      const state = jsonOuNada(q.cru);
      if (estadoRestauravel(state)) {
        out.push({ id: 'quarentena', fonte: 'quarentena', salvoEm: str(q.salvoEm), motivo: 'quarentena', saveId: str(q.saveId), state });
      }
    }
  } catch { /* melhor esforço */ }
  try {
    const c = jsonOuNada(readLocal(RECONCILE_KEYS.CONFLICT_BACKUP));
    if (ehObjeto(c) && estadoRestauravel(c.state)) {
      out.push({ id: 'conflito', fonte: 'conflito', salvoEm: str(c.salvoEm), motivo: str(c.motivo) || 'adocao-da-nuvem', saveId: str(c.saveId), state: c.state });
    }
  } catch { /* melhor esforço */ }
  const t = (c: CopiaDoAparelho) => { const n = Date.parse(c.salvoEm); return Number.isFinite(n) ? n : -1; };
  return out.sort((a, b) => t(b) - t(a));
}

/** Lê o texto de um arquivo exportado. Tolerante: devolve erro nomeado, nunca lança. */
export function lerArquivoDeBackup(texto: string): LeituraDeArquivo {
  let o: unknown;
  try { o = JSON.parse(texto); } catch { return { ok: false, erro: 'json' }; }
  if (!ehObjeto(o) || o.format !== ARQUIVO_FORMATO) return { ok: false, erro: 'formato' };
  if (!estadoRestauravel(o.state)) return { ok: false, erro: 'estado' };
  return {
    ok: true,
    copia: { id: 'arquivo', fonte: 'arquivo', salvoEm: str(o.generatedAt), motivo: 'arquivo', saveId: '', state: o.state },
  };
}

// ───────────────────────────────────────────── texto para a tela ──

/** Estágio por idioma, só os que têm nome no produto; desconhecido = ''. */
function rotuloDeEstagio(stage: unknown, isPt: boolean): string {
  if (typeof stage !== 'string') return '';
  if (stage === 'egg') return isPt ? 'Ovo' : 'Egg';
  const id = stage === 'ultimate' ? 'perfeito' : stage;
  const nome = (STAGE_NAMES as Record<string, { pt: string; en: string } | undefined>)[id];
  return nome ? (isPt ? nome.pt : nome.en) : '';
}

/** "Nome · Estágio" — sem número nenhum. Cai para um rótulo neutro quando não há nome. */
export function resumoDaCopia(state: Record<string, unknown>, isPt: boolean): string {
  const nome = soulmonDisplayName(state.soulmonMeta as { baseName?: string; petName?: string } | undefined);
  const estagio = rotuloDeEstagio(state.evolutionStage, isPt);
  const partes = [nome, estagio].filter(Boolean);
  return partes.length ? partes.join(' · ') : (isPt ? 'Cópia do seu progresso' : 'A copy of your progress');
}

/** A origem em palavras, pelo `motivo` (e pela fonte, quando o motivo não diz). */
export function origemDaCopia(c: Pick<CopiaDoAparelho, 'fonte' | 'motivo'>, isPt: boolean): string {
  const m = c.motivo;
  if (c.fonte === 'arquivo' || m === 'arquivo') return isPt ? 'Arquivo importado.' : 'Imported file.';
  if (c.fonte === 'quarentena' || m === 'quarentena') {
    return isPt ? 'Um save que o app separou para guardar com segurança.' : 'A save the app set aside to keep it safe.';
  }
  switch (m) {
    case 'logout':
      return isPt ? 'Cópia de quando você saiu da conta.' : 'Copy from when you left the account.';
    case 'beta-closed':
      return isPt ? 'Cópia de quando o acesso foi encerrado.' : 'Copy from when access was closed.';
    case 'account-deleted':
      return isPt ? 'Cópia de antes de a conta ser apagada.' : 'Copy from before the account was erased.';
    case 'conflito-409':
    case 'revisao-nuvem-mais-nova':
    case 'adocao-da-nuvem':
    case 'conflito-na-reconciliacao':
      return isPt
        ? 'Versão deste aparelho guardada ao trazer a de outro.'
        : 'This device’s version, kept when another device’s came in.';
    case 'antes-de-restaurar':
      return isPt ? 'O que você tinha antes de uma restauração.' : 'What you had before a restore.';
    case 'nuvem-antes-de-restaurar':
      return isPt ? 'A versão da nuvem de antes de uma restauração.' : 'The cloud version from before a restore.';
    default:
      return isPt ? 'Cópia guardada neste aparelho.' : 'Copy kept on this device.';
  }
}

/** Data no idioma da pessoa; vazia quando a cópia não traz data legível. */
export function dataDaCopia(salvoEm: string, isPt: boolean): string {
  const n = Date.parse(salvoEm);
  if (!Number.isFinite(n)) return '';
  try { return new Date(n).toLocaleString(isPt ? 'pt-BR' : 'en', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return ''; }
}

// ───────────────────────────────────────────── restaurar ──

export interface RestaurarOpts {
  /** Para teste. */
  agora?: () => Date;
}

function iguais(a: unknown, b: unknown): boolean {
  try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
}

/** Sobe a cópia restaurada. Melhor esforço: o local já está trocado e o próximo save do app sobe. */
async function subirParaNuvem(saveId: string, state: unknown, agora: () => Date): Promise<void> {
  const guardarNuvem = (nuvem: unknown): boolean => {
    if (!saveTemProgresso(nuvem) || iguais(nuvem, state)) return true;
    return empurrarNoAnel({ saveId, salvoEm: agora().toISOString(), motivo: 'nuvem-antes-de-restaurar', state: nuvem });
  };
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const leitura = await lerNuvem(saveId);
    if (leitura.estado === 'encontrado') {
      // A cópia da nuvem vai para o anel ANTES de ser sobrescrita; sem ela, não sobe.
      if (!guardarNuvem(leitura.state)) return;
      gravarRevisao(saveId, leitura.revision ?? 0);
    } else if (leitura.estado !== 'vazio') {
      return; // indeterminado ou excluída: não decide por cima
    }
    const r = await cloudSave(saveId, state);
    if (r.ok || r.status !== 409) return;
  }
}

/** Restaura `state` como o save deste aparelho. Ver a ordem no topo do arquivo. Nunca lança. */
export async function restaurarCopia(state: unknown, opts: RestaurarOpts = {}): Promise<ResultadoRestauracao> {
  try {
    const agora = opts.agora ?? (() => new Date());
    if (!estadoRestauravel(state)) return 'invalido';
    const saveId = readLocal(STORAGE_KEYS.SAVE_ID) ?? '';

    // (2) o que há agora vai para o anel primeiro.
    const atualCru = readLocal(STORAGE_KEYS.GAME_STATE);
    if (atualCru) {
      const atual = jsonOuNada(atualCru);
      const guardar = atual === undefined || saveTemProgresso(atual);
      if (guardar) {
        const ok = empurrarNoAnel({
          saveId,
          salvoEm: agora().toISOString(),
          motivo: 'antes-de-restaurar',
          state: atual === undefined ? atualCru : atual,
        });
        if (!ok) return 'sem-copia';
      }
    }

    // (3) troca. (4) SAVE_ID fica como está.
    if (!writeLocal(STORAGE_KEYS.GAME_STATE, JSON.stringify(state), { silent: true })) return 'storage';

    // (5) nuvem.
    if (saveId && !isDemoMode(state as DemoCarrier)) {
      try { await subirParaNuvem(saveId, state, agora); } catch { /* o próximo save do app sobe */ }
    }
    return 'ok';
  } catch { return 'storage'; }
}
