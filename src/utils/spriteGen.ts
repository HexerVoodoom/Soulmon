// Cliente de geração de sprite: chama a Function /api/generate-sprite (Gemini)
// e converte a imagem retornada em sprite v-pet DE VERDADE via o Pixelador,
// sem o usuário precisar copiar prompt ou fazer upload.
import { pixelizeBuffer } from './pixelizer';
import { isSafeSpriteUrl } from './spriteLibrary';
import { aiFetch } from './aiClient';
import { classifyCloudSaveStatus, CLOUD_SAVE_POLICY } from './cloudSave';

export interface SpriteGenOptions {
  grid?: number;          // lado do grid final (default 16)
  colors?: number;        // teto de cores (default 4)
  transparentBg?: boolean; // remove fundo (default true; prompts usam fundo preto)
  scale?: number;         // ampliação do PNG final (default 16 → 256px em 16x16)
}

/**
 * Por que a geração parou. **409 e 402 são contratos DIFERENTES** e o cliente
 * não pode confundi-los (`custo-geracao-sprite.md` §5 + `_aiGuard.js:217-256`):
 *
 *  - `lifetime-cap` (**402**) — a CONTA estourou o teto vitalício. Para para
 *    sempre, em todas as formas.
 *  - `form-cap` (**409**) — ESTA forma esgotou as 3 tentativas dela
 *    (`perFormLifetime`). A conta segue inteira; as outras dez formas
 *    continuam abertas. Tratar isto como 402 desligaria a árvore toda por
 *    causa de um galho — a punição no clímax que o teto por forma existe para
 *    evitar (`spec-geracao-incremental.md` §3.4).
 *
 * `pending` (**202**) **não é erro**: outro aparelho está gerando a mesma
 * forma. O visor fica na reserva e a gente repergunta depois.
 *
 * **401 e 403 também são contratos diferentes** (item 0.2 do
 * `preparo-fatia1.md`), e os nomes vêm EMPRESTADOS de `cloudSave.ts` em vez de
 * inventados aqui — um segundo dicionário para o mesmo par de códigos HTTP
 * divergiria em silêncio, e a copy de produto (§0.4) passaria a depender de
 * qual arquivo quem escreve tiver aberto:
 *
 *  - `auth` (**401**) — o token venceu. O SDK do Firebase renova sozinho de
 *    hora em hora, então retentar AJUDA; só a insistência é que vira "faça
 *    login".
 *  - `identity` (**403**) — o token é bom, o `SAVE_ID` do aparelho é que não é
 *    o derivado do e-mail. Retentar dá 403 de novo e re-login TAMBÉM não
 *    conserta — quem conserta é `reconcileSaveId`. Colapsar isto em `auth`
 *    manda o jogador logar de novo para tomar 403 de novo, para sempre.
 *
 * Enquanto o `_aiGuard.js` estiver com `enforced: false` nenhum dos dois
 * aparece; o dia em que a fatia 1 ligar o gate, eles aparecem os dois de uma
 * vez, e é tarde para descobrir a diferença ali.
 */
export type SpriteGenReason =
  | 'pending'
  | 'lifetime-cap'
  | 'form-cap'
  | 'daily-limit'
  | 'budget'
  | 'not-configured'
  | 'auth'
  | 'identity'
  | 'error';

export class SpriteGenError extends Error {
  readonly reason: SpriteGenReason;
  readonly status: number;
  /** Segundos sugeridos pelo servidor para repergunta (só no 202). */
  readonly retryAfter?: number;
  /** Mensagem PT/EN do servidor, quando existir (`AI_REFUSAL_MESSAGES`). */
  readonly serverMessage?: { 'pt-BR': string; en: string };

  constructor(
    reason: SpriteGenReason,
    status: number,
    message: string,
    extra: { retryAfter?: number; serverMessage?: { 'pt-BR': string; en: string } } = {},
  ) {
    super(message);
    this.name = 'SpriteGenError';
    this.reason = reason;
    this.status = status;
    this.retryAfter = extra.retryAfter;
    this.serverMessage = extra.serverMessage;
  }

  /**
   * Retentar tem chance de mudar alguma coisa?
   *
   * Nas duas razões que este arquivo COMPARTILHA com `cloudSave.ts`, quem
   * responde é a `CLOUD_SAVE_POLICY` — a decisão de retentar 401 e 403 é a
   * mesma decisão, e escrevê-la duas vezes é garantir que uma delas envelheça.
   * Nas demais, o motivo é de produto (cota, teto por forma, orçamento) e a
   * política é local: porta que acabou de fechar não reabre por insistência.
   */
  get retryable(): boolean {
    const compartilhada = POLITICA_COMPARTILHADA[this.reason];
    return compartilhada ? compartilhada.retentavel : this.reason === 'error';
  }
}

/** As razões que `spriteGen` e `cloudSave` nomeiam do MESMO jeito. */
const POLITICA_COMPARTILHADA: Partial<Record<SpriteGenReason, { retentavel: boolean }>> = {
  auth: CLOUD_SAVE_POLICY.auth,
  identity: CLOUD_SAVE_POLICY.identity,
};

/** Traduz o par (status, `error`) do servidor no motivo do cliente. */
function reasonFor(status: number, code: unknown): SpriteGenReason {
  if (status === 202) return 'pending';
  if (status === 402) return 'lifetime-cap';
  if (status === 409) return 'form-cap';
  if (status === 429) return 'daily-limit';
  // 401/403: o classificador do save é a fonte única. Ele não serve para os
  // outros códigos — 409 lá é `conflict` de revisão, aqui é teto POR FORMA —,
  // por isso a delegação é ESTREITA e vem depois dos casos de produto.
  if (status === 401 || status === 403) {
    return classifyCloudSaveStatus(status) as 'auth' | 'identity';
  }
  if (status === 503) {
    return code === 'ai-monthly-budget-reached' || code === 'ai-daily-budget-reached'
      ? 'budget'
      : 'not-configured';
  }
  return 'error';
}

export interface RequestSpriteOptions {
  /** Cadeia de evolução (Higgsfield image2image): o sprite do nível anterior. */
  referenceImageUrls?: string[];
  /** Prompt SEM as referências de gênero. O servidor só usa este se a primeira
   *  tentativa (com referências) for RECUSADA — ver generate-sprite.js. */
  promptFallback?: string;
  /**
   * A forma da árvore que está sendo desenhada (`rookie`,
   * `champion-power`, …, `ultra`).
   *
   * ⚠️ **Sem isto o teto POR FORMA não tem o que separar.** O servidor já lê e
   * repassa `formId` (`generate-sprite.js:181,205`) e já implementa
   * `perFormLifetime: 3` (`_aiGuard.js:157,217-256`), mas por decisão
   * consciente (`_aiGuard.js:179-186`) a ausência não destrava nada — só deixa
   * de haver disjuntor local, e um loop de retentativa numa forma só passa a
   * consumir o vitalício de 26 da conta inteira.
   */
  formId?: string;
  signal?: AbortSignal;
}

/** Chama o backend e devolve a imagem crua (URL/data URL) gerada pela IA. */
export async function requestSprite(
  prompt: string,
  options: RequestSpriteOptions = {},
): Promise<{ image: string; provider?: string; cached?: boolean }> {
  const { referenceImageUrls, promptFallback, formId, signal } = options;
  // aiFetch acrescenta o saveId e o token — o servidor recusa sem eles
  // (_aiGuard.js). Esta é a rota que custa dinheiro de verdade.
  let res: Response;
  try {
    res = await aiFetch(
      '/api/generate-sprite',
      { prompt, referenceImageUrls, promptFallback, formId },
      { signal },
    );
  } catch (err) {
    // Rede caiu antes de chegar ao servidor: nada foi cobrado, nada consome
    // teto (`custo-geracao-sprite.md` §6, "offline não consome nada").
    throw new SpriteGenError('error', 0, err instanceof Error ? err.message : 'network error');
  }

  const body = (await res.json().catch(() => ({}))) as {
    image?: string;
    provider?: string;
    cached?: boolean;
    pending?: boolean;
    retryAfter?: number;
    error?: string;
    message?: { 'pt-BR': string; en: string };
  };

  if (res.status === 202 || body.pending) {
    throw new SpriteGenError('pending', 202, body.error || 'another device is generating', {
      retryAfter: body.retryAfter,
      serverMessage: body.message,
    });
  }
  if (!res.ok) {
    throw new SpriteGenError(
      reasonFor(res.status, body.error),
      res.status,
      body.error || `sprite generation failed (${res.status})`,
      { serverMessage: body.message },
    );
  }
  if (!body.image) throw new SpriteGenError('error', res.status, 'empty image');
  return { image: body.image, provider: body.provider, cached: body.cached };
}

/**
 * Carrega uma data URL num HTMLImageElement.
 *
 * **F-1, segunda porta** (`auditoria-cliente.md`): `img.src = src` e um
 * `<img src>` de verdade, e o `src` veio da REDE (`requestSprite` ->
 * `body.image`). Nao executa script -- `<img>` nunca executou `javascript:`
 * nem `data:text/html` --, mas dispara um GET para o host de quem controlou a
 * resposta, que e o mesmo beacon do achado. A guarda e **a mesma funcao** do
 * acervo (`isSafeSpriteUrl`): um segundo dicionario de esquema divergiria em
 * silencio, exatamente o erro que `SpriteFailKind` evita ao emprestar os nomes
 * de `cloudSave.ts`.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!isSafeSpriteUrl(src)) {
      reject(new Error('image url: esquema fora da allowlist'));
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not decode image'));
    img.src = src;
  });
}

/**
 * Pixeliza uma imagem (data URL) em sprite v-pet: recorte quadrado central →
 * redução ao grid → quantização de paleta → reamplia com pixels duros.
 * Roda no browser (usa <canvas>).
 */
export async function pixelizeDataUrl(dataUrl: string, opts: SpriteGenOptions = {}): Promise<string> {
  const grid = opts.grid ?? 16;
  const colors = opts.colors ?? 4;
  const transparentBg = opts.transparentBg ?? true;
  const scale = opts.scale ?? 16;

  const img = await loadImage(dataUrl);
  const small = document.createElement('canvas');
  small.width = grid;
  small.height = grid;
  const ctx = small.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, grid, grid);

  const buf = ctx.getImageData(0, 0, grid, grid);
  pixelizeBuffer(buf.data, grid, grid, { colors, transparentBg });
  ctx.putImageData(buf, 0, 0);

  const out = document.createElement('canvas');
  out.width = grid * scale;
  out.height = grid * scale;
  const octx = out.getContext('2d');
  if (!octx) throw new Error('canvas unavailable');
  octx.imageSmoothingEnabled = false;
  octx.drawImage(small, 0, 0, out.width, out.height);
  return out.toDataURL('image/png');
}

/** Gera + pixeliza um único prompt. Devolve o sprite final (data URL). */
export async function generateSprite(
  prompt: string,
  opts?: SpriteGenOptions,
  promptFallback?: string,
  /** Ver `RequestSpriteOptions.formId` — é o que liga o teto por forma. */
  formId?: string,
): Promise<string> {
  const { image } = await requestSprite(prompt, { promptFallback, formId });
  return pixelizeDataUrl(image, opts);
}

export interface StagePrompt { key: string; prompt: string; promptFallback?: string; formId?: string }
export interface StageSprite { key: string; sprite: string }

/**
 * Gera as N formas em sequência (evita rajada de chamadas simultâneas ao
 * backend), reportando progresso. Retorna o que conseguiu; erros por forma
 * são acumulados sem abortar as demais.
 */
export async function generateAllSprites(
  stages: StagePrompt[],
  opts: SpriteGenOptions & { onProgress?: (done: number, total: number, key: string) => void } = {},
): Promise<{ sprites: StageSprite[]; errors: Array<{ key: string; message: string }> }> {
  const sprites: StageSprite[] = [];
  const errors: Array<{ key: string; message: string }> = [];
  for (let i = 0; i < stages.length; i++) {
    const { key, prompt, promptFallback, formId } = stages[i];
    try {
      const sprite = await generateSprite(prompt, opts, promptFallback, formId);
      sprites.push({ key, sprite });
    } catch (err) {
      errors.push({ key, message: err instanceof Error ? err.message : String(err) });
    }
    opts.onProgress?.(i + 1, stages.length, key);
  }
  return { sprites, errors };
}
