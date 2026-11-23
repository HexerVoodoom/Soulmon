/**
 * Carga do chunk lazy dos catálogos novos (`catalogosNovos.ts`, REGISTRO §498). Idempotente. O `main.tsx` ESPERA esta promessa antes do
 * 1º render: a loja, os cenários, as molduras e a arte de decoração existem antes de qualquer save ser lido ou tela pintada.
 * Se a carga falhar (rede), o app abre igual, só sem as peças novas até o próximo boot (nenhum save é alterado por isso).
 */
let carga: Promise<void> | undefined;

export function carregarCatalogosNovos(): Promise<void> {
  carga ??= import('./catalogosNovos').then(m => m.aplicarCatalogosNovos()).catch(() => { carga = undefined; });
  return carga;
}
