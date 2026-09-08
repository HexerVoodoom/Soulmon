# Depende de você — Soulmon

> **Este arquivo é atualizado a cada rodada de QA.** Só entra aqui o que **não
> pode ser feito por mim**: exige conta, cartão, painel, aparelho físico ou uma
> decisão de produto/negócio que não é minha para tomar.
>
> Última atualização: **07/09/2026** (reconciliação). Antes disso, rodada 8 de
> QA (2026-08-14).
> Ordem = **impacto**, não facilidade.
>
> ⚠️ **A seção "URGENTE — está afetando usuário agora" foi escrita antes de o
> dono informar que NINGUÉM NUNCA USOU O APP EM PRODUÇÃO.** Nada aqui está
> afetando usuário nenhum, porque não há usuário. Isso não apaga os itens —
> muda o que eles são: deixam de ser incêndio e viram **pré-requisito de
> lançamento**. O item 1, em particular, envelheceu duas vezes: o nudge das
> 21h que ele cita **já saiu do código** (`PUSH_HOURS_BRT = [10, 16, 22]`), e
> o que resta é que a borda roda uma versão de meses atrás — o `workers/` não
> builda no push da `main`. O deploy continua necessário; a urgência, não.

---

## 🔴 URGENTE — está afetando usuário agora

> ## ✅ Itens 1, 2, 13 e 16 foram FEITOS em 07/09/2026 (sessão local)
>
> Ficam abaixo, riscados, com o que mudou. Ver `docs/STATUS.md` e
> `docs/HANDOFF-SESSAO-LOCAL.md`.

### ~~1. Deploy do worker de push~~ — ✅ FEITO em 07/09/2026
```bash
cd D:\Soulmon\repo\workers && npx wrangler deploy
```
**Por quê:** o `workers/` **não builda no push da `main`** — é deploy manual. O
nudge das 21h ("está preocupado! Complete suas tarefas antes de dormir") foi
removido do produto por ser cobrança, e **continua vivo no servidor**,
disparando todo dia, incondicionalmente, inclusive para quem já cumpriu a meta.
O repositório está verde e o usuário recebe assim mesmo.

**Custo:** um comando. **Achado na rodada 5.**

> ✅ **Feito.** `npx wrangler deploy -c wrangler.toml` dentro de `workers/`.
> Na mesma passada o `VAPID_JWK` foi criado — ele **nunca existiu**, e sem ele
> `push-scheduler.js` pulava o envio inteiro em silêncio. O Web Push só passou
> a existir de fato agora.

---

### ~~2. Ligar `FIREBASE_PROJECT_ID`~~ — ✅ FEITO em 07/09/2026

> ✅ Projeto Firebase **próprio** criado (`soulmon-app`); o Soulmon não divide
> mais o do DigiApp. `FIREBASE_PROJECT_ID` ligado — e **no `wrangler.jsonc`,
> não no painel**: variável de runtime comum é substituída pelo arquivo a cada
> `wrangler deploy`, então posta só no painel o próximo deploy a apagaria e o
> servidor voltaria ao modo aberto em silêncio. Verificado na borda:
> `/api/save` sem token devolve 401, e `/api/account` saiu do 503.

> ⚠️ **Correção de 07/09/2026:** este item e o 13 diziam "projeto Pages". O app
> **é um Worker** (`wrangler.jsonc` na raiz, `soulmon.mateus-sprnd.workers.dev`)
> — as variáveis de runtime ficam em Workers & Pages → soulmon → Settings.
> E as `VITE_FIREBASE_*` **não são de runtime**: o Vite as inlina no bundle,
> então elas moram num `.env` da máquina que roda `npm run build`. Pôr as
> `VITE_*` no painel não tem efeito nenhum, e foi o que esta lista mandou fazer
> por semanas.
**Por quê:** é o que faz a autorização de save existir. Sem ele, `_auth.js:112`
devolve `{ ok: true }` e **todo o `denyUnlessOwner` é um no-op**. Quem souber um
e-mail deriva o `saveId` (algoritmo público) e:
- lê e sobrescreve o save alheio;
- **derruba o app da vítima permanentemente** — um save forjado com
  `evolutionStage: 42` dá tela branca em toda carga, sem recuperação pela UI
  (corrigido no código, mas a porta de entrada é a auth desligada).

⚠️ **Ordem importa** (`docs/SEPARACAO-DIGIAPP.md` §3.4): só ligue **depois** que
`VITE_FIREBASE_*` estiver configurado no projeto Pages. Ligar antes derruba o
login de todo mundo.

**Achado na rodada 1, confirmado nas 2 e 6.**

---

## 🟠 ANTES DE QUALQUER COISA COM DINHEIRO

### 3. Banco D1 `order_claims` + `PLAY_REQUIRE_ACCOUNT_BINDING = true`
**Por quê:** sem os dois, **um comprovante de compra vira N contas pagas**. O
`claimOrder` só é atômico `if (env.DB)`, e o D1 não existe. O KV é eventualmente
consistente (~60s, com cache de borda inclusive para chave inexistente): não
precisa de simultaneidade, basta as requisições caírem em colos diferentes.

O backend **recusou implementar um paliativo de propósito** — nenhum é atômico, e
um remendo desmarcaria este item do checklist de lançamento, que é o risco real.

⚠️ **Piorou de status na rodada 9 (não de fato, mas de conhecimento):** o
`docs/STATUS.md` §1.2 marca o SEC-3 como ✅ corrigido — **e o teste que sustenta
esse ✅ usa um `Map` em memória**, que é fortemente consistente e por construção
**não consegue reproduzir o ataque**. Isso vale também para os testes escritos
depois. Ou seja, a correção **nunca foi provada** sob a condição em que o ataque
acontece. Mutation testing não acha isso — mede código, não semântica de
armazenamento.

**Não configure nenhuma chave de billing antes disto.**

---

### 4. Decidir sobre as keystores no histórico do git
`bubblewrap_build/android.keystore` e `signing.keystore` foram removidos do HEAD
no commit `c47776e5` — **mas continuam no histórico**, e quem clonar recupera.

> 🔎 **Contexto levantado em 07/09/2026, que pode dissolver a decisão:** as duas
> entraram no commit `12cb739a` (08/03/2026) dentro de `bubblewrap_build/`, que
> era o artefato de um build **TWA do DigiApp**. O Soulmon **não tem keystore de
> release nenhuma** — `android/app/build.gradle` só assina se a propriedade
> `RELEASE_STORE_FILE` existir, e a CI roda apenas `assembleDebug`. Ou seja: a
> chave exposta é a do **DigiApp**, não a deste app, e o Soulmon nunca foi
> assinado para release. A pergunta real é se a chave de upload do DigiApp
> precisa girar — decisão sobre aquele produto, não sobre este.

Duas saídas: rotacionar a chave de upload no Play Console, ou limpar o histórico
com `git filter-repo` (reescreve todos os commits, exige force push e quebra
clones existentes). **Posso preparar o comando; a decisão de reescrever histórico
é sua.**

---

## 🟡 DECISÕES DE PRODUTO (não são técnicas)

### ~~5. `minSdkVersion`~~ — ✅ DECIDIDO em 07/09/2026: **26** (Android 8)

> O dono escolheu 26, e não o 30 que eu tinha palpitado — alcance maior, com a
> tela de aviso do WebView (já implementada) cobrindo quem cair fora. Aplicado
> em `android/variables.gradle`. ⚠️ Só vale em APK novo.

#### Contexto original
O app declara suportar Android 7+, mas usa `oklch()` (87×), `color-mix()` (97×),
aninhamento `&:hover` (18×) e builda com `target: 'esnext'` — tudo Chromium
111/112+. A Play Store usa o `minSdk` para decidir quem pode instalar, então
hoje ela ofereceria o app para quem só veria uma tela de aviso.

⚠️ O WebView se atualiza **separado** do Android: aparelho novo com WebView
travado quebra igual. **Subir o `minSdk` sozinho não resolve.**

Já implementado: tela de aviso ("atualize o Android System WebView") no lugar da
tela branca. Falta **você decidir o `minSdk` real** — meu palpite é 30.

### ~~6. `freshGameState()` nasce com 1/1 corações~~ — ✅ CORRIGIDO em 07/09/2026

> Passou a derivar do estágio (`getMaxHPForStage('rookie')` — a função já
> existia no arquivo; nada foi duplicado). O teste que travava o 1/1 agora
> trava 3/3, pelo mesmo motivo de antes: mudar tem que ser decisão.

#### Contexto original
Rookie vale 3, mas o estado inicial grava `healthPoints: 1, maxHealthPoints: 1`
no mount: **quem fecha o app no meio do onboarding volta com 1/3 corações.**
Sem dano hoje (o onboarding corrige, e a virada não cobra de quem tem 0
atividades). Recomendação: `getMaxHPForStage('rookie')` nos dois campos.
Os valores atuais estão **travados por teste** para que mudar seja decisão, não
acidente. **Achado na rodada 8.**

### 6b. Balanceamento da carga diária — ✅ ESCOLHIDO **e ENTREGUE** em 07/09/2026: **P4**

> O dono escolheu a **P4** (presets de rotina + "Equilibrar minha semana"),
> que é a recomendação do time e **não mexe em regra nenhuma**.
> **Implementada no mesmo dia**: `src/utils/weekBalance.ts` (o motor, que
> preserva a frequência semanal de cada hábito), `ROUTINE_PRESETS` em
> `src/types/taskModel.ts`, e o `BalanceWeekModal` — que mostra antes/depois,
> só escreve com confirmação e **avisa quando a carga não cabe** em vez de
> prometer alívio.
>
> **P1, P2 e P5 foram aprovados e entregues em 07/09/2026**, na mesma sessão:
>
> - **P1** — a meta que protege o coração passa a ser 60% da meta do dia
>   (`HEART_GOAL_RATIO`). Mega precisava de 5 de 6 para não perder coração e
>   passa a precisar de 4. **A excelência não mudou**: o dia completo continua
>   custando a meta inteira, e o caminho de evolução não cedeu um milímetro.
> - **P2** — um dia de folga por semana, grátis, gasto sozinho na virada. Não
>   acumula, não vira dia completo, e o relatório do dia avisa que foi usada.
> - **P5** — "dia perfeito" virou **"dia completo"** nos textos PT/EN. Só o
>   nome; `perfectDays` e `wasPerfect` seguem iguais no código.
>
> **Só a P3 continua na sua mesa** (alívio adaptativo: a meta de coração cai 1
> após 2 dias falhos). Recomendo decidi-la **depois** de ver P1+P2 rodando: os
> dois já entregam boa parte do alívio que a P3 buscava, e empilhar um terceiro
> perdão sem medir é afrouxar no escuro. Medir, porém, esbarra em não haver
> usuários — itens 9 a 12 desta lista.
>
> ⚠️ Efeito combinado, declarado para você não ser surpreendido: com P1 + P2,
> um jogador mega pode fazer 4 de 6 em seis dias e 0 no sétimo **sem nunca
> perder um coração**. Isso é intencional — a degeneração passa a exigir
> negligência real, não um dia de gripe. Se achar generoso demais, o botão de
> ajuste é `HEART_GOAL_RATIO` (0,6 → 0,7 devolve o mega a 5 de 6), **não**
> tirar a folga.

#### Contexto original
Vem do **seu teste com usuários** ("nem todo dia consigo fazer as 6 tarefas";
"tenho preguiça de planejar"; "cadastro mais e sou penalizado"). Diagnóstico
completo em `product/soulmon-01/balance/carga-diaria.md`.

**Os BUGS já foram corrigidos por mim** (a queixa 3 era defeito, não desenho —
três denominadores crus na UI mostravam "faça tudo" enquanto a regra cobrava
`min(cadastradas, requisito)`). **Estas quatro mudam REGRA para quem já joga, e
por isso são suas:**

| # | proposta | número exato |
|---|---|---|
| P1 | Separar meta mínima (coração) de meta ideal (dia perfeito), como Dailies vs. Habits do Habitica | `HEART_GOAL_RATIO = 0,6` → mega não perde ♥ com **4 de 6** em vez de 5 de 6 |
| P2 | 1 dia de folga por semana, recarregado na segunda, **consumido automaticamente na virada** | não ganha nem perde o dia (padrão Pokémon Sleep). A lição do Duolingo: quem precisou da folga não abriu o app para usá-la |
| P3 | Alívio adaptativo: meta de coração **cai 1 após 2 dias falhos**, piso 2 | ⚠️ adaptar **para cima** foi recusado — é a esteira do Vital Bracelet |
| P4 | Presets de rotina de 1 toque + botão "Equilibrar minha semana" | **zero mudança de regra**, maior retorno por esforço. A pesquisa foi conclusiva: ninguém planeja a semana num app de hábito |

**Recomendação do time:** comece por **P4** (não mexe em regra) e teste com 5
usuários **antes** de decidir P1–P3. Há uma hipótese barata e desconfortável na
mesa: **só os bugs corrigidos podem resolver 60% da queixa 1 e 100% da queixa 3**
— nesse caso, mexer no balanceamento seria consertar o que já não está quebrado.

**Recusados de propósito** (contrariam a essência "encoraja, nunca cobra"):
streak visível · folga vendável · notificação nova de cobrança · meta que sobe ·
reduzir o teto de atividades · humor alimentando meta.

### ~~7. TTL de 365 dias no save~~ — ✅ DECIDIDO em 07/09/2026: **renova a cada acesso**

> A escrita já renovava; a LEITURA não. Agora renova também na leitura, de
> forma preguiçosa (metadado de data + limiar de 30 dias), para não pagar uma
> escrita de KV por leitura. Save gravado antes da mudança renova na primeira
> leitura. Falha na renovação não derruba a leitura. Cinco testes travam isso,
> um deles provado vermelho por mutação.

#### Contexto original
Colide com o guardrail nº 1 do produto ("quem volta encontra saudade, não
fatura"): quem some por mais de um ano perde o save. Precisa de um "sim, é isso
mesmo" escrito — hoje é efeito colateral, não decisão.

### ~~8. Reroll por Créditos = aleatório pago~~ — ✅ JÁ RESOLVIDO (e melhor)

> ⚠️ **Esta entrada estava DESATUALIZADA e me fez pedir ao dono, em
> 07/09/2026, uma decisão sobre algo já feito.** Fica o registro para ninguém
> repetir.
>
> O reroll deixou de ser sorteio. Virou a **Nova Leitura** (WP5.7): a pessoa
> responde as 6 perguntas de novo e a leitura sai DELAS — a semente é
> `readingSeed(respostas, leituras)`, determinística, com teste travando
> ("mesma resposta e mesma leitura dão a mesma semente",
> `src/utils/newReading.test.ts`). Não há `Math.random` em
> `utils/monetization.ts`.
>
> O texto de equivalência que faltaria também já está na tela, nos dois
> idiomas (`CreditsModal.tsx`): *"Todo pet é mecanicamente igual: muda quem
> sua criatura é, nunca o quanto ela te ajuda."*
>
> Isso responde à exposição da Lei 15.211/2025 melhor do que um aviso: em vez
> de avisar que a aposta é justa, tiraram a aposta.

#### Contexto original
`monetization.ts:76` + `Math.random()`. Atenuante forte: todo pet gerado é
mecanicamente equivalente — é identidade, não poder. Mas a Lei 15.211/2025 (ECA
Digital) vale desde 17/03/2026, e o Pokémon GO teve incubadoras removidas no
Brasil. **Pode bastar deixar explícito na tela que os resultados são
equivalentes.**

---

## 🔵 LANÇAMENTO — bloqueiam loja

| # | O quê | Trava |
|---|---|---|
| 9 | URL da política de privacidade + formulário de Segurança de Dados | Play Store |
| 10 | Registrar o pacote **no projeto novo `soulmon-app`** + baixar `google-services.json` (o atual ainda é do projeto do DigiApp) e refazer a chave do FCM / o secret `FIREBASE_SERVICE_ACCOUNT`. ⚠️ **Mudou em 07/09/2026:** o Firebase foi separado, então isto deixou de ser "registrar mais um app" e virou migração do lado Android. O lado **web** já está pronto. | push nativo |
| 11 | Criar os 4 produtos no Play Console (`soulmon.unlock.full` + 3 pacotes de crédito) | compras |
| 12 | Conta de serviço do Google Play → `GOOGLE_PLAY_SERVICE_ACCOUNT` e `ANDROID_PACKAGE_NAME` | compras |
| ~~13~~ | ~~`VITE_FIREBASE_*`~~ — ✅ **FEITO em 07/09/2026**. `.env` local do projeto `soulmon-app`, `npm run build` + `wrangler deploy`, e só então o `FIREBASE_PROJECT_ID`. A chave foi **validada contra a API do Firebase**, não só transcrita. | ✅ |
| 14 | Conta Steamworks + US$ 100 · **App ID e Depot ID** | cliente Steam |
| 15 | `STEAM_PUBLISHER_KEY` e `STEAM_APP_ID` | microtransação Steam |
| ~~16~~ | ~~E-mail de contato do VAPID~~ — **decidido em 07/09/2026**: `mateus.sprnd@gmail.com`, já no código. Só falta o `wrangler deploy` dentro de `workers/` | push |
| 17 | `ASSETLINKS_SHA256` (o `PACKAGE_NAME` já tem padrão certo). ⚠️ **Levantado em 07/09/2026:** não dá para produzir hoje. O fingerprint que vale é o do **Play App Signing**, que só existe depois do app criado no Play Console e de um bundle enviado — e o Soulmon **não tem keystore de release** (a CI só faz `assembleDebug`). Encadeia com os itens 11 e 12. | deep links **e o portão de e-mail no APK** (`docs/PLANO-TELA-IDENTIDADE.md` §6.1) |

---

## 🟢 AMBIENTE — destravam trabalho meu

### ~~18. Trazer a janela do Chrome para a frente~~ — parcialmente resolvido

> Em 07/09/2026 o Chrome respondeu normalmente pela extensão. Uma vez o
> viewport colapsou para 735x49 no meio do fluxo e o `resize_window` não
> corrigiu — o que destravou foi recarregar a página. Fica registrado como
> sintoma conhecido, não como bloqueio.

#### Sintoma original
Minimizada ela reporta `Viewport: 0x0`: navega e está logada, mas **cliques e
digitação não chegam**. É o que trava a geração de arte no Gemini
(`docs/BACKLOG-ARTE-GERAR.md`).

### 19. Crédito no Higgsfield (alternativa à anterior)
Hoje: **1,5 crédito** = 3 imagens em qualidade baixa. Não cobre a leva P1.

### 20. Log do smoke do APK
O job de smoke falha e eu **não consigo ler o log** (a API do GitHub devolve 403
sem autenticação). Se você colar o texto do passo *"Boot emulator and run
smoke"*, eu conserto. Não bloqueia o APK — o build passa e o artefato sai.

---

## 🟠 DECISÃO DE PRODUTO — exclusão de conta e recibos de pagamento

### Recibo de pagamento sobrevive à exclusão da conta?

**Contexto (fato, não parecer — não há assessoria jurídica aqui, P7=B):**
`functions/api/account.js` implementa exportação e exclusão. A exclusão apaga o
save, o perfil público, o `pid`, os presentes e o ranking, e limpa o `saveId` da
lista de amigos de terceiros. **Duas coisas eu deixei em pé, e a decisão é sua:**

1. **`ord:<orderId> → saveId`** — o vínculo "este comprovante já foi resgatado
   por esta conta". É a trava do `claimOrder` (`_entitlements.js:147`): sem ela,
   **um recibo vira N contas pagas**. E, do lado do titular, é o que permite que
   ele volte com o mesmo e-mail e **restaure a compra** (mesmo e-mail → mesmo
   `saveId`). O valor guardado é o `saveId`, que é derivado do e-mail.
2. **`ent:<saveId>`** — não apago: **minimizo**. Sai o uso (`aiLifetime`,
   `adDate`, `adCount`); ficam `tier`, `credits`, `consumedOrders`,
   `orderDetails` (com o `purchaseToken`, que é o que `auditRefunds` precisa
   para conferir reembolso) e uma marca `accountDeletedAt`.

**As três saídas possíveis, e o custo de cada uma:**

| | O que faz | Custo |
|---|---|---|
| **A (implementado hoje)** | Recibo e entitlement sobrevivem, uso é apagado | Um identificador derivado do e-mail continua no servidor por tempo indeterminado |
| **B** | Substituir o valor de `ord:` por uma marca opaca de "já resgatado" | Mantém a anti-fraude, mas **quem voltar perde a compra** — não há como reconhecer o dono |
| **C** | Apagar `ord:` e `ent:` | Exclusão completa, e **o mesmo recibo passa a valer para N contas** |

> ⚠️ **DESATUALIZADO — decidido e IMPLEMENTADO antes de 07/09/2026.**
>
> A saída é a **A, com retenção de 5 anos**, e ela já está no código:
> `RETENTION_TTL_SECONDS = 5 * 365 * 24 * 60 * 60` em
> `functions/api/_entitlements.js`, com o raciocínio do dono registrado ali
> (item 3.1 do `GUIA-DO-DONO.md`): cinco anos cobrem o prazo do CDC e o fiscal
> usual, e depois o dado some sozinho.
>
> O prazo é **renovado a cada escrita**, de propósito — a pergunta que ele
> responde é "essa conta ainda existe?", não "quando ela nasceu?". Sem isso, um
> prazo fixo tiraria o `paid` de quem comprou e continua jogando, e resetaria o
> teto vitalício de IA.
>
> O caminho D1 obedece à mesma decisão por outro mecanismo: a linha carrega
> `expires_at` (`migrations/0002_order_claims_expires_at.sql`). Testes:
> `_entitlements.ttl.test.js` e `_entitlements.d1Retencao.test.js`.
>
> Em 07/09/2026 esta seção ainda dizia "sem TTL, retenção infinita" e me levou
> a pedir ao dono uma decisão já tomada. Corrigido.

#### Texto original da pergunta

**O que eu precisava de você:** A, B ou C. E, se for A, **por quanto tempo** o
`ord:`/`ent:` fica. Eu não afirmo norma; a escolha é sua e vira texto na
política.

---

### Exportação e exclusão ficam INDISPONÍVEIS até o item 2 desta lista

Não é bug. As duas rotas usam `requireVerifiedOwner` (`functions/api/_auth.js`),
que é **fail-closed**: sem `FIREBASE_PROJECT_ID` elas respondem **503
`auth-unavailable`**, com texto em PT-BR e EN explicando ao usuário. O motivo é
direto: o `saveId` é o SHA-256 do e-mail por algoritmo público, então uma rota
de **exclusão** com a autorização fail-open de hoje seria *"apague a conta de
qualquer um cujo e-mail eu conheça"*. **Indisponível é melhor que perigosa** —
elas ligam sozinhas junto com o login, sem tocar em nenhuma variável.

---

### Push não é alcançável pela exclusão do servidor

`push:*` e `fcm:*` são chaveados pelo **hash do endpoint/token** e o registro
**não guarda o `saveId`** — o servidor não consegue achar as inscrições de um
titular a partir da conta dele. A exclusão **declara isso** na resposta e o
cliente precisa chamar `DELETE /api/subscribe` e `DELETE /api/fcm-subscribe`.
Alternativa: gravar o `saveId` dentro do registro de push — o que **aumenta a
ligação de dados** para resolver o problema. Também é decisão sua.

---

## ✅ Resolvido e publicado (para não voltar à lista)

- APK abria o **DigiApp** — `capacitor.config.json` apontava para o projeto
  antigo. Corrigido, verificado por você no aparelho, travado por teste.
- Overlay de desktop **nunca gravou nada** desde sempre.
- Save podia ser apagado por `{"state": 1}`, e `cloudSave` mentia "sincronizado"
  em 403/500.
- CSP correta no papel **bloqueava os scripts inline** — tema não aplicado e
  service worker com 0 registros.
- PII do oráculo saía no Auto Backup do Android.
- Dia perfeito **nunca contava** para quem resolvia por tarefa avulsa.
- Degenerar rendia **mais** que cuidar (rookie).
- Glossário não tinha caminho para ser aberto.
- 45 reprovações de contraste.
- 7 sprites de criatura com nuvem de ruído; berço com xadrez assado.
