export type ChromaKeyName = 'green' | 'magenta' | 'blue';
export declare const KEY_HUE: Record<ChromaKeyName, number>;
export declare const KEY_ORDER: ChromaKeyName[];
export declare const SAFE_DISTANCE: number;
export declare const GREEN_KEEP_DISTANCE: number;
export declare const COLOR_HUES: Array<[RegExp, number, boolean]>;
export declare function coresDoTexto(texto: string): Array<{ word: string; hue: number; index: number; accent: boolean }>;
export declare function hueDist(a: number, b: number): number;
export declare function distanciaMinimaDaChave(key: ChromaKeyName, cores: Array<{ hue: number; accent?: boolean }>): number;
export declare function escolherChaveDeMatiz(texto: string, excluir?: ChromaKeyName[]): {
  key: ChromaKeyName;
  ranking: Array<{ key: ChromaKeyName; score: number }>;
  cores: Array<{ word: string; hue: number; index: number; accent: boolean }>;
};
export declare function semChaveSegura(texto: string): boolean;
