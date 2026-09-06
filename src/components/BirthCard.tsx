/**
 * WP1.6 — O CARTÃO DE NASCIMENTO.
 *
 * A mesma peça em dois lugares: no reveal (o momento) e nas Estatísticas (a
 * lembrança). Era para ser a mesma coisa, e ser a mesma coisa é o ponto — um
 * cartão desenhado duas vezes divergiria, e o que a pessoa guardaria na
 * memória não seria o que ela reencontra depois.
 *
 * Duas regras de conteúdo, e as duas são sobre o que ele NÃO mostra:
 *  · **nenhum número.** Nem dias, nem nível, nem contagem de nada. Isto é uma
 *    certidão, não um painel: assim que entra um número, a pessoa passa a ler
 *    o próprio nascimento como desempenho. Há teste varrendo dígitos.
 *  · **nenhum verbo de personalidade fechada.** O cartão diz DE ONDE a
 *    criatura veio (a leitura, o que a pessoa escreveu), nunca COMO ela é —
 *    descrição fechada impede a pessoa de projetar a própria história nela,
 *    que é o mecanismo inteiro do vínculo.
 *
 * A data aparece por extenso e sem ano-mês-dia numérico, pelo mesmo motivo do
 * primeiro item: "6 de setembro" é uma lembrança; "2026-09-06" é um registro.
 */
import { sm2Hint, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';

interface BirthCardProps {
  /** Sprite próprio da forma inicial, quando existe. Sem ele, o cartão mostra
   *  a moldura vazia — nunca uma arte de reserva, que seria outra criatura. */
  spriteUrl?: string | null;
  name: string;
  /** Linha de essência do oráculo ("Essência X · Ofício Y"), se houver. */
  epithet?: string | null;
  /** O que a pessoa escreveu no início do ritual. Ausente = ela pulou. */
  soulGoal?: string | null;
  /** `bornAt` no formato do dia do jogador (`YYYY-MM-DD`). */
  bornAt?: string | null;
  language: Language;
}

/** Data por extenso, sem número de ano. "6 de setembro" é lembrança; a data
 *  ISO é registro, e registro é o que este cartão não quer ser. */
function dataPorExtenso(bornAt: string, isPt: boolean): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(bornAt);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(isPt ? 'pt-BR' : 'en-US', {
    day: 'numeric', month: 'long', timeZone: 'UTC',
  }).format(d);
}

export function BirthCard({ spriteUrl, name, epithet, soulGoal, bornAt, language }: BirthCardProps) {
  const isPt = language === 'pt-BR';
  const data = bornAt ? dataPorExtenso(bornAt, isPt) : null;

  return (
    <section
      aria-label={isPt ? 'Cartão de nascimento' : 'Birth card'}
      style={{
        padding: 16,
        borderRadius: 12,
        border: '1px solid var(--sm2-line)',
        backgroundColor: 'var(--sm2-surface)',
        textAlign: 'center',
      }}
    >
      {spriteUrl && (
        <img
          src={spriteUrl}
          alt={name}
          width={112}
          height={112}
          style={{ objectFit: 'contain', imageRendering: 'pixelated', display: 'block', margin: '0 auto 8px' }}
        />
      )}

      <p style={{ ...sm2Hint, letterSpacing: '.08em', textTransform: 'uppercase', margin: 0 }}>
        {isPt ? 'Nasceu' : 'Born'}
        {data ? ` · ${data}` : ''}
      </p>

      <h2 style={{
        fontFamily: 'var(--sm2-font-display)',
        fontSize: 'var(--sm2-text-xl)',
        lineHeight: 'var(--sm2-leading-title)',
        fontWeight: 600,
        color: 'var(--sm2-ink)',
        margin: '4px 0',
      }}>
        {name}
      </h2>

      {epithet && (
        <p style={{ ...sm2Hint, color: 'var(--sm2-gold-ink)', fontWeight: 500, margin: '0 0 8px' }}>
          {epithet}
        </p>
      )}

      {soulGoal?.trim() && (
        <p style={{ ...sm2Text, margin: '8px 0 0', color: 'var(--sm2-muted)' }}>
          {isPt
            ? `Você disse: “${soulGoal.trim()}”. ${name} nasceu disso.`
            : `You said: “${soulGoal.trim()}”. ${name} was born from that.`}
        </p>
      )}
    </section>
  );
}

export default BirthCard;
