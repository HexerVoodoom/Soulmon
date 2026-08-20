import { useState } from 'react';
import type { Language } from '../utils/i18n';
import { Icon } from './ui/Icon';
import { NavGlyph, type NavGlyphName } from './ui/NavGlyphs';

type ViewType = 'main' | 'evolution' | 'stats' | 'pet' | 'settings' | 'games' | 'oracle' | 'tournament' | 'library' | 'shop';

interface BottomNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onResetOnboarding?: () => void;
  /** Créditos (monetização) — modal próprio, dentro do menu sanduíche. */
  onOpenCredits?: () => void;
  language?: Language;
}

/**
 * Um destino da nav: ícone + RÓTULO PERSISTENTE.
 *
 * **Os cinco glifos são NOSSOS** (`ui/NavGlyphs.tsx`), e só os cinco. Material
 * Symbols + rótulo era a nav padrão do Android: recortada em 200×200, sem logo,
 * ela não dizia de que app era. O resto do app segue em Material — os glifos
 * daqui copiam a métrica dele (caixa de 24dp, traço equivalente ao `wght` 500,
 * pontas redondas) exatamente para conviverem sem parecer adesivo colado. As
 * linhas do menu sanduíche, logo abaixo, continuam em `Icon`: são muitas, mudam
 * com o tempo, e não é ali que a identidade se decide.
 *
 * **O eixo FILL é o sistema de estado.** Inativo = `fill 0` + tinta `muted`;
 * ativo = `fill 1` + tinta `primary` + o sublinhado de 3px. É o MESMO glifo se
 * preenchendo — não são dois ícones trocando de lugar, e a interpolação já vem
 * com a transição de `--sm2-dur-tap`. O `NavGlyph` reproduz esse eixo sem fonte
 * variável: o contorno fica, a camada sólida entra por opacidade.
 *
 * **Ícone nunca dentro de box** (regra do dono): nada de placa, moldura ou
 * halo. O alvo de 44px é do BOTÃO (`.sm-bottom-nav-btn` ocupa os 80px de
 * altura da barra), nunca do ícone. O sublinhado é uma BARRA — não é uma caixa
 * em volta do ícone — e existe porque a seleção não pode ser carregada só por
 * cor (daltonismo, alto contraste).
 *
 * **Rótulo em Rubik 12px, caixa mista.** Era Silkscreen a 8px: abaixo do piso
 * absoluto de 12px da escala tipográfica, e a bitmap fecha os contornos nesse
 * tamanho. Silkscreen agora é a voz do APARELHO (só dentro do visor e em
 * selos), e a nav é o aparelho por fora. O rótulo fica: `home`/`casino`/
 * `auto_awesome` sozinhos são adivinhação, e o texto na tela é o mesmo do
 * `aria-label` (quem vê e quem ouve leem a mesma coisa).
 */
function NavItem({ icon, label, active, onClick, current, expanded }: {
  icon: NavGlyphName; label: string; active?: boolean; onClick: () => void;
  /** `aria-current="page"` só para destinos de verdade, não para ações. */
  current?: boolean;
  expanded?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={current && active ? 'page' : undefined}
      {...(expanded === undefined ? null : { 'aria-expanded': expanded, 'aria-haspopup': true as const })}
      className="sm-bottom-nav-btn"
      title={label}
      /* Inline e não classe: footgun 1 — o Tailwind aqui é pré-compilado e
         `relative`/`text-[12px]` novos não gerariam nada. */
      style={{ position: 'relative' }}
    >
      <NavGlyph name={icon} size={32} fill={active ? 1 : 0} tone={active ? 'primary' : 'muted'} />
      <span
        className="sm-bottom-nav-label"
        style={{
          fontFamily: 'var(--sm2-font-text)',
          fontSize: 'var(--sm2-text-xs)',
          fontWeight: 500,
          letterSpacing: 0,
          lineHeight: 1.2,
          textTransform: 'none',
          WebkitFontSmoothing: 'antialiased',
          color: active ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)',
        }}
      >
        {label}
      </span>
      {active && (
        /* A barra do estado ativo. 3px, largura do ícone, `--sm2-primary-fill`
           (fill, não tinta: é preenchimento de superfície) — que no tema claro
           é o teal escuro, e por isso passa o 3:1 de componente nos DOIS temas.
           O ciano fixo do kit antigo só passava no escuro. */
        <span
          aria-hidden="true"
          data-nav-underline
          style={{
            position: 'absolute', left: '26%', right: '26%', bottom: 0,
            height: 3, borderRadius: 2, background: 'var(--sm2-primary-fill)',
          }}
        />
      )}
    </button>
  );
}

/** Id do rótulo do painel de menu — o `aria-labelledby` do `role="menu"`
 *  aponta para ele. Constante de módulo (e não `useId`) porque só existe UM
 *  painel de menu montado por vez em todo o app. */
const MENU_LABEL_ID = 'sm-menu-panel-label';

/** Ícone que É a ação de uma linha de lista: degrau `action` (tokens.md §6.1).
 *  Era 22 — um degrau que não existe, herdado de antes da escala. */
const ICON_ACTION = 24;

/** Linha do menu sanduíche. Ícone pelado + texto Rubik 14px. */
function MenuRow({ icon, label, onClick, active, first }: {
  icon: string; label: string; onClick: () => void; active?: boolean; first?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      role="menuitem"
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        minHeight: 44, padding: '11px 14px',
        background: active ? 'var(--sm2-primary-soft)' : 'transparent',
        border: 'none',
        borderTop: first ? 'none' : '1px solid var(--sm2-line)',
        color: active ? 'var(--sm2-primary-ink)' : 'var(--sm2-ink)',
        fontFamily: 'var(--sm2-font-text)',
        fontSize: 'var(--sm2-text-sm)',
        lineHeight: 'var(--sm2-leading-body)',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      <Icon name={icon} size={ICON_ACTION} fill={active ? 1 : 0} tone={active ? 'primary' : 'muted'} />
      {label}
    </button>
  );
}

/**
 * Navegação principal do app.
 *
 * **Teto de 4 destinos** (PLANO-DESIGN §5, orçamento de complexidade). Eram 5
 * destinos + menu. A **Biblioteca sai da nav**: é um diretório social de
 * jogadores, de frequência rara medida no inventário — e uma barra com 6
 * células de 68px é onde o rótulo deixa de caber e o ícone vira adivinhação.
 * Ela **não some**: passa para o menu sanduíche, que é o mesmo alvo de sempre
 * e continua sendo o único caminho até `currentView === 'library'` (o plano
 * previa um card em Atividades, mas `ActivitiesPage` não é minha superfície
 * nesta onda — mandar a tela para o limbo seria pior que a nav cheia).
 *
 * A Loja fica na barra e passa a ser DESTINO de verdade (`aria-current`): ela
 * navega para uma view, sempre navegou, e chamá-la de "ação" só existia para
 * caber num arranjo de 6 células que acabou.
 */
export function BottomNav({ currentView, onNavigate, onResetOnboarding, onOpenCredits, language = 'en-US' }: BottomNavProps) {
  const isPt = language === 'pt-BR';
  const [menuOpen, setMenuOpen] = useState(false);

  // Torneio mora dentro de Atividades (junto dos minigames); Estatísticas mora
  // dentro de Evolução (aba interna — ver App.tsx).
  // O nome do glifo aqui NÃO é mais uma ligature da Material: é um dos cinco
  // desenhos de `NavGlyphs.tsx`, e o TypeScript passou a barrar nome inventado
  // (antes, nome fora do subset de 99 ícones não renderizava glifo nenhum e
  // também não dava erro — tokens.md §5).
  const items: { view: ViewType; label: string; icon: NavGlyphName }[] = [
    { view: 'main', label: isPt ? 'Início' : 'Home', icon: 'home' },
    // D-pad, e não um dado: a página é dungeon + dino + pedra-papel-tesoura +
    // torneio. É o BOTÃO do aparelho, não a aposta.
    { view: 'games', label: isPt ? 'Atividades' : 'Activities', icon: 'activities' },
    // O galho que se divide é literalmente a mecânica: um nó embaixo, dois em
    // cima. `auto_awesome` (brilho) servia a qualquer coisa mágica.
    { view: 'evolution', label: isPt ? 'Evolução' : 'Evolution', icon: 'evolution' },
    { view: 'shop', label: isPt ? 'Loja' : 'Shop', icon: 'shop' },
  ];
  const menuActive = menuOpen || currentView === 'settings' || currentView === 'library';

  return (
    <nav
      className="sm-bottom-nav"
      /* A altura continua vindo da classe (`--sm-bottomnav-h`); o que muda por
         inline é só a pele: superfície e a linha de cobre do aparelho, agora em
         tokens `--sm2-*`. */
      style={{ background: 'var(--sm2-surface)', borderTop: '2px solid var(--sm2-viewport-ring)' }}
      onKeyDown={e => { if (e.key === 'Escape' && menuOpen) { setMenuOpen(false); e.stopPropagation(); } }}
    >
      {items.map(({ view, label, icon }) => (
        <NavItem
          key={view}
          icon={icon}
          label={label}
          active={currentView === view}
          current
          onClick={() => onNavigate(view)}
        />
      ))}

      {/* Menu sanduíche — sempre por último (à direita de tudo). Agrega
          Biblioteca + Créditos + Configurações + Recomeçar num popover. */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', height: '100%' }}>
        <NavItem
          icon="menu"
          label={isPt ? 'Menu' : 'Menu'}
          active={menuActive}
          expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
        />

        {menuOpen && (
          <>
            {/* Backdrop transparente — fecha o popover ao tocar fora dele. */}
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 60 }}
            />
            {/* O PAINEL É UM CONTEXTO NOVO, e ele precisa se apresentar.
                Ele abre POR CIMA de uma página inteira (Loja, Evolução…) sem
                trocar a `currentView`: para quem lê a tela com leitor, a
                árvore de headings continuava sendo a da página de baixo
                (`H1:Shop, H2:Items…`) e não havia nada dizendo que outro
                contexto tinha entrado — medido.

                Semântica escolhida: **menu, não diálogo**. Ele não é modal
                (o toque fora fecha, o conteúdo de baixo continua válido e
                nada aqui é uma tarefa a concluir), então `role="dialog"` +
                `aria-modal` mentiria sobre a inércia do resto da tela.

                **E o rótulo NÃO é um heading — foi medido por que.** Este
                `<nav>` é montado ANTES do conteúdo da página no DOM (o
                `App.tsx` renderiza `BottomNav` acima do `<main>`, e não é
                arquivo deste dono), então o `<h2>Menu</h2>` que morava aqui
                entrava no índice de headings ANTES do `<h1>` da página:
                quem navega por heading encontrava um H2 órfão como primeira
                parada, e a árvore do documento passava a mentir sobre a
                estrutura da tela. As saídas eram três, e duas são piores:
                portal para o fim do `<body>` (arrisca o ancoramento
                `position:absolute` e o Escape do `<nav>` por um ganho
                duvidoso), `aria-level` acrobático, ou aceitar o que a
                semântica já diz. Heading é ferramenta de ESTRUTURA DE
                DOCUMENTO; um popover transitório, aberto e fechado por um
                botão, não é seção de documento — e nada se perde, porque o
                painel já se anuncia por dois caminhos que continuam
                intactos: o `aria-expanded`/`aria-haspopup` do botão e o
                `aria-labelledby` que dá a este texto o papel de NOME
                ACESSÍVEL do `role="menu"`. O rótulo fica fora do
                `role="menu"` (filho de menu só pode ser menuitem) e segue
                sendo lido em voz alta na abertura. */}
            <div
              style={{
                position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
                minWidth: 210, overflow: 'hidden', zIndex: 61,
                background: 'var(--sm2-surface)',
                border: '1px solid var(--sm2-line)',
                borderRadius: 14,
                boxShadow: '0 8px 24px rgba(0,0,0,.28)',
              }}
            >
              {/* 16px (`-text-md`), e não os 14 de antes: um título do mesmo
                  tamanho dos itens que ele encabeça não é título, é mais uma
                  linha. A hierarquia aqui é a soma de três coisas — o degrau
                  acima na escala, a Fredoka contra a Rubik das linhas, e o
                  peso 600. */}
              <p
                id={MENU_LABEL_ID}
                style={{
                  margin: 0,
                  padding: '12px 14px 10px',
                  fontFamily: 'var(--sm2-font-display)',
                  fontSize: 'var(--sm2-text-md)',
                  fontWeight: 600,
                  lineHeight: 'var(--sm2-leading-title)',
                  color: 'var(--sm2-ink)',
                  textAlign: 'left',
                }}
              >
                {isPt ? 'Menu' : 'Menu'}
              </p>
              <div role="menu" aria-labelledby={MENU_LABEL_ID}>
              <MenuRow
                first
                icon="person"
                label={isPt ? 'Biblioteca' : 'Library'}
                active={currentView === 'library'}
                onClick={() => { onNavigate('library'); setMenuOpen(false); }}
              />
              {onOpenCredits && (
                <MenuRow
                  icon="diamond"
                  label={isPt ? 'Créditos' : 'Credits'}
                  onClick={() => { onOpenCredits(); setMenuOpen(false); }}
                />
              )}
              <MenuRow
                icon="settings"
                label={isPt ? 'Configurações' : 'Settings'}
                active={currentView === 'settings'}
                onClick={() => { onNavigate('settings'); setMenuOpen(false); }}
              />
              {onResetOnboarding && (
                <MenuRow
                  icon="replay"
                  label={isPt ? 'Refazer o ritual' : 'Redo the ritual'}
                  onClick={() => { onResetOnboarding(); setMenuOpen(false); }}
                />
              )}
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
