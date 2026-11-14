# Backlog da beta12 (versionCode 32)

> **Dono:** soulmon-coordenador · **Data:** 11/11/2026 · **Pedido do dono:** 11/11/2026 · **Base:** `7895310` (main; `versionName` `1.3.0-beta11`, `versionCode` 31) · **Atualizado:** 11/11/2026 (decisões 9 a 13 em §F) · **Estado:** BACKLOG, nada implementado; o estado real é o código.
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

- **Objetivo:** o widget SEM moldura (o que já existe; decisão 9) poder ser esticado na vertical: 1 célula de largura, 2 ou mais de altura; o texto fica ABAIXO do Soulmon. O widget COM moldura, agora chamado Cage, NÃO ganha formato vertical.
- **Critérios de aceite:**
  1. O widget sem moldura aceita 1 célula de largura e 2+ de altura (hoje o seu `minWidth` 180dp e o alvo 3x2 impedem; o Cage tem alvo 4x3 e `minResizeWidth` 180dp).
  2. Nesse formato o texto da fala aparece abaixo do Soulmon (hoje fica à direita).
  3. O formato horizontal atual continua igual.
- **Dependências:** `soulmon_widget_clear_info.xml` (provider `SoulmonWidgetClearProvider`, rótulo "Soulmon"; confirmar no código ao executar), o layout e o renderer desse widget; `WidgetVpet.kt` (layout em caixas) só se o formato vertical reutilizar a geometria do V-Pet. Não há moldura vertical nova: o formato vertical é do widget sem moldura (decisão 9).
- **Riscos:** o layout do widget sem moldura precisa caber em 1 de largura sem distorcer nem deixar o sprite minúsculo; interação com A3 (sprite grande); o launcher do aparelho decide as células reais, só se prova em aparelho.
- **APK × web:** APK (XML, layout, Kotlin).
- **Decidido (§F, 9):** não há moldura vertical nova; o formato vertical é do widget sem moldura.
- **Perguntas em aberto:** teto de altura (não está na lista de §F).

### A3. Terceiro widget (total de 3 opções) com o Soulmon GRANDE

- **Objetivo:** terceira opção, o **Companheiro** (en: "Companion"; §F, 7), igual ao Cage, mas com o Soulmon grande (2x2 ou 3x3 conforme o tamanho colocado); o sprite se ajusta ao tamanho do widget.
- **Critérios de aceite:**
  1. O seletor do Android passa a mostrar 3 opções: **Cage** (V-Pet com moldura), **sem moldura** (redimensionável também na vertical, ver A2) e **Companheiro** (Soulmon grande) (§F, 9).
  2. O Companheiro tem o mesmo conteúdo do Cage (fala, ícones, moldura, cenário).
  3. Colocado em 2x2 ou 3x3, o sprite ocupa o espaço e se ajusta ao tamanho.
- **Dependências:** provider + `info.xml` + layout + manifest novos; reuso de `renderVpet` com outra geometria (`WidgetVpet.kt`); `updateData` já alimenta os providers pelo mesmo prefs.
- **Riscos:** hoje há 8 providers registrados e os antigos NÃO podem sair (tirar um receiver apaga o widget já colocado); sprite grande exige a arte nativa do estágio (`WidgetOwnSprite`, `STARTER_SPRITES`).
- **APK × web:** APK.
- **Decidido (§F, 9):** as 3 opções são Cage, sem moldura e Companheiro; o vertical é o redimensionamento do widget sem moldura, não uma opção separada.
- **Perguntas em aberto:** entre 2x2 e 3x3 o layout muda sozinho? (não está na lista de §F)

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

## E2. Artefato Tabela de Soulmons e NPCs (fora do jogo)

> **Pedido do dono:** 11/11/2026. **Execução:** DOMINGO 15/11/2026 (precisa de tokens a partir de domingo). **NÃO entra no jogo:** nenhum arquivo de `src/`, `functions/` ou `android/` muda por causa deste item; não exige APK nem deploy do Worker. É um artefato de uso do dono (claude.ai Artifact, HTML, privado por padrão, sem link público) e o CSV exportado é usado pela sessão operacional para atualizar os dados da beta12 (espécies, estágios, NPCs e personalidades do item B).
> **Nota de rótulo:** a letra `E` já era da seção "Ordem sugerida"; este item ficou `E2` para não renomear nada existente.

### E2.1 Objetivo

Uma tabela única com todos os sprites do Soulmon em ordem de evolução (por linha e ramo) e todos os NPCs, com os dados que o jogo usa hoje, editável pelo dono e exportável em CSV para reimportação sem ambiguidade.

### E2.2 Conteúdo e colunas

- **Soulmon:** uma linha por sprite. Ordem de evolução: `rookie` → `champion` (power, harmony, benevolence) → `ultimate` (×3) → `mega` (×3) → `ultra`. Uma linha ramificada completa tem 11 sprites (1 + 3 + 3 + 3 + 1), a mesma escada de `CORVO_FORM_IDS`. Linhas sem ramo (um sprite por estágio) entram com `ramo` vazio.
- **NPCs:** uma linha por NPC de cada registro listado em E2.3 (sem repetir o mesmo NPC em dois registros; a chave canônica é a do registro de arte).
- **Colunas visíveis:** `nome` (PT, com EN no detalhe), `tipo` (harmonia, benevolência ou poder; é o ramo do jogo), `elemento base`, `estágio` (nome do nível do jogo), `tipo de ataque` (escola do básico), `tipo de ataque especial` (escola + família do efeito).
- **NPC sem ataque no código:** a célula fica vazia e `origem_ataque` = `sem_ataque`. Nada é inventado.

### E2.3 Fonte dos dados (levantado em `c3af0eb`, origin/main de 11/11; reconferir na execução)

- **Linhas e ramos do Soulmon:** `src/utils/corvoPet.ts` (`CORVO_FORM_IDS`, 11 formas; `CORVO_SPRITES` e `CORVO_SPRITES_256`); nomes e descrições em `src/utils/corvoAdocao.ts` (`NOMES`, `CORVO_STAGES`); starters e linhas de arte em `src/utils/sprites.ts` (`STARTER_IDS` e `STARTER_NAMES`, 5 iniciais com um sprite cada; `OWN_LINE_SPRITES`, 4 linhas × 4 estágios; `DUNGEON_LINE_SPRITES` e `DUNGEON_LINE_NAMES`). Arte em `src/assets/soulmon/lines/` e `src/assets/soulmon/corvo/`.
- **Linhas aposentadas:** `RETIRED_LINE_IDS` em `src/utils/sprites.ts` (orrin, serah, nautilu, ignar, lumel). Ficam FORA da tabela; o id continua válido em save antigo.
- **Estágios:** `FORM_REQUIREMENTS` em `src/types/progression.ts` (rookie, champion, ultimate, mega, ultra). ⚠️ O oráculo chama o nível ultimate de `perfeito` (`StageId` em `src/utils/oracle.ts`); a tradução para o id do jogo é `creatureFormId` em `src/utils/oracle/base.ts`. A tabela e o CSV usam sempre o id do jogo.
- **Ramo (tipo):** `BranchType` em `src/types/attributes.ts` (power, harmony, benevolence), com rótulos `ATTR_LABEL` (Poder, Harmonia, Benevolência). No oráculo o mesmo eixo é `AlignmentId` (poder, harmonia, benevolencia).
- **Elemento base:** `SPRITE_ELEMENT`, `LINE_ELEMENT`, `BOSS_ELEMENT` e `DESAFIANTE_ELEMENT` em `src/utils/spriteElement.ts` (dono único; regra do dono de 30/10: um sprite = um elemento). Vocabulário: `ElementId` em `src/utils/oracle.ts` (agua, fogo, terra, ar, sombra, luz, planta, industrial) e os combinados (id fundido, ex.: `vapor`).
- **Tipo de ataque e de especial:** NÃO há tabela estática por espécie. Os valores saem da ficha: `buildStageSkills` e `buildAllStageSkills` em `src/utils/soulProfile/ficha/skills.ts` (`StageSkill.escolaId`, `familia`); forma do golpe em `src/utils/soulProfile/ficha/strikeForm.ts`. Escolas: `ESCOLAS_SKILL` em `src/utils/soulProfile/ficha/types.ts` (combate_fisico, longo_alcance, conjuracao, benca, maldicao). Famílias do especial: `SPECIAL_FAMILIES` em `src/utils/combate/specials.ts` (direct, dot, heal, shield, atkBuff, defDebuff, spdBuff). Padrão de escola→família: `ESCOLA_FAMILY_PADRAO` em `src/utils/arena.ts`.
- **NPCs (registros de arte):** `src/assets/soulmon/npcs/index.ts` (`AREA_NPC_ART`, `STALL_NPC_ART`, `LOT_NPC_ART`, `FUNCTION_NPC_ART`, `EXTRA_NPC_ART`, `NOVO_NPC_ART`).
- **NPCs (falas e nomes):** `src/utils/areaNpcVoice.ts` (`LOT_NPC_VOICE`, `EXTRA_NPC_VOICE`, `NOVO_NPC_VOICE`); chefes e guardiões em `src/data/bossRoster.ts` (`BOSS_ROSTER`, com `BossElement`); torneio em `src/utils/tournamentNpcs.ts` (`TOURNAMENT_NPCS`). Registro humano: `docs/NPCS-NOVOS.md` e `docs/ELEMENTO-POR-SPRITE.md`.
- **Fora da tabela:** `LIBRARY_NPCS` (`src/utils/libraryNpcs.ts`) reaproveita sprites de linha do jogador como pets de teste, não é NPC; e `src/utils/soulProfile/bestiary/pool.json` (7.386 criaturas do bestiário do oráculo, só texto e atributos) só entra se o dono pedir.

### E2.4 Formato do CSV (chaves estáveis, para reimportar sem ambiguidade)

- Codificação UTF-8 sem BOM, separador vírgula, aspas no padrão RFC 4180, fim de linha LF, cabeçalho na linha 1 com EXATAMENTE estas colunas, nesta ordem:
  `id,tipo_entidade,linha_id,estagio,ramo,nome_pt,nome_en,elemento,ataque_basico,ataque_especial_escola,ataque_especial_familia,origem_ataque,fonte_codigo`
- **`id` (chave de importação):** `soulmon.<linha_id>.<forma_id>` para Soulmon, com `forma_id` no padrão de `creatureFormId` (`rookie`, `champion-power`, …, `ultra`); `npc.<registro>.<chave>` para NPC, com a chave do registro de arte (ex.: `npc.novo.alquimistaLimo`). O nome nunca é chave.
- **Valores fechados:** `tipo_entidade` ∈ {`soulmon`, `npc`}; `estagio` ∈ {`rookie`, `champion`, `ultimate`, `mega`, `ultra`} (vazio em NPC sem estágio); `ramo` ∈ {`power`, `harmony`, `benevolence`, vazio}; `elemento` ∈ `ElementId` ou combinado; `ataque_basico` e `ataque_especial_escola` ∈ `ESCOLAS_SKILL`; `ataque_especial_familia` ∈ `SPECIAL_FAMILIES`; `origem_ataque` ∈ {`ficha`, `padrao`, `sem_ataque`}.
- `origem_ataque` = `padrao` quando o valor veio de `ESCOLA_FAMILY_PADRAO` e não da ficha; `fonte_codigo` = caminho do arquivo e nome do registro de onde a linha saiu.
- **Importação (feita pela sessão operacional, não pelo artefato):** é atualização, não substituição. `id` desconhecido = erro com a linha; `id` ausente no CSV não é apagado; célula vazia em campo obrigatório = erro; `nome_pt`, `estagio` e `elemento` são obrigatórios para `soulmon`.
- Nome do arquivo exportado: `soulmon-npcs-beta12-v1.csv`. A versão do formato sobe (`v2`) se uma coluna mudar.
- **v2 (vigente):** acrescenta `usar_no_jogo` ∈ {`sim`, `nao`} (default `sim`) ao FIM do cabeçalho; arquivo `soulmon-npcs-beta12-v2.csv`. O importador aceita v2 e v1 (sem a coluna = `sim`); valor fora de {`sim`,`nao`} é erro com a linha.

### E2.5 Interface (artefato)

- **Filtro:** ícone de três linhas abre filtro por coluna com várias opções marcadas. Dentro de uma coluna vale OU (união); entre colunas vale E (interseção). Colunas filtráveis: `tipo_entidade`, `linha_id`, `estagio`, `ramo`, `elemento`, `ataque_basico`, `ataque_especial_escola`, `ataque_especial_familia`, `origem_ataque`.
- **Edição:** clicar numa linha abre o painel de edição com TODOS os campos preenchidos com o valor da linha. Campos de lista fechada são seleção; `id`, `tipo_entidade` e `fonte_codigo` são somente leitura.
- **Exportar CSV:** exporta as linhas visíveis com o filtro aplicado (sem filtro = todas), no formato de E2.4.
- Gerado a partir de um JSON produzido por um script novo na execução (não existe hoje). O script roda pelo vitest ou `tsx`, porque a ficha é TypeScript.

### E2.6 Critérios de aceite (testáveis)

1. **Total:** o número de linhas do artefato = o número de linhas do JSON gerado pelo script, e o script registra a contagem por `tipo_entidade` no relatório da execução.
2. **Escada completa:** para `corvo`, a sequência de `estagio` + `ramo` é `rookie`, `champion`×3, `ultimate`×3, `mega`×3, `ultra` (11 linhas), sem id repetido.
3. **Sem vazio obrigatório:** nenhuma linha de Soulmon sem `nome_pt`, `estagio` ou `elemento`.
4. **Elemento válido:** todo `elemento` é um `ElementId` ou combinado existente no código (teste que lê o vocabulário e falha em valor fora dele).
5. **Filtro:** `ramo=power` + `estagio=mega` mostra só as linhas que têm os dois; duas opções na mesma coluna mostram a união; limpar tudo volta ao total do item 1.
6. **Edição completa:** o painel de edição abre com os campos da linha; comparação campo a campo com a tabela dá zero diferença.
7. **Round trip:** exportar sem edição gera um CSV idêntico, byte a byte, a um segundo export; o cabeçalho é idêntico ao de E2.4.
8. **Diff de edição:** editar um campo de uma linha e exportar muda só essa linha e só essas colunas.
9. **Importação:** `id` desconhecido é recusado com o número da linha; `id` ausente no CSV é mantido no jogo (não apagado).
10. **Sem dado inventado:** toda linha tem `fonte_codigo` preenchido; NPC sem ataque sai com `origem_ataque` = `sem_ataque` e campos de ataque vazios.
11. **Fora do jogo:** `git diff --name-only` do PR de execução não toca `src/` nem `functions/` nem `android/`, salvo o script novo e seus testes; o artefato não é publicado com link público.
12. **Régua:** `vitest src/docsManual*.test.ts` verde.

### E2.7 Riscos e pontos a confirmar na execução

- **Linhas sem ramo:** `kaelen`, `thalindra`, `igni` e `astrase` têm um sprite por estágio em `OWN_LINE_SPRITES`, e algumas artes só trazem sufixo de ramo no nome (ex.: `kaelen-champion-power.png`). Confirmar quais ramos existem de fato.
- **Linhas de masmorra:** em `DUNGEON_LINE_SPRITES` os quatro estágios de cada linha apontam para o MESMO sprite de chefe. A tabela mostra a arte de linha (`OWN_LINE_SPRITES`) ou a do chefe?
- **Ultra:** só o corvo tem `ultra` em arte de linha? Confirmar.
- **Starters:** cada um tem um sprite só (`STARTER_SPRITES`), sem estágios. Entram como estágio único?
- **Ataque sem ficha determinística:** a ficha depende do save do jogador. Para a tabela, o valor vem do gerador com entrada fixa ou do `ESCOLA_FAMILY_PADRAO` (`origem_ataque` = `padrao`)?
- **Efeito nos NPCs:** o mesmo NPC aparece em mais de um registro (ex.: área e torneio); a regra de chave canônica (E2.2) decide qual linha vale.
- **Voz:** as falas do item B não entram nesta tabela; o CSV só carrega os dados de identidade (nome, elemento, ramo, estágio, ataque).

### E2.8 Perguntas em aberto (modal ao dono, domingo, antes da execução)

Nenhuma pergunta foi feita no momento da escrita; as de E2.7 vão em modal no domingo, com a opção recomendada primeiro.

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
9. **Widget vertical (A2) e opções (A3):** o redimensionamento vertical vale para o widget SEM moldura (o outro widget que já existe). O widget COM moldura passa a se chamar **Cage** (en: "Cage"); portanto NÃO se gera moldura vertical nova. As 3 opções de widget: **Cage** (V-Pet com moldura), o **sem moldura** (redimensionável também na vertical, 1 de largura x 2+ de altura, texto abaixo do Soulmon) e **Companheiro** (Soulmon grande).
10. **Derivação por forças/dificuldades (B1):** a derivação do G7 (01/10) CONVIVE com o Big Five: o teste decide o caráter, forças/dificuldades decidem o veto.
11. **Chat (C1):** ~20 mensagens visíveis na tela (da sessão); o servidor recebe 3 turnos, como hoje.
12. **Veto em SIMILAR (B2):** em personalidade SIMILAR o veto de vulnerabilidade prevalece.
13. **Falas do B e lotes de PT (D):** as falas reescritas no item B ficam FORA dos lotes de revisão de português (D).

Ainda em aberto: **nenhuma pergunta de modal pendente**. As seis perguntas da tabela anterior (widget vertical e opções, moldura vertical, veto em SIMILAR, derivação G7, chat e falas fora dos lotes de PT) foram respondidas nas decisões 9 a 13 e nos itens 1 a 8 acima. Restam só as perguntas de detalhe marcadas nos itens A2 (teto de altura) e A3 (layout 2x2/3x3), que não estão na lista de §F.

## H. Keep-awake nativo no Focus Workshop

A jornada do Foco já pede a tela acordada pela web (`navigator.wakeLock`, `src/utils/keepAwake.ts`, REGISTRO §304) e usa, se existir, o plugin Capacitor `KeepAwake` registrado em `window.Capacitor.Plugins`. O que depende da beta12/APK:

- Adicionar `@capacitor-community/keep-awake` (ou `FLAG_KEEP_SCREEN_ON` no `MainActivity`) e `npx cap sync`; nenhum código web novo é preciso, o hook já o detecta.
- Medir em aparelho real se o WebView Android segura o wake lock da web com a tela bloqueada/economia de bateria; se não, o nativo passa a ser a via principal.
- `versionCode` junto do APK único da beta12.

## G. Balões dourados do Soulmon (pedido do dono, 11/11/2026; item "F" do pedido, renumerado G porque a seção F já é "Decisões do dono")

Execução: beta12, **domingo 15/11/2026 às 03:00** (nenhuma implementação antes). Falas **PERSISTENTES** do Soulmon, em balão diferente (**borda dourada**), que **levam o jogador ao lugar**. Três casos:

1. **Volta da missão / do Mercador (antes "feira"):** quando o Soulmon volta e encontrou algo, o balão fica na Home até ser tocado; tocar leva ao encontro (`encontro`/`guildRaidHit`) ou ao Mercador.
2. **Plaquinha do Rift:** a plaquinha de que ele está no Rift ganha o balão dourado; **[JÁ FEITO em 12/11, REGISTRO §307: a plaquinha já oferece "Ir à Fenda" e "Trazer de volta"; falta só o balão dourado]** tocar oferece a opção de ir ao Rift (aviso "Ele está na masmorra", com "Retirar da masmorra" e o novo "Ir ao Rift").
3. **Grove sob ataque:** o Soulmon avisa que o Grove está sendo ATACADO; o balão leva até lá **mesmo que o jogador ainda não tenha condição de defender** (não fez as tarefas): o balão só encaminha, nunca bloqueia nem cobra.

**Regra comum:** depois de tocar e ser direcionado, o balão fecha e **NÃO aparece mais naquele dia** (por conta).

### Critérios de aceite (testáveis)

- G1. Com a missão/Mercador concluídos e achado pendente, a Home mostra o balão dourado sem timeout de auto-esconder (diferente do `speak` de ~poucos segundos); ele sobrevive a trocar de aba e voltar.
- G2. Tocar o balão do caso 1 navega ao encontro/Mercador correto (um teste por destino) e marca o balão como dispensado no dia.
- G3. Com o Soulmon no Rift, o balão aparece junto da plaquinha; tocar abre a escolha com "Ir ao Rift"; ao escolher, navega e dispensa.
- G4. Com o Grove atacado, o balão aparece mesmo com tarefas do dia pendentes; tocar abre o Grove (modo ataque) sem exigir pré-requisito; sem ataque, não aparece.
- G5. Depois de tocado, o balão não reaparece no mesmo dia local (reabrir o app, recarregar, trocar de aba) e reaparece no dia seguinte se a condição ainda valer.
- G6. Vários balões ao mesmo tempo: fila por prioridade (Grove sob ataque > Rift > achado); só um visível; o dispensado libera o próximo.
- G7. Borda dourada distinguível do balão comum em claro e escuro, contraste AA do texto; alvo de toque >= 44 px; leitor de tela anuncia como botão com o destino ("Abrir o Grove").
- G8. Suíte verde e régua de PT (`pt-lint`) nas falas novas; falas respeitam o tom da personalidade do Soulmon (item B).

### Onde toca no código

- Falas e balão da Home: `src/components/CompanionHUD.tsx` (`bubbleText`, `speak`, `bubbleTimeoutRef`; o balão atual some por timeout, o dourado precisa de estado próprio persistente e `pointer-events: auto` sem comer o clique dos botões de cuidado, ver o comentário sobre zIndex 45).
- Plaquinha do Rift / masmorra: `CompanionHUD.tsx` (`naMasmorra`, prop da plaquinha e do toque que abre o aviso), `src/components/DungeonBusyModal.tsx`, `src/App.tsx` (~linhas 3997-4011) e `src/contexts/GameStateContext.tsx` (estado "na masmorra").
- Retorno da missão e acerto do Grove: `src/App.tsx` e `src/utils/community.ts` (`guildRaidHit`), telas `src/components/guild/` (`BossFightScreen`, `BossCheerPrelude`); o estado "Grove sob ataque" precisa de um sinal único (hoje deve ser derivado do chefe/raid da guilda: confirmar na implementação).
- Mercador (antes "feira"): `src/components/guild/` (contrato `guildFeiraFiacao`) e a rota do Mercador.

### Persistência diária por conta

- Chave `balaoDourado:<tipo>:<AAAA-MM-DD>` no save da conta (não só localStorage), para não reaparecer em outro aparelho; "dia" = dia local do jogador, o mesmo corte usado pelas tarefas diárias.
- Gravar ao TOCAR e ser direcionado (não ao exibir); sincronizar pelo caminho normal do save em nuvem; dados novos entram nos testes de serialização (`cloudSave.serializacao`).

### Riscos

- Balão persistente cobre o corpo do pet ou os botões de cuidado (regressão que o §60 já corrigiu): testar render nos temas e tamanhos de tela.
- Dois relógios de "dia" (UTC no servidor x local no cliente) reabrindo o balão perto da meia-noite.
- Grove atacado e jogador sem condição: tom da fala não pode culpar nem pressionar (item B2); sem dark pattern.
- Fila de balões virar spam: limite de um visível e uma vez por dia por tipo.
- Sinal "Grove sob ataque" ainda não existir como estado explícito: pode exigir trabalho de servidor (`functions/api`), o que muda o canal (APK x web, seção 0).

## I. Avisos do Pomodoro com o app fechado (pedido do dono, 12/11/2026)

A jornada do Foco avisa «hora do descanso» (fim dos 25 min) e «o descanso acabou» (fim dos 5 min) sem plugin novo (REGISTRO §301, `src/utils/focusNotify.ts`): no APK reaproveita o alarme nativo que já existe (`SoulmonAlarm.scheduleAlarm`, "HH:mm", disparo único, INEXATO: pode atrasar alguns minutos; é refeito após o boot). O que depende de APK ou de servidor:

- **Alarme exato com data completa** (hoje o plugin só entende "HH:mm" do próximo disparo e é inexato por não declarar `SCHEDULE_EXACT_ALARM`): um método novo no `SoulmonAlarmPlugin` (timestamp em ms, `setAlarmClock` ou `setExactAndAllowWhileIdle`) pediria APK; só vale se o atraso do inexato incomodar nos testes.
- **Web/PWA com o app FECHADO**: sem push do servidor para o foco não há como avisar (o timer da web só vive com a aba em segundo plano). Exigiria um `focus-end` no worker de push (`functions/api`), com o horário de fim vindo do servidor da jornada, que já o conhece.
- **Alarme esquecido depois do reboot**: o `BootReceiver` reagenda o que está em `SoulmonAlarms`; o app cancela o alarme ao seguir ou concluir, mas um alarme que disparou fica guardado até o próximo `cancelFocusAlarm`. Conferir em aparelho real se reaparece um aviso velho após reiniciar.
- Permissão de notificação: o app só usa a que o jogador já deu (não pede sozinho nesta tela).

## J. Tarefas e hábitos sugeridos linkados a recursos do jogo

> **Pedido do dono:** 12/11/2026. **Execução:** beta12, domingo 15/11/2026 às 03:00 (nenhuma implementação antes). Só web (JS/React/copy, sai pelo Worker, sem APK), **exceto** a leitura nativa de passos, que já existe no APK (plugin `SoulmonSteps`, PRs #764 e #784).

### Regra

Toda tarefa ou hábito **sugerido** pelo catálogo de atividades (`src/data/activityCatalog.ts`) que tenha um recurso no jogo aparece **linkado** a esse recurso. Três casos pedidos pelo dono:

1. **Caminhar → contador de passos.** A tarefa mostra os passos do dia na própria linha. Ao atingir a meta, ela é marcada **sozinha** (check automático).
2. **Journaling → prédio do Caderno.** A tarefa tem um link que leva ao prédio do Caderno (`forja.caderno`). Ao completar lá, a tarefa é marcada.
3. **Aviso do check automático.** Quando o check automático acontece, aparece no topo da tela uma tag de borda arredondada, no estilo dos avisos (balão de `NoticeToast`), com o texto "Tarefa" e o checkbox já marcado. O visual é o da linha da tarefa na Home, como um recorte dela, para o jogador ver que marcou.

### Mapeamento catálogo → recurso (lido no código em `origin/main`, 29c4eae)

| Atividade do catálogo (id) | Recurso no jogo | Situação |
|---|---|---|
| `corpo-caminhar` | Contador de passos (Health Connect; reserva no contador do aparelho; `src/utils/steps.ts`) | **Linkar.** Ver riscos (regra 1 de `steps.ts`). |
| `mente-gratidao` (diário de gratidão) e `criatividade-escrita-livre` (escrita livre) | Caderno (`forja.caderno`, `CadernoSheet`) | **Linkar** como "journaling". O Caderno diário saiu das diárias em 12/11 (REGISTRO §309) e foi substituído pela semanal "journal 3× na semana"; o prédio continua existindo e paga tinta na entrada. Gatilho a confirmar (A5). |
| `foco-bloco-25min` | Focus Workshop (prédio Foco, na Forja; sessão concluída já alimenta a semanal "3 dias") | **Candidato forte.** Pergunta Q5. |
| `foco-uma-tarefa-por-vez` | Focus Workshop (escolha de tarefas e hábitos de hoje, desde 01/11) | **Candidato.** Mesma pergunta Q5. |
| `sono-horario-fixo`, `sono-telas-fora`, `sono-preparar-quarto` | Nenhum do jogador. A janela de descanso (`src/utils/restWindow.ts`) nasce de pôr o **pet** para dormir, sem sensor; o "Z" do widget é o pet dormindo. | **Não linkar** (Q6). |
| `corpo-beber-agua` | Nenhum contador de água no jogo | **Não linkar.** Contador de copos seria item novo (Q7). |
| Demais atividades (força, alongar, respiração, ler, mensagens, casa, finanças, propósito etc.) | Nenhum recurso no jogo hoje | Sem link. |

### Critérios de aceite (testáveis)

- **A1. Catálogo.** Cada atividade com recurso mapeado declara o campo novo (proposta: `resource`, com valores `steps`, `building:forja.caderno` e `building:forja.foco`). Um contract test em `src/data/` varre o catálogo: atividade com recurso sem campo, ou campo com valor inválido, falha. Atividades sem recurso não ganham campo.
- **A2. Linha da tarefa.** Tarefa criada a partir de uma sugestão com recurso mostra o indicador na própria linha: "N de M passos" para caminhar; botão "Ir ao Caderno" para journaling. Teste de render, nos temas claro e escuro.
- **A3. Passos, check automático.** Com permissão concedida e leitura de hoje igual ou acima da meta, a tarefa **adotada** de caminhar fica marcada sem toque. Como o polling de passos roda a cada 5 min (`STEPS_POLL_MS`), aceitar até 5 min de atraso. Sem permissão ou sem sensor, nada muda: o check segue manual.
- **A4. Passos abaixo da meta.** Nunca marca. Mostra só o progresso.
- **A5. Caderno.** Um registro guardado no Caderno marca a tarefa de journaling (no máximo uma vez por dia). Fechar o Caderno sem salvar não marca. O link abre o prédio do Caderno. Reusar o evento real de registro guardado que já existe em `App.tsx` (perto da contagem da semanal "journal"), sem criar gatilho paralelo.
- **A6. Foco.** Conforme a resposta de Q5: a sessão concluída (ou só a que usou a tarefa escolhida) marca a tarefa, uma vez por dia.
- **A7. Aviso.** Ao check automático, aparece a tag no topo: borda arredondada, texto "Tarefa", checkbox marcado, tempo na tela conforme Q8. Não bloqueia os botões de cuidado do pet. Contraste AA. O leitor de tela anuncia "Tarefa concluída automaticamente: <nome>". Respeita `prefers-reduced-motion`.
- **A8. Idempotência.** O check automático grava a chave `<AAAA-MM-DD>|<id da tarefa>`. Recarregar, reabrir o app, trocar de aba ou repetir o gatilho não duplica recompensa, não reabre o aviso e não desmarca nada.
- **A9. Dia da conta.** O "dia" é o dia do jogador (mesmo corte das tarefas diárias e de `stepsDayKey`). Passos da noite anterior não marcam a tarefa de hoje. Teste na virada da meia-noite local.
- **A10. Sem desmarcar.** O check automático segue a regra de `handleToggleTask` (tarefa concluída não desmarca). Queda do contador de passos (reboot ou reabertura do app) nunca desmarca.
- **A11. Regra de passos.** Nenhuma recompensa nova ligada só a passo. O check automático dá o mesmo que o toque manual (Q2) e só marca tarefa que o jogador adotou (Q1).
- **A12. Textos.** Textos novos (tag, indicador, link, anúncio para leitor de tela) em EN e PT-BR, e passam pela régua de PT (`pt-lint`).

### Onde toca no código (sem número de linha, para não envelhecer)

- Catálogo: `src/data/activityCatalog.ts`, `src/types/activityCatalog.ts`, `src/utils/catalogHabitMigrate.ts` (ids de hábitos já adotados não podem mudar).
- Tarefas e hábitos: `src/types/taskModel.ts`; em `src/App.tsx`, os handlers de check da Home: `handleToggleTask`, `handleToggleActivityCompletion`, `handleCompleteSteps` e `handleToggleTaskStep`; estado em `src/contexts/GameStateContext.tsx`.
- Passos: `src/utils/steps.ts` (`readStepsToday`, `applyHealthTotal`, `stepsDeltaFrom`, `DEFAULT_STEP_GOAL`, `STEP_GOAL_OPTIONS`), `src/plugins/SoulmonStepsPlugin.ts`, `src/components/StepsCard.tsx`, polling em `src/App.tsx` (`STEPS_POLL_MS`, `STEPS_VERIFIED_MIN`).
- Caderno: `src/components/play/CadernoSheet.tsx`, `src/utils/buildingQuests.ts` (`forja.caderno`, `RETIRED_LISTED_BUILDING`), evento de registro guardado em `src/App.tsx`.
- Focus Workshop: `src/App.tsx` (sessão concluída e `handleCheckInConfirm`), `src/utils/buildingIntroCopy.ts`.
- Avisos e toasts: `src/components/NoticeToast.tsx` (`NOTICE_TOAST_MS`, `NOTICE_TOAST_KEYS`; a nova chave entraria aqui), `src/components/Toasts*`, fila `filaDeAvisos`. A tag nova respeita a fila: no máximo um aviso visível (ver balões dourados, item G).
- Linha da tarefa na Home: componente a confirmar na execução (`src/components/TaskMeta.tsx` é o candidato).

### Riscos

- **Check automático indevido.** O Health Connect soma passos de outros apps, e o celular pode contar passos que não são do jogador. Mitigação: só marca tarefa adotada, com meta; mostrar a fonte "Health Connect" na linha.
- **Regra 1 de `steps.ts`.** "Passo nunca pontua sozinho". O check automático só é compatível se a tarefa foi declarada (adotada) pelo jogador e o passo apenas confirma. Por isso Q1 e A11 existem. Se o dono decidir diferente, a regra 1 precisa ser revista antes, no código.
- **Privacidade.** Passos são dado de saúde (Play Data Safety e LGPD). Guardar só o agregado diário (regra 4 de `steps.ts`), sem série. O texto de consentimento (`stepsConsentCopy`) diz PARA QUÊ o dado é lido: revisar para cobrir "mostrar na tarefa e marcar sozinho" **antes** de pedir de novo. Quem já concedeu não passa de novo pelo diálogo do sistema.
- **Idempotência e reset do contador.** O contador zera no reboot e ao reabrir o app. O baseline (`updateStepBaseline`) cuida disso; o check não pode depender do valor cru.
- **Dia da conta.** Passos da noite contados como do dia seguinte; UTC no servidor e dia local no cliente. Mesmo risco do item G.
- **Duplicar gatilho.** Caderno e Focus já alimentam a semanal. O check da tarefa precisa reusar esses eventos, não criar contagem nova.
- **Poluição de avisos.** A tag nova pode competir com os balões dourados (item G) e com `NoticeToast`. Limite de um visível.
- **Mudança de id.** Trocar id de atividade quebra hábitos já adotados (`catalogId`). Só adicionar campo; não renomear.
- **Canal.** Tudo é JS/CSS (sai pelo Worker). O único ponto nativo é o plugin de passos, que já está no APK. Se o plugin mudar, exige APK (seção 0).

### Perguntas em aberto (modal ao dono, em lote)

- **Q1. Quem pode ser marcado sozinho?** Recomendada: só tarefa ADOTADA pelo jogador. Sugestão não aceita não marca.
- **Q2. Recompensa do check automático.** Recomendada: a mesma do toque manual, sem bônus extra.
- **Q3. Meta de passos.** Recomendada: a meta de passos configurada em Configurações (`STEP_GOAL_OPTIONS`, padrão 7.000), e não os minutos do catálogo ("10 min, 3× na semana").
- **Q4. Journaling.** Recomendada: marcar ao SALVAR qualquer registro no Caderno, uma vez por dia.
- **Q5. Foco.** Recomendada: marcar a tarefa escolhida quando a sessão concluída a usa. Sessão sem tarefa escolhida não marca.
- **Q6. Sono.** Recomendada: sem link. O "Z" é do pet, não do jogador.
- **Q7. Água.** Recomendada: fora da beta12. Contador de copos vira item próprio.
- **Q8. Tempo do aviso no topo.** Recomendada: o mesmo tempo dos balões atuais (8 s, `NOTICE_TOAST_MS`).
- **Q9. Caminhada sem meta batida.** Recomendada: mostrar só o contador de passos, sem cobrança.
