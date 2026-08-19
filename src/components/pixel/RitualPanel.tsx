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
import type { ReactNode } from 'react';
import type { Language } from '../../utils/i18n';
import { Icon } from '../ui/Icon';
import { PixelCheckbox, PixelPanel, PixelSegmentedBar, PixelButton } from './PixelKit';

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
export function RitualIcon({ name }: { name?: string }) {
  if (!name) return null;
  return (
    <span className="sm-px-ritual-icon" aria-hidden="true">
      <Icon name={name} size={32} tone="gold" />
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
  iconName, name, subtitle, value, max, done = false, dimmed = false,
  onToggle, onEdit, expandable = false, expanded = false, onExpand,
  children, language, toggleLabelPt, toggleLabelEn,
}: RitualRowProps) {
  const isPt = language === 'pt-BR';
  return (
    <li
      className={`sm-px-ritual${done ? ' sm-px-ritual-done' : ''}${dimmed ? ' sm-px-ritual-dim' : ''}`}
      /* Lido pela medição de densidade (T4) do roteiro de verificação. */
      data-action-unit
    >
      <div className="sm-px-ritual-row">
        <RitualIcon name={iconName} />

        {/* Coluna de texto = botão de editar (decisão 5 do cabeçalho). */}
        <button
          type="button"
          className="sm-px-ritual-main"
          onClick={onEdit}
          aria-label={`${isPt ? 'Editar' : 'Edit'}: ${name}`}
        >
          {/* `title` porque o nome TRUNCA: sem ele, um nome longo em PT-BR
              some sem recurso nenhum de leitura. */}
          <span className="sm-px-ritual-name" title={name}>{name}</span>
          {subtitle && <span className="sm-px-ritual-sub" title={subtitle}>{subtitle}</span>}
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
            className="sm-px-ritual-expand"
            onClick={onExpand}
            aria-expanded={expanded}
            aria-label={isPt
              ? `${expanded ? 'Recolher' : 'Expandir'} etapas de ${name}`
              : `${expanded ? 'Collapse' : 'Expand'} steps of ${name}`}
          >
            {/* Seta em blocos retos: o glifo do lucide tem ponta arredondada e
                destoa no meio de peça pixel-art (mesma razão do "+" do kit). */}
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"
              style={{ transform: expanded ? 'rotate(180deg)' : undefined }}>
              <rect x="2" y="5" width="3" height="3" fill="currentColor" />
              <rect x="5" y="8" width="3" height="3" fill="currentColor" />
              <rect x="8" y="8" width="3" height="3" fill="currentColor" />
              <rect x="11" y="5" width="3" height="3" fill="currentColor" />
            </svg>
          </button>
        ) : onToggle ? (
          <PixelCheckbox
            checked={done}
            disabled={done || dimmed}
            onToggle={onToggle}
            language={language}
            labelPt={toggleLabelPt}
            labelEn={toggleLabelEn}
          />
        ) : (
          <span className="sm-px-ritual-slot" aria-hidden="true" />
        )}
      </div>

      {expanded && children && <div className="sm-px-ritual-steps">{children}</div>}
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
    /* Cabeçalho PRÓPRIO em vez do `title`/`titleIcon` do `PixelPanel`: aquele
       desenha Silkscreen 12px com um `<img>` PNG ao lado — abaixo do piso de
       14px da voz do aparelho, e raster onde a regra pede vetor. Aqui o título
       é Fredoka (tipografia de título) e o contador é `.sm2-num`, porque é
       número que MUDA: sem tabular-nums o "2/5" pula de largura ao virar
       "10/12" e o cabeçalho inteiro treme. */
    <PixelPanel padded={false}>
      <div className="sm2-panel-head">
        {titleIconName && <Icon name={titleIconName} size={20} fill={total > 0 && done >= total ? 1 : 0} tone="primary" />}
        <span className="sm2-panel-head-title">{titulo}</span>
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
        <p className="sm-px-ritual-empty">{emptyMessage}</p>
      ) : (
        <ul className="sm-px-ritual-list">{children}</ul>
      )}
      <div className="sm-px-ritual-cta">
        <PixelButton size="lg" variant="primary" onClick={onCta}>
          {ctaLabel}
        </PixelButton>
      </div>
    </PixelPanel>
  );
}
