# Backlog da beta12 (versionCode 32)

> **Dono:** soulmon-coordenador · **Data:** 11/11/2026 · **Pedido do dono:** 11/11/2026 · **Base:** `7895310` (main; `versionName` `1.3.0-beta11`, `versionCode` 31) · **Estado:** BACKLOG, nada implementado; o estado real é o código.
> **Execução:** DOMINGO 15/11/2026 às 03:00. A tarefa agendada `soulmon-traducao-pt-inline-lotes` roda no mesmo horário e FAZ PARTE da beta12 (é o item D). **Exige APK novo** (itens A e, se houver mudança nativa, os demais).
> **Fonte única do conteúdo:** o pedido do dono (memória `soulmon-beta12-widgets`). Os critérios de aceite abaixo vêm do texto dele; nenhum requisito foi acrescentado. O que o texto não decide está em "Perguntas em aberto" (modal ao dono, `AskUserQuestion`).
> **Precedência:** código > teste > `CLAUDE.md` > este backlog.

## 0. Regra de canal (o que exige APK e o que sai pela web)

O app Android carrega o site do Worker (`capacitor.config.json` › `server.url`). Portanto **todo JS/TS/CSS/copy do app sai pelo deploy do Worker, sem APK**. Exigem APK só: Kotlin (`android/app/src/main/java/com/soulmon/**`), `res/xml/soulmon_widget_*_info.xml`, layouts, `AndroidManifest.xml`, drawables e a ponte do plugin (`SoulmonWidgetPlugin.kt`). Bump obrigatório em `android/app/build.gradle`: `versionCode` 32 / `versionName` `1.3.0-beta12`.

| Item | Só web | Exige APK |
|---|---|---|
| A1 molduras remotas | manifesto, PNG, seletor | `WidgetFramesSync` + leitura em disco no renderer |
| A2 vertical | seleção/uso no app | XML do provider, layout, renderer |
| A3 3º widget | envio de dados do app | provider novo, XML, layout, manifest |
| B personalidade | tudo (falas, Settings, prompt do chat) | só se a fala padrão do widget (`pet_line`) mudar de forma |
| C chat | tudo (React/CSS) | nada previsto |
| D português | tudo | só `res/values*/strings.xml` se entrar |

## A. Widgets

Plano de A1 já escrito: [design/PLANO-WIDGET-MOLDURAS-REMOTAS.md](design/PLANO-WIDGET-MOLDURAS-REMOTAS.md) (PR #795). Não repetir aqui.

### Onde toca (levantado em `7895310`)

- Providers em `android/app/src/main/java/com/soulmon/widget/`: `SoulmonWidgetVpetProvider` (V-Pet), `SoulmonWidgetVerticalProvider` (variante vertical antiga, sprite em cima), `SoulmonWidgetAdaptiveProvider`, `SoulmonWidgetClearProvider`, `SoulmonWidgetScreenProvider`, `SoulmonWidgetChatProvider`, `SoulmonWidgetPetProvider`, `SoulmonWidgetProvider`.
- Desenho: `WidgetRenderer.kt` (`renderVpet`/`drawVpet`, `vpetCasingRes`), geometria do LCD em `WidgetVpet.kt` (sprite à esquerda, 120 px; fala à direita; fileira de ícones embaixo), teste `WidgetVpetTest.kt`.
- Tamanho: `res/xml/soulmon_widget_vpet_info.xml` hoje `minWidth 250dp`, `minHeight 170dp`, `minResizeWidth 180dp`, `minResizeHeight 120dp`, alvo 4x3, `resizeMode horizontal|vertical`. Layout: `res/layout/widget_soulmon_vpet.xml`. Receivers em `AndroidManifest.xml`; rótulos em `res/values/strings.xml` e `values-pt/strings.xml`.
- Ponte: `src/plugins/SoulmonWidgetPlugin.ts` ↔ `SoulmonWidgetPlugin.kt` (`updateData`; chaves `vpet_frame`, `vpet_bg`, `pet_line`); origem dos dados em `src/App.tsx` (`vpetFrame`, `vpetBg`). Sprite do jogador no widget: `WidgetOwnSprite.kt`. Molduras: `src/utils/widgetFrames.ts`.
- Régua: `widgetVpetStatus.contract.test.ts`, `widgetVpetSonoFundo.contract.test.ts`, `widgetFrames.test.ts`, `widgetSemCobranca.contract.test.ts` (widget nunca cobra).

### A1. Molduras remotas do widget

- **Objetivo:** moldura nova do V-Pet entrar sem APK novo (manifesto + imagens pela web, cache em disco, fallback nas 20 embutidas).
- **Critérios de aceite (do texto do dono):**
  1. Uma moldura nova publicada só por web aparece no widget sem reinstalar o APK.
  2. As imagens ficam em cache em disco e o widget as lê de lá.
  3. Sem rede, sem cache ou arquivo inválido, o widget desenha uma das 20 embutidas (o que desenha hoje).
- **Dependências:** `WidgetOwnSprite` (precedente de download no widget), `WidgetRefreshWorker` (WorkManager), servir `public/widget-frames/` pelo Worker sem tocar `run_worker_first`/`assets` do `wrangler.jsonc`.
- **Riscos:** `OutOfMemoryError` no bitmap 576x384 (já tratado no `renderVpet`); manifesto ou PNG corrompido (fallback); a allowlist de ids é fixa no Kotlin (`WidgetVpet.FRAME_ELEMENTS`) e no TS (`WIDGET_FRAME_ELEMENTS`) e tem de virar dado; regra de posse/preço (`functions/api/_billing.js`, `moldura_<elemento>`) não muda; o `manual/08-INTEGRACOES-E-DEPLOY.md` §2.8 diz 0 de 20 drawables e o plano diz 20 (conferir o estado real no início da execução).
- **APK × web:** a parte nativa (sync + leitura) exige APK; depois dele, arte nova é só web.
- **Perguntas em aberto:** as do plano `PLANO-WIDGET-MOLDURAS-REMOTAS.md`; a arte das molduras novas vem do ChatGPT desktop, não do Higgsfield.

### A2. Widget V-Pet redimensionável na vertical

- **Objetivo:** o V-Pet poder ser esticado na vertical: 1 célula de largura, 2 ou mais de altura; o texto fica ABAIXO do Soulmon.
- **Critérios de aceite:**
  1. O widget aceita 1 célula de largura e 2+ de altura (hoje `minResizeWidth` 180dp e alvo 4x3 impedem).
  2. Nesse formato o texto da fala aparece abaixo do Soulmon (hoje fica à direita).
  3. O formato horizontal atual continua igual.
- **Dependências:** `soulmon_widget_vpet_info.xml`, `WidgetVpet.kt` (layout em caixas), `drawVpet`, `widget_soulmon_vpet.xml`; a moldura (A1) tem proporção 576x384 com LCD fixo (x 108..467, y 71..263), logo um formato vertical precisa de arte/recorte novo ou de moldura reduzida.
- **Riscos:** o casco 576x384 é horizontal; esticar na vertical pode distorcer ou deixar o sprite minúsculo; interação com A3 (sprite grande); o launcher do aparelho decide as células reais, só se prova em aparelho.
- **APK × web:** APK (XML, layout, Kotlin).
- **Perguntas em aberto:** a moldura no formato vertical é a mesma com mais fundo ou arte nova? Há teto de altura?

### A3. Terceiro widget (total de 3 opções) com o Soulmon GRANDE

- **Objetivo:** terceira opção, igual à primeira, mas com o Soulmon grande (2x2 ou 3x3 conforme o tamanho colocado); o sprite se ajusta ao tamanho do widget.
- **Critérios de aceite:**
  1. O seletor do Android passa a mostrar 3 opções (a confirmar o que o dono conta como "as 3", ver pergunta).
  2. O novo widget tem o mesmo conteúdo do primeiro (fala, ícones, moldura, cenário).
  3. Colocado em 2x2 ou 3x3, o sprite ocupa o espaço e se ajusta ao tamanho.
- **Dependências:** provider + `info.xml` + layout + manifest novos; reuso de `renderVpet` com outra geometria (`WidgetVpet.kt`); `updateData` já alimenta os providers pelo mesmo prefs.
- **Riscos:** hoje há 8 providers registrados e os antigos NÃO podem sair (tirar um receiver apaga o widget já colocado); contar "3 opções" depende de qual é a "primeira"; sprite grande exige a arte nativa do estágio (`WidgetOwnSprite`, `STARTER_SPRITES`).
- **APK × web:** APK.
- **Perguntas em aberto:** as 3 opções são V-Pet atual, V-Pet vertical (A2) e V-Pet grande, ou o vertical é só o redimensionamento do primeiro? Entre 2x2 e 3x3 o layout muda sozinho?

## B. Personalidade do Soulmon e dos NPCs

### Onde toca

- **Já existe uma personalidade DERIVADA:** `src/utils/personality.ts` (`derivePersonality`, `chatSettingsFor`, `personalityProfileFromSave`) deriva `tone`/`motivationStyle`/`emojiIntensity` das FORÇAS e DIFICULDADES do onboarding (decisão do dono de 01/10/2026: "automática, sem troca"; racional em `PERSONALIDADE-DERIVADA.md`; `App.tsx` usa `chatSettingsFor`; `functions/api/chat.js` consome por `toneMap`/`motivMap`). Ela contrabalança a dificuldade; **não** usa o teste de personalidade.
- **O teste de personalidade (os critérios existentes)** é outro código: `src/utils/soulProfile/personality/` (`questions.ts`, `scoring.ts` › `scoreProfile`, `types.ts` com Big Five + Honestidade-Humildade e eixos Jung EI/SN/TF/JP, `labels.ts`); UI em `SoulTestItem.tsx` e `SoulmonOnboarding.tsx`; respostas no save (`GameStateContext.tsx`, `Answers`); entra no Oráculo como semente em `soulProfile/pipeline.ts` e `axes.ts`.
- **Falas do Soulmon:** `src/utils/petVoice.ts` (falas por evento, regra "nenhuma frase cobra"), `mood.ts`, `CompanionHUD.tsx` (fala idle a cada 3 min), `talentoVoice.ts`; chat: `functions/api/chat.js` (prompt de sistema), `ChatBox.tsx`; fala do widget: `pet_line` na ponte.
- **Falas dos NPCs:** `src/utils/areaNpcVoice.ts` (6 anfitriões de área + `NOVO_NPC_VOICE`), `guildCopy.ts`/`guildCopyCore.ts`, `hexsmithCopy.ts`, `buildingIntroCopy.ts`, `libraryNpcs.ts`, `tournamentNpcs.ts`, `bossRoster.ts` (`bossText`), `src/assets/soulmon/npcs/index.ts`; régua `bossRoster.test.ts`; registro `NPCS-NOVOS.md`. O padrão "se quiser/quando estiver pronto" aparece em `MercGuildSheet.tsx`, `RefugeInviteCard.tsx`, `TournamentPage.tsx`, `areaNpcVoice.ts`, `buildingIntroCopy.ts`.
- **Critérios do Oráculo para NPC:** `PLANO-ORACULO.md` §3 e §5 (ficha invisível: elemento/papel/caminho/reino, 17 elementos, 79 classes, "a classe nunca aparece ao jogador", classe-ápice rara), motor em `src/utils/oracle/` (`motor.ts`, `base.ts`, `formas.ts`), `src/utils/soulProfile/ficha/`, estágios em `types/progression.ts` (rookie até ultra), bestiário em `src/utils/soulProfile/bestiary/` (conferir o combinado nos 200+ elementos).
- **Configurações:** `src/components/SettingsPage.tsx` (comentário diz que a personalidade saiu das Settings), `AISettingsModal.tsx` (tipo `AISettings`), `translations/pt.ts` e `en.ts`.

### B1. Personalidade COMPLEMENTAR do Soulmon, a partir do teste

- **Objetivo:** identificar o tipo do jogador pelo teste e dar ao Soulmon a personalidade complementar; mapear os tipos possíveis a que o teste se aproxima, as características de cada um e quais são complementares.
- **Critérios de aceite:**
  1. Existe um mapa documentado: tipos possíveis do teste, características de cada tipo e o complemento de cada um.
  2. A personalidade do Soulmon é derivada do resultado do teste do jogador (critérios existentes em `soulProfile/personality`).
  3. A personalidade aparece nas falas padrão do Soulmon e, se possível, nas respostas da API/chat.
  4. O jogador nunca vê o tipo dele (não é teste de personalidade para ele).
- **Dependências:** `scoreProfile` (traços + eixos Jung); `personality.ts` (as três travas, veto de vulnerabilidade, `challenging` com lastro e fallback `casual`+`supportive`, têm teste e não podem cair); `chat.js` (`toneMap`/`motivMap` só têm 4 tons e 4 estilos); `petVoice.ts` (variantes por tipo, PT+EN); parecer do `soulmon-behavioral-psychologist`.
- **Riscos:** conflito com a decisão de 01/10/2026 ("automática, sem troca") quando B2 pede botão; duas fontes de "personalidade" (forças/dificuldades × teste) podem divergir; quem não fez o teste (save antigo) cai no fallback; regra do Oráculo "nenhum cálculo novo sem manifestação" exige que o tipo vire fala, não número; o teste não é validado (SettingsPage avisa), então não vira diagnóstico; custo de bytes (`orcamentoDeBytes.contract.test.ts`) com mais falas.
- **APK × web:** só web. APK só se a fala padrão do widget ganhar forma nova.
- **Perguntas em aberto:** o "tipo" é por Jung (16), por perfil Big Five ou por arquétipos novos? Complementar = oposto no traço dominante ou "o que falta ao jogador" (liga com a regra atual de contrabalançar a dificuldade)? A derivação por forças/dificuldades é substituída ou convive?

### B2. Falas mais humanas e botão COMPLEMENTAR/SIMILAR

- **Objetivo:** reduzir o tom exagerado de "no seu tempo, tudo bem / faz se quiser / tem comida quando estiver pronto" em geral (Soulmon e NPCs) e falar de forma mais humana e direta ("tô com fome, tem comida aí"); dar nas Configurações um botão para alternar COMPLEMENTAR (padrão) e SIMILAR (mesma do jogador).
- **Critérios de aceite:**
  1. As falas padrão do Soulmon e as dos NPCs perdem o excesso de "no seu tempo/se quiser/quando estiver pronto" e soam diretas e humanas.
  2. As Configurações têm um botão para alternar COMPLEMENTAR (padrão) e SIMILAR; SIMILAR dá ao Soulmon a mesma personalidade do jogador.
  3. Nenhuma tela diz ao jogador qual é o tipo dele.
  4. A trava "nenhuma frase cobra" continua valendo (`petVoice.test.ts`, `widgetSemCobranca.contract.test.ts`, `bossRoster.test.ts`).
- **Dependências:** B1; os arquivos de fala listados acima; `SettingsPage.tsx` + `translations`; persistência da escolha no save (`GameStateContext.tsx`) e envio ao `chat.js`.
- **Riscos:** o produto é "o pet nunca cobra" (`CHAT-SOULMON.md`, `petVoice.ts`), então "direto" não pode virar cobrança; campo novo no save precisa ser opcional com default COMPLEMENTAR; SIMILAR para perfil vulnerável precisa de regra (veto); texto novo passa pelo item D e pelo `design/GLOSSARIO-PT-BR.md`; `EXCECOES-TEXTO-VISIVEL.md`.
- **APK × web:** só web.
- **Perguntas em aberto:** a escolha vale para o chat/IA e para as falas padrão, ou só para uma? Em SIMILAR o veto de vulnerabilidade prevalece? O rótulo do botão não pode revelar o tipo: qual texto?

### B3. Criação de personagem para cada NPC

- **Objetivo:** cada NPC ganha criação de personagem: personalidade de arquétipos variados + elemento e estágio como se fosse Soulmon (a maioria Ultimate/Mega, poucos Ultra; humanoides como Vesca, Hexsmith e Tessária são Ultra; Tessária p.ex. vileza+marcial, conferir o combinado nos 200+ elementos) + classe, pelos mesmos critérios que o Oráculo usa para NPCs. Não aparece ao jogador; só se expressa nas falas. Falas redesenhadas pelo papel/design do personagem. Todo NPC novo nasce já nesse parâmetro.
- **Critérios de aceite:**
  1. Cada NPC existente tem ficha (arquétipo de personalidade, elemento, estágio, classe) gerada pelos critérios do Oráculo.
  2. Distribuição de estágio: maioria Ultimate/Mega, poucos Ultra; Vesca, Hexsmith e Tessária são Ultra.
  3. Elemento e estágio de Tessária conferidos contra o combinado nos 200+ elementos.
  4. Nada da ficha aparece ao jogador (teste de "classe nunca visível" estendido ao NPC, como `classeNuncaVisivel.contract.test.tsx`).
  5. As falas dos NPCs foram redesenhadas conforme o papel/design de cada um.
  6. Todo NPC novo exige a ficha (régua que falhe sem ela).
- **Dependências:** B1 (arquétipos); lista de NPCs (`areaNpcVoice.ts` incl. `NOVO_NPC_VOICE`, `bossRoster.ts`, `libraryNpcs.ts`, `tournamentNpcs.ts`, anfitriões Grom/Vultrak/Zeph/Pipo/Lumi/Vesca, Hexsmith, Tessária); motor do Oráculo (`oracle/motor.ts`, `ficha/`) e bestiário; `NPCS-NOVOS.md`; D mexe nas mesmas falas, então a ORDEM importa.
- **Riscos:** volume (dezenas de NPCs x falas PT+EN); NPC humanoide como "Ultra" precisa de nome de estágio sem sufixo mecânico (`motor.ts`); nenhum número ou classe visível (PLANO-ORACULO §3: a manifestação aqui é a fala); onde guardar a ficha (arquivo de dados versionado, não no save); mexer em NPC já aprovado pode contrariar vetos de arte/identidade.
- **APK × web:** só web.
- **Perguntas em aberto:** lista fechada de NPCs que entram (6 de área + novos + chefes + torneio + Guilda)? A arte atual de cada NPC já fixa o elemento ou a ficha pode divergir? Quais são os "poucos Ultra" além dos três humanoides?

## C. Chat com o Soulmon evolui (meia tela e tela cheia)

### Onde toca

- `src/components/ChatBox.tsx` (hoje uma barra com input, microfone e cartões de ação `ChatActionCard.tsx`), montado por `CompanionHUD.tsx` (`<ChatBox`; a fala do chat vira balão por 5 s); API `functions/api/chat.js` (histórico de 3 mensagens, cota/tier em `_aiGuard.js`, ações em `_chatActions.js`; schema em `CHAT-SOULMON.md`); segurança `chatSafety.ts`, erros `chatErrorCopy.ts`; testes `ChatBox.*.render.test.tsx`; `entradaEnxuta.contract.test.ts` (ChatBox é lazy, fora do chunk de entrada).

### C1. Painel de meia tela (estilo WhatsApp)

- **Objetivo:** hoje só aparece um input; novo: painel que sobe até a METADE da tela cobrindo a lista de tarefas; ficam visíveis só o box do Soulmon, o teclado e, no meio, o campo de mensagens com as respostas e as últimas falas do Soulmon (não precisa persistir para sempre).
- **Critérios de aceite:**
  1. Abrir o chat sobe um painel até a metade da tela, cobrindo a lista de tarefas.
  2. Ficam visíveis o box do Soulmon, o teclado e, no meio, as mensagens (respostas e últimas falas do Soulmon).
  3. O histórico não precisa persistir para sempre (basta a sessão).
  4. Botão de fechar à esquerda.
  5. Microfone, cartões de ação e a proteção de crise (`chatSafety`) seguem funcionando.
- **Dependências:** `ChatBox.tsx`, `CompanionHUD.tsx` (layout da Home: box do Soulmon + lista); API do chat (o servidor recebe 3 turnos; a tela pode mostrar mais, a menos que se decida o contrário); teclado virtual no Android (`visualViewport`).
- **Riscos:** o teclado no Capacitor Android redimensiona a viewport (a metade da tela muda); o painel cobre a lista e o gesto de rolar conflita com a Home; a fala no balão (5 s) e a lista de mensagens duplicam texto; a11y (foco, `aria-live`); regressão do microfone (`ChatBox.mic*`); orçamento de bytes.
- **APK × web:** só web.
- **Perguntas em aberto:** quantas mensagens ficam e se somem ao fechar? O histórico enviado à IA sobe de 3 para mais?

### C2. Tela cheia

- **Objetivo:** ícone de maximizar à direita leva à TELA CHEIA; nela aparece, no canto superior esquerdo, o sprite do Soulmon e o botão fechar; o usuário conversa com o Soulmon.
- **Critérios de aceite:**
  1. Na meia tela há, à direita, um ícone de maximizar.
  2. A tela cheia mostra no canto superior esquerdo o sprite do Soulmon e o botão fechar.
  3. Na tela cheia o usuário conversa com o Soulmon (mesmo canal do C1).
  4. Fechar volta à Home sem perder a conversa da sessão.
- **Dependências:** C1; sprite equipado (`CompanionHUD`), `applySpritePose` (`src/utils/spritePose.ts`, ações `flip_soulmon`/`fly`/`land`).
- **Riscos:** sprite no canto compete com o balão de fala; sprite animado custa bateria; voltar com o teclado aberto.
- **APK × web:** só web.
- **Perguntas em aberto:** na tela cheia o sprite reage (humor/pose) ou é estático?

## D. Revisão do português (~4,3 mil textos nos componentes)

- **Objetivo:** revisar o português dos ~4,3 mil textos nos componentes, em 3 lotes, seguindo `design/GLOSSARIO-PT-BR.md`.
- **Critérios de aceite:**
  1. Os 3 lotes concluídos (tarefa agendada `soulmon-traducao-pt-inline-lotes`, dom 15/11 às 03:00).
  2. O termo de cada conceito segue o `GLOSSARIO-PT-BR.md` (capitalização, ações, conceitos do jogo, tom).
  3. Os testes de copy/tom continuam verdes (`EXCECOES-TEXTO-VISIVEL.md`).
- **Onde toca:** `src/components/**` (texto inline em PT), `src/translations/pt.ts` e `en.ts`; worktrees de lote existentes (`wt-pt1`, `wt-pt2`, branches `copy/pt-lote1`, `copy/pt-lote2`).
- **Dependências:** deve rodar DEPOIS de B2/B3 nas falas que o B reescreve (senão o lote reedita texto que o B troca), ou excluí-las; `GLOSSARIO-PT-BR.md`.
- **Riscos:** conflito de merge grande com B/C nos mesmos componentes (`CompanionHUD.tsx`, `ChatBox.tsx`, `SettingsPage.tsx`); testes que casam texto precisam ser atualizados; EN em paridade (regra "todo texto nasce PT+EN").
- **APK × web:** só web (strings nativas, se entrarem, exigem APK).
- **Perguntas em aberto:** ordem entre os lotes de PT e os itens B/C na madrugada de 15/11? As falas do B ficam fora dos lotes?

## E. Ordem sugerida

1. A (Kotlin/XML) e C (ChatBox) em paralelo: não tocam os mesmos arquivos.
2. B antes de D nas falas; D por último, em lotes.
3. APK único no fim (`versionCode` 32), depois do merge de A.
4. Antes de começar: modal ao dono com as perguntas abaixo (decisões de design, não de código).

## F. Decisões do dono (11/11/2026) e o que segue em aberto

Decididas pelo dono; **prevalecem sobre qualquer "Perguntas em aberto" dos itens acima** (essas ficam como histórico do raciocínio):

1. **Modelo base da personalidade (B1):** Big Five (5 dimensões); o complemento é calculado por dimensão.
2. **Tom das falas (B2):** depende da personalidade de cada Soulmon/NPC; não há tom padrão único; reduzir o "no seu tempo, tudo bem" em geral.
3. **Chat (C):** limite de 20 mensagens por dia no plano grátis; ao passar do limite o Soulmon responde com fala padrão; o histórico vale só na sessão (não persiste).
4. **Jogador sem teste de personalidade (B1/B2):** Soulmon neutro até o teste; depois, complementar (ou similar, se a opção estiver ligada em Configurações).
5. **NPCs (B3):** elemento, estágio, classe e personalidade são definidos pelo papel e design de cada um e APLICADOS sem pedir aprovação; a tabela resultante entra no relatório para o dono ajustar depois.
6. **Escopo das falas (B2/B3):** na beta12, priorizar o Soulmon (falas padrão e API) e os NPCs principais; o resto em lotes depois.
7. **Nome do 3º widget (A3):** "Companheiro" (en: "Companion").
8. **Execução:** só no DOMINGO 15/11/2026 às 03:00; nenhuma implementação antes (o dono escolheu "Só domingo").

Ainda em aberto (modal ao dono antes ou durante a execução; recomendada primeiro):

| # | Item | Pergunta | Recomendada |
|---|---|---|---|
| 1 | A3 | O vertical (A2) é só o redimensionamento do V-Pet ou uma opção separada do seletor? | redimensionamento do V-Pet; as 3 opções são V-Pet, outro existente e Companheiro (confirmar) |
| 2 | A2 | Moldura vertical: a mesma estendida ou arte nova? | arte nova, pelo ChatGPT |
| 3 | B2 | Em SIMILAR o veto de vulnerabilidade prevalece? | sim |
| 4 | B1 | A derivação por forças/dificuldades (G7, 01/10) convive ou é substituída? | convive: o teste decide o caráter, forças/dificuldades decidem o veto |
| 5 | C1 | Quantas mensagens ficam na tela; o histórico enviado à IA sobe de 3? | últimas ~20 na tela, 3 turnos para a IA como hoje |
| 6 | D | As falas reescritas no B ficam fora dos lotes de PT? | sim |
