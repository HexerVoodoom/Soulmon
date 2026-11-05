// Tipos de `_simulados.data.js`, para `scripts/simulados-prompts.ts` e seu teste.
export type Simulado = {
  id: string; nick: string; petName: string; line: 'poder' | 'harmonia' | 'benevolencia'; element: string; artLine: string;
  faixa: 'A' | 'B' | 'C'; ancora: { estagio: 'rookie' | 'champion' | 'ultimate' | 'mega' | 'ultra'; pontos: number };
  bond0: number; skill: number; frequency: 'casual' | 'regular' | 'assiduo'; prefs: Partial<Record<string, number>>; daysPlaying: number;
};
export declare const SIMULADOS: ReadonlyArray<Simulado>;
export declare const ART_LINE_BY_ELEMENT: Readonly<Record<string, string>>;
export declare const SIM_EPOCH: string;
export declare const SIM_ANCORA_DIA: string;
