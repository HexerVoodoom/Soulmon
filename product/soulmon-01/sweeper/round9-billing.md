# Rodada 9 — O portão do dinheiro

**Pergunta da rodada:** o caminho que decide se alguém pagou é visto por alguém?
**Resposta curta:** o lado **Google Play — que é o do app Android, isto é, o de
todo mundo que paga hoje — não era visto por teste nenhum.** `48,5% → 90,8%`, e
os 12 sobreviventes restantes são todos equivalentes, classificados um a um.
De quebra, `carePattern.ts` foi de `51,1% → 95,6%`, e **um bug real de produção**
foi encontrado, corrigido e trancado com teste de regressão.

---

## 1. Linha de base (medida nesta rodada, não herdada)

As duas medições foram feitas com o repositório como estava e com os testes
novos **fora da árvore** — medir "antes" com o "depois" instalado é a família de
autoengano que este loop existe para consertar.

| Arquivo | Rodada 7 | **Minha base** | Mutantes vivos |
|---|---:|---:|---:|
| `functions/api/_billing.js` | 40,0 % | **48,5 % (63/130)** | 67 |
| `src/utils/carePattern.ts` | 51,1 % | **51,1 % (23/45)** | 22 |

`carePattern` **reproduziu a rodada 7 exatamente**, o que valida o instrumento.
`_billing` saiu 8,5 pp acima do número da rodada 7 — a diferença é o teste de
contrato do SEC-4 (vínculo do `steamid` na microtransação), que entrou depois
daquela medição. **A base correta é 48,5 %, não 40 %.**

---

## 2. Resultado

| Arquivo | Mortos antes | **Mortos depois** | Vivos antes | **Vivos depois** | **Cegos depois** |
|---|---:|---:|---:|---:|---:|
| `_billing.js` | 63/130 — 48,5 % | **119/131 — 90,8 %** | 67 | **12** | **0** |
| `carePattern.ts` | 23/45 — 51,1 % | **43/45 — 95,6 %** | 22 | **2** | **0** |
| **Somados** | 86/175 — 49,1 % | **162/176 — 92,0 %** | **89** | **14** | **0** |

Descontando os equivalentes (§5), o score sobre o **alcançável** é **100 % nos
dois arquivos**: 119/119 e 43/43.

> `_billing.js` tem 131 mutantes no "depois" e 130 no "antes" porque a correção
> de produção (§4) acrescentou um. Ele nasce **morto**.

**Testes: 1020 → 1138 (+118), em 3 arquivos novos.** Nenhum teste existente foi
afrouxado — nenhum arquivo de teste antigo foi sequer tocado.

---

## 3. O instrumento tinha que mudar, e a rodada 8 estava certa

A rodada 8 disse: *mutação sozinha não serve aqui, porque os testes batem em
mock e a mutação mediria o mock*. Estava certa, e o motivo estava **escrito no
cabeçalho do próprio `billing.test.js`**:

> "A Steam é o provedor escolhido porque a verificação dela é 100 % `fetch`; a
> Play exigiria assinar um JWT com chave de serviço real, o que faria o teste
> medir a criptografia em vez do contrato."

A intenção era boa e o resultado foi ruim: `verifyPlayPurchase`,
`isPlayPurchaseVoided` e `getAccessToken` **inteiras** viviam sem uma única
asserção. A objeção da criptografia se resolve em 71 ms:

```js
const pair = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, ... }, true, ['sign','verify']);
// → PKCS8 → PEM → service account de mentira, com chave de VERDADE
```

Com isso o `getAccessToken` de produção assina de verdade e o único ponto
falsificado é a **fronteira externa**: `oauth2.googleapis.com/token` e
`androidpublisher.googleapis.com`. Tudo entre a requisição HTTP e o KV é código
de produção — `billing.js`, `_billing.js`, `_entitlements.js`, `_auth.js`. É o
mesmo movimento do `pushCareAction.test.ts`.

E isso **não** mede criptografia: nenhum teste afirma nada sobre RSA. A chave
real só serve para o código sob teste chegar vivo até a linha que decide se o
jogador pagou.

### 3.1 O que estava cego, em cenário de jogador

| Mutação que sobrevivia | O que aconteceria com dinheiro real |
|---|---|
| `:150` `purchaseState !== 0` → `=== 0` | **compra PENDENTE vira compra válida** — Créditos entregues sem o dinheiro ter entrado; e a compra legítima passa a ser recusada |
| `:215/:216` `=== 1` / `=== 0` (`isPlayPurchaseVoided`) | estorno deixa de ser reconhecido (jogador fica com o que a Google devolveu), **ou** compra ativa é lida como estorno e o benefício some de quem pagou |
| `:141/:146/:311/:316/:361/:366` `{ ok: false }` → `ok: true` (**8 lugares**) | **falha da loja vira concessão** — 404, 500, timeout e resposta malformada devolvendo "compra válida" sem `product` |
| `:446` `status === 'Succeeded'` → `!==` | estorno da Steam invertido: quem pagou perde os Créditos, quem estornou fica com eles |
| `:79/:100` `exp: now + 3600` → `0` | todo token OAuth nasce expirado; a verificação de compra para de funcionar **em silêncio** |
| `:71` cache do token (4 mutantes) | uma troca OAuth por verificação → rate limit do Google num pico de vendas |
| `:255/:256/:313/:363/:415/:444` `?.` removido (**13 mutantes**) | corpo inesperado da Valve (proxy devolvendo HTML, mudança de versão da interface) vira **exceção** em vez de "não deu para verificar" |
| `:42/:44` `STEAM_ITEMS` `101`/`103` → `0` | o `itemid` deixa de resolver: jogador paga o pacote de 400 e não recebe nada |
| `:405/:436` `\d{1,32}` → `\d{0,32}` | `steam:own:480:` (steamid vazio) passa a ser consultado como licença |

O ponto de fundo é o mesmo das rodadas anteriores, com outra roupa: **o módulo
inteiro tinha um único modo de falha não testado, e esse modo era "conceder".**

### 3.2 `isSteamPurchaseVoided` não tinha teste nenhum

A função que decide se um pacote de Créditos comprado na Steam foi estornado
nunca havia sido chamada. Agora tem os 4 status de estorno
(`Refunded`/`PartialRefund`/`Chargeback`/`Failed`), o `Succeeded`, os status
intermediários (`Init`/`Approved`, que **não** podem revogar), corpo malformado,
rede caindo e as bordas do formato do `orderId`.

### 3.3 `carePattern.ts` — uma tabela de limiares sem um teste de limiar

A rodada 7 diagnosticou e o diagnóstico se confirmou: os testes existentes usam
só extremos (10 dias seguidos → spread 0,71 / concentração 0,10; 12 tarefas num
dia → concentração 1,00). **Nunca chegavam perto de um limiar.**

Os quatro limiares agora têm um PAR cada — em cima da linha, e um passo fora:

| Limiar | Em cima | Um passo fora |
|---|---|---|
| confiança `total >= 5` | 5 conclusões → confiável | 4 → não confiável, cai em equilibrado |
| `spread >= 0.5` | 7 dias ativos em 14 → constante | 6 dias → equilibrado |
| `concentration <= 0.4` | 4/10 = 0,40 exato → constante | 5/11 = 0,45 → equilibrado |
| `concentration >= 0.5` | 3/6 = 0,50 exato → explosivo | 3/7 = 0,43 → equilibrado |
| `spread <= 0.25` | 4/16 = 0,25 exato → explosivo | 5/16 = 0,31 → equilibrado |

Mais as bordas da janela de tempo (no corte exato entra; 1 ms antes não; agora
entra; 1 ms no futuro não) e o fallback de atributo não-finito, que **tem** que
valer 0: com 1, um `virusPoints` ausente no save daria a vitória ao vírus e
mudaria o **galho de evolução** do jogador por causa de um campo que nunca
existiu.

---

## 4. Bug real de produção — encontrado, corrigido, trancado

**`verifySteamPurchase` chamava `authenticateSteamTicket` FORA de try/catch,
enquanto `verifySteamOwnership` — que chama a mesma função — tinha o try/catch.**

A assimetria era o indício; a varredura foi o que me fez olhar. Evidência antes
da correção, com o `fetch` lançando `ECONNRESET`:

```
OWNERSHIP => { ok: false, reason: 'verification-failed' }     ← trata
PURCHASE  => retorno: null | LANCOU: 'ECONNRESET'             ← explode
```

Como `billing.js > onRequestPost` também não tem try/catch, a exceção subia até
a Pages Function: com a Valve inalcançável (DNS, TLS, timeout), quem tentasse
comprar Créditos na Steam tomava um **500 cru da Cloudflare** em vez de
`502 verification-failed`.

**Gravidade: baixa, e é importante ser honesto sobre isso.** Falha fechado nos
dois casos — nada é concedido — e o billing da Steam ainda não está configurado
em produção (não existe App ID; ver `desktop/STEAM.md`). O que se ganha é um
modo de falha legível numa rota de pagamento, em vez de 500 sem reason.

Correção: 13 linhas, espelhando exatamente o try/catch da função irmã.
Regressão trancada por dois testes — um que exige que não lance, e outro que
exige que **as duas irmãs respondam igual** para a mesma falha, que é como o bug
nasceu.

---

## 5. Equivalentes — separados de propósito, não contam como vitória

Os 14 sobreviventes restantes. **Nenhum é teste cego**; cada um está justificado.

### 5.1 `_billing.js` — 12

- **`:62`** `i < raw.length` → `<=` em `pemToArrayBuffer`: `buf` é um
  `Uint8Array(raw.length)`; a escrita fora do limite é **silenciosamente
  ignorada** pelo TypedArray e `charCodeAt(len)` é `NaN`. Sem efeito observável.
- **`:67` e `:107`** `cachedExpiry = 0` → `1`: o guard é
  `if (cachedToken && …)`, e `cachedToken` é `null` nos dois pontos. O valor
  inicial nunca é lido.
- **`:71`** `now < cachedExpiry - 60` → `<=`: diverge **só** no instante em que
  `now === cachedExpiry - 60`, e as duas alternativas são igualmente corretas
  (renovar um segundo antes ou depois). Matável com `vi.useFakeTimers`, mas o
  teste afirmaria um desempate sem significado de produto. **Equivalente em
  efeito, e assumido como tal.**
- **`:84`** `false` → `true`: é o parâmetro `extractable` de
  `crypto.subtle.importKey`. Não muda a assinatura produzida.
- **`:306`** `let owns = false` → `true`: todo caminho que chega ao
  `if (!owns)` passa antes pela atribuição `owns = data?…=== true`; os dois
  desvios anteriores (`!res.ok` e o `catch`) retornam.
- **`:343`** `\d{1,32}` → `\d{0,32}`: `!orderId` já barra a string vazia, e
  nenhum valor *truthy* vira `''` no `String()`. Inalcançável.
- **`:415` (2) e `:444` (3)** — `?.` em `isSteamOwnershipVoided` /
  `isSteamPurchaseVoided`: o mutante lança, o `try/catch` que envolve o bloco
  devolve `null`, **o mesmo** que o original devolve pelo caminho normal. As
  duas respostas são indistinguíveis por construção.

### 5.2 `carePattern.ts` — 2

- **`:100`** `perDay.size ? … : 0` → `1`: `busiest` só é usado em
  `total > 0 ? busiest / total : 0`, e `perDay.size === 0` ⟺ `total === 0`.
  A concentração dá 0 nos dois casos.
- **`:172`** `leaders.length === 1` → `=== 0`: com um líder só, o mutante cai no
  desempate e o desempate devolve **esse mesmo líder** — se o `preferred` bate,
  por ele; senão `leaders.includes(fallback)` é falso (líder único ≠ fallback) e
  sobra `leaders[0]`, que é o líder. Sempre o mesmo valor.

Vale registrar o contraste com a rodada 8: lá, 12 dos 26 sobreviventes eram
**anotação de tipo** (`{ ok: true }` dentro de uma união TS). Aqui não há
nenhum — `_billing.js` é **JavaScript**, então todo `ok: false` é um valor de
verdade e todo mutante desses é real. Foram 8, e os 8 morreram.

---

## 6. Higiene do instrumento — e um incidente que vale documentar

O aviso da rodada 8 sobre mutante esquecido no fonte **aconteceu comigo, e por
uma causa nova: concorrência.**

Rodei a varredura de base em segundo plano e, enquanto ela corria, mutei o
`_billing.js` à mão para conferir se meus testes mordiam. As duas coisas
escreviam no **mesmo arquivo**. O `git diff` acusou um `cachedExpiry = 1` que
não era meu, e o processo, morto no meio, deixou um `.mutation-bak` órfão.
Descartei aquela base, restaurei do git, apaguei o `.bak` e **remedi tudo do
zero, em série**.

A regra da rodada 8 era "as varreduras rodam em série". A regra da rodada 9 é
mais forte:

> **Enquanto a varredura roda, o repositório é dela.** Nada de editar arquivo,
> nem de teste manual no alvo, nem em outro terminal.

**Complicação adicional, e ela é real:** outro agente trabalhou na mesma árvore
durante esta rodada (`careRules.ts`, `dailyReset.ts`, `App.tsx`, `progression.ts`
e um `dist/` novo). Isso importa porque a reconfirmação de sobrevivente roda a
**suíte completa**. Se a suíte estivesse vermelha por trabalho alheio em curso,
todo sobrevivente viraria "morto-por-suite-completa" e o número sairia
**inflado**. Duas coisas seguram o resultado: (a) a existência de sobreviventes
prova que a suíte estava verde nos momentos de reconfirmação, e (b) nem
`_billing.js` nem `carePattern.ts` nem os testes dos seus subsets foram tocados
por ninguém além de mim. **Os números são comparáveis** — mas a árvore
compartilhada é um risco de medição que a próxima rodada precisa considerar.

Verificação final: **nenhum `.mutation-bak` no repositório**, e o único diff de
produção é a correção de 13 linhas da §4, intencional.

`scripts/mutation-sweep.mjs` mudou **só nos subsets** dos dois alvos, para
incluir os testes novos.

---

## 7. Portões — com números reais

| Portão | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **exit 0**, limpo |
| Testes | `npx vitest run` | **1138 testes, 66 arquivos, 0 falhas** (base: 1020) |
| Build | `npm run build` | **exit 0** — vite build + 119/119 PNG→WebP (−7,15 MB) + `✨ Compiled Worker successfully` |
| Mutação | `node scripts/mutation-sweep.mjs _billing` | **119/131 — 90,8 %**, 12 vivos, **0 cegos** |
| Mutação | `node scripts/mutation-sweep.mjs carePattern` | **43/45 — 95,6 %**, 2 vivos, **0 cegos** |
| `.mutation-bak` órfão | `find . -name '*.mutation-bak'` | **NENHUM** |
| Diff de produção | `git diff functions/api/_billing.js` | **13 linhas**, a correção da §4 |

Arquivos novos:

- `functions/api/billing.play.test.js` — **47 casos** (Play ponta a ponta)
- `functions/api/_billing.steamRefund.test.js` — **46 casos** (estorno Steam + corpo malformado)
- `src/utils/carePattern.threshold.test.ts` — **25 casos** (limiares e bordas)

---

## 8. Veredito do loop

> **No portão do dinheiro, o loop PARA — com evidência.**

- `_billing.js`: **90,8 %**, 12 vivos, **12 equivalentes, 0 cegos**;
- `carePattern.ts`: **95,6 %**, 2 vivos, **2 equivalentes, 0 cegos**.

O critério das rodadas anteriores (*se os módulos de maior dano não tiverem
mutante sobrevivente cego, para*) foi atingido nos dois. A frase que resume esta
rodada é a irmã da rodada 8: **verificar não é perguntar; receber resposta não é
conferir a resposta.** O módulo sabia falar com a loja e não sabia o que fazer
quando a loja respondia qualquer coisa diferente de "sim".

### Onde ainda há cego, e qual o instrumento adequado a cada um

1. **`functions/api/save.js` — 63,9 % (rodada 7).** O maior que sobrou.
   **Instrumento: mutação direta, sem ferramenta nova.** É o alvo mais fácil que
   restou — `save.test.js` e `pushCareAction.test.js` já chamam o `onRequest`
   real com um KV falso, então a infraestrutura está pronta e a varredura já
   mede código de verdade. O que falta é afirmação sobre **códigos de status,
   `expirationTtl` e a fronteira `> MAX_STATE_BYTES`** — exatamente o tipo de
   coisa que a rodada 9 acabou de trancar do lado do billing. Estimo o mesmo
   padrão: os `{ status: 4xx }` e os literais de tamanho sobrevivendo em bloco.

2. **`functions/api/_entitlements.js` — e aqui o instrumento é OUTRO.** Não é
   mutação: é **um KV falso que mente como o KV de verdade**. O `docs/STATUS.md`
   §1.2 diz, sobre o SEC-3, que *"o teste também dava falsa segurança: usava um
   `Map` em memória, que é fortemente consistente e nunca reproduz a leitura
   obsoleta"*. Isso continua valendo — todo teste de billing desta rodada,
   inclusive os meus, usa esse mesmo `Map`. **A atomicidade do `claimOrder` está
   verde num substrato que não pode falhar do jeito que o Workers KV falha.** O
   instrumento certo é um fake com janela de consistência eventual configurável
   (leitura servindo valor obsoleto por N ms, inclusive para chave inexistente),
   e então reexecutar o cenário "1 recibo, N contas". Enquanto isso não existir,
   o SEC-3 está marcado ✅ com base num teste que **não consegue reproduzir o
   ataque**. É o maior risco de dinheiro que sobrou no repositório, e mutação
   não o encontra — nenhum mutante muda a consistência do armazenamento.

3. **`dailyReset.ts:358–386`** — o bloco de evolução automática inalcançável por
   `MANUAL_EVOLUTION` (12 mutantes, conhecidos desde a rodada 7). Continua sendo
   ticket, não teste: ou a flag vira configuração testável, ou o bloco sai.
   Regra viva guardada em código que não roda é dívida.

### Recomendação de registro

`docs/STATUS.md` §1.2 merece uma linha nova sob o SEC-3, dizendo que a correção
segue **sem prova sob consistência eventual**. Não editei o arquivo porque outro
agente estava mexendo na árvore durante a rodada e um conflito ali é pior do que
a ausência da nota.

---

## 9. Como repetir

```bash
node scripts/mutation-sweep.mjs _billing      # esperado: 119/131 (90,8%)
node scripts/mutation-sweep.mjs carePattern   # esperado: 43/45  (95,6%)
```

Um alvo por vez, em série, **com o repositório limpo e ninguém mais escrevendo
nele**. Se o processo morrer no meio, rode de novo: a recuperação pelo
`.mutation-bak` restaura o arquivo antes de começar — mas confira o `git diff`
do alvo de qualquer jeito.
