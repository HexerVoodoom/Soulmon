/**
 * TAMANHO DO SOULMON NA TELA — dono único (20/10/2026, REGISTRO §150).
 *
 * Regra do dono: o tamanho do bicho depende do ESTÁGIO. O rookie é pequeno e
 * cresce (ou não) ao evoluir; há Soulmon que fica pequenininho até o mega; um
 * rookie grande existe, mas é EXTREMAMENTE raro. Cada tela dimensionava o
 * sprite por conta própria e o sprite do Oráculo (acervo, 512²) vem com caixa
 * visível (bbox do alfa) variável — o rookie "enorme" era o canvas inteiro
 * preenchido pela criatura.
 *
 * Como funciona: cada estágio declara um ALVO — a fração da caixa de render
 * (`PET_RENDER`) que o lado maior da CAIXA VISÍVEL deve ocupar. O fator
 * aplicado é `alvo / preenchimento medido` (preenchimento = lado maior da bbox
 * do alfa ÷ lado do canvas), nunca uma escala cega pelo canvas. A tela só
 * aplica `petScaleStyle(fator)` (propriedade CSS `scale`, origem nos PÉS): o
 * layout, a linha do chão e os alvos de toque ficam onde estavam.
 *
 * A variação por criatura é DETERMINÍSTICA (hash da semente do save), nunca
 * `Math.random` por render: o mesmo bicho tem sempre o mesmo porte.
 *
 * Funções puras, sem React. Só `measureVisibleFill` toca canvas (e cai no
 * conservador `FAILED_FILL` se o canvas não existir ou a imagem for de outra origem).
 */

export type ScaleStage = 'rookie' | 'champion' | 'ultimate' | 'mega' | 'ultra';

/** Estágios em ordem de evolução (a monotonia é medida nesta ordem). */
export const SCALE_STAGES: readonly ScaleStage[] = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];

/**
 * Alvo POR ESTÁGIO de um bicho de porte padrão: fração da caixa de render que o
 * lado maior da caixa visível ocupa. Rookie ~54% (≈ 70 px de 128; ≈ 105 px na
 * Home com o zoom 1,5 — legível, nunca minúsculo) até ~96% no ultra.
 */
/**
 * A REGRA DO ROOKIE (dono, 28/10/2026, REGISTRO §181): o rookie é desenhado a 50% do tamanho de render que o
 * estágio "normal" teria (`ROOKIE_BASE_TARGET`). É regra de RENDER, nunca de geração: a arte (do Oráculo,
 * do acervo, dos jogadores reais no KV `sprite:blob`) é gerada e guardada em tamanho cheio e NÃO é reduzida no
 * pipeline/prompt/canvas. Dona única — nenhuma tela multiplica por 0,5 por conta própria.
 */
export const ROOKIE_RENDER_RATIO = 0.5;
/** O alvo que o rookie teria sem a regra (era 0,54 até a G1 de 25/10/2026). */
export const ROOKIE_BASE_TARGET = 0.54;

export const STAGE_TARGET: Readonly<Record<ScaleStage, number>> = {
  rookie: ROOKIE_BASE_TARGET * ROOKIE_RENDER_RATIO, // 0,27
  champion: 0.66,
  ultimate: 0.78,
  mega: 0.9,
  ultra: 0.96,
};

/** Preenchimento assumido enquanto a caixa visível não foi medida (arte de linha típica). */
export const DEFAULT_FILL = 0.85;

/**
 * Preenchimento assumido quando a medição FALHOU (canvas tainted, CORS, erro de
 * carga, sem canvas). Conservador: 1 = "o bicho enche o canvas", então o fator
 * vira o próprio `STAGE_TARGET` (sem dividir) — pode sair um pouco pequeno,
 * nunca enorme. (Bug 27/10: sprite gerado/externo aparecia gigante.)
 */
export const FAILED_FILL = 1;

/** Limites do fator: nunca some (< 0,15) nem estoura a caixa (> 1,25). */
export const SCALE_MIN = 0.15;
export const SCALE_MAX = 1.25;

/* ── O PORTE DA CRIATURA ──────────────────────────────────────────────────
   Quatro portes, sorteados UMA vez por hash da semente. `growth` é quanto do
   caminho rookie→estágio o bicho percorre (1 = escada padrão; 0,3 = quase não
   cresce: o "pequenininho até o mega"). `bigRookie` é a exceção rara: o rookie
   nasce com o alvo `BIG_ROOKIE_TARGET` e os estágios seguintes nunca ficam
   abaixo dele (monotonia preservada para TODO porte). */
export type SizeProfile = 'standard' | 'small' | 'tiny' | 'bigRookie';

/** Probabilidades declaradas (somam < 1; o resto é `standard`). */
export const RARE_BIG_ROOKIE_RATE = 0.02;
export const TINY_RATE = 0.1;
export const SMALL_RATE = 0.2;

/** Alvo do rookie grande: o tamanho de um champion/ultimate padrão. */
export const BIG_ROOKIE_TARGET = 0.84;

const GROWTH: Record<SizeProfile, number> = { standard: 1, small: 0.65, tiny: 0.3, bigRookie: 1 };

/** FNV-1a 32 bits + mistura final → [0, 1). Estável entre execuções e aparelhos. */
export function seedUnit(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Porte da criatura, determinístico pela semente. Semente vazia = padrão. */
export function sizeProfileFor(seed: string | undefined | null): SizeProfile {
  if (!seed) return 'standard';
  const u = seedUnit(seed);
  if (u < RARE_BIG_ROOKIE_RATE) return 'bigRookie';
  if (u < RARE_BIG_ROOKIE_RATE + TINY_RATE) return 'tiny';
  if (u < RARE_BIG_ROOKIE_RATE + TINY_RATE + SMALL_RATE) return 'small';
  return 'standard';
}

/** `rookie`/`champion-power`/`mega-x`/`ultra` → estágio da escada (desconhecido = rookie). */
export function scaleStageOf(stage: string | undefined | null): ScaleStage {
  if (typeof stage !== 'string') return 'rookie';
  if (stage === 'ultra') return 'ultra';
  const p = stage.split('-')[0];
  return p === 'champion' || p === 'ultimate' || p === 'mega' ? p : 'rookie';
}

/** Alvo (fração da caixa de render) deste estágio para este porte. Monótono em `SCALE_STAGES`. */
export function targetFor(stage: string | undefined | null, profile: SizeProfile = 'standard'): number {
  const s = scaleStageOf(stage);
  const base = STAGE_TARGET.rookie;
  const rookie = profile === 'bigRookie' ? BIG_ROOKIE_TARGET : base;
  const std = STAGE_TARGET[s];
  const t = rookie + (std - base) * GROWTH[profile];
  return profile === 'bigRookie' ? Math.max(t, BIG_ROOKIE_TARGET) : t;
}

/**
 * Fator de escala final: alvo ÷ preenchimento medido da caixa visível, preso a
 * [`SCALE_MIN`, `SCALE_MAX`]. `fill` é o lado maior da bbox ÷ lado do canvas.
 */
export function petScaleFor(
  stage: string | undefined | null,
  seed: string | undefined | null,
  fill: number = DEFAULT_FILL,
): number {
  const f = Number.isFinite(fill) && fill > 0.05 ? Math.min(fill, 1) : DEFAULT_FILL;
  const raw = targetFor(stage, sizeProfileFor(seed)) / f;
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, raw));
}

/**
 * O estilo que toda tela aplica ao `<img>` do bicho: `scale` (propriedade CSS própria — não briga com os
 * `transform` de animação) sem mexer em layout. Origem nos PÉS por padrão; `'center'` para o sprite
 * pendurado por `top` num visor, que encolhe sobre si mesmo em vez de flutuar.
 */
export function petScaleStyle(factor: number, origin: 'feet' | 'center' = 'feet'): { scale: number; transformOrigin: string } {
  return { scale: Math.round(factor * 1000) / 1000, transformOrigin: origin === 'feet' ? '50% 100%' : '50% 50%' };
}

/* ── A SEMENTE DO SAVE ────────────────────────────────────────────────────
   Estado de módulo, só ESCRITO por `setPetSizeSeed` (mesmo molde de
   `setOwnSprites`): as telas leem sem receber mais uma prop. */
let currentSeed = '';
export function setPetSizeSeed(seed: string | undefined | null): void {
  currentSeed = typeof seed === 'string' ? seed : '';
}
export function getPetSizeSeed(): string {
  return currentSeed;
}

/** Semente estável da criatura: linha pronta do demo, senão o nascimento, senão a criação do save. */
export function sizeSeedOf(state: { demoCharacterId?: unknown; bornAt?: unknown; createdAt?: unknown }): string {
  for (const v of [state.demoCharacterId, state.bornAt, state.createdAt]) {
    if (typeof v === 'string' && v) return v;
  }
  return '';
}

/* ── A CAIXA VISÍVEL ──────────────────────────────────────────────────────
   Mede o lado maior da bbox do alfa ÷ lado do canvas, uma vez por URL (cache).
   Sem canvas (jsdom, SSR) ou imagem tainted (outra origem) → `DEFAULT_FILL`. */
const fillCache = new Map<string, number>();
const inflight = new Map<string, Promise<number>>();
const listeners = new Set<() => void>();

export function visibleFillOf(url: string | undefined | null): number {
  return (url && fillCache.get(url)) || DEFAULT_FILL;
}

/** Onde o PÉ do bicho cai no canvas quando não foi medido: a suposição histórica do palco (`SPRITE_TOP` 0,94). */
export const DEFAULT_BOTTOM = 0.94;

const bottomCache = new Map<string, number>();

/** Base da caixa visível (0..1, fração da altura do canvas) já medida; sem medida = `DEFAULT_BOTTOM`. */
export function visibleBottomOf(url: string | undefined | null): number {
  return (url && bottomCache.get(url)) || DEFAULT_BOTTOM;
}

/**
 * Quanto (px, + = para baixo) mover o canvas do sprite para o PÉ visível tocar a plataforma. O palco assume o pé em
 * `1 − footRoom` do canvas (`footRoom` = 0,06); a escala `scale` (origem nos pés do CANVAS) afasta o pé real do canvas
 * em `(1 − bottom) × size × scale`. Preso a ±45% do tamanho (medida absurda não joga o bicho para fora da cena).
 */
export function feetShiftPx(bottom: number, scale: number, size: number, footRoom = 1 - DEFAULT_BOTTOM): number {
  if (!(size > 0) || !Number.isFinite(bottom)) return 0;
  const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const b = Math.min(1, Math.max(0.2, bottom));
  const raw = ((1 - b) * s - footRoom) * size;
  return Math.round(Math.min(size * 0.45, Math.max(-size * 0.45, raw)));
}

/** Última linha opaca (alfa > 16) ÷ altura do canvas; sem pixel opaco = `DEFAULT_BOTTOM`. */
export function bottomFromRGBA(data: ArrayLike<number>, w: number, h: number): number {
  for (let y = h - 1; y >= 0; y--) {
    for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 16) return (y + 1) / h;
  }
  return DEFAULT_BOTTOM;
}

/** Cálculo puro sobre RGBA: lado maior da bbox (alfa > 16) ÷ lado do canvas. */
export function fillFromRGBA(data: ArrayLike<number>, w: number, h: number): number {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 16) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return DEFAULT_FILL;
  return Math.max(x1 - x0 + 1, y1 - y0 + 1) / Math.max(w, h);
}

export function measureVisibleFill(url: string): Promise<number> {
  const hit = fillCache.get(url);
  if (hit !== undefined) return Promise.resolve(hit);
  const pending = inflight.get(url);
  if (pending) return pending;
  const p = new Promise<number>((resolve) => {
    try {
      if (typeof Image === 'undefined' || typeof document === 'undefined') return resolve(FAILED_FILL);
      const img = new Image();
      // Sem isto, imagem de outra origem deixa o canvas tainted. A rota /api/sprite-image já manda ACAO: *.
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const side = 128;
          const c = document.createElement('canvas');
          c.width = side;
          c.height = side;
          const ctx = c.getContext('2d', { willReadFrequently: true });
          if (!ctx) return resolve(FAILED_FILL);
          ctx.drawImage(img, 0, 0, side, side);
          const px = ctx.getImageData(0, 0, side, side).data;
          bottomCache.set(url, bottomFromRGBA(px, side, side));
          resolve(fillFromRGBA(px, side, side));
        } catch {
          resolve(FAILED_FILL); // canvas tainted
        }
      };
      img.onerror = () => resolve(FAILED_FILL);
      img.src = url;
    } catch {
      resolve(FAILED_FILL);
    }
  }).then((v) => {
    inflight.delete(url);
    // Falha cacheia FAILED_FILL (conservador): não re-tenta a cada render.
    fillCache.set(url, v);
    listeners.forEach((l) => l());
    return v;
  });
  inflight.set(url, p);
  return p;
}

export function subscribeFill(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
