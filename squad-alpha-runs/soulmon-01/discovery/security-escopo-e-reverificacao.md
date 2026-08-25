# Segurança — escopo de dados + reverificação dos SEC · run `soulmon-01` · Fase 0

> **P3–P8 respondidas por default do HANDOFF, não por escolha explícita do dono.**
> Auditoria de leitura. Nenhum arquivo de produto foi alterado. Método: leitura de código com
> `arquivo:linha` + **uma sonda HTTP não destrutiva, GET, contra um `saveId` inexistente**
> (nenhum dado de jogador real foi lido, escrito ou coletado).

> ## ⚠️ CORREÇÃO PÓS-GATE (2026-08-25)
>
> Este artefato foi a peça central do FAIL de gate: seu §0 concluía "SIM — explorável HOJE,
> em produção, **contra jogador real**". **Não há jogador real do Soulmon** — zero usuários
> de terceiro. O que a sonda provou continua tecnicamente verdadeiro (a autorização é
> *fail-open*), mas o titular do risco está errado: quem essa exposição atinge, hoje, são os
> **2 usuários reais do DigiApp** (o dono e a namorada dele), porque o Soulmon ainda
> compartilha URL, KV e Firebase com aquele app. Ver `contexto.md` §1/§3 e `DECISOES.md`.
>
> **O que isso muda (ver `gate.md` → Recalibração):** o achado técnico **sobe de importância**,
> não desce — E5/E6 do compliance sobem, e a ordem de prioridade do programa muda: a fatia
> certa é **criar o destino próprio do Soulmon primeiro e ligar a autorização lá, onde não há
> ninguém**, em vez de mexer no `digiapp-a5e` atual, que serve as 2 pessoas reais. A fusão
> "conserto + separação" do `mapa-e-prioridades.md` §3 **inverte de sinal**: não é mais "é
> barato fazer os dois juntos no mesmo host", é "não toque no host que tem gente de verdade".
>
> Correções in loco abaixo (🔧): a frase "contra jogador real" em §0 e as referências
> equivalentes ao longo do documento.

---

## 0. Resposta à pergunta que ordena o programa

### 🔴🔴 SIM — explorável HOJE, em produção. 🔧 Não "contra jogador do Soulmon" (não existe nenhum) — contra os 2 usuários reais do DigiApp, que compartilham esta mesma infraestrutura.

**Prova direta (não é inferência de doc):**

```
$ curl -s -o /dev/null -w "%{http_code}" \
  "https://digiapp-a5e.pages.dev/api/save?id=0123456789abcdef0123456789abcdef"
200   →  {"found":false}
```

Requisição **sem header `Authorization`**. Em `functions/api/save.js:67-70` a autorização roda
**antes** da leitura do KV (`:73`); se `FIREBASE_PROJECT_ID` estivesse configurado,
`_auth.js:118` devolveria `unauthenticated` e a resposta seria **401**. Veio **200**.
⇒ **`FIREBASE_PROJECT_ID` está desligado na produção neste momento** (`_auth.js:112-113`:
`if (!projectId) return { ok: true, enforced: false }` — *fail-open* por desenho).

Corroboração independente: o `dist/` commitado **não contém nenhuma chave `AIza…` nem
`authDomain`** (grep vazio em `dist/`) — o front publicado foi buildado sem `VITE_FIREBASE_*`,
ou seja **não existe login em produção**; logo nenhum cliente conseguiria mandar o Bearer.

**Cadeia de exploração completa, hoje — 🔧 atingindo o `saveId` de qualquer usuário deste
host, hoje isso significa em concreto o dono e/ou a namorada dele, os únicos 2 usuários
reais que salvam neste endpoint:**
1. Atacante conhece o e-mail da vítima (rede social, vazamento, lista de contatos).
2. Deriva `saveId = SHA-256("soulmon:" + email.toLowerCase()).hex.slice(0,32)` — algoritmo
   público em `functions/api/_auth.js:94-99` e duplicado no cliente (`src/utils/cloudSave.ts`)
   e no desktop (`desktop/renderer/src/cloudSync.ts`).
3. `GET /api/save?id=<saveId>` → **lê o save inteiro da vítima**: nome, nome do pet, tarefas
   reais, objetivo/luta pessoal (`soulGoal`/`soulStruggle`), humor, histórico de hábitos,
   janela de sono. Vazamento de dado pessoal, e parte dele é **texto livre sobre vida íntima**
   (o campo `soulStruggle` pergunta com o que a pessoa tem dificuldade).
4. `POST /api/save?id=<saveId>` → **sobrescreve** o save. Perda total de progresso, sem
   backup do lado do jogador (o cliente sincroniza o KV para cima).
5. `GET /api/community?action=trophies&id=<saveId>&claim=1` (`community.js:429-441`) e
   `action=gifts&claim=1` (`:495-506`) → **apagam definitivamente** troféus de season e
   presentes. O próprio código anota: "não tem reemissão".
6. `POST /api/community?action=match` (`:325`) → forja o torneio em nome da vítima.

Todos os `denyUnlessOwner` de `community.js` (`:225-230`) chamam `authorizeSaveAccess` — que
**hoje devolve `ok:true` sem verificar nada**. As correções de SEC-1 existem no código e estão
**inertes em produção**.

**Um atenuante real, e só um:** a correção do **SEC-2 é efetiva e não depende do Firebase** —
o diretório público devolve `pid` derivado (`community.js:81-84,102-111`), não o `saveId`.
Isso fecha a **enumeração em massa** descrita em `STATUS.md:480-486`. O ataque hoje é
**alvo a alvo, exigindo conhecer o e-mail** — não é varredura de 300 jogadores (e, hoje, o
universo de contas reais neste host é 2: o dono e a namorada dele).

**Consequência para o programa de 4 runs, 🔧 corrigida:** o item 2 de `docs/DEPENDE-DE-VOCE.md`
(ligar `FIREBASE_PROJECT_ID`) não é dívida técnica indiferente a prazo, mas também **não é
mais o incidente-contra-jogador-do-Soulmon** que a versão original deste documento descrevia
— porque não há jogador do Soulmon. É um risco real e ativo **sobre o DigiApp** (2 usuários
reais), e a decisão do dono (`DECISOES.md`) foi **não tocar em `digiapp-a5e`** e construir
destino próprio para o Soulmon, ligando a autorização **lá**, onde ainda não há ninguém. Isso
resolve o Soulmon sem mexer no host que hoje serve gente de verdade — e deixa a correção do
próprio `digiapp-a5e` (que protegeria o dono e a namorada) como uma decisão separada e
explícita do dono, não incluída neste programa por padrão.

---

## 1. Reverificação item a item

| Item | Selo em `STATUS.md` | **Veredito desta auditoria** |
|---|---|---|
| SEC-1 — ações de `community.js` sem autorização | ✅ (`:462`) | **PARCIAL — inerte em produção** |
| SEC-2 — `saveId` publicado como identidade social | ✅ (`:464`) | **RESOLVIDO** |
| SEC-3 — `claimOrder` não atômico | ✅ (`:503`) | **NÃO RESOLVIDO** |
| SEC-5 — SSRF no `subscribe` | ✅ (`:465`) | **RESOLVIDO** (com ressalva de deploy) |
| `FIREBASE_PROJECT_ID` desligado | 🔴 | **NÃO RESOLVIDO — confirmado em produção** 🔴🔴 (atinge os 2 usuários do DigiApp, não usuários do Soulmon) |
| D1 `order_claims` + `PLAY_REQUIRE_ACCOUNT_BINDING` | 🟠 | **NÃO RESOLVIDO** (dano potencial de caixa, só se materializa com billing configurado — hoje não está) |
| Keystores no histórico do git | 🔴 | **NÃO RESOLVIDO — confirmado, blobs recuperáveis** |
| Corrida de escrita no KV / teste com `Map` | — | **NÃO RESOLVIDO — confirmado** |

### SEC-1 — PARCIAL (inerte)
`community.js` hoje chama `denyUnlessOwner` em 6 pontos (`:236, :332, :432, :450, :476, :497`),
cobrindo `profile`, `match`, `trophies`, `friends`, `gift`, `gifts`. O código está certo. Mas
`denyUnlessOwner:227` delega a `authorizeSaveAccess`, que é *fail-open* (`_auth.js:113`).
⇒ **A correção só passa a existir quando o Firebase for ligado.** O texto de `STATUS.md:469-471`
("isso não fecha quando o `FIREBASE_PROJECT_ID` for ligado") ficou **desatualizado ao contrário**:
hoje é exatamente o oposto — só fecha quando ligar.
`closeSeason` (`:406-408`) não usa `denyUnlessOwner`, e está correto: usa `SEASON_ADMIN_KEY`, com
fail-**closed** (`if (!env.SEASON_ADMIN_KEY || …) return 401`). É o contraste que mostra que o
padrão fail-open do `_auth.js` foi escolha de migração, não esquecimento.
*Verificação para o `alpha-qa`:* com o Firebase ligado (na infra própria do Soulmon, não em
`digiapp-a5e`), `POST /api/community?action=gift` com `id` de terceiro e sem Bearer deve
devolver 401; com Bearer de outra conta, 403.

### SEC-2 — RESOLVIDO
`publicIdFor` (`community.js:81-84`) = `SHA-256("soulmon-pub:" + saveId)` truncado em 24 hex,
caminho só de ida; índice reverso `pid:<pid>` só no servidor (`:87-93`); `publicProfile` devolve
`id: pid` (`:102-105`); `friends`/`gift` resolvem o alvo por `saveIdForPublicId` e devolvem pid
(`:459, :467`). Não achei nenhuma rota que devolva `saveId` cru. **Independe do Firebase.**
*Verificação:* `GET /api/community?action=players` — nenhum campo do JSON pode casar
`^[0-9a-f]{32}$`.

### SEC-3 — NÃO RESOLVIDO (o ✅ é falso-positivo, como o próprio doc admite)
`_entitlements.js:147-155`:
```js
export async function claimOrder(env, saveId, orderId) {
  if (env.DB) return claimOrderAtomic(env, saveId, orderId);
  const key = ORDER_PREFIX + orderId;
  const owner = await env.DIGIAPP_SAVES.get(key);   // leitura eventualmente consistente
  if (owner && owner !== saveId) return { ok: false, reason: 'order-in-use' };
  if (!owner) await env.DIGIAPP_SAVES.put(key, saveId);
  return { ok: true };
}
```
O caminho atômico é **condicionado a `env.DB`** (`:148`). **Não existe nenhum binding
`d1_databases` em `wrangler.jsonc` (arquivo inteiro lido: só `DIGIAPP_SAVES` e
`PUSH_SUBSCRIPTIONS`)** nem em `workers/wrangler.toml`. ⇒ Em produção roda sempre o ramo do KV:
*read-then-write* sem CAS, sobre armazenamento eventualmente consistente com cache de borda
inclusive para **chave inexistente**. Não exige simultaneidade — exige requisições em PoPs
diferentes.
**A corrida que o teste não reproduz:** `_entitlements.test.js` usa um `Map` em memória
(fortemente consistente), então `get` **nunca** devolve valor obsoleto e o ataque é
estruturalmente irreproduzível. O ✅ mede o código, não a semântica do armazenamento.
*Verificação executável para o `alpha-qa`:* dublê de KV com janela de consistência configurável
(`get` servindo snapshot de T-60s) — o teste deve **falhar** hoje e passar com o D1.
**Explorável contra jogador real hoje? Não diretamente** — é dano ao caixa (R$ 29,90 virando N
contas pagas), e depende de o billing estar configurado, o que hoje não está.

### `PLAY_REQUIRE_ACCOUNT_BINDING` — NÃO RESOLVIDO, com mitigação parcial real
`_billing.js:179-183`: `isPlayPurchaseBoundTo` devolve `true` quando
`obfuscatedExternalAccountId` está vazio **a menos que**
`env.PLAY_REQUIRE_ACCOUNT_BINDING === 'true'` — outro *fail-open*. Nada no repo indica a flag
ligada. Nota honesta: quando o vínculo **vem preenchido**, quem diz de quem é a compra é a
Google, e aí recibo alheio não vale em conta nenhuma, independente de timing. O buraco
"1 recibo → N contas" está **aberto**, e a flag é o que o fecha no canal Play. Variável de
painel = decisão do dono.

### SEC-5 — RESOLVIDO
`subscribe.js:52-58` recusa **antes de gravar**, via `isAllowedPushEndpoint`
(`_pushTargets.js:36+`), com allowlist por **rótulo de domínio** (`fcm.googleapis.com`,
`push.services.mozilla.com`, `notify.windows.com`, `push.apple.com`) — não `endsWith` cru, e não
o `googleapis.com` largo. O módulo é compartilhado com o worker de envio, então linhas já
gravadas no KV também são recusadas no disparo. Há rate limit (`subscribe.js:10, 30-31`).
⚠️ Ressalva: o worker é **deploy manual** (`CLAUDE.md:67-68`, `DEPENDE-DE-VOCE.md:1`) — a versão
do `push-scheduler` **rodando hoje** pode ser anterior à correção. Não verificável por leitura
de repo. **[pergunta ao dono]**

### Keystores no histórico do git — NÃO RESOLVIDO (confirmado)
```
git rev-list --all --objects | grep -i keystore
44364dc5…  bubblewrap_build/android.keystore   (2246 bytes)
bcf7e2b0…  bubblewrap_build/signing.keystore   (2756 bytes)
```
Introduzidas em `12cb739a`, removidas do HEAD em `c47776e5` — **os blobs continuam alcançáveis
por qualquer clone**. Não são arquivos de 0 byte (footgun 4): têm conteúdo.
Atenuantes verificados: a senha **não** está no repo (`android/app/build.gradle:22-23` lê
`RELEASE_STORE_PASSWORD`/`RELEASE_KEY_ALIAS` de fora) e a keystore é protegida por senha.
⇒ O risco real é **keystore + senha vazada em outro lugar** = APK falso assinado com a
identidade do app. **Explorável hoje contra jogador? Só se o repositório for público** — não
consegui determinar a visibilidade de `HexerVoodoom/Soulmon` deste ambiente.
**[pergunta ao dono, 🔴 se público]** Dono já decidiu (`D-11`): gerar keystore nova antes do
primeiro envio à Play; rotação/reescrita de histórico do git segue fora do escopo do run.

---

## 2. Escopo de dados — o que o produto coleta hoje

Sensibilidade: **alta** = íntimo/inferível sobre a pessoa · **média** = identifica ou
correlaciona · **baixa** = telemetria de jogo.

🔧 **Nota de correção:** a coluna "Quem alcança hoje" abaixo descrevia o risco como atingindo
"jogador real" em geral. Onde a fonte é o KV/Firebase compartilhado com o DigiApp, leia como
"os 2 usuários reais do DigiApp" — não existe hoje usuário de terceiro do Soulmon com dado
nesta tabela.

| Ativo | Sens. | Onde vive | Quem alcança **hoje** | Retenção |
|---|---|---|---|---|
| **E-mail** | média | `localStorage` (`digiapp-user-email`, `storageKeys.ts:16`) + Firebase Auth (Google, **EUA**). **Não** é gravado em claro no KV | Firebase; **qualquer um que já o conheça** deriva o `saveId` (`_auth.js:94-99`) — hoje, na prática, isso alcançaria contas do DigiApp (2 pessoas reais) | Sem expurgo declarado |
| **Perfil psicométrico** (Big Five + Honestidade-Humildade + eixos junguianos, 20 itens) | **alta** | `localStorage` `soulmon-profile` (`SoulmonOnboarding.tsx:334`) | **Só o dispositivo — não achei rota que o envie ao servidor** | Indefinida; morre com o `localStorage`. Perdê-lo tira o reroll pago |
| **Nome completo + data + HORA + LOCAL de nascimento** | **alta** | mesmo `soulmon-profile` (`OracleInput`, `oracle.ts:52-56`) | idem | idem |
| **Save do jogo** (nome, pet, estágio, Bits, hábitos, `completedTasks`, humor, sono, sonhos) | média→alta | KV `DIGIAPP_SAVES`, chave = `saveId` (`save.js:101`) | **HOJE: qualquer um com o e-mail** (§0) — universo real de contas: dono + namorada | **TTL 365 dias, renovado a cada save** (`save.js:101`) |
| **`soulGoal` / `soulStruggle`** (texto livre: o "porquê" e a dificuldade pessoal) | **alta** | dentro do save → KV. `_redact.js:16-17` confirma: **não** vão ao Groq | idem save | idem save |
| **Tarefas e hábitos reais** (títulos escritos pelo usuário) | **alta** — revela trabalho, saúde, rotina, crença | dentro do save → KV; espelho em SharedPreferences do widget Android | idem save | idem save |
| **Conversa com a IA** | **alta** | `ChatBox.tsx:127` → `functions/api/chat.js` → **Groq (EUA)**. Minimizado por `minimizeForAi` (`_redact.js`: e-mail/telefone/CPF/CNPJ/cartão/URL/@handle). `saveId` **não** vai no corpo (`_redact.js:24-26`) | Groq (terceiro, exterior) | Não persistida por nós; **retenção no Groq desconhecida** |
| **`goalText` do tutorial** | alta | `GameTutorialFlow.tsx:149` → `suggest-tasks.js` → **Groq (EUA)** | idem | idem |
| **`petDescription` / `favoriteCreature`** | média | prompt de sprite → `generate-sprite.js` → **Higgsfield**, fallback **Gemini/Google** | dois terceiros, exterior | não documentada |
| **Perfil público** (apelido, nome do pet, estágio, dias, tarefas feitas) | média | KV `profile:<saveId>`, exposto por `action=players` sob `pid` | **público, sem autenticação** | TTL 365d (`community.js:118`) |
| **Ranking / troféus / presentes** | baixa | KV `rank:*` (120d), `gifts:*` (60d) | idem | por TTL |
| **Assinatura de push** (endpoint + p256dh/auth + nome do pet + idioma) | média | KV `PUSH_SUBSCRIPTIONS`, `push:<hash>` | worker de push | TTL 365d renovado (`subscribe.js:76+`) |
| **Token FCM** | média | `localStorage` + KV `fcm:*` | worker de push, Google | idem |
| **Entitlement** (tier, créditos, `orderDetails` com `purchaseToken`) | média — financeiro indireto | KV `ent:<saveId>` (`_entitlements.js:60-62`) | servidor; hoje `/api/entitlements` é fail-open igual ao save | **sem TTL — permanente** |
| **`ord:<orderId>` → saveId** | média | KV | servidor | **sem TTL — permanente** |

**Sai do país / vai a terceiro:** Groq (texto livre do chat e do tutorial, EUA) · Higgsfield e
Gemini/Google (descrição do pet) · Firebase Auth e FCM (Google) · Cloudflare KV (região não
declarada no repo) · serviços de push (Google/Mozilla/Microsoft/Apple).

**Fatos para o `alpha-compliance` (fato, não parecer jurídico):**
1. **Não existe rota de exclusão.** `save.js:104` responde 405 a `DELETE`; não há endpoint nem
   botão para apagar save, entitlement ou assinatura de push. O único expurgo é o TTL de 365
   dias — que **se renova a cada save**, logo é indefinido para quem joga.
2. **Não existe rota de exportação** dos dados do titular.
3. `ent:` e `ord:` são gravados **sem TTL** — retenção infinita por construção.
4. O dado mais sensível (psicometria + natal) **fica no dispositivo e nunca sobe**. É
   minimização real e deve ser preservada em qualquer proposta futura de "sincronizar perfil".
5. `_redact.js` minimiza identificadores e o próprio arquivo declara o limite (`:20-23`): não
   torna o conteúdo não-sensível — "estou em depressão" continua saindo do país.
6. `public/privacidade.html` existe (`BILLING-SETUP.md:194,209`); **não avaliei** se cobre Groq,
   Higgsfield, Gemini e transferência internacional.
7. **Nenhuma norma é afirmada aqui.** LGPD/ECA Digital estão no contexto §6 e pertencem ao dono
   jurídico.

---

## 3. Perguntas para o dono (ordenadas por impacto)

| # | | Pergunta |
|---|---|---|
| 1 | 🔴🔴 | Confirmado por sonda: `/api/save` aceita GET sem token em produção, atingindo os 2 usuários reais do DigiApp. **Autoriza a construção de infraestrutura própria do Soulmon (Pages/KV/Firebase novos, sem tocar em `digiapp-a5e`) como caminho para fechar isso sem mexer no host que serve o DigiApp?** É o caminho crítico do run 1/2 e não pode ser feito na ordem errada (401 para todos, se aplicado ao host atual). |
| 2 | 🔴 | **`HexerVoodoom/Soulmon` é público ou privado?** Decide se as keystores no histórico são exposição real ou só higiene. |
| 3 | 🟠 | Qual versão do `workers/push-scheduler.js` está deployada hoje? Deploy é manual — não verificável por leitura (afeta o SEC-5 na prática e o nudge das 21h). |
| 4 | 🟠 | O billing já está configurado em produção? Se sim, o SEC-3 sobe para 🔴 — o D1 `order_claims` não existe (verificado em `wrangler.jsonc`). |
| 5 | 🟠 | Retenção e uso de dados no **Groq**, **Higgsfield** e **Gemini**: há contrato/DPA, ou é a política padrão do plano gratuito? Nada no repo responde. |
| 6 | 🟡 | Existe hoje algum caminho para o jogador **apagar** ou **exportar** os dados dele? Não achei nenhum. Quer que a Fase 2 desenhe? |

---

## 4. Fora de escopo desta peça (risco aceito, não risco inexistente)

- **Threat model completo (STRIDE) é da Fase 2.** Aqui só reverifiquei os itens do despacho.
- **Não auditei:** abuso de custo em `chat.js`/`generate-sprite.js` além de constatar que
  `_aiGuard`/`_rateLimit` existem; `metrics.js`; o app Electron; o código Android/Kotlin;
  `src/supabase/` (existe no repo, não achei uso em runtime — **[não modelado]**); `public/sw.js`;
  e a cadeia de suprimentos (`npm audit`, lockfile, permissões dos workflows de CI).
- **Não verifiquei variáveis do painel Cloudflare** além do que a sonda de `/api/save` deduz.
  `PLAY_REQUIRE_ACCOUNT_BINDING`, `SEASON_ADMIN_KEY` e os secrets do wrangler são estado que só
  o dono enxerga.
- **Não li nenhum save de jogador real** — deliberadamente. A prova de §0 usa id inexistente.
- **Rotação de keystore e troca da URL de produção**: fora do escopo por decisão do briefing —
  e agora, adicionalmente, `digiapp-a5e` está sob a trava explícita "não tocar" (`contexto.md
  §10`).
