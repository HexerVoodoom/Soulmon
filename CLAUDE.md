# Soulmon — Guia para agentes

App de produtividade gamificado (bichinho virtual, gênero v-pet).
React 18 + TypeScript + Vite 6 (web), Capacitor 8.4 (APK Android) e um overlay
Electron separado (`desktop/`). UI/textos do app em PT-BR e EN (sempre os dois,
via `language === 'pt-BR'`).

> O Soulmon nasceu de um **fork do DigiApp**, e a limpeza da herança foi feita
> em 07/09/2026 — chaves de localStorage, binding KV, canal de push, campo do
> bridge, classes e rótulos dos widgets, Digital Asset Links e toda a
> arte/nomes de franquia. O inventário e o que sobra estão em
> `docs/SEPARACAO-DIGIAPP.md`.
> ⚠️ **Esta linha dizia que "o chat paralelo do Supabase" tinha saído. NÃO
> tinha** (achado em 09/09/2026): o `ChatBox` seguia gravando áudio e mandando
> direto para um projeto da era DigiApp, com o JWT commitado — bloqueado pela
> CSP, sem `RECORD_AUDIO` no Android e declarado em lugar nenhum. Hoje a
> transcrição é uma funcionalidade DE VERDADE: passa por `/api/transcribe`
> (mesma origem, credencial no servidor), está declarada na política e na ficha
> da Play, e as quatro peças estão presas por
> `src/security/supabase.contract.test.ts`. Fica desligada até
> `SUPABASE_PROJECT_ID`/`SUPABASE_ANON_KEY` existirem no ambiente — e sem elas
> o botão de microfone **não é desenhado**.
> **O que resta depende do painel, não do código**: o namespace KV ainda é o
> mesmo fisicamente — só o dono separa.
> **O Firebase JÁ FOI separado (07/09/2026)**: o Soulmon tem projeto próprio
> `soulmon-app`, com Google e e-mail/senha habilitados e os domínios de
> produção autorizados. Se algum doc ainda disser "compartilhado com o
> DigiApp", ele está velho — a régua viva é
> `src/deploy/firebaseNoBuild.contract.test.ts`.

> **`docs/PLANO-EVOLUCAO.md`** traz o benchmark de agosto/2026 (Habitica, Finch,
> Catzy, Forest, V-Pet/Vital Bracelet, Pokémon Sleep/GO, Palworld + psicologia do
> engajamento) e o plano em fases que saiu dele. A **essência declarada** está lá e
> rege as decisões de regra: o Soulmon é um avatar que evolui COM o usuário e o
> encoraja — nunca um cobrador.

> **`docs/REGISTRO-DE-DECISOES.md`** consolida, por tema, cada escolha de produto
> ao lado da evidência que a sustentou, da alternativa que perdeu e do gatilho
> para rever. **Antes de propor mudar uma regra de jogo, procure a linha dela
> lá**: se a mudança for a alternativa que já perdeu, a pergunta não é "por que
> não fazemos X?", é "o que mudou desde que X perdeu?".

> **`docs/SOM.md`** é o guia do eixo sonoro: onde cada regra mora, quem é o dono,
> que gate roda e o que ele reprova. **Leia antes de mexer em qualquer som** —
> `src/utils/sounds.ts`, `audioBus.ts` ou `loudness.ts`. As decisões canônicas são
> **S1..S16** no `REGISTRO-DE-DECISOES.md` §6.1 (não existe S14); o `SOM.md` orienta, não decide.
> Duas regras que já custaram caro e estão explicadas lá: **a categoria de um som
> vem do EVENTO, nunca do nível medido do arquivo**, e **o alvo de loudness nunca
> se escreve à mão no código** (há guard que reprova). O runbook completo vive em
> `squad-alpha-runs/som-01/maintainer/`, que **não vai para o git**.

> **`docs/NARRATIVA-E-UNIVERSO.md`** é a bíblia do universo (21/09/2026): o que
> cada mecânica SIGNIFICA no mundo, as doze leis de escrita (L1..L12), o
> vocabulário canônico PT+EN e a tabela "mecânica → significado → a frase que
> NUNCA pode ser dita". **Leia antes de escrever qualquer texto que o jogador
> vai ler** — fala do pet, modal, push, guia, glossário. Ela **não decide regra
> nenhuma**: a precedência é código > teste > este arquivo > manual > bíblia, e
> o que exigiria mecânica nova está isolado na §14 (Propostas — depende do
> dono). A régua viva é `src/narrativa.contract.test.ts`, que trava o
> vocabulário vetado em fonte (com a tabela `EXCECOES` do que ficou no app por
> decisão — ⚰️ 21/09/2026: chamava-se `DÍVIDA`, e não é mais dívida a quitar) e exige que todo caminho de código citado na bíblia exista.
> A squad é `/squad-narrativa`.
> ✅ **Os achados de PI dela foram DECIDIDOS pelo dono em 21/09/2026, e a
> decisão foi manter tudo**: a marca `Soulmon` ("o nome é do nosso app e
> personagens próprios") e os nomes `Serah`/`Pyraka`/`Zeed`. **Não reabra como
> novidade** — o registro, com a medição que existia na hora de decidir e o
> gatilho de revisão, é o `REGISTRO-DE-DECISOES.md` §14.
> ⚰️ **Os rótulos dos caminhos NÃO ficaram**: em 29/09/2026 o dono reverteu a
> parte deles (§14.5) — "remova toda menção a virus, data e vacina e substitua
> por poder, harmonia e benevolência". Hoje os caminhos são **Poder / Harmonia /
> Benevolência** (EN Power / Harmony / Benevolence), ids `power`/`harmony`/
> `benevolence` (formas `champion-power` etc.), campos `powerPoints`/
> `harmonyPoints`/`benevolencePoints`. O save antigo é migrado por
> `src/utils/branchMigration.ts` (dono único) e a régua
> `src/utils/branchRename.contract.test.ts` reprova id/rótulo/emoji antigo fora
> dela. Consequência prática: `Ruptura/Trama/Guarda` continuam vocabulário de
> MUNDO (para lore; Ruptura=Poder, Trama=Harmonia, Guarda=Benevolência), não
> rótulo de interface; e a régua
> trava os termos que NUNCA foram aceitos (`tamer`, `domador`, `treinador`,
> `digievolução`, `mundo digital`) mais o espalhamento de um termo aceito para
> arquivo NOVO.

> **`docs/STATUS.md` é o registro vivo do projeto**: achados de segurança em
> aberto, o que já foi corrigido e a lista do que depende do dono. Leia no
> começo da sessão e **atualize ao terminar qualquer coisa relevante**.

> **`docs/manual/00-MAPA.md`** é a porta de entrada do **manual completo** do
> Soulmon (18 documentos em `docs/manual/` — `find docs/manual -name '*.md' | wc -l`, 21/09/2026; escritos em 09–10/09/2026): visão e
> linhas vermelhas, as regras de negócio sistema por sistema, fluxo de telas,
> identidade visual e sonora, arquitetura, referência módulo a módulo, dados e
> save, integrações e deploy, histórico, índice das discussões, glossário e o
> método de manutenção. O MAPA em si não contém regra nenhuma — ele **aponta**:
> tem o protocolo de leitura para IA, o índice por assunto, o índice por
> pergunta ("vou mexer em X → leia Y, dono Z, régua W"), o índice por arquivo de
> código e a etiqueta de todo `.md` de `docs/` (vivo / registro / pesquisa /
> plano). **Sessão nova lê o MAPA inteiro antes de trabalhar num assunto** — e é
> lá que está escrito o que NÃO ler primeiro. Este arquivo continua tendo
> precedência sobre o manual (código > teste > `CLAUDE.md` > manual); quem
> guarda o índice é `src/docsManual.contract.test.ts`.
> **Desde 10/09/2026 isto roda sozinho**: o hook `.claude/hooks/session-start.sh`
> abre toda sessão com o briefing (git, delta do manual, guard, o que depende
> do dono) e a ordem de invocar **`/soulmon start`** — o `soulmon-coordenador`,
> que roteia qualquer pedido para o orquestrador dono e, ao fechar, cobra
> portões, STATUS, PR + merge e a sincronização do manual pelo
> **`doc-mantenedor`** (`/manter-docs`, também disparado a cada push na `main`
> por `.github/workflows/docs-sync.yml`).

> ## ⚠️ NINGUÉM NUNCA USOU O APP EM PRODUÇÃO (07/09/2026, informado pelo dono)
>
> **Leia isto antes de aceitar qualquer justificativa deste arquivo que comece
> com "quebraria o save de quem já joga" ou "os APKs já instalados".** São 44
> pontos entre código e docs, e todos decidem sobre uma premissa falsa: o
> namespace KV `DIGIAPP_SAVES`, as chaves `digiapp_*`, o `digimonName` do
> bridge, o `legacySpriteForStage`, o chat aceitando dois nomes de campo, e
> principalmente `LEGACY_FORM_TIERS` — **57 nomes de personagem registrado da
> Bandai que estão no bundle de produção agora**, quando `docs/Attributions.md`
> declara que "saiu tudo" (a arte saiu; os nomes não).
>
> Isso **não autoriza apagar nada por conta própria**: o dono pode ter o save
> dele num aparelho, e "ninguém em produção" ≠ "nenhum save existe". O que
> autoriza é **parar de tratar essas justificativas como intocáveis** e levar a
> decisão ao dono com a conta na mão, em vez de repetir a frase.
>
> Consequência de prioridade: sem usuários não há telemetria para ler, e a
> curva de retenção D1/D7/D30 e o desenho D30–D90 são **hipótese não
> confrontada**. O gargalo do projeto hoje é distribuição, não produto.

## Comandos (rode ANTES de todo commit)

```bash
npx tsc --noEmit     # typecheck — deve sair limpo (exit 0)
npx tsc -p tsconfig.server.json --noEmit  # functions/ e workers/ (dinheiro, conta, save); roda no CI e já voltou vermelho por ficar de fora daqui
npx tsc -p desktop/tsconfig.json --noEmit   # o overlay; roda em PR desde 3795020b
npx vitest run       # testes — todos devem passar
npm run build        # vite build + conversão PNG→WebP (dist/ é commitado!)
```

## Deploy

Repositório: `HexerVoodoom/Soulmon`.

- **Fluxo**: desenvolva na branch de trabalho combinada na sessão → commit →
  push → merge **ff-only** em `main` → push da `main` → volte para a branch de
  trabalho. (Não existem `version-b` nem `claude/digiapp-code-improvements-*`
  aqui — eram do DigiApp.)
- **Regra de autonomia — vale para toda sessão, sem exceção**: quando o
  trabalho estiver pronto (`tsc`/`vitest`/`build` limpos), abra o PR e **faça
  o merge na hora**, sem perguntar e sem esperar aprovação do dono. Não crie
  loop de "check-in" (`send_later`/trigger reagendando de hora em hora só pra
  reverificar CI/mergeabilidade) — isso já aconteceu antes e virou dezenas de
  agendamentos que nunca mergeavam nada sozinhos. Se o CI ainda estiver
  rodando, espere UMA vez o resultado e mergeie; não fique num loop
  observando. A única exceção legítima para NÃO mergear é um bloqueio real e
  documentado (algo que só o dono pode decidir/fazer, tipo os itens
  "depende do dono" do `docs/STATUS.md`) — nesse caso avise o dono **uma
  única vez** em vez de ficar reagendando checagens silenciosas.
- `main` é a branch de produção do **Cloudflare Pages**; o push publica sozinho
  em ~2 min. `dist/` **é commitado** (o CF também builda, mas o commit é o que
  garante o conteúdo).
  ⚠️ **Por isso `.env.production` é COMMITADO** (`.gitignore` tem `!.env.production`).
  As `VITE_*` são inlinadas em BUILD, não lidas em runtime; como o CI builda de
  novo a cada push sem o `.env` da máquina do dono, um deploy manual correto era
  desfeito ~1 min depois pelo build do CI e **o login morria em produção a cada
  push** (medido em 07/09/2026: deploy 19:51:16, build do CI 19:52:19, login
  quebrado). Ali só entram as quatro `VITE_FIREBASE_*`, que são públicas por
  design (vão no bundle de qualquer jeito); segredo de servidor continua em
  `wrangler secret put`. Quem guarda a regra:
  `src/deploy/firebaseNoBuild.contract.test.ts`.
- A URL de produção é **`soulmon.mateus-sprnd.workers.dev`**, e as três fontes
  já concordam: `capacitor.config.json` (chave `url`),
  `desktop/renderer/src/config.ts` (`APP_URL`) e
  `desktop/electron/main.js` (`FULL_APP_URL`).
  ⚠️ **Esta linha citava `config.ts:6` e `main.js:26` — e em 27/08/2026 as duas
  estavam erradas** (21 e 37). A do `main.js` já estava errada antes de alguém
  mexer; a do `config.ts` escorregou no mesmo dia, ao ganhar um comentário
  acima. **É a regra deste arquivo sendo violada por este arquivo**: a
  referência canônica é `arquivo` + SÍMBOLO, e o motivo está escrito na tabela
  de regras — o endereço apodrece mais rápido que o número, e um `grep` pelo
  símbolo reencontra o alvo enquanto um número escorregado aponta para código
  não relacionado. Quem obriga as fontes a concordarem é
  `src/deploy/appUrl.contract.test.ts` — **essa** é a régua viva, não esta lista.
  ⚠️ **Até 26/08/2026 este arquivo afirmava que a URL ainda era a do DigiApp
  (`digiapp-a5e.pages.dev`) e mandava não trocar.** Era falso — a migração já
  tinha acontecido, e a mesma mentira estava no `docs/PLANO-DESKTOP-STEAM.md`
  (item 15). Um agente que lesse isto decidiria errado sobre deploy. Verificado
  nas três fontes antes de corrigir.
  O KV ainda aponta para o namespace herdado, mas o NOME do binding deixou de
  ser uma trava: `functions/api/_kv.js` aceita `SOULMON_SAVES` e `DIGIAPP_SAVES`
  (07/09/2026). Separar os DADOS continua sendo decisão do dono — ver
  `docs/SEPARACAO-DIGIAPP.md`, passo 2.
- O **APK carrega a URL de produção**, então mudança web NÃO precisa de APK
  novo. Só mudanças em `android/` precisam — o GitHub Actions
  (`android-build.yml`) builda no push e o artefato fica em
  `github.com/HexerVoodoom/Soulmon/actions/runs/<id>`.
  ⚠️ **O app Electron tem DOIS workflows desde 26/08/2026, e esta linha citava
  só um.** `desktop-build.yml` builda em push da `main` com `--publish never` e
  só sobe artefato (`permissions: contents: read`); `desktop-release.yml` é o
  **único** caminho de publicação e dispara **só em tag `v[0-9]+.[0-9]+.[0-9]+`**
  (`permissions: contents: write`). A separação é em dois ARQUIVOS porque o poder
  de publicar acompanha o `permissions:` do arquivo — antes, um push de branch de
  rascunho criava um GitHub Release, que é a fonte do auto-update do
  `electron-updater`, e instalava um `.exe` sem assinatura na máquina do jogador.
  **Publicar não pode ser efeito colateral de commitar.** Ver `desktop/README.md`.
- O worker de push (`workers/`) **não** é uma Pages Function: não builda no
  push da `main`. Deploy manual com `wrangler deploy` dentro de `workers/`.
- Ao mudar assets estáticos/HTML de forma incompatível, **bump `CACHE_VERSION`**
  em `public/sw.js` — senão usuários ficam presos em cache velho.
  ⚠️ **O NÚMERO SAIU DAQUI DE PROPÓSITO, na terceira vez que ele apodreceu.**
  Este arquivo dizia "v24" até 26/08/2026 (69 versões atrás) e "v101" até
  09/09/2026, quando o `sw.js` já estava em v108 — sete atrás. E a mentira aqui
  é PERIGOSA, não só feia: quem lê "v101 atual" e bumpa para v102 anda para
  TRÁS, e o cache velho volta para todo mundo. O valor vive num lugar só —
  `public/sw.js`, primeiras linhas. Abra o arquivo e some 1.

## Regras do jogo (fonte da verdade — NÃO reinventar)

| Sistema | Regra |
|---|---|
| ❤️ Corações (HP) | Perde na virada do dia: `min(floor((1 − feitas/**metaDeCoração**) × maxHP), MAX_HEARTS_LOST_PER_DAY)`. ⚠️ **DUAS RÉGUAS desde 07/09/2026 (P1)**: a meta que PROTEGE O CORAÇÃO é `heartGoalFor` = `max(1, ceil(dailyGoalFor × HEART_GOAL_RATIO))`, com `HEART_GOAL_RATIO = 0,6` — enquanto a meta do **dia completo** (⭐ abaixo) continua sendo `dailyGoalFor` INTEIRA. Em número: mega precisava de 5 de 6 para não perder coração e passa a precisar de 4; rookie continua em 3. A excelência não foi afrouxada (princípio #3): quem quer evoluir continua tendo que fazer tudo. `dailyGoalFor` = `min(PESO cadastrado no dia, requisito do estágio)`. **"Feitas" e "cadastradas" são PESO DE ESFORÇO, não contagem de itens** (hábito = `HABIT_WEIGHT` = 1; tarefa = seu `effort` 1–3; `someday`/`dropped` não entram). Os dois lados da razão usam a MESMA unidade — se o feito contasse itens e a meta contasse esforço, uma tarefa de projeto pediria 3 e entregaria 1, cobrando coração de quem fez 100%. Cumpriu o requisito (ou fez tudo que cadastrou) = não perde. **Teto de 1 coração por dia** — um dia ruim é um sinal, não uma sentença. **Ausência ≥2 dias não cobra nada** (`ABSENCE_FORGIVENESS_DAYS`): quem volta encontra saudade, não fatura. **Segunda-feira devolve 0.5** (`WEEKLY_RELIEF_HEARTS`) — o teto do estrago é 7 dias. **UM DIA DE FOLGA POR SEMANA, grátis e automático** (`REST_DAYS_PER_WEEK = 1`, P2): a primeira perda de coração da semana é absorvida sozinha, na virada, sobre um dia que já terminou — quem precisou de folga não abriu o app, então declará-la de antemão seria mais um item de planejamento. Sem acúmulo, recarrega na segunda (`restWeekKeyFor`), **não vira dia completo** e o relatório do dia CONTA que ela foi usada (`lastDayReport.restDayUsed`) — perdão que a pessoa não soube que recebeu faz a cobrança da semana seguinte parecer arbitrária. Não confundir com os escudos de `habitRhythm.ts`, que protegem o RITMO de um hábito e nunca tocaram em HP. HP aceita frações de 0.5. HP 0 → degeneração. |
| 🫶 Carinho | Cura principal de HP. Esfregar o pet (pointer drag): ~2s = +0.5 coração, **máx. 1 coração/dia** (`careCaps.rubHeal` **no save**, ver 🧮 abaixo). Animação (explosão de corações) sempre toca. Alternativa: item **Coraçãozinho** (`💗`, só dropado na masmorra — ⚰️ 06/09/2026, D7+D15: saiu da loja, lápide em `src/utils/shop.ts` acima de `SPECIAL_ITEMS`) cura +1 coração ao ser usado na pastinha. **Dono único do USO de item especial: `src/utils/specialItemUse.ts`** (`specialRefusal`/`applySpecialItem`) — não é o `careUpdaters.ts`, porque aquele arquivo existe para guardar o TETO e item especial não tem teto. ⚠️ Até `dcbeb42d` a regra vivia em três updaters inline do `handleFeed`, e carregava a família de bug do X-6: a recusa de vida cheia era lida do `gameState` de FORA do updater, então **dois toques no mesmo lote do React** liam o mesmo estado, passavam a recusa duas vezes e a segunda passada decrementava o inventário para curar ZERO — 150 Bits queimados em silêncio. `applySpecialItem` reconfere a recusa sobre o `prev`. **Não reintroduza regra dentro de updater inline.** |
| 🍎 Comida | Máx. **`MAX_STAGE_REQUIREMENT` por hora** (hoje **6**; janela deslizante, `careCaps.feedTimes` **no save**, ver 🧮 abaixo). O teto é **derivado** do maior requisito diário da escada (`FORM_REQUIREMENTS`), nunca um literal: era 5 contra um mega que precisa de 6 barras, e quem fechava as 6 tarefas numa sessão só não conseguia dar a 6ª comida — dia perfeito negado a quem fez 100%. Dá +1 energia + pontos de atributo (poder/harmonia/benevolência → galho de evolução). NÃO cura HP. Recusa = pet fala que está cheio (sem toast). Ganha-se comida completando atividades. Chips/coraçõezinhos NÃO contam nesse limite. |
| 🧮 Onde os tetos moram | **No SAVE (`careCaps`), nunca no localStorage** — dono: `src/utils/careCaps.ts`. Enquanto os dois contadores moravam no aparelho, o mesmo jogador com PWA **e** APK tinha DOIS tetos: **2 corações/dia e 12 comidas/hora** em vez de 1 e 6. O teto existe como regra de CUIDADO, e um teto furável trocando de aparelho desfaz a regra. As REGRAS seguem em `careRules.ts` e não mudaram — mudou só de onde o estado vem; `careCaps.ts` não redeclara nenhuma constante de teto (há teste travando). A migração das chaves antigas é **idempotente** (união de `feedTimes`, `max` de `rubHeal.healed`), porque roda no save local **e** de novo quando a nuvem é adotada. ⚠️ **Isto fecha o furo só enquanto os aparelhos estiverem no MESMO save.** Dois aparelhos escrevendo em paralelo ainda dependem de save na nuvem confiável (fatia 1) — o último a gravar vence, e **quem vence não está decidido**. Ver `squad-alpha-runs/soulmon-02/builder/tetos-cuidado-no-save.md`. **O DIA de todo registro diário que mora no save é o DIA DO JOGADOR** (`src/utils/playerDay.ts`), em fuso FIXO gravado no save (`playerDayTz`) — nunca `new Date().toDateString()`, que é o dia do APARELHO e fazia dois celulares em fusos diferentes discordarem do nome do dia todo dia. Consumidores (verificados no código em 26/08/2026 — eram 4, hoje são **7 famílias**; a lista do cabeçalho de `src/utils/playerDay.ts` **foi atualizada em `d1bbf0ff`** e hoje cita as sete, então as duas fontes concordam — a régua VIVA continua sendo `playerDay.contract.test.ts`). ⚠️ **As referências abaixo citam SÍMBOLO, não linha**, de propósito: elas já escorregaram três vezes num único dia — o endereço apodrece mais rápido que o número, e um `grep` pelo símbolo reencontra o alvo enquanto um número escorregado aponta para código não relacionado. **carinho** `careCaps.rubHeal` (→ `rubDecision` de `utils/careUpdaters`, chamado no `App.tsx`) · **check-in** `lastCheckInDate` (escrita e trava de sessão no `App.tsx`; leitura em `needsCheckIn`, `utils/rituals.ts`) · **humor** `moodLog[].date` (`recordMood`/`moodFor`) · **cocô** `poopDrainCharge.day` (`applyPoopDrain`/`cleanPoop`, `utils/poopDrain.ts`) · **brincar** `playLog` (`utils/petNeeds.ts` + a IIFE do `PlayCard` no `App.tsx`) · **a manhã** `RestNight.date` / `restConstancy` (`recordNight`, `utils/restWindow.ts`) · **o pesadelo** `nightmares.fought` (`utils/nightmares.ts`). Todas as sete passam por `playerDayKey(now, playerDayTz)` — é esse o `grep` que acha a família inteira. **A comida NÃO entra**: o teto dela é por HORA e por janela deslizante (`FOOD_LIMIT_PER_HOUR`, `careRules.ts`), não por dia — `careCaps.feedTimes` são timestamps, e timestamp não tem nome de dia para discordar. ⚠️ **`dayKeyOf` (`habitRhythm.ts`) NÃO é isso e não pode virar isso** — é a chave do motor de hábitos, de `perfectDays`, da streak e do gatilho de virada; redefini-la dispararia virada espúria em todo save existente. Há guard de fiação no AST (`playerDay.contract.test.ts`). |
| ⚡ Energia | Enche só comendo, zera todo dia. **Barras de energia = requisito de tarefas do estágio** (`getMaxEnergyForStage` = `FORM_REQUIREMENTS.required`; ex.: rookie precisa de 4 tarefas → 4 barras). **Condição do dia perfeito: energia ≥ META DO DIA** (`dailyGoalFor`, hoje ponderada por esforço), e não ≥ requisito cru — comida vem de concluir tarefa, então num dia de meta 2 a energia máxima ALCANÇÁVEL é 2; cobrar 6 ali negava o dia perfeito a quem fez 100% da própria meta. As barras exibidas continuam sendo o requisito do estágio. |
| ✨ Traço de nascimento | `utils/passives.ts`: todo pet nasce com UM traço sorteado (`petPassive` no GameState), visível em Estatísticas. **Todos são positivos** — traço negativo puniria por um dado que o jogador não jogou; a variedade é em ESPÉCIE, não em força (há teste travando). Guloso (+1 atributo/comida) · Carinhoso (carinho cura até 1,5/dia) · Teimoso (perde só 0,5 coração no dia ruim) · Sortudo (+5pp de coraçãozinho na masmorra) · Madrugador (cocô só a partir das 10h). Os efeitos são lidos **do estado**, nunca por parâmetro novo — é o que faz o desktop herdar sem uma segunda implementação. |
| 🧭 O "porquê" do usuário | `soulGoal` e `soulStruggle`: duas perguntas abertas no onboarding, **antes de qualquer mecânica de jogo** (passos `GOAL_STEP`/`STRUGGLE_STEP`, ids negativos como `DEMO_PICK`, para não renumerar o ritual). Ambas puláveis — obrigar a escrever antes de ver o app é o jeito mais rápido de perder alguém. O `DailyReportModal` devolve o objetivo em dias perfeitos e no retorno. A página de Evolução mostra o **galho previsto** e, no empate, que é o ritmo que decide. |
| ⭐ Dia completo (ex-"dia perfeito") | `peso feito ≥ dailyGoalFor && ≥1 cadastrada && energia ≥ dailyGoalFor` — **a MESMA meta nos dois eixos**, e a meta INTEIRA, não a de coração (P1). ⚠️ **O NOME mudou em 07/09/2026 (P5), o mecanismo não**: os textos PT/EN dizem "dia completo"/"complete day", e `perfectDays`/`wasPerfect`/`dayWasPerfect` continuam com o nome que têm no código. O motivo é de tom, e está em `product/soulmon-01/balance/carga-diaria.md` (P5): como o contador nunca decresce, o NOME era pior que o mecanismo — "perfeito" é a palavra que transforma um dia bom em fracasso para quem tem traço perfeccionista, e a meta é **ponderada por esforço** (ver ❤️ acima): hábito pesa 1, tarefa pesa o próprio `effort` 1–3 → +1 ponto de evolução (perfectDays). Mesma meta da regra de HP. Retrocompatível por construção: `normalizeEffort` devolve 1 para item sem o campo, então em save antigo peso == contagem. Item **🌀 Glitchtama** (recompensa por concluir os 5 andares da masmorra) dá +1 perfectDay ao ser usado na pastinha — **no máximo 1 por DIA DO JOGADOR** (`GLITCHTAMA_PER_DAY`, registro `glitchtamaUse` no save, dono `src/utils/specialItemUse.ts`). ⚠️ O teto entrou em 06/09/2026 e a conta é o motivo: rookie→mega custa 14 dias perfeitos, o Ultra custa mais 45 = **59**, a masmorra não tem limite diário nem gate de entrada, e concluir os 5 andares sempre dropa um Glitchtama — então **59 runs seguidas compravam a escada inteira num fim de semana**, contra a justificativa escrita em `progression.ts` de que a paciência do Ultra é "o recurso que não cresce indefinidamente". A recusa (`'daily-cap'`) acontece **antes** do decremento: o item volta para a pastinha e vale amanhã. |
| 🥚 Renascimento (Rebirth) | Dono único: **`src/utils/rebirth.ts`**. Só depois do **ultra**, só para `accountTier:'paid'`, e **UMA VEZ SÓ**. ⚠️ **A recusa é MOTIVADA e a tela usa o motivo** (06/09/2026): `rebirthRefusal` distingue `not-paid` / `not-ultra` / `already-used` porque cada um tem saída diferente, e o `App.tsx` só chamava `canRebirth` — um jogador `demo` no ultra via NADA enquanto o `GuideModal` prometia o recurso a todos. Hoje `not-paid` na página de Evolução renderiza o `UnlockNudge` (motivo de telemetria `evolution`, que é onde o card está); `not-ultra` não vira convite (a própria página já conta a escada) e `already-used` é registro, nunca oferta repetida — o registro `rebirth` no save é o que impede a segunda vez, então ele nunca é apagado. Volta a **rookie com CERIMÔNIA de ovo**: não existe estágio `egg` e ele **não** foi reintroduzido (reabri-lo custaria sprite, HP máximo, requisito diário e masmorra); o ovo é a TELA. **Perde-se o estágio e os três atributos, e SÓ** — Bits, Emblemas, Créditos, decoração, cenários, sonhos, marcos/constância, tarefas, `perfectDays`, `totalPerfectDays` e `unlockedEvolutions` passam intactos (há teste listando campo por campo). Não é castigo, é TROCA declarada: em troca o jogador escolhe **criatura** (campo aberto, higienizado e entre aspas no prompt — delimitar é o que impede injeção), **escola** (as 6 do class-system) e **elemento** (base ou par de 2º nível), e o orçamento da ficha inteira é multiplicado por `REBIRTH_BUDGET_MULTIPLIER` (1.5, nunca 2 — dobrar destrava geração adiantada e faz o rookie renascido ler como mega). As escolhas entram no prompt das **11 formas**, nas duas variantes (há teste), e a cláusula "Do not copy any existing franchise character" continua nas duas. `applyRebirth` é PURA e **idempotente**: a 2ª chamada devolve a MESMA referência (footgun 6). ⚠️ **`perfectDays` NÃO zera, de propósito** — quem renasce reescala rápido; o preço é abrir mão da forma, não meses de castigo. |
| 🔒 Cadeado de evolução | Na página de Evolução, tocar na criatura ATUAL alterna `evolutionLocked`. **Travado: a cerimônia não abre** — `handleEvolve` devolve o mesmo estado e `canEvolve` é `false`; os `perfectDays` seguem acumulando e a degeneração por HP 0 continua valendo. **Destravado: o JOGADOR dispara**, tocando na criatura com a barra cheia. ⚠️ Esta linha dizia "Destravado: evolui na próxima virada (o critério já cumprido dispara)" — descrição do comportamento de ANTES de `MANUAL_EVOLUTION = true`, e o ramo que fazia isso (`utils/dailyReset.ts`, atrás de `!MANUAL_EVOLUTION`) está morto. A mesma mentira estava em TRÊS textos de interface do `EvolutionPath.tsx`, dois deles com os estados travado/destravado invertidos — quem enchia a barra e esperava a virada não via nada acontecer, com a barra cheia na tela, o que lê como defeito. Corrigido em 09/09/2026; a régua viva é `src/components/evolucaoManual.contract.test.ts`. |
| 💩 Cocô | Até 2×/dia: 1º agendado 07–15h; 2º agendado 8–10h após o 1º APARECER. Nunca aparece dormindo. Não limpo = **−1 coração a cada 6h** (`poopPenaltyClockAt`; pausa dormindo; banho zera), **mas o dreno obedece ao MESMO teto diário da virada** — `MAX_HEARTS_LOST_PER_DAY`, o traço **Teimoso** (`heartLossCap`) e o perdão por ausência (`ABSENCE_FORGIVENESS_DAYS`). Dono único da regra: **`src/utils/poopDrain.ts`** (`applyPoopDrain`), função PURA; `App.tsx` só delega. O teto é **diário e persistido** (`poopDrainCharge {day,hearts}` no save), **nunca por tick** — senão quatro ticks de 6h custariam 4 corações, cada um "dentro do teto". Auditoria de 25/08/2026: `App.tsx` subtraía `periods` cru e drenava **o HP inteiro do pet**, escapando das três travas; contrato travado em `src/utils/poopDrain.regression.test.ts`. **Não reintroduza aritmética de HP no `App.tsx`** (footgun 9). Notificação ~30min antes do tick, e só se o tick for cobrar. ⚠️ Até 26/08/2026 esta linha dizia "Ovo/baby-i isentos": **é resíduo e não existe mais** — a árvore nasce em rookie (`types/progression.ts` › `FORM_REQUIREMENTS`, sem `egg`/`baby`) e `useCareSystem.ts` não tem isenção por estágio nenhuma. Nada a consertar; só não reintroduza a isenção achando que ela já existia. |
| 🚿 Banho | Sempre disponível. Limpa o cocô (para o dreno). |
| 💤 Dormir | Toggle manual (persistido) + sono automático opcional (janela nas Configurações; age só nas transições). Dormindo: sem cocô, dreno pausado. |
| 📊 Relatório diário | Escrito no reset (`lastDayReport` no GameState), mostrado 1×/dia (`DAILY_REPORT_SHOWN`). |
| 💠 Bits (moeda) | Moeda dos minijogos = `gamePoints` no GameState (nome do campo mantido). Exibida **sem ícone**, só o número + "Bits" em **fonte de calculadora** (`utils/currencies.ts` → `bitsStyle`; `bitsStyleLight` é hoje idêntico — Bits em `--sm2-primary-ink` nos dois temas, decisão D-L11 do canvas Loja, 20/09/2026). Ganhos: Dino floor(score/100) · PPT 5/vitória · Masmorra (Bits/inimigo + bônus de andar **escalado**: `10+5×(andar−1)` = 10/15/20/25/30). Gasta na loja comum. |
| 😊 Check-in de humor | `utils/mood.ts`: 5 carinhas dentro do relatório diário (que já aparece 1×/dia, então não custa uma abertura a mais do app). **Opcional, e NUNCA alimenta pontuação** — não entra em dia perfeito, HP nem evolução; há teste rodando a virada com e sem humor ruim e exigindo resultado idêntico. Se virasse insumo de score, a pessoa responderia o que rende ponto em vez do que sente. O app **devolve** um resumo dos últimos dias — coletar e não devolver é extração. |
| 🌿 Ritmo de cuidado | `utils/carePattern.ts`: lê o histórico de conclusões (tarefas avulsas em `completedTasks` **+ atividades recorrentes em `activityLog`**, teto de 90 — sem o log, o ritmo ficava cego justamente para o mecanismo principal de hábito) e classifica em Constante / Explosivo / Equilibrado. Entra como **critério de desempate** do galho na evolução manual — os atributos (que vêm da categoria da tarefa) continuam mandando; o ritmo só decide no empate, que antes caía numa ordem fixa sem significado. É a ideia dos *care mistakes* do v-pet de 97: o jeito como você cuidou define quem seu bicho vira, e **nenhum ritmo é melhor que outro** (teste exige que os três puxem galhos distintos). Com pouco histórico a leitura se declara não-confiável e não desempata. |
| 🎪 Rodada do Torneio | `utils/tournamentSeason.ts`: sexta a domingo, toda semana. É **ritual, não tranca** — fora da janela o Torneio segue inteiro disponível. Janela de DIAS, nunca de horas (evento de 3h exclui quem trabalha). Faixas em `utils/tournamentTiers.ts` (Semente→Broto→Guardião→Ancião→Lendário) aparecem **antes** do ranking global: posição absoluta é a leitura associada a comparação tóxica, e a faixa mede o jogador contra ele mesmo — teste garante que acumular pontos nunca rebaixa. |
| 🎖️ Emblemas | Moeda do **Torneio** = `emblems` no GameState. Ganha por partida: 3 vitória / 1 derrota (`EMBLEMS_PER_WIN`/`_LOSS`). Compra **só** os itens de `TOURNAMENT_ITEMS`, na aba Torneio da loja — hoje 8, escada 8/12/15/20/25/40/55/70 (≈3 a 23 vitórias): Caixote 📦, Prateleira Simples 🗄️, Estandarte 🎌, Mural de Medalhas 🏅, Estante de Troféus 🏆, Arena dos Campeões (cenário), Pódio 🥇, Arena sob Holofotes (cenário). As quatro vitrines ocupam o espaço `trophy` do palco e **exibem os troféus de season realmente ganhos** (🥇🥈🥉). Dourado, fonte com serifa — não pode ser confundida com as outras. **Tudo na aba é COSMÉTICO (`bg`/`furniture`) e isso é regra**: Emblemas ficam no save do cliente (farmáveis por quem editar o localStorage), o que só é aceitável enquanto não comprarem vantagem — se um dia comprarem, têm que ir pro servidor junto dos Créditos. Há teste travando. |
| 💎 Créditos | Comprados com **DINHEIRO REAL**; vivem no servidor (`ent:<saveId>`), nunca no save do cliente. Gastam em reroll (`REROLL_COST_CREDITS` = 50) e **troca por Bits** (⚰️ 06/09/2026, D7+D15: a cura instantânea `HEART_COST_CREDITS` = 10 saiu; lápide em `src/utils/monetization.ts`) (1 Crédito = 10 Bits, `BITS_EXCHANGE`). São a **ÚNICA** moeda que libera gerar o pet próprio (via `accountTier:'paid'`, que só uma compra verificada concede). **Não existe Bits→Créditos** — permitir farmar créditos anularia a exclusividade do dinheiro real. |
| ⚔️ Masmorra | uma **run = 5 andares** (`MAX_FLOORS`, que mora em `components/DungeonGame.tsx` — este arquivo o atribuía a `utils/dungeon.ts`, onde ele nunca esteve; achado na auditoria de 09/09/2026); cada andar = escada de **6 inimigos aleatórios** subindo os tiers em ordem (baby-i→baby-ii→rookie→champion→ultimate→mega, via `LADDER_TIERS`; roster = as **9 linhas próprias** de `DUNGEON_LINE_SPRITES` (eram 6 até 15/09/2026) (`utils/sprites.ts`), sorteadas por tier; `getDungeonEnemySprite(tier, petStage)` tira do sorteio a linha que o jogador está usando, pra ninguém encarar um espelho de si mesmo). Dificuldade do andar F = **base + (F−1)** (`buildDungeonWave(level)`; ~1 tier de jogador por nível → andar 1 serve rookie, andar 2 champion, etc.). Cada andar tem **cenário retrô** (`utils/dungeonScenes.ts`: Tamagotchi/VHS/Sol Neon/CRT/Glitch + overlay VHS `dungeon-vhs`). HP do jogador carrega entre andares (+25% de cura ao limpar). **Concluir os 5 andares** sobe a base (`setDungeonDifficultyAtLeast(base+1)`); base **persiste e reseta toda SEMANA** (`DUNGEON_DIFFICULTY` = `{week,level}`). **Sem limite diário e SEM gate de entrada**: perder **não custa coração nenhum** — o que está em jogo é a run (bônus de andar, Glitchtama, placar). O jogo NUNCA cobra da barra que representa o cuidado que o usuário teve consigo mesmo; antes cobrava, e isso trancava fora do conteúdo justamente quem tinha tido uma semana ruim. Se farmar Bits virar problema, a alavanca é custo de ENTRADA em Bits, nunca o retorno do custo em corações. **Bestiário** (`bestiary` no save, chave `linha-tier` de `enemyKey`): as **36** artes possíveis (9 linhas × 4 tiers de arte — baby-i/ii reusam o rookie; eram 24 com 6 linhas até 15/09/2026), na aba Estatísticas, com **silhueta** para o que ainda não apareceu e contagem de COLEÇÃO (nunca percentual, nunca "faltam N"). ⚠️ O campo era gravado no save de TODO jogador desde 06/09/2026 e **lido por ninguém** — a terceira repetição do padrão dos WP4.15/4.16. A seção tem condição PRÓPRIA e **não é aninhada no álbum de formas**: o álbum depende de `soulmonStages`, que o jogador grátis não tem, e ele é justamente quem mais roda masmorra. **Ranking** = melhor placar (`DUNGEON_BEST`). Drop de **coraçãozinho** MUITO raro (`💗`, 5%/inimigo, máx. 2/dia, `DUNGEON_HEART_DROPS`) — **NÃO dropa comida**. Concluir os 5 andares também dá **🌀 Glitchtama** (+1 perfectDay ao usar, **1 por dia** — ver ⭐). Cenário de cada andar é sorteado por run (`buildRunScenes`: 5 clássicos CSS (`DUNGEON_SCENES`) + **13** cenas pintadas (`SPIRIT_BG_SCENES` — as 5 grutas originais, **6** novas e as 2 arenas do Torneio; dizia 12/5 até 26/08/2026) + os 16 bgs da loja (`SHOP_BG_ACCENTS`), tudo em `utils/dungeonScenes.ts`). Stats do jogador escalam com o estágio (`PLAYER_STATS`). |
| 🛒 Loja | Na página Atividades (`ShopModal`, estética 8-bit). Catálogo em `utils/shop.ts` (preços em 🪙 Bits): **chips** de atributo (120) — NÃO aplicam na hora, vão pra **pastinha de itens** (`foodInventory`, emoji 👊/🎶/🤲 — eram 🦠/💾/💉 até 29/09/2026, migrados no load); ao USAR dão +3 no atributo e **nada mais** (sem energia) · ⚰️ **coraçãozinho** (`💗`, 150) saiu da loja em 06/09/2026 (D7+D15) — só existe em `SPECIAL_ITEMS` (catálogo de USO), vem da masmorra · **decoração** (100–140, 27 à venda em Bits) que ocupa espaços do palco (ver `docs/PALCO-E-DECORACAO.md`) — chão (grama/areia/ladrilho/tábuas/circuito, e note que os dois primeiros são de EXTERIOR: o espaço `rug` tinha um único item e ele era `indoor`, deixando sem chão justamente quem joga em cenário aberto), interiores, exteriores e peças que servem em qualquer cenário · cenários (150–250, 19 à venda — `utils/backgrounds.ts`; os 8 mais novos são arte PINTADA em vez de gradiente). **Loja em SEGMENTOS** (`Segment tonal` desde o canvas Loja, 20/09/2026; Itens/Cenários/Mobílias/**Torneio**/Missões — a de Torneio cobra em Emblemas, `TOURNAMENT_ITEMS`). Itens podem ter `unlock` (`utils/shop.ts`): aparecem escurecidos com 🔒 e toque mostra a dica de desbloqueio (`mission`). **Glitchtama NUNCA é vendido** (só na masmorra). **Missões** (`utils/missions.ts`, aba na loja): 6 objetivos permanentes (evoluir a champion/mega via `unlockedEvolutions`, 100 kills/3 runs na masmorra, 1000 no Dino, 30 dias perfeitos TOTAIS) → LIBERAM A COMPRA dos 6 cenários exclusivos `bg-mission-*` (300 cada; fora do sorteio da masmorra); contadores lifetime no GameState (`dungeonKills`, `dungeonRunsCompleted`, `dinoBest`, `totalPerfectDays`). Consumíveis especiais em `SPECIAL_ITEMS` (distinguidos no `handleFeed`). Efeitos em `handleShopBuy`. **Missões SEMANAIS** (`utils/weeklyMissions.ts`): 3 sorteadas por semana ISO de um pool de 12, DETERMINÍSTICO por `weekKey` (lista que muda a cada abertura ensina a reabrir o app até cair uma fácil), pagas em **Emblemas**, no topo do segmento Torneio — onde a moeda é gasta. ⚠️ **Nenhuma premia CONTAGEM DE TAREFAS** (proibição escrita; o pool é de cuidado e presença, há teste varrendo). Contadas por **um ponto único** no `App.tsx` (`contarMissao`), porque `forWeek` tem de virar a semana no MESMO updater que soma. Até 06/09/2026 o módulo tinha **zero consumidores** — e era o único sumidouro dos Emblemas, que sem ele param de comprar qualquer coisa depois de ~82 vitórias. Guard de fiação: `weeklyMissions.fiacao.test.ts` exige gatilho para TODA missão do pool. |

### Motor de tarefas (docs/PLANO-TAREFAS.md — Fases 1 a 3)

Dois contratos, e eles não se misturam: **hábito = CONSTÂNCIA** (o valor está em
repetir) · **tarefa = EXECUÇÃO** (o valor está em terminar e sair da cabeça).

| Sistema | Regra |
|---|---|
| ⚖️ Meta ponderada | `dailyGoalFor` soma **PESO DE ESFORÇO**, nunca itens: hábito = `HABIT_WEIGHT` (1), tarefa = seu `effort` (1 rápida / 2 média / 3 projeto). Tarefas `someday`/`dropped` **não entram**. Enquanto tudo valia 1, a estratégia ótima era cadastrar cinco triviais em vez de encarar a difícil — o defeito documentado do Karma do Todoist. Dono: `types/taskModel.ts` (constantes) + `utils/dailyReset.ts` (`registeredForDay`/`dailyGoalFor`). **NÃO reescreva `Math.min(…, FORM_REQUIREMENTS[…].required)` em lugar nenhum** — há guard (`dailyGoal.contract.test.ts`). |
| 🔁 Recorrência | `Schedule` = `weekdays` (o antigo, ainda padrão de saves velhos) · `timesPerWeek` (perdão embutido: a pessoa escolhe os dias; quem julga é `weeklyProgress`, nunca o calendário) · `everyNDays` com `from: 'schedule' \| 'completion'`. **`from:'completion'` é o `every!` do Todoist e o item mais importante**: contando da CONCLUSÃO é estruturalmente impossível acumular atrasadas — sumir um mês devolve UMA ocorrência, não trinta. `normalizeSchedule` lê `weekDays[]` antigo como `{kind:'weekdays'}`; o campo antigo continua escrito porque widget Android e desktop leem ele direto. |
| 📈 Constância | **"N das últimas 7"** (`CONSTANCY_WINDOW_DAYS`), nunca streak que zera — uma falha custa ~14%, não 100%. Denominador = só os dias em que o hábito ERA DEVIDO (senão um 3x/semana apareceria como 43%). Dia protegido por escudo conta como FEITO. Hábito novo devolve ratio 1 (*progresso dotado*, Nunes & Drèze — ninguém começa em 0%). **Se alguém acrescentar um `streak` que zera, desfez a tese do produto** — há teste travando. Dono: `utils/habitRhythm.ts`. |
| 🛡️ Escudos de descanso | 1 a cada `REST_SHIELD_EARN_EVERY_DAYS` (7) dias de boa constância (`GOOD_CONSTANCY_RATIO` = 5/7), teto `REST_SHIELD_MAX` (3). **Consumidos AUTOMATICAMENTE** em `applyMissedDay` — proteção que exige lembrar de ativar antes de falhar não protege ninguém (é o defeito da Pousada do Habitica; o Streak Freeze só funcionou quando veio equipado por padrão). Idempotente por dayKey: a virada pode rodar 2× e não gasta dois escudos. Conclusão tardia NÃO devolve escudo já gasto. |
| 🚫 Never miss twice | A **primeira falha não gera nada visível**. `needsIntervention` só em `MISS_INTERVENTION_AT` (2) faltas seguidas, e aí o pet oferece uma **versão reduzida** ("hoje, só 5 minutos?") — aceitar conta como feito. Modelo do Finch; oposto exato do dano de HP do Habitica. |
| 🌳 Marcos de hábito | A cerimônia **espera o gesto** (`MilestoneCeremony`): botão com saída relacional + a DATA, z-index **300**. ⚠️ Ela fechava sozinha em 2,5s, sem botão, em z-60 — contra o aceite escrito no ledger ("o modal não fecha sozinho") e contra o dossiê: o que faz a pessoa REGISTRAR o marco é a saída pertencer a ela, e o de 66 dias era comemorado sob o check-in. **Movimento reduzido reduz o MOVIMENTO, nunca a pausa** — caía para um `toast.success` igual ao de qualquer tarefa, entregando menos cerimônia a quem tem mais chance de precisar de acessibilidade. `HABIT_MILESTONES` = **7 / 21 / 66** dias efetivos (Lally et al. 2010, mediana real 66 — os "21 dias" são de Maxwell Maltz/1960, sobre cirurgia plástica, e não têm a ver com hábito). Tiers seed→sprout→sapling→tree, ícone evolui na lista, e `HABIT_TIER_BONUS` dá **+0/10/20/30%** de rendimento de atributo. Multiplicador **sempre ≥ 1**: esforço antigo vale MAIS, nunca menos. `milestoneReached` existe para a celebração tocar UMA vez (nada de estado de UI no save). |
| 👻 Assombrada | Tarefa ativa vencida OU parada há `HAUNTED_AFTER_DAYS` (7) dias. Esmaece + partícula escura; **o pet OLHA** (`hauntedWatching` → classe `sm-pet-haunted`, WP3.2, 06/09/2026 — até então esta linha prometia o olhar e não havia UMA ocorrência de `haunted` no `CompanionHUD.tsx`; é gesto, sem texto junto, e há teste exigindo que nenhuma palavra de cobrança acompanhe); **concluir dá bônus de alívio** (comemoração maior). É a peça mais Soulmon do plano: a pilha de culpa vira loop de jogo com recompensa, em vez de vermelho de cobrança. `someday`/`dropped` **nunca** assombram. Sem `lastTouchedAt`/`createdAt` a idade é **0** — nunca assombrar em massa o backlog de quem só atualizou o app. |
| 🕒 Adiamentos | Contador visível (Sunsama, "movida 7 vezes"). `POSTPONE_NUDGE_AT` = 3 → o pet oferece **decompor / encolher / deixar pra lá**. `shrink` rebaixa o effort em 1 (piso 1) e **ZERA o contador** (a tarefa mudou; carregar a marca puniria a decisão certa). |
| 💤 Algum dia / 🌙 Deixar pra lá | `TaskStatus` = `open \| someday \| dropped`. **`someday`** é o Someday do Things 3: deliberadamente INERTE — fora da meta, não envelhece, não assombra (permissão formal para não fazer). **`dropped`** é o Won't Do do TickTick: terminal COM volta atrás (`restore`) — não é deletar (perde contexto) nem concluir (é mentira). É essa saída que quebra o ciclo de **falência periódica** (apagar tudo e recomeçar), o padrão de uso dominante do mercado. |
| 🎯 Foco do dia | `MAX_DAILY_FOCUS` = **3**, e o número é a mecânica (Sunsama sem os 20 min). Escolhidos no check-in; as 3 completas = selo do dia. `focusComplete` também olha `completedTasks` (porque `completeTask` remove a tarefa de `tasks`). Sem foco escolhido → `false`: não existe selo por omissão. |
| ⚠️ Carga do dia | `plannedEffort` (ponderado) vs `OVERCOMMIT_EFFORT` (7) → `isOvercommitted`. **É AVISO, NUNCA BLOQUEIO** — não impede marcar foco, não recusa criar tarefa, não reagenda nada. O Motion é odiado por decidir no lugar do usuário. Se alguém quiser barrar uma ação com isso, o certo é mudar o TEXTO, não a permissão. |
| 🧹 Arrumar a pilha | `triageQueue`: tudo atrasado/assombrado, ordenado (vencidas primeiro, mais antiga antes; depois as paradas, da mais parada; desempate por `id` para a fila não trocar de ordem entre renders). UI = fila de cartas com 4 ações grandes (hoje / esta semana / algum dia / deixar pra lá). Terminar rende recompensa: planejar é o que alivia (Masicampo & Baumeister), mais que concluir. |
| 🛏️ Janela de Descanso | O usuário escolhe a PRÓPRIA janela (`DEFAULT_REST_WINDOW` 23:00–07:00, tolerância `REST_WINDOW_GRACE_MIN` = 45 min no INÍCIO). **Premia o COMPORTAMENTO (deitar no horário), nunca o RESULTADO (dormir bem)** — premiar resultado é a definição operacional de como se fabrica ortossonia (3–14% da população; ~23% dos usuários de 18–35 anos relatam estresse com apps de sono). Média móvel de `REST_WINDOW_DAYS` (7); **noite sem registro é NEUTRA**, sai do denominador (mata o exploit de forjar sono do Pokémon Sleep). **Sem score de sono, sem punição, nenhuma função devolve número que diminui** (há teste). Feedback só de MANHÃ; o único push possível é o de DEITAR (`sleepReminderAt`, 30 min antes). `hideMetrics` esconde números e **preserva as recompensas**. **Sem sensor nenhum** — roda igual na PWA e no APK. |
| 🌠 Sonhos | **30** no `DREAM_CATALOG` (`utils/restWindow.ts` › `DREAM_CATALOG` — 12 common / 10 rare / 8 legendary; dizia "18" até 26/08/2026), o Sleep Style Dex do Soulmon: cada noite na janela rende uma cena colecionável do pet. **Raridade vem da REGULARIDADE, nunca da duração**; piso `common` — pouca regularidade rende menos prêmio, jamais castigo. `rollDream` é determinístico por seed e prefere sonho ainda não coletado. `dexProgress` só cresce: barra de coleção, não de desempenho. |
| ☀️🌆📅 Rituais | **Check-in** (`needsCheckIn`, 1×/dia civil, sem janela de horário — "matinal" é convite, não tranca): hábitos do dia + até 3 focos + humor, com as **pendências de ontem primeiro** (Shutdown do Sunsama invertido: a dívida nunca fica invisível). **Relatório semanal** (domingo, checado por SEMANA e não por dia): constância por hábito, melhor hábito, categoria dominante, `effortDone` (esforço, não contagem), sonhos + `stackingSuggestion` — que devolve **`null` sem dados suficientes**, e esse silêncio é a metade importante (conselho desacreditado não volta a ser acreditado). Tudo DESCRIÇÃO, nunca veredito. |
| 🌱 Fresh start | Toda **segunda ou dia 1** (Dai, Milkman & Riis). **NUNCA apaga progresso**: evolução, `perfectDays`, `habitRhythms`/`totalDone` (os marcos) e `rest.dreams` ficam 100% intactos — `applyFreshStart` sequer toca neles, e há teste travando. Limpa só a COBRANÇA: zera `postponedCount` das ativas. Recomeço não é amnésia, é perdão — e a regra geral vale: perda só sobre item recuperável (moedas, escudos), **nunca** sobre identidade ou progresso acumulado. |

**Nunca**, nesta área: Google Fit; punição por sono ruim; score de sono na home;
streak que zera; recompensa por contagem de tarefas.

Estágios/HP máx: rookie/champion/ultimate=3 · mega=4 · ultra=5. (A árvore **nasce direto em rookie** — não existem mais ovo/baby; ver `src/types/progression.ts`.) A evolução é **MANUAL** (`MANUAL_EVOLUTION = true`): a virada do dia nunca evolui sozinha, quem dispara é o jogador na cerimônia. `perfectDays` **só acumulam** — dia não-perfeito não tira nada.

> **As três moedas nunca se misturam visualmente.** Bits e Créditos já
> apareceram com o mesmo ícone 💎 e o jogador não tinha como saber que os
> créditos que pagou não compram nada na loja. Modelo e estilos em
> `src/utils/currencies.ts`; há testes travando as fronteiras.


## Arquitetura

- `src/App.tsx` (**meça: `wc -l src/App.tsx`** — o número SAIU deste arquivo em
  09/09/2026, na quinta vez que apodreceu: dizia "~1500", "~4700", "4489",
  "5772" e "5991", e no dia em que a auditoria mediu estava em **6212**. Ele
  importa porque quem lê "1500" acha que o arquivo cabe num contexto e o lê
  inteiro à toa — e é a mesma família de dano da referência `arquivo:linha`:
  envelhece sem nunca ficar vermelho. Um comando que mede não apodrece) —
  orquestra tudo: handlers (feed/pet/shower/sleep),
  efeitos de jogo (dreno de cocô, sono automático, relatório), navegação de páginas.
- `src/contexts/GameStateContext.tsx` — `GameState` + persistência: todo setGameState
  grava no localStorage (`soulmon_state_v1` — era `digiapp_state_v3` até
  07/09/2026) e agenda cloud save (3s debounce).
  **Cuidado**: qualquer efeito que grave estado em timer vira spam de cloud save —
  throttle (ex.: relógio do cocô dormindo só grava a cada ≥5min).
- Cloud save: `src/utils/cloudSave.ts` → `functions/api/save.js`. **O namespace
  KV é resolvido em UM lugar: `functions/api/_kv.js` (`kv(env)`)**, que prefere
  `SOULMON_SAVES` e cai em `DIGIAPP_SAVES`. ⚠️ O `SEPARACAO-DIGIAPP.md` dizia
  que renomear o binding "exigiria alterar todos os arquivos em `functions/api/`
  **e** acertar o Cloudflare no mesmo instante — qualquer descompasso derruba
  save, créditos e compras ao mesmo tempo". O risco era real; a conclusão de que
  não dava para trocar, não. Com o acessor aceitando os dois nomes, a ordem
  entre mergear e clicar no painel deixa de importar e não há janela de queda.
  **Nunca leia `env.*_SAVES` direto** — há teste varrendo `functions/api/`.
  saveId = SHA-256 do e-mail (mesmo e-mail = mesmo save).
  Campos novos sincronizam sozinhos; no load use fallback `?? padrão` SEMPRE.
- `src/hooks/useDailyReset.ts` — só agenda o check da virada (a cada 30s). NÃO reintroduzir
  ticker de 1s (re-renderizava o app inteiro). **A regra em si vive em
  `src/utils/dailyReset.ts` → `computeDailyReset()`, função PURA que o hook chama
  E o teste importa.** Era duplicada no teste (`simulateReset`), que por isso
  passava afirmando uma evolução automática que `MANUAL_EVOLUTION` impede — o
  footgun de "regra copiada" do item 9, dentro do próprio teste. Não recrie a cópia.
- `src/hooks/useCareSystem.ts` — agendamento/polling do cocô (10s).
- `src/components/CompanionHUD.tsx` — área do pet: sprites, gesto de esfregar,
  falas (idle a cada 3min chama `/api/chat` — Groq; TEM guard de `document.hidden`).
- `src/utils/storageKeys.ts` — TODAS as chaves de localStorage passam por aqui.
  ⚠️ **O prefixo é `soulmon-` desde 07/09/2026** (era `digiapp-`, e este arquivo
  dizia que era mantido de propósito "porque renomear faria os usuários atuais
  perderem o progresso local" — não havia usuários atuais). `migrateLegacyStorageKeys`
  roda no `main.tsx` ANTES dos providers, porque o `GameStateProvider` lê o save
  no inicializador do próprio estado: ela **copia** (não move), **nunca
  sobrescreve** a chave nova e passa por `safeStorage`. Existe só pelo save do
  DONO, e pode ser apagada quando ele confirmar que abriu o app depois desta
  versão. O `sw.js` continua varrendo os DOIS prefixos na limpeza de cache —
  tirar o antigo deixaria lixo permanente na origem.
- Áudio — cinco arquivos, cada um com um dono, e a referência é sempre por **símbolo** (endereço
  `arquivo:linha` apodrece mais rápido que o número): `src/utils/sounds.ts` são os **8 sons**
  sintetizados — ⚠️ **"zero byte de asset" ficou falso em 21/09/2026 (S16)**: três eventos longos
  (`playEvolve`, `playDegenerate`, `playTaskComplete`) preferem um asset de IA em `public/sounds/`
  e caem no procedural se ele não chegou; os cinco curtos seguem procedurais. O manifesto (hash
  S9, bytes S6 — 5 arquivos, `ls -l public/sounds` é a medida) e a carga preguiçosa (só depois do
  primeiro gesto, nunca no bundle inicial) vivem em `src/utils/sonsAssets.ts`; a **trilha** (duas
  camadas em fase, loop de 12 compassos, nasce desligada, liga por gesto no grupo "Som" das
  Configurações — `SettingsPage`, não o `SettingsModal`, que está sem gatilho vivo) em
  `src/utils/trilha.ts`; régua `src/utils/sonsAssets.contract.test.ts` + `settingsSom.render.test.tsx`.
  O **`AudioContext`-por-chamada não existe mais**, ele
  morreu na Fase 2 do run `som-01`; `src/utils/audioBus.ts` é o **barramento único** (sub-mix por
  categoria, limitador, ducking) e é onde a **R-EX** vive, no despacho de `tocarNa` — um gesto,
  uma fonte, janela `JANELA_DE_COINCIDENCIA_MS`, a perdedora é descartada e **nunca**
  enfileirada; `src/utils/loudness.ts` é a **política, com dono único** — **alvo de loudness
  nunca se escreve à mão** em outro arquivo, há guard que reprova a cópia. ⚠️ A **D11** (som só
  por gesto) vale nos **chamadores**, não no módulo: `sounds.ts` não tem uma única checagem de
  `document.hidden` em código (só a prosa do cabeçalho) — o precedente de teste que prova a D11
  no call-site é `src/components/sintonia-chiado.render.test.tsx`. Leia **`docs/SOM.md`** antes
  de mexer em qualquer som; as decisões canônicas são **S1..S16** no `REGISTRO-DE-DECISOES.md`
  §6.1, e três delas mordem em código: **R-CAT** (categoria vem do EVENTO, nunca do nível medido
  do arquivo), **R-EX** e **R-NOVA** (**toda superfície nova nasce muda** — `ArenaGame.tsx`
  reintroduziu dois sons cortados com 3.974 testes verdes; a régua que faltava hoje é
  `src/utils/cortes.contract.test.ts`).
- IA: `functions/api/chat.js` (Groq llama-3.1-8b-instant, personalidade via aiSettings).
- Push: **dois canais**, mesma KV (`PUSH_SUBSCRIPTIONS`), mesmo cron
  (`workers/push-scheduler.js`, deploy manual via `wrangler deploy` dentro de
  `workers/` — NÃO é uma Pages Function, não builda sozinho no push do main).
  **Web Push VAPID** (browser/PWA instalado, e também funciona dentro do
  WebView do Capacitor — `PushManager` é suportado): `functions/api/subscribe.js`
  + `public/sw.js` + `workers/webpush.js` (chaves `push:*`). **FCM** (canal
  nativo extra, só no app Android): `functions/api/fcm-subscribe.js` +
  `src/utils/notifications.ts` (`registerForPushNotifications`, via
  `@capacitor/push-notifications`) + `workers/fcm.js` (chaves `fcm:*`,
  autentica com `FIREBASE_SERVICE_ACCOUNT` — secret do wrangler, baixe em
  Firebase Console → Configurações do projeto → Contas de serviço). Exige
  `android/app/google-services.json` (commitado; API key restrita por pacote,
  não é segredo) e canal `soulmon_push` criado em `MainActivity.java` (⚰️ era `digiapp_push` até o rename de 07/09/2026).
  ⚠️ **Os dois canais compartilham a TAG da copy, e é ela que impede a
  duplicata** (06/09/2026): o `AlarmReceiver.kt` notificava por
  `id.hashCode()` e o `workers/fcm.js` por `android.notification.tag` — tag ≠
  id, então o Android tratava as duas como notificações diferentes e o mesmo
  aviso chegava DUAS vezes no mesmo aparelho, às 10h, 16h e 22h. Hoje o
  receiver usa `notify(tag, 0, …)` com a tag vinda do `id` que o cliente passa
  (que É a tag da copy), casando com o padrão do FCM: a segunda a chegar
  substitui a primeira. O dedupe do WP3.4 (`isNativePlatform()` antes do poll
  web) matou a TERCEIRA cópia; esta era a segunda.
  ⚠️ **A copy das 20h mora em `_pushCopy.js`** (`eveningCopy`), não no
  `NotificationManager.tsx`. Ela era inline no componente e por isso sobreviveu
  inteira ao WP3.4 — o teste de paridade compara as horas de `PUSH_HOURS_BRT`
  e não existe hora 20 para comparar. Só o TEXTO veio; a CONDIÇÃO continua no
  cliente, porque o worker não sabe se a meta do dia foi cumprida. **E ela cede
  a vez quando há janela de descanso**: com a janela padrão (23:00) a noite
  mandava três pushes em 2h30 — 20h pedindo execução, 22h "boa noite" e 22h30
  o lembrete de deitar —, e o das 22h afirmava que o pet já tinha dormido meia
  hora ANTES do lembrete. O título das 22h também parou de alegar horário.
  **Histórico:** o FCM já foi implementado e depois revertido uma vez (commit
  `056a6b06`) com a tese de que o Web Push sozinho já é entregue de forma
  confiável mesmo com o app fechado (o WebView delega ao FCM por baixo dos
  panos, de forma transparente). Foi reintroduzido de propósito para o
  lançamento na Play Store — FCM nativo tem tratamento mais confiável contra
  Doze/otimização de bateria em ROMs de fabricante (MIUI, EMUI etc.) do que uma
  subscription de Web Push crua, e dá visibilidade de entrega pelo Firebase
  Console. Web Push continua ativo (cobre PWA/desktop); os dois convivem.
- Widgets Android: `android/.../widget/WidgetRenderer.kt` + layouts. Dados via
  `SoulmonWidgetPlugin` (SharedPreferences; ⚰️ era `DigiWidgetPlugin` até 07/09/2026). Testes: `npx vitest run` cobre lógica de reset.
  ⚠️ **O widget NÃO COBRA, e agora há régua** (`src/plugins/widgetSemCobranca.contract.test.ts`,
  06/09/2026). Ele mantinha `"📋 $completed de $total feitas"`, `"⚠️ Cuide de
  mim!"` e `"N task(s) left, let's go!"` — as três que a spec do dossiê mandou
  **remover**. O caso do placar é o mais instrutivo: ele só aparecia com a razão
  BAIXA, ou seja, **para quem estava perdendo o dia**. É a superfície mais
  exposta do telefone, vista dezenas de vezes sem que ninguém decida abri-la.
  O bridge também gravava `constancy_pct` e `shields`, as duas chaves **vetadas**
  (percentual cru é linha vermelha; escudo exposto vira placar da proteção que só
  funciona sendo silenciosa), além de `bond_level` — e as três eram escritas e
  **nunca lidas**. Hoje vai uma FAIXA (`habit_steady`, chave NOVA — as do bridge
  são congeladas, só se acrescenta) e o plugin **remove** as antigas, porque
  parar de escrever não apaga o que já está no aparelho. Nenhum teste em `node`
  alcança Kotlin: por isso o guard lê o FONTE.
- **Desktop (`desktop/`)**: app Electron separado — o pet anda numa faixa
  transparente na barra de tarefas do Windows. Build próprio
  (`npx vite build -c desktop/vite.config.ts`), `package.json` próprio, NÃO
  entra no bundle do app web. É um **controle remoto** do app: lê e escreve o
  save por `/api/save` (carinho, comida, marcar tarefa, **banho e dormir**) e se
  autentica pela janela do app web (`auth-preload.js`). Criar/editar tarefa e
  todo o resto é só no app.
  ⚠️ Até 26/08/2026 esta linha dizia que **banho e dormir não escreviam no save**.
  Era verdade, e o dano era medível: `applyPoopDrain` tira 1 coração a cada 6h de
  cocô não limpo, e o 🚿 é o único jeito de parar esse relógio — o jogador via o
  pet perder coração apertando o botão que existe para impedir isso. Consertado
  em `86341fcb`.
  As regras de cuidado do overlay **não são mais cópia**: `care.ts` importa
  `careUpdaters`, `careCaps`, `playerDay`, `restWindow` e `poopDrain` de
  `src/utils/`. O que ainda é cópia, e por quê, está no footgun 9. A fronteira de cuidado é `desktop/renderer/src/care.ts`,
  não o `menu.ts`: este toca o DOM no topo e por isso **nenhum teste em `node`
  consegue importá-lo** — foi assim que o teto de carinho ficou por aparelho sem
  ninguém ver. Ver `desktop/README.md` e `docs/PLANO-DESKTOP-STEAM.md`.
- **Motor de tarefas (`docs/PLANO-TAREFAS.md`)** — cinco módulos novos, todos de
  funções **PURAS** (sem React, sem localStorage, `now: Date`/`dayKey` SEMPRE por
  parâmetro) e **um dono por regra**. Quem escreve regra nova encaixa no dono
  certo; regra copiada é regra que diverge em silêncio (footgun 9):
  - `src/types/taskModel.ts` — **dono único dos tipos e de TODAS as constantes**
    (`Schedule`, `Effort`, `TaskStatus`, `HABIT_WEIGHT`, `HABIT_MILESTONES`,
    `CONSTANCY_WINDOW_DAYS`, `REST_SHIELD_*`, `MISS_INTERVENTION_AT`,
    `MAX_DAILY_FOCUS`, `OVERCOMMIT_EFFORT`, `POSTPONE_NUDGE_AT`,
    `HAUNTED_AFTER_DAYS`, `DEFAULT_REST_WINDOW`, `REST_WINDOW_*`) + as
    normalizações que impedem save antigo de quebrar (`normalizeSchedule`,
    `normalizeEffort`, `weekDaysForSchedule`). **Nenhum outro arquivo inventa
    número** — os módulos abaixo e os modais só aplicam.
  - `src/utils/habitRhythm.ts` — **constância**: `HabitRhythm` (histórico podado
    em `HISTORY_CAP` 120; `totalDone` existe para a poda não roubar marco),
    `isDueOn`, `constancy`, `earnShield`, `applyMissedDay` (escudo automático),
    `consecutiveMisses`/`needsIntervention`, `habitTier`/`attributeMultiplier`.
  - `src/utils/taskTriage.ts` — **execução**: `effortOf`/`weightOf`, `isHaunted`,
    `postpone`/`shrink`, `drop`/`restore`/`toSomeday`/`toOpen`, `setFocus`/
    `focusComplete`, `plannedEffort`/`isOvercommitted`, `triageQueue`. Genérico
    em `<T extends TriageTask>`: quem chama passa a `Task` inteira e recebe ela
    de volta, sem perder campo.
  - `src/utils/restWindow.ts` — **Janela de Descanso + Sonhos**: `isWithinWindow`,
    `recordNight`, `restConstancy`, `DREAM_CATALOG`/`dreamRarity`/`rollDream`/
    `dexProgress`, `sleepReminderAt`. **Não lê sensor nenhum** (ver a regra na
    tabela) — a única entrada é o gesto de pôr o pet para dormir que já existe.
  - `src/utils/rituals.ts` — **rituais**: `checkInPlan`/`completeCheckIn`,
    `weeklyReport`, `stackingSuggestion`, `isFreshStartDay`/`freshStartOffer`/
    `applyFreshStart`. **Não reimplementa** foco nem triagem: chama `setFocus`,
    `triageQueue`, `constancy`.
  - A **meta ponderada** continua sendo de `src/utils/dailyReset.ts`
    (`registeredForDay`/`dailyGoalFor`) — o motor novo só fornece o peso.
- **`src/utils/careRules.ts`**: regras de cuidado (alimentar, carinho, concluir
  tarefa) como funções PURAS, usadas pelo `App.tsx` **e** pelo desktop. Ao mudar
  uma dessas regras, mude AQUI — não dentro do handler do App, senão os dois
  apps divergem.
- **`src/utils/careCaps.ts`**: **onde o estado dos tetos mora** — e SÓ isso. Não
  decide nada de regra (não tem constante de teto, não reimplementa a janela de
  1h; há teste travando). Guarda `careCaps` no GameState, higieniza o que vem da
  nuvem e faz a migração idempotente das chaves antigas
  (`soulmon-food-feed-times`/`soulmon-rub-heal-day`), que são apagadas no load.
  Ver a linha 🧮 da tabela de regras.
- **Dinheiro** (`functions/api/_entitlements.js` + `_billing.js`): o cliente
  nunca decide tier/créditos, e **um comprovante de compra vale para uma conta
  só** (`claimOrder`). As duas regras têm testes; se algum cair, alguém ganha
  benefício sem pagar. Ver `docs/BILLING-SETUP.md`.
- **Palco do pet** (`src/utils/petStage.ts` + `docs/PALCO-E-DECORACAO.md`): o box
  do pet é uma COMPOSIÇÃO, não um canto onde jogar ícones. Linha do chão única
  (`GROUND_Y` = 74%, exatamente onde os pés do sprite caem) e 5 espaços de
  tamanho FIXO em px (`rug`/`floor-left`/`trophy`/`floor-right`/`wall`) — a arte
  é desenhada PARA a caixa. Cada cenário declara `setting`
  (indoor/outdoor/**void** = sem decoração) + `slots` + `horizonY` (≤ GROUND_Y);
  cada decoração declara `slot` + `fits`. Espaço vazio é VAZIO (sem contorno,
  sem "+"). Item equipado que não combina com o cenário não é desenhado, mas a
  loja explica em vez de sumir em silêncio. Estado: `equippedDecor`
  (um item por espaço), migrado do antigo `equippedFurniture` no load.
- **Oráculo** (`src/utils/oracle.ts` + `src/utils/soulProfile/` +
  `docs/ORACULO.md`): tem DUAS metades. A **leitura** (soulProfile/) transforma
  quem a pessoa é em 4 eixos — elemento/papel/alinhamento/reino; a **criação**
  (oracle.ts) transforma esses eixos na criatura — arquétipo, família, fusão,
  as 11 formas, prompts de sprite. Só a leitura foi trocada: hoje ela é 20
  itens psicométricos (Big Five + Honestidade-Humildade + eixos junguianos),
  mapa astral REAL (efemérides, casas Placidus, fuso IANA com horário de verão
  histórico) e numerologia completa, no lugar do signo por faixa de datas, do
  ascendente chutado de 2 em 2 horas e das 6 perguntas do quiz antigo.
  **O ritual continua sendo as 6 perguntas** (`ORACLE_QUESTIONS`); os 20 itens
  são uma bifurcação oferecida depois delas e **antes do reveal**, declarada na
  tela como decisão SEM VOLTA (não existe caminho para responder o teste
  depois). As 6 respostas entram na leitura nos DOIS caminhos — para quem não
  faz o teste longo elas são o único sinal de personalidade que existe. O
  jogador vê só nome e descrição: pontuação de eixo e prompt de sprite vivem na
  `OraclePage`, que é ferramenta de criação e não tem entrada na navegação.
  `OracleInput.soulProfile` é opcional: sem ele o caminho legado roda inteiro,
  que é o que mantém o reroll de quem jogou antes da troca. O motor é **pesado**
  (astronomy-engine) e só entra por import DINÂMICO — o `oracle.ts` importa dele
  só tipos, e é isso que o mantém fora do bundle inicial. Os coeficientes de
  `soulProfile/axes.ts` foram calibrados por simulação para que nenhum
  elemento/papel/reino tenha vantagem estrutural: **mexer num deles sem refazer
  a simulação reabre o buraco que ele fechou**. A leitura também alimenta o
  PIPELINE COMPLETO (`soulProfile/pipeline.ts`): ficha do class-system nos 5
  estágios + companheiro capturável + criatura-inspiração do bestiário → só
  então a criatura é gerada. Dados dos outros repos entram por SNAPSHOT com
  procedência (`npm run sync:oracle-data`, clones irmãos) — nunca cópia à mão.
  Cobertura travada por simulação: 17/17 elementos, 65/65 talentos, 11/11
  profissões, 32/32 criaturas do class-system, pool inteiro do bestiário. O
  ⚠️ **O nome da criatura-inspiração PASSOU a entrar no prompt em 27/09/2026
  (D-B1, decisão do dono).** Esta linha dizia "NUNCA entra em prompt", e era
  verdade até então — `pipeline.ts` cortava o nome e havia teste travando a
  ausência dele nos 11 prompts. O dono decidiu o contrário **sabendo do risco
  de direito autoral**, com o desenho que o app já usa para as referências de
  gênero: o nome entra **só em `imagePrompt`** (1ª tentativa) e o
  `imagePromptFallback` segue limpo, então uma recusa do provedor
  (`isRefusal`, em `functions/api/generate-sprite.js`) degrada para a variante
  sem nome em vez de falhar. **Quem decide o limite é o provedor, não uma
  lista nossa.** Duas coisas NÃO mudaram e não podem cair junto: a cláusula
  `Do not copy any existing franchise character` continua nas duas variantes,
  e o nome continua **fora do que o jogador lê** — nome, bio e descrição por
  forma seguem sem ele; o jogador vê só a linha de essência no reveal. A régua
  viva é `pipeline.test.ts` (o caso mudou de nome junto com a regra).
- **Desbloqueio no meio do jogo** (`src/components/UnlockAccountModal.tsx`): a
  compra também existe DENTRO do app, não só na tela inicial (que o usuário vê
  uma vez). `UnlockNudge` só aparece em dois lugares — ao bater o limite de
  criação do modo grátis (`CreateModal`) e na página de Evolução de quem tem
  `demoCharacterId` — e nunca abre sozinho.
  ⚠️ **"dois lugares" ficou falso em `24870bf7`: hoje são TRÊS.** O `EditModal`
  passou a exibir o `UnlockNudge` também, porque era exatamente o caminho que
  **contornava o teto do demo** — o botão principal de criar da tela inicial
  abre o `EditModal`, que salvava sem checar cap nenhum. Fechar o vazamento sem
  pôr o convite ali deixaria a recusa sem saída. Depois da compra confirmada pelo
  servidor, `SoulmonOnboarding mode='upgrade'` roda o MESMO ritual do oráculo
  (sem intro/cadastro) e `handleUpgradeRevealed` troca **só a criatura**:
  estágio, atividades, Bits e histórico continuam. Se o usuário sair do ritual
  pela metade, a página de Evolução mostra o convite na variante `reveal`.
  ⚠️ **Atualizado em 21/09/2026 (D11 do canvas Sistema; decisão do dono):** o
  `EditModal` voltou a SÓ editar (`rhythm`/`hideMetrics`) e o convite mora hoje
  em **seis** pontos — `grep -rn "<UnlockNudge" src | wc -l` é a medida, não
  este parágrafo: `App.tsx` (×2), `CreateModal`, `DailyReportModal`,
  `ShopModal` e `SoulmonOnboarding` (passo `REVEAL_DEMO`, motivo
  `'reveal-demo'`, código de telemetria 4). Largura padronizada em **280**
  (`maxWidth` no `UnlockAccountModal.tsx`), nunca 440.

## Arte e nomes: nada de terceiro entra no bundle

O app já embarcou 74 sprites da Bandai (25 `*_dmc.png` + 49 `figma:asset/*` das
linhas Tapirmon/Veemon/Salamon) e vendia formas de evolução com nome de
personagem registrado. **Saiu tudo** — ver `docs/Attributions.md`. As regras que
ficam valendo:

- **Toda arte vem de `src/assets/soulmon/`.** `getSpriteForStage` responde
  sempre com arte nossa; save antigo com id de espécie legada cai em
  `legacySpriteForStage`, que escolhe uma das nossas linhas por hash do id
  (determinístico: o mesmo save renderiza sempre a mesma criatura).
- ⚠️ **`LEGACY_FORM_TIERS` NÃO EXISTE MAIS** (07/09/2026). Eram 57 ids de
  espécie da Bandai no bundle de produção, e a única justificativa era compat
  de save — para jogadores que nunca existiram. Um id fora do esquema da árvore
  cai em `'rookie'` e o sprite cai em `fallbackSpriteForStage`, que responde com
  arte NOSSA por hash. **Não recrie a tabela.**
- ⚠️ **O APK também embarcava a arte, e o `Attributions.md` dizia que não.**
  `android/res/drawable` tinha **40 sprites** da Bandai, e `resolveSprite` caía
  em `triceramon_dot` **para todo usuário, sempre** — nenhum drawable casava com
  os estágios reais (`rookie`, `champion-power`…). Os 11 estágios ganharam a
  arte de `src/assets/soulmon/`; o fallback hoje é `sprite_rookie`.
- ⚠️ **O pool do bestiário tinha 242 criaturas de franquia protegida** com a
  descrição oficial copiada (Pokémon, D&D, Warcraft, Digimon, Ragnarok, FF,
  Warhammer, LotR), num JSON de 947 KB que entra no bundle. O filtro de origem
  está em `scripts/sync-oracle-data.mjs` — na FONTE, senão volta no próximo
  sync. Só ficam procedural, fauna/flora real e mitologia.
- **A régua é EXECUTÁVEL, e olha o BUNDLE**: `sprites.dungeonRoster.test.ts`
  varre `dist/assets/*.js` e `android/res/drawable`; `pipeline.test.ts` varre o
  pool. O fonte não é varrido de propósito — comentário some no build, e os
  comentários-lápide citam os nomes para registrar o que não pode voltar.
- **Prompt do gerador tem DUAS variantes** (`utils/oracle.ts`, `composeSpritePrompts`):
  `imagePrompt` **cita** as referências de gênero (Digimon/Pokémon/Palworld/…)
  porque o resultado sai visivelmente melhor, e `imagePromptFallback` é o mesmo
  pedido sem citar ninguém. **Toda criação começa pela variante com referências**;
  se o provedor recusar por política de conteúdo, `functions/api/generate-sprite.js`
  refaz sozinho com o fallback (`isRefusal` decide; erro que não é recusa não
  refaz, pra não dobrar custo à toa). As duas variantes mantêm
  "Do not copy any existing franchise character" — citar inspiração não é licença
  pra devolver personagem registrado, e o sprite vai pro app de um usuário real.
  Há teste travando os dois lados (referências presentes na 1ª, ausentes no fallback).
- **Rookie/champion/ultimate/mega ficam**: vocabulário genérico do gênero.
- **Nenhum nome de criatura leva sufixo fixo tipo "-mon"** (`rookieName` etc.
  em `oracle.ts`). Prefixo de linha + sufixo mecânico é o que soletrava nomes
  reais de outra franquia (`War` + `_mon` = WarGreymon; `Omni` + `_mon` =
  Omnimon, a própria fusão dos 3 Megas — exatamente o conceito do Ultra
  aqui). Prefixos sozinhos (War/Chaos/Omega…) são genéricos e ficam; o que
  NÃO pode voltar é o sufixo fixo somado a eles.
  ⚠️ **A regra vale para os nomes CURADOS também, e até 08/09/2026 não valia
  na prática**: os três personagens prontos se chamavam Pyrakamon, Akashaoimon
  e Nimbratamon, e este arquivo os proibia sem nunca ter sido aplicado a eles.
  A sessão de QA achou a contradição e o dono decidiu pela regra — hoje são
  **Pyraka, Akashaoi e Nimbrata** — e desde 15/09/2026 (`c11dc49d`, D1 da
  squad-arte) são **seis** prontos, com **Igni, Nautilu e Astrase** (`igni`,
  `nautilu`, `astrase`); `PREMADE_CHARACTERS` em `utils/monetization.ts` é a
  medida. O `id` da linha (`kaelen`, `orrin`,
  `thalindra`) NÃO mudou: é ele que resolve o sprite, vai para o save
  (`demoCharacterId`) e nomeia os arquivos de arte.
  **O dono do nome é `DUNGEON_LINE_NAMES` (`utils/sprites.ts`), e só ele** —
  os três estavam escritos à mão em TRÊS arquivos (ali, no `PREMADE_CHARACTERS`
  e no `petName` dos NPCs da Biblioteca), então renomear num lugar deixaria o
  inimigo da masmorra e o NPC chamando a mesma criatura por outro nome, em
  silêncio. A régua viva é `src/utils/sprites.dungeonRoster.test.ts`, que
  reprova o sufixo E a volta da string duplicada — não este parágrafo.
- ⚠️ **`digimonName` NÃO EXISTE MAIS** (07/09/2026). Este item dizia que ele e
  as chaves `digiapp_*` ficavam "porque renomear quebraria o widget/save de quem
  já joga", e que o servidor aceitava DOIS nomes de campo "por causa dos APKs já
  instalados". Não havia APK instalado nem save de terceiro. Hoje o campo é
  `petName` em todo lugar — cliente, bridge (`pet_name` no Kotlin), chat e push
  —, e o servidor conhece **um** nome: campo com dois nomes é campo que diverge,
  e o segundo é sempre o que alguém esquece de atualizar.
- ⚠️ **O manifesto Android anunciava os widgets como "DigiApp"** —
  `android:label`, que é o texto que a pessoa lê na LISTA DE WIDGETS do
  celular. Cinco rótulos, todos visíveis ao usuário, todos com o nome do outro
  app. Junto foram as classes (`SoulmonWidget*Provider`), os layouts
  (`widget_soulmon*`), o canal de push (`soulmon_push`) e o de alarme
  (`soulmon_alarms`). Os plugins do Capacitor viraram `SoulmonWidget` /
  `SoulmonAlarm` — o nome é string casada nos dois lados, então mudou nos dois
  no mesmo commit.

## UI: regras visuais do dono (não regredir)

- **Ícone NUNCA dentro de box** — vale no app inteiro (18/ago/2026). Nada de
  moldura, placa, chanfro ou fundo em volta de um ícone: o ícone aparece
  GRANDE e pelado (nav inferior **32px**, ações do pet 24px, chat 32px —
  números da escala viva `src/styles/tokens.md` §6.1, travada por
  `iconScale.contract.test.ts`; dizia 36/42/30 até 16/09/2026 e o código
  vence, decisão P3 do canvas Sistema). Seleção
  na nav = sublinhado ciano (uma barra não é uma caixa), nunca a placa
  preenchida antiga. Peças com moldura continuam existindo para PAINÉIS e
  BOTÕES DE TEXTO — a regra é sobre ícones.
- **A área do pet não rola para fora da tela** — `.sm-pet-sticky` (rodada 4);
  o scroll acontece só na lista de atividades abaixo dela.
- **DUAS FILAS, e nada monta fora delas** (`src/components/filaDeAvisos.contract.test.ts`).
  Os **intersticiais** (`const interstitial` no `App.tsx`) montam UM por vez,
  em ordem declarada; o **slot de avisos da Home** renderiza só o PRIMEIRO e
  colapsa o resto em "+N" (ordem: primeiro dia → HP → semanal → triagem →
  priming → recomeço — o semanal vem antes da triagem porque é raro e a
  triagem aparece todo dia). ⚠️ A auditoria de 06/09/2026 achou quatro
  superfícies FORA das filas, e é ali que empilhava: o
  `ProtectProgressModal` montava em z-120 sob os intersticiais (z-200) com um
  `setTimeout(15s)` no lugar de um gate — contra um check-in de ~20s por
  design; a cerimônia de marco vivia em **z-60**, sob o check-in (hoje 300);
  evoluir abria a cerimônia (z-500) **e** o `EvolveTaskModal` por baixo, que
  reaparecia cobrando "crie mais atividades" quando ela fechava; e
  `FirstDayCard` + priming de push eram dois `&&` soltos logo acima do
  comentário que manda entrar na fila. **Superfície nova entra numa das duas,
  com posição declarada.**

## Idioma: inglês é a base, PT-BR é localização

Todo texto de UI nasce **em inglês**; o par PT-BR vem junto pelo padrão
`language === 'pt-BR' ? … : …`. O que **não** pode acontecer é string só em
português — já aconteceu em `aria-label`s de checkbox/editar e no título do push
das 22h, que chegava em PT para quem tinha escolhido inglês. `resolveLanguage`
(`utils/i18n.ts`) é o ponto único: PT só quando o aparelho é PT.

## Footguns (aprendidos a dor — não repita)

1. **`src/index.css` é o ÚNICO CSS empacotado** (Tailwind v4 pré-compilado; NÃO há
   plugin do Tailwind no Vite). Keyframes/estilos novos vão NELE (no fim).
   Não existe geração de classes: **classe utilitária que não está no index.css
   não aplica nada** (foi o bug do `bottom-2`). Para posicionamento/layout crítico,
   prefira `style={{}}` inline.
2. **RemoteViews (widgets Android)** só suporta: ImageView, TextView, ProgressBar,
   Linear/Relative/FrameLayout, ViewFlipper. `<View>` quebra o widget ("não foi
   possível carregar"). `setImageViewResource` é confiável; `setInt(…background…)` não.
   Desde 20/09/2026 (`6affd501`, canvas Fora do app) o sprite do widget vai por
   `setImageViewBitmap` (`spriteBitmap` decodifica de `drawable-nodpi/` com
   `inScaled=false` e reescala uma vez para `dp × density`, dentro do teto do
   RemoteViews); `setImageViewResource` ficou como fallback.
3. **Build Android**: JDK 21 no CI, Kotlin jvmTarget **17**, compileOptions do app
   re-pinados para 17 DEPOIS do `apply from: 'capacitor.build.gradle'`.
4. Vários PNGs antigos em git são **0 bytes** (ex.: `partner_area.png` original era
   quebrado — o fundo do widget era o vetor `pet_grid.xml`, ⚰️ apagado em
   `6affd501`; hoje é `widget_bg.xml` (`<shape>`, `#071413` + borda de cobre,
   raio do sistema em `drawable-v31/`).
5. `handleX = useCallback` com deps certas — CompanionHUD é `memo()`; lambda inline
   nas props dele anula o memo.
6. Side effects NUNCA dentro de updater do setGameState (StrictMode invoca 2×).
7. O sandbox de dev **não acessa** a URL de produção (proxy 403) — teste local
   com `npx vite preview` + Playwright (`/opt/pw-browsers/chromium`, import
   `/opt/node22/lib/node_modules/playwright/index.js`, com interop CJS:
   `import pkg from …; const { chromium } = pkg;`). Dois detalhes que custam
   tempo: (a) `vite.config.ts` tem `open: true`, e sem navegador o preview
   **morre** com `spawn xdg-open ENOENT` — ponha um `xdg-open` falso no PATH;
   (b) semeie o `localStorage` com `page.addInitScript` e **não** com
   `page.evaluate` + `reload`: o app já rodou na primeira carga e sobrescreve
   o que você acabou de gravar (foi assim que um teste "passou" lendo um
   estado que não era o semeado).
8. Sprites: importados via alias `figma:asset/<hash>.png` (mapa no `vite.config.ts`)
   → arquivos reais em `src/assets/`. `assetsInlineLimit: 0` (nunca inline base64).
9. **Regra copiada = regra que diverge em silêncio.** Estado em 26/08/2026, na
   consolidação final do dia — **o que ainda é cópia mudou QUATRO vezes hoje**
   (dizia "três" e ficou desatualizado no mesmo dia), **então leia a data**:
   - **Sobrou a derivação do `saveId`, e ela tem TRÊS implementações**, em três
     árvores com três ciclos de deploy: `emailToSaveId` em
     `src/utils/cloudSave.ts` (app), em `desktop/renderer/src/cloudSync.ts`
     (overlay) e a do servidor em `functions/api/_auth.js`. Regra:
     `SHA-256("soulmon:" + e-mail normalizado)`, corte em 32 hex. Divergir não
     dá erro nenhum — o overlay lê um save inexistente e mostra um bicho
     genérico, e a do servidor devolve **403 para todo usuário autenticado**.
     Já aconteceu: o código do desktop veio do DigiApp com o salt `digiapp:`.
     Encontro travado, e **comportamental**, em
     `functions/api/saveId.parity.test.js` (as três) e
     `desktop/renderer/src/cloudSync.test.ts` (duas).
   - ⚠️ **As tabelas de HP/energia NÃO são mais cópia** (`d56bba7a`). Este item
     citava `MAX_HP_BY_LEVEL` / `ENERGY_BY_LEVEL` / uma `stageLevel` própria em
     `cloudSync.ts`; as três foram apagadas e hoje o arquivo **importa**
     `MAX_HP_BY_FORM`/`getStageLevel`/`getMaxEnergyForStage` de
     `src/types/progression.ts`. A justificativa escrita da cópia ("importar
     `types/progression` arrasta o roster legado da masmorra") era **falsa** —
     aquele arquivo não importa nada. E a cópia custou comportamento: a
     `stageLevel` do desktop lia só o prefixo do id e não caía em
     `LEGACY_FORM_TIERS`, então um save antigo em `gaioumon` (mega) era
     **rebaixado a rookie** no overlay — 3 corações em vez de 4 — e o
     `maxHealthPoints` errado **voltava para o SAVE** em `normalizeForRules`,
     fazendo `applyRub` cortar a cura do mega no teto de um rookie. Não
     reintroduza a tabela.
   - **As regras de CUIDADO deixaram de ser cópia** (`f6fb5f30`): o desktop
     importa `careRules`/`careUpdaters`/`careCaps`/`playerDay`/`restWindow`/
     `poopDrain` do app pelo adaptador `desktop/renderer/src/care.ts`, que não
     decide nada. O motivo é o custo medido: o desktop estava atrasado em
     **SEIS** consertos da família de cuidado (D-33, X-4, X-5, X-6, dia do
     jogador em fuso fixo, janela de comida vinda do `prev`) — cópia de regra
     não diverge um pouco, diverge em tudo.
   - **A energia da comida também saiu** (`f6716ec5`): `menu.ts` recalculava
     `Math.min(maxEnergy, energy + 1)` **depois** de `feedFood` já ter aplicado
     o teto. E a cópia não era redundância inofensiva — ela mantinha
     **invisível** um `as unknown as` que rodava sobre `undefined`
     (`DesktopState` não tem `evolutionStage`, `energyPoints`, `powerPoints`
     nem `totalXP`), devolvendo energia errada e atributos `NaN`. O `menu.ts`
     jogava tudo fora e recalculava a energia à mão, então nada aparecia.
     **Cópia pode estar encobrindo defeito, não só duplicando.**
   - 🆕 **A 4ª mudança do dia é a que quase virou cópia e não virou** (`6dde6750`
     / `94d45e62`): a allowlist de **esquema** da URL de sprite. Ela tinha dois
     candidatos a dono — o acervo (`isSafeSpriteUrl` em
     `src/utils/spriteLibrary.ts`) e o pixelizador (`pixelizeDataUrl` em
     `src/utils/spriteGen.ts`, que passa a URL para um `<img>`) —, e os dois
     componentes que liam do diretório público precisavam da mesma resposta.
     **Escreveu-se UMA função e ela é importada nos quatro pontos.** Dois
     dicionários de esquema divergiriam exatamente onde dói: um fecharia
     `javascript:` e o outro não, e nada ficaria vermelho. O que a guarda fecha:
     `javascript:` (inclusive `JaVaScRiPt:` e com TAB/LF no meio), `data:`
     não-imagem, `http:`, `file:`, `blob:` e `//host` (relativo a esquema, que
     herda `https` e vaza igual). ⚠️ **O que ela NÃO fecha** é o beacon
     `https://atacante.example/x.png` — para isso é preciso fixar o **HOST** do
     provedor, e o host do CDN do Higgsfield não está confirmado (é pendência do
     dono). Guarda reutilizável, não um `if` inline: `isSafeSpriteUrl` responde
     `false` para não-string também.
   - **O nível do Vínculo NUNCA vai para o save** (`src/utils/bond.ts`) — é
     sempre `bondLevelFor(totalXP)`, derivado na leitura. Guardar `bondLevel`
     persistido seria este footgun na sua forma mais cara: duas fontes para o
     mesmo número, uma delas gravada no aparelho de quem já joga. O gate de PvP
     (`BOND_PVP_MIN_LEVEL` = 5) usa a MESMA derivação nos dois lados — cliente
     (`meetsPvpBond`, `src/utils/bond.ts`) e servidor (`community.js`, ação `profile`) — e é o servidor que
     decide, porque o cliente é editável.
   - Os testes de paridade que sobraram: `cloudSync.test.ts`,
     `sprites.parity.test.ts`, `care.parity.test.ts`,
     `care.feed.parity.test.ts`, `care.banhoSono.parity.test.ts`. Se copiar
     alguma regra pra lá, adicione o teste de paridade junto — mas prefira
     **importar**, que é o precedente que passou a valer.
10. **Dois sistemas de tema no mesmo CSS.** O app real alterna
    `[data-theme="light"|"dark"]` no `<html>` e define `--sm-*` para os dois. O
    `index.css` TAMBÉM carrega o scaffold shadcn importado do Figma
    (`--background`/`--foreground`/`.dark`), que só muda de valor sob a classe
    `.dark` — nunca aplicada por este app. Texto sem `color` próprio herda
    `body { color: var(--foreground) }`, que fica PRESO no valor claro
    (`oklch(.145 0 0)`, quase preto) mesmo com `[data-theme="dark"]` ativo —
    achado assim na página do Pet (nome/descrição/skill quase pretos sobre
    card verde-escuro). `body` foi trocado para `--sm-bg`/`--sm-ink` (que
    respondem ao tema de verdade); NÃO reintroduza `var(--foreground)` /
    `var(--background)` em texto novo — são só para os componentes de
    `components/ui/` que os usam explicitamente via `.text-foreground` /
    `.bg-background`. Para checar contraste de verdade, não confie só no
    screenshot pequeno (o cinza quase-preto sobre fundo bem escuro ainda
    "parece" legível): amostre o PIXEL renderizado (ex.: `PIL`/`Pillow` lendo
    o PNG do Playwright) ou leia `getComputedStyle(el).color` — ambos batem.

## Convenções

- Commits em PT-BR, `tipo(escopo): resumo` (feat/fix/refactor/style/chore).
- Textos de UI sempre PT-BR + EN. Falas do pet: curtas, fofas, sem emoji nas
  frases faladas (o `speak()` remove emojis; `speakRaw()` preserva).
- Ao mudar regra de jogo: atualizar `GuideModal.tsx` (guia, PT/EN — os números
  saem das CONSTANTES, não de texto à mão) E `HelpModal.tsx` (glossário PT/EN)
  E os testes em `src/hooks/useDailyReset.test.ts`.
- Verificação visual: screenshot via Playwright antes de declarar UI pronta.
