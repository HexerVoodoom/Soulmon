/**
 * O ÍCONE de cada prédio na pílula do mapa (pedido do dono, 03/11/2026: a placa de madeira com o nome saiu; ficou a pílula escura com
 * ícone + nome curto, como no mapa de referência). Só nomes do subset do `Icon` (`styles/tokens.md`); prédio sem entrada usa `home`.
 */
export const LOT_ICON: Record<string, string> = {
  'mercado:itens': 'inventory_2', 'mercado:decoracao': 'palette', 'mercado:background': 'grid_view', 'mercado:conquistas': 'emoji_events',
  'mercado:cambista': 'paid', 'mercado:restaurante': 'restaurant',
  'forja:ferreiro': 'local_fire_department', 'forja:hexsmith': 'diamond', 'forja:oficina': 'tune', 'forja:caderno': 'event_note', 'forja:refugio': 'spa',
  'arena:torneio': 'leaderboard', 'arena:duelo': 'swords', 'arena:guerra': 'military_tech',
  'hall:feira': 'flag', 'hall:grove': 'park', 'hall:guilda': 'groups',
  'exploracao:fenda': 'water_drop', 'exploracao:passeio': 'eco', 'exploracao:dungeon': 'nightlight', 'exploracao:preparar': 'schedule',
  'jogos:salao': 'toys', 'jogos:mente': 'psychology',
  'laboratorio:evolucao': 'trending_up', 'laboratorio:stats': 'fact_check', 'laboratorio:perfil': 'person', 'laboratorio:biblioteca': 'groups',
};
export const lotIconName = (areaId: string, lotId: string): string => LOT_ICON[`${areaId}:${lotId}`] ?? 'home';
