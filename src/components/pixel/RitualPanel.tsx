/**
 * Painel de rituais da Home — a composição da referência v1.2 (gap G1).
 *
 * O que muda em relação ao que existia: cada tarefa/atividade era um
 * `PixelPanel` de ~200px de altura com um checkbox, um emoji e um título. Três
 * itens estouravam a dobra de 412×915 e o quarto era cortado pelo dock de
 * chat — o app comunicava "role para ver suas tarefas" em vez de "seu ritual
 * de hoje de relance".
 *
 * Aqui é UM painel titulado, com linhas de ~72px:
 *
 *   [ ícone 40 ] [ nome / subtítulo + barra segmentada ] [ checkbox 44×44 ]
 *
 * Decisões que valem registro:
 *
 * 1. **Coluna única.** A referência mostra duas colunas; em 412px isso vira
 *    duas de ~190px (N1 da análise de gap). O alvo do G1 é a DENSIDADE, não a
 *    geometria — duas colunas só a partir de 768px, e nem isso é feito aqui.
 * 2. **Dimensionado pelo PT-BR.** `RITUAIS DIÁRIOS` é ~25% mais longo que
 *    `DAILY RITUALS`, e o nome do item é escrito pelo usuário sem limite
 *    nenhum. A linha é dimensionada para SOBREVIVER a 40+ caracteres: o nome
 *    trunca com `…` e leva `title` com o texto inteiro. Nada de altura que
 *    depende do texto caber.
 * 3. **O ícone não mora em caixa, e sem ícone não sobra caixa** (rodada 4).
 *    O quadro de cobre em volta do ícone saiu por direção do dono; o fallback
 *    da linha sem categoria, que era esse mesmo quadro VAZIO, virou ausência —
 *    a linha começa no texto. Emoji do sistema continua proibido (era o gap
 *    mais gritante do tema claro: duas eras gráficas na mesma linha).
 * 4. **Etapas nascem RECOLHIDAS.** Uma atividade de 4 etapas ocupava 5 linhas
 *    e comia sozinha a dobra. A barra segmentada já diz `2/4` de relance; quem
 *    quiser marcar etapa abre. O expansor ocupa a mesma casa do checkbox, que
 *    essas atividades não têm (quem completa é a última etapa).
 * 5. **A coluna de texto é o botão de EDITAR.** Não sobra largura em 412px
 *    para ícone + texto + editar + concluir; e "tocar no item para abrir" é o
 *    gesto que o usuário já espera. O alvo continua ≥44px de altura e o
 *    `aria-label` diz o que faz ("Editar: <nome>").
 * 6. **O checkbox é o `PixelCheckbox` do kit** — `role="checkbox"`,
 *    `aria-checked` e 44×44 vêm de lá e não podem ser reimplementados aqui.
 *
 * Texto nasce em EN com par PT-BR, como todo texto de UI do app.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { Language } from '../../utils/i18n';
import { Icon } from '../ui/Icon';
import { PixelSegmentedBar } from './PixelKit';
import { SM2_SHADOW_CARD, sm2Button, sm2Hint } from '../form/FormKit';

/**
 * ONDA 7 — O PAINEL DA HOME SAI DO FLIPERAMA
 * ==========================================
 *
 * A Home é a tela mais vista do app e era a última a carregar DUAS linguagens
 * no MESMO painel: a moldura chanfrada (`sm-px-panel`) com o CTA de fliperama
 * (`sm-px-btn-primary`, Silkscreen) e, logo ao lado, o cabeçalho `sm2-*` em
 * Fredoka. O estado vazio era pior ainda: `.sm-px-ritual-empty` não declara
 * família nenhuma, então caía na fonte do sistema (Segoe UI) — uma terceira
 * tipografia dentro do mesmo card.
 *
 * O que migrou aqui: a MOLDURA do painel, o CTA, o estado vazio, o checkbox e
 * o expansor. O que FICOU com classe `sm-px-ritual-*`: só a GEOMETRIA da linha
 * (72px de altura, casa de 40px do ícone, clamp de 2 linhas do nome). Essas
 * regras não desenham nada de arcade — são layout puro sobre tokens de tema —
 * e o `index.css` é de outro dono nesta onda. Cada texto que passa por elas
 * declara a própria família aqui no JSX (footgun 10: herança de `body` já
 * traiu esta base uma vez).
 */

/** A superfície do painel — a mesma do resto do sistema (FormKit). */
const painel: CSSProperties = {
  backgroundColor: 'var(--sm2-surface)',
  border: '1px solid var(--sm2-line)',
  borderRadius: 12,
  boxShadow: SM2_SHADOW_CARD,
  overflow: 'hidden',
};

/** Alvo de 44×44 para os dois controles da direita da linha. */
const alvo44: CSSProperties = {
  flex: '0 0 44px',
  width: 44,
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  padding: 0,
  cursor: 'pointer',
  borderRadius: 10,
  background: 'none',
};

/**
 * O checkbox da lista — a ação central do app.
 *
 * Era o `PixelCheckbox` do kit (quadro de cobre chanfrado, `clip-path`).
 * Aqui é a mesma semântica (`role="checkbox"` + `aria-checked`) e o mesmo alvo
 * de 44×44 declarado INLINE (footgun 1: classe utilitária ausente não aplica
 * nada, e a medida de 44px é travada por teste), com a caixa do sistema novo:
 * raio 8, linha `--sm2-line`, e o estado marcado é `--sm2-primary-fill` com o
 * glifo em `--sm2-on-primary` — nunca o `*-ink` do mesmo acento.
 *
 * O FILL 0→1 do `<Icon>` é o sistema de estado: é o mesmo glifo se preenchendo,
 * não dois ícones trocando de lugar.
 */
function RitualCheck({
  checked, disabled, onToggle, label,
}: { checked: boolean; disabled: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={disabled ? undefined : onToggle}
      style={{ ...alvo44, border: 'none', cursor: disabled ? 'default' : 'pointer' }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 24,
          height: 24,
          borderRadius: 'var(--sm2-radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          /* SIS-03 / canvas Home: caixa 24, raio 4, borda `muted` 2px; marcada
             = `primary-fill`. Desativada (fora do dia) = tracejada — por
             FORMA, nunca por opacidade (0 elementos com alfa < 1 no canvas). */
          border: checked ? '2px solid var(--sm2-primary-fill)' : `2px ${disabled ? 'dashed' : 'solid'} var(--sm2-muted)`,
          backgroundColor: checked ? 'var(--sm2-primary-fill)' : 'transparent',
          color: 'var(--sm2-on-primary)',
          transition: 'background-color var(--sm2-dur-tap) var(--sm2-ease)',
        }}
      >
        <Icon name="check" size={20} fill={checked ? 1 : 0} weight={600} style={{ opacity: checked ? 1 : 0 }} />
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────── o ícone (sem caixa)

/**
 * Casa de 40×40 para o ícone da linha — SEM MOLDURA (rodada 4, direção do dono).
 *
 * Era um quadro de cobre chanfrado em volta do ícone. Duas consequências de
 * tirá-lo:
 *
 *  · sem moldura o ícone ocupa a casa inteira: 28 → 32px;
 *  · sem moldura o "quadro vazio" do fallback vira 40px de NADA — largura
 *    reservada para uma coisa que não existe. Então a linha sem categoria não
 *    renderiza a casa: ela **começa no texto**. A leitura ("esta linha não tem
 *    categoria") passa a vir da ausência, e não de um quadro vazio que parecia
 *    ícone quebrado — sem gastar 50px dos 412px da tela em nada.
 *
 * O QUE MUDOU AGORA: era um PNG de categoria (`icon-cat-*.png`). Virou
 * `<Icon>` (Material Symbols Rounded, fonte variável) — o ícone de categoria é
 * ícone de INTERFACE, mora fora do visor e por isso é vetor, não raster. O
 * nome vem de `categoryIconName` e **tem que estar no inventário de 99**
 * (`src/styles/tokens.md`): nome fora dele não renderiza glifo e não dá erro.
 *
 * O que NÃO mudou: emoji do sistema continua proibido aqui (era o gap mais
 * gritante do tema claro — duas eras gráficas na mesma linha).
 *
 * O que isto NÃO é: violação da regra da rodada 3 ("controle interativo sem
 * superfície = 0". Este `<span>` é `aria-hidden` e decorativo; os controles da
 * linha (coluna de texto, checkbox, expansor) continuam todos com superfície
 * e alvo próprios. E NÃO é "ícone dentro de box": `.sm-px-ritual-icon` não
 * desenha fundo, borda nem chanfro — é só a casa que alinha a coluna.
 */
export function RitualIcon({ name, haunted = false }: { name?: string; haunted?: boolean }) {
  if (!name) return null;
  return (
    <span className="sm-px-ritual-icon" aria-hidden="true">
      {/* Assombrada: o ícone segue a tinta da linha (`--sm2-haunted`, P5) —
          o esmaecer é a TINTA, nunca opacidade. `tone` não tem esse acento
          (é o 4º, só desta linha), então entra por `style`. */}
      <Icon name={name} size={32} tone={haunted ? 'ink' : 'gold'} style={haunted ? { color: 'var(--sm2-haunted)' } : undefined} />
    </span>
  );
}

// ───────────────────────────────────────────────────────────────────── a linha

export interface RitualRowProps {
  /** Nome de ícone do inventário (Material Symbols), solto na linha e sem
   *  moldura. Ausente = a linha começa no texto, sem casa reservada. NUNCA
   *  emoji do sistema, nunca PNG. */
  iconName?: string;
  name: string;
  /** Uma linha curta: categoria, frequência, "3/5 etapas". */
  subtitle?: string;
  /** Barra segmentada fina. `max` 1 = item sem etapas (cheio/vazio). */
  value: number;
  max: number;
  done?: boolean;
  /** Fora do dia da semana da atividade: lê como inativa, mas continua legível. */
  dimmed?: boolean;
  /**
   * TAREFA ASSOMBRADA (`isHaunted`, canvas Home `PetAssombrado` / P5):
   * título e ícone na tinta PRÓPRIA `--sm2-haunted` (sólida, AA nos dois
   * temas), lápis e checkbox intactos — NUNCA opacidade na linha (F1 da
   * crítica: `.55` dava 2,31:1). O convite ("haunted · +relief") é o chip do
   * `TaskMeta`, logo abaixo; o sinal forte é o pet olhando (WP3.2).
   */
  haunted?: boolean;
  /** Ausente = a linha não tem checkbox (quem completa são as etapas). */
  onToggle?: () => void;
  onEdit: () => void;
  /** Expansor das etapas, no lugar do checkbox. */
  expandable?: boolean;
  expanded?: boolean;
  onExpand?: () => void;
  /** Etapas, renderizadas só quando expandido. */
  children?: ReactNode;
  language: Language;
  toggleLabelPt?: string;
  toggleLabelEn?: string;
}

export function RitualRow({
  iconName, name, subtitle, value, max, done = false, dimmed = false, haunted = false,
  onToggle, onEdit, expandable = false, expanded = false, onExpand,
  children, language, toggleLabelPt, toggleLabelEn,
}: RitualRowProps) {
  const isPt = language === 'pt-BR';
  return (
    <li
      className={`sm-px-ritual${done ? ' sm-px-ritual-done' : ''}${dimmed ? ' sm-px-ritual-dim' : ''}${haunted && !done ? ' sm-px-ritual-haunted' : ''}`}
      data-haunted={haunted && !done ? 'true' : undefined}
      /* Lido pela medição de densidade (T4) do roteiro de verificação. */
      data-action-unit
    >
      <div className="sm-px-ritual-row">
        <RitualIcon name={iconName} haunted={haunted && !done} />

        {/* Coluna de texto = botão de editar (decisão 5 do cabeçalho). */}
        <button
          type="button"
          className="sm-px-ritual-main"
          onClick={onEdit}
          aria-label={`${isPt ? 'Editar' : 'Edit'}: ${name}`}
        >
          {/* `title` porque o nome TRUNCA: sem ele, um nome longo em PT-BR
              some sem recurso nenhum de leitura. */}
          {/* A família é DECLARADA aqui, não herdada: `.sm-px-ritual-name` só
              traz geometria (clamp de 2 linhas), e texto sem `font-family`
              próprio já caiu na fonte do sistema nesta base (footgun 10). */}
          <span
            className="sm-px-ritual-name"
            title={name}
            style={{ fontFamily: 'var(--sm2-font-text)' }}
          >
            {name}
          </span>
          {subtitle && (
            <span
              className="sm-px-ritual-sub"
              title={subtitle}
              style={{ fontFamily: 'var(--sm2-font-text)' }}
            >
              {subtitle}
            </span>
          )}
          {/* Barra segmentada só onde ela DIZ alguma coisa: com `max` 1 ela vira
              um sulco escuro de bloco único que repete o que o checkbox ao lado
              já mostra — decoração ocupando a linha inteira (medido em
              screenshot na rodada de alinhamento 1). Com etapas, ela é a
              leitura de "faltam duas" sem precisar abrir nada. */}
          {max > 1 && (
            <PixelSegmentedBar
              value={value}
              max={max}
              segments={Math.min(max, 12)}
              /* 14, não 6: `.sm-px-bar` é `border-box` com 2px de borda e 2px
                 de padding em cima e embaixo — abaixo de 9px a altura interna
                 fica NEGATIVA e os blocos acesos somem, deixando só o sulco
                 escuro. Falha silenciosa: a barra continua no DOM, com o
                 `aria-valuenow` certo, e não mostra nada. */
              height={14}
              tone={done ? 'gold' : 'cyan'}
              label={`${isPt ? 'Progresso' : 'Progress'}: ${name}`}
              style={{ marginTop: 5 }}
            />
          )}
        </button>

        {expandable ? (
          <button
            type="button"
            onClick={onExpand}
            aria-expanded={expanded}
            aria-label={isPt
              ? `${expanded ? 'Recolher' : 'Expandir'} etapas de ${name}`
              : `${expanded ? 'Collapse' : 'Expand'} steps of ${name}`}
            /* Era o quadro de cobre chanfrado do kit (`.sm-px-ritual-expand`).
               Agora é o mesmo chevron do resto do sistema, SEM caixa — a regra
               do dono é que ícone não mora dentro de moldura; quem carrega o
               alvo de 44px é o botão. */
            style={{ ...alvo44, border: 'none', color: 'var(--sm2-muted)' }}
          >
            <Icon name={expanded ? 'expand_less' : 'expand_more'} size={24} />
          </button>
        ) : onToggle ? (
          <RitualCheck
            checked={done}
            disabled={done || dimmed}
            onToggle={onToggle}
            label={isPt
              ? (toggleLabelPt ?? (done ? 'Concluído' : 'Marcar como concluído'))
              : (toggleLabelEn ?? (done ? 'Completed' : 'Mark as completed'))}
          />
        ) : (
          <span aria-hidden="true" style={{ flex: '0 0 44px', width: 44, height: 44 }} />
        )}
      </div>

      {expanded && children && <div style={{ padding: '0 12px 12px 62px' }}>{children}</div>}
    </li>
  );
}

// ──────────────────────────────────────────────────────────────────── o painel

export interface RitualPanelProps {
  /** Feitos hoje / total — vira o contador do título ("2/5"). */
  done: number;
  total: number;
  /** Nome de ícone do cabeçalho (inventário de 99; nunca emoji, nunca PNG). */
  titleIconName?: string;
  children: ReactNode;
  /** CTA largo no fim da lista — o que aposenta o FAB flutuante. */
  ctaLabel: string;
  onCta: () => void;
  /** Mensagem do estado vazio (lista sem nenhum item cadastrado). */
  emptyMessage?: string;
  language: Language;
}

export function RitualPanel({
  done, total, titleIconName, children, ctaLabel, onCta, emptyMessage, language,
}: RitualPanelProps) {
  const isPt = language === 'pt-BR';
  // Rótulo em EN com par PT-BR — e o container foi dimensionado pelo PT-BR,
  // que é o mais longo dos dois.
  const titulo = isPt ? 'Rituais diários' : 'Daily rituals';
  return (
    /* A MOLDURA saiu do fliperama. Era `PixelPanel` — borda 9-slice de cobre,
       chanfro de gabinete — com um cabeçalho `sm2-*` em Fredoka dentro: as
       duas linguagens do app no mesmo card, na tela mais vista dele. Agora é a
       superfície do sistema (surface + line + raio 12 + a sombra de card).
       O contador é `.sm2-num` porque é número que MUDA: sem tabular-nums o
       "2/5" pula de largura ao virar "10/12" e o cabeçalho inteiro treme. */
    <section style={painel} aria-labelledby="sm2-ritual-title">
      <div className="sm2-panel-head">
        {titleIconName && <Icon name={titleIconName} size={20} fill={total > 0 && done >= total ? 1 : 0} tone="primary" />}
        {/* HEADING DE VERDADE. Era um `<span>`: a Home inteira não tinha um só
            heading, e um leitor de tela não consegue navegar uma tela assim.
            `<h2>` porque o `<h1>` da Home é a marca, no `HomeHud`. */}
        <h2 id="sm2-ritual-title" className="sm2-panel-head-title" style={{ margin: 0 }}>{titulo}</h2>
        {total > 0 && (
          <span
            className="sm2-panel-head-count sm2-num"
            aria-label={isPt ? `${done} de ${total} concluídos` : `${done} of ${total} done`}
          >
            {done}/{total}
          </span>
        )}
      </div>
      {emptyMessage ? (
        /* ESTADO VAZIO — era `.sm-px-ritual-empty`, uma regra que declara
           tamanho e cor e NENHUMA família: caía na fonte do sistema (Segoe UI
           na medição), uma terceira tipografia dentro do mesmo card. Agora é
           `sm2Hint` (Rubik, piso de 12px) com um glifo do sistema em cima —
           um vazio que CONVIDA, e o CTA logo abaixo é a saída. */
        <div style={{ padding: '20px 16px 8px', textAlign: 'center' }}>
          <Icon name="task_alt" size={32} tone="muted" />
          <p style={{ ...sm2Hint, marginTop: 8 }}>{emptyMessage}</p>
        </div>
      ) : (
        <ul className="sm-px-ritual-list">{children}</ul>
      )}
      {/* CTA — era `sm-px-btn-primary`: Silkscreen em caixa alta dentro de um
          chanfro de fliperama, o único botão do app que ainda falava a língua
          antiga na Home. Agora é o botão primário do sistema (`sm2Button`),
          largo porque é ele que aposentou o FAB flutuante. */}
      <div style={{ padding: '10px 12px 12px' }}>
        <button type="button" onClick={onCta} style={{ ...sm2Button('primary'), width: '100%' }}>
          {ctaLabel}
        </button>
      </div>
    </section>
  );
}
