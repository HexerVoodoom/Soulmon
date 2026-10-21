import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';
import {
  listarCopiasDoAparelho, lerArquivoDeBackup, restaurarCopia,
  resumoDaCopia, origemDaCopia, dataDaCopia,
  type CopiaDoAparelho, type ResultadoRestauracao,
} from '../utils/backupRestore';

/**
 * RESTAURAR BACKUP (L08-04) — dentro de "Seus dados".
 *
 * Lista as cópias que o aparelho guarda e deixa importar o arquivo exportado.
 * Cada cópia mostra data, "Nome · Estágio" e a origem em palavras — nunca XP,
 * porcentagem ou contagem (a pessoa reconhece pelo bichinho, não por número).
 * Restaurar pede confirmação clara e, por baixo, guarda o que há agora como
 * cópia: dá para voltar aqui. Voz calma, sem cobrança, erro sem culpa.
 */
interface RestoreBackupSectionProps {
  language: Language;
  /** Injeção para teste; em produção recarrega a página. */
  reload?: () => void;
}

const stackStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 };

function Panel({ children }: { children: ReactNode }) {
  return <div className="sm2-conta-panel">{children}</div>;
}

type Phase = 'closed' | 'open' | 'confirm' | 'working';

export function RestoreBackupSection({ language, reload }: RestoreBackupSectionProps) {
  const isPt = language === 'pt-BR';
  const [phase, setPhase] = useState<Phase>('closed');
  const [copias, setCopias] = useState<CopiaDoAparelho[]>([]);
  const [escolhida, setEscolhida] = useState<CopiaDoAparelho | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const abrir = () => {
    setCopias(listarCopiasDoAparelho());
    setErro(null);
    setEscolhida(null);
    setPhase('open');
  };

  const fechar = () => { setPhase('closed'); setEscolhida(null); setErro(null); };

  const aoEscolherArquivo = async (file: File | undefined) => {
    if (!file) return;
    setErro(null);
    let texto = '';
    try { texto = await file.text(); } catch { /* arquivo ilegível cai no erro abaixo */ }
    const r = lerArquivoDeBackup(texto);
    if (!r.ok) {
      setErro(isPt
        ? 'Não reconhecemos este arquivo. Use o arquivo que o Soulmon baixou em “Baixar meus dados” ou no backup. Nada foi alterado.'
        : 'We did not recognize this file. Use the file Soulmon downloaded from “Download my data” or from a backup. Nothing changed.');
      return;
    }
    setEscolhida(r.copia);
    setPhase('confirm');
  };

  const mensagemDeFalha = (r: ResultadoRestauracao): string => {
    if (r === 'sem-copia' || r === 'storage') {
      return isPt
        ? 'Não há espaço neste aparelho para guardar o que você tem agora. Nada foi alterado. Libere espaço e tente de novo.'
        : 'There is no room on this device to keep what you have now. Nothing changed. Free up space and try again.';
    }
    return isPt
      ? 'Não conseguimos usar esta cópia. Nada foi alterado.'
      : 'We could not use this copy. Nothing changed.';
  };

  const confirmar = async () => {
    if (!escolhida) return;
    setPhase('working');
    const r = await restaurarCopia(escolhida.state);
    if (r === 'ok') {
      try { (reload ?? (() => globalThis.location?.reload()))(); } catch { /* sem window */ }
      return;
    }
    setErro(mensagemDeFalha(r));
    setPhase('open');
  };

  return (
    <div style={stackStyle}>
      {phase === 'closed' && (
        <button type="button" onClick={abrir} style={{ ...sm2Button('outline'), width: '100%' }}>
          {isPt ? 'Restaurar backup' : 'Restore a backup'}
        </button>
      )}

      {phase !== 'closed' && (
        <Panel>
          <p style={{ ...sm2Text, fontWeight: 500 }}>{isPt ? 'Restaurar backup' : 'Restore a backup'}</p>

          {(phase === 'open' || (phase === 'working' && !escolhida)) && (
            <>
              {copias.length === 0 ? (
                <p style={sm2Hint}>{isPt ? 'Ainda não há cópias neste aparelho.' : 'No copies on this device yet.'}</p>
              ) : (
                <ul style={{ ...stackStyle, listStyle: 'none', margin: 0, padding: 0 }}>
                  {copias.map(c => {
                    const data = dataDaCopia(c.salvoEm, isPt);
                    return (
                      <li key={c.id} style={stackStyle}>
                        <p style={{ ...sm2Text, fontWeight: 500 }}>{resumoDaCopia(c.state, isPt)}</p>
                        <p style={sm2Hint}>{data ? `${data} · ` : ''}{origemDaCopia(c, isPt)}</p>
                        <button
                          type="button"
                          onClick={() => { setEscolhida(c); setErro(null); setPhase('confirm'); }}
                          aria-label={`${isPt ? 'Escolher esta cópia' : 'Choose this copy'}: ${resumoDaCopia(c.state, isPt)}${data ? `, ${data}` : ''}`}
                          style={{ ...sm2Button('outline'), width: '100%' }}
                        >
                          {isPt ? 'Escolher' : 'Choose'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                data-testid="restore-file-input"
                aria-label={isPt ? 'Arquivo de backup' : 'Backup file'}
                onChange={e => { void aoEscolherArquivo(e.target.files?.[0]); e.target.value = ''; }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                <button type="button" onClick={() => fileRef.current?.click()} style={{ ...sm2Button('outline'), width: '100%' }}>
                  {isPt ? 'Importar arquivo' : 'Import file'}
                </button>
                <button type="button" onClick={fechar} style={{ ...sm2Button('quiet'), width: '100%' }}>
                  {isPt ? 'Fechar' : 'Close'}
                </button>
              </div>
            </>
          )}

          {(phase === 'confirm' || (phase === 'working' && escolhida)) && escolhida && (
            <>
              <p style={sm2Text}>{resumoDaCopia(escolhida.state, isPt)}</p>
              <p style={sm2Hint}>
                {[dataDaCopia(escolhida.salvoEm, isPt), origemDaCopia(escolhida, isPt)].filter(Boolean).join(' · ')}
              </p>
              <p role="alertdialog" aria-label={isPt ? 'Confirmar restauração' : 'Confirm restore'} style={sm2Text}>
                {isPt
                  ? 'Restaurar esta cópia? O que você tem agora fica guardado antes como cópia, e dá para voltar aqui.'
                  : 'Restore this copy? What you have now is saved as a copy first, and you can bring it back here.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => { void confirmar(); }}
                  disabled={phase === 'working'}
                  autoFocus
                  style={{ ...sm2Button('outline', phase === 'working'), width: '100%' }}
                >
                  {phase === 'working' ? (isPt ? 'Restaurando…' : 'Restoring…') : (isPt ? 'Restaurar' : 'Restore')}
                </button>
                <button
                  type="button"
                  onClick={() => { setEscolhida(null); setPhase('open'); }}
                  disabled={phase === 'working'}
                  style={{ ...sm2Button('quiet'), width: '100%' }}
                >
                  {isPt ? 'Cancelar' : 'Cancel'}
                </button>
              </div>
            </>
          )}
        </Panel>
      )}

      <div aria-live="polite" style={stackStyle}>
        {erro && <p style={sm2Hint}>{erro}</p>}
      </div>
    </div>
  );
}
