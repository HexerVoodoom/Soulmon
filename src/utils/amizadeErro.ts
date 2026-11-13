/**
 * §346 (13/11/2026): o que a tela diz quando convidar um amigo falha.
 *
 * Antes, TODA falha de `addFriend`/`listPlayers` virava "Não deu para adicionar agora. Tente de novo." — inclusive o 429 do teto
 * por IP, que era a causa da frequência. O cliente lê o `error` do corpo (que `call` em `community.ts` põe na mensagem do `Error`)
 * e devolve um texto que diz o que fazer. A genérica fica só para o desconhecido de verdade.
 *
 * Privacidade: "não existe" e "se escondeu da lista pública" chegam iguais do servidor (`friend not found`) e continuam iguais aqui.
 */
export function mensagemFalhaConvite(err: unknown, isPt: boolean): string {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  if (msg === 'rate limited' || / 429\b|\(429\)/.test(msg)) {
    return isPt ? 'Muitas tentativas seguidas. Espere um minuto e tente de novo.' : 'Too many tries in a row. Wait a minute and try again.';
  }
  if (msg === 'friend not found') {
    return isPt
      ? 'Não achei esse jogador. Confira o apelido exato (do jeito que aparece no perfil dele).'
      : "Player not found. Check the exact nickname (as it shows on their profile).";
  }
  if (msg === 'too many pending invites') {
    return isPt ? 'Você já tem convites demais esperando resposta. Espere alguém aceitar.' : 'You have too many invites waiting. Wait for someone to accept.';
  }
  if (/^friend limit/.test(msg)) {
    return isPt ? 'Sua lista de amigos está cheia.' : 'Your friends list is full.';
  }
  if (msg === 'cannot befriend yourself') {
    return isPt ? 'Esse é você.' : "That's you.";
  }
  if (msg === 'profile not found') {
    return isPt ? 'Seu perfil ainda não chegou ao servidor. Abra o app de novo em instantes e tente outra vez.' : "Your profile hasn't reached the server yet. Reopen the app in a moment and try again.";
  }
  if (msg === 'unauthenticated' || msg === 'forbidden') {
    return isPt ? 'Sua sessão expirou. Saia e entre de novo na conta.' : 'Your session expired. Sign out and sign in again.';
  }
  if (msg === 'beta-closed') {
    return isPt ? 'Sua conta não está liberada no beta.' : "Your account isn't enabled for the beta.";
  }
  if (msg === 'Failed to fetch' || /network|NetworkError|Load failed/i.test(msg)) {
    return isPt ? 'Sem conexão. Confira a internet e tente de novo.' : 'No connection. Check your internet and try again.';
  }
  return isPt ? 'Não deu para adicionar agora. Tente de novo.' : "Couldn't add that friend right now. Try again.";
}
