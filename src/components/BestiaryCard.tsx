/**
 * WP4.6(b) — OS ENCONTROS.
 *
 * ⚠️ `bestiary` era escrito no save de TODO jogador desde 06/09/2026 e lido
 * por ninguém: até 36 strings crescendo no KV de produção, sem uma única tela.
 * É a terceira repetição do padrão que o WP4.15 consertou no Vínculo
 * (`bondRewardsClaimed` escrito e nunca lido) e o WP4.16 nas estações — quanto
 * mais completo o módulo, menos óbvio que ele está mudo.
 *
 * A receita é a do Dex de sonhos, e a escolha importa: o que ainda não foi
 * encontrado aparece como **silhueta**, não como espaço vazio. Silhueta diz
 * "existe e você ainda não viu"; vazio não diz nada, e a coleção só é coleção
 * quando o que falta é visível.
 *
 * **Nenhum número de desempenho.** A contagem que aparece é de COLEÇÃO e só
 * cresce — é a mesma régua do `dexProgress`. Nada aqui é percentual de
 * completude por linha, nada é "faltam N": a masmorra não cobra, e o acervo
 * dela também não.
 *
 * Canvas Estatísticas (§27, D-S5/D-S6): encontro = mini-visor 64² sem anel
 * (`MiniGlass`, o slot SIS-07) com o sprite 256² a 64 (0,25×, escala
 * inteira); a silhueta é `mask-image` do próprio PNG em
 * `color-mix(viewport-bg 58%, viewport-ink)` — tinta, nunca
 * `filter: brightness(0) opacity(.35)` (alpha no aparelho). `role=img`
 * "linha — tier" só no visto; a silhueta é `aria-hidden`. Com `hideMetrics`
 * a contagem "N of 36" some e as artes ficam (recompensa preservada).
 */
import { DUNGEON_LINE_SPRITES, DUNGEON_LINE_NAMES } from '../utils/sprites';
import { MiniGlass } from './ui/MiniGlass';
import { Icon } from './ui/Icon';
import type { Language } from '../utils/i18n';

/** Os tiers na ordem da escada da masmorra (`LADDER_TIERS`). Baby-i e baby-ii
 *  usam a arte de rookie, então a grade tem QUATRO colunas de arte — repetir a
 *  mesma imagem duas vezes seria uma coleção que mente sobre o próprio tamanho. */
const TIERS = ['rookie', 'champion', 'ultimate', 'mega'] as const;
type Tier = (typeof TIERS)[number];

/** Mini-visor 64² com o sprite 256² a 64 (0,25×). */
const SLOT = 64;

export function BestiaryCard({
  encountered, language, hideMetrics = false,
}: {
  /** Chaves `linha-tier` já enfrentadas (`bestiary` no save). Só cresce. */
  encountered: readonly string[];
  language: Language;
  /** Janela de Descanso: esconde a contagem, preserva as artes. */
  hideMetrics?: boolean;
}) {
  const isPt = language === 'pt-BR';
  const vistos = new Set(encountered);

  const linhas = Object.keys(DUNGEON_LINE_SPRITES);
  // Contagem de COLEÇÃO: quantas das artes possíveis (linhas × tiers) já apareceram.
  const total = linhas.length * TIERS.length;
  const achados = linhas.reduce(
    (n, l) => n + TIERS.filter(t => vistos.has(`${l}-${t}`)).length,
    0,
  );

  return (
    <section aria-label={isPt ? 'Encontros' : 'Encounters'} className="sm2-stats-cont" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="sm2-stats-ch">
        <Icon name="swords" size={24} tone="muted" />
        <h3 className="sm2-stats-h3">{isPt ? 'Encontros' : 'Encounters'}</h3>
      </div>
      {!hideMetrics && (
        <p className="sm2-stats-s sm2-num">
          {isPt
            ? `${achados} de ${total} criaturas da masmorra`
            : `${achados} of ${total} dungeon creatures`}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {linhas.map(linha => (
          <div key={linha} className="sm2-stats-bline">
            <p className="sm2-stats-s" style={{ color: 'var(--sm2-ink)', fontWeight: 500 }}>
              {DUNGEON_LINE_NAMES[linha] ?? linha}
            </p>
            <div className="sm2-stats-brow">
              {TIERS.map(tier => {
                const visto = vistos.has(`${linha}-${tier}`);
                const src = DUNGEON_LINE_SPRITES[linha][tier as Tier];
                const nome = `${DUNGEON_LINE_NAMES[linha] ?? linha} — ${tier}`;
                return visto ? (
                  /* O visto: o vidro leva o nome (`role=img`), a arte é decorativa. */
                  <span key={tier} role="img" aria-label={nome} title={tier} style={{ display: 'inline-flex' }}>
                    <MiniGlass size={SLOT}>
                      <img
                        src={src}
                        alt=""
                        width={SLOT}
                        height={SLOT}
                        style={{ display: 'block', width: SLOT, height: SLOT, imageRendering: 'pixelated' }}
                      />
                    </MiniGlass>
                  </span>
                ) : (
                  /* A silhueta: a arte existe, o desenho não se revela. Máscara
                     do próprio PNG, preenchida com tinta derivada do vidro —
                     a FORMA se lê, que é o que faz a pessoa querer encontrar. */
                  <MiniGlass key={tier} size={SLOT}>
                    <span
                      data-silhouette
                      className="sm2-stats-sil"
                      style={{
                        width: SLOT, height: SLOT,
                        WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`,
                        WebkitMaskSize: `${SLOT}px ${SLOT}px`, maskSize: `${SLOT}px ${SLOT}px`,
                      }}
                    />
                  </MiniGlass>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default BestiaryCard;
