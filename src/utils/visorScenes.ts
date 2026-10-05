/**
 * CENAS DE MINI-VISOR (rodada 3, 01/10/2026) — os fundos de faixa 696×160 e a cena da
 * Feira (696×352) da leva `visores` (`E:/Soulmon-assets/out/rodada3/visores/MANIFEST.md`),
 * mais os sprites 48² de FX dos minijogos da Mente/Refúgio e o ovo do Renascimento.
 *
 * A faixa é 4× o pixel de arte (174×40 de arte → 696×160). O vidro do `GameVisor` tem
 * 348 de largura por `altura×2` — então a faixa NUNCA é esticada nem reescalada em
 * fração: ela entra em tamanho NATIVO (`auto 160px`), ancorada embaixo e centrada, e o
 * que sobra de altura (Bolhas, 240) é preenchido por um degradê que parte da cor do
 * topo da arte. Esticar com `cover` borraria o pixel (escala 0,9× / 1,5×).
 *
 * Quem consome decide a cena; este arquivo só guarda arte e receita (footgun 9: a
 * receita da faixa existe uma vez).
 */
import trocaCeu from '../assets/soulmon/bg/mente-troca-ceu.png';
import trocaGruta from '../assets/soulmon/bg/mente-troca-gruta.png';
import visorAtelie from '../assets/soulmon/bg/visor-atelie.png';
import visorRefugio from '../assets/soulmon/bg/visor-refugio.png';
import visorFeira from '../assets/soulmon/bg/visor-feira.png';
import ovoRenascimento from '../assets/soulmon/fx/ovo-renascimento.png';
import pedraCirculo from '../assets/soulmon/fx/fx-pedra-circulo.png';
import pedraTriangulo from '../assets/soulmon/fx/fx-pedra-triangulo.png';
import pedraQuadrado from '../assets/soulmon/fx/fx-pedra-quadrado.png';
import pedraLosango from '../assets/soulmon/fx/fx-pedra-losango.png';
import bolhaSonho from '../assets/soulmon/fx/fx-bolha-sonho.png';
import bolhaRespiro from '../assets/soulmon/fx/fx-bolha-respiro.png';
import fiapo from '../assets/soulmon/fx/fx-fiapo.png';
import pop from '../assets/soulmon/fx/fx-pop.png';
import fumaca from '../assets/soulmon/fx/fx-fumaca.png';

/** Altura nativa (CSS px) da faixa de mini-visor. */
export const VISOR_STRIP_H = 160;
/** Largura nativa (CSS px) da faixa de mini-visor (o vidro tem a metade: 348). */
export const VISOR_STRIP_W = 696;

/** Faixa em tamanho nativo, ancorada embaixo; `fallback` pinta o que a faixa não cobre. */
export function visorStrip(src: string, fallback = 'var(--sm2-viewport-bg)'): string {
  return `url(${src}) center bottom/auto ${VISOR_STRIP_H}px no-repeat, ${fallback}`;
}

/** Cor média da primeira linha de `visor-refugio` (a água ao fundo): o degradê de cima parte dela. */
const REFUGIO_TOPO = '#234749';

export const VISOR_ART = {
  trocaCeu,
  trocaGruta,
  visorAtelie,
  visorRefugio,
  visorFeira,
} as const;

/** Cor média da primeira linha de `visor-atelie` (o teto de raízes): o degradê de reserva parte dela. */
const ATELIE_TOPO = '#133738';
/** Medida nativa da cena ALTA do Ateliê (04/10/2026): 696×320 = 174×80 pixels de arte a 4×. */
const ATELIE_ART_H = 320;

/**
 * Ateliê da Mente (Eco, Revisão): centro livre, pedras nas prateleiras.
 *
 * J4 (rodada 7, 04/10/2026): o fundo do Eco "estava ruim" porque a faixa 696×160 entrava em
 * tamanho NATIVO num vidro de 348 — só o MIOLO vazio aparecia. Primeiro conserto: a faixa inteira
 * a 0,5× com um degradê por cima. Segundo (mesmo dia, bloco 37 do dono): a cena ficou ALTA —
 * caverna-estúdio com teto de raízes, pilares de runa e prateleiras, 696×320 (174×80 de arte a 4×,
 * `entrada-dono/37-visor-atelie`, pixelizada fator 4, 16 cores). A 0,5× ela vira 348×160 = o vidro
 * do Eco inteiro (`GameVisor height={80}` ×2), com 2×2 px por pixel de arte — nítido, sem fração.
 * A Revisão (vidro 144) corta só o alto do teto (âncora embaixo). O degradê fica de reserva.
 */
export const ATELIE_SCENE =
  `url(${visorAtelie}) center bottom/${VISOR_STRIP_W / 2}px ${ATELIE_ART_H / 2}px no-repeat, `
  + `linear-gradient(180deg, var(--sm2-viewport-bg) 0, ${ATELIE_TOPO} 100%)`;

/** Refúgio (Bolhas, Respiração): lago calmo, centro livre. Acima da faixa, o degradê da cor do topo dela. */
export const REFUGIO_SCENE = visorStrip(
  visorRefugio,
  `linear-gradient(180deg, var(--sm2-viewport-bg) 0, ${REFUGIO_TOPO} calc(100% - ${VISOR_STRIP_H}px), ${REFUGIO_TOPO} 100%)`,
);

/** Fundos de Troca de Regra; o degradê antigo continua como cor de reserva. */
export function trocaCeuScene(fallback: string): string { return visorStrip(trocaCeu, fallback); }
export function trocaGrutaScene(fallback: string): string { return visorStrip(trocaGruta, fallback); }

/** FX 48² dos minijogos (pixel, alfa real). A ordem das pedras é a de `STONES` do Eco. */
export const MINI_FX = {
  pedras: [pedraCirculo, pedraTriangulo, pedraQuadrado, pedraLosango],
  bolhaSonho,
  bolhaRespiro,
  fiapo,
  pop,
  fumaca,
} as const;

/** O ovo da cerimônia de Renascimento (256² alfa; desenhado a 128 = 0,5×). */
export const OVO_RENASCIMENTO = ovoRenascimento;
