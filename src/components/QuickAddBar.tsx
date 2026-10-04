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
import { InfoTip } from './ui/InfoTip';
import { Field, sm2Text } from './form/FormKit';
import { sm2Tag } from './TaskMeta';
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
          /* ÍCONE PELADO (regra do dono; canvas Home, achado 12): `add` 24 em
             ciano, alvo 48, sem caixa — era uma placa `primary-fill` em volta
             do glifo. Inativo = `muted`, nunca opacidade. */
          style={{
            minWidth: 48, minHeight: 48, borderRadius: 'var(--sm2-radius-md)',
            cursor: podeGravar ? 'pointer' : 'default',
            border: 'none', background: 'none', padding: 0,
            color: podeGravar ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon name="add" size={24} tone={podeGravar ? 'primary' : 'muted'} />
        </button>
      </div>

      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {/* Chip de etiqueta 24 em `primary-ink` (canvas `CapturaRapida`):
              o que o parser entendeu, na cor do acento. */}
          {chips.map(c => (
            <span key={c} style={{ ...sm2Tag, color: 'var(--sm2-primary-ink)' }}>
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Texto comum em `ink` (canvas): a recusa é informação, não erro —
          vermelho é a cor da cobrança e não entra aqui. */}
      {recusado && (
        <p role="alert" style={{ ...sm2Text, marginTop: 8 }}>
          {isPt
            ? 'Não coube agora — você chegou ao limite de itens.'
            : "That didn't fit — you've reached your item limit."}
        </p>
      )}

      {/* A ajuda é RECOLHIDA: a sintaxe é bônus para quem quiser, e uma legenda
          permanente de tokens transforma uma caixa de texto simples numa
          interface que parece exigir estudo. O texto vem de `quickAddHint`,
          que já é o dono dessa frase no `CreateModal` — duas listas de atalhos
          divergiriam em silêncio na primeira mudança do parser.
          I13 (02/10/2026): o disclosure "Atalhos ▾" virou o `InfoTip` padrão. */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <InfoTip language={language} label={isPt ? 'Atalhos' : 'Shortcuts'} align="right">
          {quickAddHint(isPt ? 'pt-BR' : 'en')}
        </InfoTip>
      </div>
    </div>
  );
}
