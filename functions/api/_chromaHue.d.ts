export type ChromaKeyName = 'green' | 'magenta' | 'blue';
export const KEY_HUE: Record<ChromaKeyName, number>;
export const KEY_ORDER: ChromaKeyName[];
export const SAFE_DISTANCE: number;
export const COLOR_HUES: Array<[RegExp, number, boolean]>;
export function coresDoTexto(texto: string): Array<{ word: string; hue: number; index: number }>;
export function hueDist(a: number, b: number): number;
export function escolherChaveDeMatiz(texto: string): {
  key: ChromaKeyName;
  ranking: Array<{ key: ChromaKeyName; score: number }>;
  cores: Array<{ word: string; hue: number; index: number }>;
};
export function semChaveSegura(texto: string): boolean;
