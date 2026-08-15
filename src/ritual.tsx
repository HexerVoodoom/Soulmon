// ---------------------------------------------------------------------------
// PÁGINA TEMPORÁRIA DE REVISÃO — não é parte do app. Ver `ritual.html`.
//
// Monta o ritual do oráculo direto, em `mode='upgrade'` (que é o modo que já
// existe para quem compra o desbloqueio dentro do jogo: pula a intro, o caminho
// demo e o cadastro, e termina no reveal). Nada aqui é código novo de produto —
// é o MESMO componente que o app usa, só alcançado por outra porta.
//
// Remover antes do merge em `main`.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { SoulmonOnboarding } from './components/SoulmonOnboarding';
import { STORAGE_KEYS } from './utils/storageKeys';
import { readLocal, writeLocal } from './utils/safeStorage';
import { resolveLanguage } from './utils/i18n';
import type { OracleResult } from './utils/oracle';
import './index.css';

function Revisao() {
  const [lang, setLang] = useState(() => resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE)));
  const [result, setResult] = useState<OracleResult | null>(null);
  const [round, setRound] = useState(0);
  const isPt = lang === 'pt-BR';

  const trocarIdioma = (next: 'pt-BR' | 'en-US') => {
    writeLocal(STORAGE_KEYS.LANGUAGE, next);
    setLang(next);
    setResult(null);
    setRound(r => r + 1); // remonta o ritual no idioma novo
  };

  if (result) {
    return (
      <div className="sm-app-bg" style={{
        position: 'fixed', inset: 0, overflowY: 'auto', color: 'var(--sm-ink)',
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: 440, padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--sm-muted)', letterSpacing: 2, fontWeight: 700 }}>
            {isPt ? 'FIM DO RITUAL' : 'END OF RITUAL'}
          </div>
          <h1 style={{ fontSize: 34, margin: '10px 0 8px', fontWeight: 800 }}>{result.creature.baseName}</h1>
          <div className="sm-card" style={{ padding: '18px 16px', margin: '18px 0', textAlign: 'left' }}>
            <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              {isPt ? result.creature.bio.pt : result.creature.bio.en}
            </p>
          </div>
          <p style={{ fontSize: 12, color: 'var(--sm-muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
            {isPt
              ? 'No app, daqui a pessoa cairia no cadastro e no jogo. Esta página para aqui — nada foi salvo em nuvem.'
              : 'In the app, from here you would go to sign-up and the game. This page stops here — nothing was saved to the cloud.'}
          </p>
          <button className="sm-btn" style={{ width: '100%' }}
            onClick={() => { setResult(null); setRound(r => r + 1); }}>
            {isPt ? 'Fazer de novo' : 'Run it again'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Seletor de idioma: a regra do app é que todo texto exista em PT e EN,
          e esta página existe para conferir justamente isso. */}
      <div style={{
        position: 'fixed', top: 8, right: 8, zIndex: 9999, display: 'flex', gap: 6,
      }}>
        {(['pt-BR', 'en-US'] as const).map(code => (
          <button
            key={code}
            onClick={() => trocarIdioma(code)}
            style={{
              fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid var(--sm-line)',
              background: lang === code ? 'var(--sm-primary)' : 'var(--sm-surface)',
              color: lang === code ? '#fff' : 'var(--sm-muted)',
            }}
          >
            {code === 'pt-BR' ? 'PT' : 'EN'}
          </button>
        ))}
      </div>
      <SoulmonOnboarding
        key={round}
        mode="upgrade"
        onComplete={() => {}}
        onRevealed={setResult}
        onCancel={() => setRound(r => r + 1)}
      />
      <Toaster />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<Revisao />);
