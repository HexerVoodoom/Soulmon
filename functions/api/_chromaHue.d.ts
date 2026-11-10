export type ChromaKeyName = 'green' | 'magenta' | 'blue';
export declare const KEY_HUE: Record<ChromaKeyName, number>;
export declare const KEY_ORDER: ChromaKeyName[];
export declare const SAFE_DISTANCE: number;
export declare const COLOR_HUES: Array<[RegExp, number, boolean]>;
export declare function coresDoTexto(texto: string): Array<{ word: string; hue: number; index: number }>;
export declare function hueDist(a: number, b: number): number;
export declare function escolherChaveDeMatiz(texto: string): {
  key: ChromaKeyName;
  ranking: Array<{ key: ChromaKeyName; score: number }>;
  cores: Array<{ word: string; hue: number; index: number }>;
};
export declare function semChaveSegura(texto: string): boolean;
