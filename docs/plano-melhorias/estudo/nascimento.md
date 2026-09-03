# Estudo pré-Mobbin × Nascimento — corpus contra o código (WP1.1–1.8)

Dono: `soulmon-guarda-nascimento`. Data: **03/09/2026**.
Ledger: `docs/plano-melhorias/ledger/nascimento.md`. Anexo factual: `../A-onboarding.md`.
O dossiê Mobbin já foi destrinchado em `../mobbin/nascimento.md` — **este arquivo não o
repete**; cobre só o material anterior a ele.

**Regra deste arquivo:** toda afirmação sobre o código foi confirmada por `grep`/`awk`/`sed`
em 03/09/2026. A referência canônica é `arquivo` + SÍMBOLO, nunca número de linha. Onde não
achei, está escrito `NÃO ENCONTRADO`; onde não procurei, `não verificado`.

## Fontes lidas (inteiras, salvo indicação)

- `docs/guia-experiencia/05-onboarding.md` — relatório 05 (F1–F7, rec. 1–18)
- `docs/guia-experiencia/08-transcricoes-notebooklm.md` — blocos **A3** (paradoxo do
  onboarding: NN/g × Tim Gabe × Airtable), **A4** (como cada fonte MEDE o aha) e **B4**
  (monster taming: o que faz a criatura ser "minha")
- `docs/guia-experiencia/04-monster-taming.md` — §1 (Pokémon starter, Monster Rancher),
  §2 (avaliação do Oráculo, riscos 1–2) e §3 (rec. 3, 4, 14, 15)
- `docs/GUIA-EXPERIENCIA.md` — **B.2** (Onboarding, O-1…O-13 + arbitragem do paywall),
  **B.3** (Primeiros 7 dias, S-1…S-7, só o que toca o D0/D1), **C.3** (conflitos 1 e 6) e
  **I** (I.1.3, I.2, I.3.2–I.3.4, I.4)
- `docs/guia-experiencia/01-youtube-mobbin-timgabe.md` — lições 1–4, 15, 21, 23 e a síntese §3
- `docs/plano-melhorias/A-onboarding.md` (mapeamento factual, já feito)

Código lido/grepado: `src/components/SoulmonOnboarding.tsx`, `GameTutorialFlow.tsx`,
`FirstTaskCompletedPopup.tsx`, `WelcomePromptModal.tsx`, `SoulTestItem.tsx`,
`src/utils/oracle.ts`, `oracleDraft.ts`, `telemetry.ts`, `rituals.ts`, `restWindow.ts`,
`src/App.tsx` (trechos), `functions/api/_pushCopy.js`, `chat.js`, `metrics.js`,
`workers/push-scheduler.js`.

## 0. Parecer: qual das três filosofias (A3) o Soulmon segue

As fontes da A3 **não concordam**, e o Soulmon não segue uma só — segue uma por fase:

- **No nascimento, Tim Gabe (fricção positiva).** O ritual é 5 formulários + 6 perguntas +
  bifurcação de 20 itens: custo afundado que personaliza de verdade, porque a criatura
  **não existe sem esse input** (`generateOracle` em `oracle.ts` consome `answers`,
  `birthDate`, `birthCity`). NN/g ("onboarding zero") não se aplica a um produto cujo valor
  É o resultado das perguntas. **Mas** o que Gabe usa para fechar o ciclo — o paywall rígido
  no fim — é exatamente o que a tese proíbe (C.3 #1). O Soulmon fica com a metade da
  fricção e recusa a metade do paywall; isso é deliberado, não meio-termo.
- **No D0, Airtable (assistente guiado) com prazo de validade.** `GameTutorialFlow` tem
  **uma** página de conceito (`PAGES` com 1 item; as 5 antigas viraram
  `SHOP_AND_CURRENCY_PRIMER`) e um passo obrigatório que **constrói a estrutura pelo
  usuário** (`TASK_STEP`: categoria + `suggestTasks`/`FALLBACK_BY_CATEGORY`, ≥1
  atividade). É o wizard da Isford em miniatura: o app monta o primeiro hábito em vez de
  largar a pessoa numa lista vazia.
- **Do D1 em diante, NN/g.** Não há tooltip, tour nem dica persistente; a interface (pet
  falando, lista) tem que bastar.

O que **nenhuma** das três autoriza é paywall no clímax — e o Soulmon já não faz (a
compra é decidida na INTRO, `track('purchase')` antes do ritual; o bloco `step === REVEAL`
não tem preço nem `UnlockNudge`). Defendo isso contra invasão: o value moment é o **1º dia
perfeito**, domínio do `soulmon-guarda-sustento`.

---

## 1. Três colunas — cada afirmação da fonte, uma linha

Legenda: **já faz** · **lacuna** · **conflita com a tese** · **não se aplica** ·
**já coberto por WP (qual)** · *(parcial)* quando metade de cada.

### 1.1 Relatório 05 — Onboarding (fricções F1–F7)

| O que a fonte diz (fonte + bloco) | O que o Soulmon faz hoje (arquivo + SÍMBOLO) | Veredito |
|---|---|---|
| **F1** "O reveal não revela": o clímax entrega tipografia, não criatura (05 §2) | `SoulmonOnboarding.tsx`, bloco `step === REVEAL`: `<h1>{result.creature.baseName}</h1>` + `essence` + `L(result.creature.bio)` + botão. `awk '/step === REVEAL/,/step === REGISTER/' \| grep -c '<img'` → **0** (reconfirmado 03/09). Única `<img>` da região é `ravenMascot` em `GENERATING`. | **já coberto por WP1.1** |
| **F2** O `CONSENT_STEP` (parede de texto + checkbox + idade no demo) cai entre a motivação declarada e a recompensa (05 §2) | `next()`: `GOAL_STEP → STRUGGLE_STEP → CONSENT_STEP → (DEMO_PICK \| 1)`. Bloco `step === CONSENT_STEP` tem **6 `<p>`** antes/ao redor da caixa (`grep -c '<p'` no trecho → 6). Ordem confirmada. | **lacuna** (ordem é decisão de compliance — o carimbo `buildConsentRecord()` precisa vir antes de qualquer dado do ritual; o que dá para mexer é o VOLUME de texto → C-N5) |
| **F3** Demo sem posse: 3 pré-prontos, thumb de 52 px, nada escolhido pelo jogador além do nome (05 §2) | Bloco `step === DEMO_PICK`: `getDemoSprite(c.id, 'rookie')` com `width: 52`; `track('demo_pick')`. `grep -i 'palette\|paleta\|variant'` em `SoulmonOnboarding.tsx` → **NÃO ENCONTRADO**. Batismo pré-preenchido existe (`petNameEdit ?? registerDisplayName`). | **lacuna** → C-N4 |
| **F4** O quiz longo está bem desenhado mas subvendido: "afinam quem ele vai ser" é abstrato e não há feedback incremental (05 §2) | Bloco `step === REFINE_OFFER`: copy literal *"…elas afinam quem seu Soulmon vai ser."* (grep `afinam` → 1). Nas 6 perguntas o `hint` é só `Pergunta N de 6` (`StepShell hint=`); nos 20 itens, `itemHint()` em `SoulTestItem.tsx` = contador + instrução do tipo. Nenhuma leitura parcial (`grep -i 'metade\|halfway'` → NÃO ENCONTRADO). | **lacuna** → C-N2 (reframe) e C-N3 (feedback) |
| **F5** Nenhum permission priming de push amarrado a valor (05 §2) | Push só via `WelcomePromptModal` half `'notif'` (título `Ativar notificações?`, sem prévia) gateado por `notificationsUnlocked={jaConcluiuAlgo}` (`App.tsx`). O gate está certo; o **primer** não existe. | **já coberto por WP1.5** |
| **F6** O link mágico interrompe o clímax sem preservar a emoção (05 §2) | Copy no `REGISTER`: *"Mandamos um link de acesso para … Abra o link NESTE aparelho para continuar."* Sem sprite, sem fala do pet (`grep -i 'esperando\|waiting'` → NÃO ENCONTRADO). | **lacuna** → C-N6 (depende do WP1.1) |
| **F7** Sem preview de valor: nada mostra o app funcionando antes do tutorial (05 §2) | `INTRO` = `ravenMascot` 72 px + "Toda alma carrega uma criatura…". Nenhum sprite de criatura, nenhuma animação de barra. | **lacuna** — registrada sem candidata: um teaser "veja o pet andando" antes do CONSENT exigiria arte pronta que o demo tem e o Oráculo não; ver C-N4 para a versão barata (demo) |

### 1.2 Relatório 05 — O que está certo (§3) e recomendações (§4)

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| E-mail opcional no grátis, pedido só quando há progresso a proteger (05 §3) | Comentário e regra em `SoulmonOnboarding.tsx`: *"No caminho grátis o e-mail é OPCIONAL"*; `ProtectProgressModal.tsx` existe para o pedido tardio. | **já faz** |
| Skips honestos: porquê, hora, criatura favorita (05 §3) | `GOAL_STEP`/`STRUGGLE_STEP` botão *"Prefiro não responder agora"*; `timeUnknown` libera o passo 3 (`canAdvance`: `timeUnknown \|\| !!birthTime`); `skipFavorite` no passo 5. | **já faz** — linha vermelha deste guarda |
| Barra de progresso desconta o bloco de 20 e inclui o tutorial (05 §3) | `shrink()` subtrai `deepBlock` quando `refine === false`; `progress` divide por `shrink(REGISTER + 1)` (comentário: "o denominador inclui o tutorial"). | **já faz** |
| Auto-avanço de 180 ms; voltar do teste longo devolve a bifurcação (05 §3) | `back()`: `if (step === DEEP_START) { setRefine(null); setStep(REFINE_OFFER) }`. | **já faz** |
| Telemetria separada por demo/pago (05 §3) | `TELEMETRY_FUNNEL {unknown, demo, paid}` em `telemetry.ts`; `track('onboarding_step', { step: code, funnel })` no `useEffect` do onboarding. | **já faz** |
| Geração com fallback que devolve à bifurcação (05 §3) | Bloco `REFINE_OFFER` mostra `role="alert"` *"Não foi possível revelar sua criatura agora. Escolha de novo…"*. | **já faz** |
| **Rec. 1** Sprite no REVEAL (ou placeholder da linha) | ver F1 | **já coberto por WP1.1** |
| **Rec. 2** Reveal cerimonial (escurecer → silhueta → flash), `prefers-reduced-motion` | Nenhuma animação no bloco REVEAL; `usePrefersReducedMotion` existe em `ui/Viewport.tsx` (ledger). | **já coberto por WP1.2** |
| **Rec. 3** Demo com micro-posse (1 variação de paleta) | ver F3 | **lacuna** → C-N4 |
| **Rec. 4** Teaser de valor entre STRUGGLE e CONSENT | ver F7 | **lacuna** (sem candidata própria; ver F7) |
| **Rec. 5** Feedback incremental do corvo a cada resposta das 6 | `hint` = contador. `grep -i 'vejo \|hmm'` → NÃO ENCONTRADO. | **lacuna** → C-N3, **com trava**: o feedback só pode falar de ORIGEM (elemento/reino), nunca de comportamento — senão viola a régua "de onde veio, não como se comporta" |
| **Rec. 6** Reframe da bifurcação em ganho concreto + custo real ("~2 min"), mantendo a irreversibilidade | Copy atual não diz o que muda nem quanto custa. A irreversibilidade está declarada (comentário `chooseRefine`: "Escolher aqui é definitivo"). | **lacuna** → C-N2 |
| **Rec. 7** Marcos a cada 5 itens do teste longo | `itemHint()` só conta. NÃO ENCONTRADO. | **lacuna** → C-N3 (mesma peça) |
| **Rec. 8** `soulGoal` ecoado no reveal | `grep soulGoal SoulmonOnboarding.tsx` → só estado/`finish()`/rascunho; nada no bloco REVEAL. | **já coberto por WP1.2** |
| **Rec. 9** Ecoar a resposta do GOAL_STEP na hora ("Anotado…") | `grep -i 'anotado\|vai lembrar\|noted'` → NÃO ENCONTRADO. `next()` só troca o passo. | **lacuna** → C-N1 |
| **Rec. 10** Priming de push no primeiro dia, nunca no fluxo de nascimento | Gate `jaConcluiuAlgo` garante "nunca no nascimento". Primer contextual não existe. | **já coberto por WP1.5** |
| **Rec. 11** Se pedir no onboarding, só pós-reveal e em nome do pet | Não pede no onboarding. As pushes reais JÁ são na voz do pet: `pushCopy()` em `_pushCopy.js` (`${name} pensou em você`, `${name} passou pra dizer oi`). | **já faz** (voz) · o "quando" é WP1.5 |
| **Rec. 12** Tela de link mágico com o pet presente | ver F6 | **lacuna** → C-N6 |
| **Rec. 13** REGISTER em 2 momentos (batismo no reveal; nickname/e-mail depois) | `REGISTER` = 3 campos (`onb-petname`, `onb-nick` obrigatório ≥2, `onb-email`). O REVEAL tem só o botão `Continuar`. `ProtectProgressModal` já cobre o e-mail tardio no demo. | **lacuna** → C-N7 |
| **Rec. 14** Intro com prova (sprites reais rodando) | `INTRO` = só `ravenMascot`. | **lacuna** menor, P3 — sem candidata (arte de "outras almas" é conteúdo de terceiros por definição; conflita com "nada de terceiro no bundle" se vier de usuários) |
| **Rec. 15** Consent enxuto | 6 `<p>` no bloco. | **lacuna** → C-N5 |
| **Rec. 16** Medir e cortar pelo funil (alvos: demo <60 s; oracle <4 min) | `onboarding_step` emitido, mas `metrics.js` declara: *"não existe coorte … impossível retenção D1/D7/D30"*. Sem leitura de tempo entre passos. | **já coberto por WP (D1, guarda-medição)** — o alvo em segundos é aceite deste domínio quando D1 existir |
| **Rec. 17** "Faltam 2 passinhos e ele acorda" no reveal | `grep -i 'passinho\|acorda\|wakes'` → NÃO ENCONTRADO. A barra já inclui o tutorial no denominador. | **lacuna** — entra na ponte do WP1.2 (Noom "Next steps"), não vale WP próprio |
| **Rec. 18** Hora/cidade com default de 1 toque (cidade recente / geolocalização) | "Não sei a hora" existe (`timeUnknown`). `CityPicker.tsx`: `grep -i 'geolocation\|recent'` → NÃO ENCONTRADO. | **conflita com a tese** na metade da geolocalização: seria um prompt de permissão do sistema ANTES de o app entregar algo — a mesma proibição do push. "Cidade recente" não se aplica (é a 1ª vez). **não se aplica** |

### 1.3 Transcrição A3 — o paradoxo do onboarding (NN/g × Tim Gabe × Airtable)

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **NN/g:** a maioria dos apps não precisa de onboarding; instrução é curativo para design ruim; ponha o usuário direto na interface (A3 §1) | Tutorial reduzido a **1 página** de conceito (`PAGES`, `GameTutorialFlow.tsx`, comentário: "A única tela de conceito que sobrou"). Sem tour, sem tooltip. | **já faz** (na parte pós-nascimento) · **não se aplica** ao ritual (ver §0) |
| **NN/g:** onboarding breve; fluxos promocionais/longos serão pulados (A3 §2) | O ritual é 15–35 interações e é o produto. Contradiz NN/g de propósito. | **conflita com a fonte, não com a tese** — decisão registrada no §0 |
| **Tim Gabe:** onboardings longos "conquistam" a personalização — o usuário aceita responder porque a tela inicial sai personalizada (A3 §2) | A criatura sai das respostas (`generateOracle`), mas o REVEAL **não mostra** que saiu delas (sem sprite, sem termos marcados, sem `soulGoal`). A personalização existe e não é percebida. | **já coberto por WP1.1 + WP1.2** — é a condição de Gabe para a fricção valer |
| **Tim Gabe:** o quiz longo qualifica e cria custo afundado que faz o **paywall rígido** converter no fim (A3 §2) | Compra é decidida na INTRO (`Quero o completo — ${FULL_UNLOCK_PRICE_LABEL}` → `track('purchase')`), **antes** do ritual. Bloco REVEAL sem preço. | **conflita com a tese** (C.3 #1: value moment = 1º dia perfeito). O Soulmon usa a fricção de Gabe e recusa o fechamento de Gabe — registrado |
| **Airtable:** jogar o iniciante na interface aberta causa sobrecarga; um wizard que **monta a estrutura** pelo usuário deu +20 % de ativação (A3 §1, §3) | `TASK_STEP` do tutorial: categorias + `suggestTasks()` + `FALLBACK_BY_CATEGORY` ("Rabiscar por 2 minutos") + ≥1 atividade obrigatória → `commitHabitCreate(..., TELEMETRY_CREATE_PATH.tutorial)`. O app monta o 1º hábito. | **já faz** (estrutura) · **já coberto por WP1.4** (torná-la derivada do `soulGoal`, que é o "desenhar em tempo real" da Isford) |
| **Airtable:** tooltips foram aposentados por ineficazes (A3 §1) | Nenhum tooltip no D0 (NÃO ENCONTRADO em `GameTutorialFlow.tsx`). | **já faz** |
| **Gabe/Granola:** valor tangível o mais rápido possível, 2 telas (A3 §3) | Não se aplica ao ritual (o valor É a leitura). Aplica-se ao D0: da saída do REGISTER ao 1º hábito são `PAGES.length + 1` = 2 telas. | **já faz** no D0 · **não se aplica** ao ritual |

### 1.4 Transcrição A4 — como MEDIR o aha

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **YC/David Lee:** aha = ação de valor real, medido pelo **achatamento da curva de retenção de coorte** (A4 §1) | `first_task_done` existe e é `ONCE_EVER` (`telemetry.ts`); `day_active`/`week_active` existem. `metrics.js` diz textualmente que **coorte é impossível** com o desenho atual ("não existe coorte … retenção D1/D7/D30 exige saber…"). | **lacuna** — domínio do guarda-medição (D1). O que ESTE domínio deve garantir: a ação de valor é `first_task_done` (não `install`, não abrir o app) — já é assim |
| **Tim Gabe:** drop-off tela a tela × conversão no paywall (A4 §3) | `onboarding_step` por mudança de `step` (`onboardingStepCode`, `NEGATIVE_STEP_BASE`). O lado "conversão no paywall" não existe porque não há paywall no reveal. | **já faz** (a metade que a tese permite) |
| **Tim Gabe:** tempo até o valor (A4 §3) | Nenhum evento leva timestamp relativo ao `install`; `sprite_wait_ms` não existe (`grep reveal_seen src` fora de `telemetry.ts` → **NÃO ENCONTRADO** — o evento está **declarado no schema** com `has_sprite`, mas **nunca emitido**). | **já coberto por WP1.1** (aceite: emitir `reveal_seen`) |
| **Tim Gabe:** "intelligence trap" — comparar usuário de 6 meses vs 10 dias (A4 §3) | Não se aplica: a personalização do Soulmon é de NASCIMENTO (a criatura), não acumulada por uso. | **não se aplica** |
| **Airtable:** métrica de ativação com barra alta (5–15 % dos iniciais), decomposta em lever metrics (A4 §2) | `week_active.goal_days` em `metrics.js` é a norte. Barra alta ≈ 1º dia perfeito. Domínio do sustento/medição. | **não se aplica** a este domínio |
| **NN/g:** teste qualitativo de laboratório SEM onboarding; medir aprendibilidade/erros/satisfação (A4 §4) | Nenhum QA com usuário real (C.4 declara a lacuna). | **lacuna** — fora do código; registrada, sem candidata (depende do dono) |

### 1.5 Transcrição B4 — o que faz a criatura ser "minha"

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **frogMak 1:** criatura é ESPÉCIE, não personagem; traços humanos fechados impedem o jogador de projetar a própria história | `creature.bio` = `richConceptPt` (`oracle.ts`): *"{classe} da linhagem {identidade}, marcado por algo {sabor}"* — **origem**, certo. Mas `stages[].description` concatena `behaviorSentence` (← `ROLE_INFO`/`ALIGNMENT_INFO.profile`) em rookie/champion/perfeito, exibido na `PetPage`. | **conflita com a tese** *(parcial)* — a bio do reveal cumpre; a descrição de estágio **não**. Régua (c) do WP1.2 já aponta para lá; recomendo que o WP1.2 inclua no aceite `grep -c behaviorSentence src/utils/oracle.ts` → 0 nas descrições de estágio (mover o perfil de papel/alinhamento para a `OraclePage`, que é ferramenta) |
| **frogMak 2:** cuidado ativo (carinho, comida, minijogos) torna a criatura menos descartável | `careRules.ts`/`careUpdaters.ts`; `FirstTaskCompletedPopup.tsx` fecha o 1º loop ("Seu Soulmon cresceu um pouquinho agora"). | **já faz** (domínio do vínculo; aqui só o D0) |
| **frogMak 3:** o starter é o ponto de apego por acompanhar as primeiras horas | Um único pet, gerado da pessoa; `App.tsx` não tem slot de segundo pet. Regra "nunca segundo pet" (rel. 04 rec. 13). | **já faz** por construção |
| **frogMak 4:** evolução em estágios = orgulho parental | `MANUAL_EVOLUTION`, cerimônia. Fora do D0. | **já faz** (domínio da evolução) |
| **Bryson Ultra 5:** variante rara cosmética (shiny) cria exclusividade | `grep -i 'iridesc\|shiny'` em `oracle.ts` → só um adjetivo de prompt ("a shiny blue hide"), nenhuma mecânica. `salt = seed ?? Math.random()` em `generateOracle`. | **lacuna** — sem candidata deste guarda: custa geração de sprite (paleta alternativa = segunda imagem) e é decisão de custo do dono; compatível com a tese (cosmético, zero poder) |
| **Gym Leader Ed 6:** o tamer não tem poderes; a agência é da criatura | Não há avatar do jogador; masmorra/torneio são do pet. | **já faz** |
| **Hartman/Duolingo 7:** personagens HUMANOS diversos espelham o usuário | Criatura, não humano. **Desacordo entre fontes:** Hartman quer rosto humano com defeitos reais; frogMak quer espécie neutra. O Soulmon fica com frogMak — o espelhamento vem da LEITURA (a criatura nasce da pessoa), não da aparência humana. | **não se aplica** (desacordo registrado) |
| **Hartman 8:** elenco fixo e recorrente por toda a UI | Um pet em toda a UI + o corvo (`ravenMascot`) como mascote fixo do Oráculo. | **já faz** |
| **Hartman 9:** silhuetas geométricas comunicam personalidade | Prompts em `composeSpritePrompts`; não verificável por grep se a forma segue o papel. | **não verificado** |
| **Hartman 10:** nome universal, pronunciável, idêntico entre idiomas | `rookieName = baseName` (um só nome nos dois idiomas — `<h1>{result.creature.baseName}</h1>` sem `L()`); sufixo fixo proibido por teste (CLAUDE.md). Nenhuma régua de pronúncia. | **já faz** *(parcial)* — universal sim; "pronunciável" não é testado. Lacuna menor sem candidata |

### 1.6 Relatório 04 — Monster taming (criação, reveal, vínculo inicial)

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **Pokémon starter:** o Oráculo vai além — a criatura é DERIVADA de quem você é, "fantasia mais forte que a do starter, se a leitura parecer verdadeira" (04 §1) | A derivação existe (`soulProfile/pipeline.ts`). "Parecer verdadeira" depende do reveal mostrar a ligação. | **já coberto por WP1.2** |
| **Monster Rancher:** o que vendia era "esse veio de MIM"; condição: explicabilidade parcial (04 §1) | A explicação vive na `OraclePage` (sem entrada na navegação); o REVEAL não diz de qual resposta veio nada. | **já coberto por WP1.2** (termos marcados, Lovi) |
| **Risco 1 do Oráculo:** sem eco de "isso veio da SUA resposta", a fantasia degrada para sorteio (04 §2) | ver acima | **já coberto por WP1.2** |
| **Risco 2:** reroll por Créditos em cima de resultado aleatório corrói a fantasia; enquadrar como "nova leitura" (04 §2, rec. 14) | `SoulmonOnboarding mode='upgrade'` **roda as perguntas de novo** (`isUpgrade`: começa em `step 1`, `lastStep = REVEAL`) — estruturalmente já É "nova leitura". Mas `generateOracle` usa `Math.random()` como `salt` quando `seed` não vem, então duas leituras iguais podem dar criaturas diferentes. `grep -i 'nova leitura\|new reading'` → NÃO ENCONTRADO na copy. | **já faz** *(parcial)* — a estrutura sim, o determinismo e a copy não. Domínio do sustento (Créditos); registro para o guarda dono |
| **Rec. 3:** ecos do Oráculo no cotidiano — `soulGoal` no chat idle via `chat.js` (04 §3) | `buildSystemPrompt()` em `chat.js` recebe `petName, mood, evolutionStage, dominantBranch, aiSettings` — **sem** `soulGoal`; `_redact.js` afirma que `soulGoal`/`soulStruggle` **não passam** por essas rotas (decisão de privacidade). | **já coberto por WP2.5** (guarda-vínculo) — **com conflito a resolver lá**: mandar `soulGoal` ao Groq reverte uma decisão de privacidade registrada; a alternativa é o eco LOCAL (`DailyReportModal` já faz) |
| **Rec. 4:** variação rara cosmética na geração (04 §3) | ver B4 5 | **lacuna** (sem candidata; custo do dono) |
| **Rec. 15:** data de nascimento do pet no reveal + aniversários; "tempo compartilhado" é a métrica sentimental (04 §3); C.3 #2 admite "dias juntos" por ser monotônico | `GameStateContext.tsx`: o `createdAt?` encontrado é campo de **Task** (ao lado de `status?: TaskStatus`), não do pet. `handleCompleteOnboarding` grava `soulGoal`, `soulStruggle`, `petPassive: rollPetPassive()` — **nenhuma data de nascimento**. `grep -i 'dias juntos\|daysTogether'` → NÃO ENCONTRADO. | **lacuna** → C-N8 (pré-requisito do WP1.6, que promete "data de nascimento no dia do jogador" sobre um campo que não existe) |

### 1.7 Guia mestre — B.2, B.3 (D0/D1), C.3, I

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **B.2 estado:** REVEAL sem sprite; demo ~6 toques; Oráculo 15–35 interações | Confirmado (F1; `next()`). | **já coberto por WP1.1** |
| **O-1/O-2/O-3** | = rec. 1/2/8 do 05 | **já coberto por WP1.1/1.2/1.2** |
| **O-4/O-5/O-6/O-8** | = rec. 5/7/6/9 | **lacuna** → C-N3/C-N3/C-N2/C-N1 |
| **O-7** micro-posse demo · **O-9** teaser pré-consent · **O-10** REGISTER em 2 · **O-11** link mágico · **O-13** consent enxuto | = rec. 3/4/13/12/15 | C-N4 · (sem candidata) · C-N7 · C-N6 · C-N5 |
| **O-12** priming fora do onboarding, em nome do pet | ver F5 | **já coberto por WP1.5** |
| **C.3 #1** não cobrar no reveal; reconsiderar só com conversão <1 % | Bloco REVEAL sem preço. | **já faz** — defendido |
| **C.3 #6** manter a bifurcação SEM VOLTA; medir `onboarding_long_test` primeiro | `chooseRefine` definitivo; `back()` de `DEEP_START` devolve a oferta (permitido: ainda não escolheu de fato). `grep onboarding_long_test src/utils/telemetry.ts` → **NÃO ENCONTRADO** — o evento que a decisão pede para medir não existe; o que existe é `onboarding_step`, de onde a divisão em `REFINE_OFFER` pode ser derivada. | **já faz** (bifurcação) · **lacuna de medição** — sem WP novo: D1 deriva de `onboarding_step` (ver §4) |
| **S-1** checklist D0 <1 min; `needsCheckIn` não dispara no D0 | `needsCheckIn()` = `!sameDay(lastCheckInDate, playerDayKey(now))`; `handleCompleteOnboarding` não grava `lastCheckInDate` → dispara no D0 assim que há plano. `FirstDayCard.tsx` → não existe. | **já coberto por WP1.3** |
| **S-2** 3 hábitos derivados do `soulGoal` | `goalToCategory.ts` → não existe; `suggestTasks()` é por categoria escolhida, não por `soulGoal`. | **já coberto por WP1.4** |
| **S-4** sonho garantido na 1ª noite | `restWindow.ts`: `grep -i 'first\|primeir\|guarant'` → NÃO ENCONTRADO; `rollDream` é por seed/regularidade. | **lacuna** — domínio do descanso (não é meu WP); registro para o guarda dono porque fecha o D0→D1 |
| **S-5** push D1 (~19 h) e D2 na voz do pet | `push-scheduler.js`: `grep -i 'newborn\|createdAt\|first day'` → NÃO ENCONTRADO; `pushCopy()` só conhece hora do dia (10/16/22 BRT), não idade do save. | **lacuna** → C-N9 (cruza com o worker, deploy manual) |
| **S-7** prompt de widget no D2–D3, nunca no D0 | `grep -i widget WelcomePromptModal.tsx` → NÃO ENCONTRADO; nenhum prompt de widget existe. | **não se aplica** hoje (nada a adiar); quando existir, herda a regra do WP1.5 |
| **I.1.3** toda recompensa nova responde "faz querer a tarefa ou a notificação?" | `FirstTaskCompletedPopup`: *"Seu Soulmon cresceu um pouquinho agora. Uma coisa de cada vez, no seu ritmo."* — fala do pet, sem número, sem próxima recompensa anunciada. | **já faz** no D0 — critério a manter no WP1.3 |
| **I.2** progresso dotado (Catan/Nunes & Drèze) | Hábito novo nasce em ratio 1 (`habitRhythm.ts`). | **já faz** (domínio do hábito) |
| **I.3.2** "Commit To My Goal" em vez de "Continue" | Botão do REVEAL: `Continuar` (onboarding) / `Nascer {baseName}` (upgrade). `GOAL_STEP`: `Continuar`. | **lacuna** *(parcial)* — no upgrade já é compromisso ("Nascer X"); no onboarding normal o clímax fecha com um "Continuar" neutro. Entra no WP1.2 (copy do botão), não vale WP |
| **I.3.3** celebração que faz PARAR, reservada a marcos | REVEAL não tem pausa nem animação. | **já coberto por WP1.2** |
| **I.3.4** a criatura é espécie, não personagem — descrição diz de ONDE veio, não COMO se comporta | ver B4 1 | **conflita** *(parcial)* → aceite adicional no WP1.2 |
| **I.4** medianas, binárias, 30 dias, amostra visível | Domínio da medição. | **não se aplica** aqui |

### 1.8 Relatório 01 — YouTube/Mobbin/Tim Gabe (lições que tocam o nascimento)

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| **L1** valor antes de cadastro; e-mail só quando há algo a perder; "o ritual das 6 perguntas já É a primeira lição" | Demo com e-mail opcional; `ProtectProgressModal`. | **já faz** |
| **L2** cada pergunta muda a experiência — dizer "isso molda quem seu Soulmon vai ser" em CADA pergunta | Passos 1–5 têm `hint` explicativo (nome → numerologia; data → mapa astral + idade; hora → Ascendente; cidade → céu/fuso; favorita → aparência). As **6 perguntas** e os **20 itens** têm só contador. | **já faz** *(parcial)* → a metade que falta é C-N3 |
| **L3** puláveis, decisões de 1 toque, medir onde abandonam | Skips: sim. 1 toque: as 6 perguntas e os 20 itens sim; os passos 1–4 são digitação. Medição: `onboarding_step` emitido, não lido. | **já faz** *(parcial)* |
| **L4** oferecer a compra no reveal ("seu plano está pronto") via `UnlockNudge` variante `reveal` | A variante `reveal` do `UnlockNudge` (`UnlockAccountModal.tsx`) é para "quem JÁ pagou e saiu do ritual pela metade" — não é oferta. Bloco REVEAL sem oferta. | **conflita com a tese** — argumento perdedor de C.3 #1, registrado |
| **L15** notificação escrita como o PET ajudando, nunca o app cobrando | `pushCopy()`: todos os 3 títulos em nome do pet; corpos sem culpa ("O que ficou pra trás fica pra amanhã"). | **já faz** |
| **L21** checklist D0; `needsCheckIn` não no D0 | = S-1 | **já coberto por WP1.3** |
| **L23** traço de nascimento visível em fala idle | `petPassive` sorteado em `handleCompleteOnboarding`, exibido em `StatsPage` (`getPassive`). Não aparece no REVEAL nem em fala. | **lacuna** — no D0, mencionar o traço no reveal seria "como se comporta"? Não: Guloso/Madrugador são hábitos de CUIDADO, não personalidade. Mesmo assim fica fora do WP1.2 (o reveal já vai ganhar sprite + essência + `soulGoal`; um 4º elemento dilui). Fala idle é WP2.x (vínculo) |

---

## 2. WPs existentes × corpus pré-Mobbin

| WP | O corpus SUSTENTA / CONTRADIZ / é indiferente | Fontes |
|---|---|---|
| **WP1.1** Sprite no REVEAL | **SUSTENTA, unanimemente.** É a F1 do 05, O-1 do guia, risco 1 do 04, e a condição de Tim Gabe (A3 §2) para a fricção longa valer: o usuário aceita as perguntas porque a tela final sai personalizada — hoje ela sai igual para todos (texto). A4 (Gabe) pede "tempo até o valor": `reveal_seen { has_sprite }` já está no schema e nunca é emitido — o aceite do WP1.1 fecha isso. | 05 F1/rec.1 · guia O-1 · 04 §2 · A3 §2 · A4 §3 |
| **WP1.2** Reveal cerimonial + `soulGoal` | **SUSTENTA**, com uma **correção de escopo** vinda da B4/I.3.4: a régua (c) precisa virar aceite — `behaviorSentence` sai das descrições de estágio. E I.3.2 pede que o botão do clímax seja compromisso, não `Continuar`. I.3.3 dá o mecanismo da cerimônia: **interromper**, não decorar. O 04 (Monster Rancher) dá o porquê: sem "isso veio de você", é gacha. | 05 rec.2/8 · guia O-2/O-3 · 04 §1–2 · B4 1 · I.3.2–I.3.4 |
| **WP1.3** Cartão D0 + check-in não no D0 | **SUSTENTA.** Airtable (A3): não largar o iniciante na interface aberta — mas com prazo de validade, porque NN/g (A3) proíbe tutorial persistente. L21/S-1 são a spec literal. I.1.3 dá o critério do texto: nada que anuncie a próxima recompensa. `FirstTaskCompletedPopup` já respeita isso e é o tom a copiar. | A3 §1 · 01 L21 · guia S-1 · I.1.3 |
| **WP1.4** Templates do `soulGoal`/`soulStruggle` | **SUSTENTA.** É o "wizard que monta a estrutura" da Isford aplicado à primeira tarefa, e o "cada pergunta muda a experiência" de Gabe (L2). S-2 é a spec. Camada 2 (IA) segue `BLOQUEADO:D8`, e o corpus não muda isso — `_redact.js` mantém `soulGoal` fora do Groq por decisão de privacidade. | A3 §1/§3 · 01 L2 · guia S-2 |
| **WP1.5** Priming de push no D2–D3 | **SUSTENTA**, com **um desacordo interno do corpus** a registrar: o 05 rec.10 diz "após a 1ª tarefa concluída **ou** ao pôr o pet para dormir" (isto é, ainda no D0), e o guia S-7/O-12 + o ledger dizem D2–D3. O 05 rec.10 e Duolingo (A3/05: primer DEPOIS de fixar a meta diária) sustentam "depois de valor", não "D2". **Mantenho D2–D3**: o D0 já tem reveal + tutorial + 1ª tarefa; empilhar um pedido de permissão no dia de maior risco (S-7: "é o momento de maior risco") contradiz a própria fonte. O gate `jaConcluiuAlgo` fica como piso. | 05 F5/rec.10–11 · guia O-12/S-7 · 01 L15 |
| **WP1.6** `BirthCard` reutilizável | **Indiferente no formato, SUSTENTA no conteúdo — e expõe um pré-requisito faltante.** O 04 rec.15 pede data de nascimento no reveal e aniversários; C.3 #2 admite "dias juntos" por ser monotônico. O WP1.6 promete "data de nascimento no dia do jogador" e **não existe campo** para ela no save (C-N8). Sem número continua certo (04: "tempo compartilhado" é sentimento, não placar — mas a DATA não é número que desce). | 04 rec.15 · C.3 #2 · B4 3 |
| **WP1.7** Rascunho persistente (`VERIFICADO`) | **SUSTENTA.** Tim Gabe (A3): custo afundado só funciona se o investimento não evaporar; NN/g (A3): "taxa a memória do usuário" — reescrever 20 respostas é a forma extrema disso. C.3 #6 ("medir primeiro se o teste de 20 mata >30 % do funil") ganha um confundidor a menos: abandono por fechar o app deixa de contar como abandono por desinteresse. `readOracleDraft`/`writeOracleDraft`/`clearOracleDraft` confirmados. | A3 §2 · C.3 #6 |
| **WP1.8** Permissão ao ligar o lembrete de deitar | **SUSTENTA.** 05 rec.10 cita literalmente "ao pôr o pet para dormir" como momento de pedir; 01 L15: `sleepReminderAt` é o único push que o app já considera legítimo. Ligar o toggle é o pedido implícito — pedir permissão ali é consequência, não interrupção. Nada no corpus contradiz. | 05 rec.10 · 01 L15 |

**Premissa do plano que CAIU:** o WP1.6 assume um campo de nascimento do pet que não existe
(o único `createdAt` do `GameStateContext.tsx` é de `Task`). Não é bug do WP — é dependência
não declarada; C-N8 a declara.

**Premissa que ficou MAIS forte:** "push nunca antes de valor" não é só regra deste guarda —
A3 (Gabe/NN/g), 05 rec.10 e 01 L15 convergem, e a geolocalização da rec.18 cai pela mesma
régua.

---

## 3. Candidatas (SEM número de WP — o consolidador integra)

Todas passam pela linha vermelha deste domínio: nada obrigatório antes de ver o app; bifurcação
segue SEM VOLTA; descrição diz de ONDE veio; push só depois de valor; nada de franquia em prompt.

### C-N1 · Eco imediato do "porquê" (05 rec.9 · guia O-8)
- **Lacuna:** `next()` de `GOAL_STEP` só troca o passo; o texto some sem acknowledgment
  (`grep -i 'anotado\|noted'` → NÃO ENCONTRADO).
- **Spec:** ao avançar de `GOAL_STEP` com texto não-vazio, o `STRUGGLE_STEP` abre com uma
  linha do corvo acima do título: *"Anotado. Seu Soulmon vai lembrar disso."* / *"Noted.
  Your Soulmon will remember."* Pular não gera linha nenhuma. Sem estado novo no save.
- **Aceite:** teste de render: com `soulGoal` preenchido a linha aparece no passo seguinte;
  com skip, não aparece; PT e EN.
- **Verificação:** `grep -c 'vai lembrar disso' src/components/SoulmonOnboarding.tsx` → 1.

### C-N2 · Bifurcação em ganho concreto (05 rec.6 · guia O-6)
- **Lacuna:** copy atual *"elas afinam quem seu Soulmon vai ser"* — abstrato, sem custo
  declarado.
- **Spec:** trocar a frase por o que muda e quanto custa, com números lidos das constantes:
  *"Com mais {SOUL_TEST_ITEMS.length} perguntas (~2 min), a leitura usa seus traços de
  personalidade além das respostas de agora."* Manter a declaração de irreversibilidade
  exatamente como está. **Não** prometer "criatura melhor" — os dois caminhos são
  legítimos (as 6 respostas entram nos dois).
- **Aceite:** o número na tela vem de `SOUL_TEST_ITEMS.length`; o texto não contém
  "melhor"/"better"; screenshot Playwright PT/EN.
- **Verificação:** `grep -c 'afinam quem' src/components/SoulmonOnboarding.tsx` → 0 ·
  `awk '/step === REFINE_OFFER/,/chooseRefine\(false\)/' … | grep -ci 'melhor\|better'` → 0.

### C-N3 · Feedback de ORIGEM durante o ritual (05 rec.5/7 · guia O-4/O-5 · 01 L2)
- **Lacuna:** as 6 perguntas e os 20 itens mostram só `Pergunta N de M`; passos 1–5 já
  explicam o porquê de cada dado e as perguntas não.
- **Spec:** (a) cada `ORACLE_QUESTIONS[i]` ganha um `hint` de uma linha dizendo **qual eixo**
  aquela pergunta alimenta (elemento / papel / alinhamento / reino) — sem revelar a
  resposta; (b) no bloco `DEEP`, a cada 5 itens (`index % 5 === 4`), `itemHint()` devolve
  uma linha-fôlego de origem ("Metade feita — o reino da sua criatura está se
  definindo"). **Trava:** nenhuma linha descreve comportamento ("ela vai ser teimosa") —
  só de onde vem. Nenhuma leitura parcial numérica.
- **Aceite:** teste: todo `ORACLE_QUESTIONS[i].hint` existe em PT e EN; `itemHint(…, 4|9|14|19, 20)`
  contém a linha-fôlego e `itemHint(…, 3, 20)` não; nenhum hint contém palavras da lista
  de comportamento (`teimos|brincalh|tímid|stubborn|playful|shy`).
- **Verificação:** `npx vitest run src/components/SoulTestItem.test.tsx src/utils/oracle.questions.test.ts`.

### C-N4 · Micro-posse no demo (05 F3/rec.3 · guia O-7)
- **Lacuna:** `DEMO_PICK` = 3 estranhos; nada é escolhido pelo jogador além do nome.
- **Spec:** no card escolhido, 3 chips de tonalidade (CSS `filter: hue-rotate(...)` sobre
  o `getDemoSprite`, sem arte nova) — a escolha grava `demoTint` no save e `getSpriteForStage`
  aplica o mesmo filtro no palco. Zero efeito mecânico. **Não** gera sprite (demo continua
  `enabled: !demoCharacterId` em `useSpriteGeneration`).
- **Aceite:** teste: `demoTint` persiste e é higienizado no load (`?? undefined`); o filtro
  nunca é aplicado a save com `soulmonStages` (pet próprio).
- **Verificação:** `grep -c demoTint src/utils/sprites.ts src/contexts/GameStateContext.tsx` → ≥1 cada.
- **Risco a declarar:** `hue-rotate` sobre pixel-art pode quebrar a paleta; screenshot
  obrigatório antes de aceitar. Se ficar feio, a alternativa é 1 acessório (chip) e não cor.

### C-N5 · Consent enxuto (05 rec.15 · guia O-13)
- **Lacuna:** 6 `<p>` no bloco `CONSENT_STEP`; a F2 diz que ele cai entre a motivação e a
  recompensa. A ORDEM não muda (o `ConsentRecord` precisa ser carimbado antes de qualquer
  dado do ritual — `buildConsentRecord()` no `next()`).
- **Spec:** manter links (Termos/Política), a caixa e o campo de idade do demo; cortar o
  parágrafo introdutório redundante com o `hint`. Meta: ≤3 `<p>`.
- **Aceite:** `awk '/step === CONSENT_STEP/,/step === AGE_BLOCK/' … | grep -c '<p'` → ≤3;
  o teste de consentimento existente (`consent.ts`) continua verde.
- **Verificação:** o comando acima + `npx vitest run src/utils/consent`.

### C-N6 · Link mágico com o pet presente (05 F6/rec.12 · guia O-11) — depende do WP1.1
- **Lacuna:** a tela *"Abra o link NESTE aparelho"* não tem sprite nem fala.
- **Spec:** reaproveitar o slot de imagem do WP1.1 (sprite pronto ou silhueta) acima da
  mensagem, com uma linha na voz da criatura: *"{baseName} está te esperando — abra o
  link e volta."* Sem retry automático, sem contador.
- **Aceite:** render test com `result` presente mostra a `<img>`/silhueta no estado de
  link enviado; sem `result` (demo com e-mail), mostra `getDemoSprite`.
- **Verificação:** `awk '/link de acesso/,/<\/div>/' src/components/SoulmonOnboarding.tsx | grep -c '<img'` → ≥1.

### C-N7 · Batismo no reveal, cadastro depois (05 rec.13 · guia O-10)
- **Lacuna:** o clímax fecha com `Continuar` e o formulário de 3 campos vem depois.
- **Spec:** mover o campo `onb-petname` (pré-preenchido) para o bloco REVEAL, abaixo do
  sprite; o botão vira *"Nascer {nome}"* também no onboarding normal (I.3.2). `REGISTER`
  fica com nickname + e-mail. Nenhum campo novo fica obrigatório.
- **Aceite:** `REVEAL` contém `onb-petname`; `REGISTER` não; o rascunho (`oracleDraft`)
  continua **sem** `petNameEdit` (está em `ORACLE_DRAFT_FORBIDDEN_KEYS`).
- **Verificação:** `awk '/step === REVEAL/,/step === REGISTER/' … | grep -c 'onb-petname'` → 1;
  `npx vitest run src/utils/oracleDraft.test.ts`.

### C-N8 · `bornAt` do pet no save (04 rec.15 · C.3 #2) — pré-requisito do WP1.6
- **Lacuna:** nenhum campo de nascimento do pet; `handleCompleteOnboarding` grava
  `soulGoal`/`soulStruggle`/`petPassive` e nada de data.
- **Spec:** `bornAt: string` (dia do jogador, via `playerDayKey`, gravado uma vez em
  `handleCompleteOnboarding` e em `handleUpgradeRevealed`); load com `?? undefined`, e
  para save antigo **nunca** inferir de outra data (deixa vazio — "há N dias" falso é pior
  que ausente). Consumidores: `BirthCard` (WP1.6) e, futuramente, aniversário (fora deste
  domínio). Exibição como DATA, nunca como contador que possa parecer placar.
- **Aceite:** teste do `GameStateContext`: `bornAt` sobrevive ao round-trip e ao load da
  nuvem; save sem o campo carrega sem erro; `handleUpgradeRevealed` **não** reescreve o
  `bornAt` existente (troca a criatura, não a data — decisão a confirmar com o dono: o
  upgrade é "nasceu de novo" ou "trocou de pele"?).
- **Verificação:** `grep -c bornAt src/contexts/GameStateContext.tsx src/App.tsx` → ≥1 cada;
  `npx vitest run src/contexts/GameStateContext.saveContent.test.tsx`.

### C-N9 · Push de D1/D2 na voz do pet (guia S-5) — cruza com `workers/`
- **Lacuna:** `pushCopy()` só conhece a hora do dia; o scheduler não sabe a idade do save.
- **Spec:** `functions/api/subscribe.js` grava `bornAt` (C-N8) junto da subscription; o
  cron escolhe copy por idade: D1 ~19 h *"{name} aprendeu uma coisa nova hoje"*, D2 manhã
  *"{name} sonhou com você"* (só se houve noite registrada — senão, silêncio). A partir do D3,
  a rotação atual. **Só dispara para quem já ligou notificações** (WP1.5/1.8 continuam sendo
  o pedido).
- **Aceite:** teste de `_pushCopy.js` com `ageDays` 1/2/3; sem `bornAt` cai na copy atual.
- **Verificação:** `node --test functions/api/_pushCopy.test.js` (a criar) · deploy manual do
  worker (`wrangler deploy` em `workers/`) — item "depende do dono".
- **Dono sugerido:** este guarda escreve a copy; o worker é do guarda de sustento/medição.

---

## 4. A fricção que eu mediria primeiro (depende de D1)

Igual à do dossiê Mobbin, e o corpus pré-Mobbin a reforça: **a queda entre o código de
`REVEAL` e o de `REGISTER` em `onboarding_step`, por funil** — porque é a única que já está
instrumentada e é o número que confirma ou derruba o WP1.1 como P0.

O que este estudo **acrescenta**: C.3 #6 condicionou reordenar o ritual a um evento
`onboarding_long_test` que **não existe**. Não precisa existir — a divisão em `REFINE_OFFER`
e a queda dentro do bloco `DEEP` já são deriváveis de `onboarding_step` (`onboardingStepCode`
distingue os passos). O que D1 precisa fazer é **ler** dois pares: (REFINE_OFFER → DEEP_START)
e (DEEP_START → GENERATING). Se o segundo par perde >30 %, C.3 #6 diz que reordenar vira P0.
O WP1.7 (rascunho) já tirou um confundidor dessa leitura.

---

## 5. Dívida `soulStruggle` — estado

Continua **coletado e nunca lido**: `grep -rn soulStruggle src` fora de
`SoulmonOnboarding`/`GameStateContext`/`App.tsx`/testes → só `oracleDraft.ts` (que o guarda
no rascunho) e o comentário de `telemetry.ts` (que o exclui). Nenhuma fonte pré-Mobbin dá
padrão para ele além do 01 L2 ("volta no DailyReportModal" — **falso** para `soulStruggle`;
só `soulGoal` volta). WP1.4 continua sendo quem o gasta. Nenhuma candidata acima o usa, de
propósito: C-N1 ecoa só o `soulGoal`, porque devolver "o que te atrapalha" no dia do
nascimento é cobrança, não vínculo.

---

## 6. O que este guarda mudou de opinião

1. **A geolocalização (05 rec.18) não é polimento — é violação.** Eu a tinha como P3
   inofensivo; ler A3 e L15 juntos deixou claro que um prompt de localização no passo 4 é a
   mesma coisa que push antes de valor. Sai do plano.
2. **`behaviorSentence` é conflito real, não nota de rodapé.** A B4 (frogMak) e I.3.4 dão a
   régua, e o código a viola em três descrições de estágio. O WP1.2 precisa de um aceite
   negativo (`grep -c behaviorSentence` → 0 nas descrições), não só da "régua (c)".
3. **O WP1.6 tinha um buraco que eu não tinha visto.** Prometia "data de nascimento" sobre
   um campo inexistente. C-N8 é o conserto, e a pergunta "o upgrade é nascer de novo?" é do dono.
4. **A rec.10 do 05 discorda do meu ledger sobre o D0**, e eu fico com o ledger — mas agora
   por um motivo escrito (S-7: o D0 é o dia de maior risco), não por preferência.
5. **O corpus confirma mais do que corrige.** Das linhas de tabela, a maior parte é "já faz"
   ou "já coberto por WP" — o plano existente não estava errado; estava sem evidência
   citada. Este arquivo é a evidência.
6. **"Nova Leitura" (04 rec.14) já existe estruturalmente** (`mode='upgrade'` roda as
   perguntas). O que falta é o `Math.random()` no `salt` e a copy — e isso é do sustento,
   não meu. Antes eu achava que era um WP inteiro.
7. **Feedback incremental (C-N3) só é seguro com trava explícita.** Sem ela, "vejo água na
   sua alma" vira "ela vai ser calma" em duas iterações de copy, e a linha vermelha da
   descrição cai por dentro do ritual.
