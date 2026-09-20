/**
 * Painel de rituais da Home — a lista do dia sob o pet fixo.
 *
 * Composição do canvas ATIVIDADES (identidade, `docs/design/wireframes/
 * atividades/identidade/`, DECISÕES §20), sobre a estrutura aprovada do
 * wireframe (§6): UM painel titulado, com linhas de 56px mínimos:
 *
 *   [ selo 24 ] [ nome / subtítulo / metadados = botão de editar ] [ checkbox 24 em alvo 44 | chevron 44 ]
 *   [ ........ segunda linha da tarefa (`TaskMeta`), fora do botão ......... ]
 *
 * Decisões que valem registro (as antigas continuam valendo — G1, N1, N3):
 *
 * 1. **O selo é o TIPO, não a categoria** (D-A2, achado 1): `task_alt` para
 *    tarefa, `event_repeat` para hábito, 24 em `muted`. O ícone de categoria
 *    (32, cobre) seria um segundo acento por linha; a categoria vai no
 *    subtítulo, em palavra. Concluída = o mesmo selo em `primary-ink` FILL 1.
 * 2. **Esmaecer é TINTA, nunca alfa** (D-A3, Home F1): fora do dia e concluída
 *    em `muted`; assombrada em `--sm2-haunted` (P5). Nenhum nó da linha carrega
 *    `opacity` — o canvas mede 0 nós com alfa < 1 e o teste trava.
 * 3. **Coluna de texto = botão de editar** (decisão 5 do wireframe). Os
 *    metadados do HÁBITO (janela de 7 + glifo de maturidade, `HabitConstancy
 *    compact`) moram DENTRO dessa coluna — são `role="img"`, não interativos.
 *    Os da TAREFA (`TaskMeta`, que tem o botão do contador de adiamentos)
 *    ficam numa segunda linha FORA do botão, alinhada ao texto (`below`).
 * 4. **Etapas nascem recolhidas**; o chevron ocupa a casa do checkbox.
 * 5. **Pixel fora do visor saiu** (SIS achado 1): a linha é só layout sobre
 *    tokens — regras `.sm2-ritual-*` no fim do `index.css` (o clamp de 2
 *    linhas e a mídia de altura não cabem em `style`), o resto inline.
 * 6. **O checkbox é `role="checkbox"` + `aria-checked`, 24 num alvo 44**;
 *    inerte (fora do dia / concluída) = tracejado `muted` + `aria-disabled`.
 *
 * Texto nasce em EN com par PT-BR, como todo texto de UI do app.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { Language } from '../../utils/i18n';
import { Icon } from '../ui/Icon';
import { PixelSegmentedBar } from './PixelKit';
import { SM2_SHADOW_CARD, sm2Button, sm2Hint } from '../form/FormKit';

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

/** Selo 24 + gap 8 = onde a coluna de texto começa; a 2ª linha alinha aqui. */
const SELO = 24;
const GAP = 8;
export const RITUAL_TEXT_INSET = SELO + GAP;

/**
 * O checkbox da lista — a ação central do app.
 *
 * Mesma semântica (`role="checkbox"` + `aria-checked`) e o mesmo alvo de 44×44
 * declarado INLINE (footgun 1), com a caixa do sistema: 24, raio 4, borda
 * `muted` 2px; marcada = `--sm2-primary-fill` com o glifo em `--sm2-on-primary`.
 * Inerte = TRACEJADA + `aria-disabled` (canvas Home E7): por FORMA, nunca por
 * opacidade.
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
      aria-disabled={disabled || undefined}
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
          border: checked ? '2px solid var(--sm2-primary-fill)' : `2px ${disabled ? 'dashed' : 'solid'} var(--sm2-muted)`,
          backgroundColor: checked ? 'var(--sm2-primary-fill)' : 'transparent',
          color: 'var(--sm2-on-primary)',
          transition: 'background-color var(--sm2-dur-tap) var(--sm2-ease)',
        }}
      >
        {/* O glifo só existe marcado: nada de `opacity: 0` escondendo um
            check (alfa em nó nenhum da linha). */}
        {checked && <Icon name="check" size={20} fill={1} weight={700} />}
      </span>
    </button>
  );
}

// ───────────────────────────────────────────────────────────────────── a linha

export type RitualKind = 'task' | 'habit';

/** Selo do tipo (D-A2): `task_alt` tarefa · `event_repeat` hábito. */
export const RITUAL_KIND_ICON: Record<RitualKind, string> = {
  task: 'task_alt',
  habit: 'event_repeat',
};

export interface RitualRowProps {
  /** Tarefa ou hábito — decide o selo. */
  kind: RitualKind;
  name: string;
  /** Uma linha curta: categoria, frequência, "3 steps". */
  subtitle?: string;
  /** Barra segmentada fina. `max` 1 = item sem etapas (sem barra). */
  value: number;
  max: number;
  done?: boolean;
  /** Fora do dia da semana da atividade: lê como inativa, mas continua legível. */
  dimmed?: boolean;
  /**
   * TAREFA ASSOMBRADA (P5): título e selo na tinta PRÓPRIA `--sm2-haunted`,
   * lápis e checkbox intactos — NUNCA opacidade na linha. O convite
   * ("haunted · +relief") é o chip do `TaskMeta`, em `below`.
   */
  haunted?: boolean;
  /**
   * Linha de HISTÓRICO (concluída hoje, já fora de `tasks`): editar é inerte
   * (`aria-disabled`), o checkbox é cheio e inerte. Ela existe para o
   * "feitos/total" contar o que foi feito (A4) — some na virada do dia.
   */
  inert?: boolean;
  /** Ausente = a linha não tem checkbox (quem completa são as etapas). */
  onToggle?: () => void;
  onEdit: () => void;
  /** Expansor das etapas, no lugar do checkbox. */
  expandable?: boolean;
  expanded?: boolean;
  onExpand?: () => void;
  /** Etapas, renderizadas só quando expandido. */
  children?: ReactNode;
  /** Metadados DENTRO da coluna de texto (hábito: janela de 7 + maturidade). */
  meta?: ReactNode;
  /** Segunda linha FORA do botão, alinhada ao texto (tarefa: `TaskMeta`). */
  below?: ReactNode;
  language: Language;
  toggleLabelPt?: string;
  toggleLabelEn?: string;
}

export function RitualRow({
  kind, name, subtitle, value, max, done = false, dimmed = false, haunted = false, inert = false,
  onToggle, onEdit, expandable = false, expanded = false, onExpand,
  children, meta, below, language, toggleLabelPt, toggleLabelEn,
}: RitualRowProps) {
  const isPt = language === 'pt-BR';
  const isHaunted = haunted && !done;
  /* A tinta do título e do selo: uma só regra, por estado (D-A3). */
  const tinta = isHaunted
    ? 'var(--sm2-haunted)'
    : (done || dimmed) ? 'var(--sm2-muted)' : 'var(--sm2-ink)';
  const seloTinta = done ? 'var(--sm2-primary-ink)' : isHaunted ? 'var(--sm2-haunted)' : 'var(--sm2-muted)';
  return (
    <li
      className={`sm2-ritual${done ? ' sm2-ritual-done' : ''}${dimmed ? ' sm2-ritual-dim' : ''}${isHaunted ? ' sm2-ritual-haunted' : ''}`}
      data-haunted={isHaunted ? 'true' : undefined}
      /* Lido pela medição de densidade (T4) do roteiro de verificação. */
      data-action-unit
    >
      <div className="sm2-ritual-row" style={{ gap: GAP }}>
        {/* O selo do TIPO — 24, pelado, `aria-hidden` (o tipo já está no
            rótulo do checkbox: "Mark task/activity as completed"). */}
        <Icon
          name={RITUAL_KIND_ICON[kind]}
          size={SELO}
          fill={done ? 1 : 0}
          style={{ color: seloTinta, flexShrink: 0 }}
        />

        {/* Coluna de texto = botão de editar (decisão 3 do cabeçalho). */}
        <button
          type="button"
          className="sm2-ritual-main"
          onClick={inert ? undefined : onEdit}
          aria-disabled={inert || undefined}
          aria-label={`${isPt ? 'Editar' : 'Edit'}: ${name}`}
          style={{ cursor: inert ? 'default' : 'pointer' }}
        >
          {/* `title` porque o nome TRUNCA: sem ele, um nome longo em PT-BR
              some sem recurso nenhum de leitura. */}
          <span
            className="sm2-ritual-name"
            title={name}
            style={{
              color: tinta,
              textDecoration: done ? 'line-through' : 'none',
              fontWeight: done ? 400 : 500,
            }}
          >
            {name}
          </span>
          {subtitle && (
            <span className="sm2-ritual-sub" title={subtitle}>
              {subtitle}
            </span>
          )}
          {/* Barra segmentada só onde ela DIZ alguma coisa (com etapas). */}
          {max > 1 && (
            <PixelSegmentedBar
              value={value}
              max={max}
              segments={Math.min(max, 12)}
              height={12}
              tone={done ? 'gold' : 'cyan'}
              label={`${isPt ? 'Progresso' : 'Progress'}: ${name}`}
              style={{ marginTop: 4, width: 96 }}
            />
          )}
          {meta && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 20, marginTop: 4 }}>
              {meta}
            </span>
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
            /* Chevron do sistema, SEM caixa — ícone não mora em moldura; quem
               carrega o alvo de 44px é o botão. */
            style={{ ...alvo44, border: 'none', color: 'var(--sm2-muted)' }}
          >
            <Icon name={expanded ? 'expand_less' : 'expand_more'} size={24} />
          </button>
        ) : onToggle ? (
          <RitualCheck
            checked={done}
            disabled={done || dimmed || inert}
            onToggle={onToggle}
            label={isPt
              ? (toggleLabelPt ?? (done ? 'Concluído' : 'Marcar como concluído'))
              : (toggleLabelEn ?? (done ? 'Completed' : 'Mark as completed'))}
          />
        ) : (
          <span aria-hidden="true" style={{ flex: '0 0 44px', width: 44, height: 44 }} />
        )}
      </div>

      {/* A 2ª linha da tarefa: chips 24 + o contador (botão 44) — fora do
          botão de editar, alinhada ao texto. Some na concluída. */}
      {below && !done && (
        <div style={{ padding: `0 0 8px ${RITUAL_TEXT_INSET}px`, boxSizing: 'border-box' }}>{below}</div>
      )}

      {expanded && children && (
        <div style={{ padding: `0 0 8px ${RITUAL_TEXT_INSET}px`, boxSizing: 'border-box' }}>{children}</div>
      )}
    </li>
  );
}

// ──────────────────────────────────────────────────────────────────── o painel

export interface RitualPanelProps {
  /** Feitos hoje / devidos hoje — vira o contador do título ("2/5"). Só com
   *  feitos ≥ 1 (piso de dígitos E5: "0/5" é a fatura, não o dado). */
  done: number;
  total: number;
  /** Nome de ícone do cabeçalho (inventário; nunca emoji, nunca PNG). */
  titleIconName?: string;
  children: ReactNode;
  /** CTA largo no fim da lista — `outline` com a lista viva; o ÚNICO `primary`
   *  da tela quando a lista está vazia (ListaVazia). */
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
  const titulo = isPt ? 'Rituais diários' : 'Daily rituals';
  const completo = total > 0 && done >= total;
  return (
    <section style={painel} aria-labelledby="sm2-ritual-title">
      <div className="sm2-panel-head">
        {/* Dia feito pela FORMA: o glifo do cabeçalho enche (FILL 1, ciano). */}
        {titleIconName && (
          <Icon name={titleIconName} size={24} fill={completo ? 1 : 0} tone={completo ? 'primary' : 'muted'} />
        )}
        <h2 id="sm2-ritual-title" className="sm2-panel-head-title" style={{ margin: 0 }}>{titulo}</h2>
        {total > 0 && done >= 1 && (
          <span
            className="sm2-panel-head-count sm2-num"
            aria-label={isPt ? `${done} de ${total} concluídos` : `${done} of ${total} done`}
          >
            {done}/{total}
          </span>
        )}
      </div>
      {emptyMessage ? (
        /* Vazio do SIS-06: `task_alt` 48 ciano + Rubik 14 `muted` — um vazio
           que CONVIDA, e o CTA logo abaixo é a saída (o único primário). */
        <div style={{ padding: '8px 16px 4px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <Icon name="task_alt" size={48} tone="primary" />
          <p style={{ ...sm2Hint, fontSize: 'var(--sm2-text-sm)' }}>{emptyMessage}</p>
        </div>
      ) : (
        <ul className="sm2-ritual-list">{children}</ul>
      )}
      <div style={{ padding: '8px 12px 8px' }}>
        <button
          type="button"
          onClick={onCta}
          style={{ ...sm2Button(emptyMessage ? 'primary' : 'outline'), width: '100%' }}
        >
          <Icon name="add" size={24} />
          {ctaLabel}
        </button>
      </div>
    </section>
  );
}
