// Ids dos elementos derivados (pares) do class-system — SÓ os ids, sem nomes/receitas (`derivedElements.ts` + `essenceLabels.ts` pesam ~19 KB).
// Existe para o caminho CRÍTICO (`elementoDoOraculo` → `starterElements`, usado pela Home) validar um id sem puxar a tabela inteira.
// `elementoIds.test.ts` prova que a lista é EXATAMENTE `DERIVED_ELEMENT_PAIRS.map(d => d.id)`.
import { CLASS_ELEMENT_ORDER } from '../types';

const PARES = 'vapor lava incendio plasma fogo_feiticeiro fogo_negro chama_solar fogo_infernal chama_azul fenix fervor pantano gelo agua_viva mare abismo prisma acido veneno nascente correnteza areia magnetismo cristal obsidiana ouro_vivo solo_profano ossuario flora tita tempestade eter murmurio aurora enxofre miasma alento impeto fluxo trovao_negro fulgor tormento galvanismo sinapse reflexo ocultismo runa pacto alma essencia encantamento crepusculo terror espectro parasita assassinio heresia julgamento santidade bravura praga mutacao carnificina equilibrio ceifa vitalidade forja tempera aco esgrima aco_voltaico arsenal lamina_oculta lamina_radiante serrilha fio_funebre lamina_viva maestria pira_eterna erosao fossil aceleracao instante cronomancia entropia eon ruina ocaso florescer frenesi contratempo estrondo sonar terremoto estampido trovao cantico sussurro harmonia dissonancia requiem melodia brado cadencia eco fornalha_estelar voragem colapso vacuo magnetar singularidade buraco_negro halo_gravitacional jugo implosao ancora_vital peso_descomunal ariete dilatacao onda_de_choque meteoro cometa asteroide estratosfera pulsar portal vazio constelacao devorador nebulosa semente_estelar gigante_estelar lamina_sideral continuum silencio_cosmico dobra fogo_fatuo orvalho circulo_feerico brisa_cintilante glitter feerie sonho_sombrio arco_iris encanto_traicoeiro banshee coracao graca lamina_purpurina sono_encantado cancao_feerica leveza poeira_estelar fornalha hidraulica mineracao pneumatica usina artificio fuligem holofote poluicao ferro_velho biomecanica exoesqueleto armaria relojoaria britadeira prensa estacao_orbital brinquedo queimada mangue raiz_profunda polen fotossintese druidismo fungo girassol espinheiro murcha seiva carvalho bambu estacoes farfalhar trepadeira arvore_mundo jardim_encantado estufa'.split(' ');

const CONHECIDOS = new Set<string>([...CLASS_ELEMENT_ORDER, ...PARES]);

export const IDS_DOS_PARES: readonly string[] = PARES;

/** O id está na lista fechada de elementos (17+ base e pares derivados)? Mesmo contrato de `elementoNome.elementoConhecido`. */
export function elementoConhecidoLeve(id: unknown): id is string {
  return typeof id === 'string' && CONHECIDOS.has(id);
}
