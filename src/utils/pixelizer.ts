// ============================================================================
// Pixelador — converte QUALQUER imagem (ex.: saída do gerador de IA) em pixel
// art real de v-pet: reduz para um grid minúsculo, quantiza a paleta para
// pouquíssimas cores e devolve pixels duros. Funções puras sobre arrays RGBA
// (testáveis sem canvas); o componente de UI faz só o vai-e-vem com <canvas>.
// ============================================================================

export interface PixelizeOptions {
  grid: number;          // lado do grid final (16, 24, 32, 48)
  colors: number;        // máximo de cores da paleta (2–16)
  transparentBg: boolean; // remove fundo claro conectado às bordas
}

export type RGB = [number, number, number];

/**
 * Remove o fundo claro por flood-fill a partir das bordas: só apaga pixels
 * quase-brancos CONECTADOS à borda, preservando áreas claras internas do
 * sprite (olhos, barriga etc.). Muta o array RGBA in-place (alpha = 0).
 */
export function removeLightBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  tolerance = 28,
): void {
  const isLight = (i: number) => {
    const min = 255 - tolerance;
    return data[i * 4] >= min && data[i * 4 + 1] >= min && data[i * 4 + 2] >= min && data[i * 4 + 3] > 0;
  };
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];
  const push = (x: number, y: number) => {
    const idx = y * width + x;
    if (x < 0 || y < 0 || x >= width || y >= height || visited[idx]) return;
    visited[idx] = 1;
    if (isLight(idx)) queue.push(idx);
  };
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
  while (queue.length > 0) {
    const idx = queue.pop()!;
    data[idx * 4 + 3] = 0; // transparente
    const x = idx % width;
    const y = Math.floor(idx / width);
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
}

/**
 * Quantização median-cut: encontra até `maxColors` cores representativas
 * entre os pixels OPACOS (alpha ≥ 128).
 */
export function medianCutPalette(data: Uint8ClampedArray, maxColors: number): RGB[] {
  const pixels: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] >= 128) pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (pixels.length === 0) return [[0, 0, 0]];

  let boxes: RGB[][] = [pixels];
  while (boxes.length < maxColors) {
    // Divide a caixa com maior amplitude de canal
    let bestBox = -1;
    let bestRange = -1;
    let bestChannel = 0;
    for (let b = 0; b < boxes.length; b++) {
      if (boxes[b].length < 2) continue;
      for (let c = 0; c < 3; c++) {
        let lo = 255, hi = 0;
        for (const p of boxes[b]) { if (p[c] < lo) lo = p[c]; if (p[c] > hi) hi = p[c]; }
        const range = hi - lo;
        if (range > bestRange) { bestRange = range; bestBox = b; bestChannel = c; }
      }
    }
    if (bestBox === -1 || bestRange === 0) break; // nada mais para dividir
    const box = boxes[bestBox];
    box.sort((a, b) => a[bestChannel] - b[bestChannel]);
    const mid = Math.floor(box.length / 2);
    boxes.splice(bestBox, 1, box.slice(0, mid), box.slice(mid));
  }

  return boxes.map(box => {
    let r = 0, g = 0, b = 0;
    for (const p of box) { r += p[0]; g += p[1]; b += p[2]; }
    const n = box.length || 1;
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)] as RGB;
  });
}

/** Mapeia cada pixel opaco para a cor mais próxima da paleta (in-place). */
export function applyPalette(data: Uint8ClampedArray, palette: RGB[]): void {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) { data[i + 3] = 0; continue; } // binariza o alpha
    data[i + 3] = 255;
    let best = 0;
    let bestDist = Infinity;
    for (let p = 0; p < palette.length; p++) {
      const dr = data[i] - palette[p][0];
      const dg = data[i + 1] - palette[p][1];
      const db = data[i + 2] - palette[p][2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) { bestDist = dist; best = p; }
    }
    data[i] = palette[best][0];
    data[i + 1] = palette[best][1];
    data[i + 2] = palette[best][2];
  }
}

/** Conta as cores distintas (pixels opacos) — útil para testes/validação. */
export function countDistinctColors(data: Uint8ClampedArray): number {
  const seen = new Set<number>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] >= 128) seen.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
  }
  return seen.size;
}

/**
 * Pipeline completo sobre um buffer RGBA já reduzido ao grid final:
 * (1) opcional: remove fundo claro; (2) quantiza a paleta; (3) aplica.
 */
export function pixelizeBuffer(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  opts: Pick<PixelizeOptions, 'colors' | 'transparentBg'>,
): void {
  if (opts.transparentBg) removeLightBackground(data, width, height);
  const palette = medianCutPalette(data, opts.colors);
  applyPalette(data, palette);
}
