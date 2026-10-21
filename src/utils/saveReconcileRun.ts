import { toast } from 'sonner';
import { STORAGE_KEYS } from './storageKeys';
import { readLocal } from './safeStorage';
import { lerNuvem, reagirContaExcluida } from './cloudSave';
import { lerRevisao, gravarRevisao, esquecerRevisao } from './saveRevision';
import { decidirReconciliacao, type MotivoReconciliacao } from './saveReconcile';
import { empurrarNoAnel, saveTemProgresso } from './backupRing';
import { quarentenarSaveLocal } from './saveQuarantine';
import { sessaoEncerrando } from './sessionReset';
import { migrateBranchIds } from './branchMigration';
import { resolveLanguage } from './i18n';
import { isDemoMode, type DemoCarrier } from './demoMode';

/**
 * ADR-004 (D2/D3) — o CORPO da reconciliação por revisão, fora do chunk de entrada.
 *
 * O provider (`GameStateContext.tsx`) guarda só a casca (refs, efeitos) e carrega este módulo por
 * `import()` dinâmico na primeira vez que precisa reconciliar (boot com revisão gravada, ou 409).
 * Recebe por parâmetro tudo que toca o provider — nada daqui importa o provider.
 *
 * ⚠️ R-1: o callback do POST nunca chama `setGameState`. `aplicar` só é chamada DAQUI, pela via
 * própria de reconciliação (efeito que NÃO depende de `[gameState]`).
 */
export interface ContextoReconciliacao<T> {
  motivo: MotivoReconciliacao;
  /** 409: a revisão que o servidor informou no 409 (leitura abaixo disso = réplica atrasada → espera). */
  revisaoMinima?: number;
  estadoAtual: () => T;
  /** Nuvem → estado do jogo (migra ids de ramo e hidrata); lança se a forma for ilegível. */
  hidratar: (nuvem: Record<string, unknown>) => T;
  aplicar: (novo: T) => void;
  /** Início da rajada de mutações ainda não enviada (`null` = nada pendente); com SYNC_PENDING define "há pendência". */
  rajada: { current: number | null };
  montado: { current: boolean };
  /** `current = false` libera o POST (suspenso enquanto reconcilia). */
  reconciliando: { current: boolean };
  /** Aviso de "sem espaço" já foi dado? (um por sessão) */
  avisoSemEspacoDado: { current: boolean };
}

const descartarPendentesDePresente = () => { void import('./giftsCredited').then(m => m.descartarPendentes()).catch(() => {}); };

/** Devolve `true` se a decisão foi final (não precisa repetir). */
export async function reconciliarComNuvem<T>(c: ContextoReconciliacao<T>): Promise<boolean> {
  const { motivo } = c;
  const saveId = readLocal(STORAGE_KEYS.SAVE_ID);
  if (!saveId || isDemoMode(c.estadoAtual() as DemoCarrier | null)) { c.reconciliando.current = false; return true; }
  const leitura = await lerNuvem(saveId);
  if (!c.montado.current || sessaoEncerrando()) return true;
  const decisao = decidirReconciliacao({
    motivo, leitura, revisaoLocal: lerRevisao(saveId), pendente: readLocal(STORAGE_KEYS.SYNC_PENDING) === '1' || c.rajada.current !== null, revisaoMinima: c.revisaoMinima,
  });
  if (decisao === 'excluida') {
    void reagirContaExcluida({ excluidaEm: leitura.estado === 'excluida' ? leitura.excluidaEm : undefined });
    return true;
  }
  if (decisao === 'liberar') { esquecerRevisao(); c.reconciliando.current = false; return true; }
  if (decisao === 'ignorar') return true;
  if (decisao === 'esperar' || leitura.estado !== 'encontrado') return false;

  // adotar — a nuvem vence, o local recusado vai ANTES para o anel (ou quarentena).
  let hidratado: T;
  try {
    const nuvem = migrateBranchIds(leitura.state);
    if (!nuvem || typeof nuvem !== 'object' || Array.isArray(nuvem)) return false;
    hidratado = c.hidratar(nuvem as Record<string, unknown>);
  } catch { return false; /* nuvem ilegível: nada é trocado nem postado */ }
  const local = c.estadoAtual();
  const temLocal = saveTemProgresso(local);
  const motivoCopia = motivo === '409' ? 'conflito-409' : 'revisao-nuvem-mais-nova';
  if (temLocal) {
    const copiado = empurrarNoAnel({
      saveId,
      salvoEm: new Date().toISOString(),
      motivo: motivoCopia,
      state: local,
    }) || quarentenarSaveLocal(JSON.stringify(local), motivoCopia);
    if (!copiado) {
      // Nem anel nem quarentena: trocar seria destrutivo. POST segue suspenso; avisa UMA vez.
      if (!c.avisoSemEspacoDado.current) {
        c.avisoSemEspacoDado.current = true;
        const pt = resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE)) === 'pt-BR';
        toast.warning(pt
          ? 'Há progresso mais novo em outro aparelho, mas não há espaço para guardar o deste. Libere espaço no aparelho para sincronizar.'
          : 'Newer progress exists on another device, but there is no room to keep this one. Free up space on this device to sync.',
        { duration: 10000 });
      }
      return false;
    }
  }
  // Dado e revisão antes de liberar o POST: o próximo envio já leva a base certa.
  gravarRevisao(saveId, leitura.revision ?? 0);
  c.reconciliando.current = false; // (no D2 já está liberado; no 409 libera o POST junto com a troca)
  c.aplicar(hidratado);
  descartarPendentesDePresente(); // L03-01: o estado adotado não tem o crédito; o próximo resgate credita de novo
  if (temLocal) {
    const pt = resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE)) === 'pt-BR';
    toast(pt
      ? 'Trouxemos o progresso de outro aparelho. A versão deste aparelho ficou guardada em Configurações > Seus dados.'
      : "Brought in your progress from another device. This device's version is saved in Settings > Your data.",
    { duration: 10000 });
  }
  return true;
}

/**
 * L08 — uma leitura da nuvem para sair da carga degradada. `true` = decisão final (liberou, adotou,
 * excluída, cancelado); `false` = indeterminado/ilegível, `repetirComRecuo` tenta de novo.
 * R-1: só `aplicar` toca o estado, e só daqui (efeito de mount, não o callback do POST).
 */
export async function lerParaSairDaCargaDegradada<T>(c: {
  estadoAtual: () => T;
  hidratar: (nuvem: Record<string, unknown>) => T;
  aplicar: (novo: T) => void;
  liberar: () => void;
  cancelado: () => boolean;
}): Promise<boolean> {
  const saveId = readLocal(STORAGE_KEYS.SAVE_ID);
  if (!saveId || isDemoMode(c.estadoAtual() as DemoCarrier | null)) { c.liberar(); return true; }
  const r = await lerNuvem(saveId);
  if (c.cancelado() || sessaoEncerrando()) return true;
  if (r.estado === 'excluida') { void reagirContaExcluida({ excluidaEm: r.excluidaEm }); return true; }
  if (r.estado === 'vazio') { c.liberar(); return true; }
  if (r.estado === 'encontrado') {
    try {
      const nuvem = migrateBranchIds(r.state);
      if (nuvem && typeof nuvem === 'object' && !Array.isArray(nuvem)) {
        const hidratado = c.hidratar(nuvem as Record<string, unknown>);
        c.liberar();
        c.aplicar(hidratado);
        descartarPendentesDePresente();
        return true;
      }
    } catch { /* nuvem ilegível: trata como indeterminado, nada é postado */ }
  }
  return false;
}

/**
 * D2 — leitura no boot e ao voltar de >= 5 min escondido: a MESMA reconciliação, que só adota se a
 * revisão da nuvem for maior e não houver mudança pendente. NÃO suspende o POST (é só uma leitura;
 * sem adoção, o 409 do próximo POST decide). Nunca depende de `[gameState]`. Devolve o desinstalador.
 */
export function instalarLeituraD2(c: {
  /** Carga degradada (L08) em curso: o efeito de mount dela é quem decide. */
  degradada: { current: string | null };
  reconciliando: { current: boolean };
  lendo: { current: boolean };
  estadoAtual: () => unknown;
  reconciliar: (motivo: 'boot' | 'visivel') => Promise<boolean>;
}): () => void {
  const roda = (motivo: 'boot' | 'visivel') => {
    if (c.degradada.current || c.reconciliando.current || c.lendo.current) return;
    const saveId = readLocal(STORAGE_KEYS.SAVE_ID);
    if (!saveId || lerRevisao(saveId) === null || isDemoMode(c.estadoAtual() as DemoCarrier | null)) return;
    c.lendo.current = true;
    void c.reconciliar(motivo).catch(() => {}).finally(() => { c.lendo.current = false; });
  };
  roda('boot');
  let escondidoEm: number | null = null;
  const onVis = () => {
    if (document.visibilityState === 'hidden') { escondidoEm = Date.now(); return; }
    const ficou = escondidoEm === null ? 0 : Date.now() - escondidoEm;
    escondidoEm = null;
    if (ficou >= 5 * 60_000) roda('visivel');
  };
  document.addEventListener('visibilitychange', onVis);
  return () => document.removeEventListener('visibilitychange', onVis);
}

/**
 * Roda `passo` e, enquanto devolver `false` (decisão não final), repete com recuo
 * (30 s, 60 s, 2 min, 4 min: até 4 repetições). Devolve o cancelador.
 */
export function repetirComRecuo(passo: () => Promise<boolean>): () => void {
  let cancelado = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tentar = async (tentativa: number) => {
    let fim = false;
    try { fim = await passo(); } catch { /* leitura que lança = indeterminada: repete com recuo, nunca vira rejeição solta */ }
    if (cancelado || fim) return;
    if (tentativa < 4) timer = setTimeout(() => { void tentar(tentativa + 1); }, 30000 * 2 ** tentativa);
  };
  void tentar(0);
  return () => { cancelado = true; if (timer) clearTimeout(timer); };
}
