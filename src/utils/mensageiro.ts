/**
 * O MENSAGEIRO (NPC 440, Papus; §241): o crédito das cartas no save. Puro. A fila mora no servidor (`functions/api/_mensageiro.js`);
 * `mailClaimed` guarda o que já foi creditado, então a mesma carta entregue de novo não paga duas vezes.
 */
export interface MailItem { mid: string; bodyPt: string; bodyEn: string; bits: number; emblems: number }
export interface MailState { gamePoints?: number; emblems?: number; mailClaimed?: string[] }

const CLAIMED_MAX = 100;

/** Lixo → `undefined`. */
export function sanitizeMailClaimed(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const ids = [...new Set(raw.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 80))].slice(-CLAIMED_MAX);
  return ids.length ? ids : undefined;
}

/** Idempotente: carta já creditada devolve a MESMA referência. */
export function applyMail<T extends MailState>(prev: T, mail: MailItem): T {
  if (prev.mailClaimed?.includes(mail.mid)) return prev;
  return {
    ...prev,
    gamePoints: (prev.gamePoints ?? 0) + Math.max(0, mail.bits),
    emblems: (prev.emblems ?? 0) + Math.max(0, mail.emblems),
    mailClaimed: [...(prev.mailClaimed ?? []), mail.mid].slice(-CLAIMED_MAX),
  };
}

/** Separa o que falta mostrar do que já está no save e só precisa de confirmação ao servidor. */
export function splitMail(list: readonly MailItem[], claimed: readonly string[] | undefined): { fresh: MailItem[]; toAck: string[] } {
  const seen = new Set(claimed ?? []);
  return { fresh: list.filter(m => !seen.has(m.mid)), toAck: list.filter(m => seen.has(m.mid)).map(m => m.mid) };
}

/** A fala do Papus: a carta, e o que veio junto. */
export function mailLine(mail: MailItem, isPt: boolean): string {
  const presentes = [
    mail.emblems > 0 ? `${mail.emblems} ${isPt ? 'de Honra' : 'Honor'}` : '',
    mail.bits > 0 ? `${mail.bits} Bits` : '',
  ].filter(Boolean).join(isPt ? ' e ' : ' and ');
  const corpo = isPt ? mail.bodyPt : mail.bodyEn;
  return presentes ? `${corpo} ${isPt ? 'Na bolsa:' : 'In the bag:'} ${presentes}.` : corpo;
}
