// Politica de navegacao e de confianca da janela do app completo.
//
// POR QUE ESTE ARQUIVO EXISTE, E NAO UM `if` dentro do `main.js`:
// `main.js` roda no processo principal do Electron. Ele faz `require('electron')`
// na primeira linha e cria janelas no corpo do modulo, entao nenhum teste em
// node consegue importa-lo — foi exatamente por isso que a auditoria do cliente
// (F-2) achou o furo por LEITURA e nao por teste vermelho. Mesmo movimento que
// `renderer/src/care.ts` fez com `menu.ts` em f6fb5f30: a DECISAO sai para uma
// funcao pura, o `main.js` fica com a fiacao.
//
// O que este modulo decide:
//   1. qual e a origem legitima do app (ela e configuravel por env, ver abaixo);
//   2. se uma navegacao de topo pode acontecer dentro da janela com preload;
//   3. o que fazer com `window.open` (nunca abrir dentro do Electron);
//   4. se um remetente de IPC tem direito de INJETAR um token de auth.
//
// O ponto 4 e o coracao do F-2 e e contraintuitivo: `auth-preload.js` so expoe
// canal de SAIDA, entao uma pagina hostil NAO le o token da vitima. O que ela
// consegue e o inverso — publicar o token DELA, e a partir dai o overlay da
// vitima sincroniza os dados dela para a conta do atacante. Fixacao de sessao
// ao contrario. Por isso a checagem e de ORIGEM DO REMETENTE, nao de formato
// do payload: payload valido vindo de origem errada e exatamente o ataque.

// Precisa bater com o default de `main.js` (FULL_APP_URL) e com o do renderer
// (`renderer/src/config.ts`). Ver `assertPoliticaCoerente` no teste.
const DEFAULT_APP_URL = 'https://soulmon.mateus-sprnd.workers.dev';

/**
 * Origem confiavel do app, derivada da URL efetivamente carregada.
 *
 * `SOULMON_APP_URL` e variavel de AMBIENTE: quem consegue definir uma env var
 * no processo ja e o usuario/dono da maquina, entao ela nao e um vetor por si
 * so — mas ela pode conter lixo (URL invalida, `file:`, `data:`) e nesse caso
 * cair em `origin === 'null'` transformaria a checagem de origem numa checagem
 * que aceita TODA origem opaca. Logo: so `https:` (ou `http:` em localhost,
 * para desenvolvimento) sao aceitos; qualquer outra coisa cai no default, que
 * e sempre uma origem concreta.
 *
 * @param {string | undefined | null} rawUrl
 * @returns {string} origem no formato `https://host[:porta]`, nunca `'null'`
 */
function appOrigin(rawUrl) {
  const candidata = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  const origem = origemUtilizavel(candidata);
  return origem ?? /** @type {string} */ (origemUtilizavel(DEFAULT_APP_URL));
}

/**
 * @param {string} url
 * @returns {string | null}
 */
function origemUtilizavel(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '[::1]';
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && local)) return null;
  // `URL` so devolve `'null'` para esquemas opacos, que a linha acima ja
  // barrou; a checagem fica como rede de seguranca explicita.
  if (!parsed.origin || parsed.origin === 'null') return null;
  return parsed.origin;
}

/**
 * @param {string} url
 * @param {string} origemConfiavel
 * @returns {boolean}
 */
function mesmaOrigem(url, origemConfiavel) {
  const origem = origemUtilizavel(typeof url === 'string' ? url : '');
  return origem !== null && origem === origemConfiavel;
}

/**
 * Navegacao de TOPO dentro da janela que carrega o `auth-preload`.
 *
 * O preload e propriedade da BrowserWindow, nao da URL: se essa janela navegar
 * para fora, a origem nova ganha `window.soulmonDesktopAuth` e pode publicar
 * token. Entao so a propria origem do app navega aqui dentro. Link externo
 * `https:` nao e perdido — vai para o navegador do sistema, que tem barra de
 * endereco (o usuario ve para onde foi). Qualquer outro esquema (`file:`,
 * `data:`, `javascript:`, handlers do SO) e simplesmente recusado.
 *
 * @param {string} targetUrl
 * @param {string} origemConfiavel
 * @returns {{ allow: boolean, openExternal: string | null }}
 */
function decideNavigation(targetUrl, origemConfiavel) {
  if (mesmaOrigem(targetUrl, origemConfiavel)) return { allow: true, openExternal: null };
  return { allow: false, openExternal: externalizavel(targetUrl) };
}

/**
 * `window.open` — inclusive o que o Electron cria a partir de
 * `target="_blank"`, que e como os links externos do app sao escritos
 * (`src/components/AISettingsModal.tsx`). NUNCA abre dentro do Electron:
 * mesmo a origem do app abriria numa janela sem barra de endereco, que e o
 * multiplicador de phishing que a auditoria descreve. Sempre `deny`; se for
 * `https:`, vai para o navegador do sistema.
 *
 * @param {string} targetUrl
 * @returns {{ allow: false, openExternal: string | null }}
 */
function decideWindowOpen(targetUrl) {
  return { allow: false, openExternal: externalizavel(targetUrl) };
}

/**
 * So `https:` sai para o navegador do sistema. `shell.openExternal` entrega o
 * URL ao SO: com `file:`, `smb:` ou um handler registrado, isso vira execucao
 * fora do nosso controle. Nao ha caso de uso legitimo aqui alem de web.
 * @param {string} url
 * @returns {string | null}
 */
function externalizavel(url) {
  if (typeof url !== 'string') return null;
  try {
    return new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * O remetente do IPC `auth-token` tem direito de gravar a sessao?
 *
 * `senderUrl` deve vir de `event.senderFrame.url` (o FRAME que mandou, nao a
 * janela): um `<iframe>` de terceiro dentro da pagina do app tem o mesmo
 * `event.sender` da janela, mas URL propria. Checar a janela deixaria o iframe
 * passar.
 *
 * @param {string | undefined | null} senderUrl
 * @param {string} origemConfiavel
 * @returns {boolean}
 */
function isTrustedAuthSender(senderUrl, origemConfiavel) {
  if (typeof senderUrl !== 'string' || senderUrl === '') return false;
  return mesmaOrigem(senderUrl, origemConfiavel);
}

module.exports = {
  DEFAULT_APP_URL,
  appOrigin,
  decideNavigation,
  decideWindowOpen,
  isTrustedAuthSender,
};
