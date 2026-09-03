# Mobbin × Constância — leitura do guarda (WP2.1–WP2.7)

Fonte: `docs/guia-experiencia/09-mobbin-dossie.md` §1, Dossiê 6, Dossiê 8, Dossiê 9 (+ §15.5 e
§16.1 quando citados). Ledger: `docs/plano-melhorias/ledger/constancia.md`. Fatos do código:
`docs/plano-melhorias/B-habitos.md`, reconferidos por `grep` em 02/09/2026 (símbolos citados, não
linhas — as linhas do App.tsx já escorregaram entre o anexo B e hoje).

## 0. Limites que valem para tudo abaixo (§1 do dossiê)

- **Nenhum achado é Android.** O único widget que o Soulmon tem é Android (`WidgetRenderer.kt`).
  Tudo do Dossiê 9 é iOS; o que transfere é o *conteúdo* do widget, não o layout.
- **O acervo não captura o transitório.** 6B (toast) tem UM achado. Logo o dossiê não pode dizer
  como o toast atual do marco (`toast.success` em `celebrateHabitMilestone`) se compara — só pode
  dizer como um MODAL de marco se compara. É por isso que WP2.4 ganha spec e o toast não.
- **Dossiê 8 é, por confissão, catálogo de anti-padrão**: 7 de 10 telas expõem streak. O que serve
  cabe em quatro achados (Opal, Duolingo Perfect Week, Noom One-time, Alan/Mimo).

## 1. Achado a achado — três colunas

### Dossiê 6 — Celebração de marco

| O que o app faz | O que o Soulmon faz hoje (grep) | Veredito |
|---|---|---|
| **Convergência 7+ apps:** `×` no topo · emblema centralizado no terço superior · nome em bold · 1–2 linhas · um botão de largura total. 4 de 11 estampam a **data**. | Marco = `celebrateHabitMilestone` (`src/App.tsx`, `useCallback`): `playEvolve()` + `setMessageTrigger` + `toast.success(name — MILESTONE_TEXT[tier])`. Texto em `MILESTONE_TEXT` (sprout/sapling/tree, PT+EN). **Não existe `MilestoneCeremony.tsx`** (`grep -rl MilestoneCeremony src/` → vazio). Sem data, sem emblema, sem gesto de saída. | **Confirma WP2.4** e muda a forma: não é "overlay de 2,5 s que some" (spec atual), é **modal que espera o gesto**. O que faz pausar é a saída ser da pessoa, não do timer. Ver §2. |
| **Ahead:** `Let's continue together!` — saída em 1ª pessoa do plural; entrega um objeto (colecionável), não um elogio. | `MILESTONE_TEXT.tree`: "Este hábito virou parte de quem você é." — já é identidade, não placar. Mas o botão não existe (toast). | **Padrão a copiar na saída.** O dossiê é explícito: para "avatar que evolui COM o usuário", a postura relacional é a única coerente. Botão de WP2.4 = "Seguimos juntos" / "Let's keep going together". |
| **Duolingo:** numeral `30` sobre a arte + `CLAIM REWARD` (transação). | `HABIT_TIER_BONUS` (+10/20/30%) já é recompensa **passiva** (`attributeMultiplier`, `habitRhythm.ts`). Nada a reivindicar. | **Não copiar `CLAIM`.** Reivindicação promete um 2º momento; o bônus do Soulmon já está em vigor. Copy pode *anunciar* ("agora rende mais"), não pedir clique. |
| **Me+:** "Legendary day!" para dia comum; tela anterior legível com card promocional atrás. | Dia perfeito hoje é `toast` na virada + `DailyReportModal`; não há vocabulário de raridade. | **Anti-padrão a não importar.** Escala de raridade gasta rápido. O Soulmon reserva o vocabulário forte para 66 dias ("parte de quem você é") — manter. Nunca oferta atrás de celebração. |
| **Mindvalley:** só `×`; desfoque mostra a **grade de emblemas** atrás — fechar = "voltar para a minha coleção". Arte mais bonita no marco mais fácil (Day One). | Não há coleção de marcos; o tier vive por hábito (`habitTier(totalDone)`, ícone em `HabitConstancy.tsx` via `TIER_FILL`). | **LIMÍTROFE, útil.** Sem coleção, a saída do modal deve devolver à **lista de hábitos com o ícone do tier já mudado** — o equivalente barato do "voltar para o acervo". Inversão de esforço visual (7 dias mais rico que 66) é decisão de arte, não de regra — registrado, não proposto. |
| **Beli:** `125 week streak!` no modal. | Proibido: `habitRhythm.test.ts` → `expect(Object.keys(r)).not.toContain('streak')`. | **ANTI-PADRÃO §3.** |
| **Deepstash:** container de celebração para conquista **não obtida** ("You haven't unlocked this yet"). | Não existe prévia de marco. `GuideModal.tsx` explica 7/21/66 em texto. | **Não fazer** para marcos de hábito: exibir "faltam N dias para árvore" é contagem regressiva sobre a pessoa. A prévia serve para a **dex de formas** (outro guarda), não para constância. |
| **6B Alma:** toast no topo "Vacation Ended! Your streak is now active again." + cards `Vacation mode` / `Streak saves 0`. | Toast = `sonner` (`src/components/ui/sonner.tsx`), sem duração custom no `App.tsx` (`grep -n duration src/App.tsx` → nada). Escudos: `HabitConstancy.tsx` desenha losangos **só se `shields > 0`** (comentário "ONDA 2: as CASAS VAZIAS saíram"). | **Soulmon já evita o `0` exposto** — exatamente o modo de falha que o dossiê marca como LIMÍTROFE. Manter. **Nenhum toast de "escudo usado"** hoje, e o dossiê não dá motivo para criar um. |

### Dossiê 8 — Prestígio puramente cosmético

| O que o app faz | O que o Soulmon faz hoje (grep) | Veredito |
|---|---|---|
| **Divergência-chave: 4 donos do número.** (1) saldo que zera · (2) total acumulado · (3) fato populacional · (4) substantivo sem número. Só 2/3/4 servem. | Eixo 2 já existe: `totalDone` (`HabitRhythm`), `perfectDays`, `totalPerfectDays`. Eixo 4 já existe: tiers seed→tree (`HABIT_TIER_ICONS`). Eixo 3: nenhum. Eixo 1: proibido por teste. | **A aura de WP2.2 é eixo 4 (estado, sem número).** Correto. Não acrescentar eixo 3 (`Owned by X%` exige servidor e população; fora de escopo e o guarda não quer a comparação no motor). |
| **Duolingo `Perfect Week`:** selo permanente, total só sobe. Risco nomeado: *"Perfect" implica "imperfect" mesmo não escrito.* | WP2.2 chama-se "sem escudo gasto" e ledger cita "modelo Perfect Streak". `pureWindow` **não existe** (`grep -rl pureWindow src/` → vazio). | **Muda a spec de WP2.2: renomear.** O dossiê aponta o buraco: um selo que nomeia a pureza fabrica a impureza. A aura não pode ter nome que implique oposto. Ver §2. |
| **Noom `One-time`:** pips `◆◇◇◇◇` que só enchem + etiqueta que declara "isto é permanente". | Marcos são permanentes por construção (`totalDone` sobrevive à poda: `HISTORY_CAP`). Ninguém **diz** isso ao usuário. `HabitConstancy.tsx` diz só "Nada zera aqui: um dia perdido custa um pontinho". | **Padrão útil, custo zero.** Uma linha no `title` do ícone do tier: "Marco permanente — não volta atrás". Cabe em WP2.4 (o modal é o lugar de dizer). Sem WP novo. |
| **Mimo `Wooden LEAGUE`:** substantivo no slot do número. Risco: degrau mais baixo lê como demérito. | Tier inicial = `seed` 🌱 "semente" (`tierName` em `HabitConstancy.tsx`). | **Soulmon já resolveu o risco:** semente não é o "pior" de uma escada de metais, é o começo de uma planta. Manter os quatro nomes. |
| **Alan:** cosmético já vestido, zero números. | Não há cosmético de constância. Aura de WP2.2 é o primeiro. | **Aura = "já vestida"**: aparece no ícone do hábito e no tier, nunca numa vitrine separada. Confirma spec. |
| **Finch `always available`** (anti-FOMO) · **Replika** vende traço. | Escudo nunca está na loja: `grep -n "shield\|escudo" src/utils/shop.ts` → nenhum item. `SPECIAL_ITEMS` não tem escudo. | Linha vermelha confirmada e íntegra. |
| **8B Headway/Quizlet/Calm/pushr:** fileira `S M T W T F S` com **dias vazios desenhados**; "Study tomorrow to keep your streak" (cobrança preventiva); `Longest 3 / Current 1` (o usuário contra si mesmo). | `HabitConstancy.tsx` desenha `CONSTANCY_WINDOW_DAYS` pontos com `DotState = 'done' \| 'shielded' \| 'missed' \| 'notDue'`; `missed` = círculo vazado (`border: 2px solid MISS_INK`), `notDue` = traço fino. | **LIMÍTROFE, aceito com condição.** Estruturalmente é a fileira do Mimo — mas (a) o denominador é só dia **devido** (notDue é traço, não círculo), (b) a legenda diz o custo ("um pontinho"), (c) nenhum texto pede o dia de amanhã. A condição: **nunca acrescentar frase de "amanhã"** nem "melhor janela" (Calm). Ver §3. |
| **Headspace:** ícone de olho para **ocultar** o streak. | `hideMetrics` existe só para a Janela de Descanso (`restWindow`). Constância não tem ocultação. | **Candidato sem número (§2.2):** estender `hideMetrics` à linha de constância. Barato, e é a única concessão do acervo à ideia de que a métrica pode machucar. |
| **Deepstash PRO:** vende freezes. **adidas/Shopee:** patamar que expira. | Escudo não é vendido; tier não expira (`habitTier` só lê `totalDone`, que só cresce). | Linhas vermelhas íntegras. |

### Dossiê 9 — Widget de tela inicial

| O que o app faz | O que o Soulmon faz hoje (grep) | Veredito |
|---|---|---|
| **Duolingo (ANTI-PADRÃO de referência):** fundo vermelho, `🔥❗847 days`, "Save your streak!", "Don't forget me!", coruja hostil. | `WidgetRenderer.kt` → `contextualMessage(completed,total,hp)`: `"⚠️ Cuide de mim!"` (hp ≤ 20), `"📋 Adicione tarefas!"`, `"📋 $completed de $total feitas"` (ratio < 0.4). `buildChatPhrases`: `"${total - completed} task(s) left, let's go!"`, `"I need some care..."`. | **O widget de hoje tem duas frases de cobrança na superfície mais exposta do telefone.** Não é vermelho nem tem número que zera, mas "X de Y feitas" abaixo de 40 % e "N task(s) left" são o `Save your streak!` em tom baixo. **WP2.6 precisa reescrever as frases, não só acrescentar chaves.** Ver §2. Também: chat phrases só em EN, contextualMessage só em PT — inconsistência de idioma (fora do escopo deste guarda, registrada). |
| **Mimo:** `Well done!` + mascote **descansando**. Mesma estrutura de dados, afeto invertido. | Sprite do pet já está no widget (`renderPet`, `resolveSprite`). Frases positivas só quando ratio ≥ 0.4. | **Modelo tonal para WP2.6:** a fala do widget é a fala de quem *já fez* ou de quem *descansa*, nunca de quem cobra. |
| **Alma:** "Streak secured! Nice work." aparece **depois** do cumprimento. | `"✨ Dia perfeito!"` quando ratio ≥ 1.0 — já é o padrão Alma. | Manter. |
| **GitHub / one year:** grade sem números; widget pequeno **sem texto algum**. | `renderPet` (1×1) = sprite + cocô, sem texto. `renderScreen` (3×2) = corações + energia. | **O widget pequeno do Soulmon já é o "GitHub"** — identidade sem número. Não acrescentar texto ao 1×1. |
| **Convergência: fileira semanal `S M T W T F S` é universal — e sempre desenha os vazios.** O dossiê pede que o Soulmon a repense para o widget. | Nenhum dado de hábito chega ao widget (`DigiWidgetPlugin.kt`: só `digimon_name`, `current_stage`, `egg_type`, `branch_type`, `completed_tasks`, `total_tasks`, `hp`, `health_points`, `max_health_points`, `energy_points`, `has_poop`). | **Não levar a fileira de 7 pontos ao widget.** No app ela tem legenda e contexto; no widget, vista 40×/dia, quatro círculos vazios são quatro falhas. WP2.6 leva **estado** (tier, aura, precisa-de-versão-reduzida), não histórico. |
| **MD Vinyl:** do grande ao pequeno **remove funções inteiras**, um traço visual sobrevive a todos. Hierarquia de descarte: histórico → rótulos → ações → identidade. | Cinco layouts (`widget_digiapp`, `_vertical`, `_pet`, `_chat`, `_screen`); o sprite está nos cinco. | **Confirma a arquitetura atual**: o sprite é o traço que sobrevive. §2 dá a tabela "o que cabe onde". |
| **Alma / GO Club / MFP:** botão de ação no widget. | Widget é só leitura (`attachClick` abre o app). | Fora do escopo deste guarda (marcar hábito pelo widget é motor de tarefas + APK). Não proposto. |
| **Alma `Streak saves 0`** na home; **§16.1 decisão 4: estoque de escudos INVISÍVEL.** | WP2.6 spec atual propõe chave `shields` no bridge. | **Conflito de spec — corrigido em §2:** chave `shields` **sai** de WP2.6. Levar estoque de escudo à home screen contradiz a decisão 4 e cria o modo de falha do Alma. |
| **timespent:** tela de instalação com prévia vazia e "também em Pequeno/Grande". **Vocabulary:** `Refresh: Hourly`. | Sem tela de instalação (widget é adicionado pelo launcher); `WidgetRefreshWorker.kt` existe. | Registrado; não proposto (Android não tem galeria in-app equivalente sem trabalho de APK que não é deste guarda). |

## 2. Efeito nos meus WPs

### WP2.1 — `REST_SHIELD_MAX` 3→2 · **spec não muda**
O dossiê não tem nada sobre o *número* de escudos; tem sobre a *exibição* (§15.5: sete apps, a
diferença toda é o estoque exposto). Continua `BLOQUEADO:D3`. Um dado lateral: Paired repõe **1
por mês**, Yazio tem **1**; o Soulmon dá 1 a cada 7 dias com teto 3 — é o mais generoso dos oito.
Isso é argumento **para** D3, não decisão.

### WP2.2 — Prestígio "sem escudo gasto" · **spec muda em dois pontos**
1. **Nome.** Nem "perfeito", nem "puro", nem "limpo" — todos nomeiam o oposto (Duolingo, risco
   registrado no dossiê). Proposta: função `steadyWindow(rhythm, now, windowDays = 28)` e, na UI,
   **sem nome nenhum**: a aura é atributo visual do ícone do tier. O `title`/`aria-label` diz o
   que é sem julgar: PT "Ritmo firme nos últimos 28 dias" · EN "Steady rhythm over the last 28
   days". Nunca "sem falhas".
2. **Onde aparece.** Modelo Alan: **já vestida** no ícone de `HabitConstancy.tsx` (e no tier da
   lista). Nunca em vitrine, nunca contada ("3 hábitos com aura"), nunca no widget como número.
   Pode ir ao widget como **estado** (ver WP2.6).

Continua valendo, sem alteração: some em silêncio; nunca altera `shields`/`constancy`; os dois
testes de aceite do ledger. **Comando de verificação** passa a ser `grep -q "steadyWindow"
src/utils/habitRhythm.ts` (era `pureWindow`).

### WP2.4 — Celebração de marco · **spec muda na forma e na saída**
Texto novo:

> `MilestoneCeremony.tsx` (novo) é um **modal que espera o gesto** — não overlay de tempo fixo. A
> convergência do Dossiê 6 é unânime: o que faz pausar é a saída pertencer à pessoa. Composição
> (a dos 9 apps): sprite atual no terço superior com o ícone do tier (`HABIT_TIER_ICONS`) → nome
> do hábito → `MILESTONE_TEXT[tier]` → **data do dia** em pílula pequena (converte em registro;
> 4 de 11 apps) → uma linha "Marco permanente: este hábito já rende mais" (Noom `One-time` +
> anúncio do `HABIT_TIER_BONUS`, sem `CLAIM`) → **um botão**: PT "Seguimos juntos" · EN "Let's
> keep going together" (Ahead). `×` no canto também fecha. Sem número de dias além do que
> `MILESTONE_TEXT` já diz; sem "próximo marco em N dias". `navigator.vibrate([30, 40, 60])` na
> abertura; `prefers-reduced-motion` → sem animação de entrada, mas o modal **continua modal**
> (o fallback para toast era perder o marco justamente para quem pediu menos movimento; o que se
> reduz é o movimento, não a pausa). Ao fechar, devolve à lista com o ícone do tier já trocado
> (Mindvalley: fechar = ver a coleção). `busy` (`App.tsx`, `rolloverPending || evolutionCeremony
> || showDailyReport || careEvent || feedAnim`) adia a cerimônia para o próximo tick, nunca a
> descarta. Emitir `milestone { tier }`.

Aceite mantém "uma vez por marco" (`milestoneReached`) e "nunca durante `busy`", e ganha: **"o
modal não fecha sozinho"** (teste com timers falsos: 10 s depois ainda montado).

### WP2.6 — Widget = janela do pet · **spec muda: uma chave sai, frases entram, tamanhos definidos**
Texto novo:

> **Chaves novas no bridge (só acrescentar):** `habit_tier_max` (0–3), `steady` (bool — algum
> hábito devido com `steadyWindow`), `needs_intervention` (bool), `bond_level`. **`shields` NÃO
> entra** (decisão 4 do dossiê §16.1 + modo de falha Alma/Noom). **`constancy_pct` NÃO entra**:
> mesmo interno, é o número que a linha vermelha proíbe, e um APK futuro o imprimiria "só para
> debug". O que o widget precisa saber cabe em booleanos e num tier.
>
> **Frases (`contextualMessage` e `buildChatPhrases`, `WidgetRenderer.kt`) — reescrever, não
> acrescentar:** sai `"📋 $completed de $total feitas"`, sai `"${total - completed} task(s) left,
> let's go!"`, sai `"⚠️ Cuide de mim!"`. Entra, por prioridade: `needs_intervention` → "Hoje, só
> 5 minutos?" / "Today, just 5 minutes?" · hp baixo → "Um carinho hoje?" / "A little care today?"
> · `completed ≥ total` → "✨ Dia perfeito!" (mantém) · `steady` → "Ritmo firme." / "Steady." ·
> `habit_tier_max ≥ 2` → "Isso já é parte de você." · senão → frase neutra do pet (Mimo:
> descansando, `Well done!`). **Nenhuma frase cita quantidade que falta.** Idioma: as duas funções
> passam a receber `language` pelo bridge (chave nova `lang`) — hoje uma é PT e a outra EN.
>
> **O que cabe em cada tamanho (MD Vinyl — remover função, não comprimir):**
>
> | Layout | Célula | Entra | Sai |
> |---|---|---|---|
> | `widget_digiapp_pet` | 1×1 | sprite + cocô. **Nada de texto** (GitHub/one year) | tudo |
> | `widget_digiapp_chat` | 3×1 | sprite + **uma** frase (a de maior prioridade acima) | contadores |
> | `widget_digiapp` | 3×1 | nome + sprite + frase + ícone do tier máximo (🌱🌿🪴🌳) | `done/total` como texto |
> | `widget_digiapp_vertical` | 2×2 | sprite grande + frase + tier | `done/total` |
> | `widget_digiapp_screen` | 3×2 | corações + energia + sprite (mantém — é "estado do pet", não hábito) | — |
>
> O traço que sobrevive a todos: **o sprite**. A fileira de 7 pontos **não vai ao widget** em
> tamanho nenhum.

Aceite mantém "APK antigo continua renderizando" e ganha: **teste (tabela de decisão em TS,
espelhada no Kotlin) de que nenhuma frase contém dígito quando `completed < total`**.

### WP2.3, WP2.5, WP2.7 — **spec não muda**
O dossiê não os toca. WP2.7 recebe um dado lateral do Dossiê 10 (fora do meu pedido, mas é meu
WP): Finch "It's okay to miss a day." é o modelo tonal; a spec já está alinhada ("nenhuma frase
menciona o que ficou por fazer").

### 2.2 Candidatos SEM número (lacuna real)

**Candidato A — `hideMetrics` cobre a constância**
- Lacuna: Headspace é o único do acervo que deixa esconder o streak; o Soulmon só tem
  `hideMetrics` para a Janela de Descanso. A linha "N das últimas 7" também pode machucar.
- Spec: `HabitConstancy.tsx` lê `hideMetrics`; quando ligado, esconde a headline "N das últimas
  7" **e os pontos**, e preserva tier + aura + escudos (recompensas ficam, números somem — a
  mesma regra da Janela de Descanso). Nenhuma mudança no motor.
- Aceite: render test com `hideMetrics: true` → sem dígito no texto, ícone do tier presente.
- Comando: `grep -q "hideMetrics" src/components/HabitConstancy.tsx`.

**Candidato B — Marco permanente declarado**
- Absorvido em WP2.4 (linha "Marco permanente"). **Não vira WP.**

Nada mais. Os outros achados ou confirmam o que existe ou pertencem a outro guarda (ação direta no
widget, prévia de forma na dex, tela de instalação de widget).

## 3. ANTI-PADRÃO — o que o dossiê mostra e o que aqui é proibido

| Anti-padrão (dossiê) | Proibição no Soulmon | Onde está travado |
|---|---|---|
| **Número que desce** — `1,284 Remaining` (MFP), `950 points to reach` (adidas), `Silver até 08 Oct` (Shopee), `323 days left` | "Qualquer contador exposto é monotônico." `perfectDays` só acumulam; `totalDone` sobrevive à poda; tier não expira. | CLAUDE.md 📈/🌳; `habitTier` só lê `totalDone`; `applyFreshStart` não toca `habitRhythms` (teste). |
| **Streak exposto** — `847 days`, `125 week streak`, `Longest 3 / Current 1`, `FRIEND STREAKS` | "Streak que zera: vetado por teste." Nem "mais longo" nem "atual". | `habitRhythm.test.ts`: `expect(Object.keys(r)).not.toContain('streak')`; comentário de `habitRhythm.ts` "NADA ZERA". |
| **Percentual cru** — `36% Completed` (GO Club), `Top 17% WORLDWIDE` (Opal) | "Nunca percentual cru de constância na UI." `HabitConstancy.tsx` imprime "N das últimas M", nunca `%`. Por isso `constancy_pct` sai de WP2.6. | Ledger, verdade 3. Hoje sem teste — **candidato de guarda**: render test `not.toMatch(/\d+\s*%/)`. |
| **Cobrança preventiva** — "Study tomorrow to keep your streak" (Quizlet), "Don't forget me!" (Duolingo widget) | Primeira falha não gera nada visível; `needsIntervention` só em `MISS_INTERVENTION_AT` (2). Nenhuma frase pede o dia de amanhã. | CLAUDE.md 🚫; `consecutiveMisses`/`needsIntervention`. |
| **Estoque de escudo exposto no zero** — `Streak saves 0` (Alma), `NO STREAK FREEZE` (Noom) | Só se desenha o que existe (`shields > 0 &&`). Não vai ao widget. | `HabitConstancy.tsx`, comentário "CASAS VAZIAS saíram"; §16.1 decisão 4. |
| **Proteção à venda** — Deepstash PRO "2 extra freezes/week" | "Nunca vender proteção contra punição." | `shop.ts` sem escudo; CLAUDE.md 💎 (dinheiro nunca compra vantagem de progresso). |
| **Fileira semanal com vazios no widget** — Mimo, pushr, Headway | Fileira só no app, com legenda; nunca no widget. | Spec WP2.6 acima (nova proibição — hoje o widget não a tem, então não está travada). |

## 4. Resposta explícita: algum padrão do Dossiê 8 acrescenta PERDÃO ou COBRANÇA ao motor?

**Não — desde que WP2.2 fique como está redigido aqui.** Conferido item a item:

- **Aura (Alan/Mimo, eixo 4):** lê `shielded[]`/`missed[]`, não escreve. Não altera `shields`,
  `constancy`, HP nem `applyMissedDay`. É **acolhimento visual**, não perdão mecânico. Some em
  silêncio → não cobra.
- **`One-time` (Noom):** é etiqueta; declara uma permanência que o motor já tem. Nada muda.
- **`Owned by X%` (Opal):** **não importado**. Se um dia for, é comparação (dado populacional),
  não perdão nem cobrança — mas passaria pelo guarda social, não por mim.
- **Headspace (olho):** esconder número não perdoa nem cobra.

**Dois pontos que marco para D4 mesmo assim**, porque encostam na linha de perdão sem cruzá-la:

1. **A aura é o 9º mecanismo?** Não — ela não perdoa nada, mas é o primeiro **prestígio** ligado
   ao escudo, e prestígio que depende de "não ter usado escudo" cria pressão para *não usar* uma
   proteção que é automática (a pessoa não decide usar; ela só falta). Se D4 responder que "o que
   dói perder é a aura", a aura passa a ser a única punição do sistema — e é exatamente o que a
   linha vermelha "some em silêncio" tenta evitar. **D4 precisa dizer se a aura pode ser a única
   coisa que dói.** Enquanto não disser, WP2.2 continua `PROPOSTO`, não `PRONTO`.
2. **WP2.6 e o widget "sem cobrança":** tirar "X de Y feitas" do widget **não** acrescenta perdão
   (o motor não muda), mas remove a última cobrança visível fora do app. Registro para D4 como
   dado: depois de WP2.6, a única cobrança que o Soulmon ainda faz é a do coração na virada.

**Nenhum WP de outro guarda** cruzou o motor de hábitos por este dossiê: os Dossiês 6/8/9 não
propõem escrita em `habitRhythm.ts`, `taskModel.ts` ou `dailyReset.ts`. (Dossiê 10 — win-back —
é do guarda de presença; a spec dele em `PLANO-MELHORIAS.md` WP3.4 já se declara "acolhimento,
não perdão mecânico". Sigo vigiando.)

## 5. Estado dos WPs depois desta leitura

| WP | Estado | Mudou? |
|---|---|---|
| WP2.1 | `BLOQUEADO:D3` | não |
| WP2.2 | `PROPOSTO` (+ pendência D4 §4.1) | **sim** — nome `steadyWindow`, sem rótulo de pureza, "já vestida" |
| WP2.3 | `PROPOSTO` | não |
| WP2.4 | `PROPOSTO` | **sim** — modal que espera gesto, data, botão relacional, sem fallback para toast |
| WP2.5 | `PROPOSTO` | não |
| WP2.6 | `PROPOSTO` | **sim** — `shields`/`constancy_pct` saem, frases reescritas, tabela por tamanho, `lang` |
| WP2.7 | `PROPOSTO` | não |
| Cand. A | sem número | `hideMetrics` cobre constância |
