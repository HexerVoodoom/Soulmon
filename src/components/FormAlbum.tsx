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
 */
import type { CSSProperties } from 'react';
import { sm2Hint, sm2Text } from './form/FormKit';
import { collectedAt } from '../utils/collectionDates';
import type { Language } from '../utils/i18n';

export interface AlbumForm {
  id: string;
  name: string;
  /** Sprite próprio, quando já existe. Sem ele, a moldura fica vazia. */
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
}

const moldura: CSSProperties = {
  width: 72,
  height: 72,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 10,
  border: '1px solid var(--sm2-line)',
  backgroundColor: 'var(--sm2-surface)',
  overflow: 'hidden',
};

function dataCurta(dayKey: string, isPt: boolean): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(isPt ? 'pt-BR' : 'en-US', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  }).format(d);
}

export function FormAlbum({ forms, reached, reachedAt, language }: FormAlbumProps) {
  const isPt = language === 'pt-BR';
  const vistas = new Set(reached);
  const total = forms.length;
  const colecionadas = forms.filter(f => vistas.has(f.id)).length;

  return (
    <section aria-label={isPt ? 'Formas vividas' : 'Forms lived'}>
      <p style={{ ...sm2Text, margin: '0 0 2px', fontWeight: 600 }}>
        {isPt ? 'Formas vividas' : 'Forms lived'}
      </p>
      {/* Contagem de COLEÇÃO, que só cresce — nunca de desempenho. */}
      <p className="sm2-num" style={{ ...sm2Hint, margin: '0 0 10px' }}>
        {colecionadas}/{total}
      </p>

      <ul style={{
        listStyle: 'none', margin: 0, padding: 0,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 10,
      }}>
        {forms.map(f => {
          const viva = vistas.has(f.id);
          const quando = viva ? collectedAt(reachedAt, f.id) : null;
          const data = quando ? dataCurta(quando, isPt) : null;
          return (
            <li key={f.id} style={{ textAlign: 'center' }}>
              <span style={moldura}>
                {f.spriteUrl ? (
                  <img
                    src={f.spriteUrl}
                    alt={viva ? f.name : ''}
                    width={64}
                    height={64}
                    style={{
                      objectFit: 'contain',
                      imageRendering: 'pixelated',
                      /* Silhueta para o que ainda não foi vivido: mostra a
                         FORMA sem entregar quem é. É o mesmo gesto do nó
                         previsto na página de Evolução, e a mesma razão: a
                         ausência aqui é convite. */
                      ...(viva ? null : { filter: 'brightness(0)', opacity: .35 }),
                    }}
                  />
                ) : null}
              </span>
              <span style={{ ...sm2Hint, display: 'block', marginTop: 4 }}>
                {viva ? f.name : '???'}
              </span>
              {data && (
                <span style={{ ...sm2Hint, display: 'block', opacity: .7 }}>{data}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default FormAlbum;
