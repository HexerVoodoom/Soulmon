import { NavGlyph } from '../ui/NavGlyphs';

/**
 * O TOPO DE UMA ÁREA (e das páginas do menu da Home): voltar + título.
 *
 * - **Voltar = seta dentro de um CÍRCULO, canto superior esquerdo.** É a
 *   exceção D1 do dono (23/09/2026) à regra "ícone nunca dentro de box": o anel
 *   é permitido aqui e nos três cuidados da Home, em nenhum outro lugar. O anel
 *   é só TRAÇO (`--sm2-line`), sem preenchimento — o ícone continua pelado
 *   dentro dele.
 * - **Título centralizado.** Uma coluna vazia do tamanho do voltar à direita
 *   mantém o centro óptico no centro da tela, e não no centro do que sobra.
 *
 * **Um `<h1>` por tela**: se a página de baixo já é dona do próprio `<h1>`
 * (Jogos, Arena, Hall), o título aqui é texto comum (`ownsHeading={false}`) e
 * fica fora da árvore de acessibilidade — o leitor de tela lê o `<h1>` da página,
 * uma vez. Senão, ele é o `<h1>`.
 */
export function AreaTopBar({ title, backLabel, onBack, ownsHeading = true }: {
  title: string;
  /** Rótulo acessível do voltar — diz PARA ONDE ("Voltar ao mapa"). */
  backLabel: string;
  onBack: () => void;
  ownsHeading?: boolean;
}) {
  const titleStyle: React.CSSProperties = {
    margin: 0,
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
    fontFamily: 'var(--sm2-font-display)',
    fontSize: 'var(--sm2-text-xl)',
    fontWeight: 600,
    lineHeight: 'var(--sm2-leading-title)',
    color: 'var(--sm2-ink)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  return (
    <div
      data-area-topbar
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sm2-space-2)',
        minHeight: 48, margin: '0 0 var(--sm2-space-3)',
      }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        title={backLabel}
        data-area-back
        className="sm2-area-back"
        style={{
          width: 44, height: 44, flex: '0 0 44px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, cursor: 'pointer',
          background: 'transparent',
          border: '2px solid var(--sm2-line)',
          borderRadius: '50%',
          color: 'var(--sm2-ink)',
        }}
      >
        <NavGlyph name="arrow_back" size={24} tone="ink" />
      </button>
      {ownsHeading
        ? <h1 style={titleStyle}>{title}</h1>
        : <p aria-hidden="true" style={titleStyle}>{title}</p>}
      <span aria-hidden="true" style={{ width: 44, flex: '0 0 44px' }} />
    </div>
  );
}
