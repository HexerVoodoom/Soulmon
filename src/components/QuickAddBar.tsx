/**
 * Captura de uma linha NA TELA INICIAL (`docs/PLANO-TAREFAS.md`, §2.5).
 *
 * O parser já existia e é o mesmo do `CreateModal` — `utils/quickAdd.ts`.
 * O que faltava era a linha estar onde a pessoa está: no modal, anotar custa
 * abrir → digitar → aplicar → salvar. A justificativa do plano é dura e é do
 * benchmark: **se a captura custa três telas, o sistema não sobrevive à
 * segunda semana.**
 *
 * DECISÕES QUE NÃO SÃO ENFEITE:
 *
 * 1. **A confirmação é VISÍVEL antes de gravar.** Os chips mostram o que o
 *    parser entendeu enquanto se digita. É a mesma regra que o `CreateModal`
 *    escreveu primeiro: *"parsing invisível que erra é como o app perde a
 *    confiança dele"*.
 * 2. **O modal continua existindo e não foi escondido.** A linha serve ao caso
 *    comum; passos, âncora, alarme e prazo seguem lá. Trocar um pelo outro
 *    tiraria poder de quem já usa.
 * 3. **A gravação NÃO é reimplementada aqui.** O componente devolve o que foi
 *    entendido e quem grava é o `App`, pelos MESMOS `commitTaskCreate` /
 *    `commitHabitCreate` do modal — são eles que conhecem o teto do modo
 *    grátis, o teto do estágio e a telemetria. Uma segunda rota de criação que
 *    não os consultasse seria um jeito de furar o teto sem ninguém perceber.
 */
import { useMemo, useState } from 'react';
import { parseQuickAdd, quickAddHint, type QuickAddResult } from '../utils/quickAdd';
import { Icon } from './ui/Icon';
import { Field, sm2Hint, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';

interface QuickAddBarProps {
  language: Language;
  /** Grava. Devolve `false` quando o teto recusou — a barra avisa e MANTÉM o
   *  texto, para a pessoa não perder o que digitou. */
  onCommit: (r: QuickAddResult) => boolean;
}

export function QuickAddBar({ language, onCommit }: QuickAddBarProps) {
  const isPt = language === 'pt-BR';
  const [texto, setTexto] = useState('');
  const [recusado, setRecusado] = useState(false);
  const [ajudaAberta, setAjudaAberta] = useState(false);

  // `now` entra por parâmetro porque o parser é puro de propósito: data
  // relativa com relógio próprio é intestável e vira bug de fuso na virada.
  const resultado = useMemo(
    () => parseQuickAdd(texto, { now: new Date(), language: isPt ? 'pt-BR' : 'en' }),
    [texto, isPt],
  );

  const chips = useMemo(() => {
    const fora: string[] = [];
    if (resultado.schedule) {
      const s = resultado.schedule;
      if (s.kind === 'timesPerWeek') fora.push(isPt ? `${s.target}× por semana` : `${s.target}× per week`);
      else if (s.kind === 'everyNDays') fora.push(isPt ? `a cada ${s.n} dias` : `every ${s.n} days`);
      else {
        const nomes = isPt ? ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
          : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        fora.push(s.days.map(d => nomes[d]).join(', '));
      }
    }
    if (resultado.date) {
      const [a, m, d] = resultado.date.split('-');
      fora.push(`${d}/${m}/${a}${resultado.time ? ` · ${resultado.time}` : ''}`);
    } else if (resultado.time) {
      fora.push(resultado.time);
    }
    if (resultado.category) fora.push(resultado.category);
    if (resultado.effort) fora.push(isPt ? `esforço ${resultado.effort}` : `effort ${resultado.effort}`);
    return fora;
  }, [resultado, isPt]);

  const podeGravar = resultado.name.trim().length > 0;

  const gravar = () => {
    if (!podeGravar) return;
    if (onCommit(resultado)) {
      setTexto('');
      setRecusado(false);
    } else {
      setRecusado(true);
    }
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Field
            value={texto}
            onChange={e => { setTexto(e.target.value); setRecusado(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); gravar(); } }}
            placeholder={isPt ? 'Anotar numa linha…' : 'Capture in one line…'}
            aria-label={isPt
              ? 'Anotar uma tarefa ou hábito numa linha'
              : 'Capture a task or habit in one line'}
          />
        </div>
        <button
          type="button"
          onClick={gravar}
          disabled={!podeGravar}
          aria-label={isPt ? 'Adicionar' : 'Add'}
          style={{
            minWidth: 44, minHeight: 44, borderRadius: 10,
            cursor: podeGravar ? 'pointer' : 'default',
            border: '1px solid transparent',
            backgroundColor: podeGravar ? 'var(--sm2-primary-fill)' : 'var(--sm2-surface-2)',
            color: podeGravar ? 'var(--sm2-on-primary)' : 'var(--sm2-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="add" size={20} />
        </button>
      </div>

      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {chips.map(c => (
            <span
              key={c}
              style={{
                ...sm2Hint, margin: 0, padding: '2px 8px', borderRadius: 999,
                backgroundColor: 'var(--sm2-surface-2)', color: 'var(--sm2-ink)',
              }}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {recusado && (
        <p role="alert" style={{ ...sm2Text, color: 'var(--sm2-danger-ink)', marginTop: 8 }}>
          {isPt
            ? 'Não coube agora — você chegou ao limite de itens.'
            : "That didn't fit — you've reached your item limit."}
        </p>
      )}

      {/* A ajuda é RECOLHIDA: a sintaxe é bônus para quem quiser, e uma legenda
          permanente de tokens transforma uma caixa de texto simples numa
          interface que parece exigir estudo. O texto vem de `quickAddHint`,
          que já é o dono dessa frase no `CreateModal` — duas listas de atalhos
          divergiriam em silêncio na primeira mudança do parser. */}
      <button
        type="button"
        onClick={() => setAjudaAberta(a => !a)}
        aria-expanded={ajudaAberta}
        style={{
          ...sm2Hint, marginTop: 6, background: 'none', border: 'none',
          padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <Icon name={ajudaAberta ? 'expand_less' : 'expand_more'} size={20} tone="muted" />
        {isPt ? 'Atalhos' : 'Shortcuts'}
      </button>
      {ajudaAberta && (
        <p style={{ ...sm2Hint, marginTop: 6 }}>{quickAddHint(isPt ? 'pt-BR' : 'en')}</p>
      )}
    </div>
  );
}
