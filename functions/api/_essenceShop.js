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

export const BASE_ELEMENTS = ['fogo', 'agua', 'terra', 'ar', 'eletricidade', 'arcano', 'sombra', 'luz',
  'vileza', 'morte', 'vida', 'vigor', 'marcial', 'tempo', 'som', 'gravidade', 'espaco', 'fada', 'industrial', 'planta'];

/** Derivados `id:a+b` (gerado de `DERIVED_ELEMENT_PAIRS`; a paridade reprova divergência). */
const PAIRS_RAW = 'vapor:fogo+agua lava:fogo+terra incendio:fogo+ar plasma:fogo+eletricidade fogo_feiticeiro:fogo+arcano fogo_negro:fogo+sombra chama_solar:fogo+luz fogo_infernal:fogo+vileza chama_azul:fogo+morte fenix:fogo+vida fervor:fogo+vigor pantano:agua+terra gelo:agua+ar agua_viva:agua+eletricidade mare:agua+arcano abismo:agua+sombra prisma:agua+luz acido:agua+vileza veneno:agua+morte nascente:agua+vida correnteza:agua+vigor areia:terra+ar magnetismo:terra+eletricidade cristal:terra+arcano obsidiana:terra+sombra ouro_vivo:terra+luz solo_profano:terra+vileza ossuario:terra+morte flora:terra+vida tita:terra+vigor tempestade:ar+eletricidade eter:ar+arcano murmurio:ar+sombra aurora:ar+luz enxofre:ar+vileza miasma:ar+morte alento:ar+vida impeto:ar+vigor fluxo:eletricidade+arcano trovao_negro:eletricidade+sombra fulgor:eletricidade+luz tormento:eletricidade+vileza galvanismo:eletricidade+morte sinapse:eletricidade+vida reflexo:eletricidade+vigor ocultismo:arcano+sombra runa:arcano+luz pacto:arcano+vileza alma:arcano+morte essencia:arcano+vida encantamento:arcano+vigor crepusculo:sombra+luz terror:sombra+vileza espectro:sombra+morte parasita:sombra+vida assassinio:sombra+vigor heresia:luz+vileza julgamento:luz+morte santidade:luz+vida bravura:luz+vigor praga:vileza+morte mutacao:vileza+vida carnificina:vileza+vigor equilibrio:morte+vida ceifa:morte+vigor vitalidade:vida+vigor forja:marcial+fogo tempera:marcial+agua aco:marcial+terra esgrima:marcial+ar aco_voltaico:marcial+eletricidade arsenal:marcial+arcano lamina_oculta:marcial+sombra lamina_radiante:marcial+luz serrilha:marcial+vileza fio_funebre:marcial+morte lamina_viva:marcial+vida maestria:marcial+vigor pira_eterna:tempo+fogo erosao:tempo+agua fossil:tempo+terra aceleracao:tempo+ar instante:tempo+eletricidade cronomancia:tempo+arcano entropia:tempo+sombra eon:tempo+luz ruina:tempo+vileza ocaso:tempo+morte florescer:tempo+vida frenesi:tempo+vigor contratempo:tempo+marcial estrondo:som+fogo sonar:som+agua terremoto:som+terra estampido:som+ar trovao:som+eletricidade cantico:som+arcano sussurro:som+sombra harmonia:som+luz dissonancia:som+vileza requiem:som+morte melodia:som+vida brado:som+vigor cadencia:som+marcial eco:som+tempo fornalha_estelar:gravidade+fogo voragem:gravidade+agua colapso:gravidade+terra vacuo:gravidade+ar magnetar:gravidade+eletricidade singularidade:gravidade+arcano buraco_negro:gravidade+sombra halo_gravitacional:gravidade+luz jugo:gravidade+vileza implosao:gravidade+morte ancora_vital:gravidade+vida peso_descomunal:gravidade+vigor ariete:gravidade+marcial dilatacao:gravidade+tempo onda_de_choque:gravidade+som meteoro:espaco+fogo cometa:espaco+agua asteroide:espaco+terra estratosfera:espaco+ar pulsar:espaco+eletricidade portal:espaco+arcano vazio:espaco+sombra constelacao:espaco+luz devorador:espaco+vileza nebulosa:espaco+morte semente_estelar:espaco+vida gigante_estelar:espaco+vigor lamina_sideral:espaco+marcial continuum:espaco+tempo silencio_cosmico:espaco+som dobra:espaco+gravidade fogo_fatuo:fada+fogo orvalho:fada+agua circulo_feerico:fada+terra brisa_cintilante:fada+ar glitter:fada+eletricidade feerie:fada+arcano sonho_sombrio:fada+sombra arco_iris:fada+luz encanto_traicoeiro:fada+vileza banshee:fada+morte coracao:fada+vida graca:fada+vigor lamina_purpurina:fada+marcial sono_encantado:fada+tempo cancao_feerica:fada+som leveza:fada+gravidade poeira_estelar:fada+espaco fornalha:industrial+fogo hidraulica:industrial+agua mineracao:industrial+terra pneumatica:industrial+ar usina:industrial+eletricidade artificio:industrial+arcano fuligem:industrial+sombra holofote:industrial+luz poluicao:industrial+vileza ferro_velho:industrial+morte biomecanica:industrial+vida exoesqueleto:industrial+vigor armaria:industrial+marcial relojoaria:industrial+tempo britadeira:industrial+som prensa:industrial+gravidade estacao_orbital:industrial+espaco brinquedo:industrial+fada queimada:planta+fogo mangue:planta+agua raiz_profunda:planta+terra polen:planta+ar fotossintese:planta+eletricidade druidismo:planta+arcano fungo:planta+sombra girassol:planta+luz espinheiro:planta+vileza murcha:planta+morte seiva:planta+vida carvalho:planta+vigor bambu:planta+marcial estacoes:planta+tempo farfalhar:planta+som trepadeira:planta+gravidade arvore_mundo:planta+espaco jardim_encantado:planta+fada estufa:planta+industrial';

/** Curados (08/11/2026, 3–4 bases; gerado de `ELEMENTOS_CURADOS`; a paridade reprova divergência). Preço = 3 (teto). */
const CURATED_RAW = 'pestilencia:planta+morte+vileza maldicao:fada+sombra+vileza cyber:industrial+eletricidade+arcano geiser:fogo+agua+terra vulcao:fogo+terra+ar deserto:fogo+terra+tempo relampago_seco:fogo+ar+eletricidade supernova:fogo+gravidade+espaco nevasca:agua+terra+ar permafrost:agua+terra+tempo monsoes:agua+ar+vida peste_negra:agua+vileza+morte coro_dos_afogados:agua+morte+som ossario_vivo:terra+morte+vida jardim_eterno:terra+vida+tempo aurora_boreal:ar+eletricidade+luz duelista_temporal:ar+marcial+tempo pulso_cosmico:eletricidade+som+espaco sabbat:arcano+sombra+vileza hipnose:arcano+sombra+som materia_escura:gravidade+sombra+arcano milagre:luz+vida+arcano memoria:tempo+arcano+luz coral_celeste:som+luz+arcano via_lactea:espaco+luz+arcano delirio:vileza+som+arcano cacador_de_almas:marcial+morte+sombra presagio:tempo+sombra+espaco horizonte_de_eventos:gravidade+espaco+sombra lamina_do_juizo:marcial+luz+morte bencao_marcial:luz+marcial+vigor arauto:marcial+som+luz farol:luz+espaco+som carniceiro:vileza+vigor+morte entropia_final:tempo+morte+gravidade gladiador:marcial+vigor+som punho_gravitico:marcial+gravidade+vigor avatar_elemental:fogo+agua+terra+ar titano_forjado:fogo+terra+vigor+marcial cataclismo:fogo+terra+gravidade+espaco sopro_do_dragao:fogo+ar+vigor+marcial ragnarok:fogo+morte+tempo+gravidade genesis:agua+terra+luz+vida tempestade_perfeita:agua+ar+eletricidade+som leviata:agua+sombra+morte+gravidade senhor_da_praga:agua+vileza+morte+vida sinfonia_do_caos:arcano+sombra+vileza+som vontade_absoluta:arcano+luz+vigor+som arquiteto_da_realidade:arcano+tempo+gravidade+espaco ceifador_estelar:sombra+morte+marcial+espaco renascimento:luz+morte+vida+tempo juizo_final:luz+morte+tempo+som cavaleiro_absoluto:luz+vigor+marcial+tempo clareira:planta+luz+vida alto_forno:industrial+fogo+terra bencao_feerica:fada+luz+vida floresta_ancestral:planta+terra+tempo+arcano colosso_blindado:industrial+eletricidade+vigor+marcial corte_feerica:fada+arcano+luz+som fantasma:morte+vida+tempo morto_vivo:morte+vida+vileza sangue:vida+vileza+agua furia:fogo+vigor+vileza';

/** @type {Map<string, readonly string[]>} id → bases distintas */
const COMPOSITION = new Map(BASE_ELEMENTS.map(b => [b, [b]]));
for (const tok of PAIRS_RAW.split(' ')) {
  const [id, comp] = tok.split(':');
  const [a, b] = comp.split('+');
  COMPOSITION.set(id, a === b ? [a] : [a, b]);
}
for (const tok of CURATED_RAW.split(' ')) {
  const [id, comp] = tok.split(':');
  COMPOSITION.set(id, comp.split('+'));
}

/** @param {unknown} id */
export const isKnownEssenceElement = id => typeof id === 'string' && COMPOSITION.has(id);
/** @param {string} id */
export const essenceBaseCount = id => COMPOSITION.get(id)?.length ?? 0;
/** @returns {string[]} */
export const essenceShopIds = () => [...COMPOSITION.keys()];

/** Preço de 1 essência; 0 = elemento desconhecido. @param {string} id */
/** 24/11/2026 (dono): preço em R$ equivalentes (taxa R$ 9,90 ÷ 150 = R$ 0,066 por Crédito). Unitário 8 / 30 / 61; pacote de 5 = 38 / 151 / 303. Espelho: `src/utils/essenceShop.ts`. */
const UNIT_BY_BASES = { 1: 8, 2: 30, 3: 61 };
const PACK5_BY_BASES = { 1: 38, 2: 151, 3: 303 };
export function essenceUnitPrice(id) {
  const n = essenceBaseCount(id);
  return n <= 0 ? 0 : UNIT_BY_BASES[Math.min(3, n)];
}

/**
 * Preço total de N essências (inteiro de 1 até o teto de estoque, sem limite por compra); 0 = inválido (§479, retrocompatível com §205). Aritmética inteira: para N ≤ 1.000.000 e unit ≤ 3 o total passa de 3 milhões, bem abaixo de 2^53.
 * Cada grupo COMPLETO de 5 sai com 10% off arredondado para baixo; o resto paga o preço unitário.
 * N=1 e N=5 dão exatamente os preços de antes (unit e floor(5*unit*0.9)).
 * @param {string} id @param {number} qty
 */
export function essencePackPrice(id, qty) {
  const unit = essenceUnitPrice(id);
  if (!unit || !Number.isSafeInteger(qty) || qty < 1 || qty > ESSENCE_MAX_PER_ELEMENT) return 0;
  const packs = Math.floor(qty / 5);
  return packs * PACK5_BY_BASES[Math.min(3, essenceBaseCount(id))] + (qty - packs * 5) * unit;
}
