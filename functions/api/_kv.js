/**
 * O NAMESPACE KV, resolvido num lugar só.
 *
 * ⚠️ Por que existe: o binding se chamava `DIGIAPP_SAVES` — herança do fork —
 * e o `docs/SEPARACAO-DIGIAPP.md` explicava que renomeá-lo "exigiria alterar
 * todos os arquivos em `functions/api/` **e** acertar o Cloudflare no mesmo
 * instante; qualquer descompasso derruba save, créditos e compras ao mesmo
 * tempo".
 *
 * O argumento estava certo sobre o RISCO e errado sobre a única saída. Com um
 * acessor que aceita os DOIS nomes, a troca deixa de exigir sincronia: o
 * código passa a preferir `SOULMON_SAVES` e continua funcionando com
 * `DIGIAPP_SAVES` enquanto o painel não muda. Não existe janela de queda, e a
 * ordem entre "mergear" e "clicar no Cloudflare" deixa de importar.
 *
 * **Como concluir a troca** (quando quiser, sem pressa e sem downtime):
 *  1. Cloudflare → Pages → Settings → Functions → KV namespace bindings;
 *  2. acrescente um binding `SOULMON_SAVES` apontando para o MESMO namespace
 *     (ou para um novo, se quiser separar de vez os dados do DigiApp);
 *  3. confirme que o app segue funcionando e remova o `DIGIAPP_SAVES` antigo;
 *  4. só então apague o fallback daqui e a régua que o protege.
 *
 * ⚠️ Note que o `wrangler.jsonc` deste repositório declara os dois — é ele que
 * vale para `wrangler dev` e para o deploy do worker; o painel do Pages tem a
 * própria lista, e é ela que vale em produção.
 */

/**
 * @param {{ SOULMON_SAVES?: KVNamespace, DIGIAPP_SAVES?: KVNamespace }} env
 * @returns {KVNamespace | undefined} `undefined` quando NENHUM está ligado —
 *   quem chama já trata isso (`storage-not-bound`), e continuar `undefined` em
 *   vez de lançar preserva esse caminho.
 */
export function kv(env) {
  return env?.SOULMON_SAVES ?? env?.DIGIAPP_SAVES;
}
