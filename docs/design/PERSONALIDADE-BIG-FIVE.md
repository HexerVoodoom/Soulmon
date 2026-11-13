# Personalidade do Soulmon a partir do Big Five do teste (beta12, B1/B2)

Decisões do dono (11/11/2026, `docs/BACKLOG-BETA12.md` §F, que prevalece): o modelo é o **Big Five** (5 dimensões) e o complemento é **por dimensão**; jogador sem teste = Soulmon **neutro**; COMPLEMENTAR é o padrão e SIMILAR é opção nas Configurações; a derivação por forças/dificuldades (G7, `PERSONALIDADE-DERIVADA.md`) **convive**: o teste decide o caráter, forças/dificuldades decidem o veto; em SIMILAR o veto de vulnerabilidade prevalece.

Código: `src/utils/soulmonCharacter.ts` (função pura), falas em `src/utils/petVoice.ts`, chat em `functions/api/chat.js`, escolha em Configurações. Testes: `soulmonCharacter.test.ts`, `petVoice.carater.test.ts`, `personality.test.ts`, `functions/api/chat.personalidade.test.js`.

## O que o jogador vê

Nada do tipo. O teste do onboarding não é um teste de personalidade para ele (não é validado; `SettingsPage` já avisa). O resultado só aparece como JEITO de falar (regra do Oráculo: "nenhum cálculo novo sem manifestação"). O rótulo da Configuração ("Jeito do Soulmon": Complementar / Igual ao meu) não diz o tipo de ninguém. Nenhuma tela, número, rótulo de tipo nem nome de arquétipo chega ao jogador.

## 1. De onde vem o número

`scoreProfile(answers)` (`soulProfile/personality/scoring.ts`) devolve `traitPoints` 0–100 para as 5 dimensões do Big Five (a 6ª, Honestidade-Humildade, e os eixos Jung NÃO entram no complemento). O onboarding grava as 20 respostas em `GameState.soulTestAnswers`. O App chama `loadBigFive` (import dinâmico: o banco de perguntas não vai para o chunk de entrada) e só considera o teste com **≥ 10 respostas**; abaixo disso, ou sem respostas, o Soulmon é **neutro**.

Cada dimensão é lida em 3 polos, com zona morta de 10 pontos: `≤ 40` baixo, `≥ 60` alto, entre os dois "meio" (não vota).

## 2. Os tipos a que o teste se aproxima (lado do jogador) e o complemento

Não há "16 tipos". Há 5 dimensões × 2 polos = **10 tendências**; um jogador real é a soma delas (em geral 2–3 se destacam). Cada tendência tem o seu complemento, calculado **por dimensão**:

| Dimensão | Jogador ALTO: características | Soulmon complementar (polo) | Jogador BAIXO: características | Soulmon complementar (polo) |
|---|---|---|---|---|
| Abertura (O) | imaginativo, curioso, gosta do novo | com pé no chão: concreto, prático (baixo) | convencional, prático, gosta do conhecido | curioso: puxa novidade pequena (alto) |
| Conscienciosidade (C) | organizado, metódico, planeja | solto, brincalhão com o plano (baixo) | espontâneo, flexível, improvisa | guia de passos pequenos e claros (alto) |
| Extroversão (E) | sociável, enérgico, expressivo | calmo, quieto, confortável no silêncio (baixo) | reservado, reflexivo, poupa energia | animado, expressivo, puxa conversa (alto) |
| Amabilidade (A) | cooperativo, gentil, evita conflito | direto: franco, opinião honesta, sem açúcar (baixo) | franco, cético, competitivo | acolhedor: suave, perto (alto) |
| Neuroticismo (N) | sensível ao estresse, preocupa-se | sereno e firme (baixo) | estável, calmo sob pressão | **neutro** (ver abaixo) |

Regra do N (o único com exceção): o Soulmon **nunca é mais neurótico que o neutro**. Jogador estável recebe complemento neutro (não fabricamos um bichinho ansioso); em SIMILAR, N alto do jogador vira, no máximo, neutro.

**COMPLEMENTAR** (padrão) = o espelho de cada dimensão (`100 − valor`, com a exceção do N). **SIMILAR** = o mesmo valor do jogador (`valor`, com o teto do N). O modo mora no save em `soulmonVoiceMode` (opcional; ausente = complementar).

## 3. Do traço à voz (os arquétipos)

O vetor do Soulmon (5 valores) vota em arquétipos, com peso = distância do meio (`|valor − 50| / 50`):

| Dimensão / polo do Soulmon | Votos |
|---|---|
| Abertura alta | curioso 2 |
| Abertura baixa | direto 1, calmo 1 |
| Conscienciosidade alta | mentor 2, direto 1 |
| Conscienciosidade baixa | brincalhão 2 |
| Extroversão alta | animado 2, brincalhão 1 |
| Extroversão baixa | calmo 2 |
| Amabilidade alta | acolhedor 2 |
| Amabilidade baixa | direto 2 |
| Neuroticismo alto | acolhedor 2 |
| Neuroticismo baixo | calmo 2 |

Vence o arquétipo de maior soma; empate vai da voz mais segura à mais intensa (acolhedor, calmo, curioso, brincalhão, direto, mentor, animado). Tudo no meio = **neutro** (as falas padrão).

Os 7 arquétipos do Soulmon: **acolhedor** (perto, sente primeiro), **brincalhão** (leve, piada pequena), **calmo** (frases curtas, sem pressa de ritmo), **animado** (energia quente, reação grande), **direto** (diz às claras, pergunta de verdade, sem pressão), **curioso** (se pergunta as coisas), **mentor** (um passo de cada vez, prático). Os NPCs usam esses 7 mais 3 só deles: **protetor**, **irônico**, **enigmático** (`docs/beta12/TABELA-NPCS.md`).

## 4. O veto (forças e dificuldades)

`personality.ts` continua dono da **motivação** e do **veto**. Quem declarou **ansiedade, perfeccionismo ou cansaço** (`VULNERABLE_STRUGGLES`) só recebe vozes seguras: acolhedor, calmo, curioso, brincalhão. `direto`, `animado` e `mentor` (que empurram) ficam de fora, **em COMPLEMENTAR e em SIMILAR**. O que vai ao chat também é suavizado (nada de conscienciosidade ou extroversão altas, nada de amabilidade baixa). Sem voz segura com voto, a voz é a mais acolhedora. As três travas de `personality.ts` (veto de `challenging`, `challenging` só com lastro, fallback `casual` + `supportive`) e os testes delas não mudaram.

## 5. Onde aparece

- **Falas padrão:** `petVoiceLine` usa as variantes do arquétipo nos 5 gestos mais frequentes (fome, ócio, tarefa feita, carinho, "tô bem"); os demais gestos seguem genéricos. Mesma régua do arquivo: nenhuma frase cobra; e, **novo**, nada de "no seu tempo / se quiser / quando estiver pronto". O jeito é humano e direto ("tô com fome, tem comida aí?").
- **Chat:** `chatSettingsFor` manda `aiSettings.character = { archetype, traits }` e ajusta o `tone`; `chat.js` aceita só ids de uma lista fechada e escreve um bloco "Character" no prompt (o modelo é proibido de nomear o tipo).
- **Limite:** 20 mensagens/dia no plano grátis; passado o limite o servidor responde **200** com uma fala padrão do Soulmon (nunca erro).

## 6. Fora do escopo da beta12

Widget (`pet_line` da ponte nativa) segue genérico até o próximo APK; mais gestos de `petVoice` com variante ficam para lote seguinte (decisão §F 6: priorizar falas padrão e API).
