import type { AreaId } from '../../../../navigation';

/**
 * FUNDOS DOS MODAIS (aprovados pelo dono, 17/11/2026): um por lote, 600 px de largura em WebP (`fundos/*.webp`). Entram POR BAIXO da moldura
 * (`ModalFrame`), a 15% de opacidade sobre base escura. Chave = `área:lote`, a mesma de `LOT_NPC_ART`. Sem fundo próprio (Perfil, Arquivo
 * e o que não for prédio) = pedra com runas. Mapa do inventário: `docs/modais/INVENTARIO-NPC-PREDIO.md`.
 */
const URLS = import.meta.glob('./fundos/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const POR_LOTE: Record<string, string> = {
  'mercado:itens': 'mercado-itens', 'mercado:decoracao': 'mercado-decoracao', 'mercado:background': 'mercado-background',
  'mercado:conquistas': 'mercado-conquistas', 'mercado:cambista': 'mercado-cambista', 'mercado:restaurante': 'mercado-restaurante',
  'arena:torneio': 'arena-torneio', 'arena:duelo': 'arena-duelo', 'arena:guerra': 'arena-guerra',
  'exploracao:passeio': 'exploracao-passeio', 'exploracao:fenda': 'exploracao-fenda', 'exploracao:dungeon': 'exploracao-dungeon',
  'forja:ferreiro': 'forja-ferreiro', 'forja:hexsmith': 'forja-hexsmith', 'forja:oficina': 'forja-oficina', 'forja:caderno': 'forja-caderno', 'forja:refugio': 'forja-refugio',
  'jogos:salao': 'jogos-salao', 'jogos:mente': 'jogos-mente',
  'laboratorio:evolucao': 'laboratorio-evolucao', 'laboratorio:stats': 'laboratorio-stats', 'laboratorio:biblioteca': 'laboratorio-biblioteca',
  'hall:feira': 'hall-feira', 'hall:grove': 'hall-grove', 'hall:guilda': 'hall-guilda',
  // Seção "Círculo de Amigos" mora no Salão do Clã (inventário §2 #25): herda o dele.
  'laboratorio:amigos': 'hall-guilda',
  // Perfil e Arquivo (`laboratorio:perfil`/`laboratorio:pet`): modais genéricos, pedra com runas (decisão do dono, 17/11/2026) — sem entrada aqui; o `laboratorio-perfil` gerado não foi instalado.
};

/** As quatro telas cheias (inventário #29..#32). */
export type TelaMoldura = 'fenda' | 'calabouco' | 'soulsmith-mapa' | 'arena-livre';

export const PEDRA_RUNAS_URL: string = (import.meta.glob('./pedra-runas.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>)['./pedra-runas.webp'] ?? '';

function url(nome: string): string | undefined { return URLS[`./fundos/${nome}.webp`]; }

/** URL do fundo do lote, ou `undefined` (então o chamador usa a pedra com runas). */
export function fundoDoLote(areaId?: AreaId, lotId?: string | null): string | undefined {
  if (!areaId || !lotId) return undefined;
  const nome = POR_LOTE[`${areaId}:${lotId}`];
  return nome ? url(nome) : undefined;
}

export function fundoDaTela(tela: TelaMoldura): string | undefined { return url(`tela-${tela}`); }
