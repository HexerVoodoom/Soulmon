export declare const ART_LINE_IDS: Set<string>;
export declare function artLineOrNull(raw: unknown): string | null;
export declare function spriteUrlOrNull(raw: unknown): string | null;
export declare function spriteFromSaveState(state: unknown): { spriteUrl: string | null; artLine: string | null };
