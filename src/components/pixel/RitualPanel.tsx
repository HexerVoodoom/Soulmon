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
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import type { Language } from '../../utils/i18n';
import { Icon } from '../ui/Icon';
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

/** Checkbox 44 + gap 8 = onde a coluna de texto começa; a 2ª linha e os filhos alinham aqui. */
const CHECK = 44;
const GAP = 8;
export const RITUAL_TEXT_INSET = CHECK + GAP;

/**
 * A CAIXA do checkbox — UM desenho só, usado pela linha (`RitualCheck`) e pelos
 * filhos (`StepRow`): 24, raio 4, borda 2px.
 *
 * Polimento da Home (14/10/2026, pedido do dono): VAZIA = fundo transparente e
 * contorno BRONZE (`--sm2-check-fill`, alias do ouro-cobre do sistema). MARCADA =
 * o mesmo contorno bronze e, dentro, o check TURQUESA (`--sm2-primary-ink`, o
 * ciano da paleta, nunca verde) com um glow discreto (`--sm2-check-glow`):
 * difuso, baixo, na cor do check, sem borda dura e sem animação. É cor, nunca
 * opacidade; o fundo da caixa não muda entre os estados.
 * PARCIAL (`mixed`) = o pai com alguns filhos feitos: contorno e traço bronze.
 * Inerte (fora do dia) e VAZIO = TRACEJADO `muted`, por FORMA.
 */
export function checkBoxStyle(
  { checked, mixed = false, dashed = false }: { checked: boolean; mixed?: boolean; dashed?: boolean },
): CSSProperties {
  return {
    width: 24,
    height: 24,
    borderRadius: 'var(--sm2-radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    border: dashed && !checked && !mixed
      ? '2px dashed var(--sm2-muted)'
      : '2px solid var(--sm2-check-fill)',
  };
}

/** O check turquesa com o glow baixo: só existe marcado (nada de `opacity: 0`). */
export function CheckMark() {
  return (
    <Icon name="check" size={20} fill={1} weight={700} tone="primary" style={{ filter: 'var(--sm2-check-glow)' }} />
  );
}

/**
 * O checkbox da lista, a ação central do app.
 *
 * Mesma semântica (`role="checkbox"` + `aria-checked`) e o mesmo alvo de 44×44
 * declarado INLINE (footgun 1); a caixa é `checkBoxStyle`. Inerte = anunciado
 * com `aria-disabled`, nunca `disabled` (continua alcançável).
 */
export function RitualCheck({
  checked, mixed = false, disabled, onToggle, label,
}: { checked: boolean; mixed?: boolean; disabled: boolean; onToggle?: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mixed && !checked ? 'mixed' : checked}
      aria-label={label}
      data-ritual-check
      /* A11 (QA rodada 2): SÓ `aria-disabled`, nunca `disabled` junto. O
         `disabled` nativo tira o checkbox da ordem de foco e do leitor de
         tela. Inerte = anunciado como inerte, alcançável, e o clique não faz nada. */
      aria-disabled={disabled || undefined}
      onClick={onToggle}
      style={{ ...alvo44, flex: '0 0 44px', border: 'none', cursor: disabled && !onToggle ? 'default' : 'pointer' }}
    >
      <span aria-hidden="true" style={checkBoxStyle({ checked, mixed, dashed: disabled })}>
        {checked && <CheckMark />}
        {!checked && mixed && (
          <span style={{ width: 12, height: 2, borderRadius: 1, backgroundColor: 'var(--sm2-check-fill)' }} />
        )}
      </span>
    </button>
  );
}


// ─────────────────────────────────────────────── D1: concluir não "teleporta"

/** `prefers-reduced-motion`: lido na hora (sem estado), seguro fora do browser. */
function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Duração do deslize da linha concluída até a posição nova (D1). */
export const RITUAL_FLIP_MS = 420;

/**
 * D1 (navegação do dono, 01/10/2026) — ao concluir, a linha DESCE até a
 * posição nova em vez de sumir de um lugar e aparecer no outro.
 *
 * Técnica FLIP: a cada render, mede o topo de cada `li[data-flip-key]`
 * relativo à lista; se a mesma chave estava em outro lugar no render
 * anterior, anima de lá até aqui com `transform` (sem reflow). A chave é
 * `data-flip-key` e não a `key` do React de propósito: a tarefa concluída sai
 * de `tasks` 3s depois e reaparece no histórico de hoje com OUTRA `key` — o
 * nó é outro, a linha é a mesma, e ela desliza em vez de teleportar.
 *
 * `prefers-reduced-motion`: nada desliza (a linha só troca de lugar). Sem
 * `Element.animate` (jsdom, WebView antigo): não faz nada.
 */
function useFlipList(listRef: RefObject<HTMLUListElement | null>) {
  const anterior = useRef<Map<string, number>>(new Map());
  useLayoutEffect(() => {
    const ul = listRef.current;
    if (!ul) return;
    const base = ul.getBoundingClientRect().top;
    const agora = new Map<string, number>();
    const reduzir = prefersReducedMotion();
    ul.querySelectorAll<HTMLElement>(':scope > li[data-flip-key]').forEach((li) => {
      const chave = li.dataset.flipKey!;
      const topo = li.getBoundingClientRect().top - base;
      agora.set(chave, topo);
      const antes = anterior.current.get(chave);
      if (reduzir || antes === undefined || Math.abs(antes - topo) < 1 || typeof li.animate !== 'function') return;
      li.animate(
        [
          { transform: `translateY(${antes - topo}px)`, zIndex: 1 },
          { transform: 'translateY(0)', zIndex: 1 },
        ],
        { duration: RITUAL_FLIP_MS, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
    });
    anterior.current = agora;
  });
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
  /** Pré-visualização de UMA linha, só na tela `View all` (dias em que a tarefa aparece).
   *  A lista de HOJE nunca passa isto: ali a linha é só nome + checkbox (14/10/2026). */
  subtitle?: string;
  /** Quantos filhos estão feitos (0 = nenhum) e quantos existem: alimenta o estado `mixed` do pai. */
  value: number;
  max: number;
  done?: boolean;
  /** Fora do dia da semana da atividade: lê como inativa, mas continua legível. */
  dimmed?: boolean;
  /**
   * TAREFA ASSOMBRADA (P5): título e selo na tinta PRÓPRIA `--sm2-haunted`,
   * lápis e checkbox intactos — NUNCA opacidade na linha. O convite
   * ("haunted · +relief") saiu da linha (14/10/2026: só nome e checkbox).
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
  /** `View all`: a linha NÃO marca nada — sem checkbox, o toque inteiro abre a edição. */
  editOnly?: boolean;
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
  /** D1: chave ESTÁVEL da linha entre renders (mesma tarefa antes e depois de
   *  ir para o histórico de hoje) — é por ela que a lista anima o deslize. */
  flipKey?: string;
}

export function RitualRow({
  kind, name, subtitle, value, max, done = false, dimmed = false, haunted = false, inert = false,
  onToggle, editOnly = false, onEdit, expandable = false, expanded = false, onExpand,
  children, language, toggleLabelPt, toggleLabelEn, flipKey,
}: RitualRowProps) {
  const isPt = language === 'pt-BR';
  const isHaunted = haunted && !done;
  /* A tinta do título: uma só regra, por estado (D-A3). */
  const tinta = isHaunted
    ? 'var(--sm2-haunted)'
    : (done || dimmed) ? 'var(--sm2-muted)' : 'var(--sm2-ink)';
  /* PAI × FILHOS (beta-2, 2.2): linha com filhos NUNCA conclui direto. O
     checkbox à esquerda só REFLETE (marcado = todos feitos; `mixed` = alguns) e
     tocá-lo abre os filhos; quem conclui são eles. */
  const pai = expandable;
  const parcial = pai && !done && value > 0;
  const rotuloCheck = isPt
    ? (toggleLabelPt ?? (done ? 'Concluído' : 'Marcar como concluído'))
    : (toggleLabelEn ?? (done ? 'Completed' : 'Mark as completed'));
  const abrir = pai && !done && !expanded ? onExpand : undefined;
  return (
    <li
      data-flip-key={flipKey}
      className={`sm2-ritual${done ? ' sm2-ritual-done' : ''}${dimmed ? ' sm2-ritual-dim' : ''}${isHaunted ? ' sm2-ritual-haunted' : ''}`}
      data-haunted={isHaunted ? 'true' : undefined}
      data-kind={kind}
      /* Lido pela medição de densidade (T4) do roteiro de verificação. */
      data-action-unit
    >
      <div className="sm2-ritual-row" style={{ gap: GAP }}>
        {/* O CHECKBOX BRONZE à ESQUERDA do nome (beta-2, 2.2). O selo do tipo
            (tarefa/hábito) saiu: a lista já se divide em `Tasks`/`Habits`, e o
            ícone repetia a informação. */}
        {editOnly ? (
          <span aria-hidden="true" style={{ flex: '0 0 12px', width: 12, height: 44 }} />
        ) : (
          <RitualCheck
            checked={done}
            mixed={parcial}
            disabled={done || dimmed || inert || pai}
            onToggle={pai ? abrir : (done || dimmed || inert ? undefined : onToggle)}
            label={rotuloCheck}
          />
        )}

        {/* Coluna de texto. EDITAR = o nome (botão nomeado, o controle
            acessível); a coluna inteira também responde ao toque (atalho de
            ponteiro), sem papel de botão para não duplicar a parada no Tab. */}
        <div
          className="sm2-ritual-main"
          onClick={inert ? undefined : onEdit}
          style={{ cursor: inert ? 'default' : 'pointer' }}
        >
          {/* `title` porque o nome TRUNCA: sem ele, um nome longo em PT-BR
              some sem recurso nenhum de leitura. */}
          <button
            type="button"
            className="sm2-ritual-edit"
            data-ritual-edit
            onClick={inert ? undefined : (e) => { e.stopPropagation(); onEdit(); }}
            aria-disabled={inert || undefined}
            aria-label={`${isPt ? 'Editar' : 'Edit'}: ${name}`}
            style={{ cursor: inert ? 'default' : 'pointer' }}
          >
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
          </button>
          {subtitle && (
            <span className="sm2-ritual-sub" title={subtitle}>
              {subtitle}
            </span>
          )}
        </div>

        {expandable ? (
          <button
            type="button"
            onClick={onExpand}
            aria-expanded={expanded}
            data-ritual-expand
            aria-label={isPt
              ? `${expanded ? 'Recolher' : 'Expandir'} etapas de ${name}`
              : `${expanded ? 'Collapse' : 'Expand'} steps of ${name}`}
            /* Chevron DISCRETO (20, `muted`), SEM caixa — ícone não mora em
               moldura; quem carrega o alvo de 44px é o botão. */
            style={{ ...alvo44, border: 'none', color: 'var(--sm2-muted)' }}
          >
            <Icon name={expanded ? 'expand_less' : 'expand_more'} size={20} />
          </button>
        ) : (
          <span aria-hidden="true" style={{ flex: '0 0 12px', width: 12, height: 44 }} />
        )}
      </div>

      {expandable && expanded && children && (
        <div data-ritual-children style={{ padding: `0 0 8px ${RITUAL_TEXT_INSET}px`, boxSizing: 'border-box' }}>{children}</div>
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
  /** `home` = a lista da Home B (minimal-ui F2, mock aprovado): cabeçalho
   *  "HOJE N/M" com um botão "+" que faz o papel do CTA (abre o CreateModal),
   *  sem o painel em volta. `panel` (padrão) é o painel de sempre. */
  variant?: 'panel' | 'home';
  /** Home B: o selo "Dia completo" — quem decide é a regra da virada
   *  (`completeDayReached`), nunca este componente. */
  dayComplete?: boolean;
  /** Beta-2 (2.4): a META do dia (`dailyGoalFor`), só para EXIBIR. É outra
   *  grandeza que "feitos/total" (contagem da lista) e nunca altera o registro
   *  de conclusão — por isso mora num bloco SEPARADO do título. */
  goal?: number;
  /** Beta-2 (2.3): rodapé da lista (o `View all →`). */
  footer?: ReactNode;
}

export function RitualPanel({
  done, total, titleIconName, children, ctaLabel, onCta, emptyMessage, language,
  variant = 'panel', dayComplete = false, goal, footer,
}: RitualPanelProps) {
  const isPt = language === 'pt-BR';
  const listaRef = useRef<HTMLUListElement | null>(null);
  useFlipList(listaRef);
  /* Vazio do SIS-06: `task_alt` 48 ciano + Rubik 14 `muted` — um vazio que
     CONVIDA. Um bloco só para as duas variantes (a Home B acrescenta o CTA
     largo, que ali é o único primário da tela). */
  const vazio = (cta?: ReactNode) => (
    <div style={{ padding: '8px 16px 4px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: cta ? 8 : 4 }}>
      <Icon name="task_alt" size={48} tone="primary" />
      <p style={{ ...sm2Hint, fontSize: 'var(--sm2-text-sm)' }}>{emptyMessage}</p>
      {cta}
    </div>
  );
  if (variant === 'home') {
    return (
      <section aria-labelledby="sm2-ritual-title" data-ritual-home>
        <div className="sm3-hoje-head">
          <h2 id="sm2-ritual-title" className="sm3-hoje-titulo">
            {/* `Today` com acabamento cromado discreto (beta-2, 2.4). */}
            <span className="sm3-cromo" data-today-title>{isPt ? 'Hoje' : 'Today'}</span>
            {/* Piso de dígitos E5: o contador só existe com feitos ≥ 1 —
                "0/5" é a fatura, não o dado. Esta é a CONTAGEM de atividades
                da lista; a meta é o bloco ao lado. */}
            {total > 0 && done >= 1 && (
              <b
                className="sm2-num"
                data-today-count
                aria-label={isPt ? `${done} de ${total} concluídos` : `${done} of ${total} done`}
              >
                {done}/{total}
              </b>
            )}
            {dayComplete && (
              <span className="sm3-selo" data-dia-completo>{isPt ? 'Dia completo' : 'Day complete'}</span>
            )}
          </h2>
          {goal !== undefined && goal > 0 && (
            <span
              className="sm3-meta"
              data-today-goal
              aria-label={isPt ? `Meta do dia: ${goal}` : `Daily goal: ${goal}`}
            >
              <span aria-hidden="true">{isPt ? 'Meta' : 'Goal'}</span>
              <b className="sm2-num" aria-hidden="true">{goal}</b>
            </span>
          )}
          <button
            type="button"
            className="sm3-add"
            onClick={onCta}
            aria-label={ctaLabel}
            title={ctaLabel}
            data-ritual-add
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
        {emptyMessage ? (
          /* Vazio que CONVIDA: o CTA largo continua aqui — é o único
             primário da tela quando não há nada cadastrado (ListaVazia). */
          vazio(
            <button type="button" onClick={onCta} style={{ ...sm2Button('primary'), width: '100%' }}>
              <Icon name="add" size={24} />
              {ctaLabel}
            </button>,
          )
        ) : (
          <>
            <ul ref={listaRef} className="sm2-ritual-list">{children}</ul>
            {footer}
          </>
        )}
      </section>
    );
  }
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
        /* O CTA logo abaixo é a saída (o único primário). */
        vazio()
      ) : (
        <ul ref={listaRef} className="sm2-ritual-list">{children}</ul>
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
