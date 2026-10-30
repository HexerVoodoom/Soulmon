/**
 * COMPRA DE ESSÊNCIAS NO CAMBISTA (30/10/2026, decisão do dono, REGISTRO §205) — dono único do PREÇO no servidor.
 *
 * Créditos são DINHEIRO REAL: o preço nunca vem do cliente. Ele sai daqui, do número de elementos BASE na composição:
 * base = 1 Crédito, par (2 bases) = 2, 3+ bases = 3. Pacote de 5 = 10% off arredondado para BAIXO (5/10/15 → 4/9/13),
 * para que o desconto exista em todo degrau (arredondar para cima zerava o desconto da base: 4,5 → 5).
 * Espelho: `src/utils/essenceShop.ts` (paridade em `essenceShop.parity.test.js`, que também confere o catálogo).
 */
export const ESSENCE_MAX_PER_ELEMENT = 1_000_000;
export const ESSENCE_PACK_SIZES = /** @type {const} */ ([1, 5]);
export const ESSENCE_PACK_DISCOUNT = 0.1;

export const BASE_ELEMENTS = ['fogo', 'agua', 'terra', 'ar', 'eletricidade', 'arcano', 'sombra', 'luz',
  'vileza', 'morte', 'vida', 'vigor', 'marcial', 'tempo', 'som', 'gravidade', 'espaco', 'fada', 'industrial', 'planta'];

/** Derivados `id:a+b` (gerado de `DERIVED_ELEMENT_PAIRS`; a paridade reprova divergência). */
const PAIRS_RAW = 'vapor:fogo+agua lava:fogo+terra incendio:fogo+ar plasma:fogo+eletricidade fogo_feiticeiro:fogo+arcano fogo_negro:fogo+sombra chama_solar:fogo+luz fogo_infernal:fogo+vileza chama_azul:fogo+morte fenix:fogo+vida fervor:fogo+vigor pantano:agua+terra gelo:agua+ar agua_viva:agua+eletricidade mare:agua+arcano abismo:agua+sombra prisma:agua+luz acido:agua+vileza veneno:agua+morte nascente:agua+vida correnteza:agua+vigor areia:terra+ar magnetismo:terra+eletricidade cristal:terra+arcano obsidiana:terra+sombra ouro_vivo:terra+luz solo_profano:terra+vileza ossuario:terra+morte flora:terra+vida tita:terra+vigor tempestade:ar+eletricidade eter:ar+arcano murmurio:ar+sombra aurora:ar+luz enxofre:ar+vileza miasma:ar+morte alento:ar+vida impeto:ar+vigor fluxo:eletricidade+arcano trovao_negro:eletricidade+sombra fulgor:eletricidade+luz tormento:eletricidade+vileza galvanismo:eletricidade+morte sinapse:eletricidade+vida reflexo:eletricidade+vigor ocultismo:arcano+sombra runa:arcano+luz pacto:arcano+vileza alma:arcano+morte essencia:arcano+vida encantamento:arcano+vigor crepusculo:sombra+luz terror:sombra+vileza espectro:sombra+morte parasita:sombra+vida assassinio:sombra+vigor heresia:luz+vileza julgamento:luz+morte santidade:luz+vida bravura:luz+vigor praga:vileza+morte mutacao:vileza+vida carnificina:vileza+vigor equilibrio:morte+vida ceifa:morte+vigor vitalidade:vida+vigor forja:marcial+fogo tempera:marcial+agua aco:marcial+terra esgrima:marcial+ar aco_voltaico:marcial+eletricidade arsenal:marcial+arcano lamina_oculta:marcial+sombra lamina_radiante:marcial+luz serrilha:marcial+vileza fio_funebre:marcial+morte lamina_viva:marcial+vida maestria:marcial+vigor pira_eterna:tempo+fogo erosao:tempo+agua fossil:tempo+terra aceleracao:tempo+ar instante:tempo+eletricidade cronomancia:tempo+arcano entropia:tempo+sombra eon:tempo+luz ruina:tempo+vileza ocaso:tempo+morte florescer:tempo+vida frenesi:tempo+vigor contratempo:tempo+marcial estrondo:som+fogo sonar:som+agua terremoto:som+terra estampido:som+ar trovao:som+eletricidade cantico:som+arcano sussurro:som+sombra harmonia:som+luz dissonancia:som+vileza requiem:som+morte melodia:som+vida brado:som+vigor cadencia:som+marcial eco:som+tempo fornalha_estelar:gravidade+fogo voragem:gravidade+agua colapso:gravidade+terra vacuo:gravidade+ar magnetar:gravidade+eletricidade singularidade:gravidade+arcano buraco_negro:gravidade+sombra halo_gravitacional:gravidade+luz jugo:gravidade+vileza implosao:gravidade+morte ancora_vital:gravidade+vida peso_descomunal:gravidade+vigor ariete:gravidade+marcial dilatacao:gravidade+tempo onda_de_choque:gravidade+som meteoro:espaco+fogo cometa:espaco+agua asteroide:espaco+terra estratosfera:espaco+ar pulsar:espaco+eletricidade portal:espaco+arcano vazio:espaco+sombra constelacao:espaco+luz devorador:espaco+vileza nebulosa:espaco+morte semente_estelar:espaco+vida gigante_estelar:espaco+vigor lamina_sideral:espaco+marcial continuum:espaco+tempo silencio_cosmico:espaco+som dobra:espaco+gravidade fogo_fatuo:fada+fogo orvalho:fada+agua circulo_feerico:fada+terra brisa_cintilante:fada+ar glitter:fada+eletricidade feerie:fada+arcano sonho_sombrio:fada+sombra arco_iris:fada+luz encanto_traicoeiro:fada+vileza banshee:fada+morte coracao:fada+vida graca:fada+vigor lamina_purpurina:fada+marcial sono_encantado:fada+tempo cancao_feerica:fada+som leveza:fada+gravidade poeira_estelar:fada+espaco fornalha:industrial+fogo hidraulica:industrial+agua mineracao:industrial+terra pneumatica:industrial+ar usina:industrial+eletricidade artificio:industrial+arcano fuligem:industrial+sombra holofote:industrial+luz poluicao:industrial+vileza ferro_velho:industrial+morte biomecanica:industrial+vida exoesqueleto:industrial+vigor armaria:industrial+marcial relojoaria:industrial+tempo britadeira:industrial+som prensa:industrial+gravidade estacao_orbital:industrial+espaco brinquedo:industrial+fada queimada:planta+fogo mangue:planta+agua raiz_profunda:planta+terra polen:planta+ar fotossintese:planta+eletricidade druidismo:planta+arcano fungo:planta+sombra girassol:planta+luz espinheiro:planta+vileza murcha:planta+morte seiva:planta+vida carvalho:planta+vigor bambu:planta+marcial estacoes:planta+tempo farfalhar:planta+som trepadeira:planta+gravidade arvore_mundo:planta+espaco jardim_encantado:planta+fada estufa:planta+industrial';

/** @type {Map<string, readonly string[]>} id → bases distintas */
const COMPOSITION = new Map(BASE_ELEMENTS.map(b => [b, [b]]));
for (const tok of PAIRS_RAW.split(' ')) {
  const [id, comp] = tok.split(':');
  const [a, b] = comp.split('+');
  COMPOSITION.set(id, a === b ? [a] : [a, b]);
}

/** @param {unknown} id */
export const isKnownEssenceElement = id => typeof id === 'string' && COMPOSITION.has(id);
/** @param {string} id */
export const essenceBaseCount = id => COMPOSITION.get(id)?.length ?? 0;
/** @returns {string[]} */
export const essenceShopIds = () => [...COMPOSITION.keys()];

/** Preço de 1 essência; 0 = elemento desconhecido. @param {string} id */
export function essenceUnitPrice(id) {
  const n = essenceBaseCount(id);
  return n <= 0 ? 0 : Math.min(3, n);
}

/** Preço total de um pacote (1 ou 5); 0 = inválido. @param {string} id @param {number} qty */
export function essencePackPrice(id, qty) {
  const unit = essenceUnitPrice(id);
  if (!unit || !ESSENCE_PACK_SIZES.includes(/** @type {1|5} */ (qty))) return 0;
  return qty === 1 ? unit : Math.floor(qty * unit * (1 - ESSENCE_PACK_DISCOUNT));
}
