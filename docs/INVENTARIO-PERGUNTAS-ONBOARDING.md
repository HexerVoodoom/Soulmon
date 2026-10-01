# Inventário das perguntas do onboarding — 01/10/2026

Origem: checklist do dono `docs/AJUSTES-NAVEGACAO-2026-10-01.md`, itens **B1–B5**
("todas as perguntas existentes entram no onboarding, todas objetivas e
obrigatórias — Oráculo + perfil + metas"). Este arquivo é **registro** da
varredura feita antes de mexer: toda pergunta que o app faz à pessoa, de onde
ela vem, o que alimenta e o que foi decidido.

Referências `arquivo:linha` valem para o commit deste trabalho e **apodrecem**
— para reencontrar, use o símbolo citado ao lado (regra do `CLAUDE.md`).

## Ordem do onboarding (caminho não-upgrade) — revista em 01/10/2026

⚠️ **Segunda rodada do mesmo dia.** O dono pediu: *"vamos fazer todas as
perguntas que a gente tem, acho que são 20, todas elas obrigatórias, vai fazer
parte do onboarding"*. Isso **reverte a D3** abaixo: o teste longo deixou de
ser bifurcação opcional do caminho pago e virou parte obrigatória do
onboarding de TODO jogador. Ordem viva:

`IDENTITY_STEP` (conta: Google ou e-mail/senha + Termos + 18+) →
**`NAME_STEP`** (nome do jogador) → **as 6 do ritual** (`ORACLE_QUESTIONS`,
passos 6..11) → **os 20 itens do teste** (`SOUL_TEST_ITEMS`, passos 13..32) →
**`GOAL_STEP`** (áreas) → **`STRUGGLE_STEP`** (dificuldades) →
**`STRENGTH_STEP`** (forças) → **`STARTER_STEP`** (ponto de partida) →
`CHOICE_STEP` (grátis / próprio Soulmon) → criatura:
- **grátis:** reveal demo (leitura das 6, criatura em silhueta) → escolha do
  personagem (`DEMO_PICK`) → batismo (`REGISTER`) → fim;
- **pago:** nome completo, data, hora, cidade (passos 1..4) → geração → reveal
  (batismo) → fim.

Tudo objetivo e obrigatório, sem "pular" e sem "prefiro não dizer" (nome e
dados de nascimento continuam texto/data — D2). Cada pergunta tem a seta de
voltar (`BackArrow`) no topo esquerdo, **menos o nome** (atrás dele só há a
conta, que um "voltar" não deve sugerir desfazer). Voltar da 1ª do ritual leva
ao nome; do 1º item do teste, à 6ª do ritual; da 1ª meta, ao 20º item.

**Upgrade** (`mode='upgrade'`, compra no meio do jogo): continua nome completo
→ data → hora → cidade → as 6 → os 20 → geração → reveal, agora sem a
bifurcação (o teste é obrigatório ali também).

**Números dos passos NÃO mudaram** (o rascunho e a telemetria os guardam): só
a ordem de navegação. Por isso `onboardingStepCode`/`NEGATIVE_STEP_BASE`
(`utils/telemetry.ts` e `functions/api/metrics.js`) seguem iguais; o que muda
na leitura do funil é que os passos 6..11 e 13..32 passam a chegar com funil
`unknown` (vêm antes da escolha), e não mais `paid`/`demo`. O passo **12**
(`REFINE_OFFER`), que era a bifurcação, virou a tela de **tentar de novo**
quando a geração falha (e é onde cai um rascunho antigo parado na bifurcação).
A barra de progresso passou a medir a ORDEM do caminho (`sequencia` no
componente), não o número do passo.

### Retomada (fechar no meio)

Tudo o que já foi respondido fica no rascunho do portão (`utils/gateDraft.ts`,
mesma versão — campos novos opcionais): **o passo**, o nome, as 6 respostas,
os 20 itens, as metas (áreas/dificuldades/forças, que antes já iam) e os itens
desmarcados do ponto de partida. Ao reabrir, com o aceite já provado (conta
autenticada, ou build sem auth com passo gravado), o onboarding volta ao passo
gravado — nunca à frente de uma pergunta sem resposta (`passoDeRetomada`).
No grátis, depois da escolha, o passo gravado é a própria escolha. O ritual
pago (passos 1..4 e a tela 12) segue no rascunho dele (`oracleDraft.ts`), que
também carrega as 26 respostas.

**O tutorial antigo não reaparece**: `App.tsx` (`handleCompleteOnboarding`)
grava `TUTORIAL_COMPLETE` (quando o ponto de partida trouxe atividades) ANTES
de qualquer ida à nuvem e no mesmo lote em que o onboarding vira completo —
antes vinha depois do `cloudLoad`, e o tutorial piscava/ficava se a pessoa
fechasse ali ou se a adoção de save recarregasse a página. Régua:
`src/onboardingCompletion.contract.test.ts`.

**Perfil para a personalidade**: o fim do onboarding grava também
`gameState.onboardingProfile = { strengths, struggles }` (ids do catálogo, os
mesmos das perguntas), lido por `derivePersonality`. Dono do formato:
`onboardingProfileFrom` (`utils/catalogOnboarding.ts`).

### Ordem da primeira rodada (01/10/2026, manhã) — registro

`IDENTITY_STEP` → `NAME_STEP` → `GOAL_STEP` → `STRUGGLE_STEP` →
`STRENGTH_STEP` → `STARTER_STEP` → `CHOICE_STEP` → ritual (pago: nome completo,
data, hora, cidade; os dois: as 6 do Oráculo; pago: bifurcação + 20 itens) →
reveal (batismo) → fim. No grátis: as 6 → reveal demo → escolha do personagem →
batismo (`REGISTER`) → fim.

## Inventário

| # | Pergunta (EN) | Origem (símbolo · arquivo:linha) | Tipo antes → agora | Alimenta | Decisão |
|---|---|---|---|---|---|
| 1 | Termos + Privacidade (aceite) | `blocoLegal` · `SoulmonOnboarding.tsx:1069` | caixa | `consent` (prova LGPD/D-07) | Mantida, obrigatória. É conta, não pergunta. |
| 2 | "I am 18 or older" | `CheckRow maiorIdadeChecked` · `SoulmonOnboarding.tsx:1106` | caixa | trava 18+ (`podeAutenticar`) | Mantida, obrigatória. |
| 3 | **What should we call you?** | `NAME_STEP` · `SoulmonOnboarding.tsx:1694` | campo livre (era o "Your nickname" do cadastro final) | `userName` (identidade pública na Biblioteca/Torneio) | **B1: virou a 1ª pergunta**, sem legenda embaixo. Continua texto (nome não tem opção fechada). Obrigatória (≥2 letras). O exemplo inventado ficou no placeholder. |
| 4 | **What do you want to improve?** | `GOAL_STEP` · `SoulmonOnboarding.tsx:1717`; opções `LIFE_AREAS` (`types/activityCatalog.ts`) | era texto livre ("…in your life?") **e** duplicada no intersticial do catálogo (`CatalogOnboardingFlow.tsx` passo `areas`) | `soulGoal` (rótulos escolhidos, no idioma) → `BirthCard`, `DailyReportModal`, `MemoriesCard`, `goalToCategory`; `catalogChoice.areas` → `recommendStarterSet` | **B2: objetiva (1–3 das 9 áreas), obrigatória; B3: "I'd rather not say" removido.** As duas cópias viraram uma. |
| 5 | **What gets in your way the most?** | `STRUGGLE_STEP` (mesmo bloco); opções `STRUGGLE_LABEL` | texto livre + duplicada no catálogo (`struggles`) | `soulStruggle` (rótulos) → `MorningCheckIn`/`tinyOffer`, `GameTutorialFlow`; `catalogChoice.struggles` → recomendador | **B2/B3/B5: objetiva (1–3), obrigatória.** |
| 6 | **What's already a strength?** | `STRENGTH_STEP` (mesmo bloco); opções `STRENGTH_LABEL` | só existia no intersticial do catálogo (pulável) | `catalogChoice.strengths` → recomendador | **B4/B5: entrou no onboarding, objetiva (1–3), obrigatória.** |
| 7 | **Your starting point** | `STARTER_STEP` · `SoulmonOnboarding.tsx:1748`; `recommendStarterSet` (`utils/recommend.ts`) | só no intersticial (troca/manter, pulável) | `catalogChoice.itemIds` → atividades iniciais (`activitiesFromCatalogChoice`, em `App.tsx` `handleCompleteOnboarding`) | **B4: entrou no onboarding.** Tudo vem marcado; ≥1 mantido para avançar. |
| 8 | Grátis × próprio Soulmon | `CHOICE_STEP` · `SoulmonOnboarding.tsx:1648` | 2 botões | `flow` (demo/oracle), compra | Mantida. **B7:** rótulo "Get your own Soulmon — preço". |
| 9 | What is your full name? | passo `1` · `SoulmonOnboarding.tsx:1841` | campo livre (só pago) | numerologia (`buildSoulProfile`) | Mantida (dado, não opção). **Legenda explicativa removida** (B1 pede tirar copy embaixo de pergunta de nome). |
| 10 | When were you born? | passo `2` · `:1851` | data (só pago) | mapa astral + 18+ (`isAgeBlocked`) | Mantida; é dado, não cabe opção fechada. Legenda fica: declara o uso duplo da data (D-06 — coleta silenciosa é proibida). |
| 11 | At what time? | passo `3` · `:1869` | hora + "não sei" (só pago) | Ascendente/casas | Mantida. |
| 12 | Where were you born? | passo `4` · `:1903` (`CityPicker`) | busca em tabela (só pago) | lat/lon/fuso | Mantida (já é escolha fechada de tabela). |
| 13–18 | As 6 do Oráculo (`grupo`, `objetivo`, `pressao`, `energia`, `lugar`, `conflito`) | `ORACLE_QUESTIONS` · `utils/oracle.ts`; render no bloco `step >= QUIZ_START` | objetivas, obrigatórias (já eram) | eixos papel/alinhamento/elemento/reino → criatura (e a **classe**, que nunca aparece ao jogador) | **01/10 (2ª rodada): sobem para logo depois do nome, ANTES da escolha** — todo jogador responde. |
| 19 | ~~Want to sharpen the reading?~~ | `REFINE_OFFER` (passo 12) | bifurcação (só pago) | `refine` | **⚰️ Removida (01/10, 2ª rodada).** O número 12 virou a tela de "tentar de novo" da geração. `refine` segue no formato do `oracleDraft` só para ler rascunho antigo; é gravado sempre `true`. |
| 20–39 | Os 20 itens psicométricos | `items` · `utils/soulProfile/personality/questions.ts`; render no bloco `step >= DEEP_START` | objetivos (só quem aceitava refinar) | Big Five/HH/junguianos → `soulProfile` (no pago; no grátis ver pendências) | **01/10 (2ª rodada): obrigatórios para TODOS**, logo depois das 6, antes das metas. |
| 40 | Name your Soulmon | reveal `:2131` (pago) · `REGISTER` `:2295` (grátis) | campo pré-preenchido | `petName` | Mantida. **B11:** título solto "Name your Soulmon"/"Dê nome ao seu Soulmon", sem caixa e sem explicação. |
| — | Tonalidade (tint) | cadastro demo (removido) | 4 slots | `demoTint` (cosmético) | **B10: removida.** O campo segue no tipo/save antigo; ninguém envia. |

### Perguntas FORA do onboarding (vistas, não movidas)

| Pergunta | Onde | Por que não entrou |
|---|---|---|
| Objetivo em texto + áreas + sugestões de IA ("crie sua 1ª tarefa") | `GameTutorialFlow.tsx` (`goalText`, `selectedCats`) | Era a 3ª cópia da pergunta de objetivo. Com o ponto de partida entregando ≥1 atividade, o `App.tsx` marca o tutorial como feito e ele **não abre** para quem passou pelo onboarding novo. Continua existindo para quem chega sem atividade (rascunho antigo, catálogo sem sugestão). |
| Intersticial do catálogo (áreas/dificuldades/forças/starter) | `CatalogOnboardingFlow.tsx` + `utils/catalogOnboarding.ts` | Para jogador NOVO ele não aparece mais (o `App.tsx` grava `catalogOnboardingSeenAt` no nascimento). Continua servindo o jogador ANTIGO que nunca o viu — e é tela da frente da Home (C10–C12); não foi tocada aqui. |
| Humor do dia (5 carinhas) | `DailyReportModal.tsx` (`MOOD_OPTIONS`) e check-in | Pergunta DIÁRIA, opcional por regra (`CLAUDE.md`, "Check-in de humor": nunca alimenta pontuação). Não é de onboarding. |
| Foco do dia / hábitos de hoje | `MorningCheckIn.tsx` | Ritual diário, não de onboarding. |
| Criatura / escola / elemento do Renascimento | `RebirthModal.tsx` | Só depois do Ultra, por regra (texto do jogador no prompt só no Renascimento). |

## Decisões tomadas (conservadoras; dono pode reverter)

- **D1 — Uma pergunta de objetivo, não três.** "O que melhorar" existia como
  texto livre no onboarding, como chips no catálogo e como texto no tutorial.
  Ficou uma: objetiva, no onboarding. `soulGoal`/`soulStruggle` continuam no
  save como FRASE derivada dos rótulos escolhidos, para nenhum consumidor quebrar.
- **D2 — Nome do jogador é texto.** "Objetiva" não se aplica a nome; o mesmo
  vale para nome completo, data e hora do ritual pago (dados do mapa astral).
- **D3 — ⚰️ REVERTIDA pelo dono em 01/10/2026 (2ª rodada).** Dizia: "o teste
  longo (20 itens) continua OPCIONAL" (bifurcação sem volta, só no pago). O
  dono respondeu à pergunta aberta: todas as perguntas, obrigatórias, no
  onboarding de todos. ⚠️ O parágrafo do Oráculo no `CLAUDE.md` e a linha
  "🧭 O porquê do usuário" (que ainda dizem "bifurcação" e "puláveis") ficaram
  desatualizados — este trabalho não edita o `CLAUDE.md`; quem atualiza é o
  dono/lead. `docs/ORACULO.md` ganhou a lápide.
- **D4 — Ponto de partida mínimo 1.** O recomendador propõe 3–5; a pessoa pode
  desmarcar, mas não sai com zero (casa com C11). Catálogo sem sugestão não tranca.
- **D5 — Tutorial pulado quando já há atividade.** Ver tabela acima.
- **D6 — A legenda de privacidade do apelido saiu** (B1 pediu tirar copy), mas
  o exemplo inventado ficou no placeholder. Risco de nome real no diretório
  público volta a existir em parte — pergunta para o dono.

## Dados preservados

`userName`, `petName`, `soulGoal`, `soulStruggle`, `consent`, as 6 respostas
(`answers`) e os 20 itens (`testAnswers`) → mesma rota de antes até o oráculo e
o save. Novo (01/10, 2ª rodada): `onboardingProfile` (forças + o que atrapalha,
ids do catálogo) no save, para `derivePersonality`. A classe do Oráculo continua só interna (`classeNuncaVisivel.contract.test.tsx`).
Novo: `catalogChoice` (`areas`, `struggles`, `strengths`, `itemIds`) → atividades
do catálogo + `catalogOnboardingSeenAt`.

## Pendências (01/10/2026, 2ª rodada)

- **O grátis responde os 20 itens, mas a leitura demo usa só as 6** (o reveal
  demo é a leitura LEGADA, sem mapa astral). As respostas não vão para o save
  do demo; quem compra depois (`mode='upgrade'`) responde as 26 de novo.
  Reaproveitar exigiria guardar `answers`/`testAnswers` no save do demo —
  decisão de dado pessoal (a pessoa respondeu um teste de personalidade) que
  fica para o dono.
- **`CLAUDE.md`** (Oráculo e "🧭 O porquê") desatualizado — ver D3.
- **Manual** (`docs/manual/02`, `03`, `06-REFERENCIA/components.md`) e os docs
  de design/guia ainda descrevem a bifurcação; é trabalho do `/manter-docs`.
- **Duração**: o onboarding passou de ~10 para ~36 telas antes da criatura.
  Sem telemetria de produção não há como medir o abandono; os passos 6..32
  chegam agora com funil `unknown` e dão a curva quando houver usuários.
