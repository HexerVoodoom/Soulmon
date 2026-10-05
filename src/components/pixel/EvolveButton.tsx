/**
 * O BOTÃO "EVOLUIR" (B3, rodada 3 do dono, 02/10/2026).
 *
 * O dono pediu o botão mais dramático, CENTRALIZADO no alto da área do pet e
 * com acabamento próprio da identidade. Ele aparece só quando a evolução está
 * pronta (`canEvolve`), então o drama é o ponto: é o único CTA que faz o jogo
 * avançar.
 *
 * ── ACABAMENTO ─────────────────────────────────────────────────────────────
 * CSS puro, na língua do vidro (index.css › `.sm2-evolve-btn`): cantos
 * CHANFRADOS em degraus de pixel (clip-path), moldura dupla (ciano de
 * `--sm2-primary-ink` por fora, ouro de `--sm2-gold-ink` por dentro), placa
 * `--sm2-viewport-bg`, faíscas ✦ nas pontas e um brilho que PULSA — o pulso é
 * só de `box-shadow`/`filter` (nada de mexer no layout) e some com
 * `prefers-reduced-motion` (a mesma regra, em CSS e pelo hook do componente).
 *
 * ── PONTO DE TROCA PARA A ARTE FINAL ───────────────────────────────────────
 * A arte final será uma imagem gerada pelo dono. Basta soltar o arquivo em
 * `src/assets/icons/evoluir-btn.png`: se ele existir, é usado como MOLDURA/
 * fundo do botão (9-slice não é necessário: `background-size: 100% 100%`); se
 * não existir, vale o CSS. Nada mais muda. ARTE INSTALADA em 04/10/2026
 * (entrega do dono, alfa real, 468×137 = 3× de 156×46): com ela, o CSS de
 * `[data-evolve-art="image"]` (fim do `index.css`) tira a placa, o contorno de
 * `box-shadow` e o pulso — a moldura é a imagem. O RÓTULO continua sendo texto vivo
 * ("Evoluir"/"Evolve", PT+EN, acessível) por cima da arte — por isso a imagem
 * deve vir SEM texto. `import.meta.glob` com arquivo ausente devolve `{}`, não
 * quebra o build.
 */
import type { CSSProperties } from 'react';

const artMods =import.meta.glob('../../assets/icons/evoluir-btn.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;
/** URL da arte do dono, quando ela existir; `undefined` = acabamento em CSS. */
export const EVOLVE_BTN_ART: string | undefined = Object.values(artMods)[0];

/** Altura do botão (o balão de fala desce esta altura quando ele está na tela). */
export const EVOLVE_BTN_H = 56;

export function EvolveButton({
  language,
  onClick,
  reducedMotion,
  style,
}: {
  language: 'pt-BR' | 'en-US';
  onClick?: () => void;
  /** Movimento reduzido: sem pulso, o brilho fica fixo. */
  reducedMotion: boolean;
  /** Posição (quem monta decide onde ele mora). */
  style?: CSSProperties;
}) {
  const label = language === 'pt-BR' ? 'Evoluir' : 'Evolve';
  return (
    <button
      type="button"
      onClick={onClick}
      data-evolve-btn
      data-evolve-art={EVOLVE_BTN_ART ? 'image' : 'css'}
      className="sm2-evolve-btn"
      aria-label={label}
      style={{
        ...style,
        minHeight: EVOLVE_BTN_H,
        backgroundImage: EVOLVE_BTN_ART ? `url(${EVOLVE_BTN_ART})` : undefined,
        animation: reducedMotion ? 'none' : undefined,
      }}
    >
      {/* Com a arte do dono, os cristais das pontas já são dela: as faíscas ✦ saem. */}
      {!EVOLVE_BTN_ART && <span aria-hidden="true" className="sm2-evolve-spark">✦</span>}
      <span className="sm2-evolve-label">{label}</span>
      {!EVOLVE_BTN_ART && <span aria-hidden="true" className="sm2-evolve-spark">✦</span>}
    </button>
  );
}
