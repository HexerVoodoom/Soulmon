/**
 * Copy dos erros do chat (`/api/chat`) e do microfone (`/api/transcribe`) — D-96.
 * Erro de conta/acesso/app = toast (fala o app); carga/descanso = bolha (fala o Soulmon).
 * Tom calmo, sem culpa nem urgência. EN primeiro, PT-BR depois.
 */
type Par = { en: string; pt: string };

export const CHAT_ERR = {
  unauthenticated: { en: 'Your session ended. Sign in again to keep chatting.', pt: 'Sua sessão terminou. Entre de novo para continuar a conversa.' },
  betaClosed: { en: 'The chat is in a closed test right now, and this email is not on the list yet. Everything else works as usual.', pt: 'O chat está em teste fechado e este e-mail ainda não está na lista. O resto do app funciona normal.' },
  missingSaveId: { en: 'Something did not load right. Reload the app and try again.', pt: 'Algo não carregou direito. Recarregue o app e tente de novo.' },
  busy: { en: "I'm a little tired right now… try again in a bit?", pt: 'Tô cansadinho agora… tenta de novo daqui a pouco?' },
  upstream: { en: "I'm a bit tangled up right now… try again in a bit?", pt: 'Tô meio enrolado agora… tenta de novo daqui a pouco?' },
  serverError: { en: 'I lost my train of thought. Try again in a moment?', pt: 'Perdi o fio da conversa. Tenta de novo daqui a pouco?' },
  notSwitchedOn: { en: 'Smart chat is not switched on right now — simple replies still work.', pt: 'O chat inteligente não está ligado agora — respostas simples continuam.' },
  offline: { en: "No internet connection. Your message is still here; try again when you're back online.", pt: 'Sem conexão com a internet. Sua mensagem continua aqui; tente de novo quando voltar.' },
} satisfies Record<string, Par>;

export const MIC_ERR = {
  unauthenticated: { en: 'Your session ended. Sign in again to use your voice.', pt: 'Sua sessão terminou. Entre de novo para usar a voz.' },
  betaClosed: { en: 'Voice messages are in a closed test, and this email is not on the list yet. You can still type.', pt: 'Recado falado está em teste fechado e este e-mail ainda não está na lista. Você pode escrever normalmente.' },
  tooLarge: { en: 'That recording is too big. Try a shorter message.', pt: 'A gravação ficou grande demais. Tente um recado mais curto.' },
  tooLong: { en: 'Recordings can be up to 60 seconds. Try a shorter message.', pt: 'A gravação pode ter até 60 segundos. Tente um recado mais curto.' },
  unsupported: { en: 'This audio format is not supported. You can type your message instead.', pt: 'Este formato de áudio não é aceito. Você pode escrever a mensagem.' },
  rateLimited: { en: 'Too many recordings in a row. Give it a moment.', pt: 'Muitas gravações seguidas. Espere um pouquinho.' },
  unavailable: { en: 'Spoken messages are not available right now. You can type instead.', pt: 'O recado falado não está disponível agora. Você pode escrever.' },
  serverError: { en: "I couldn't turn that into text. Try again in a moment, or type it.", pt: 'Não consegui transformar em texto. Tente de novo daqui a pouco, ou escreva.' },
  offline: { en: "No internet connection. Your recording was not sent. Try again when you're back online.", pt: 'Sem conexão com a internet. A gravação não foi enviada. Tente de novo quando voltar.' },
  autoStop60: { en: 'Recording stopped at 60 seconds. Your message is being sent to text.', pt: 'A gravação parou aos 60 segundos. Estamos transformando em texto.' },
} satisfies Record<string, Par>;

export const copiaErro = (p: Par, isPt: boolean): string => (isPt ? p.pt : p.en);

/** Status do `/api/transcribe` → copy. `erro` = campo `error` do JSON. */
export function micErroPorStatus(status: number, erro?: string): Par {
  if (status === 401) return MIC_ERR.unauthenticated;
  if (status === 403) return MIC_ERR.betaClosed;
  if (status === 413) return erro === 'audio-too-long' ? MIC_ERR.tooLong : MIC_ERR.tooLarge;
  if (status === 415) return MIC_ERR.unsupported;
  if (status === 429) return MIC_ERR.rateLimited;
  if (status === 503) return MIC_ERR.unavailable;
  return MIC_ERR.serverError;
}
