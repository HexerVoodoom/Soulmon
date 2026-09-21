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
 *
 * Canvas Estatísticas (§27, D-S4): o cartão é um VISOR — o sprite 256² a 128
 * (0,5×, escala inteira) centrado no vidro 192² com anel de cobre, o MESMO
 * `Viewport` do reveal e da Home. O `<img 112>` solto (0,44×) saiu. O vidro
 * leva `role=img` com o nome (o `alt` de antes, dito uma vez); embaixo é
 * aparelho: "BORN · <data>" em rótulo 12/500 caixa alta, o nome Fredoka 24,
 * "You said…" 12 `muted`. O epíteto, quando vem, entra em `gold-ink` entre o
 * nome e a frase.
 */
import { Viewport } from './ui/Viewport';
import type { Language } from '../utils/i18n';

interface BirthCardProps {
  /** Sprite próprio da forma inicial, quando existe. Sem ele, o cartão mostra
   *  o vidro vazio — nunca uma arte de reserva, que seria outra criatura. */
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

/** O vidro 192² = 64 lógicos × 3; o sprite 256² a 128 = 0,5× (P2 a). */
const GLASS = 64;
const SPRITE = 128;

export function BirthCard({ spriteUrl, name, epithet, soulGoal, bornAt, language }: BirthCardProps) {
  const isPt = language === 'pt-BR';
  const data = bornAt ? dataPorExtenso(bornAt, isPt) : null;

  return (
    <section
      aria-label={isPt ? 'Cartão de nascimento' : 'Birth card'}
      className="sm2-stats-card sm2-stats-birth"
    >
      {/* O visor: anel de cobre + vidro escuro nos dois temas. `label` = o
          nome, e só ele — o `img` dentro é decorativo (`alt=""`). Sem sprite
          o vidro fica vazio, de propósito: nunca outra criatura. */}
      <Viewport
        width={GLASS}
        height={GLASS}
        scale={3}
        breathing={false}
        label={name}
        screenStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {spriteUrl && (
          <img
            src={spriteUrl}
            alt=""
            width={SPRITE}
            height={SPRITE}
            style={{ display: 'block', width: SPRITE, height: SPRITE, imageRendering: 'pixelated' }}
          />
        )}
      </Viewport>

      <p className="sm2-stats-lab">
        {isPt ? 'Nasceu' : 'Born'}
        {data ? ` · ${data}` : ''}
      </p>

      <h2 className="sm2-stats-word">{name}</h2>

      {epithet && (
        <p className="sm2-stats-s" style={{ color: 'var(--sm2-gold-ink)', fontWeight: 500 }}>
          {epithet}
        </p>
      )}

      {soulGoal?.trim() && (
        <p className="sm2-stats-s">
          {isPt
            ? `Você disse: “${soulGoal.trim()}”. ${name} nasceu disso.`
            : `You said: “${soulGoal.trim()}”. ${name} was born from that.`}
        </p>
      )}
    </section>
  );
}

export default BirthCard;
