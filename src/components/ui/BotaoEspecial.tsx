import { forwardRef, type ButtonHTMLAttributes } from 'react';

/**
 * BOTÃO ESPECIAL DE COMPRA (18/11/2026, pedido do dono): a placa dourada com pedra turquesa escura da moldura de card, só para
 * COMPRAS com custo à vista no botão (tickets do Salão, convites da Arena). A compra em si não muda; só o visual. Mesmo método do
 * `CtaButton`: fatiamento em 3 partes por `border-image` (pontas douradas fixas, miolo liso que estica), um arquivo por estado
 * (`assets/soulmon/ui/btn-especial{,-press,-off}.webp`). Dono único do visual: `.sm2-especial` em `index.css` (pressionado,
 * desabilitado, foco visível, alvo >= 44, movimento reduzido no bloco canônico). Sem texto na arte: o rótulo e o custo (`EnergyCost`)
 * vêm como `children`. Para as demais ações seguem `CtaButton` / `sm2-kit-btn`.
 */
export interface BotaoEspecialProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `full` ocupa a linha inteira (padrão); `auto` só o conteúdo (com largura mínima). */
  width?: 'full' | 'auto';
  /**
   * Arte do botão (18/11/2026, ranking): `dourado` (padrão, compras), `pve` (Aventura do Match-3 e Amistoso/Sparring do Torneio: pedra com musgo,
   * folhinha e diamante da alma) e `pvp` (PvP do Match-3 e Ranqueada do Torneio: faixa vermelha e ouro envelhecido com espinhos). Mesma estrutura
   * 3-slice e 3 estados (`btn-pve{,-press,-off}.webp`, `btn-pvp{,-press,-off}.webp`). `rift` (primário "Entrar no Rift", com `EnergyCost`) e `rift-sec`
   * (secundário "Ver o mapa") da folha do Rift: `btn-rift{,-press,-off}.webp` e `btn-rift-sec{,-press,-off}.webp`.
   */
  variant?: 'dourado' | 'pve' | 'pvp' | 'ranking' | 'rift' | 'rift-sec';
}

export const BotaoEspecial = forwardRef<HTMLButtonElement, BotaoEspecialProps>(function BotaoEspecial(
  { width = 'full', variant = 'dourado', className, type = 'button', children, disabled, ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-botao-especial=""
      data-especial-width={width}
      data-especial-variant={variant}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={['sm2-especial', className].filter(Boolean).join(' ')}
      {...rest}
    >
      <span className="sm2-especial-label">{children}</span>
    </button>
  );
});
