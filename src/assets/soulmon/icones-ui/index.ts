/**
 * Ícones de UI em pixel art (minimal-ui, correção pós-F3) — o set do squad de
 * arte (`gpt_image_2 --background transparent`, alfa real conferido com
 * Pillow), mesma linguagem dos prédios e NPCs. Originais em
 * `E:/Soulmon-assets/iso-20260923/home/final/icones/` e
 * `.../home/ui/chip-moeda.png`; aqui recortados na bounding box do alfa e
 * reduzidos para 128px no lado maior (ícone exibido a 24–32 CSS px, 3× DPR
 * cabe folgado) — a moldura de moeda para 256×92. O build converte para WebP.
 *
 * Pasta `icones-ui/` e não `ui/`: `ui/` é o nome do kit 9-slice de botão
 * aposentado, e o guard `ZERO PNG` de `assets.contract.test.ts` mantém ESSA
 * pasta fora do repo. Aqui são ícones e uma moldura de texto, não botão.
 *
 * Fatias F1–F3 tinham usado glifos vetoriais (`NavGlyphs`) no lugar deles por
 * engano; estes são o material aprovado.
 */
import iconMapa from './mapa.png';
import iconHome from './home.png';
import iconItens from './itens.png';
import iconDormir from './dormir.png';
import iconBanho from './banho.png';
import iconAcoes from './acoes.png';
import iconEnviar from './enviar.png';
import iconHp from './hp.png';
import iconEnergia from './energia.png';
import chipMoeda from './chip-moeda.png';
// Rodada 3 (30/09/2026, aprovada pelo dono): a mochila do passeio (32², ao pé do pet)
// e o sol de "Acordar" (128²), no lugar do emoji 🎒 e do glifo `wb_sunny`.
import iconMochila from './mochila.png';
import iconAcordar from './sol-acordar.png';
// Rodada 3, leva `extras` (22 ícones). Ver os mapas no fim do arquivo.
import insigniaSemente from './insignia-faixa-semente.png';
import insigniaBroto from './insignia-faixa-broto.png';
import insigniaGuardiao from './insignia-faixa-guardiao.png';
import insigniaAnciao from './insignia-faixa-anciao.png';
import insigniaLendario from './insignia-faixa-lendario.png';
import ceuSol from './ceu-sol.png';
import ceuLuaNova from './ceu-lua-nova.png';
import ceuLuaCrescente from './ceu-lua-crescente.png';
import ceuLuaQuarto from './ceu-lua-quarto.png';
import ceuLuaGibosa from './ceu-lua-gibosa.png';
import ceuLuaCheia from './ceu-lua-cheia.png';
import masmorraPorta from './masmorra-porta.png';
import masmorraBauFechado from './masmorra-bau-fechado.png';
import masmorraBauAberto from './masmorra-bau-aberto.png';
import masmorraEscada from './masmorra-escada.png';
import moedaBits from './moeda-bits.png';
import moedaEmblema from './moeda-emblema.png';
import moedaCreditos from './moeda-creditos.png';
import atributoPoder from './atributo-poder.png';
import atributoHarmonia from './atributo-harmonia.png';
import atributoBenevolencia from './atributo-benevolencia.png';
import atributoHabilidade from './atributo-habilidade.png';

export const UI_ICON_ART = {
  mapa: iconMapa,
  home: iconHome,
  itens: iconItens,
  dormir: iconDormir,
  banho: iconBanho,
  acoes: iconAcoes,
  enviar: iconEnviar,
  hp: iconHp,
  energia: iconEnergia,
  mochila: iconMochila,
  acordar: iconAcordar,
} as const;

export type UiIconArt = keyof typeof UI_ICON_ART;

/** Moldura de pílula (cobre + cristais), 256×92, para 9-slice via
 *  `border-image`. Fatias medidas por amostragem de pixel: tampa lateral
 *  ~48px (cristais), borda de cima 18, de baixo 18. */
export const CHIP_MOEDA_ART = chipMoeda;
export const CHIP_MOEDA_SLICE = { top: 18, right: 48, bottom: 18, left: 48 } as const;

/**
 * Insígnias das faixas do Torneio (64², aro de cobre como os emblemas), por `id` de
 * `utils/tournamentTiers.ts`. Consumidor: o card "Sua faixa" do `TournamentPage`, que
 * cai no glifo Material quando a faixa não tem arte.
 */
export const TIER_INSIGNIA_ART: Partial<Record<string, string>> = {
  semente: insigniaSemente,
  broto: insigniaBroto,
  guardiao: insigniaGuardiao,
  anciao: insigniaAnciao,
  lendario: insigniaLendario,
};

/** Céu do visor (64²): sol + 5 fases da lua. ⚠️ SEM CHAMADA (30/09/2026): nenhum visor
 *  desenha céu/fase da lua hoje — a arte espera o consumidor. */
export const SKY_ART = {
  sol: ceuSol,
  'lua-nova': ceuLuaNova,
  'lua-crescente': ceuLuaCrescente,
  'lua-quarto': ceuLuaQuarto,
  'lua-gibosa': ceuLuaGibosa,
  'lua-cheia': ceuLuaCheia,
} as const;

/** Masmorra (96²): porta, baú fechado/aberto, escada. ⚠️ SEM CHAMADA (30/09/2026): a
 *  `DungeonGame` não tem porta, baú nem escada desenhados hoje. */
export const DUNGEON_PROP_ART = {
  porta: masmorraPorta,
  'bau-fechado': masmorraBauFechado,
  'bau-aberto': masmorraBauAberto,
  escada: masmorraEscada,
} as const;

/** Moedas (64²). ⚠️ SEM CHAMADA (30/09/2026): os Bits são exibidos SEM ícone por regra
 *  (`utils/currencies.ts`), e Honra/Créditos ficam na UI de sistema, que é vetorial (D2).
 *  `emblema` é a moeda do Torneio (campo `emblems`, rótulo "Honra"/"Honor" na UI). */
export const CURRENCY_ART = {
  bits: moedaBits,
  emblema: moedaEmblema,
  creditos: moedaCreditos,
} as const;

/** Atributos (64², medalhão redondo). ⚠️ SEM CHAMADA (30/09/2026). Se um dia virarem
 *  ícone solto, a regra "ícone nunca dentro de box" (manual 04 §5.4) pede recortar só o
 *  símbolo do medalhão. */
export const ATTRIBUTE_ART = {
  power: atributoPoder,
  harmony: atributoHarmonia,
  benevolence: atributoBenevolencia,
  habilidade: atributoHabilidade,
} as const;
