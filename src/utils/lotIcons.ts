import icMercadoItens from '../assets/soulmon/icones-predios/mercado-itens.png';
import icMercadoDecoracao from '../assets/soulmon/icones-predios/mercado-decoracao.png';
import icMercadoBackground from '../assets/soulmon/icones-predios/mercado-background.png';
import icMercadoConquistas from '../assets/soulmon/icones-predios/mercado-conquistas.png';
import icMercadoCambista from '../assets/soulmon/icones-predios/mercado-cambista.png';
import icMercadoRestaurante from '../assets/soulmon/icones-predios/mercado-restaurante.png';
import icForjaFerreiro from '../assets/soulmon/icones-predios/forja-ferreiro.png';
import icForjaHexsmith from '../assets/soulmon/icones-predios/forja-hexsmith.png';
import icForjaOficina from '../assets/soulmon/icones-predios/forja-oficina.png';
import icForjaCaderno from '../assets/soulmon/icones-predios/forja-caderno.png';
import icForjaRefugio from '../assets/soulmon/icones-predios/forja-refugio.png';
import icArenaTorneio from '../assets/soulmon/icones-predios/arena-torneio.png';
import icArenaDuelo from '../assets/soulmon/icones-predios/arena-duelo.png';
import icArenaGuerra from '../assets/soulmon/icones-predios/arena-guerra.png';
import icHallFeira from '../assets/soulmon/icones-predios/hall-feira.png';
import icHallGrove from '../assets/soulmon/icones-predios/hall-grove.png';
import icHallGuilda from '../assets/soulmon/icones-predios/hall-guilda.png';
import icExploracaoFenda from '../assets/soulmon/icones-predios/exploracao-fenda.png';
import icExploracaoPasseio from '../assets/soulmon/icones-predios/exploracao-passeio.png';
import icExploracaoDungeon from '../assets/soulmon/icones-predios/exploracao-dungeon.png';
import icExploracaoPreparar from '../assets/soulmon/icones-predios/exploracao-preparar.png';
import icJogosSalao from '../assets/soulmon/icones-predios/jogos-salao.png';
import icJogosMente from '../assets/soulmon/icones-predios/jogos-mente.png';
import icLaboratorioEvolucao from '../assets/soulmon/icones-predios/laboratorio-evolucao.png';
import icLaboratorioStats from '../assets/soulmon/icones-predios/laboratorio-stats.png';
import icLaboratorioPerfil from '../assets/soulmon/icones-predios/laboratorio-perfil.png';
import icLaboratorioBiblioteca from '../assets/soulmon/icones-predios/laboratorio-biblioteca.png';
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

/**
 * A ARTE de cada prédio na pílula do mapa (rodada 5, 03/11/2026: `icones-predios/<área>-<lote>.png`, 96², fatiados de
 * `folha-icones-1/2.png`). A pílula (`AreaScene`) usa a imagem; o `lotIconName` (glifo) fica para quem desenha `Icon` (Revanche).
 */
export const LOT_ICON_ART: Record<string, string> = {
  'mercado:itens': icMercadoItens,
  'mercado:decoracao': icMercadoDecoracao,
  'mercado:background': icMercadoBackground,
  'mercado:conquistas': icMercadoConquistas,
  'mercado:cambista': icMercadoCambista,
  'mercado:restaurante': icMercadoRestaurante,
  'forja:ferreiro': icForjaFerreiro,
  'forja:hexsmith': icForjaHexsmith,
  'forja:oficina': icForjaOficina,
  'forja:caderno': icForjaCaderno,
  'forja:refugio': icForjaRefugio,
  'arena:torneio': icArenaTorneio,
  'arena:duelo': icArenaDuelo,
  'arena:guerra': icArenaGuerra,
  'hall:feira': icHallFeira,
  'hall:grove': icHallGrove,
  'hall:guilda': icHallGuilda,
  'exploracao:fenda': icExploracaoFenda,
  'exploracao:passeio': icExploracaoPasseio,
  'exploracao:dungeon': icExploracaoDungeon,
  'exploracao:preparar': icExploracaoPreparar,
  'jogos:salao': icJogosSalao,
  'jogos:mente': icJogosMente,
  'laboratorio:evolucao': icLaboratorioEvolucao,
  'laboratorio:stats': icLaboratorioStats,
  'laboratorio:perfil': icLaboratorioPerfil,
  'laboratorio:biblioteca': icLaboratorioBiblioteca,
};
export const lotIconArt = (areaId: string, lotId: string): string | undefined => LOT_ICON_ART[`${areaId}:${lotId}`];
