// Ids dos elementos derivados (pares) do class-system — SÓ os ids, sem nomes/receitas (`derivedElements.ts` + `essenceLabels.ts` pesam ~19 KB).
// Existe para o caminho CRÍTICO (`elementoDoOraculo` → `starterElements`, usado pela Home) validar um id sem puxar a tabela inteira.
// `elementoIds.test.ts` prova que a lista é EXATAMENTE `DERIVED_ELEMENT_PAIRS.map(d => d.id)`.
import { CLASS_ELEMENT_ORDER } from '../types';

const PARES = 'vapor lava incendio plasma fogo_feiticeiro fogo_negro chama_solar fogo_infernal chama_azul fenix fervor pantano gelo agua_viva mare abismo prisma acido veneno nascente correnteza areia magnetismo cristal obsidiana ouro_vivo solo_profano ossuario flora tita tempestade eter murmurio aurora enxofre miasma alento impeto fluxo trovao_negro fulgor tormento galvanismo sinapse reflexo ocultismo runa pacto alma essencia encantamento crepusculo terror espectro parasita assassinio heresia julgamento santidade bravura praga mutacao carnificina equilibrio ceifa vitalidade forja tempera aco esgrima aco_voltaico arsenal lamina_oculta lamina_radiante serrilha fio_funebre lamina_viva maestria pira_eterna erosao fossil aceleracao instante cronomancia entropia eon ruina ocaso florescer frenesi contratempo estrondo sonar terremoto estampido trovao cantico sussurro harmonia dissonancia requiem melodia brado cadencia eco fornalha_estelar voragem colapso vacuo magnetar singularidade buraco_negro halo_gravitacional jugo implosao ancora_vital peso_descomunal ariete dilatacao onda_de_choque meteoro cometa asteroide estratosfera pulsar portal vazio constelacao devorador nebulosa semente_estelar gigante_estelar lamina_sideral continuum silencio_cosmico dobra fogo_fatuo orvalho circulo_feerico brisa_cintilante glitter feerie sonho_sombrio arco_iris encanto_traicoeiro banshee coracao graca lamina_purpurina sono_encantado cancao_feerica leveza poeira_estelar fornalha hidraulica mineracao pneumatica usina artificio fuligem holofote poluicao ferro_velho biomecanica exoesqueleto armaria relojoaria britadeira prensa estacao_orbital brinquedo queimada mangue raiz_profunda polen fotossintese druidismo fungo girassol espinheiro murcha seiva carvalho bambu estacoes farfalhar trepadeira arvore_mundo jardim_encantado estufa'.split(' ');

/** Os 59 curados (`ELEMENTOS_CURADOS`: 50 dos lotes 1–3, 6 do lote 4 e os 3 promovidos), elementos de 3 e 4 componentes (REGISTRO §232). `elementoIds.test.ts` trava a lista. */
const CURADOS = 'geiser vulcao deserto relampago_seco supernova nevasca permafrost monsoes peste_negra coro_dos_afogados ossario_vivo jardim_eterno aurora_boreal duelista_temporal pulso_cosmico sabbat hipnose materia_escura milagre memoria coral_celeste via_lactea delirio cacador_de_almas presagio horizonte_de_eventos lamina_do_juizo bencao_marcial arauto farol carniceiro entropia_final gladiador punho_gravitico avatar_elemental titano_forjado cataclismo sopro_do_dragao ragnarok genesis tempestade_perfeita leviata senhor_da_praga sinfonia_do_caos vontade_absoluta arquiteto_da_realidade ceifador_estelar renascimento juizo_final cavaleiro_absoluto clareira alto_forno bencao_feerica floresta_ancestral colosso_blindado corte_feerica pestilencia maldicao cyber'.split(' ');

const CONHECIDOS = new Set<string>([...CLASS_ELEMENT_ORDER, ...PARES, ...CURADOS]);

export const IDS_DOS_CURADOS: readonly string[] = CURADOS;

export const IDS_DOS_PARES: readonly string[] = PARES;

/** O id está na lista fechada de elementos (17+ base e pares derivados)? Mesmo contrato de `elementoNome.elementoConhecido`. */
export function elementoConhecidoLeve(id: unknown): id is string {
  return typeof id === 'string' && CONHECIDOS.has(id);
}
