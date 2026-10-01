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
import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
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
      /* A11 (QA rodada 2): SÓ `aria-disabled`, nunca `disabled` junto. O
         `disabled` nativo tira o checkbox da ordem de foco e do leitor de
         tela — a pessoa deixa de saber que o item existe e está concluído.
         Inerte = anunciado como inerte, alcançável, e o clique não faz nada. */
      aria-disabled={disabled || undefined}
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
/** Duração do brilho na linha recém-concluída (D1). */
export const RITUAL_GLOW_MS = 1100;

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
  /** D1: chave ESTÁVEL da linha entre renders (mesma tarefa antes e depois de
   *  ir para o histórico de hoje) — é por ela que a lista anima o deslize. */
  flipKey?: string;
}

export function RitualRow({
  kind, name, subtitle, value, max, done = false, dimmed = false, haunted = false, inert = false,
  onToggle, onEdit, expandable = false, expanded = false, onExpand,
  children, meta, below, language, toggleLabelPt, toggleLabelEn, flipKey,
}: RitualRowProps) {
  /* D1 — o BRILHO de quem acabou de ser concluída: só na transição
     aberta → concluída (nunca ao montar já concluída). É cor, não movimento,
     então também acontece com movimento reduzido. */
  const liRef = useRef<HTMLLIElement | null>(null);
  const eraFeita = useRef(done);
  useEffect(() => {
    const li = liRef.current;
    if (done && !eraFeita.current && li && typeof li.animate === 'function') {
      li.animate(
        [
          { boxShadow: '0 0 0 0 transparent', backgroundColor: 'transparent' },
          { boxShadow: '0 0 16px 1px var(--sm2-primary-fill)', backgroundColor: 'var(--sm2-primary-soft)', offset: 0.25 },
          { boxShadow: '0 0 0 0 transparent', backgroundColor: 'transparent' },
        ],
        { duration: RITUAL_GLOW_MS, easing: 'ease-out' },
      );
    }
    eraFeita.current = done;
  }, [done]);
  const isPt = language === 'pt-BR';
  const isHaunted = haunted && !done;
  /* A tinta do título e do selo: uma só regra, por estado (D-A3). */
  const tinta = isHaunted
    ? 'var(--sm2-haunted)'
    : (done || dimmed) ? 'var(--sm2-muted)' : 'var(--sm2-ink)';
  const seloTinta = done ? 'var(--sm2-primary-ink)' : isHaunted ? 'var(--sm2-haunted)' : 'var(--sm2-muted)';
  return (
    <li
      ref={liRef}
      data-flip-key={flipKey}
      className={`sm2-ritual${done ? ' sm2-ritual-done' : ''}${dimmed ? ' sm2-ritual-dim' : ''}${isHaunted ? ' sm2-ritual-haunted' : ''}`}
      data-haunted={isHaunted ? 'true' : undefined}
      /* Lido pela medição de densidade (T4) do roteiro de verificação. */
      data-action-unit
    >
      <div className="sm2-ritual-row" style={{ gap: GAP }}>
        {/* D2 (navegação do dono, 01/10/2026): EDITAR = tocar no ÍCONE DA
            ESQUERDA. O selo do tipo (24, pelado — ícone nunca em caixa) mora
            num botão de alvo 44 com o rótulo "Editar: <nome>"; o lápis/folha
            que o dono lia como "botão de editar" (o glifo de maturidade) saiu
            da linha (D3). A coluna de texto continua respondendo ao toque
            (atalho de ponteiro), mas o controle acessível é o selo — um só
            ponto de parada no Tab. */}
        <button
          type="button"
          className="sm2-ritual-edit"
          onClick={inert ? undefined : onEdit}
          aria-disabled={inert || undefined}
          aria-label={`${isPt ? 'Editar' : 'Edit'}: ${name}`}
          data-ritual-edit
          style={{
            flex: '0 0 44px', width: 44, height: 44, margin: '0 -10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 0, padding: 0,
            cursor: inert ? 'default' : 'pointer',
          }}
        >
          <Icon
            name={RITUAL_KIND_ICON[kind]}
            size={SELO}
            fill={done ? 1 : 0}
            style={{ color: seloTinta, flexShrink: 0 }}
          />
        </button>

        {/* Coluna de texto: toque também edita (ponteiro), sem papel de botão. */}
        <div
          className="sm2-ritual-main"
          onClick={inert ? undefined : onEdit}
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
        </div>

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
  /** `home` = a lista da Home B (minimal-ui F2, mock aprovado): cabeçalho
   *  "HOJE N/M" com um botão "+" que faz o papel do CTA (abre o CreateModal),
   *  sem o painel em volta. `panel` (padrão) é o painel de sempre. */
  variant?: 'panel' | 'home';
  /** Home B: o selo "Dia completo" — quem decide é a regra da virada
   *  (`completeDayReached`), nunca este componente. */
  dayComplete?: boolean;
}

export function RitualPanel({
  done, total, titleIconName, children, ctaLabel, onCta, emptyMessage, language,
  variant = 'panel', dayComplete = false,
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
            {isPt ? 'Hoje' : 'Today'}
            {/* Piso de dígitos E5: o contador só existe com feitos ≥ 1 —
                "0/5" é a fatura, não o dado. */}
            {total > 0 && done >= 1 && (
              <b
                className="sm2-num"
                aria-label={isPt ? `${done} de ${total} concluídos` : `${done} of ${total} done`}
              >
                {done}/{total}
              </b>
            )}
            {dayComplete && (
              <span className="sm3-selo" data-dia-completo>{isPt ? 'Dia completo' : 'Day complete'}</span>
            )}
          </h2>
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
          <ul ref={listaRef} className="sm2-ritual-list">{children}</ul>
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
