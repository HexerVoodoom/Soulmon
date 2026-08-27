// Configuração compartilhada pelo renderer do desktop.
//
// ⚠️ Este comentário AFIRMAVA, logo acima da linha que o desmente, que "a URL
// ainda aponta pro Pages herdado do DigiApp". Era falso: a migração já tinha
// acontecido, e as fontes JÁ concordam entre si — `capacitor.config.json`,
// `desktop/electron/main.js` e esta linha, todas em
// `soulmon.mateus-sprnd.workers.dev`. Medido antes de corrigir, nas três.
//
// A mesma frase falsa estava no `CLAUDE.md` e foi corrigida em 26/08 (lá ela
// era pior: mandava NÃO trocar a URL, então um agente que a lesse decidiria
// errado sobre deploy). Este resíduo sobreviveu àquela limpeza.
//
// Quem obriga as fontes a concordarem é `src/deploy/appUrl.contract.test.ts`,
// e ele nasceu de um estrago real: o primeiro APK do CI abriu o DigiApp com o
// nome e o ícone do Soulmon. Se você mudar a URL aqui, mude nas outras — o
// guard reprova, e é para reprovar mesmo.
//
// O que CONTINUA herdado, e não é isto: o namespace KV `DIGIAPP_SAVES`, que é
// a fatia 1 que resolve (ver `docs/SEPARACAO-DIGIAPP.md`). Um domínio próprio
// do Soulmon também ainda não existe — quando existir, são estes três lugares.
export const APP_URL = 'https://soulmon.mateus-sprnd.workers.dev';

/** Namespace local do desktop — separado do save real de propósito (ver state.ts). */
export const STORAGE_KEY = 'soulmon_desktop_v1';
