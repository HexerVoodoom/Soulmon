// Diagnóstico visível do login (17/11/2026): no APK o dono não tem como ler logs do aparelho, então o
// portão e a tela de termos mostram uma linha técnica com o que a restauração da nuvem fez.
// NUNCA guarda e-mail, token nem conteúdo do save: só versão, plataforma, resultado, status HTTP e 6 chars do saveId.
import { Capacitor } from '@capacitor/core';

// Local de propósito: o tsconfig do desktop importa src/utils sem o vite-env.d.ts.
declare const __APP_VERSION__: string | undefined;

export type ResultadoRestauracao = 'restaurada' | 'sem-save' | 'indeterminado' | 'storage' | 'nao-chamada';

const estado: { restauracao: ResultadoRestauracao; status: number | null; saveId6: string } = {
  restauracao: 'nao-chamada',
  status: null,
  saveId6: '-',
};
const ouvintes = new Set<() => void>();
const avisar = () => { ouvintes.forEach((f) => { try { f(); } catch { /* ouvinte nunca derruba o login */ } }); };

/** Status HTTP do último GET /api/save (0 = falha de rede/exceção; null = ainda não houve). */
export function registrarStatusDaNuvem(status: number): void { estado.status = status; avisar(); }
export function registrarRestauracao(r: ResultadoRestauracao, saveId?: string): void {
  estado.restauracao = r;
  if (saveId) estado.saveId6 = saveId.slice(0, 6);
  avisar();
}
export function assinarDiagnostico(f: () => void): () => void {
  ouvintes.add(f);
  return () => { ouvintes.delete(f); };
}

export function textoDiagnosticoLogin(): string {
  let plataforma = 'web';
  try { plataforma = Capacitor.isNativePlatform() ? 'apk' : 'web'; } catch { /* sem Capacitor: web */ }
  const versao = typeof __APP_VERSION__ !== 'undefined' ? String(__APP_VERSION__) : '?';
  return `v${versao} | ${plataforma} | rest=${estado.restauracao} | http=${estado.status ?? '-'} | id=${estado.saveId6}`;
}
