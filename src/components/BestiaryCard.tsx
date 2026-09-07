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
 */
import type { CSSProperties } from 'react';
import { DUNGEON_LINE_SPRITES, DUNGEON_LINE_NAMES } from '../utils/sprites';
import { sm2Hint, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';

/** Os tiers na ordem da escada da masmorra (`LADDER_TIERS`). Baby-i e baby-ii
 *  usam a arte de rookie, então a grade tem QUATRO colunas de arte — repetir a
 *  mesma imagem duas vezes seria uma coleção que mente sobre o próprio tamanho. */
const TIERS = ['rookie', 'champion', 'ultimate', 'mega'] as const;
type Tier = (typeof TIERS)[number];

const moldura: CSSProperties = {
  width: 56,
  height: 56,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 10,
  border: '1px solid var(--sm2-line)',
  backgroundColor: 'var(--sm2-surface-2)',
};

export function BestiaryCard({
  encountered, language,
}: {
  /** Chaves `linha-tier` já enfrentadas (`bestiary` no save). Só cresce. */
  encountered: readonly string[];
  language: Language;
}) {
  const isPt = language === 'pt-BR';
  const vistos = new Set(encountered);

  const linhas = Object.keys(DUNGEON_LINE_SPRITES);
  // Contagem de COLEÇÃO: quantas das 24 artes possíveis já apareceram.
  const total = linhas.length * TIERS.length;
  const achados = linhas.reduce(
    (n, l) => n + TIERS.filter(t => vistos.has(`${l}-${t}`)).length,
    0,
  );

  return (
    <section aria-label={isPt ? 'Encontros' : 'Encounters'}>
      <h3 className="sm2-title" style={{ margin: '0 0 4px' }}>
        {isPt ? 'Encontros' : 'Encounters'}
      </h3>
      <p style={{ ...sm2Hint, margin: '0 0 10px' }}>
        {isPt
          ? `${achados} de ${total} criaturas da masmorra`
          : `${achados} of ${total} dungeon creatures`}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {linhas.map(linha => (
          <div key={linha}>
            <p style={{ ...sm2Text, margin: '0 0 4px', fontWeight: 600 }}>
              {DUNGEON_LINE_NAMES[linha] ?? linha}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {TIERS.map(tier => {
                const visto = vistos.has(`${linha}-${tier}`);
                return (
                  <div key={tier} style={moldura} title={visto ? tier : undefined}>
                    <img
                      src={DUNGEON_LINE_SPRITES[linha][tier as Tier]}
                      alt={visto ? `${DUNGEON_LINE_NAMES[linha] ?? linha} — ${tier}` : ''}
                      aria-hidden={visto ? undefined : true}
                      width={44}
                      height={44}
                      style={{
                        objectFit: 'contain',
                        imageRendering: 'pixelated',
                        // A silhueta: a arte existe, o desenho não se revela.
                        // `brightness(0)` some com o conteúdo e mantém a FORMA,
                        // que é justamente o que faz a pessoa querer encontrar.
                        filter: visto ? undefined : 'brightness(0) opacity(.35)',
                      }}
                    />
                  </div>
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
