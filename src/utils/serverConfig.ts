/**
 * O que o SERVIDOR diz sobre si mesmo — `/api/config`, do lado do app web.
 *
 * O app de desktop já perguntava isso (`desktop/renderer/src/cloudSync.ts`);
 * o web nunca perguntou, porque até 09/09/2026 nada dependia da resposta. O
 * microfone passou a depender: `transcribeAvailable` é false quando o servidor
 * não tem provedor de transcrição configurado, e nesse caso o botão de gravar
 * **não é desenhado**. Botão que existe e falha é pior que botão que não
 * existe — foi exatamente o estado em que o microfone ficou meses.
 *
 * ## As três regras deste módulo
 *
 * 1. **Uma busca por sessão.** A resposta é cacheada por 5 minutos na borda e
 *    muda só em deploy; refazer a cada montagem do chat seria uma requisição
 *    por abertura de tela para um valor que não muda.
 * 2. **Falha = tudo desligado.** Sem rede, com 500, com JSON torto: os campos
 *    voltam `false`. Um botão que aparece porque a checagem falhou é
 *    exatamente o modo de falha que este módulo existe para impedir.
 * 3. **Nunca lança.** Quem chama está no meio de uma pintura de tela.
 */

export interface ServerConfig {
  /** Todas as rotas de save/dinheiro exigem ID token do Firebase. */
  authRequired: boolean;
  /** `/api/transcribe` tem provedor configurado. */
  transcribeAvailable: boolean;
}

const DESLIGADO: ServerConfig = { authRequired: false, transcribeAvailable: false };

/** A promessa em voo, para N chamadas simultâneas virarem UMA requisição. */
let emVoo: Promise<ServerConfig> | null = null;

export function fetchServerConfig(): Promise<ServerConfig> {
  if (!emVoo) {
    emVoo = fetch('/api/config')
      .then(r => (r.ok ? r.json() : null))
      .then((d: Partial<ServerConfig> | null) => ({
        authRequired: d?.authRequired === true,
        transcribeAvailable: d?.transcribeAvailable === true,
      }))
      .catch(() => DESLIGADO);
  }
  return emVoo;
}

/** Só para teste: esquece a resposta cacheada desta sessão. */
export function resetServerConfigCache(): void {
  emVoo = null;
}
