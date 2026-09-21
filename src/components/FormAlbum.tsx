/**
 * WP4.6 / WP4.10 — O ÁLBUM DAS FORMAS VIVIDAS.
 *
 * O jogo guardava `unlockedEvolutions` — uma lista de ids — e mostrava dela
 * apenas os NOMES, numa linha de texto separada por pontos. Ou seja: a coisa
 * mais cara que o jogador constrói (meses de cuidado virando formas) era uma
 * string. Aqui ela vira um álbum, no mesmo molde do `DreamDex`: o que foi
 * vivido aparece com arte e data; o que não foi, como silhueta.
 *
 * Três regras, herdadas do Dex e do que o produto já decidiu:
 *  · **a ausência é convite, nunca dívida.** Forma não alcançada é silhueta —
 *    sem vermelho, sem "faltam N", sem contador de falta.
 *  · **a data é a PRIMEIRA vez** (`utils/collectionDates.ts`), e some quando
 *    não existe. Save antigo não tem data, e inventar uma envelheceria a
 *    coleção inteira para o dia da atualização do app.
 *  · **nenhum número de desempenho.** A contagem de completude ("4 de 11") é
 *    de COLEÇÃO, que só cresce — a mesma admissão que o Dex já faz.
 *
 * Canvas Estatísticas (§27, D-S7): forma vivida = slot 64² (`MiniGlass`, a
 * mesma célula do Dex) com o sprite 256² a 64 (0,25×); a não alcançada é
 * silhueta por `mask-image` em tinta derivada do vidro, com "???"; a data em
 * tinta `muted` (nunca `opacity .7`). A moldura 72×72 com `<img 72>` saiu.
 */
import { MiniGlass } from './ui/MiniGlass';
import { collectedAt } from '../utils/collectionDates';
import type { Language } from '../utils/i18n';

export interface AlbumForm {
  id: string;
  name: string;
  /** Sprite próprio, quando já existe. Sem ele, o vidro fica vazio. */
  spriteUrl?: string | null;
}

interface FormAlbumProps {
  /** Todas as formas da árvore, na ordem dela. */
  forms: readonly AlbumForm[];
  /** Ids já alcançados (`unlockedEvolutions`). */
  reached: readonly string[];
  /** WP4.10 — quando cada uma foi alcançada. Ausente = sem data. */
  reachedAt?: Record<string, string>;
  language: Language;
  /** Janela de Descanso: esconde a contagem "N/11", preserva as artes. */
  hideMetrics?: boolean;
}

/** Slot 64² = a MESMA célula do Dex do Pet (canvas §27, D-S7); sprite 256² a 64 (0,25×). */
const SLOT = 64;

function dataCurta(dayKey: string, isPt: boolean): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(isPt ? 'pt-BR' : 'en-US', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  }).format(d);
}

export function FormAlbum({ forms, reached, reachedAt, language, hideMetrics = false }: FormAlbumProps) {
  const isPt = language === 'pt-BR';
  const vistas = new Set(reached);
  const total = forms.length;
  const colecionadas = forms.filter(f => vistas.has(f.id)).length;

  return (
    <section aria-label={isPt ? 'Formas vividas' : 'Forms lived'} className="sm2-stats-cont" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p className="sm2-stats-s" style={{ color: 'var(--sm2-ink)', fontWeight: 500 }}>
        {isPt ? 'Formas vividas' : 'Forms lived'}
      </p>
      {/* Contagem de COLEÇÃO, que só cresce — nunca de desempenho. Some com o descanso. */}
      {!hideMetrics && (
        <p className="sm2-stats-s sm2-num">
          {colecionadas}/{total}
        </p>
      )}

      <ul className="sm2-stats-agrid">
        {forms.map(f => {
          const viva = vistas.has(f.id);
          const quando = viva ? collectedAt(reachedAt, f.id) : null;
          const data = quando ? dataCurta(quando, isPt) : null;
          return (
            <li key={f.id} className={viva ? 'sm2-stats-acell' : 'sm2-stats-acell off'}>
              {/* A vivida: o vidro leva o nome (`role=img`); a arte é decorativa. */}
              {viva && f.spriteUrl ? (
                <span role="img" aria-label={f.name} style={{ display: 'inline-flex' }}>
                  <MiniGlass size={SLOT}>
                    <img
                      src={f.spriteUrl}
                      alt=""
                      width={SLOT}
                      height={SLOT}
                      style={{ display: 'block', width: SLOT, height: SLOT, imageRendering: 'pixelated' }}
                    />
                  </MiniGlass>
                </span>
              ) : (
                <MiniGlass size={SLOT}>
                  {f.spriteUrl ? (
                    /* Silhueta para o que ainda não foi vivido: máscara do
                       próprio PNG em tinta derivada do vidro — mostra a FORMA
                       sem entregar quem é. Mesmo gesto do nó previsto na
                       Evolução e do Dex: a ausência aqui é convite. */
                    <span
                      data-silhouette
                      className="sm2-stats-sil"
                      style={{
                        width: SLOT, height: SLOT,
                        WebkitMaskImage: `url(${f.spriteUrl})`, maskImage: `url(${f.spriteUrl})`,
                        WebkitMaskSize: `${SLOT}px ${SLOT}px`, maskSize: `${SLOT}px ${SLOT}px`,
                      }}
                    />
                  ) : null}
                </MiniGlass>
              )}
              <span className="nm">{viva ? f.name : '???'}</span>
              {data && <span className="dt">{data}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default FormAlbum;
