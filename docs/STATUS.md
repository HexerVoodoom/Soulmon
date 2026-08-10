# Status do Soulmon — registro vivo

Documento único de acompanhamento. **Se algo importante for decidido, descoberto
ou concluído, registre aqui**, senão se perde entre sessões.

- Estado do código e do que está no ar → seções 1 e 2
- **O que depende de você (dono do projeto)** → seção 3
- Dívidas conhecidas que ainda não valem o custo → seção 4

Última atualização: auditoria de segurança multi-agente (3 agentes, escopo
dinheiro / auth+dados / IA+push+segredos).

---

## 1. Segurança — auditoria de 2026-08

Rodada com o motor do `/security-review` da Anthropic, dividida em três frentes
paralelas. Cada achado abaixo foi **verificado à mão no código** antes de
entrar aqui. Filtro aplicado: só confiança ≥ 8, sem DoS, sem rate limit, sem
"falta de hardening" e sem race teórica.

### 1.1 Explorável AGORA, em produção

| # | Onde | O quê | Status |
|---|---|---|---|
| SEC-1 | `functions/api/community.js` | 5 de 11 ações sem autorização nenhuma | ✅ corrigido |
| SEC-2 | `functions/api/community.js:122` | o `saveId` é publicado como identidade social | ✅ corrigido |
| SEC-5 | `functions/api/subscribe.js:33` | SSRF: qualquer `endpoint` aceito, worker faz `fetch` nele 4×/dia | ✅ corrigido |

**SEC-1 — o buraco central.** Só `action=profile` chama `authorizeSaveAccess`.
`friends`, `gift`, `match`, `trophies?claim=1` e `gifts?claim=1` pegam o ator do
`body.id`/`?id=` e escrevem no registro daquela conta sem prova de posse.
Agravante: **isso não fecha quando o `FIREBASE_PROJECT_ID` for ligado** — ao
contrário do `save.js`/`billing.js`, essas ações não consultam autenticação em
ponto nenhum.

Impacto concreto: roubar 20 Bits/vítima/dia emitindo presente em nome dela;
reescrever a lista de amigos de qualquer um; forjar o campeonato inteiro
(+10 pontos e +1 vitória por chamada, queimando a partida diária da vítima →
1º lugar e troféu 🥇 sem jogar); e **apagar permanentemente** troféus de season
e presentes alheios, sem caminho de reemissão.

**SEC-2 — por que o SEC-1 vira catástrofe.** `action=players` devolve `p.id`, que
**é a chave do cloud save**. Sem conta e sem autenticação dá para listar a chave
de até 300 jogadores e então `GET /api/save?id=…` (lê o save inteiro) ou
`POST` (sobrescreve). Com `Access-Control-Allow-Origin: *` isso funciona de
qualquer página aberta no navegador da vítima.

> Isso muda a natureza do risco que estava documentado como aceito. O texto
> antigo dizia "quem souber seu e-mail pode ler seu save". Na prática **ninguém
> precisa saber e-mail nenhum** — é leitura e destruição em massa.

**Correção aplicada.** A identidade social passou a ser um `pid` derivado
(`SHA-256("soulmon-pub:" + saveId)`, 24 hex) — caminho só de ida. O índice
reverso `pid:<pid>` → saveId vive no servidor e é o único jeito de resolver um
alvo. Alvos (`friendId`, `opponentId`, `player?id=`) chegam como pid; a lista de
amigos guarda saveId internamente e sai como pid. Nada mudou no cliente: ele já
tratava o id alheio como token opaco. Como o pid é derivado, não houve migração
de dados — o índice reverso se preenche sozinho no próximo salvamento de cada
jogador.

### 1.2 Latente — arma no dia em que o billing for configurado

| # | Onde | O quê | Status |
|---|---|---|---|
| SEC-3 | `functions/api/_entitlements.js:132` | `claimOrder` não é atômico → 1 recibo vira N contas pagas | ✅ corrigido |
| SEC-4 | `functions/api/_billing.js:311` | microtransação Steam sem vínculo com o dono | ✅ corrigido |

**SEC-3.** O comentário no código dizia que a corrida "exige tempo de propagação
na casa dos milissegundos". **Está errado, e a estimativa era minha.** O Workers
KV é eventualmente consistente com janela de até ~60s, e o `get()` mantém cache
de borda por 60s **inclusive para chave inexistente**. Não é preciso
simultaneidade: basta as requisições caírem em colos que ainda não viram a
escrita. Um recibo de R$ 29,90 vira N contas `paid` com um `for` em `curl` por N
proxies regionais. Não é consertado ligando o Firebase — cada conta clonada
autentica legitimamente, e o `purchaseToken` nunca é vinculado a uma identidade.

O teste também dava falsa segurança: usava um `Map` em memória, que é fortemente
consistente e nunca reproduz a leitura obsoleta.

**SEC-4.** `verifySteamPurchase` credita com base num `orderId` decimal vindo do
cliente, sem ticket e sem comparar o `steamid` que a própria Valve devolve. A
função irmã `verifySteamOwnership` exige ticket assinado *exatamente porque* o
SteamID é público — a assimetria é o indício. Como o `orderid` é gerado pelo
parceiro (contador/timestamp) e as respostas distinguem `not-purchased` de
`order-in-use`, o endpoint vira oráculo de enumeração: dá para varrer ids
vizinhos e resgatar a compra de outro jogador antes dele — ele paga a Valve e
não recebe nada.

### 1.3 Auditado e considerado SEGURO

Vale registrar para não reauditar à toa:

- **`_auth.js` — verificação de token Firebase está correta.** `alg` fixado em
  RS256, `aud` e `iss` ambos checados, `exp` e `iat` com tolerância limitada,
  JWKS por `kid` com TTL do `Cache-Control`, falha fechado em rotação,
  `email_verified === true` exigido. Era o achado mais temido e não existe.
- **Chave da Groq não vaza.** Host e modelo são fixos; corpo de erro upstream
  nunca volta ao cliente. Sem SSRF (nem host nem protocolo são controláveis).
- **Prompt injection sem consequência privilegiada** — nada do que o modelo
  responde vira escrita no servidor ou chamada de ferramenta.
- **PII do oráculo fica no cliente.** Nome completo, data, hora e local de
  nascimento vivem só no `localStorage` (`SOULMON_PROFILE`) e são consumidos
  por `generateOracle`. **Não** entram no `GameState`, não vão para `/api/save`
  nem para o perfil público. **Manter assim.**
- **`save.js`** remove `accountTier`/`credits` do POST do cliente e os reserve do
  registro `ent:` do servidor.
- **`spendCredits`** valida `Number.isInteger(amount) && amount > 0` — não dá
  para cunhar crédito com valor negativo.
- **`grantAdReward`** fica atrás de `ADMOB_SSV_ENABLED !== 'true'` → 501.
- **`closeSeason`** falha fechado sem `SEASON_ADMIN_KEY`.
- **Steam Family Sharing** já é recusado (`steamId !== ownerSteamId`).
- **Sem segredos na árvore de trabalho.** A chave anon do Supabase em
  `src/utils/supabase/` é pública por desenho (RLS) e o app não passa mais por
  lá. Todo `VITE_*` em uso é config web do Firebase, pública por desenho.

### 1.4 Segredos no histórico do git ⚠️

O commit `c47776e5` removeu `bubblewrap_build/`, que continha:

```
bubblewrap_build/android.keystore
bubblewrap_build/signing.keystore
bubblewrap_build/app-release-signed.apk
bubblewrap_build/app-release-aligned.apk
```

Remover do HEAD **não tira do histórico** — quem clonar ainda recupera. Ver
seção 3.

---

## 2. Estado do produto

- **Reskin visual + tema claro/escuro (ago/2026).** Paleta trocou de roxo pra
  teal/cobre (`--sm-*` em `src/index.css`, agora com variante
  `[data-theme="light"]`/`[data-theme="dark"]`). Novo `src/contexts/ThemeContext.tsx`
  (persistido em `digiapp-theme`, reaproveitando a chave do antigo seletor de
  skin) + script inline em `index.html` que aplica o tema antes do primeiro
  paint (evita FOUC) + seletor "Aparência" em Configurações. Os skins
  `win98`/`glitch` — mortos, sem nenhum botão que os ligasse — foram
  **removidos por completo** (código e CSS, ~950 linhas), não só desligados.
  Novo mascote da franquia: um corvo de cartola em pixel-art
  (`src/assets/soulmon/mascot-raven.png`, arte fornecida pelo dono, fundo
  originalmente com checkerboard opaco — removido via flood-fill antes de
  virar asset), usado no ícone do app (favicon/PWA/Android/Electron, todos
  regenerados) e como mascote em loading/onboarding/erro/estados vazios. A
  **mecânica do pet do jogador não mudou em nada** — continua gerado pelo
  oráculo por usuário; o corvo é só identidade de marca. Cobertura de temas é
  por prioridade: fundação + ~15 telas de maior uso migraram pros tokens
  novos agora (ver commit); telas secundárias (minigames, alguns painéis
  fundos) ainda têm cor fixa e migram depois.
- **Auditoria de tom e paridade executada (ago/2026).** O chat de fallback
  passou a entender e responder em PT (antes um usuário escrevendo "tô triste"
  recebia "Cheer up!" em inglês), e o pool de tristeza deixou de invalidar o
  sentimento. O prompt da IA ganhou um piso de tom inegociável e passou a
  chavear personalidade por NÍVEL — antes usava nomes do DigiApp, nenhum casava,
  e todo pet falava como "guide and mentor". O tutorial ganhou fallback local de
  tarefas (sem ele, uma falha de rede prendia o usuário numa tela obrigatória
  sem nada selecionável) e parou de ensinar HP só pelo lado da punição.
  `--sm-muted` subiu de 3,48:1 para ~4,6:1 de contraste. Confirmação do
  "Recomeçar do zero" agora diz a verdade (não apaga progresso) e virou
  "Refazer o ritual".
- **Rodada de check-up com personas (ago/2026)** — teste dirigindo o app no
  navegador com 5 personas do público (adolescente com TDAH que some e volta,
  pai com 3 min/dia, perfeccionista após um dia ruim, usuário 58+ com foco em
  acessibilidade, gamer buscando profundidade). Achado mais grave: **o checkbox
  de concluir tarefa renderizava com 2px** — as classes `w-7`/`h-7` não existem
  no `index.css` pré-compilado (footgun 1), então a ação central do app era
  praticamente invisível e impossível de acertar no dedo. Agora é um
  `<button role="checkbox">` de 44px com o círculo de 28px dentro, em tarefa,
  atividade e etapa. Junto: foco visível em todo o design system (não havia
  `:focus-visible` em lugar nenhum), notificações reescritas, e o popup da
  primeira tarefa traduzido e reescrito.
- **Notificações cobravam quem já tinha cumprido a meta.** `totalRequired` era o
  requisito do estágio, não `min(cadastradas, requisito)` — um rookie com 2
  atividades cumpria a própria meta e mesmo assim levava 3 avisos por dia
  dizendo que faltavam tarefas. Corrigido para a mesma meta de
  `computeDailyReset`. O aviso das 21h ("está preocupado! ainda dá tempo!") foi
  removido, e o das 20h parou de prometer que "metade das tarefas" evita a
  perda — o que era falso.
- **Rodada de auditoria (ago/2026)** — quatro achados, todos corrigidos:
  (1) o **ritmo de cuidado era cego a atividades recorrentes**, porque
  `completedTasks` só recebe tarefas avulsas e `lastCompletedDate` some na
  virada; agora existe `activityLog` (teto de 90). (2) O **galho previsto não
  era dito** — a página de Evolução mostrava os três atributos, mas o jogador
  tinha que inferir para onde ia; agora há uma linha com o galho e, no empate,
  quem desempata. (3) O resumo de "uma ação, várias barras" **só existia para
  tarefas**, não para atividades. (4) Dois **ramos mortos** de `digiegg/baby-i`
  na conclusão de atividade (a árvore nasce em rookie).
- **Limpeza:** 10 componentes órfãos removidos (nenhum era importado em lugar
  nenhum, nem por lazy import) e `wasDayPerfect`/`countCompletedYesterday`
  apagados — eram uma SEGUNDA cópia da regra do dia perfeito, sem nenhum
  chamador em produção mas com testes verdes, dando falsa cobertura.
- **Bug corrigido: concluir tarefa não dava nada.** `completeTask` recusava
  tarefa com `completed: true`, mas o `App` marca a tarefa no clique e só chama
  a função 3s depois — então ela SEMPRE recusava. Resultado: a tarefa não saía
  da lista, não entrava no histórico, não contava na estatística e **não rendia
  a comida**. O laço central de recompensa do jogo estava sem efeito. Anterior a
  este trabalho (presente no backup). Há teste de regressão.
- **Benchmark + Fases 1 a 4 do plano de evolução (ago/2026)** — `docs/PLANO-EVOLUCAO.md`.
  Duas rodadas de pesquisa (apps de produtividade gamificada + franquias/hardware
  Digimon, Pokémon e Palworld) viraram um plano em 5 fases. A **Fase 1 está no ar**:
  teto de 1 coração perdido por dia, perdão de ausência ≥2 dias, alívio de meio
  coração toda segunda, `perfectDays` param de decrementar, e a **masmorra não cobra
  mais da barra de HP** (nem bloqueia entrada). A virada do dia virou função pura
  (`computeDailyReset`) que o hook e o teste compartilham — antes o teste testava
  uma cópia e afirmava uma evolução automática que `MANUAL_EVOLUTION` impede.
  Depois vieram: onboarding perguntando o "porquê", relatório em modo acolhida,
  "esqueci de marcar", check-in de humor, traço de nascimento, ritmo de cuidado
  desempatando o galho, faixas e rodada semanal do Torneio, e a vitrine da
  jornada. Abertos só o modo cooperativo (precisa de backend novo) e a arte da
  decoração (não é código). Ver `docs/PLANO-EVOLUCAO.md`.
- **Palco do pet** (composição, 5 espaços, decoração) — pronto. Contrato de arte
  em `docs/PALCO-E-DECORACAO.md`. Falta só a arte de verdade (hoje são emoji).
- **Torneio** — 6 itens na aba, escada 15/20/25/40/55/70 Emblemas. A vitrine
  exibe os troféus de season realmente ganhos.
- **Compra dentro do jogo** — `UnlockAccountModal` nos dois momentos em que a
  falta é sentida (limite de criação do grátis; árvore de demonstração na página
  de Evolução), mais ritual do oráculo pós-compra que troca só a criatura.
- **Desktop (Electron)** — overlay funcional, é um controle remoto do app.
  Ver `docs/PLANO-DESKTOP-STEAM.md`.
- **Separação do DigiApp** — inventário e ordem segura em
  `docs/SEPARACAO-DIGIAPP.md`. Limpeza de herança morta já feita.

---

## 3. Depende de você

Nada nesta seção pode ser feito por mim — precisa de conta, cartão, painel ou
decisão sua.

### 3.1 Segurança e direitos — urgente

| # | O quê | Por quê |
|---|---|---|
| ✅ | **Licença dos sprites DMC e uso dos nomes Digimon** — RESOLVIDO em 09/08/2026. Foi a opção (b): substituir por arte e nomenclatura originais. Saíram do repositório os 25 `*_dmc.png` (arte da Bandai, via `furudbat/wayland-vpets`) e os 49 `figma:asset/*` das linhas Tapirmon/Veemon/Salamon, junto com os itens de digievolução da loja, os Digimentais e o roster nominal da masmorra. `getSpriteForStage` responde sempre com arte de `src/assets/soulmon/`; save antigo cai num fallback determinístico que também usa arte nossa. Os nomes de franquia saíram até do prompt do gerador (`utils/oracle.ts`), com teste travando a ausência. Detalhes em `docs/Attributions.md`. |
| 🟠 | **Reroll por Créditos = resultado aleatório pago com dinheiro real** | `monetization.ts:76` + `oracle.ts` (`Math.random()`). Atenuante forte: todo pet gerado é mecanicamente equivalente — é identidade, não poder. Mas a Lei 15.211/2025 (ECA Digital) vale desde 17/03/2026, houve condenação de R$ 333M em jun/2026, e o Pokémon GO teve incubadoras removidas no Brasil. Pode bastar deixar explícito que os resultados são equivalentes. |
| 🔴 | **Decidir sobre as keystores no histórico do git** | Se o repositório for público, ou se essas chaves ainda assinam algo na Play Store: rotacionar a chave de upload no Play Console e/ou limpar o histórico com `git filter-repo` (reescreve todos os commits, exige force push e quebra clones). Posso preparar o comando; a decisão de reescrever histórico é sua. |
| 🟠 | **Ligar o `FIREBASE_PROJECT_ID`** | É o que fecha `save.js`, `billing.js` e `entitlements.js`. **Só depois** que `VITE_FIREBASE_*` estiver configurado e o build do desktop com login tiver saído — ligar antes derruba o login de todo mundo. |

### 3.2 Lançamento

| # | O quê |
|---|---|
| 🔴 | Registrar o pacote no Firebase + baixar `google-services.json` |
| 🔴 | Criar os 4 produtos no Play Console (`soulmon.unlock.full`, 3 pacotes de crédito) |
| 🔴 | Conta de serviço do Google Play → `GOOGLE_PLAY_SERVICE_ACCOUNT` e `ANDROID_PACKAGE_NAME` |
| 🔴 | **`PLAY_REQUIRE_ACCOUNT_BINDING = true`** — depois de publicar o app que manda `setObfuscatedAccountId(saveId)`. É o que impede um recibo de virar N contas pagas (ver docs/BILLING-SETUP.md) |
| 🟡 | Opcional: banco **D1** vinculado como `DB` + tabela `order_claims`, para o resgate de comprovante ser atômico em vez de best-effort |
| 🔴 | URL da política de privacidade + formulário de Segurança de Dados |
| 🟠 | `VITE_FIREBASE_*` no projeto Pages (e o `FIREBASE_PROJECT_ID` **por último**) |
| 🟠 | Conferir no painel do Cloudflare se já existe o projeto Pages `soulmon` — o `wrangler.jsonc` diz que sim, mas `capacitor.config.json` ainda aponta o APK para `digiapp-a5e.pages.dev` |
| 🟡 | Endereço de contato do VAPID (`workers/push-scheduler.js` → `CONTACT`) — hoje é `contact@digiapp.app`; precisa ser um que você controle |
| 🟡 | `ASSETLINKS_PACKAGE_NAME` e `ASSETLINKS_SHA256` no Pages (fingerprint sai do Play Console → Integridade do app) |

### 3.3 Steam

| # | O quê |
|---|---|
| 🔴 | Conta Steamworks + US$ 100 |
| 🔴 | **App ID e Depot ID** (bloqueiam o cliente Steam) |
| 🟠 | Arte da loja |
| 🟠 | Subir build a partir de uma máquina Windows |
| 🟡 | `STEAM_PUBLISHER_KEY` e `STEAM_APP_ID` (o SEC-4 já está corrigido; o cliente Steam precisa mandar o session ticket junto do `orderId`) |

### 3.4 Ordem que evita ficar fora do ar

1. Projeto Pages novo + KV novo + variáveis → conferir pela URL `*.pages.dev` do
   projeto novo, sem mexer no que está no ar.
2. Publicar o domínio próprio.
3. Só então atualizar `capacitor.config.json`, gerar APK novo e publicar.
4. Por último, aposentar o Pages antigo.

Fazer na ordem inversa (mexer no `server.url` antes de o destino existir) quebra
o app de todo mundo que já tem o APK instalado.

---

## 4. Dívidas conhecidas (aceitas por ora)

- **Emblemas ficam no save do cliente**, como os Bits — farmáveis por quem editar
  o `localStorage`. Aceitável **enquanto a aba Torneio vender só cosmético**. Há
  teste travando isso: se algum item de torneio virar vantagem de jogo, o teste
  cai, e a resposta certa é mover Emblemas para o servidor, não afrouxar o teste.
- **Corrida no `spendCredits`** (read-modify-write) — limitada a cobrar a menos
  do jogador, nunca a cunhar crédito. Cai junto se o SEC-3 migrar o módulo para
  Durable Objects.
- **Arte da decoração são emoji.** A estrutura já aceita PNG; ver
  `docs/PALCO-E-DECORACAO.md`.
- **Arte da decoração** ainda é emoji. O brief de produção está pronto e a
  geração virou um comando (`node scripts/gen-decor.mjs`, 14 peças) — falta só
  rodar num lugar com acesso a `higgsfield.ai`: a política de rede do sandbox de
  agente responde **403 no CONNECT** para esse host, então não dá pra gerar de
  dentro de uma sessão. Brief em
  `docs/BRIEF-ARTE-DECORACAO.md` (14 peças, caixa em px, prompt-base).
- **Cura instantânea por Créditos** é, na prática, pagar para pular o cuidado — a
  mesma crítica que Kotaku e Digital Trends fizeram ao Premium Pass do Pokémon
  Sleep. Sugestão em `docs/PLANO-EVOLUCAO.md`: reposicionar como perdão pontual
  com teto. É decisão de produto, não técnica.
- **Sprite do cocô** (`src/assets/9087038…png`) é um blob escuro pouco legível.
  Anterior a este trabalho.
