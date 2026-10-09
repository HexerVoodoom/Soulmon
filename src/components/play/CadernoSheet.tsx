import { useMemo, useState, type CSSProperties } from 'react';
import { Field, Segment, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { ModalInfo } from '../ui/InfoTip';
import { Icon } from '../ui/Icon';
import { SupportNote } from '../refugio/SupportNote';
import { sheetCard, sheetCardList } from '../nav/sheetKit';
import type { Language } from '../../utils/i18n';
import {
  CADERNO_FORMATOS, MAX_CHARS, addEntry, formatoDoDia, removeEntry, sinaisDeSofrimento,
  type CadernoEntry, type CadernoFormato,
} from '../../utils/cadernoLocal';

/**
 * A FOLHA DO CADERNO (04/10/2026, `docs/PLANO-OFICINA-FOCO.md` §3) — a missão de journaling.
 *
 * SENSÍVEL: o texto mora em `GameState.caderno` (save na nuvem do próprio titular, decisão do dono
 * de 04/10/2026), nunca vai a IA, chat, telemetria ou outras pessoas, e se apaga por entrada ou
 * por inteiro. A folha escreve por funções PURAS de `utils/cadernoSave` entregues ao `App`. Nada aqui conta, pontua ou lembra: sem
 * sequência, sem total, sem "hoje você ainda não escreveu". O formato do dia é só uma
 * sugestão; a pessoa troca. Se o rascunho sugerir sofrimento (o léxico do chat, calculado
 * aqui no aparelho), aparece a linha de apoio — sem bloquear nada.
 */
const sectionHead: CSSProperties = {
  ...sm2Hint, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--sm2-gold-ink)', fontWeight: 600, fontSize: 'var(--sm2-text-xs)',
};

const FORMATO: Record<CadernoFormato, { pt: string; en: string; askPt: string; askEn: string }> = {
  'tres-coisas': { pt: '3 coisas boas', en: '3 good things', askPt: 'Três coisas boas de hoje', askEn: 'Three good things from today' },
  gratidao: { pt: 'Gratidão', en: 'Gratitude', askPt: 'Algo pelo que você é grato hoje', askEn: 'Something you are grateful for today' },
  aprendi: { pt: 'O que aprendi', en: 'What I learned', askPt: 'Algo que você aprendeu hoje', askEn: 'Something you learned today' },
  livre: { pt: 'Escrita livre', en: 'Free writing', askPt: 'Escreva à vontade, uns 3 minutos', askEn: 'Write freely, about 3 minutes' },
};

const fallbackDay = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const areaStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', minHeight: 120, padding: '10px 12px', resize: 'vertical',
  borderRadius: 'var(--sm2-radius-md)', border: '1px solid var(--sm2-muted)',
  backgroundColor: 'var(--sm2-surface-2)', color: 'var(--sm2-ink)',
  fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-md)', lineHeight: 'var(--sm2-leading-body)',
};

export function CadernoSheet({ language, todayKey, entries, onChange }: {
  language: Language; todayKey?: string;
  entries: CadernoEntry[];
  onChange: (f: (c: CadernoEntry[]) => CadernoEntry[]) => void;
}) {
  const isPt = language === 'pt-BR';
  const day = todayKey ?? fallbackDay();
  const [formato, setFormato] = useState<CadernoFormato>(() => formatoDoDia(day));
  const [linhas, setLinhas] = useState(['', '', '']);
  const [texto, setTexto] = useState('');
  const [aviso, setAviso] = useState<'ok' | null>(null);
  const [confirmaApagar, setConfirmaApagar] = useState(false);
  const [sinalSalvo, setSinalSalvo] = useState(false);
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [diaFiltro, setDiaFiltro] = useState('all');

  const rascunho = formato === 'tres-coisas' ? linhas.filter(l => l.trim()).join('\n') : texto;
  const sofrimento = useMemo(() => sinaisDeSofrimento(rascunho), [rascunho]);
  const mostraApoio = sofrimento || sinalSalvo;

  const mudou = () => { setAviso(null); setSinalSalvo(false); };
  const guardar = () => {
    if (!rascunho.trim()) return;
    const at = Date.now(), texto0 = rascunho;
    onChange(c => addEntry(c, day, formato, texto0, at));
    setSinalSalvo(sofrimento);
    setLinhas(['', '', '']); setTexto(''); setAviso('ok');
  };
  const apagar = (id: string) => onChange(c => removeEntry(c, id));
  const apagarTudo = () => { onChange(() => []); setConfirmaApagar(false); setAviso(null); };

  return (
    <div data-caderno style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ ...sectionHead, flex: 1 }}>{isPt ? 'Escrever hoje' : 'Write today'}</p>
        <ModalInfo language={language} align="right" label={isPt ? 'Onde fica o que você escreve' : 'Where your writing lives'}>
          {isPt
            ? 'O que você escreve aqui fica no seu save, na nuvem, só seu. Nenhuma IA lê, o chat não vê e outras pessoas não têm acesso. Você apaga uma entrada ou tudo, quando quiser, e apagar a conta apaga o Caderno. Nada aqui conta, pontua ou lembra. Escrever sobre algo difícil pode remexer coisas: pare quando quiser. Isto não substitui ajuda profissional.'
            : 'What you write here lives in your save, in the cloud, yours alone. No AI reads it, the chat cannot see it and other people have no access. You can delete one entry or everything any time, and deleting your account deletes the Journal. Nothing here counts, scores or reminds. Writing about something hard can stir things up: stop whenever you like. This does not replace professional help.'}
        </ModalInfo>
      </div>

      <div role="radiogroup" aria-label={isPt ? 'Formato' : 'Format'} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {CADERNO_FORMATOS.map(f => (
          <Segment key={f} selected={formato === f} onSelect={() => { setFormato(f); mudou(); }} label={isPt ? FORMATO[f].pt : FORMATO[f].en} />
        ))}
      </div>

      <div data-caderno-form style={{ ...sheetCard }}>
        <label htmlFor="caderno-campo-0" style={{ ...sm2Text, fontWeight: 600 }}>
          {isPt ? FORMATO[formato].askPt : FORMATO[formato].askEn}
        </label>
        {formato === 'tres-coisas'
          ? linhas.map((v, i) => (
            <Field
              key={i} id={`caderno-campo-${i}`} value={v} maxLength={300} autoComplete="off"
              placeholder={`${i + 1}.`}
              aria-label={`${isPt ? 'Coisa boa' : 'Good thing'} ${i + 1}`}
              onChange={e => { const n = [...linhas]; n[i] = e.target.value; setLinhas(n); mudou(); }}
            />
          ))
          : (
            <textarea
              id="caderno-campo-0" data-caderno-texto value={texto} maxLength={MAX_CHARS}
              onChange={e => { setTexto(e.target.value); mudou(); }}
              style={areaStyle}
            />
          )}
        <button type="button" data-caderno-guardar disabled={!rascunho.trim()} onClick={guardar} style={sm2Button('primary', !rascunho.trim())}>
          {isPt ? 'Guardar' : 'Save'}
        </button>
        {aviso === 'ok' && <p role="status" data-caderno-ok style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Guardado no seu save.' : 'Saved to your save.'}</p>}
      </div>

      {mostraApoio && (
        <div data-caderno-apoio style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ ...sm2Text, margin: 0 }}>
            {isPt ? 'Parece um dia pesado. Você não precisa passar por isso sozinho.' : 'This sounds like a heavy day. You do not have to go through it alone.'}
          </p>
          <SupportNote isPt={isPt} />
        </div>
      )}

      {entries.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <p style={{ ...sectionHead, flex: 1 }}>{isPt ? 'Suas anotações' : 'Your notes'}</p>
            {new Set(entries.map(e => e.day)).size > 1 && <label style={{ ...sm2Hint, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{isPt ? 'Dia' : 'Day'}</span>
              <select aria-label={isPt ? 'Filtrar por dia' : 'Filter by day'} value={diaFiltro} onChange={e => { setDiaFiltro(e.target.value); setMostrarTodas(true); }} style={{ minHeight: 40, maxWidth: 180, color: 'var(--sm2-ink)', background: 'var(--sm2-surface)', border: '1px solid var(--sm2-border)', borderRadius: 8, padding: '0 8px' }}>
                <option value="all">{isPt ? 'Todos os dias' : 'All days'}</option>
                {[...new Set(entries.map(e => e.day))].sort((a, b) => b.localeCompare(a)).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>}
          </div>
          {(() => {
            const filtradas = diaFiltro === 'all' ? entries : entries.filter(e => e.day === diaFiltro);
            const visiveis = mostrarTodas ? filtradas : filtradas.slice(0, 3);
            return <>
          <ul style={sheetCardList} data-caderno-lista>
            {visiveis.map(e => (
              <li key={e.id} data-caderno-entrada style={{ ...sheetCard, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                  <span style={{ ...sm2Hint, margin: 0 }}>
                    {e.day} · {isPt ? FORMATO[e.formato].pt : FORMATO[e.formato].en}
                  </span>
                  <span style={{ ...sm2Text, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{e.text}</span>
                </span>
                <button
                  type="button" data-caderno-apagar={e.id} onClick={() => apagar(e.id)}
                  aria-label={isPt ? 'Apagar esta anotação' : 'Delete this note'} title={isPt ? 'Apagar esta anotação' : 'Delete this note'}
                  style={{ width: 44, height: 44, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--sm2-muted)' }}
                >
                  <Icon name="delete" size={20} tone="inherit" />
                </button>
              </li>
            ))}
          </ul>
          {filtradas.length > 3 && <button type="button" data-caderno-ver-todas onClick={() => setMostrarTodas(v => !v)} style={sm2Button('quiet')}>
            {mostrarTodas ? (isPt ? 'Mostrar menos' : 'Show fewer') : (isPt ? 'Ver todas' : 'View all')}
          </button>}
            </>;
          })()}
          {!confirmaApagar
            ? <button type="button" data-caderno-apagar-tudo onClick={() => setConfirmaApagar(true)} style={sm2Button('quiet')}>{isPt ? 'Apagar tudo' : 'Delete everything'}</button>
            : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" data-caderno-apagar-confirma onClick={apagarTudo} style={{ ...sm2Button('outline'), flex: 1 }}>{isPt ? 'Apagar tudo mesmo' : 'Delete everything for real'}</button>
                <button type="button" onClick={() => setConfirmaApagar(false)} style={{ ...sm2Button('ghost'), flex: 1 }}>{isPt ? 'Voltar' : 'Back'}</button>
              </div>
            )}
        </>
      )}
    </div>
  );
}
