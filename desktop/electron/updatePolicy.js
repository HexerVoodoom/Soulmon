// Politica de auto-update do desktop.
//
// POR QUE ESTE ARQUIVO EXISTE, E NAO UM `if` dentro do `main.js`:
// mesmo motivo de `navigationPolicy.js` — `main.js` faz `require('electron')`
// e cria janela no corpo do modulo, entao nenhum teste em node consegue
// importa-lo. A DECISAO ("este processo pode se auto-atualizar?") sai para ca,
// pura, e o `main.js` fica com a fiacao.
//
// O QUE ESTA DECISAO VALE:
// o updater e um caminho de EXECUCAO DE CODIGO, nao de dado. Quem responde
// `true` aqui autoriza o processo a baixar um instalador e roda-lo na proxima
// saida do app (`autoInstallOnAppQuit`). Por isso a regra e fail-safe: na
// duvida, NAO atualiza.
//
// O caso concreto que motivou extrair isto: o build de Steam desliga o
// auto-update via `-c.extraMetadata.steamBuild=true`, que o electron-builder
// grava no package.json empacotado. Em 26/ago/2026 foi PROVADO, lendo o asar,
// que aquele valor chega como BOOLEANO (`desktop/STEAM.md`). Mas a prova vale
// para uma versao do electron-builder e uma forma de invocar; se um dia o
// valor chegar como a STRING "true", uma comparacao `=== true` responderia
// "nao e Steam" e o build da Steam passaria a se atualizar pelo GitHub por
// cima do que o SteamPipe instalou. A falha seria SILENCIOSA e para o lado
// perigoso. Aqui a marcacao e lida de forma tolerante justamente porque o
// erro caro e o falso-negativo.

/**
 * O package.json empacotado marca este build como build de Steam?
 *
 * Tolerante de proposito: booleano `true` e a string `'true'` contam. Qualquer
 * outra coisa (ausente, `false`, `'false'`, `0`, objeto) e "nao e Steam".
 *
 * @param {unknown} pkg conteudo do package.json empacotado
 * @returns {boolean}
 */
function isSteamBuild(pkg) {
  if (!pkg || typeof pkg !== 'object') return false;
  const marca = /** @type {{ steamBuild?: unknown }} */ (pkg).steamBuild;
  return marca === true || marca === 'true';
}

/**
 * Este processo pode buscar e instalar atualizacao sozinho?
 *
 * Duas condicoes, ambas necessarias:
 *  - `isPackaged`: em desenvolvimento nao ha o que atualizar, e o updater
 *    tentaria resolver um feed contra uma versao de dev;
 *  - nao ser build de Steam: la quem atualiza e o SteamPipe, e os dois
 *    mecanismos brigariam pelo mesmo binario.
 *
 * @param {{ isPackaged?: unknown, pkg?: unknown }} ctx
 * @returns {boolean}
 */
function shouldAutoUpdate(ctx) {
  const empacotado = !!ctx && ctx.isPackaged === true;
  return empacotado && !isSteamBuild(ctx && ctx.pkg);
}

module.exports = { isSteamBuild, shouldAutoUpdate };
