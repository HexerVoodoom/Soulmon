/**
 * WP4.8 — O CARTÃO DE MEMÓRIAS (30 e 90 dias).
 *
 * O app conta o dia e conta a semana, e nunca contou a HISTÓRIA. Aos 30 e aos
 * 90 dias existe algo que nenhuma das duas telas alcança: um apanhado do que
 * essas semanas foram.
 *
 * Duas regras de conteúdo, e as duas são sobre o que ele NÃO faz:
 *  · **não é balanço.** Nenhum "você concluiu N tarefas", nenhum percentual,
 *    nenhuma comparação com o mês anterior. Um resumo de trinta dias com
 *    números vira avaliação de desempenho da própria vida — e este produto não
 *    faz isso nem no dia, quanto mais no mês. As contagens que aparecem são de
 *    COLEÇÃO (formas vividas, sonhos), que só crescem.
 *  · **não é gatilho de volta.** Aparece uma vez, dentro do relatório que a
 *    pessoa já ia ver. Não gera push, nem badge, nem lembrete.
 *
 * Canvas Rituais (RIT-13, D-R3): card SIS-03 centrado; o sprite 256² a 64
 * num vidro 96² — o pixel entra só em vidro, nunca solto no card.
 */
import { sm2Hint, sm2Text } from './form/FormKit';
import { SpriteGlass } from './ritual/RitualKit';
import type { Language } from '../utils/i18n';

interface MemoriesCardProps {
  /** 30 ou 90. */
  mark: number;
  petName: string;
  spriteUrl?: string | null;
  /** Nomes das formas já vividas. */
  formNames: readonly string[];
  /** Quantos sonhos foram coletados. Coleção: só cresce. */
  dreamCount: number;
  soulGoal?: string | null;
  language: Language;
}

export function MemoriesCard({
  mark, petName, spriteUrl, formNames, dreamCount, soulGoal, language,
}: MemoriesCardProps) {
  const isPt = language === 'pt-BR';

  return (
    <section
      aria-label={isPt ? 'Memórias' : 'Memories'}
      style={{
        padding: 12,
        borderRadius: 'var(--sm2-radius-md)',
        border: '1px solid var(--sm2-line)',
        backgroundColor: 'var(--sm2-surface)',
        boxSizing: 'border-box',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {/* A criatura na peça: sprite 256² a 64 num vidro 96² (RIT-13, D-R3). */}
      {spriteUrl && <SpriteGlass spriteUrl={spriteUrl} />}

      <p style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>
        {isPt ? `${mark} dias com ${petName}` : `${mark} days with ${petName}`}
      </p>

      {/* O que a pessoa escreveu no primeiro minuto, devolvido aqui. É a
          única frase do cartão que não é sobre a criatura — e é a que faz o
          resto significar alguma coisa. */}
      {soulGoal?.trim() && (
        <p style={sm2Hint}>
          {isPt
            ? `Começou assim: “${soulGoal.trim()}”.`
            : `It started like this: “${soulGoal.trim()}”.`}
        </p>
      )}

      {formNames.length > 0 && (
        <p style={sm2Hint}>
          {isPt ? 'Formas vividas: ' : 'Forms lived: '}
          {formNames.join(' · ')}
        </p>
      )}

      {dreamCount > 0 && (
        <p style={sm2Hint}>
          {isPt
            ? `${dreamCount} ${dreamCount === 1 ? 'sonho guardado' : 'sonhos guardados'}`
            : `${dreamCount} ${dreamCount === 1 ? 'dream kept' : 'dreams kept'}`}
        </p>
      )}
    </section>
  );
}

export default MemoriesCard;
