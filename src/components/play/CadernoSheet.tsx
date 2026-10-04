import { useMemo, useState, type CSSProperties } from 'react';
import { Field, Segment, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { InfoTip } from '../ui/InfoTip';
import { Icon } from '../ui/Icon';
import { SupportNote } from '../refugio/SupportNote';
import { sheetCard, sheetCardList } from '../nav/sheetKit';
import type { Language } from '../../utils/i18n';
import {
  CADERNO_FORMATOS, MAX_CHARS, addEntry, clearAll, formatoDoDia, loadEntries, removeEntry, saveEntries,
  sinaisDeSofrimento, type CadernoFormato,
} from '../../utils/cadernoLocal';

/**
 * A FOLHA DO CADERNO (04/10/2026, `docs/PLANO-OFICINA-FOCO.md` §3) — a missão de journaling.
 *
 * PRIVADA: o texto fica só neste aparelho (`utils/cadernoLocal.ts`), nunca vai a servidor, IA
 * ou chat, e se apaga por entrada ou por inteiro. Nada aqui conta, pontua ou lembra: sem
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

export function CadernoSheet({ language, todayKey }: { language: Language; todayKey?: string }) {
  const isPt = language === 'pt-BR';
  const day = todayKey ?? fallbackDay();
  const [formato, setFormato] = useState<CadernoFormato>(() => formatoDoDia(day));
  const [linhas, setLinhas] = useState(['', '', '']);
  const [texto, setTexto] = useState('');
  const [entries, setEntries] = useState(() => loadEntries());
  const [aviso, setAviso] = useState<'ok' | 'erro' | null>(null);
  const [confirmaApagar, setConfirmaApagar] = useState(false);
  const [sinalSalvo, setSinalSalvo] = useState(false);

  const rascunho = formato === 'tres-coisas' ? linhas.filter(l => l.trim()).join('\n') : texto;
  const sofrimento = useMemo(() => sinaisDeSofrimento(rascunho), [rascunho]);
  const mostraApoio = sofrimento || sinalSalvo;

  const mudou = () => { setAviso(null); setSinalSalvo(false); };
  const guardar = () => {
    if (!rascunho.trim()) return;
    const next = addEntry(entries, day, formato, rascunho, Date.now());
    if (next === entries || !saveEntries(next)) { setAviso('erro'); return; }
    setEntries(next); setSinalSalvo(sofrimento);
    setLinhas(['', '', '']); setTexto(''); setAviso('ok');
  };
  const apagar = (id: string) => { const next = removeEntry(entries, id); setEntries(next); saveEntries(next); };
  const apagarTudo = () => { clearAll(); setEntries([]); setConfirmaApagar(false); setAviso(null); };

  return (
    <div data-caderno style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ ...sectionHead, flex: 1 }}>{isPt ? 'Escrever hoje' : 'Write today'}</p>
        <InfoTip language={language} align="right" label={isPt ? 'Onde fica o que você escreve' : 'Where your writing lives'}>
          {isPt
            ? 'O que você escreve aqui fica só neste aparelho. Não vai para o servidor, nem para a IA, nem para o chat, e não entra no seu save: quem usar outro aparelho ou limpar o navegador não o leva junto. Você apaga uma entrada ou tudo, quando quiser. Nada aqui conta, pontua ou lembra. Escrever sobre algo difícil pode remexer coisas: pare quando quiser. Isto não substitui ajuda profissional.'
            : 'What you write here stays on this device only. It does not go to the server, the AI or the chat, and it is not part of your save: switching devices or clearing the browser leaves it behind. You can delete one entry or everything, any time. Nothing here counts, scores or reminds. Writing about something hard can stir things up: stop whenever you like. This does not replace professional help.'}
        </InfoTip>
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
        {aviso === 'ok' && <p role="status" data-caderno-ok style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Guardado neste aparelho.' : 'Saved on this device.'}</p>}
        {aviso === 'erro' && (
          <p role="alert" data-caderno-erro style={{ ...sm2Hint, margin: 0, color: 'var(--sm2-gold-ink)' }}>
            {isPt ? 'Não deu para guardar: o aparelho está sem espaço ou bloqueou o armazenamento. O texto continua aqui.' : 'Could not save: the device is out of space or blocked storage. Your text is still here.'}
          </p>
        )}
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
          <p style={sectionHead}>{isPt ? 'Suas anotações' : 'Your notes'}</p>
          <ul style={sheetCardList} data-caderno-lista>
            {entries.slice(0, 20).map(e => (
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
