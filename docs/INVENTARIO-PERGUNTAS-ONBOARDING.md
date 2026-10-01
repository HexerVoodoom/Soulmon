# Inventário das perguntas do onboarding — 01/10/2026

Origem: checklist do dono `docs/AJUSTES-NAVEGACAO-2026-10-01.md`, itens **B1–B5**
("todas as perguntas existentes entram no onboarding, todas objetivas e
obrigatórias — Oráculo + perfil + metas"). Este arquivo é **registro** da
varredura feita antes de mexer: toda pergunta que o app faz à pessoa, de onde
ela vem, o que alimenta e o que foi decidido.

Referências `arquivo:linha` valem para o commit deste trabalho e **apodrecem**
— para reencontrar, use o símbolo citado ao lado (regra do `CLAUDE.md`).

## Ordem nova do onboarding (caminho não-upgrade)

`IDENTITY_STEP` (conta: Google ou e-mail/senha + Termos + 18+) →
**`NAME_STEP`** (nome do jogador) → **`GOAL_STEP`** (áreas) →
**`STRUGGLE_STEP`** (dificuldades) → **`STRENGTH_STEP`** (forças) →
**`STARTER_STEP`** (ponto de partida) → `CHOICE_STEP` (grátis / próprio Soulmon) →
ritual (pago: nome completo, data, hora, cidade; os dois: as 6 do Oráculo; pago:
bifurcação + 20 itens) → reveal (batismo) → fim. No grátis: as 6 → reveal demo →
escolha do personagem → batismo (`REGISTER`) → fim.

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
| 13–18 | As 6 do Oráculo (`grupo`, `objetivo`, `pressao`, `energia`, `lugar`, `conflito`) | `ORACLE_QUESTIONS` · `utils/oracle.ts:829`; render `:1918` | objetivas, obrigatórias (já eram) | eixos papel/alinhamento/elemento/reino → criatura (e a **classe**, que nunca aparece ao jogador) | Mantidas como estão, nos dois caminhos. |
| 19 | Want to sharpen the reading? | `REFINE_OFFER` · `:1965` | bifurcação (só pago) | `refine` | **Mantida opcional** — ver decisão D3. |
| 20–39 | Os 20 itens psicométricos | `items` · `utils/soulProfile/personality/questions.ts:337`; render `:2012` | objetivos (só quem aceita refinar) | Big Five/HH/junguianos → `soulProfile` | Mantidos atrás da bifurcação (D3). |
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
- **D3 — O teste longo (20 itens) continua OPCIONAL.** O `CLAUDE.md` (Oráculo)
  registra a bifurcação como decisão de produto declarada na tela como sem
  volta, e só existe no caminho pago. Torná-lo obrigatório é mudança de regra
  de produto — pergunta aberta para o dono.
- **D4 — Ponto de partida mínimo 1.** O recomendador propõe 3–5; a pessoa pode
  desmarcar, mas não sai com zero (casa com C11). Catálogo sem sugestão não tranca.
- **D5 — Tutorial pulado quando já há atividade.** Ver tabela acima.
- **D6 — A legenda de privacidade do apelido saiu** (B1 pediu tirar copy), mas
  o exemplo inventado ficou no placeholder. Risco de nome real no diretório
  público volta a existir em parte — pergunta para o dono.

## Dados preservados

`userName`, `petName`, `soulGoal`, `soulStruggle`, `consent`, as 6 respostas
(`answers`) e os 20 itens (`testAnswers`) → mesma rota de antes até o oráculo e
o save. A classe do Oráculo continua só interna (`classeNuncaVisivel.contract.test.tsx`).
Novo: `catalogChoice` (`areas`, `struggles`, `strengths`, `itemIds`) → atividades
do catálogo + `catalogOnboardingSeenAt`.
