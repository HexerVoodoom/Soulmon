import { useEffect, useRef } from 'react';
import type { Language } from '../utils/i18n';

/** Quanto o balão fica na tela sozinho. */
export const NOTICE_TOAST_MS = 8000;

/**
 * Os avisos AÇIONÁVEIS que ganham balão agora que o botão Avisos some da Home (dono, 14/10/2026, REGISTRO §56). Na ordem de
 * importância: o aviso de termos, a triagem e o recomeço. Os balões de convite do pet (refeição e Refúgio, "seu Soulmon tem algo pra você") saíram em 18/10/2026 (dono, checklist B10). HP e incubação NÃO estão
 * aqui: já têm canal próprio (o HUD e o visor). Os informativos sem ação (carga, marco do Bosque, semanal, priming) ficam sem canal.
 */
export const NOTICE_TOAST_KEYS = ['termos', 'triagem', 'recomeco'] as const;
export type NoticeToastKey = (typeof NOTICE_TOAST_KEYS)[number];

/** Os avisos que o balão mostra UMA ÚNICA vez na vida (dono, 14/10/2026, REGISTRO §56): o dos termos. Os convites seguem 1×/dia. */
export const NOTICE_ONCE_KEYS: readonly NoticeToastKey[] = ['termos'];

/** O primeiro aviso acionável ainda NÃO visto (na ordem de importância), ou `null`. `vistos` = hoje; `paraSempre` = os de uma vez só. Puro. */
export function pickNoticeKey(presentes: readonly string[], vistos: readonly string[], paraSempre: readonly string[] = []): NoticeToastKey | null {
  return NOTICE_TOAST_KEYS.find(k => presentes.includes(k) && !vistos.includes(k) && !paraSempre.includes(k)) ?? null;
}

/** `<dia>|<chave>,<chave>` → as chaves vistas NESTE dia (outro dia ou lixo = nenhuma). Puro. */
export function parseNoticeSeen(raw: string | null | undefined, dia: string): string[] {
  const [d, ks] = (raw ?? '').split('|');
  return d === dia && ks ? ks.split(',') : [];
}

/** O que gravar ao MOSTRAR `key`: o registro do dia (todas as chaves) e, se for de uma vez só, o registro para sempre. Puro. */
export function recordNoticeShown(rawDia: string | null | undefined, rawSempre: string | null | undefined, dia: string, key: NoticeToastKey): { dia: string; sempre: string } {
  const sempre = (rawSempre ?? '').split(',').filter(Boolean);
  return {
    dia: `${dia}|${[...parseNoticeSeen(rawDia, dia), key].join(',')}`,
    sempre: (NOTICE_ONCE_KEYS.includes(key) && !sempre.includes(key) ? [...sempre, key] : sempre).join(','),
  };
}

export function noticeToastText(key: NoticeToastKey, language: Language): string {
  const isPt = language === 'pt-BR';
  switch (key) {
    case 'termos': return isPt ? 'Os Termos foram atualizados. Toque para ler o aviso.' : 'The Terms were updated. Tap to read the notice.';
    case 'triagem': return isPt ? 'Há tarefas esperando uma olhada. Toque para ver.' : 'Some tasks are waiting for a look. Tap to see.';
    case 'recomeco': return isPt ? 'Vamos recomeçar com calma? Toque para ver.' : 'Shall we start fresh, gently? Tap to see.';
  }
}

/**
 * BALÃOZINHO de aviso: NÃO é modal (sem foco, sem véu). Some sozinho em 8 s; o toque abre a folha de Avisos (que segue existindo,
 * só sem o botão na Home). Cada aviso aparece UMA vez por dia (o "visto" é gravado ao MOSTRAR, em `App`). Sem número, sem som.
 */
export function NoticeToast({ noticeKey, language, onOpen, onDone }: { noticeKey: NoticeToastKey; language: Language; onOpen: () => void; onDone: () => void }) {
  // `onDone` costuma ser uma arrow inline do pai (identidade nova a cada render): fora das deps, para o re-render do App não reiniciar o tempo.
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    const t = setTimeout(() => doneRef.current(), NOTICE_TOAST_MS);
    return () => clearTimeout(t);
  }, []);
  return (
    <button
      type="button"
      role="status"
      data-notice-toast={noticeKey}
      onClick={() => { onDone(); onOpen(); }}
      style={{
        position: 'fixed', zIndex: 150, left: '50%', transform: 'translateX(-50%)',
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)', maxWidth: 'min(92vw, 420px)', minHeight: 44,
        padding: '10px 16px', boxSizing: 'border-box', cursor: 'pointer',
        background: 'rgba(15,42,41,.96)', color: '#E9F5F2',
        border: '2px solid var(--sm2-gold-fill)', borderRadius: 16,
        boxShadow: '0 6px 18px rgba(0,0,0,.45)',
        font: '500 14px/1.35 var(--sm2-font-text)', textAlign: 'center',
      }}
    >
      {noticeToastText(noticeKey, language)}
    </button>
  );
}
