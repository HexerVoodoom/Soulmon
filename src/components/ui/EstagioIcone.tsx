import { estagioIcone } from '../../assets/soulmon/icones-ui/estagio';
import { getStageBranch } from '../../types/progression';
import { corDoCaminho, ATTR_ON_FILL_INK, type BranchType } from '../../types/attributes';

export type EstagioCaminho = BranchType;

/**
 * O caminho embutido no id da forma (`mega-power` → `power`). Rookie, ultra, tier de inimigo sem ramo e ids
 * desconhecidos: `undefined` (neutro). Nunca inventa: só lê o que o id já diz.
 */
export function caminhoDaForma(forma: string | null | undefined): EstagioCaminho | undefined {
  return typeof forma === 'string' ? getStageBranch(forma) ?? undefined : undefined;
}

/**
 * Contorno escuro fino do ícone TINGIDO (§369): o amarelo da Benevolência some sobre a plaquinha clara; o
 * contorno dá a borda que o separa do fundo em qualquer tema. Vale para os três caminhos (o ícone não muda de peso por cor).
 */
const CONTORNO = `drop-shadow(0 0 0.6px ${ATTR_ON_FILL_INK}) drop-shadow(0 0 0.6px ${ATTR_ON_FILL_INK})`;

/**
 * O ícone do estágio (rookie→ultra) em pixel art, SEMPRE colorido (§369 + §394): a cor é a do caminho da forma (`CAMINHO_COR`) ou,
 * sem caminho, o creme `CAMINHO_SEM_COR`. É o ÚNICO ponto do app que renderiza o PNG do set de estágio (guard em
 * `EstagioIcone.guard.test.ts`). Bebê/ovo e ids desconhecidos: não renderiza nada (não há PNG).
 *
 * `caminho` é opcional e SOBRESCREVE o derivado do id da forma (`mega-power` → `power`); `null` força o creme. Técnica ÚNICA: o PNG
 * do set atual vira `mask-image` (só a silhueta/alfa) e a cor entra como `background-color`; o contorno escuro é um `drop-shadow`
 * no invólucro (no próprio elemento mascarado a máscara recortaria a sombra). Sem `label`: decorativo (`aria-hidden`), o nome do
 * estágio está no texto vizinho; com `label`, `role="img"` + `aria-label`.
 */
export function EstagioIcone({ forma, size = 18, label, style, caminho }: {
  forma: string | null | undefined; size?: number; label?: string; style?: React.CSSProperties; caminho?: EstagioCaminho | null;
}) {
  const src = estagioIcone(forma);
  if (!src) return null;
  const efetivo = caminho === undefined ? caminhoDaForma(forma) : caminho ?? undefined;
  const cor = corDoCaminho(efetivo);
  const mascara = `url("${src}") center / contain no-repeat`;
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-estagio-icone={forma}
      data-estagio-caminho={efetivo ?? 'nenhum'}
      style={{ display: 'inline-block', width: size, height: size, flex: 'none', imageRendering: 'pixelated', filter: CONTORNO, ...style }}
    >
      <span
        data-estagio-tinta
        style={{
          display: 'block', width: '100%', height: '100%', backgroundColor: cor, imageRendering: 'pixelated',
          WebkitMask: mascara, mask: mascara,
        }}
      />
    </span>
  );
}
