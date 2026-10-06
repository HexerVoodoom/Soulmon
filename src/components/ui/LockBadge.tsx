import type { CSSProperties } from 'react';
import type { Language } from '../../utils/i18n';

/**
 * O CADEADO dos prédios trancados (Tarefa A, prédios por Vínculo) — procedural, sem emoji e sem arte nova.
 *
 * A forma (arco + corpo + buraco da chave) carrega o significado sozinha: não depende de cor. O Vínculo
 * pedido vai escrito ao lado ("Vínculo 5" / "Bond 5"), então nem o cadeado nem o número dependem de
 * contraste de cor para serem lidos. Sem animação (movimento reduzido já respeitado por construção).
 * O chip repete a paleta fixa dos rótulos dos lotes (fundo escuro translúcido sobre a arte da cena).
 */
export function lockLabel(minBond: number, language: Language | string): string {
  return language === 'pt-BR' ? `Bloqueado, libera no Vínculo ${minBond}` : `Locked, opens at Bond ${minBond}`;
}

export function LockGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false" data-lock-glyph style={{ display: 'block', flex: 'none' }}>
      <path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="2.5" y="7" width="11" height="7.5" rx="1.6" fill="currentColor" />
      <circle cx="8" cy="10.2" r="1.2" fill="#08191a" />
      <rect x="7.4" y="10.6" width="1.2" height="2.2" rx=".5" fill="#08191a" />
    </svg>
  );
}

/** O chip "cadeado + Vínculo N". Só decoração para o leitor de tela: quem anuncia é o botão do prédio. */
export function LockBadge({ minBond, language, style }: { minBond: number; language: Language | string; style?: CSSProperties }) {
  const isPt = language === 'pt-BR';
  return (
    <span
      data-lock-badge={minBond}
      aria-hidden="true"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 999,
        background: 'rgba(8,25,26,.9)', border: '1px solid rgba(233,245,242,.55)',
        color: '#E9F5F2', fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-xs)', fontWeight: 800,
        letterSpacing: '0.04em', whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <LockGlyph size={14} />
      {isPt ? `Vínculo ${minBond}` : `Bond ${minBond}`}
    </span>
  );
}

/** O aviso neutro de um prédio trancado: `role="status"`, fica na tela até outro toque ou o fim do tempo. */
export function LockNotice({ text }: { text: string }) {
  return (
    <p
      role="status"
      data-lock-notice
      style={{
        position: 'absolute', left: '50%', bottom: 'calc(var(--sm2-space-6, 24px) + env(safe-area-inset-bottom, 0px))',
        transform: 'translateX(-50%)', zIndex: 5, margin: 0, width: 'min(88%, 360px)', boxSizing: 'border-box',
        padding: '10px 14px', borderRadius: 'var(--sm2-radius-md)', textAlign: 'center',
        background: 'rgba(8,25,26,.94)', border: '1px solid rgba(95,243,224,.4)', color: '#E9F5F2',
        fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)', pointerEvents: 'none',
      }}
    >
      {text}
    </p>
  );
}
