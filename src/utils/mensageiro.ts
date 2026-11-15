import type { NpcIntroId } from './buildingIntro';
/**
 * O MENSAGEIRO (NPC 440, Papus; §241): o crédito das cartas no save. Puro. A fila mora no servidor (`functions/api/_mensageiro.js`);
 * `mailClaimed` guarda o que já foi creditado, então a mesma carta entregue de novo não paga duas vezes.
 */
export interface MailItem {
  mid: string; bodyPt: string; bodyEn: string; bits: number; emblems: number;
  /** Caixa de cartas (§246). Cartas de servidor antigo chegam sem estes campos: lidos como carta nova e sem resgate. */
  titlePt?: string; titleEn?: string; at?: number;
  /** O dono já abriu (ou resgatou). Só o servidor grava. */
  read?: boolean;
  /** Instante em que o servidor entregou o prêmio (0/ausente = ainda pendente). */
  claimedAt?: number;
  /** Carta especial (§288): presente de amigo, convite de amizade (Aceitar/Recusar) ou anúncio global (pode levar o mini-tutorial). Ausente = carta comum. */
  kind?: MailKind;
  /** Só no convite: o pid público de quem convidou (nunca o saveId). */
  fromPid?: string;
  /** Só no convite de clã (§358): o código do clã (o mesmo que o corpo da carta mostra). "Entrar no clã" usa o `guildJoin` do Salão. */
  guildCode?: string;
  /** Só na carta global: qual mini-tutorial ilustra o corpo. */
  tutorial?: 'widget';
  /** NPC remetente: a caixa mostra a imagem dele na carta. Ausente = remetente jogador (sem imagem). */
  npc?: 'mensageiro' | 'hexsmith';
}
export type MailKind = 'gift' | 'friend-invite' | 'guild-invite' | 'global';
/** O que o servidor entregou num resgate: só o prêmio e o título. */
export interface MailGrant { mid: string; titlePt?: string; titleEn?: string; bits: number; emblems: number }
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

/** Tem item a resgatar. */
export const hasPendingReward = (m: MailItem): boolean => (m.bits > 0 || m.emblems > 0) && !m.claimedAt;
/** Convite de amizade com o que o servidor precisa para responder. */
export const isFriendInvite = (m: MailItem): m is MailItem & { fromPid: string } => m.kind === 'friend-invite' && typeof m.fromPid === 'string' && m.fromPid.length > 0;
/** Convite de clã por carta (§358) com o código para entrar. Carta de clã de antes do §358 (sem `kind`) é carta comum: o corpo traz o código. */
export const isGuildInvite = (m: MailItem): m is MailItem & { guildCode: string } => m.kind === 'guild-invite' && typeof m.guildCode === 'string' && m.guildCode.length > 0;
/** Carta nova = ainda não aberta nem resgatada. */
export const isUnread = (m: MailItem): boolean => m.read !== true && !m.claimedAt;
/** A bolinha vermelha do ícone da Home. */
export const hasNewMail = (list: readonly MailItem[]): boolean => list.some(isUnread);

/** Mais nova primeiro. */
export const sortMail = (list: readonly MailItem[]): MailItem[] => [...list].sort((a, b) => (b.at ?? 0) - (a.at ?? 0));

export const mailTitle = (m: MailItem, isPt: boolean): string => (isPt ? m.titlePt : m.titleEn) || (isPt ? 'Carta do Papus' : 'Letter from Papus');
export const mailBody = (m: MailItem, isPt: boolean): string => (isPt ? m.bodyPt : m.bodyEn);

/** Ex.: "6 de Honra e 10 Bits". Vazio se não há item. */
export function rewardText(r: { bits: number; emblems: number }, isPt: boolean): string {
  return [
    r.emblems > 0 ? `${r.emblems} ${isPt ? 'de Honra' : 'Honor'}` : '',
    r.bits > 0 ? `${r.bits} Bits` : '',
  ].filter(Boolean).join(isPt ? ' e ' : ' and ');
}

/** O total do pop-up do "Resgatar tudo". */
export function sumGrants(list: readonly { bits: number; emblems: number }[]): { bits: number; emblems: number } {
  return list.reduce((t, g) => ({ bits: t.bits + g.bits, emblems: t.emblems + g.emblems }), { bits: 0, emblems: 0 });
}

/** Cartas que o servidor já entregou mas que o save ainda não registrou (app fechou entre o resgate e o crédito): creditar de novo é seguro, `applyMail` deduplica. */
export const unclaimedInSave = (list: readonly MailItem[], claimed: readonly string[] | undefined): MailItem[] =>
  list.filter(m => m.claimedAt && !(claimed ?? []).includes(m.mid));

/** Aplica no save o que o servidor entregou. Idempotente por `mid`. */
export function applyGrants<T extends MailState>(prev: T, grants: readonly MailGrant[]): T {
  return grants.reduce((s, g) => applyMail(s, { ...g, bodyPt: '', bodyEn: '' }), prev);
}

/** Reflete um resgate na lista local: lida e resgatada. */
export const markClaimed = (list: readonly MailItem[], mids: ReadonlySet<string>, now: number): MailItem[] =>
  list.map(m => (mids.has(m.mid) ? { ...m, read: true, claimedAt: m.claimedAt || now } : m));

/** Lidas que podem ser apagadas sem confirmação (as com item pendente ficam). */
/** Carta de convite (amizade, clã, e o clã antigo só com `mid` `ginv:`): espelho de `isInviteLetter` do servidor (§389). */
export const isInviteLetter = (m: MailItem): boolean => m.kind === 'friend-invite' || m.kind === 'guild-invite' || m.mid.startsWith('ginv:');
/** O que "Excluir todas lidas" apaga: lidas, sem item pendente e que NÃO são convite (o servidor faz o mesmo, §389). */
export const deletableRead = (list: readonly MailItem[]): MailItem[] => list.filter(m => m.read === true && !hasPendingReward(m) && !isInviteLetter(m));

// O aviso do Papus (modal da fila) só fala de carta que ainda não anunciou: lista curta de `mid` no aparelho.
const ANNOUNCED_MAX = 50;
export const parseAnnounced = (raw: string | null | undefined): string[] => (raw ?? '').split(',').filter(Boolean).slice(-ANNOUNCED_MAX);
export const serializeAnnounced = (mids: readonly string[]): string => [...new Set(mids)].slice(-ANNOUNCED_MAX).join(',');
/** Cartas novas que o Papus ainda não anunciou neste aparelho. */
export const toAnnounce = (list: readonly MailItem[], announced: readonly string[]): MailItem[] =>
  list.filter(m => isUnread(m) && !announced.includes(m.mid));

/** O "visto" do pop-up do Papus no save (`buildingIntrosSeen`, §390). */
export const MESSENGER_INTRO_ID: NpcIntroId = 'npc.mensageiro';

/**
 * O pop-up do Papus JÁ foi visto nesta conta? (§390) A marca do save vale em qualquer aparelho. Quem viu antes desta versão conta
 * como visto: anúncio gravado neste aparelho (`MAIL_ANNOUNCED`) ou carta já lida/resgatada na caixa (o servidor guarda, vale em
 * qualquer aparelho). O erro seguro é NÃO abrir o pop-up: a bolinha do ícone continua avisando.
 */
export function messengerIntroSeen(p: { introsSeen: readonly string[] | undefined; announced: readonly string[]; mail: readonly MailItem[] }): boolean {
  return (p.introsSeen ?? []).includes(MESSENGER_INTRO_ID) || p.announced.length > 0 || p.mail.some(m => !isUnread(m));
}

/** Grava o "visto" do pop-up. Idempotente: já visto devolve a MESMA referência (updater do `setGameState`). */
export function markMessengerIntroSeen(seen: readonly string[] | undefined): readonly string[] {
  const atual = Array.isArray(seen) ? seen : [];
  return atual.includes(MESSENGER_INTRO_ID) ? atual : [...atual, MESSENGER_INTRO_ID];
}

/** As cartas que o pop-up anuncia AGORA: só na 1ª vez da conta (§390, dono 14/11/2026); depois, nenhuma (só a bolinha). */
export function mailPopupToShow(p: { mail: readonly MailItem[]; announced: readonly string[]; introsSeen: readonly string[] | undefined }): MailItem[] {
  return messengerIntroSeen(p) ? [] : toAnnounce(p.mail, p.announced);
}

/** A fala curta do aviso: a caixa é que mostra o conteúdo. */
export const announceLine = (count: number, isPt: boolean): string => (isPt
  ? (count === 1 ? 'Chegou uma carta para vocês! Está na caixa de cartas, no ícone da Home.' : `Chegaram ${count} cartas para vocês! Estão na caixa de cartas, no ícone da Home.`)
  : (count === 1 ? 'A letter came for you two! It is in the mailbox, the icon on Home.' : `${count} letters came for you two! They are in the mailbox, the icon on Home.`));
