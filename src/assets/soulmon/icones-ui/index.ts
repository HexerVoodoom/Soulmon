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
} as const;

export type UiIconArt = keyof typeof UI_ICON_ART;

/** Moldura de pílula (cobre + cristais), 256×92, para 9-slice via
 *  `border-image`. Fatias medidas por amostragem de pixel: tampa lateral
 *  ~48px (cristais), borda de cima 18, de baixo 18. */
export const CHIP_MOEDA_ART = chipMoeda;
export const CHIP_MOEDA_SLICE = { top: 18, right: 48, bottom: 18, left: 48 } as const;
