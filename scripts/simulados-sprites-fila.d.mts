// Tipos de `scripts/simulados-sprites-fila.mjs` (consumidos por `functions/api/_simulados.test.js`).
export declare const APP_URL_PADRAO: string;
export declare const FORM_ID: string;
export declare function promptDe(p: { petName: string; element: string; line: string }): string;
export declare function planejar(only?: string[] | null): { id: string; formId: string; prompt: string; kvKey: string }[];
export declare function parseArgs(argv: string[]): { run: boolean; only: string[] | null; url: string };
