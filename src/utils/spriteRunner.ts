/**
 * O EXECUTOR de um lote de geração — serial, com recuo, e sem React.
 *
 * Regras que vêm de fora e não se reinventam aqui:
 *  - **Um lote por vez, serial** (`spec-geracao-incremental.md` §3.3): duas
 *    vésperas acumuladas viram dois lotes em sequência, nunca 6 requisições
 *    simultâneas. Rajada em rede ruim é como se transforma lentidão em falha.
 *  - **2 retentativas automáticas, recuo 60 s e 10 min** (`custo-geracao-sprite.md`
 *    §6). Além disso, o que falha duas vezes com 10 min de intervalo está fora
 *    do ar, não instável.
 *  - **Não retenta nunca**: 402, **403**, 409, 429, 503 e recusa já refeita.
 *    Retentar uma porta que acabou de fechar só gasta.
 *  - **401 retenta UMA vez, não duas** (ver `RETENTATIVAS_POR_MOTIVO`).
 *  - **402 (`lifetime-cap`) aborta o lote inteiro** — a conta parou. **409
 *    (`form-cap`) aborta só ESTA forma** — as outras do lote seguem. É a
 *    diferença que o §3.4 chama de "falha local em vez de punição no clímax".
 *
 * `sleep` entra por parâmetro para o teste não esperar 10 minutos de verdade.
 */
import { SpriteGenError, type SpriteGenReason } from './spriteGen';
import type { SpriteEntry, SpriteFailKind } from './spriteLibrary';

/** Recuo entre as duas retentativas automáticas, em ms. */
export const SPRITE_RETRY_BACKOFF_MS = [60_000, 10 * 60_000] as const;

export interface SpriteRunnerDeps {
  /** Pede UMA forma ao servidor. Deve lançar `SpriteGenError`. */
  generate: (formId: string) => Promise<SpriteEntry>;
  onResult: (formId: string, entry: SpriteEntry) => void;
  onFailure: (formId: string, kind: SpriteFailKind) => void;
  sleep?: (ms: number) => Promise<void>;
  /** Cancelamento cooperativo (troca de tela, app em background). */
  isCancelled?: () => boolean;
}

const defaultSleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * Quantas retentativas AUTOMÁTICAS este motivo merece, quando a política do
 * `spriteGen` já disse que retentar tem alguma chance.
 *
 * O padrão são as duas do §6 do custo (60 s e 10 min). A exceção é o **401**:
 * `CLOUD_SAVE_POLICY.auth` diz `retentavel: true` porque o SDK do Firebase
 * renova o token de hora em hora e **uma** retentativa pega a renovação — mas
 * a segunda, com recuo de 10 minutos, é bateria gasta numa sessão morta, que
 * só o login conserta. Retentar não é binário aqui: é um orçamento.
 *
 * O que NÃO está neste mapa cai no padrão de propósito — `error` transitório e
 * `pending` (202) continuam com as duas.
 */
const RETENTATIVAS_POR_MOTIVO: Partial<Record<SpriteGenReason, number>> = {
  auth: 1,
};

function orcamentoDeRetentativa(err: unknown): number {
  const padrao = SPRITE_RETRY_BACKOFF_MS.length;
  if (!(err instanceof SpriteGenError)) return padrao;
  return RETENTATIVAS_POR_MOTIVO[err.reason] ?? padrao;
}

/**
 * Como o cliente classifica cada falha para o acervo (`spriteLibrary`).
 *
 * ⚠️ Este `switch` **não pode** deixar `auth`/`identity` caírem no `default`:
 * gravar 401 e 403 como `error` genérico apaga a única informação que diz ao
 * jogador o que fazer (logar de novo × reconciliar o `SAVE_ID`) e faz o card
 * nascer mudo. O vocabulário é o mesmo de `cloudSave.ts` e `spriteGen.ts`.
 */
function kindOf(err: unknown): SpriteFailKind {
  if (err instanceof SpriteGenError) {
    switch (err.reason) {
      case 'lifetime-cap': return 'lifetime-cap';
      case 'form-cap': return 'form-cap';
      case 'daily-limit': return 'daily-limit';
      case 'budget': return 'budget';
      case 'auth': return 'auth';
      case 'identity': return 'identity';
      // Rede que nem chegou ao servidor (status 0) não cobrou nada e não
      // consome teto — é o "offline" do §6 do custo.
      case 'error': return err.status === 0 ? 'offline' : 'error';
      default: return 'error';
    }
  }
  return 'error';
}

export interface SpriteRunResult {
  done: string[];
  failed: Array<{ formId: string; kind: SpriteFailKind }>;
  /** O lote parou no meio porque a CONTA estourou (402) ou foi cancelado. */
  aborted: boolean;
}

export async function runSpriteBatch(
  formIds: readonly string[],
  deps: SpriteRunnerDeps,
): Promise<SpriteRunResult> {
  const sleep = deps.sleep ?? defaultSleep;
  const out: SpriteRunResult = { done: [], failed: [], aborted: false };

  for (const formId of formIds) {
    if (deps.isCancelled?.()) { out.aborted = true; return out; }

    let attempt = 0;
    for (;;) {
      try {
        const entry = await deps.generate(formId);
        deps.onResult(formId, entry);
        out.done.push(formId);
        break;
      } catch (err) {
        const kind = kindOf(err);
        const pending = err instanceof SpriteGenError && err.reason === 'pending';
        const retryable = pending || (err instanceof SpriteGenError ? err.retryable : true);

        if (retryable && attempt < orcamentoDeRetentativa(err) && !deps.isCancelled?.()) {
          // 202 não é erro e não conta tentativa: outro aparelho está gerando a
          // MESMA forma, e o servidor pediu para repergunta (`retryAfter`).
          const wait = pending && err instanceof SpriteGenError && err.retryAfter
            ? err.retryAfter * 1000
            : SPRITE_RETRY_BACKOFF_MS[attempt];
          attempt += 1;
          await sleep(wait);
          continue;
        }

        // 202 esgotado: fica na reserva, sem marcar falha nenhuma — ninguém
        // errou, e o outro aparelho vai gravar o resultado no save comum.
        if (!pending) deps.onFailure(formId, kind);
        out.failed.push({ formId, kind: pending ? 'offline' : kind });
        // A conta inteira parou: nada mais neste lote pode dar certo.
        if (kind === 'lifetime-cap') { out.aborted = true; return out; }
        break;
      }
    }
  }

  return out;
}
