// Cliente de geração de sprite: chama a Function /api/generate-sprite (Gemini)
// e converte a imagem retornada em sprite v-pet DE VERDADE via o Pixelador,
// sem o usuário precisar copiar prompt ou fazer upload.
import { pixelizeBuffer } from './pixelizer';

export interface SpriteGenOptions {
  grid?: number;          // lado do grid final (default 16)
  colors?: number;        // teto de cores (default 4)
  transparentBg?: boolean; // remove fundo (default true; prompts usam fundo preto)
  scale?: number;         // ampliação do PNG final (default 16 → 256px em 16x16)
}

/** Chama o backend e devolve a imagem crua (data URL) gerada pela IA. */
export async function requestSprite(prompt: string): Promise<string> {
  const res = await fetch('/api/generate-sprite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `sprite generation failed (${res.status})`);
  }
  const { image } = await res.json();
  if (!image) throw new Error('empty image');
  return image as string;
}

/** Carrega uma data URL num HTMLImageElement. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
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
export async function generateSprite(prompt: string, opts?: SpriteGenOptions): Promise<string> {
  const raw = await requestSprite(prompt);
  return pixelizeDataUrl(raw, opts);
}

export interface StagePrompt { key: string; prompt: string }
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
    const { key, prompt } = stages[i];
    try {
      const sprite = await generateSprite(prompt, opts);
      sprites.push({ key, sprite });
    } catch (err) {
      errors.push({ key, message: err instanceof Error ? err.message : String(err) });
    }
    opts.onProgress?.(i + 1, stages.length, key);
  }
  return { sprites, errors };
}
