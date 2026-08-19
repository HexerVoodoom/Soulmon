import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import type { Language } from '../../utils/i18n';

/**
 * `OfflineSeal` — o selo de "sem sinal".
 *
 * O Soulmon é PWA e APK, e até agora **nenhuma das superfícies do app sabia
 * que estava offline**: falha de rede era silêncio, e o usuário lia isso como
 * "o app quebrou". Um selo montado uma vez, no topo do `App`, cobre TODAS as
 * telas sem redesenhar nenhuma — é a peça de identidade mais barata do plano.
 *
 * Escolhas:
 *  · linguagem de APARELHO: Silkscreen em caixa alta ≥14px (é um selo, que é
 *    o segundo lugar onde a bitmap é permitida) sobre superfície `--sm2-*`;
 *  · `cloud_off` e não `wifi_off`: o que falha aqui é o SAVE na nuvem e a
 *    resposta da IA, não a antena. Os dois estão no inventário de ícones;
 *  · **não bloqueia nada**. O jogo inteiro roda local; ficar offline não é
 *    erro, é um modo. Por isso é um selo discreto no topo, e não um modal;
 *  · `role="status"` + `aria-live="polite"`: o leitor de tela anuncia a
 *    mudança sem sequestrar o foco;
 *  · EN + PT-BR;
 *  · sem classe utilitária de valor arbitrário (footgun 1) — layout inline.
 */

export interface OfflineSealProps {
  language?: Language;
  /**
   * Distância do topo. O `App` pode empurrar o selo para baixo de uma barra
   * de status/notch sem que este componente saiba o que existe lá em cima.
   */
  topOffset?: number;
}

/**
 * `navigator.onLine` só é confiável no NEGATIVO (false = sem interface de
 * rede). É exatamente o caso que interessa: não prometemos "online", só
 * avisamos quando o aparelho declara que não há rede.
 */
function readOnline(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean') return true;
  return navigator.onLine;
}

export function useIsOnline(): boolean {
  const [online, setOnline] = useState<boolean>(readOnline);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    // Estado pode ter mudado entre o primeiro render e o efeito.
    setOnline(readOnline());
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}

export function OfflineSeal({ language = 'en-US', topOffset = 0 }: OfflineSealProps) {
  const online = useIsOnline();
  const pt = language === 'pt-BR';

  if (online) return null;

  const text = pt ? 'SEM SINAL' : 'NO SIGNAL';
  const full = pt
    ? 'Sem sinal — o Soulmon continua funcionando offline'
    : 'No signal — Soulmon keeps working offline';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={full}
      title={full}
      style={{
        position: 'fixed',
        top: `calc(env(safe-area-inset-top, 0px) + ${topOffset}px)`,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 999,
        // Superfície + linha do tema: legível nos dois, sem cor crua.
        background: 'var(--sm2-surface-2)',
        border: '1px solid var(--sm2-line)',
        boxShadow: '0 2px 10px rgba(0,0,0,.18)',
        // Selo não intercepta toque: ele informa, não age.
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      <Icon name="cloud_off" size={20} tone="gold" />
      <span
        style={{
          fontFamily: 'var(--sm2-font-pixel)',
          // Piso da Silkscreen é 14px: abaixo disso o bitmap fecha os
          // contornos e os acentos viram borrão.
          fontSize: 14,
          lineHeight: 1.2,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: 'var(--sm2-gold-ink)',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
    </div>
  );
}

export default OfflineSeal;
