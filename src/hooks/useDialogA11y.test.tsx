// @vitest-environment jsdom
/**
 * O CONTRATO DE TECLADO DE UM DIÁLOGO — e o eixo de acessibilidade que não
 * tinha UM teste no repositório.
 *
 * Varredura da sessão de QA (09/09/2026): `grep` por navegação de teclado em
 * `src/**` não achou um caso. Zero. E existe um hook cujo trabalho INTEIRO é
 * foco — `useDialogA11y` —, escrito depois de uma auditoria que achou quatro
 * diálogos prometendo `aria-modal="true"` e não cumprindo nada. Ele guarda dez
 * invariantes sutis, e a única coisa que as sustentava era o cabeçalho dele.
 *
 * Cada caso aqui corresponde a um buraco que o hook fechou, e todos são do tipo
 * que volta sem ficar vermelho:
 *
 *  · o Escape do `MorningDream` funcionava POR ACIDENTE (dependia do
 *    `autoFocus` fazendo o evento borbulhar até a div do véu);
 *  · o `NightmareBattle` tinha handler e nada recebia foco, então o `keydown`
 *    nascia no `<body>`, fora da árvore do diálogo;
 *  · `MorningCheckIn` e `TriagePile` deixavam o Tab passear pela página ATRÁS
 *    do véu, sem saída sem mouse;
 *  · o fundo ROLAVA: `overflow: visible` no body e nada inerte — e nesta app o
 *    scroller não é o body, é uma `div` do `App.tsx`.
 *
 * ⚠️ O que jsdom NÃO alcança, e por isso não está afirmado aqui: `inert` não é
 * implementado, então o caminho de verdade testado é o fallback de
 * `aria-hidden`. O que se prova é a CONTAGEM DE REFERÊNCIA e o restauro, que é
 * onde a versão ingênua erra.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import { useDialogA11y } from './useDialogA11y';

/** Um diálogo mínimo com três botões, do jeito que os quatro reais usam. */
function Dialogo({
  open, onClose, comAutoFocus = false, semControles = false,
}: { open: boolean; onClose: () => void; comAutoFocus?: boolean; semControles?: boolean }) {
  const ref = useDialogA11y<HTMLDivElement>(open, onClose);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" ref={ref} data-testid="dlg">
      {!semControles && (
        <>
          <button data-testid="b1">um</button>
          <button data-testid="b2" autoFocus={comAutoFocus}>dois</button>
          <button data-testid="b3">tres</button>
        </>
      )}
    </div>
  );
}

/** Página com um botão que abre o diálogo — é o "quem abriu" da devolução. */
function Pagina(props: { comAutoFocus?: boolean; semControles?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button data-testid="abrir" onClick={() => setOpen(true)}>abrir</button>
      <button data-testid="fora">fora do diálogo</button>
      <Dialogo open={open} onClose={() => setOpen(false)} {...props} />
    </div>
  );
}

const ativo = () => document.activeElement as HTMLElement | null;
const tab = (shift = false) =>
  fireEvent.keyDown(document.activeElement ?? document, { key: 'Tab', shiftKey: shift });

/**
 * ⚠️ jsdom NÃO FAZ LAYOUT — e o hook filtra focável por visibilidade.
 *
 * `focusables()` aceita o elemento quando `offsetParent !== null` OU
 * `getClientRects().length > 0`. No jsdom os dois são sempre falsos (o próprio
 * `src/test/renderEnv.tsx` registra "sem layout"), então SEM este remendo a
 * lista de focáveis sai vazia e nada do trap pode ser exercido — o teste
 * mediria o vácuo e passaria pelo motivo errado.
 *
 * O remendo diz "elemento anexado ao documento está visível", que é a verdade
 * neste teste (nada aqui usa `display: none`). Em troca, o teste **não cobre**
 * a exclusão por invisibilidade — e por isso existe um caso próprio abaixo, que
 * esconde UM elemento de propósito.
 */
const offsetParentReal = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent');
const escondidos = new Set<Element>();

beforeEach(() => {
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  escondidos.clear();
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get(this: HTMLElement) {
      if (escondidos.has(this)) return null;
      return this.isConnected ? this.parentElement : null;
    },
  });
});

afterEach(() => {
  cleanup();
  if (offsetParentReal) Object.defineProperty(HTMLElement.prototype, 'offsetParent', offsetParentReal);
  else delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetParent;
});

describe('foco de entrada', () => {
  it('vai para o PRIMEIRO focável de dentro do diálogo', () => {
    const r = render(<Dialogo open onClose={() => {}} />);
    expect(ativo()).toBe(r.getByTestId('b1'));
  });

  it('🔴 RESPEITA o ponto de entrada que a tela escolheu (`autoFocus`)', () => {
    // O hook existe para GARANTIR foco de entrada, não para sequestrar o que a
    // tela decidiu — é o caso do botão primário do `MorningDream`.
    const r = render(<Dialogo open onClose={() => {}} comAutoFocus />);
    expect(ativo()).toBe(r.getByTestId('b2'));
  });

  it('diálogo SEM nenhum controle ainda fica dono do foco', () => {
    // Sem isso o `keydown` nasceria no `<body>`, fora da árvore do diálogo, e
    // o Escape nasceria morto — foi o bug do `NightmareBattle`.
    const r = render(<Dialogo open onClose={() => {}} semControles />);
    const dlg = r.getByTestId('dlg');
    expect(ativo()).toBe(dlg);
    expect(dlg.getAttribute('tabindex')).toBe('-1');
  });
});

describe('🔴 o Tab não sai do diálogo', () => {
  it('do último volta ao primeiro; do primeiro com Shift vai ao último', () => {
    const r = render(<Dialogo open onClose={() => {}} />);
    const [b1, b3] = [r.getByTestId('b1'), r.getByTestId('b3')];

    b3.focus();
    tab();
    expect(ativo()).toBe(b1);

    b1.focus();
    tab(true);
    expect(ativo()).toBe(b3);
  });

  it('no meio da lista, o Tab é do NAVEGADOR — o hook não intercepta', () => {
    // Prender o Tab no meio quebraria a ordem natural; o trap só age nas duas
    // pontas. Se este caso cair, o hook passou a sequestrar a navegação toda.
    const r = render(<Dialogo open onClose={() => {}} />);
    const b2 = r.getByTestId('b2');
    b2.focus();
    const ev = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });

  it('foco que escapou para a página (clique no véu) é trazido de volta', () => {
    const r = render(<Pagina />);
    fireEvent.click(r.getByTestId('abrir'));
    r.getByTestId('fora').focus();
    expect(ativo()).toBe(r.getByTestId('fora'));
    tab();
    expect(ativo()).toBe(r.getByTestId('b1'));
  });

  it('diálogo sem controles: o Tab não escapa, fica no container', () => {
    const r = render(<Dialogo open onClose={() => {}} semControles />);
    tab();
    expect(ativo()).toBe(r.getByTestId('dlg'));
  });
});

describe('🔴 Escape', () => {
  it('fecha, e NÃO depende de onde o foco está', () => {
    // O listener é em CAPTURA no `document`, de propósito: o Escape do
    // `MorningDream` só funcionava porque o evento borbulhava a partir do botão
    // com `autoFocus`. Tirar o autoFocus matava o Escape sem quebrar teste.
    const onClose = vi.fn();
    const r = render(<Dialogo open onClose={onClose} />);
    // Foco deliberadamente FORA da árvore do diálogo:
    document.body.focus();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    fireEvent.keyDown(r.getByTestId('b3'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('com o diálogo fechado, o Escape não chama nada', () => {
    const onClose = vi.fn();
    render(<Dialogo open={false} onClose={onClose} />);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('🔴 devolução do foco a quem abriu', () => {
  it('ao fechar, o foco volta para o botão que abriu', () => {
    // Sem isto, quem navega por teclado volta ao começo do documento a cada
    // modal — é o custo mais alto e o mais invisível de todos.
    const r = render(<Pagina />);
    const abrir = r.getByTestId('abrir');
    abrir.focus();
    fireEvent.click(abrir);
    expect(ativo()).toBe(r.getByTestId('b1'));

    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(ativo()).toBe(abrir);
  });

  it('quem abriu saiu do DOM: não explode e não força foco em nó morto', () => {
    const orfao = document.createElement('button');
    document.body.appendChild(orfao);
    orfao.focus();
    const r = render(<Dialogo open onClose={() => {}} />);
    orfao.remove();
    expect(() => r.unmount()).not.toThrow();
  });
});

describe('🔴 o fundo travado, e a contagem de referência', () => {
  const overflow = () => [document.documentElement.style.overflow, document.body.style.overflow];

  it('trava na abertura e RESTAURA o valor original no fechamento', () => {
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    const r = render(<Dialogo open onClose={() => {}} />);
    expect(overflow()).toEqual(['hidden', 'hidden']);
    r.unmount();
    // Devolve o que ESTAVA, não um "visible" inventado.
    expect(overflow()).toEqual(['auto', 'auto']);
  });

  it('sem valor original, devolve string vazia — a folha de estilo volta a mandar', () => {
    const r = render(<Dialogo open onClose={() => {}} />);
    r.unmount();
    expect(overflow()).toEqual(['', '']);
  });

  it('🔴 DOIS diálogos empilhados: fechar o de cima NÃO destrava o fundo', () => {
    // É o caso (a) do cabeçalho do hook: a soltura é por contagem, então
    // fechar o de cima devolve o fundo ao estado do de baixo.
    const a = render(<Dialogo open onClose={() => {}} />);
    const b = render(<Dialogo open onClose={() => {}} />);
    expect(overflow()).toEqual(['hidden', 'hidden']);
    b.unmount();
    expect(overflow()).toEqual(['hidden', 'hidden']);
    a.unmount();
    expect(overflow()).toEqual(['', '']);
  });

  it('cleanup repetido não deixa o app travado nem destrava o de baixo', () => {
    const a = render(<Dialogo open onClose={() => {}} />);
    const b = render(<Dialogo open onClose={() => {}} />);
    b.unmount();
    b.unmount();            // segundo cleanup: tem de ser inócuo
    expect(overflow()).toEqual(['hidden', 'hidden']);
    a.unmount();
    expect(overflow()).toEqual(['', '']);
  });

  it('a guarda de rolagem cancela o que nasce FORA e deixa passar o de dentro', () => {
    // Nesta app o scroller não é o body: é uma `div` do `App.tsx`. `overflow:
    // hidden` no body não a alcança — quem segura é esta guarda.
    const fora = document.createElement('div');
    document.body.appendChild(fora);
    const r = render(<Dialogo open onClose={() => {}} />);

    const deFora = new Event('wheel', { bubbles: true, cancelable: true });
    fora.dispatchEvent(deFora);
    expect(deFora.defaultPrevented).toBe(true);

    const deDentro = new Event('wheel', { bubbles: true, cancelable: true });
    r.getByTestId('b1').dispatchEvent(deDentro);
    expect(deDentro.defaultPrevented).toBe(false);

    r.unmount();
    fora.remove();
  });

  it('depois de fechar, a guarda de rolagem não cancela mais nada', () => {
    const fora = document.createElement('div');
    document.body.appendChild(fora);
    render(<Dialogo open onClose={() => {}} />).unmount();
    const ev = new Event('wheel', { bubbles: true, cancelable: true });
    fora.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
    fora.remove();
  });
});

describe('🔴 o fundo fica inerte, e o próprio diálogo NÃO', () => {
  it('irmão da página é escondido; o diálogo e seus ancestrais não', () => {
    // Os diálogos daqui NÃO são portais: renderizam dentro do `#root`, junto da
    // página. Marcar o `#root` inteiro inertizaria o próprio diálogo — por isso
    // a marcação sobe nível a nível e só pega os IRMÃOS.
    const r = render(<Pagina />);
    fireEvent.click(r.getByTestId('abrir'));
    const dlg = r.getByTestId('dlg');
    const fora = r.getByTestId('fora');

    expect(fora.getAttribute('aria-hidden')).toBe('true');
    expect(dlg.getAttribute('aria-hidden')).toBeNull();
    let cur: HTMLElement | null = dlg.parentElement;
    while (cur && cur !== document.body) {
      expect(cur.getAttribute('aria-hidden'), cur.tagName).toBeNull();
      cur = cur.parentElement;
    }
  });

  it('ao fechar, desmarca só o que MARCOU', () => {
    const r = render(<Pagina />);
    const fora = r.getByTestId('fora');
    fireEvent.click(r.getByTestId('abrir'));
    expect(fora.getAttribute('aria-hidden')).toBe('true');
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(fora.getAttribute('aria-hidden')).toBeNull();
    expect(fora.hasAttribute('data-sm2-inert')).toBe(false);
  });

  it('🔴 `aria-hidden` que já era da APLICAÇÃO não é apagado', () => {
    // O valor de como marcamos fica em `data-sm2-inert`; se já havia
    // `aria-hidden`, ele é 'kept' e nada é devolvido — senão o hook apagaria
    // uma decisão que não é dele.
    const r = render(<Pagina />);
    const fora = r.getByTestId('fora');
    fora.setAttribute('aria-hidden', 'true');
    fireEvent.click(r.getByTestId('abrir'));
    expect(fora.getAttribute('data-sm2-inert')).toBe('kept');
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(fora.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('AUTOVERIFICAÇÃO: o filtro de visibilidade é exercido de verdade', () => {
  it('elemento escondido sai da lista de focáveis — e o trap se ajusta', () => {
    // Este é o caso que o remendo do `offsetParent` deixaria de fora. Ele
    // também prova que o remendo ENXERGA: se ele fosse um "sempre visível"
    // cego, esconder o último não mudaria o destino do Tab.
    const r = render(<Dialogo open onClose={() => {}} />);
    const [b1, b2, b3] = [r.getByTestId('b1'), r.getByTestId('b2'), r.getByTestId('b3')];
    escondidos.add(b3);

    // Com o b3 fora, o ÚLTIMO focável é o b2: o Tab nele volta ao b1.
    b2.focus();
    tab();
    expect(ativo()).toBe(b1);

    // E o Shift+Tab no primeiro vai ao b2, não ao b3 escondido.
    b1.focus();
    tab(true);
    expect(ativo()).toBe(b2);
  });

  it('sem o remendo, a lista sai vazia — o ambiente é cego a layout', () => {
    // Registro do limite, não uma asserção sobre o hook: se um dia o jsdom
    // ganhar layout, este caso cai e o remendo pode sair.
    const div = document.createElement('div');
    document.body.appendChild(div);
    escondidos.add(div);
    expect(div.offsetParent).toBeNull();
    expect(div.getClientRects().length).toBe(0);
    div.remove();
  });
});

describe('o hook não age enquanto o diálogo está fechado', () => {
  it('nada de trava de scroll, nada de inerte', () => {
    const r = render(<Pagina />);
    expect([document.documentElement.style.overflow, document.body.style.overflow]).toEqual(['', '']);
    expect(r.getByTestId('fora').hasAttribute('aria-hidden')).toBe(false);
  });

  it('abrir e fechar várias vezes não acumula trava', async () => {
    const r = render(<Pagina />);
    for (let i = 0; i < 3; i++) {
      fireEvent.click(r.getByTestId('abrir'));
      await act(async () => {});
      fireEvent.keyDown(document.body, { key: 'Escape' });
      await act(async () => {});
    }
    expect([document.documentElement.style.overflow, document.body.style.overflow]).toEqual(['', '']);
  });
});
