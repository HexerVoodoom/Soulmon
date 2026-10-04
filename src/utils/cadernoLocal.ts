/**
 * CADERNO — a ponte com o aparelho (04/10/2026, `docs/PLANO-OFICINA-FOCO.md` §3 e REGISTRO §22).
 *
 * O dado mora em `GameState.caderno` (save na nuvem do próprio titular; tipo, tetos e
 * sanitização em `cadernoSave.ts`). Este módulo guarda só o que é do APARELHO:
 *  · (a migração das anotações da 1ª versão, `loadLegacyEntries`/`clearLegacy`, mora em
 *    `cadernoSave.ts` para o `App` não puxar o léxico de crise ao chunk de entrada);
 *  · o sinal de sofrimento (`needsBridge`, o léxico do chat), calculado no aparelho sobre o
 *    rascunho, só para mostrar a linha de apoio — nunca bloqueia, nunca é gravado.
 * ⚠️ O texto do Caderno é SENSÍVEL: não entra em IA/chat/telemetria/perfil público.
 */
import { needsBridge } from './chatSafety';
export * from './cadernoSave';

/** O sinal de sofrimento no texto (o léxico do chat), local, só para mostrar a linha de apoio. */
export const sinaisDeSofrimento = needsBridge;
