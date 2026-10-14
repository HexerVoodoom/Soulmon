/**
 * DONO ÚNICO DO FIM DE SESSÃO (fix/logout-limpa-estado, beta-play-01).
 *
 * Bug do dono: "quando deslogo de uma conta, o jogo continua com as informações
 * localmente como se nada tivesse sido deslogado". Causa raiz: "Sair da conta"
 * só chamava `signOut()` do Firebase. O save (`soulmon_state_v1`), o `saveId`
 * derivado do e-mail, o e-mail, as flags de onboarding e tudo mais ficavam no
 * aparelho e o estado seguia VIVO em memória (o efeito de persistência do
 * `GameStateContext` regravava o save a cada mudança). Pior: o login seguinte
 * caía em `consultarContaNaNuvem → 'nova'` e SUBIA o save da conta anterior para
 * a conta nova ("chave derivada vazia: o estado local é o que vale").
 *
 * Existiam três caminhos divergentes de "sair" (`AccountSection`,
 * `trocarContaBetaFechado`, `reagirContaExcluida`) e um quarto que não limpava
 * nada (exclusão de conta). Agora todos passam por `encerrarSessao`.
 *
 * Ordem (cada passo é "melhor esforço" e nunca impede o seguinte):
 *   1. sinaliza "encerrando": o `GameStateContext` para de regravar save/POST;
 *   2. (opcional) cópia de segurança em `RECONCILE_KEYS.CONFLICT_BACKUP`;
 *   3. revoga o push deste aparelho (Web Push + FCM) — `revokePushBeforeDelete`;
 *   4. `signOut` (Firebase + Credential Manager no APK);
 *   5. apaga o estado local da conta — tudo que é `soulmon*`/`digiapp*` e NÃO está
 *      em `SOBREVIVEM_AO_LOGOUT`;
 *   6. zera as stores em memória (assinatura; admin) e recarrega → tela de entrada.
 *
 * O passo "sincronizar antes" (`sincronizarAntesDeSair`) é separado, porque
 * depende de decisão da pessoa quando falha (a tela oferece "Exportar backup").
 */
import { readLocal, writeLocal, removeLocal, listLocalKeys } from './safeStorage';
import { STORAGE_KEYS, RECONCILE_KEYS } from './storageKeys';
import { isDemoMode, type DemoCarrier } from './demoMode';

export type MotivoSaida = 'logout' | 'beta-closed' | 'account-deleted';

/**
 * ALLOWLIST do que SOBREVIVE ao fim de sessão: é do APARELHO ou é rede de
 * segurança, não da PESSOA. A régua viva é `sessionReset.contract.test.ts`.
 *
 *  · idioma, tema, som (mudo/volumes/trilha/tema), velocidade da masmorra,
 *    vibração do foco, "instalar o PWA" dispensado → preferência do aparelho;
 *  · avisos de Termos já lidos → o aviso é por aparelho (`termsNotice`);
 *  · telemetria: consentimento (`enabled`) é decisão sobre o APARELHO e continua;
 *    id pseudônimo é aleatório e "não religável à conta" (cabeçalho de
 *    `telemetry.ts`); fila/dedupe/dia de instalação são do aparelho. O que é de
 *    CONTA (`tier`, `week`) NÃO está aqui e é apagado;
 *  · `CONFLICT_BACKUP`/`PREVIOUS_SAVE_ID` → rastro forense: apagar derrotaria o
 *    propósito (recuperar progresso por suporte/exportar);
 *  · `ACCOUNT_DELETED_NOTICE` → o portão lê UMA vez depois do reload;
 *  · `PENDING_LOGIN_EMAIL` → reconfirmação do login por link em andamento.
 */
export const SOBREVIVEM_AO_LOGOUT: readonly string[] = [
  STORAGE_KEYS.LANGUAGE,
  STORAGE_KEYS.THEME,
  STORAGE_KEYS.SOUND_MUTED,
  STORAGE_KEYS.SOUND_CATEGORY_VOLUMES,
  STORAGE_KEYS.SOUND_TRACK_ENABLED,
  STORAGE_KEYS.SOUND_THEME_OFF,
  STORAGE_KEYS.DUNGEON_SPEED,
  STORAGE_KEYS.FOCO_VIBRATE,
  STORAGE_KEYS.PWA_INSTALL_DISMISSED,
  STORAGE_KEYS.TERMS_NOTICE_SEEN,
  STORAGE_KEYS.TERMS_NOTICE_SHOWN,
  STORAGE_KEYS.ACCOUNT_DELETED_NOTICE,
  STORAGE_KEYS.PENDING_LOGIN_EMAIL,
  RECONCILE_KEYS.CONFLICT_BACKUP,
  RECONCILE_KEYS.PREVIOUS_SAVE_ID,
  // telemetria (literais: as chaves moram privadas em `telemetry.ts` — o contrato confere)
  'soulmon-telemetry-enabled',
  'soulmon-telemetry-id',
  'soulmon-telemetry-queue',
  'soulmon-telemetry-hidden',
  'soulmon-telemetry-seen',
  'soulmon-telemetry-install',
  'soulmon-telemetry-music-day',
];

/** Chaves do app: o prefixo do produto (e o legado `digiapp`). Chave alheia nunca é tocada. */
export const PREFIXO_DO_APP = /^(soulmon|digiapp)[-_]/;

/** Tudo que o fim de sessão apaga HOJE: chaves presentes + chaves conhecidas, menos a allowlist. */
export function chavesDaConta(): string[] {
  const vivas = new Set<string>(listLocalKeys().filter(k => PREFIXO_DO_APP.test(k)));
  for (const k of Object.values(STORAGE_KEYS)) vivas.add(k);
  for (const k of ['soulmon-telemetry-tier', 'soulmon-telemetry-week', 'soulmon-chat-feedback-day']) vivas.add(k);
  return [...vivas].filter(k => !SOBREVIVEM_AO_LOGOUT.includes(k));
}

/** Apaga o estado local da conta. Síncrono; devolve as chaves que tentou apagar. */
export function limparEstadoLocalDaConta(): string[] {
  const alvo = chavesDaConta();
  for (const k of alvo) removeLocal(k, { silent: true });
  return alvo;
}

// ─────────────────────────────────────────────── sessão "encerrando" ──

let encerrando = false;
/** O `GameStateContext` consulta isto antes de gravar/enviar: estado em memória não ressuscita o que foi apagado. */
export function sessaoEncerrando(): boolean { return encerrando; }
/** Só para teste. */
export function __resetSessaoEncerrando(): void { encerrando = false; }

// ─────────────────────────────────────────────── mudança ainda não enviada ──

/** Contador de mutações: um POST antigo que volta `ok` não pode limpar a pendência de uma mutação mais nova. */
let versao = 0;
export function marcarMudancaPendente(): number {
  versao += 1;
  writeLocal(STORAGE_KEYS.SYNC_PENDING, '1', { silent: true });
  return versao;
}
export function marcarSincronizado(daVersao: number): void {
  if (daVersao === versao) removeLocal(STORAGE_KEYS.SYNC_PENDING, { silent: true });
}
export function temSyncPendente(): boolean { return readLocal(STORAGE_KEYS.SYNC_PENDING) === '1'; }

// ─────────────────────────────────────────────── sincronizar antes de sair ──

export const SYNC_ANTES_DE_SAIR_TIMEOUT_MS = 10_000;

export type ResultadoSyncAntesDeSair =
  /** Nada a enviar (sem conta, demo, sem pendência) ou a nuvem confirmou. */
  | { estado: 'ok' }
  /** Não deu. `offline` separa "sem internet" dos demais para o texto. */
  | { estado: 'falhou'; offline: boolean };

/**
 * Tenta mandar o save pendente para a nuvem ANTES de apagar. Nunca lança.
 * Sem rede (ou resposta que não é ok) = `falhou` → a tela avisa e oferece
 * "Exportar backup"; quem chama NÃO apaga sozinho nesse caso.
 */
export async function sincronizarAntesDeSair(): Promise<ResultadoSyncAntesDeSair> {
  try {
    const saveId = readLocal(STORAGE_KEYS.SAVE_ID);
    const bruto = readLocal(STORAGE_KEYS.GAME_STATE);
    if (!saveId || !bruto || !temSyncPendente()) return { estado: 'ok' };
    let state: unknown;
    try { state = JSON.parse(bruto); } catch { return { estado: 'ok' }; /* ilegível: nada que a nuvem aceite */ }
    // DEMO LOCAL: nada sai do aparelho (mesma regra do `cloudSave`).
    if (isDemoMode(state as DemoCarrier | null | undefined)) return { estado: 'ok' };
    const { cloudSave } = await import('./cloudSave');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const limite = new Promise<'timeout'>(r => { timer = setTimeout(() => r('timeout'), SYNC_ANTES_DE_SAIR_TIMEOUT_MS); });
    const r = await Promise.race([cloudSave(saveId, state), limite]);
    if (timer) clearTimeout(timer);
    if (r === 'timeout') return { estado: 'falhou', offline: true };
    if (r.ok) { removeLocal(STORAGE_KEYS.SYNC_PENDING, { silent: true }); return { estado: 'ok' }; }
    // 410: a conta foi excluída em outro aparelho — não há nuvem a proteger.
    if (r.kind === 'deleted') return { estado: 'ok' };
    return { estado: 'falhou', offline: r.kind === 'offline' || r.kind === 'server' };
  } catch {
    return { estado: 'falhou', offline: true };
  }
}

// ─────────────────────────────────────────────── backup local ──

/** Cópia do save local no lugar que o suporte já procura (mesmo formato dos outros fluxos). */
export function guardarCopiaDeSeguranca(motivo: string): boolean {
  const bruto = readLocal(STORAGE_KEYS.GAME_STATE);
  if (!bruto) return false;
  let state: unknown = bruto;
  try { state = JSON.parse(bruto); } catch { /* guarda o texto cru */ }
  return writeLocal(RECONCILE_KEYS.CONFLICT_BACKUP, JSON.stringify({
    saveId: readLocal(STORAGE_KEYS.SAVE_ID) ?? '',
    salvoEm: new Date().toISOString(),
    motivo,
    state,
  }), { silent: true });
}

/** Conteúdo do arquivo "Exportar backup": o save local, como está. `null` = não há save. */
export function montarBackupLocal(now = new Date()): { nome: string; json: string } | null {
  const bruto = readLocal(STORAGE_KEYS.GAME_STATE);
  if (!bruto) return null;
  let state: unknown = bruto;
  try { state = JSON.parse(bruto); } catch { /* texto cru */ }
  return {
    nome: `soulmon-backup-${now.toISOString().slice(0, 10)}.json`,
    json: JSON.stringify({ format: 'soulmon-local-backup-v1', generatedAt: now.toISOString(), state }, null, 2),
  };
}

/** Entrega o arquivo. `false` quando o ambiente não sabe baixar (jsdom, WebView antigo) ou não há save. */
export function baixarBackupLocal(now = new Date()): boolean {
  const b = montarBackupLocal(now);
  if (!b) return false;
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return false;
  try {
    const url = URL.createObjectURL(new Blob([b.json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = b.nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────── o dono ──

export interface EncerrarSessaoOpts {
  motivo: MotivoSaida;
  /** Guarda cópia do save local antes de apagar (padrão: sim, salvo exclusão de conta — a pessoa pediu para apagar). */
  copiaDeSeguranca?: boolean;
  /** Revoga o push deste aparelho (padrão: sim). */
  revogarPush?: boolean;
  /** Injetável para teste; padrão = recarregar a página. `null` = não recarrega (quem chama mostra uma despedida). */
  recarregar?: (() => void) | null;
}

/**
 * Destino final do "Sair": a ENTRADA do app (portão/onboarding), nunca uma tela
 * interna. (1) a entrada atual do `history` vira a Home e perde `?query`/`#hash`
 * (nada de rota/estado de tela interna sobrevivendo); (2) recarrega, e sem save
 * nem sessão o app abre no portão de login. Web/PWA e Android (WebView do
 * Capacitor) usam o mesmo caminho. Nunca lança.
 */
export function irParaEntradaDoApp(): void {
  try {
    const w = globalThis as unknown as { location?: Location; history?: History };
    w.history?.replaceState?.({ smView: 'home' }, '', w.location?.pathname ?? '/');
  } catch { /* history indisponível (sandbox): o reload ainda leva à entrada */ }
  try { globalThis.location?.reload(); } catch { /* sem window */ }
}

/** Nunca lança. Idempotente no efeito: chamar duas vezes apaga duas vezes o que já não existe. */
export async function encerrarSessao(opts: EncerrarSessaoOpts): Promise<void> {
  encerrando = true;
  try {
    const copia = opts.copiaDeSeguranca ?? opts.motivo !== 'account-deleted';
    if (copia) guardarCopiaDeSeguranca(opts.motivo);

    if (opts.revogarPush ?? (opts.motivo !== 'account-deleted')) {
      try { const { revokePushBeforeDelete } = await import('./accountData'); await revokePushBeforeDelete(); } catch { /* push é melhor esforço */ }
    }
    try { const { signOut } = await import('./auth'); await signOut(); } catch { /* sem sessão para encerrar */ }

    limparEstadoLocalDaConta();

    try { const { clearSubscriptionStatus } = await import('./subscription'); clearSubscriptionStatus(); } catch { /* store ausente */ }
    try { const { setAdminFlag } = await import('./adminFlag'); setAdminFlag(false); } catch { /* store ausente */ }
  } finally {
    if (opts.recarregar !== null) {
      const rec = opts.recarregar ?? irParaEntradaDoApp;
      rec();
    }
  }
}
