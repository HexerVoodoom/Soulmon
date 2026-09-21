<!-- doc-historico -->
# ADR-001 — Mesma conta, mesmo save, em qualquer plataforma

**Dono:** `alpha-architect` (autor original); custódia em `docs/adr/`: `doc-mantenedor`
**Data:** copiado para o repo em 21/09/2026 (QA GERAL #35); a data da decisão está no corpo
**Estado:** `registro` — cópia FIEL de `squad-alpha-runs/soulmon-02/adr-conta-e-save.md` (pasta fora do git, `.gitignore`); o corpo abaixo NÃO foi reescrito, e cita código por `arquivo:linha` como estava na época — linhas escorregaram, procure pelo SÍMBOLO
**Verificação:** `git ls-files docs/adr` (existe no git) · `diff <(tail -n +14 docs/adr/ADR-001-conta-e-save.md) squad-alpha-runs/soulmon-02/adr-conta-e-save.md` (corpo idêntico ao original, enquanto a pasta local existir)
**Não cobre:** o estado atual do código — para isso leia a linha "Vale em" abaixo e o `docs/manual/05-ARQUITETURA.md`
**Precedência:** código > teste > `CLAUDE.md` > manual > esta ADR

**Vale em 21/09/2026?** Parcialmente. `saveId` único e paridade tripla (`functions/api/saveId.parity.test.js`) estão feitos; **`revision` + 409 (§3) e `GET /api/whoami` (§2) NÃO existem** (`grep -rn revision functions/api/save.js` → 0; `grep -rln whoami functions/api/*.js` → 0). Adiado pelo dono ("UI antes de infra"). Fonte: `docs/reviews/2026-09-21-qa-geral/05-arquitetura.md` §8.

---
# ADR-001 — Mesma conta, mesmo save, em qualquer plataforma

**Status:** proposta (aguarda a fatia 1 — painel do dono)
**Data:** 25/ago/2026 · **Decisor:** dono (Mateus) · **Autor:** `alpha-architect`, run `soulmon-02`
**Revisões:** 26/ago/2026 — duas decisões do dono incorporadas no corpo (não como apêndice):
o `GET /api/whoami` entra **junto da fatia 1** (§2) e o **409 renova o `expirationTtl`** (§3).

## Contexto

O dono declarou **fundamental**: Android · web/PWA · Steam, mesma conta, mesmo save.
Estado verificado hoje:

| Fato | Evidência |
|---|---|
| `saveId = SHA-256("soulmon:"+email).slice(0,32)` | `src/utils/cloudSave.ts:19-22`, `functions/api/_auth.js:88-95` |
| A autorização está **desligada** (fail-open) | `_auth.js:116` (era `:112-113`; conferido em 26/08/2026) — `if (!projectId) return { ok: true, enforced: false }` |
| O login também está desligado no cliente | `src/utils/auth.ts:29-31` — `isAuthConfigured()` é false sem `VITE_FIREBASE_*` |
| O desktop **reimplementa** a derivação | `desktop/renderer/src/cloudSync.ts:57-60` (footgun 9; paridade só em `cloudSync.test.ts`) |
| Não há merge de save: o POST **substitui a chave inteira** | `functions/api/save.js:101` — `KV.put(saveId, serialized, { expirationTtl })` (era `:97`; conferido em 26/08/2026) |
| Teto de 5 MB por save, TTL de 1 ano **renovado a cada `put`** | `save.js:31`, `save.js:101` (ver a decisão de TTL × 409 no §3) |
| `accountTier`/`credits` são do servidor, removidos do que o cliente manda | `save.js:24`, `save.js:95` |
| O overlay Electron **nunca funcionou fim-a-fim** | `contexto.md` §8 |

**A força que exige decidir agora:** enquanto o `FIREBASE_PROJECT_ID` não existe, o `saveId`
é ao mesmo tempo **identificador e senha**. Quem souber o e-mail lê e sobrescreve o save.
Zero usuários de terceiro hoje — é a única janela em que isto sai de graça. Depois do Steam,
não sai.

**Restrições duras que a decisão respeita:** ~R$ 200/mês (§4) · não tocar em `digiapp-a5e`
nem em variável de produção (fatia 1 é do dono) · PWA precisa funcionar **offline** ·
`dist/` commitado · nenhuma dependência nova que um dev solo não consiga operar.

---

## Decisão

### 1. Identidade — uma conta = um e-mail verificado. O `saveId` continua derivado, e passa a ser público-inócuo.

Nada de tabela de usuários, nada de UUID novo, nada de migração de chave. O que muda é que
o `saveId` **deixa de autorizar**: quem autoriza é o ID token do Firebase, que já é
verificado à unha em `_auth.js:44-84`. O `saveId` vira um endereço, não um segredo.

Consequência de manter a derivação: **trocar de e-mail = trocar de save.** Aceitável
enquanto e-mail for a única forma de login e existirem 0 usuários.

> **✅ VERIFICADO em 26/08/2026 — o "0 usuários" deixou de ser suposição.**
>
> Sonda de leitura no namespace KV `aed229e0…` (`wrangler kv key list`, nada escrito):
> **181 chaves, das quais 4 são hashes derivados de e-mail** — e os contadores que só
> existem quando alguém paga ou usa IA estão todos zerados:
>
> ```
> ent: 0     (nenhum entitlement)
> ai:  0     (nenhum contador de IA)
> ord: 0     (nenhum pedido)
> ```
>
> O save órfão sob o salt antigo `digiapp:` **existe e foi confirmado** (o e-mail do dono
> resolve para `aff9475f…`, presente; sob `soulmon:` seria `b76bcd8d…`, ausente) — mas o
> conteúdo tem **forma de legado do DigiApp**, não de Soulmon. Não é progresso de Soulmon
> preso.
>
> Havia um quarto candidato com forma de Soulmon (`66a6e7ba…`, 15,9 KB) que não bate com o
> e-mail do dono sob nenhum dos dois sais. **O dono confirmou que nunca houve pagantes e que
> aquilo foi teste.**
>
> **Consequência: a pendência "sonda do save órfão sob o salt antigo `digiapp:`" está
> ENCERRADA.** Ela deixa de bloquear a fatia 1, e não há migração de chave a fazer. O que
> reverteria esta decisão continua sendo o §7 (Steam), não o histórico. Não é aceitável depois do
Steam — ver §7 e "O que reverteria".

### 2. O `saveId` tem UM dono no código, e o desktop deixa de reimplementá-lo

Footgun 9 em estado puro: três cópias (`cloudSave.ts`, `_auth.js`, `desktop/.../cloudSync.ts`)
de uma regra cuja divergência **não dá erro nenhum** — o overlay lê um save inexistente e
mostra um bicho genérico. Já aconteceu uma vez, com o salt `digiapp:`.

**Decisão:** o cliente para de derivar `saveId` para **autorizar** qualquer coisa. O servidor
ganha `GET /api/whoami`, que recebe `Bearer <idToken>`, deriva o `saveId` do e-mail do token
e devolve. O cliente e o desktop **perguntam** em vez de calcular.

```
GET /api/whoami
Authorization: Bearer <firebase-id-token>

200 → { "saveId": "a1b2c3…", "email": "x@y.com", "tier": "paid"|"demo", "credits": 12 }
401 → { "error": "unauthenticated" }      token ausente, expirado, ou e-mail não verificado
503 → { "error": "auth-not-configured" }  a fatia 1 ainda não existe (ver §8)
```

Idempotente, sem efeito colateral, cacheável só na memória do cliente (nunca em disco: o
token expira em 1h). Timeout de cliente: 5 s; falhou ⇒ cai no caminho offline do §5.

> **✅ DECIDIDO em 26/08/2026 — o `whoami` é construído JUNTO com a fatia 1, e não antes.**
>
> A pergunta que estava de pé não era "vale a pena?", era "quando, e de quem é?". As duas
> partes agora têm resposta.
>
> **Quando: junto da fatia 1, nem antes nem depois.** O endpoint não tem o que responder
> enquanto o Firebase não existir — sem `FIREBASE_PROJECT_ID` ele só sabe devolver o 503 do
> contrato acima, e um endereço que só devolve 503 não destrava consumidor nenhum. No
> instante em que a fatia 1 sobe, porém, o servidor **já** derivou o `saveId` do e-mail do
> token para autorizar a requisição (`_auth.js:123`): expor esse valor que ele já calculou é
> um `Response.json` a mais no mesmo caminho de código. **O custo marginal é próximo de zero
> exatamente na hora em que o valor deixa de ser zero** — construir antes é pagar cedo por
> nada, construir depois é deixar a auditoria do desktop parada por um `Response.json`.
>
> **Por que não há pressa antes disso: o F-1 foi resolvido sem ele.** `sprite-incremental.md:154`
> registrava o `whoami` como bloqueio da ocasião A, e essa premissa caiu — a pergunta que
> bloqueava a ocasião A era **do acervo, não de identidade**, e `isNewbornLibrary`
> (`utils/spriteLibrary.ts:184`, chamada em `App.tsx:654`) a responde inteira, no cliente,
> sem rede e sem token. O que sobra querendo o `whoami` é a auditoria do desktop
> (`HANDOFF.md:93`) e o §2 desta ADR — os dois legítimos, nenhum urgente, e os dois vivendo
> dentro do mundo pós-fatia-1 de qualquer jeito.
>
> **O que fica registrado como aprendizado de processo, e é a parte que se repete:** este
> endpoint passou uma sessão inteira com **dois consumidores e zero donos**
> (`gate-fatia2.md:224-231`). Duas frentes declararam-se bloqueadas pelo mesmo endereço
> inexistente, nenhuma o adotou, e ele não estava nem nas pendências do dono nem na fila.
> **Essa é a configuração em que nada é construído** — não por falta de prioridade, mas
> porque cada frente vê o item como custo alheio e benefício próprio, e ninguém paga. Duas
> frentes bloqueadas por uma peça sem dono não geram pressão somada; geram duas frentes
> permanentemente "quase prontas". A regra que sai daqui: **dependência citada por duas
> frentes recebe dono nomeado no ato da segunda citação**, mesmo que o dono só a construa
> depois. Anexar o `whoami` à fatia 1 é exatamente isso — ele deixa de ser de todos, o que é
> o mesmo que de ninguém, e passa a ser um item da fatia 1.

A derivação local **continua existindo** como caminho offline e como fallback enquanto
`isAuthConfigured()` for false, mas nunca mais é a fonte da verdade quando há rede + token.
`_auth.js:emailToSaveId` é o dono; `cloudSave.ts` e `cloudSync.ts` mantêm a cópia **só** com
o teste de paridade que já existe, e ganham comentário dizendo que é cópia de emergência.

### 3. Conflito entre dispositivos: `revision` monotônico, e o servidor recusa escrita cega

Hoje o último POST vence, silenciosamente. Dois aparelhos abertos = o save do celular apaga
a sessão do desktop, sem erro. Com Steam isto vira rotina (PC + celular no mesmo dia).

**Decisão: `revision` + `baseRevision` no POST.** Não é CRDT, não é merge automático, não é
serviço novo. É um inteiro.

- O registro na KV passa a ser `{ revision, updatedAt, deviceId, state }`.
- `GET /api/save` devolve `revision`. O cliente guarda em memória.
- `POST /api/save` manda `baseRevision`:
  - igual ao da KV ⇒ grava, `revision+1`, devolve `{ ok: true, revision }`.
  - diferente ⇒ **409**, com o estado do servidor no corpo. **Não grava nada.**
- Sem `baseRevision` (APK e overlay já instalados) ⇒ grava como hoje e o servidor **loga**
  `save: escrita sem baseRevision`. Retrocompatibilidade explícita, com prazo: 30 dias
  depois do APK novo publicado, escrita sem `baseRevision` passa a **412**.

> **✅ DECIDIDO em 26/08/2026 — o 409 renova o TTL mesmo recusando a escrita.**
>
> O achado é do `architect/preparo-fatia1.md:367-372`, e ele é do tipo que só aparece quando
> duas peças corretas se encostam. Sozinhas, as duas estão certas:
>
> 1. O `expirationTtl` de 1 ano é passado **em cada `put`** (`functions/api/save.js:101` —
>    `put(saveId, serialized, { expirationTtl: 86400 * 365 })`). A KV não tem "renovar TTL";
>    o TTL é atributo da escrita. Logo, **o relógio de expiração do save é o relógio da
>    última escrita bem-sucedida**, e o desenho implícito é "some 1 ano depois do último
>    gesto" — uma coleta de lixo por inatividade, plausível e barata.
> 2. Com `revision`, um 409 **não grava nada** (é o ponto do §3: escrita cega é o defeito que
>    o 409 existe para recusar).
>
> Encostadas, elas produzem um caso que ninguém desenhou: **o aparelho que joga e perde todas
> as disputas de escrita nunca renova o próprio TTL.** O jogador que mantém celular e PC no
> mesmo save, ativo em ambos, e cujo aparelho B chega sempre por último, vê o save expirar por
> inatividade — enquanto joga. O relógio da inatividade é alimentado por escrita, e o 409
> tirou dele a única escrita que ele fazia.
>
> **A decisão sai de uma leitura do que cada código de resposta significa**, e é isso que a
> torna simples: **409 significa "seu dado está velho". Não significa "você sumiu".** São
> afirmações sobre eixos diferentes — uma sobre a *versão* do estado, outra sobre a
> *presença* do jogador —, e o desenho atual deixa a primeira decidir a segunda por acidente
> de implementação. Um 409 é, na verdade, a **prova mais forte que existe de presença**: só
> toma 409 quem tentou escrever, e só tenta escrever quem está jogando. Deixar essa
> requisição encurtar a vida do save é ler o sinal exatamente ao contrário.
>
> **O que o servidor passa a fazer:** ao recusar por `baseRevision` divergente, antes de
> devolver o 409 ele reescreve o registro **inalterado** (mesmo `state`, mesma `revision`,
> mesmo `updatedAt`) com o `expirationTtl` de sempre. Nada do conteúdo muda; o que muda é o
> relógio. **Custa uma escrita de metadado** — não um `get`, não um caminho novo, não uma
> peça de infra: o valor já está em memória, porque o 409 precisa devolvê-lo no corpo de
> qualquer forma. O 409 continua sendo, para o cliente, exatamente o que a tabela abaixo diz.
>
> **Duas consequências que ficam escritas, para ninguém "consertar" depois:**
>
> - Isso **acelera o gargalo de escrita por chave** do §Consequências (1 escrita/s por chave
>   na KV): agora até o perdedor da disputa escreve. Na prática, o cenário que gera 409 em
>   série é o mesmo que já satura a chave — o 409 não cria o problema, participa dele. O
>   gatilho do Durable Object não muda.
> - **Um 401/403 NÃO renova o TTL**, e isso é deliberado. Quem não prova ser dono do save não
>   pode manter o save vivo: seria uma alavanca de graça para qualquer um segurar
>   indefinidamente o save de outra pessoa. A renovação é privilégio de requisição
>   **autenticada e autorizada** que apenas chegou tarde — 409 e 413, não 401/403.

**Contrato completo do POST:**

| Código | Quando | Corpo | O cliente faz |
|---|---|---|---|
| 200 | gravou | `{ ok: true, revision }` | atualiza a `revision` local, carimba `LAST_CLOUD_SYNC` |
| 400 | `state` não é objeto, ou id conflitante | `{ error }` | não retenta (bug do cliente) |
| 401 | sem token / token inválido | `{ error: "unauthenticated" }` | tenta renovar o token **uma vez**, depois vira pendência offline |
| 403 | token válido, `saveId` de outro | `{ error: "forbidden" }` | **não retenta**; força re-login |
| 409 | `baseRevision` divergente | `{ error: "conflict", revision, state }` | diálogo do §4 |
| 412 | sem `baseRevision` (depois do prazo) | `{ error: "revision-required" }` | força atualização do app |
| 413 | acima de 5 MB | `{ error: "State too large" }` | **poda** e reenvia (ver §9) |
| 500/502/504 | falha nossa ou do KV | `{ error }` | backoff exponencial 2s/8s/30s, teto 3, depois pendência offline |

**Idempotência:** o POST é idempotente por `(saveId, baseRevision)` — reenviar o mesmo par
depois de um 200 perdido na rede devolve 409 com `revision` já avançada, e o cliente vê que
o estado do servidor **é o dele**; nesse caso (comparação de igualdade do `state`) ele aceita
em silêncio, sem diálogo. Sem essa regra, toda rede ruim vira um diálogo de conflito falso.

**Limitação honesta e declarada:** a KV do Cloudflare é **eventualmente consistente**
(propagação de até ~60 s) e **não tem compare-and-swap**. O `baseRevision` fecha a janela de
**minutos e horas** (o caso real: celular de manhã, PC à noite); **não** fecha a janela de
segundos. Fechá-la exige Durable Object — peça nova, custo operacional novo, para um problema
que um jogador sozinho quase nunca cria. Não entra agora; o gatilho está no fim.

### 4. Resolução do 409: o jogador escolhe, uma vez, com as duas datas na frente

Nada de merge automático de `GameState`. O save tem contadores que **só crescem**
(`perfectDays`, `totalPerfectDays`, `dungeonKills`, `habitRhythms.totalDone`) e listas que
**podem encolher legitimamente** (`tasks` — concluir REMOVE o item, `CLAUDE.md` §Foco do dia).
Um merge campo a campo escolheria "o maior" e **ressuscitaria tarefa concluída no outro
aparelho**. Isso não é conflito resolvido, é bug com cara de feature.

**Decisão: o 409 abre um diálogo com duas opções e nenhum padrão silencioso** (PT-BR + EN,
obrigatório):

| | PT-BR | EN |
|---|---|---|
| Título | Seu bicho andou jogando em outro lugar. | Your companion has been playing somewhere else. |
| Corpo | Aqui: {n} dias perfeitos, visto {data}. Lá: {m} dias perfeitos, visto {data}. | Here: {n} perfect days, last seen {date}. There: {m} perfect days, last seen {date}. |
| A | Continuar deste aparelho | Continue from this device |
| B | Trazer o progresso de lá | Bring the other progress |

**Regra de segurança inegociável:** antes de aplicar qualquer lado, o lado **perdedor** é
gravado em `localStorage` sob `digiapp_state_conflict_<ISO>` (teto de 2 cópias, a mais antiga
cai) via `safeStorage.writeLocal` — nunca `setItem` cru, pela lição já documentada em
`cloudSave.ts`. Perder progresso é o único dano do jogo que o produto não sabe consolar.

`accountTier` e `credits` **nunca** entram no diálogo: vêm do entitlement do servidor nos dois
lados (`save.js:76-79`). Escolher "o lado com mais créditos" seria dar dinheiro de graça.

### 5. Offline é o modo normal, não a exceção

A PWA já funciona assim por acidente feliz: o `localStorage` é a fonte da verdade local
(`GameStateContext`) e o cloud save é um espelho com debounce de 3 s. **Isto vira decisão
registrada, para ninguém "consertar" no futuro.**

- **Toda regra de jogo é local e pura**: virada do dia, cocô, evolução, constância, sonhos,
  triagem. Nenhuma consulta rede — já é assim (`utils/dailyReset.ts`, `poopDrain.ts`,
  `habitRhythm.ts`, `restWindow.ts`) e **continua sendo**. É o que faz o app funcionar no metrô.
- **O que exige rede é exatamente três coisas**: comprar (`billing.js`), gerar sprite
  (`generate-sprite.js`) e falar com o pet (`chat.js`). As três degradam sem bloquear —
  o sprite tem o piso da reserva (Invariante nº 1 da `spec-geracao-incremental.md`).
- **Fila de saída de UM elemento.** O save é um snapshot completo; enfileirar N snapshots é
  guardar N-1 lixos. Ao voltar a rede: `GET` para ler `revision` → bateu, `POST`; não bateu,
  diálogo do §4. **Nunca um POST cego.**
- **Login expirado offline: o app continua jogando.** `getIdToken()` falha ⇒ o cloud save fica
  pendente, `LAST_CLOUD_SYNC` **não** é carimbado (comportamento já correto,
  `cloudSave.ts:38-45`) e a UI mostra "não sincronizado desde {data}" — nunca bloqueio de tela.
- **Aparelho novo, primeiro login, sem rede: recusa, com texto.** Adotar save da nuvem é o
  único caminho que substitui o estado inteiro; fazê-lo sem confirmação do servidor é apagar
  o save local por otimismo. PT: "Precisamos de internet só desta vez, para achar seu bicho."
  / EN: "We need the internet just this once, to find your companion."
- **O service worker (`public/sw.js`) nunca cacheia `/api/save`.** Resposta de save em cache
  é um save velho servido como novo. Se alguém acrescentar uma rota nova de estado, ela entra
  na denylist junto — e o `CACHE_VERSION` sobe.

### 6. Duas plataformas escrevendo no mesmo save — caso a caso

| Cenário | Comportamento decidido |
|---|---|
| Celular e PC abertos, ambos escrevem em minutos | O segundo toma **409** e cai no diálogo do §4. |
| Overlay Electron marca tarefa com o app web aberto | O overlay é **controle remoto** (`CLAUDE.md` §Desktop). Passa a mandar `baseRevision` e, no 409, **não abre diálogo nenhum**: recarrega do servidor, reaplica a MESMA ação por `careRules.ts` (que já é a fonte única) e reenvia, no máximo **2 vezes**. Falhou 2× ⇒ mostra "abra o app" e **não escreve**. Um overlay não tem tela para resolver conflito; inventar uma seria pior que não ter. |
| Steam Cloud + nosso KV | **Steam Cloud DESLIGADO.** Ver §7.2. |
| Dois aparelhos no mesmo segundo | O último vence, como hoje. Limitação declarada (§3). |
| Dois aparelhos disparam a MESMA geração de sprite | Dedupe no **servidor**, por chave — ver `custo-geracao-sprite.md` §5. |
| Falha parcial: POST 200 mas a resposta se perde | Reenvio devolve 409 com o estado igual ⇒ aceita em silêncio (§3, idempotência). |
| Falha parcial: entitlement lido, KV de save fora do ar | O `GET` devolve 500. O cliente **joga com o local** e mantém a pendência. Nunca zera o save por 500. |

### 7. Onde o Steam entra (`soulmon-05`)

1. **O Steam NÃO vira uma segunda identidade.** SteamID não deriva save. O app no Steam faz o
   **mesmo login por e-mail** que a web faz. Quem instala pelo Steam e já jogou no celular
   digita o e-mail e encontra o bicho. Duas identidades exigiriam vínculo, desvínculo, fusão
   de saves e a pergunta "qual dos dois é o de verdade" — três telas e uma classe inteira de
   bug de suporte, para um dev solo com 0 usuários.
2. **Steam Cloud (Auto-Cloud) DESLIGADO no App Admin.** Ligado, ele sincroniza o
   `localStorage` do Electron por baixo dos panos e cria uma **segunda fonte da verdade sem
   `revision`** — duas nuvens disputando o mesmo save, e a que perde perde em silêncio.
3. **Steam Microtransactions fora do escopo inicial.** `_billing.js:claimOrder` já garante
   "um comprovante vale para uma conta só"; um segundo provedor é um segundo `claimOrder` e
   uma segunda superfície de fraude. Se a build do Steam for paga na loja, a compra concede
   `accountTier:'paid'` por **caminho de resgate**: a Steam entrega uma chave, o jogador a
   informa no app, o servidor a queima em `ent:<saveId>`. Chave é `claimOrder` com outro nome
   — reaproveita a regra que já tem teste, em vez de escrever uma segunda.
4. **O overlay precisa funcionar fim-a-fim ANTES de qualquer conversa de Steam.** Ele nunca
   funcionou (`contexto.md` §8) e `docs/PLANO-DESKTOP-STEAM.md` foi escrito sob a premissa
   falsa de que funcionava. Publicar um controle remoto que não controla nada compra
   avaliação negativa por US$ 100.

### 8. O que precisa existir na fatia 1 — a lista que o dono leva para o painel

Nada aqui foi assumido como pronto. Entrada de `docs/DEPENDE-DE-VOCE.md`:

| | O quê | Onde | Sem isso |
|---|---|---|---|
| 🔴 | **Projeto Firebase próprio do Soulmon** (não o do DigiApp) com **Email link (passwordless)** habilitado | Firebase Console → Authentication → Sign-in method | Não existe login. `isAuthConfigured()` false. |
| 🔴 | **`FIREBASE_PROJECT_ID`** como variável do Pages (runtime) | CF Pages → Settings → Environment variables | `_auth.js:113` continua **fail-open**: qualquer um lê e escreve qualquer save. |
| 🔴 | **`VITE_FIREBASE_API_KEY` / `_AUTH_DOMAIN` / `_PROJECT_ID` / `_APP_ID`** no build do Pages (build-time) | idem | O cliente nunca manda `Authorization` — e aí ligar a variável acima **derruba o app inteiro com 401**. Os dois sobem juntos, **o cliente ANTES**. |
| 🔴 | **Domínios autorizados** do Auth: o `*.pages.dev` novo, o do APK e o `file://` do Electron | Firebase → Authentication → Settings → Authorized domains | O link de e-mail não completa; o Electron nunca autentica (`save.js:16-19` já anuncia `Authorization` no CORS por causa dele). |
| 🟠 | **Projeto Cloudflare Pages próprio**, com o binding KV `DIGIAPP_SAVES` apontado para um namespace **NOVO** | CF → Workers & Pages | Namespace compartilhado com o DigiApp = mesma origem = a cota de `localStorage` enche para os dois (é o `QuotaExceededError` já documentado em `cloudSave.ts`). |
| 🟠 | Confirmar o **plano de imagem** contratado (Higgsfield) | ver `custo-geracao-sprite.md` | O teto por conta fica sendo chute. |
| 🟡 | `FIREBASE_SERVICE_ACCOUNT` como secret do wrangler no worker de push | `workers/` (deploy manual) | FCM nativo não entrega. |

**Ordem de ligação — reversível até o passo 4:**

1. Criar o projeto Firebase + habilitar email link. *(Reversível: nada no app muda.)*
2. Publicar o app com `VITE_FIREBASE_*` definidos. O login **aparece e é opcional** — quem não
   logar continua jogando exatamente como hoje. *(Reversível: apagar as variáveis, republicar.)*
3. Observar alguns dias: o token chega no `Authorization`? O `whoami` devolve o mesmo `saveId`
   que o cliente já usava? *(Reversível.)*
4. **PONTO DE NÃO RETORNO — ligar `FIREBASE_PROJECT_ID` no servidor.** Daqui em diante,
   requisição sem token válido toma 401. Um cliente publicado sem o passo 2 quebra na hora.
5. Depois de 30 dias, escrita sem `baseRevision` passa de "log" para **412**.

### 9. Tamanho do save — o gargalo previsível, com volume

O teto é **5 MB** (`save.js:31`). Um sprite pixelizado 256×256 em data URL PNG pesa
**~40–90 KB**. A árvore tem 11 formas. **11 × 90 KB ≈ 1 MB** — cabe, com folga de 5×.

Mas o save vai para o `localStorage` também, e a cota do `localStorage` é de **~5 MB por
origem, compartilhada com o DigiApp hoje**. É lá que estoura primeiro, e estourar lá é o
`QuotaExceededError` que já derrubou o botão de adoção uma vez.

**Decisão:** sprites gerados **não** ficam em data URL dentro do `GameState`. Ficam como
**URL** (o Higgsfield já devolve URL, `generate-sprite.js:96-98`), e o app guarda a URL + um
cache no Cache Storage do service worker, que **não** compete com a cota do `localStorage`.
Só o caminho Gemini devolve data URL (`generate-sprite.js:139`) — nesse caso o servidor
**republica** a imagem em `R2` ou reenvia como URL, nunca deixa o base64 chegar ao save.
Fallback se nada disso existir na fatia 1: no máximo **3** data URLs no save (atual, próxima,
anterior), as demais formas caem na reserva.

**413 é tratado, não ignorado:** ao receber 413, o cliente poda `completedTasks` e
`activityLog` para os últimos 90 dias (limite que `carePattern.ts` já usa) e reenvia uma vez.

---

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| **UUID de conta + tabela de usuários** (Supabase, já em `package.json`) | E-mail vira atributo e não chave: trocar de e-mail preserva o save; suporta Steam/Apple/Google como identidades múltiplas | Banco novo para operar, migração de todas as chaves KV, uma segunda fonte da verdade sobre "quem é o usuário", os 2 usuários do DigiApp para migrar | Resolve um problema que ainda não existe (0 usuários, 1 provedor de login) e cria custo operacional permanente para um dev solo. É a alternativa **certa** se o Steam trouxer identidade própria — está registrada como gatilho de reversão. |
| **Merge automático campo a campo** ("o maior vence") | Zero fricção, sem diálogo | Ressuscita tarefa concluída no outro aparelho (`completeTask` REMOVE de `tasks`); "o maior" é indefinível para `equippedDecor`, `foodInventory`, `lastDayReport`, `evolutionLocked` | Produz corrupção silenciosa no lugar de conflito visível. Conflito visível uma vez é melhor que dado errado para sempre. |
| **Durable Object por save** (CAS de verdade) | Fecha a janela de segundos; serialização real; cabe `revision` sem gambiarra | Peça de infra nova (~US$ 0,15/M req + duração), um modelo de execução a mais para o dono operar, e o save deixa de ser legível por um `wrangler kv get` | Compra a janela de segundos, que um jogador solo quase nunca abre. Fica na gaveta, com gatilho declarado. |
| **Steam Cloud como sincronizador** | De graça, nativo, testado por milhões | Segunda fonte da verdade sem `revision`; sincroniza arquivo, não estado; não conhece o celular | Duas nuvens disputando o mesmo save é a definição de perda silenciosa de progresso. |
| **Continuar fail-open até ter usuários** | Custo zero hoje | O `saveId` deriva do e-mail: o "segredo" é adivinhável por qualquer conhecido. Depois do Steam, ligar a autorização vira migração com usuários dentro | 0 usuários é a **única** janela barata. Não usá-la é escolher pagar caro depois. |
| **Código de save copiável** (v-pet clássico) | Funciona offline, sem Auth, sem Firebase, sem custo | O jogador guarda um segredo de 32 chars; perdeu, perdeu o bicho | Move o problema de identidade para dentro da cabeça do usuário — exatamente o que o produto diz não fazer. |

---

## Consequências

**Aceitamos de bom:** o save fica protegido de verdade (o `saveId` deixa de ser senha) · uma
identidade só nas três plataformas · conflito vira uma pergunta em vez de uma perda · offline
continua sendo o modo normal, agora por contrato escrito · o footgun 9 do desktop deixa de
poder divergir em silêncio (o servidor responde, o cliente não calcula) · nenhuma peça de
infraestrutura nova.

**Aceitamos de ruim, e fica escrito:**

- **Trocar de e-mail continua trocando de save.** Não há caminho de migração. Com 0 usuários é
  gratuito; a partir do primeiro pagante, é uma dívida com nome.
- **A janela de segundos continua aberta.** Dois aparelhos no mesmo instante: o último vence.
- **O jogador vê um diálogo de conflito.** É fricção real num jogo cuja tese é não cobrar.
  Mitigado por ser raro e por **nunca** destruir o lado perdedor.
- **Dependência dura de Firebase Auth.** Se o Google mudar preço ou endpoint JWK, o login para.
  `_auth.js` é implementação própria contra o JWK: o acoplamento é a um **formato de token**,
  não a um SDK — é o mais barato que dá para ficar.
- **Uma chamada a mais no boot** (`whoami`). Fica fora do caminho crítico do primeiro render:
  o app abre com o save local e reconcilia depois.
- **Custo de infra desta ADR: R$ 0/mês.** Firebase Auth email-link é gratuito na faixa
  relevante; KV e Pages Functions ficam no free tier com dezenas de usuários. **O que dobra o
  custo não é usuário** — é geração de imagem (documento separado) e, muito depois, leitura de
  KV (US$ 0,50/M leituras), que só aparece em milhares de DAU.

**Gargalo nomeado, com volume:** a KV do Cloudflare suporta **1 escrita por segundo por
chave**. Com debounce de 3 s (`GameStateContext`), um aparelho fica em ~0,33 escrita/s. **Três
aparelhos ativos no mesmo save saturam a chave** e a KV passa a descartar escrita
silenciosamente. Volume de aparecimento: **3 sessões simultâneas no mesmo save** — só acontece
com o Steam no ar. É o mesmo sinal que compra o Durable Object.

**Segundo gargalo, com volume:** teto de 5 MB por save e ~5 MB de `localStorage` por origem.
Com sprite embutido em data URL, **11 formas × ~90 KB ≈ 1 MB** — cabe, mas some com a folga
que hoje absorve `completedTasks` e `activityLog`. É por isso que o §9 tira o data URL do save.

---

## O que reverteria esta decisão

- **O Steam exigir identidade própria** (login por SteamID sem e-mail, por política da Valve ou
  porque a fricção do e-mail derruba a conversão na loja) ⇒ o `saveId` derivado de e-mail morre
  e vira UUID + tabela de contas. A alternativa 1 volta inteira.
- **Um pedido real de troca de e-mail** de alguém que pagou ⇒ mesma coisa: conta com chave estável.
- **409 frequente** — o sinal concreto: mais de ~1 conflito por usuário ativo por semana, medido
  por contador do servidor. ⚠️ **Não há telemetria coletando** (briefing), então este número
  exige a telemetria ligada antes de significar qualquer coisa. ⇒ Durable Object.
- **A KV perder escrita** (log de `save` com 200 e o `GET` seguinte devolvendo estado velho) ⇒
  Durable Object imediatamente, sem esperar o número acima.
- **O `whoami` virar gargalo de latência no boot** ⇒ o cliente volta a derivar localmente e usa
  o `whoami` só para conferir em segundo plano; o servidor continua dono da autorização.
- **Firebase Auth deixar de ser gratuito na nossa faixa** ⇒ trocar o provedor de identidade sem
  trocar o modelo: o contrato é "um JWT com `email` verificado", e `_auth.js` é 40 linhas.

---

## Perguntas endereçadas ao dono (`docs/DEPENDE-DE-VOCE.md`)

| | Pergunta | Impacto |
|---|---|---|
| 🔴 | Autoriza a sequência de 5 passos do §8, sabendo que o **passo 4 é o ponto de não retorno** e exige o passo 2 já publicado? | Sem isso, `_auth.js:113` fica fail-open indefinidamente — é o achado de segurança mais antigo em aberto. |
| 🔴 | O binding `DIGIAPP_SAVES` do projeto Pages novo aponta para um namespace KV **novo** ou para o mesmo do DigiApp? | Mesmo namespace = mesma origem = a cota de `localStorage` e o risco de colisão continuam de pé. |
| 🟠 | Aceita que **trocar de e-mail = perder o save** enquanto não existir tabela de contas? | É a dívida que o Steam pode cobrar. |
| 🟠 | Confirma **Steam Cloud DESLIGADO** no App Admin quando `soulmon-05` começar? | Ligado por padrão, cria uma segunda nuvem sem `revision`. |
| 🟡 | O overlay Electron entra em `soulmon-05` **consertado**, ou é cortado da build do Steam? | Ele nunca funcionou fim-a-fim; publicar quebrado custa avaliação. |

## Handoffs

→ **`alpha-backend`**: `GET /api/whoami` (**entra junto da fatia 1**, §2); **renovar o `expirationTtl` no caminho do 409** (§3); `revision`/`baseRevision` em `/api/save`; a tabela de
códigos do §3; 412 depois do prazo; nunca deixar data URL de imagem entrar no save (§9).
→ **`alpha-frontend`**: diálogo de conflito (PT+EN), fila de saída de 1 elemento, backup do lado
perdedor via `safeStorage`, recusa explícita de adoção offline, denylist de `/api/save` no `sw.js`.
→ **`alpha-qa`** (pontos de falha a testar): POST sem `baseRevision`; 409 com os dois lados não
vazios; reenvio após 200 perdido (**não** pode abrir diálogo); token expirado offline; adoção de
save sem rede (deve recusar); 413 com poda; paridade `_auth.js` × `cloudSave.ts` ×
`desktop/cloudSync.ts`; overlay tomando 409 duas vezes seguidas.
→ **`alpha-estrategista-negocio`**: custo desta ADR = **R$ 0/mês**; o que dobra custo está no
documento de geração de sprite.
→ **Gate:** `alpha-skeptic`.
