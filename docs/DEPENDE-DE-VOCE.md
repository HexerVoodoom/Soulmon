# Depende de você — Soulmon

> **Este arquivo é atualizado a cada rodada de QA.** Só entra aqui o que **não
> pode ser feito por mim**: exige conta, cartão, painel, aparelho físico ou uma
> decisão de produto/negócio que não é minha para tomar.
>
> Última atualização: **rodada 8 de QA** (2026-08-14).
> Ordem = **impacto**, não facilidade. O item 1 é o que mais dói hoje.

---

## 🔴 URGENTE — está afetando usuário agora

### 1. Deploy do worker de push
```bash
cd D:\Soulmon\repo\workers && npx wrangler deploy
```
**Por quê:** o `workers/` **não builda no push da `main`** — é deploy manual. O
nudge das 21h ("está preocupado! Complete suas tarefas antes de dormir") foi
removido do produto por ser cobrança, e **continua vivo no servidor**,
disparando todo dia, incondicionalmente, inclusive para quem já cumpriu a meta.
O repositório está verde e o usuário recebe assim mesmo.

**Custo:** um comando. **Achado na rodada 5.**

---

### 2. Ligar `FIREBASE_PROJECT_ID` no painel do Cloudflare
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

**Não configure nenhuma chave de billing antes disto.**

---

### 4. Decidir sobre as keystores no histórico do git
`bubblewrap_build/android.keystore` e `signing.keystore` foram removidos do HEAD
no commit `c47776e5` — **mas continuam no histórico**, e quem clonar recupera.

Duas saídas: rotacionar a chave de upload no Play Console, ou limpar o histórico
com `git filter-repo` (reescreve todos os commits, exige force push e quebra
clones existentes). **Posso preparar o comando; a decisão de reescrever histórico
é sua.**

---

## 🟡 DECISÕES DE PRODUTO (não são técnicas)

### 5. `minSdkVersion = 24` é uma promessa que o app não cumpre
O app declara suportar Android 7+, mas usa `oklch()` (87×), `color-mix()` (97×),
aninhamento `&:hover` (18×) e builda com `target: 'esnext'` — tudo Chromium
111/112+. A Play Store usa o `minSdk` para decidir quem pode instalar, então
hoje ela ofereceria o app para quem só veria uma tela de aviso.

⚠️ O WebView se atualiza **separado** do Android: aparelho novo com WebView
travado quebra igual. **Subir o `minSdk` sozinho não resolve.**

Já implementado: tela de aviso ("atualize o Android System WebView") no lugar da
tela branca. Falta **você decidir o `minSdk` real** — meu palpite é 30.

### 6. `freshGameState()` nasce com 1/1 corações
Rookie vale 3, mas o estado inicial grava `healthPoints: 1, maxHealthPoints: 1`
no mount: **quem fecha o app no meio do onboarding volta com 1/3 corações.**
Sem dano hoje (o onboarding corrige, e a virada não cobra de quem tem 0
atividades). Recomendação: `getMaxHPForStage('rookie')` nos dois campos.
Os valores atuais estão **travados por teste** para que mudar seja decisão, não
acidente. **Achado na rodada 8.**

### 7. TTL de 365 dias no save
Colide com o guardrail nº 1 do produto ("quem volta encontra saudade, não
fatura"): quem some por mais de um ano perde o save. Precisa de um "sim, é isso
mesmo" escrito — hoje é efeito colateral, não decisão.

### 8. Reroll por Créditos = aleatório pago com dinheiro real
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
| 10 | Registrar o pacote no Firebase + baixar `google-services.json` | push nativo |
| 11 | Criar os 4 produtos no Play Console (`soulmon.unlock.full` + 3 pacotes de crédito) | compras |
| 12 | Conta de serviço do Google Play → `GOOGLE_PLAY_SERVICE_ACCOUNT` e `ANDROID_PACKAGE_NAME` | compras |
| 13 | `VITE_FIREBASE_*` no projeto Pages (e o `FIREBASE_PROJECT_ID` **por último**) | login |
| 14 | Conta Steamworks + US$ 100 · **App ID e Depot ID** | cliente Steam |
| 15 | `STEAM_PUBLISHER_KEY` e `STEAM_APP_ID` | microtransação Steam |
| 16 | E-mail de contato do VAPID — hoje é `contact@digiapp.app`, que você não controla | push |
| 17 | `ASSETLINKS_PACKAGE_NAME` e `ASSETLINKS_SHA256` (fingerprint sai do Play Console) | deep links |

---

## 🟢 AMBIENTE — destravam trabalho meu

### 18. Trazer a janela do Chrome para a frente
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
