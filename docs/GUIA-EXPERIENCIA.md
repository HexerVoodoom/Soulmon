# Guia de Experiência do Soulmon — da descoberta ao vínculo de longo prazo

> Documento mestre da rodada de pesquisa de **setembro/2026**. Consolida os 7
> relatórios em `docs/guia-experiencia/` (índice na seção G) e os arbitra contra
> as duas fontes de verdade internas: `CLAUDE.md` (regras vigentes do jogo) e
> `docs/PLANO-EVOLUCAO.md` (benchmark de ago/2026 + essência declarada).
>
> **Hierarquia de autoridade deste guia:** `CLAUDE.md` > `PLANO-EVOLUCAO.md` >
> este guia > relatórios-anexo. Nenhuma recomendação aqui pode contradizer uma
> regra travada por teste — quando um relatório propôs algo que contradiz,
> a arbitragem está registrada em texto (seção C.3 e nas caixas ⚖️).

---

## A. Sumário executivo e tese do produto

### A.1 A tese, em uma frase

**O Soulmon é um avatar do usuário que evolui junto com ele e o encoraja — nunca
um cobrador.** A criatura não é um placar com carinha; é uma criatura nascida da
leitura da alma da pessoa (Oráculo), que cresce quando ela cresce e que fica do
lado dela quando ela não consegue.

Toda decisão de design passa pelo filtro do `PLANO-EVOLUCAO.md`: *isso faz o
bichinho parecer mais um companheiro, ou mais um chefe?*

### A.2 O veredito da rodada

**O Soulmon hoje é um produto com arquitetura motivacional de primeira linha e
funil comercial invisível.** As sete pesquisas convergem em três achados
independentes:

1. **A ética já é diferencial competitivo, não custo.** Constância "N das
   últimas 7" em vez de streak; escudos consumidos automaticamente; perdão de
   ausência; humor que nunca vira score; masmorra que não cobra da barra de
   cuidado; três moedas com fronteira travada por teste. O relatório 03 conclui
   que o app está **à frente do que os canais de design pregam** — o benchmark
   correto do Soulmon não é o Duolingo, é o **Finch** (US$ 30M ARR sem VC, D1
   ~54% / D7 ~37%, sem guilt-trip). *A ação aqui é defender os testes, não
   construir nada.*

2. **O momento de maior investimento emocional do produto entrega texto.**
   O relatório 05 mede: o REVEAL do Oráculo — depois de 15 a 35 interações e
   2 a 5 minutos — mostra **nome + linha de essência + bio, sem sprite**. É a
   maior alavanca única de todo o funil, e é barata.

3. **Não existe telemetria.** O relatório 07 abre com isso e é a arbitragem mais
   dura desta rodada: **toda afirmação comportamental nos outros seis relatórios
   é hipótese não testada.** Sem os ~20 eventos da seção F, qualquer priorização
   posterior à onda P0 é opinião bem-vestida.

### A.3 O que muda depois desta rodada

| Camada | Estado | O que a rodada pede |
|---|---|---|
| Regras do jogo (HP, constância, perdão) | Estado da arte, testado | **Não mexer.** Defender os testes |
| Momento de revelação (reveal, marcos, evolução) | Mecânica pronta, cerimônia ausente | **Investir** — é onde o retorno por hora de trabalho é maior |
| Presença fora do app (widget, push) | Existe, genérico | **Personalizar** — widget é "tão eficaz quanto push" (Finch/Duolingo) |
| Descoberta da oferta paga | Praticamente invisível | **Tornar visível sem virar pressão** |
| Medição | Inexistente | **Construir antes de otimizar** |
| Conteúdo de longo prazo (D30–D90) | Só o Torneio semanal | **Eixo mais fraco do produto** |

> 📼 **Leia a seção I antes de agir nesta tabela.** A rodada 2 leu as
> transcrições dos vídeos (`08-transcricoes-notebooklm.md`) e trouxe três
> achados que a rodada 1 não podia ter: `REST_SHIELD_MAX = 3` provavelmente
> deveria ser 2 (o Duolingo testou e o 3º escudo treina ausência), o Soulmon
> nunca decidiu **onde é a sua linha de perdão**, e o caso mais forte contra
> gamificar produtividade acerta uma mecânica que o produto tem.

---

## B. A jornada, etapa por etapa

Cada etapa traz: **estado atual** (mecânica real, citando símbolos do código),
**lições da pesquisa** (com o relatório-fonte) e **recomendações P0/P1/P2** com
impacto × esforço.

Legenda de esforço: **P** (horas) · **M** (1–3 dias) · **G** (semana+ ou depende
de terceiro/dono).

---

### B.1 Descoberta

#### Estado atual
Não há canal de aquisição desenhado. O app é PWA + APK (Play Store) + overlay
Electron. Não existe card compartilhável, não existe momento "Wrapped", e o
material que faria isso — `weeklyReport` (`utils/rituals.ts`), tela de jornada
(item 5.2 do plano), `DREAM_CATALOG` com 30 sonhos, vitrine de troféus de season
— já está todo implementado, só não sai do app.

#### Lições da pesquisa
- **O truque viral nº 1 do Spotify é o resumo pessoal com identidade** (relatório
  01, lição 18). O Soulmon tem a matéria-prima e nenhum exportador.
- **Compartilhamento white-hat é o único CD5 (influência social) compatível com a
  essência** (relatório 03, rec. 14): o usuário mostra o *seu* bicho, não uma
  posição num ranking.
- **O gênero inteiro vive de "olha o que o meu virou"** (relatório 04, rec. 12):
  a cerimônia de evolução é o card compartilhável natural (sprite antes/depois +
  dias de jornada).
- **A intro deve dar prova, não promessa** (relatório 05, rec. 14): sprites reais
  de criaturas geradas rodando atrás do logo.
- ASO/loja não foi coberto por nenhum relatório desta rodada — **lacuna
  declarada**, ver seção C.4.

#### Recomendações

| # | P | Recomendação | Impacto × Esforço | Onde |
|---|---|---|---|---|
| D-1 | P1 | **Card mensal/de evolução compartilhável** (sprite antes/depois, dias juntos, sonho raro, estilo 8-bit). Render local em canvas, sem servidor | Alto × M | novo `utils/shareCard.ts` + `EvolutionPage`, `WeeklyReportModal` |
| D-2 | P2 | **Intro com prova**: 3 criaturas reais geradas animadas atrás do logo | Médio × P | `SoulmonOnboarding` (passo INTRO) |
| D-3 | P2 | **Página de captura/landing** reaproveitando os mesmos cards | Médio × M | fora do repo do app |

⚖️ **Arbitragem:** o relatório 01 sugere "share orgânico"; o 02 alerta que
comparação social quebra vínculo. Resolvido: compartilhamento é **sempre de
identidade** (meu bicho, meus sonhos, minha jornada), **nunca de posição
relativa**. Nenhum card exibe ranking, percentil ou comparação com outro usuário.

---

### B.2 Onboarding / Ritual do Oráculo

#### Estado atual (medido no relatório 05, `SoulmonOnboarding.tsx` lido integralmente)

```
INTRO → GOAL_STEP → STRUGGLE_STEP → CONSENT_STEP (+AGE_BLOCK)
  ├─ DEMO:   DEMO_PICK (3 pré-prontos) → REGISTER
  └─ ORACLE: nome · data · hora · cidade · criatura favorita
             → 6 ORACLE_QUESTIONS (auto-avanço 180ms)
             → REFINE_OFFER (bifurcação SEM VOLTA) → 20 itens psicométricos
             → GENERATING (1,4s) → REVEAL → REGISTER
```

- `soulGoal`/`soulStruggle` puláveis por regra, antes de qualquer mecânica.
- E-mail **opcional no demo**, obrigatório no pago.
- Barra de progresso desconta o bloco de 20 para quem recusa e inclui o tutorial.
- `TELEMETRY_FUNNEL` já separa demo/pago (o único ponto instrumentado do app).
- **REVEAL não mostra sprite.**
- Demo: ~6 toques até um thumb de 52px. Oráculo: 15–35 interações, 2–5 min.

#### Lições da pesquisa
- **F1 do relatório 05: "o reveal não revela".** Equivalente a o Finch entregar o
  passarinho como um parágrafo. Maior alavanca única do funil.
- **Posse mínima cria vínculo** (relatório 05, F3): o Finch faz escolher cor do
  ovo + nome + traços e chega a ~60% D1 (Naavik).
- **Quiz longo converte quando cada resposta visivelmente muda o resultado**
  (relatório 05, F4; relatório 01, lição 23 — "personalização percebida = valor
  percebido", padrão Noom/Cal AI). Hoje os 20 itens não dão nenhum feedback
  incremental.
- **Cada pergunta precisa mudar a experiência visivelmente** (relatório 01,
  lição 2): o Soulmon acerta na substância (as respostas geram a criatura) e
  erra em não dizer isso na tela.
- **Permission priming**: pedir push depois de um momento de valor, com tela
  própria antes do prompt do sistema (relatório 05, F5 — padrão Duolingo/Appcues).
- **O reveal é o momento errado para cobrar** (relatórios 05 e 06, contra a
  sugestão do 01 — ver arbitragem).
- **Ecos do Oráculo** (relatório 04, rec. 3): sem eco, "leitura da alma" degrada
  para sorteio.

#### Recomendações

| # | P | Recomendação | Impacto × Esforço | Onde |
|---|---|---|---|---|
| O-1 | **P0** | **Mostrar o sprite no REVEAL** (arte gerada ou placeholder animado da linha). Sem isso, nada mais no funil importa | Muito alto × P/M | `SoulmonOnboarding` (REVEAL) + `getSpriteForStage` |
| O-2 | **P0** | **Reveal cerimonial**: escurecer → silhueta → flash → sprite + nome. Respeitar `prefers-reduced-motion` (padrão já existe no `SPIN_CSS`) | Alto × M | idem |
| O-3 | **P0** | **`soulGoal` ecoado no reveal** — a bio da criatura cita o objetivo declarado ("nasceu para te acompanhar a voltar a estudar"). O dado já existe e hoje só estreia no `DailyReportModal` | Alto × P | `SoulmonOnboarding` + `oracle.ts` (composição da bio) |
| O-4 | P1 | **Feedback incremental nas 6 perguntas** — uma linha curta do corvo por resposta ("Hmm… vejo água na sua alma") | Alto × M | `ORACLE_QUESTIONS` + tela do ritual |
| O-5 | P1 | **Marcos no teste longo** — a cada 5 itens, tela-fôlego de leitura parcial. Quebra 20 em 4 blocos percebidos | Médio × P | passo dos 20 itens |
| O-6 | P1 | **Reframe da bifurcação em ganho concreto** ("com o teste, a leitura usa 6 eixos em vez de 1 · ~2 min"). Manter a irreversibilidade declarada | Médio × P | `REFINE_OFFER` |
| O-7 | P1 | **Micro-posse no demo**: escolher 1 variação de paleta do pré-pronto | Médio × M | `DEMO_PICK` |
| O-8 | P1 | **Ecoar a resposta do GOAL_STEP na hora** ("Anotado. Seu Soulmon vai lembrar disso.") | Médio × P | `GOAL_STEP` |
| O-9 | P2 | **Teaser de valor antes do CONSENT** — 1 tela com o pet animado ("é isso que você vai cuidar") | Médio × M | entre `STRUGGLE_STEP` e `CONSENT_STEP` |
| O-10 | P2 | **REGISTER em 2 momentos**: batismo no reveal (1 campo, emoção alta); nickname/e-mail depois, no app (o `ProtectProgressModal` já existe) | Médio × M | `SoulmonOnboarding` + `App.tsx` |
| O-11 | P2 | **Tela de link mágico com o pet presente** ("estou te esperando — abra o link") | Baixo × P | fluxo de auth |
| O-12 | P2 | **Permission priming de push fora do onboarding** — após a 1ª tarefa concluída ou ao pôr o pet para dormir, em nome do pet | Médio × M | `notifications.ts` + novo primer |
| O-13 | P2 | **Consent enxuto** (cortar o parágrafo redundante) e cidade/hora com default de 1 toque | Baixo × P | `CONSENT_STEP`, `CityPicker` |

⚖️ **Arbitragem — paywall no reveal.** O relatório 01 (lição 4, padrão
Noom/Cal AI) recomenda oferecer a compra exatamente no reveal do Oráculo. Os
relatórios 05 e 06 recomendam o oposto (06, rec. 5: "cobrar ali contamina o
momento emocional mais forte do produto"). **Decisão: não cobrar no reveal.**
Razões, na ordem de precedência: (a) a essência declarada proíbe transformar o
momento de vínculo em ponto de conversão; (b) o relatório 06 traz o dado que o 01
não tem — paywall pós-*value moment* rende 2,1× trial starts, e o value moment
do Soulmon é o **primeiro dia perfeito**, não o reveal; (c) o custo de reverter
uma conversão perdida é baixo, o de contaminar o ritual é irreversível.
**Argumento perdedor registrado:** o quiz longo cria investimento e o paywall
como "seu plano está pronto" é o padrão mais documentado da categoria — se a
conversão no primeiro dia perfeito ficar abaixo de 1% dos que revelam, este é o
teste seguinte a considerar, com tela dispensável em um toque.

---

### B.3 Primeiros 7 dias

#### Estado atual
- Comida vem de **concluir atividade**; energia zera todo dia; `perfectDays`
  exige `peso feito ≥ dailyGoalFor && ≥1 cadastrada && energia ≥ dailyGoalFor`.
- Evolução é **MANUAL** (`MANUAL_EVOLUTION = true`) e depende de `perfectDays`.
- `needsCheckIn` é 1×/dia civil, sem janela de horário.
- Sonhos exigem noite dentro da Janela de Descanso (`recordNight`).
- `taskSuggestions.ts` já sugere a versão de 2 minutos de uma tarefa grande.
- Não existe onboarding de tarefas: o usuário sai do tutorial com a lista vazia.

#### Lições da pesquisa
- **~50% dos trial starts e a maior parte do churn acontecem em D0–D1**
  (relatório 01, lição 21).
- **Sem tarefa cadastrada não existe loop nenhum** (relatório 07, mapa de churn,
  linha "Dia 1"): comida vem de concluir, e sem comida não há energia, nem dia
  perfeito, nem evolução.
- **Dias 2–3 são o pico universal de churn** (relatório 07).
- **Se a 1ª evolução não chegar em ≤5 dias, a maioria nunca a vê** (relatório 07)
  — e a evolução é o pico emocional do gênero (relatório 04).
- **Simulação/pet-sim tem D1 de 45–60%** (relatório 07, Segwise). Metas
  realistas para o híbrido produtividade × pet-sim: **D1 ≥ 35% · D7 ≥ 18% ·
  D30 ≥ 10%**; D1 < 20% ou D30 < 4% sustentado = problema estrutural.

#### Recomendações

| # | P | Recomendação | Impacto × Esforço | Onde |
|---|---|---|---|---|
| S-1 | **P0** | **Checklist D0 em <1 min após o reveal**: (a) dar carinho, (b) cadastrar 1 hábito, (c) ver a 1ª barra subir. `needsCheckIn` **não dispara no D0** — ritual de manhã começa no D1 | Muito alto × M | `App.tsx` (tutorial) + `rituals.ts` (guard de D0) |
| S-2 | **P0** | **Templates de 3 hábitos derivados do `soulGoal`** oferecidos no fim do onboarding, com 1 toque para aceitar | Muito alto × M | `taskSuggestions.ts` + tela pós-tutorial |
| S-3 | **P0** | **Garantir 1ª evolução alcançável em ≤5 dias** de uso normal — auditar `FORM_REQUIREMENTS` do rookie contra o `dailyGoalFor` real de um iniciante | Alto × M | `types/progression.ts`, `dailyReset.ts` |
| S-4 | P1 | **Sonho garantido na 1ª noite** — colecionável de D1, motivo concreto para voltar de manhã | Alto × P | `restWindow.ts` (`rollDream`) |
| S-5 | P1 | **Push D1 (~19h) e D2 na voz do pet** ("\<pet\> aprendeu uma coisa nova hoje", "\<pet\> sonhou com você") | Alto × P | `workers/push-scheduler.js` |
| S-6 | P1 | **Mensagem da virada com perda de coração reescrita como convite** ("ele quer um abraço"), nunca boletim de dano | Alto × P | `DailyReportModal` |
| S-7 | P2 | **Prompt de adicionar widget no D2–D3**, não no D0 (é o momento de maior risco) | Médio × M | `App.tsx` + plugin do widget |

---

### B.4 Hábito e constância — o "streak" sem punição

#### Estado atual (o mais forte do produto — quase tudo com teste travando)
- **Constância "N das últimas 7"** (`habitRhythm.ts`, `CONSTANCY_WINDOW_DAYS`);
  denominador só de dias devidos; hábito novo nasce em ratio 1 (progresso dotado,
  Nunes & Drèze). **Streak que zera é proibido por teste.**
- **Escudos de descanso** consumidos **automaticamente** em `applyMissedDay`
  (1 a cada 7 dias de boa constância, teto 3).
  > ⚠️ **O teto 3 é o único número desta lista que a evidência contraria.** O
  > Duolingo testou 2 vs 3 freezes: o terceiro "não foi melhor que dois" e
  > "treinava o usuário a tirar mais tempo de folga". Ver **I.1.1** — é
  > experimento P1, não correção.
- **Never miss twice**: `MISS_INTERVENTION_AT = 2`; a 1ª falha não gera nada
  visível; a 2ª oferece versão reduzida que **conta como feito**.
- **Marcos 7/21/66** (Lally et al. 2010) com tiers seed→sprout→sapling→tree e
  `HABIT_TIER_BONUS` **sempre ≥ 1**.
- **Meta ponderada por esforço** (`dailyGoalFor`) contra o exploit do Karma do
  Todoist. **Teto de 1 coração/dia**; perdão de ausência ≥2 dias; alívio de
  segunda (+0,5); fresh start que perdoa sem apagar.
- **Tarefa assombrada** (`HAUNTED_AFTER_DAYS` = 7) com bônus de alívio.
- **Humor nunca alimenta pontuação**; Janela de Descanso premia comportamento,
  nunca resultado; Dex de Sonhos só cresce.

#### Lições da pesquisa
- **Streak clássico é puro Black Hat (Octalysis CD8, loss avoidance)** — retém
  enquanto dói (relatório 03). O efeito de violação da abstinência (Marlatt) é o
  mecanismo pelo qual ele mata a retenção de cauda longa.
- **Mas o streak funciona por quatro mecanismos, e três são separáveis da
  punição** (relatório 03, §3): número único e legível que cresce · identidade e
  orgulho · presença diária no campo visual · medo de perder. **Importar os três
  primeiros, jamais o quarto.**
- **Lacuna diagnosticada:** o "N das últimas 7" é melhor que streak, mas o streak
  vence em *legibilidade e orgulho*. O Soulmon tem `totalDone` e tiers, e não tem
  um **número de identidade** equivalente ao "🔥 347".
- **Perfect Streak do Duolingo prova que prestígio pode ser puramente visual**:
  ao acabar, o halo apenas some.
- **Buraco de celebração**: entre os marcos 21 e 66 há ~6 semanas sem nada a
  comemorar (relatório 03, lacuna 3).
- **Widget é possivelmente O maior multiplicador de retenção** (relatórios 03 e
  07): o do Finch funciona porque mostra o pet *personalizado*.
- **Escudos deveriam parecer carinho, não item de inventário** (relatório 03,
  rec. 17).

#### Recomendações

| # | P | Recomendação | Impacto × Esforço | Onde |
|---|---|---|---|---|
| H-1 | **P0** | **Widget = janela do pet, não painel de dados**: sprite atual + humor do dia (dormindo na janela de descanso, feliz após dia perfeito, "com saudade" após 2+ dias — nunca doente/culpado) + contador "2/4 hoje" | Muito alto × M | `WidgetRenderer.kt`, `DigiWidgetPlugin` |
| H-2 | **P0** | **Contador lifetime "dias juntos"** (dias desde o nascimento + dias em que você apareceu). Monotônico por construção — o número de identidade do streak sem o zeramento | Alto × M | `GameState` (campo novo derivado) + perfil + widget |
| H-3 | **P0** | **Anel de constância na home** (0–7 preenchido pelo `constancy`) em vez de percentual. Uma falha = anel 6/7, visivelmente quase cheio | Alto × M | home/`App.tsx` |
| H-4 | P1 | **Selo "Em ritmo" (Aura)**: `constancy ≥ 6/7` em todos os hábitos devidos → brilho no palco e no widget. Ao cair, **apenas some** — sem toast, sem texto, sem perda | Alto × M | `petStage.ts` + `habitRhythm.ts` (leitura) |
| H-5 | P1 | **Marcos intermediários de celebração** entre 21 e 66 — falas do pet a cada ~15 dias efetivos usando `totalDone`. **Sem tocar em `HABIT_MILESTONES` nem `HABIT_TIER_BONUS`** (há teste) | Médio × P | falas / `chat.js` |
| H-6 | P1 | **Animar os 3 momentos de pico**: marco de hábito (`milestoneReached` existe para tocar 1×), conclusão de tarefa assombrada (merece a maior comemoração do app) e cerimônia de evolução | Alto × M | `index.css` (keyframes — footgun 1) + componentes |
| H-7 | P1 | **Selo de Foco do dia visível no palco** quando as 3 fecham (`focusComplete` já existe, o selo é discreto) | Médio × P | `petStage.ts` |
| H-8 | P2 | **Celebração variável cosmética**: ~5% de chance de animação/fala rara ao concluir. Variável no *sabor*, determinístico no valor | Médio × M | conclusão de tarefa |
| H-9 | P2 | **Escudos como "cobertinhas"**: quando um é consumido, o relatório diz "usei uma cobertinha por você" | Médio × P | `DailyReportModal` |
| H-10 | P2 | **Nunca expor percentual cru de constância** — sempre "5 dos últimos 7" ou o anel | Baixo × P | toda UI que hoje mostra ratio |
| H-11 | P2 | **Minigráfico de 28 dias de `effortDone`** no relatório semanal — tendência é a métrica anti-streak por excelência | Médio × M | `WeeklyReportModal` |

⚖️ **Arbitragem — "dias juntos" pode ser lido como streak?** Não: é
**monotônico por construção** (dias corridos desde o nascimento e dias com ≥1
ação nunca diminuem), então não pode reintroduzir o efeito de violação da
abstinência. Guarda-corpo que fica valendo: **nenhum contador exposto ao usuário
pode diminuir** — a falha muda a taxa de crescimento, nunca o sinal.

---

### B.5 Vínculo de longo prazo

#### Estado atual
- `bond.ts` / `bondLevelFor(totalXP)` — nível **derivado na leitura, nunca
  persistido** (footgun 9); gate de PvP `BOND_PVP_MIN_LEVEL = 5` decidido pelo
  servidor. Hoje o Vínculo é um número e um gate.
- `petPassive` (traço de nascimento) — 5 traços, todos positivos, visível só em
  Estatísticas.
- `carePattern.ts` — Constante/Explosivo/Equilibrado como desempate de galho;
  nenhum é melhor; declara-se não-confiável com pouco histórico.
- `BranchForecast` na página de Evolução; evolução manual com cadeado
  (`evolutionLocked`).
- Chat idle a cada 3min (`/api/chat`, Groq llama-3.1-8b-instant), sem memória.
- Palco com 5 espaços (`petStage.ts`), 27 decorações + 19 cenários; troféus de
  season reais na vitrine.
- Degeneração por HP 0 — reversível, mas sem narrativa.

#### Lições da pesquisa
- **O ingrediente ativo do Tamagotchi effect não é realismo, é responsabilidade
  percebida** (relatório 02, §1). E o amplificador mais potente — e o de maior
  responsabilidade ética — é o canal de **fala** (efeito ELIZA).
- **Autocompaixão por procuração** (relatório 02): quem não consegue se tratar
  com gentileza consegue tratar o passarinho com gentileza. É a alavanca
  terapêutica do gênero e a razão do elogio nº 1 ao Finch ("não me faz sentir
  culpado").
- **Quase todo o vínculo do Soulmon hoje é mecânico** (relatório 04, §2): barras
  e galhos. O que os grandes têm a mais é **memória e reação** — o bicho que se
  vira quando você chega, que lembra, que tem manias. É onde há mais a ganhar
  por real investido.
- **A rota de redenção do V-Pet 97** (Numemon → Monzaemon, relatório 04): a
  forma-castigo tem saída nomeada. A degeneração vira capítulo, não punição.
- **O Buddy do Pokémon GO** dá *rostos e nomes de marco* ao vínculo — o `bond.ts`
  tem o número e não tem os marcos (relatório 04, rec. 2).
- **Tempo compartilhado é a métrica sentimental que o jogador cita** ("estou com
  ele há 8 meses") — Tamagotchi/Nintendogs (relatório 04, rec. 15).
- **Nunca permitir segundo pet simultâneo** (relatório 04, rec. 13): destruiria a
  tese "avatar da pessoa". Se houver coleção, que seja de **formas vividas** e
  sonhos, nunca de criaturas paralelas.
- **Fusão/Ultra como horizonte de endgame explícito** (relatório 04, rec. 16) —
  resolve o "e depois do mega?" que matou o Vital Bracelet.
- **Superjustificação** (relatório 02): recompensa externa por hábito já desejado
  corrói o motivo original. O antídoto é devolver **reflexão e atribuição
  interna** ("EU consegui"), não só progresso do bicho.

#### Recomendações

| # | P | Recomendação | Impacto × Esforço | Onde |
|---|---|---|---|---|
| V-1 | **P0** | **Memória curta no chat**: injetar no prompt um resumo de 3 linhas do estado (dias perfeitos recentes, `welcomeBack`/`daysAway`, evolução recente, `soulGoal`). Especificidade = contingência = vínculo. ⚠️ Humor pode alimentar **fala**, nunca pontuação | Muito alto × M | `functions/api/chat.js` + payload do `CompanionHUD` |
| V-2 | **P0** | **Criatura que se preocupa, não que sofre**: reescrever falas de HP baixo de "estou fraco" para "tô com saudade / como VOCÊ está?". Inverte vergonha → cuidado mútuo | Muito alto × P | falas + `chat.js` (system prompt) |
| V-3 | **P0** | **Marcos de Vínculo nomeados** (Conhecidos → Amigos → Melhores Amigos → Inseparáveis), cada um com micro-cerimônia e um comportamento novo do pet. Fiação sobre `bondLevelFor` — **sem persistir `bondLevel`** | Alto × M | `utils/bond.ts` (leitura) + `EvolutionPage`/HUD |
| V-4 | P1 | **Rota de redenção na degeneração**: caminho de volta nomeado, com forma que só existe por ele. Degeneração vira capítulo | Alto × M | `types/progression.ts` + `computeDailyReset` |
| V-5 | P1 | **Ritual de reencontro** (`welcomeBack`): cena dedicada, pet correndo até a tela, fala de saudade, **zero números negativos** | Alto × M | `DailyReportModal` + HUD |
| V-6 | P1 | **Traço de nascimento visível em comportamento**: Guloso come diferente, Madrugador boceja de manhã, menção rara na fala idle | Alto × M | `passives.ts` (leitura) + HUD |
| V-7 | P1 | **Álbum de formas vividas** — sprite de cada forma que o pet já foi, com datas. Os sprites já ficam no acervo | Alto × M | `spriteLibrary.ts` + tela de jornada (5.2) |
| V-8 | P1 | **Idade e aniversário do pet** — data de nascimento no reveal; comemoração mensal/anual | Médio × P | `GameState` + virada (`playerDay`) |
| V-9 | P1 | **O pet testemunha a tarefa assombrada concluída** ("essa estava te pesando, né?") | Alto × P | conclusão + falas |
| V-10 | P2 | **Micro-comportamentos idle no palco** (3–5): cochilar, olhar a decoração equipada, reagir ao cenário. Fecha o loop decoração → afeto | Médio × M | `petStage.ts` + HUD |
| V-11 | P2 | **Antecipação do galho**: silhueta/borrão da próxima forma no `BranchForecast` — "o que ele vai virar?" é o gancho nº 1 do gênero | Alto × P | `BranchForecast` (filtro CSS sobre sprite gerado) |
| V-12 | P2 | **Diário de 1 linha opcional** no check-in, que o pet relembra dias depois ("semana passada você escreveu que…") | Médio × M | `rituals.ts` + `chat.js` |
| V-13 | P2 | **`soulGoal` na cerimônia de evolução** ("você disse que queria X — olha quem crescemos por causa disso") | Alto × P | `EvolutionPage` |
| V-14 | P2 | **Sonhos que referenciam o dia** ("sonhei com aquele seu projeto") | Médio × M | `restWindow.ts` |
| V-15 | P2 | **Fusão/Ultra como horizonte declarado** na página de Evolução, sem detalhar como | Médio × P | `EvolutionPage` |
| V-16 | P2 | **Implementation intentions** (Gollwitzer): campo opcional "quando/onde?" ao escolher os 3 focos | Médio × M | check-in (`rituals.ts`) |
| V-17 | P2 | **Modo pausa/férias explícito** — "vou viajar/estou doente": o pet hiberna feliz, com carta na volta. Hoje o perdão de ausência cobre por acidente; tornar intencional | Alto × M | `dailyReset.ts` + Configurações |
| V-18 | P2 | **Variação rara cosmética na geração** (o "shiny" do Soulmon): ~1 em N leituras rende paleta alternativa, declarada como "alma iridescente". Zero poder | Médio × M | `oracle.ts` / `composeSpritePrompts` |

⚠️ **Responsabilidade do canal ELIZA** (relatório 02, rec. 17): com memória e
personalidade, o chat fica mais convincente. Duas obrigações que acompanham V-1:
disclaimer gentil ("o Soulmon é um companheiro, não tratamento") e ponte para
ajuda (CVV 188 no PT-BR) se o chat detectar sofrimento agudo.

---

### B.6 Monetização e paywall

#### Estado atual
- Billing **server-authoritative**: `accountTier`/`credits` em `ent:<saveId>`;
  `claimOrder` + `obfuscatedExternalAccountId` fecham clone de recibo. Testado.
- Catálogo: `soulmon.unlock.full` (R$ 29,90, não consumível) + 3 packs de
  Créditos (R$ 4,90 / 9,90 / 19,90).
- Três moedas com fronteira testada; **não existe Bits→Créditos**.
- Créditos gastam em reroll (50), cura instantânea (10) e troca por Bits (1:10).
- `UnlockNudge` em **3 pontos** contextuais (`CreateModal` ao bater o cap,
  `EditModal` — que era o furo do cap —, `EvolutionPage` de quem tem
  `demoCharacterId`) e **nunca abre sozinho**.
- Anúncios desligados por padrão; endpoint recusa creditar sem SSV.

#### Lições da pesquisa (relatório 06, salvo indicação)
- **Diagnóstico: soft paywall contextual puro.** Eticamente exemplar, com dois
  buracos — (a) ninguém descobre que existe algo pago antes de esbarrar no cap, e
  a maioria nunca esbarra; (b) compra única não cobre custo recorrente de IA
  (Groq + Higgsfield escalam com DAU).
- **O comparável certo é o Finch, não o Duolingo.** Finch: US$ 30M ARR, Plus
  majoritariamente cosmético, ferramentas de autocuidado grátis, sem ads.
  Duolingo monetiza a fricção que ele mesmo cria (corações infinitos) — o dark
  pattern que o Soulmon jurou não ter.
- **Paywall após value moment = 2,1× trial starts**; trial de 7 dias é a maior
  alavanca isolada (+38–52%); **decisões estruturais valem ~2× mais que copy**.
- **Venda o resultado, não a feature; um preço, uma decisão** (relatório 01,
  lições 5 e 6).
- **A recusa precisa ter saída** (relatório 01, lição 8) — já feito nos 3 pontos.
- **Reroll → "Nova Leitura"** (relatório 04, rec. 14): reposicionar como refazer
  o ritual, não girar um sorteio. Resolve fantasia **e** o risco ECA Digital
  (Lei 15.211/2025) apontado em "Depende do dono".

#### Recomendações

| # | P | Recomendação | Impacto × Esforço | Onde |
|---|---|---|---|---|
| M-1 | **P0** | **Aba "Apoie o Soulmon" na Loja** (unlock + packs + assinatura, quando existir). Loja é onde o usuário já está em mentalidade de troca — descoberta sem interrupção | Alto × M | `ShopModal` / `utils/shop.ts` |
| M-2 | **P0** | **Copy de resultado, não de tecnologia** — PT: "Seu Soulmon cresce porque você cresce. Faça dele algo só seu." + "Pagar nunca deixa sua criatura mais forte. Não tem como." (ativo de marketing, não rodapé) | Alto × P | `UnlockAccountModal` (EN base + PT) |
| M-3 | **P0** | **Instrumentar o funil de oferta** (nudge-mostrado / nudge-tocado / compra-verificada, por origem) antes de qualquer otimização | Alto × M | telemetria (seção F) |
| M-4 | P1 | **Primeira oferta proativa no `DailyReportModal` do 1º dia perfeito** — "Seu Soulmon cresceu porque você cresceu". Nunca no onboarding, nunca no reveal | Alto × M | `DailyReportModal` |
| M-5 | P1 | **Cap de frequência: 1 apresentação proativa por semana**; recusa não repete no mesmo dia (`lastNudgeDay` no save, via `playerDayKey`) | Alto × P | `App.tsx` + `playerDay.ts` |
| M-6 | P1 | **Reposicionar o reroll como "Nova Leitura"** (refaz o ritual; seed derivada das respostas em vez de `Math.random()`) | Alto × M | `oracle.ts` + `monetization.ts` |
| M-7 | P1 | **Revisar a cura instantânea por 10 Créditos** — é a única peça que flerta com "monetizar a dor". Ou remover, ou limitar a 1/semana e reenquadrar como presente do pet | Alto × P | `monetization.ts` — **decisão do dono** |
| M-8 | P2 | **Assinatura "Soulmon Vínculo"** ao lado do vitalício (~R$ 14,90/mês, ~R$ 79,90/ano exibido como "R$ 6,60/mês"), com **Créditos recorrentes por dentro** (ex.: 60/mês) — amarra o custo variável de IA a receita recorrente. **Nada de progresso** | Alto × G | billing + `_entitlements.js` — **decisão do dono** |
| M-9 | P2 | **Trial "do jeito Soulmon"**: 7 dias oferecidos como *presente do pet* após o 3º dia perfeito, com lembrete honesto antes de cobrar | Médio × G | idem |
| M-10 | P2 | **Reprecificar o vitalício** (R$ 49,90–69,90) ou mantê-lo como "oferta de lançamento" com data real — **nunca timer falso que reseta** | Médio × P | catálogo — **decisão do dono** |
| M-11 | P2 | **Botão de fechar visível no primeiro frame** de todo paywall; "Já sou apoiador" sempre presente | Médio × P | `UnlockAccountModal` |

⚖️ **Arbitragem — assinatura vs. essência.** O relatório 06 propõe assinatura;
`PLANO-EVOLUCAO` (Princípio 1) exige que dinheiro real compre só conveniência,
cosmético e identidade, e (Princípio 4) que o jogo siga íntegro com o backend
morto. **Decisão: assinatura é admissível, com três travas** — (a) nenhum item
da assinatura toca progressão, HP, escudos, evolução ou vantagem em
Torneio/PvP; (b) o cancelamento não remove nada já obtido nem trava o save; (c)
o conteúdo é cota de IA + cosméticos + estatísticas. **É decisão do dono**, e
fica listada na seção H.

---

### B.7 Retenção e win-back

#### Estado atual
- Push em **dois canais** (Web Push VAPID + FCM), mesma KV, mesmo cron
  (`workers/push-scheduler.js`, deploy manual com `wrangler deploy`).
- Pushes existentes: ~30 min antes do tick de cocô (**só se o tick for cobrar**),
  `sleepReminderAt` (30 min antes de deitar), um diário.
- Widget Android existe (`WidgetRenderer.kt`), overlay Electron também.
- `welcomeBack` + `daysAway` + `ABSENCE_FORGIVENESS_DAYS` já implementam o
  perdão de ausência; a UI do reencontro é discreta.
- Live-ops: só a Rodada do Torneio (sex–dom).
- **Zero telemetria.**

#### Lições da pesquisa
- **Os três eixos de retenção estrutural** (relatório 07, §8): *hábito* (push +
  widget existem, genéricos → médio); *investimento* (pet único do Oráculo,
  evolução, sonhos, troféus → **o eixo mais forte do produto**); *conteúdo*
  (só o Torneio → **o eixo mais fraco**, é onde o D30/D90 morre).
- **O primeiro fracasso é o provável maior ponto de churn** — mesmo com teto de
  1 coração, ver o pet "pior por sua causa" dói. Mitigação existe; falta medir.
- **Tom sempre Finch, nunca Duolingo-guilt.** O "Você abandonou o Duo 😢"
  funciona lá por ser meme; aqui quebraria a essência.
- **Auditar a copy dos pushes contra a régua** (relatório 01, lição 15): toda
  notificação é o PET falando algo que ajuda, nunca o app cobrando.
- **Win-back tem fim**: D5–D7 ("guardou uma surpresa" — e **entregar** de
  verdade), D14 ("sem cobrança: ele está bem e sente saudade") e depois disso
  **silêncio**.
- **Com <~1.000 usuários ativos, A/B é fantasia** (relatório 07, §7). Sequência
  certa: telemetria → 5 entrevistas moderadas + pós-churn → fake doors → A/B só
  acima de 2–3k por braço.
- **Sessões curtas por meses > sessões longas por semanas** (relatório 01, lição
  17; Princípio 7 do plano). **Tempo de sessão é anti-indicador.**

#### Recomendações

| # | P | Recomendação | Impacto × Esforço | Onde |
|---|---|---|---|---|
| R-1 | **P0** | **Instrumentar os ~20 eventos** da seção F — pré-requisito de tudo o mais | Muito alto × M | novo `utils/telemetry.ts` |
| R-2 | **P0** | **Deduplicar Web Push × FCM por `saveId`** no scheduler — push dobrado é a via mais rápida para o opt-out | Alto × P | `workers/push-scheduler.js` |
| R-3 | **P0** | **Auditoria de copy de todos os pushes** contra a régua "o pet ajuda, o app não cobra" — e garantir EN + PT (`resolveLanguage`) | Alto × P | `workers/push-scheduler.js`, `webpush.js`, `fcm.js` |
| R-4 | P1 | **Calendário de re-engajamento** (tabela abaixo), máx. 1 push de campanha/dia | Alto × M | scheduler |
| R-5 | P1 | **Win-back D5–D7 com recompensa entregue de verdade** (coraçãozinho ou sonho) — promessa cumprida | Alto × M | scheduler + `App.tsx` |
| R-6 | P1 | **Tela de reencontro** pós-ausência com lembrança do período fora | Alto × M | `DailyReportModal` |
| R-7 | P1 | **Fresh start como convite caloroso**, não botão administrativo ("bora recomeçar juntos?") | Médio × P | `rituals.ts` UI |
| R-8 | P1 | **Push de quase-marco** ("amanhã seu hábito X completa 7 dias") | Médio × P | scheduler |
| R-9 | P2 | **Live-ops semanal leve**: 1 "visita especial" rotativa na masmorra. FOMO saudável = perder é **não ganhar algo extra**, nunca perder algo que já se tem | Alto × G | `dungeon.ts`, `dungeonScenes.ts` |
| R-10 | P2 | **Seasons de torneio com troféus permanentes** (as vitrines já existem) | Alto × G | `tournamentSeason.ts` |
| R-11 | P2 | **Rotação mensal de cenários/sonhos** — o conserto do eixo de conteúdo (D90) | Alto × G | `backgrounds.ts`, `DREAM_CATALOG` |
| R-12 | P2 | **"Memórias" aos 30/90 dias** — retrospectiva do que fizeram juntos | Alto × M | tela de jornada |
| R-13 | P2 | **5 entrevistas moderadas + entrevistas pós-churn** — mais valioso que qualquer A/B hoje | Muito alto × M | fora do código |
| R-14 | P2 | **Notificação rica com sprite do pet** (FCM suporta imagem) | Médio × M | `workers/fcm.js` |
| R-15 | P2 | **Vizinhança do jogador (±5) no ranking global** em vez do topo-10 | Médio × P | `Torneio` |

**Calendário de re-engajamento** (tom Finch em todos):

| Momento | Push | Tom |
|---|---|---|
| D1 ~19h | "\<pet\> aprendeu a fazer uma coisa nova hoje. Quer ver?" | curiosidade |
| D2 sem abertura | "\<pet\> sonhou com você esta noite" (+ 1º sonho garantido) | afeto |
| Diário (existente) | nome do pet + 1 fato do dia | contexto |
| 30 min antes do tick de cocô | manter — único push "urgente" legítimo | prático |
| `sleepReminderAt` | manter | gentil |
| Sexta (abre o Torneio) | "A arena abriu! \<pet\> está aquecendo" | evento |
| Segunda (fresh start + alívio) | "Semana nova, +meio coração de presente. Recomeço sem dívida." | perdão |
| D5–D7 ausente | "\<pet\> guardou uma surpresa pra quando você voltar" — **e entregar** | promessa cumprida |
| D14 ausente (último) | "Sem cobrança: \<pet\> está bem e sente saudade. O save te espera." | fecho digno → silêncio |

---

## C. DON'Ts consolidados — dark patterns e linhas vermelhas

### C.1 Travado por teste (remover o teste é remover o produto)

1. **Streak que zera** — `habitRhythm.ts`; a constância é "N das últimas 7".
2. **Recompensa por contagem de tarefas** — a meta é ponderada por esforço
   (`dailyGoal.contract.test.ts`), contra o exploit do Karma do Todoist.
3. **Humor alimentando pontuação** — há teste rodando a virada com e sem humor
   ruim e exigindo resultado idêntico.
4. **Score de sono / punição por sono ruim / função que devolve número que
   diminui** na Janela de Descanso; noite sem registro é neutra.
5. **Traço de nascimento negativo** — todos os passivos são positivos.
6. **Emblemas comprando vantagem** — a aba do Torneio é 100% cosmética.
7. **Bits → Créditos** — permitir farmar créditos anularia o dinheiro real.
8. **Ranking absoluto antes das faixas**; acumular pontos nunca rebaixa.
9. **Fresh start apagando progresso** — `applyFreshStart` sequer toca em
   evolução, `perfectDays`, marcos ou sonhos.
10. **Multiplicador de tier < 1** — esforço antigo vale mais, nunca menos.
11. **`bondLevel` persistido no save** — é sempre derivado (`bondLevelFor`).
12. **Sufixo fixo de nome tipo "-mon"** e qualquer arte de terceiro no bundle.

### C.2 Linhas vermelhas de produto (não travadas por teste — travadas por tese)

13. **Nunca cobrar da barra de cuidado por conteúdo** (masmorra, torneio, PvP).
14. **Nunca vender**: evolução, `perfectDays`, HP irrestrito, escudos, conclusão
    de tarefa, "pular o dia", remoção de consequência criada pelo próprio jogo,
    vantagem em Torneio/PvP, Glitchtama. **Nunca ads intersticiais.**
15. **Nunca vender proteção contra punição** (freeze comprável): vender proteção
    cria incentivo comercial para a punição existir — o conflito de interesse
    estrutural do Duolingo, que o Soulmon não tem e não deve adquirir.
16. **Nunca conteúdo aleatório vendido**; se um dia houver, publicar as
    probabilidades (Princípio 2).
17. **Nunca notificação de culpa ou medo** ("ele está morrendo sem você"), nunca
    a voz do pet usada para cobrar, nunca estado negativo no widget (no máximo
    "com saudade").
18. **Nunca escassez artificial com janela de horas** — janela de DIAS ou nada.
19. **Nunca segundo pet simultâneo.** Coleção é de formas vividas e sonhos.
20. **Nunca mostrar contagem de dias NÃO perfeitos** — perfeccionistas e pessoas
    com TDAH leem "não perfeito" como fracasso.
21. **Nunca streak social recíproco** (modelo Snapchat) nem accountability com
    prazo entre amigos.
22. **Nunca importar sinal inferido** (passos, tempo de tela, geolocalização,
    Google Fit). O sinal do Soulmon é declarado (Princípio 6).
23. **Nunca chamar a degeneração de morte**; sempre reversível, nunca por pagamento.
24. **Nunca bloquear ação com `isOvercommitted`** — é aviso; se quiser barrar, o
    certo é mudar o TEXTO, não a permissão.
25. **Nunca coletar em telemetria**: texto de tarefas, `soulGoal`/`soulStruggle`,
    respostas psicométricas, dados de nascimento, humor individual, e-mail.
26. **Nunca "o usuário passou muito tempo no app" como métrica de sucesso**
    (Princípio 7). Tempo de sessão é anti-indicador.

### C.3 Conflitos entre relatórios — decisões registradas

| # | Conflito | Decisão | Argumento perdedor |
|---|---|---|---|
| 1 | Paywall no reveal (rel. 01) × não cobrar ali (rel. 05, 06) | **Não cobrar no reveal.** Value moment = 1º dia perfeito | O quiz longo cria investimento e "seu plano está pronto" é o padrão mais documentado da categoria; reconsiderar só com dado de conversão < 1% |
| 2 | "Dias juntos" reintroduz streak? (rel. 03 × regra do CLAUDE.md) | **Admissível**: monotônico por construção, não pode zerar | — |
| 3 | Assinatura recorrente (rel. 06) × Princípios 1 e 4 do plano | **Admissível com 3 travas** (nada de progresso; cancelar não remove nada; conteúdo = IA + cosmético). Decisão do dono | Compra única não cobre custo recorrente de IA — o problema é real, a solução precisa do dono |
| 4 | Memória do humor no chat (rel. 04) × "humor nunca vira score" | **Permitido**: alimentar FALA não é alimentar pontuação. O teste da virada continua valendo intacto | — |
| 5 | Compartilhamento social (rel. 01, 03) × comparação tóxica (rel. 02) | **Só identidade, nunca posição.** Nenhum card exibe ranking ou percentil | — |
| 6 | Reveal antes do teste longo (rel. 07) × bifurcação sem volta (rel. 05/CLAUDE.md) | **Manter a bifurcação como está**; medir primeiro (`onboarding_long_test`). Reordenar o ritual sem dado é caro e difícil de desfazer | Se o teste de 20 itens matar >30% do funil, reordenar vira P0 |
| 7 | Cura instantânea por Créditos (existente) × "não monetizar a dor" (rel. 02, 06) | **Rever** (M-7): remover ou limitar a 1/semana como presente do pet. Decisão do dono | Receita marginal; a peça já está no código |

### C.4 Lacunas declaradas desta rodada

- **ASO e aquisição paga**: nenhum relatório cobriu. Recomendações de descoberta
  aqui são orgânicas por padrão.
- **Som e música**: ausente da rodada, e é uma alavanca conhecida de vínculo.
- **QA com usuários reais**: só apareceu como recomendação (R-13), não como dado.
- **Mercado LATAM/preço no Brasil**: benchmarks de preço são majoritariamente
  US/EU; a reprecificação (M-10) precisa de dado local. *(Parcialmente
  respondido na rodada 2 — ver I.5: preço regionalizado agressivo para o Brasil
  aparece como prática JUSTA, não como desconto.)*
- *(As lacunas acima seguem abertas depois da rodada 2, exceto onde marcado. As
  transcrições não tocaram ASO, som, nem QA com usuário real — ver I.6.)*

---

## D. Dicas e estratégias secretas

As táticas menos óbvias dos relatórios — o que um leitor apressado não extrairia.

1. **O streak tem quatro mecanismos, e três são de graça.** Número legível que
   cresce, identidade/orgulho e presença visual diária **não dependem de
   punição**. Só o quarto (medo de perder) depende — e é o único que o Soulmon
   recusa. Copiar três de quatro é copiar o que funciona. *(rel. 03)*

2. **Prestígio que só some não pune.** O Perfect Streak do Duolingo mostra que dá
   para ter uma camada de status inteira cuja "punição por falhar" é apenas
   voltar ao visual normal. Sem toast, sem texto, sem perda — e mesmo assim as
   pessoas se esforçam para mantê-la. *(rel. 03 → H-4)*

3. **Widget é push que não incomoda.** Finch e Duolingo reportam widget "tão
   eficaz quanto push" para retenção, e o do Finch funciona por um motivo
   específico: mostra o pet **personalizado**, com as roupas e decoração do
   usuário. Widget genérico não retém; widget que é o *seu* bicho, sim. *(rel.
   03, 07)*

4. **O momento de pedir permissão é depois de um valor, nunca antes.** Duolingo
   pede push **depois** de o usuário fixar a meta diária, com uma tela-primer
   própria antes do prompt do sistema. Aceitação sobe e o prompt do SO não
   queima. *(rel. 05)*

5. **Personalização percebida vale tanto quanto personalização real.** Noom e
   Cal AI entregam o mesmo conteúdo apresentado como "seu plano" e cobram mais.
   O Soulmon tem a personalização real e a esconde: o traço de nascimento mora
   em Estatísticas. Uma fala idle ocasional ("sou guloso mesmo…") custa zero e
   multiplica o "é O MEU bichinho". *(rel. 01, 04)*

6. **A rota de redenção do V-Pet 97.** Numemon — a "forma-castigo" — cuidado
   perfeitamente vira **Monzaemon**, o Ultimate mais fofo, em janela de 48h. O
   bicho ruim não é um beco; é um retrato com saída. E os care mistakes **zeram
   na evolução**: cada estágio é uma página nova, o passado não persegue. *(rel.
   04 → V-4)*

7. **Antecipação retém mais que recompensa.** "O que ele vai virar?" é o gancho
   nº 1 do gênero monster taming. Uma silhueta borrada da próxima forma custa um
   filtro CSS sobre sprite já gerado. *(rel. 04 → V-11)*

8. **Tempo compartilhado é a métrica sentimental que o jogador cita.** Ninguém
   diz "tenho 340 pontos"; dizem "estou com ele há 8 meses". Data de nascimento
   + aniversário é um campo e uma checagem na virada. *(rel. 04 → V-8)*

9. **Escassez que não tira nada.** FOMO saudável = perder um evento significa
   **não ganhar algo extra**, jamais perder algo que já se tem. Toda live-ops do
   Soulmon precisa passar por esse teste. *(rel. 07 → R-9)*

10. **Prometer e entregar no win-back.** Um push que diz "\<pet\> guardou uma
    surpresa" só funciona uma vez se a surpresa não existir — e destrói a
    confiança. Se prometer, **entregar de verdade** (coraçãozinho, sonho). *(rel.
    07 → R-5)*

11. **Silêncio é uma decisão de design.** `stackingSuggestion` devolve `null` sem
    dados suficientes, e essa é a metade importante: conselho desacreditado não
    volta a ser acreditado. Vale para toda sugestão futura do app. *(CLAUDE.md,
    reforçado pelo rel. 02)*

12. **Reação específica > reação genérica.** O ELIZA effect mostra que a projeção
    do usuário faz o trabalho pesado — mas ela precisa de um gancho contingente.
    Três linhas de contexto no prompt do Groq ("voltou depois de 3 dias",
    "virou champion na semana passada") valem mais que qualquer sprite novo.
    *(rel. 02, 04 → V-1)*

13. **Inverter vergonha em cuidado mútuo.** "Estou fraco" produz vergonha, e
    vergonha motiva fuga (desinstalar), não reparação. "Tô com saudade — como
    VOCÊ está?" produz cuidado. É uma reescrita de strings com efeito de
    retenção. *(rel. 02 → V-2)*

14. **Vender proteção é comprar um conflito de interesse.** No momento em que a
    proteção contra punição vira produto, a empresa passa a ter incentivo
    comercial para a punição existir. É estrutural, não uma questão de tom.
    *(rel. 03)*

15. **Enquadrar a compra como apoio converte melhor que enquadrar como poder** —
    neste público. O Finch chegou a US$ 30M ARR com Plus majoritariamente
    cosmético. *(rel. 06 → M-2)*

16. **A recusa precisa ter saída.** Quando o app diz não (cap do demo), a tela do
    "não" é onde o convite deve estar — foi exatamente o buraco que `24870bf7`
    fechou no `EditModal`. Dead-end é churn. *(rel. 01)*

17. **O método Mobbin, em uma frase:** nenhuma tela nova nasce do zero — nasce da
    comparação de como 10 apps de topo resolveram o mesmo problema. Antes de
    desenhar o próximo paywall/check-in/empty state, abrir a categoria
    correspondente e comparar 5+ apps. *(rel. 01)*

18. **Wireframe antes de visual.** A "Emotional Integration" (animações e
    momentos de pico) é uma **etapa própria** do processo, não um polimento
    final. Os 3 momentos de pico do Soulmon (marco, tarefa assombrada, evolução)
    valem mais que qualquer tela nova. *(rel. 01 → H-6)*

19. **Com poucos usuários, A/B é teatro.** A sequência que produz aprendizado
    real: telemetria descritiva → 5 entrevistas moderadas → fake doors → A/B só
    acima de 2–3k por braço. *(rel. 07)*

20. **Escolha a métrica-farol que mede a promessa, não o vício.** Tarefas
    concluídas por usuário ativo/dia (ponderadas por esforço). Quem abre 3× e
    conclui 1 está **pior** que quem abre 1× e conclui 5. *(rel. 07)*

---

## E. Roadmap consolidado

> 📋 **A execução deste roadmap vive em `docs/PLANO-MELHORIAS.md`** — hoje
> **87 pacotes** (eram 36 quando esta linha foi escrita; as rodadas 3 e 4
> acrescentaram o resto), com o estado de cada um em
> `docs/plano-melhorias/LEDGER.md`. Dois itens abaixo estavam **errados** à luz
> do código e foram corrigidos lá (#1 e #14, marcados).
>
> ⚠️ **06/09/2026 — o que este parágrafo listava como "o que nenhum relatório
> viu" já foi RESOLVIDO, e deixar a lista no presente faria alguém procurar
> defeito que não existe mais:** `daysToEvolve` morto foi apagado (WP4.1);
> ultra por degeneração deixou de ser o único caminho (WP4.2 — hoje são
> coleção OU permanência); o Vínculo sem recompensa após o nível 13 e as
> estações que expiravam entraram nos WP4.3/WP4.16; e os Bits esgotando em
> D15–D23 ganharam sumidouro recorrente (WP4.5). O que segue aberto está no
> LEDGER, não aqui.

Deduplicado entre os sete relatórios. Ordenado por prioridade e, dentro dela, por
impacto ÷ esforço.

### P0 — a onda que destrava as outras

| # | Item | Impacto × Esforço | Dono / arquivo provável | Origem |
|---|---|---|---|---|
| 1 | ~~Instrumentar os ~20 eventos de telemetria~~ **CORRIGIDO no `PLANO-MELHORIAS.md`**: a telemetria já existe (10 eventos em `src/utils/telemetry.ts` + `functions/api/metrics.js`); o que falta é `METRICS_ADMIN_KEY` (leitura) e a coorte de retenção (decisão do dono) → WP0.1/WP0.2 | Muito alto × P | `metrics.js`, Pages env | 07, plano |
| 2 | Sprite no REVEAL do Oráculo | Muito alto × P/M | `SoulmonOnboarding.tsx` | 05 |
| 3 | Reveal cerimonial (silhueta → flash → sprite) | Alto × M | `SoulmonOnboarding.tsx`, `index.css` | 05, 01 |
| 4 | Checklist D0 (<1 min: carinho, 1 hábito, 1ª barra) + check-in não dispara no D0 | Muito alto × M | `App.tsx`, `utils/rituals.ts` | 01, 07 |
| 5 | Templates de 3 hábitos derivados do `soulGoal` | Muito alto × M | `utils/taskSuggestions.ts` | 07 |
| 6 | Widget = janela do pet (sprite + humor + "2/4 hoje") | Muito alto × M | `WidgetRenderer.kt`, `DigiWidgetPlugin` | 03, 07 |
| 7 | Memória curta no chat (3 linhas de contexto no prompt) | Muito alto × M | `functions/api/chat.js` | 02, 04 |
| 8 | Falas de HP baixo: "estou fraco" → "tô com saudade / como você está?" | Muito alto × P | falas + `chat.js` | 02 |
| 9 | Auditoria de copy dos pushes + dedup Web Push × FCM por `saveId` | Alto × P | `workers/push-scheduler.js` | 01, 07 |
| 10 | Marcos de Vínculo nomeados (4–5, com micro-cerimônia) | Alto × M | `utils/bond.ts` (derivado), `EvolutionPage` | 04 |
| 11 | `soulGoal` ecoado no reveal | Alto × P | `SoulmonOnboarding.tsx`, `oracle.ts` | 05 |
| 12 | Anel de constância + contador lifetime "dias juntos" | Alto × M | home, `GameState`, widget | 03 |
| 13 | Aba "Apoie o Soulmon" na Loja + copy de resultado no `UnlockAccountModal` | Alto × M | `ShopModal`, `UnlockAccountModal` | 06, 01 |
| 14 | ~~1ª evolução alcançável em ≤5 dias~~ **CORRIGIDO no plano**: já é 4 dias perfeitos — `daysToEvolve` (10/20/30/40) é dado morto e o gate real é `.required` (4/5/5/6); o problema é o oposto, a árvore acaba em 14 dias → WP4.1 (decisão D5) | Alto × M | `types/progression.ts`, `App.tsx` `handleEvolve` | 07, plano |

> **Corte deliberado do P0:** a onda acima tem 14 itens porque cobre 7 etapas da
> jornada; se for preciso reduzir a uma sprint, os **sete** que valem sozinhos
> são **1, 2, 4, 5, 6, 7, 8** — telemetria, o reveal que revela, a primeira
> sessão, o widget e a voz do pet. **Ficou de fora do P0 de propósito**: toda
> mudança estrutural de monetização (assinatura, trial, preço), toda live-ops
> nova, o modo cooperativo (4.3 do plano) e a arte de decoração (5.1) —
> nenhum deles se decide sem dado ou sem o dono.

### P1 — depois que houver dado

| # | Item | Impacto × Esforço | Dono / arquivo provável | Origem |
|---|---|---|---|---|
| 15 | Animar os 3 momentos de pico (marco, assombrada, evolução) | Alto × M | `index.css`, componentes | 01, 03 |
| 16 | Selo "Em ritmo" (Aura) — brilho que só some | Alto × M | `petStage.ts` | 03 |
| 17 | Ritual de reencontro (`welcomeBack`) com cena dedicada | Alto × M | `DailyReportModal`, HUD | 02, 03, 07 |
| 18 | Win-back D5–D7 com recompensa entregue de verdade | Alto × M | scheduler + `App.tsx` | 07 |
| 19 | Rota de redenção na degeneração | Alto × M | `types/progression.ts`, `dailyReset.ts` | 04 |
| 20 | Traço de nascimento visível em comportamento | Alto × M | `passives.ts`, HUD | 04, 01 |
| 21 | Álbum de formas vividas (sprites + datas) | Alto × M | `spriteLibrary.ts`, jornada | 04 |
| 22 | Pet testemunha a tarefa assombrada concluída | Alto × P | falas | 04 |
| 23 | Feedback incremental nas 6 perguntas do Oráculo | Alto × M | ritual do Oráculo | 05 |
| 24 | Card compartilhável (evolução / mês) | Alto × M | novo `utils/shareCard.ts` | 01, 03, 04 |
| 25 | Oferta proativa no 1º dia perfeito + cap de 1/semana | Alto × M | `DailyReportModal`, `playerDay.ts` | 06 |
| 26 | Reroll → "Nova Leitura" (seed derivada das respostas) | Alto × M | `oracle.ts`, `monetization.ts` | 04, 06 |
| 27 | Sonho garantido na 1ª noite | Alto × P | `restWindow.ts` | 07 |
| 27a | **Experimento `REST_SHIELD_MAX` 3 → 2**, medindo retorno após ausência | Alto × P | `types/taskModel.ts` | **08 · I.1.1** |
| 27b | **Prestígio cosmético por hábito levado sem escudo gasto** (modelo Perfect Streak) | Alto × M | `habitRhythm.ts`, `EvolutionPage` | **08 · I.3.1** |
| 27c | **Botão do check-in vira compromisso ativo** ("Assumir minha meta" / "Commit to my goal", PT+EN) | Alto × PP | `rituals.ts`, modal de check-in | **08 · I.3.2** |
| 27d | **Celebração de marco INTERROMPE o fluxo** (háptico + animação rica; complexidade reservada aos marcos) | Alto × M | `index.css`, componentes | **08 · I.3.3** |
| 27e | **Descrição do Oráculo diz de ONDE a criatura veio, não COMO ela se comporta** | Médio × P | `oracle.ts`, reveal | **08 · I.3.4** |
| 28 | Aniversário e idade do pet | Médio × P | `GameState`, virada | 04 |
| 29 | Marcos intermediários de celebração (21→66) via `totalDone` | Médio × P | falas | 03 |
| 30 | Push de quase-marco + fresh start como convite | Médio × P | scheduler, `rituals.ts` | 03, 07 |
| 31 | Micro-posse no demo (variação de paleta) | Médio × M | `DEMO_PICK` | 05 |
| 32 | Marcos no teste longo + reframe da bifurcação | Médio × P | `REFINE_OFFER` | 05 |
| 33 | Selo de Foco do dia visível no palco | Médio × P | `petStage.ts` | 03 |

### P2 — profundidade e conteúdo

| # | Item | Impacto × Esforço | Dono / arquivo provável | Origem |
|---|---|---|---|---|
| 34 | Rotação mensal de cenários/sonhos (conserto do eixo de conteúdo) | Alto × G | `backgrounds.ts`, `DREAM_CATALOG` | 07 |
| 35 | Live-ops semanal (visita especial rotativa na masmorra) | Alto × G | `dungeon.ts`, `dungeonScenes.ts` | 07 |
| 36 | Seasons de torneio com troféus permanentes | Alto × G | `tournamentSeason.ts` | 07 |
| 37 | "Memórias" aos 30/90 dias | Alto × M | tela de jornada | 07 |
| 38 | 5 entrevistas moderadas + pós-churn | Muito alto × M | fora do código | 07 |
| 39 | Micro-comportamentos idle no palco | Médio × M | `petStage.ts`, HUD | 04 |
| 40 | Antecipação do galho (silhueta no `BranchForecast`) | Alto × P | `BranchForecast` | 04 |
| 41 | Modo pausa/férias explícito | Alto × M | `dailyReset.ts`, Configurações | 02 |
| 42 | Diário de 1 linha + implementation intentions no check-in | Médio × M | `rituals.ts`, `chat.js` | 02, 03 |
| 43 | `soulGoal` na cerimônia de evolução | Alto × P | `EvolutionPage` | 02, 03 |
| 44 | Permission priming de push contextual (fora do onboarding) | Médio × M | `notifications.ts` | 05 |
| 45 | REGISTER em 2 momentos (batismo no reveal) | Médio × M | `SoulmonOnboarding.tsx` | 05 |
| 46 | Variação rara cosmética na geração ("alma iridescente") | Médio × M | `oracle.ts` | 04 |
| 47 | Escudos como "cobertinhas" + minigráfico de 28 dias | Médio × P | `DailyReportModal`, semanal | 03 |
| 48 | Vizinhança ±5 no ranking; nunca percentual cru de constância | Médio × P | Torneio, UI | 01, 03 |
| 49 | Notificação rica com sprite (FCM) | Médio × M | `workers/fcm.js` | 07 |
| 50 | Fusão/Ultra como horizonte declarado | Médio × P | `EvolutionPage` | 04 |
| 51 | Intro com prova (3 criaturas reais animadas) | Médio × P | `SoulmonOnboarding.tsx` | 05, 01 |

### P3 — depende do dono ou de decisão externa

| # | Item | Por que não é técnico | Origem |
|---|---|---|---|
| 52 | Assinatura "Soulmon Vínculo" + Créditos recorrentes | Decisão de receita e de posicionamento; exige as 3 travas de C.3 #3 | 06 |
| 53 | Trial de 7 dias como presente do pet | Idem | 06 |
| 54 | Reprecificar o vitalício (ou declarar oferta de lançamento com data real) | Idem; falta dado de preço LATAM | 06 |
| 55 | Rever a cura instantânea por 10 Créditos | Já está em "Depende do dono" no plano | 02, 06, plano |
| 56 | Modo cooperativo leve (4.3 do plano) | Endpoint novo + esquema de grupo + decisão de moderação/abuso | plano |
| 57 | Arte real de decoração (5.1 do plano) | Não é código; `BRIEF-ARTE-DECORACAO.md` pronto, falta o gerador | plano |
| 58 | Licença de sprites / IP; risco ECA Digital do reroll | Jurídico | plano |
| 59 | Rodada de pesquisa faltante: ASO, som/música, mercado LATAM | Escopo não coberto (C.4) | — |

---

## F. Plano de telemetria mínimo

**Sem isto, tudo acima é hipótese.** Detalhamento completo no relatório 07, §3.

### Ferramenta
**PostHog Cloud** (free tier 1M eventos/mês, host EU, SDK web funciona no WebView
do Capacitor e no PWA) — escolhido por velocidade de insight. Alternativa já na
stack: **Cloudflare Analytics Engine** (custo ~zero, mas sem funil/coorte pronto,
exige SQL à mão). Migrar se o custo aparecer.

### Privacidade (LGPD + Data Safety da Play)
Identificar por **`saveId`** (hash), nunca e-mail. **Não coletar**: texto de
tarefas, `soulGoal`/`soulStruggle`, respostas psicométricas, dados de nascimento,
humor individual (só agregado e opt-in). Opt-out nas Configurações. Declarar na
Data Safety.

### Eventos

| Evento | Dispara | Propriedades |
|---|---|---|
| `onboarding_step` | cada passo do ritual | step_id, skipped |
| `onboarding_long_test` | bifurcação | accepted |
| `pet_revealed` | fim do reveal | duration_s, demo |
| `task_created` | criar tarefa/hábito | type, effort, schedule_kind |
| `task_completed` | concluir | type, effort, was_haunted, was_focus |
| `perfect_day` | virada com dia perfeito | janela de constância |
| `heart_lost` | virada com perda | hearts_after, cause (goal/poop) |
| `degeneration` | HP 0 | days_since_install |
| `evolution` | cerimônia | stage, days_since_install |
| `welcome_back` | retorno ≥2 dias | days_away |
| `checkin_done` | check-in | focus_count, mood_answered (bool) |
| `care_action` | carinho/comida/banho/dormir | kind |
| `layer3_used` | masmorra/torneio/dino/loja/sonhos | feature |
| `push_received` / `push_opened` | `sw.js` / abertura | campaign, hour, channel |
| `push_optout` | desativar push | — |
| `session_start` | abertura | source (push/widget/icon/direct) |
| `widget_tap` | deep link | — |
| `paywall_view` / `purchase` | billing | sku, origem do nudge |
| `error` | erro capturado | code |

> ⚠️ **A seção I.4 corrige este plano em cinco pontos** (fonte: Emily Greer,
> GDC): use **medianas**, não médias (jogo segue power law, não curva normal);
> **nenhum experimento de monetização é julgado antes de 30 dias** (o caso
> "Office Space" parecia +conversão em 10 dias e era −11% líquido em 30);
> atribua o usuário ao teste **quando ele toca o recurso**, não no login;
> exiba **tamanho de amostra** em todo gráfico de coorte; **eixo Y começa em
> zero**. E o método do aha moment (YC): medir o **achatamento da curva de
> coorte** sobre uma ação de valor real.

### Métrica-farol e guarda-corpos

**Farol: tarefas concluídas por usuário ativo/dia, ponderadas por esforço.** Mede
a promessa (executar a vida real de forma sustentada), não o vício.
**Tempo de sessão é anti-indicador.**

Derivadas: retenção D1/D7/D30 por coorte · taxa de dia perfeito · tempo até 1ª
evolução · churn condicional pós-`heart_lost` e pós-`degeneration` · CTR de push
por horário · retorno pós-`welcome_back` · DAU/MAU.

**Guarda-corpos — se piorarem, estamos otimizando dano:** aberturas/dia sem
conclusão de tarefa ↑ · churn pós-degeneração ↑ · `push_optout` ↑ · % de
respostas de humor negativas em dias de perda de coração ↑.

**Metas iniciais** (projeção, sem dado próprio): D1 ≥ 35% · D7 ≥ 18% · D30 ≥ 10%.
D1 < 20% ou D30 < 4% sustentado = problema estrutural, hora de rever rumo.

---

## G. Índice dos relatórios-anexo

Todos em `docs/guia-experiencia/`.

| # | Arquivo | Uma linha |
|---|---|---|
| 01 | `01-youtube-mobbin-timgabe.md` | 23 lições de design de produto dos canais Tim Gabe e Mobbin (onboarding, paywall, gamificação, leaderboards, momento Wrapped), cada uma mapeada para uma mecânica real do Soulmon — com o método declarado e os limites da coleta de fontes. |
| 02 | `02-tamagotchi-effect-psicologia.md` | Os mecanismos psicológicos do vínculo com criaturas virtuais (Tamagotchi effect, ELIZA, autocompaixão por procuração, SDT, Fogg), o que o quebra, os públicos vulneráveis e 17 recomendações éticas. |
| 03 | `03-gamificacao-streaks.md` | Como capturar os quatro mecanismos do streak sem importar a punição — Octalysis, benchmarks (Duolingo, Finch, Forest, Pokémon Sleep, Snapchat como caso-limite) e 22 recomendações priorizadas. |
| 04 | `04-monster-taming.md` | O que o gênero ensina sobre vínculo — V-Pet 97 (care mistakes, Numemon→Monzaemon), Monster Rancher (origem pessoal), shiny como raridade sem poder, Palworld como contraexemplo — e 17 recomendações. |
| 05 | `05-onboarding.md` | Mapa completo do ritual do Oráculo passo a passo (`SoulmonOnboarding.tsx` lido integralmente), 7 fricções diagnosticadas — a maior é "o reveal não revela" — e 18 recomendações priorizadas. |
| 06 | `06-paywall-monetizacao.md` | Auditoria do funil comercial (server-authoritative, 3 moedas, 3 nudges), benchmarks de assinatura 2025/2026, e 16 recomendações incluindo as linhas vermelhas publicáveis do que nunca vender. |
| 09 | `09-mobbin-dossie.md` | **Rodada 3 — Mobbin Pro.** 27 buscas, ~90 achados em 13 dossiês (revelação, gerando, D0, priming, mascote, marco, dex, prestígio, widget, retorno, oferta, card, social) + adendo de fluxos e estilo retrô + 8 decisões do dono (§16). Destrinchado pelos guardas em `docs/plano-melhorias/mobbin/`; consolidado na seção 13 do `PLANO-MELHORIAS.md`. |
| 08 | `08-transcricoes-notebooklm.md` | **Rodada 2 — a fonte primária mais forte do guia.** Respostas verbatim do NotebookLM às 16 perguntas de `00-PROMPTS-NOTEBOOKLM.md`, lendo as transcrições que o sandbox não alcança: streak do Duolingo com trechos literais e timestamp, motivos reais de abandono do v-pet, fronteira legítimo/abuso da aversão à perda, catálogo de dark patterns, checklist de monetização justa e armadilhas de métrica. Analisado na seção I. |
| 07 | `07-retencao-engajamento.md` | Benchmarks de retenção por categoria, mapa de churn com hipóteses testáveis, plano de telemetria de ~20 eventos, calendário de re-engajamento, e por que A/B é fantasia abaixo de 1.000 usuários. |

---

## H. Decisões que só o dono pode tomar

0. **`REST_SHIELD_MAX`: 3 ou 2?** *(novo na rodada 2 — ver I.1.1.)* O Duolingo
   mediu que o 3º escudo não entrega nada e treina ausência. O escudo do Soulmon
   é ganho por constância e gasto sozinho, o que não é a mesma peça — por isso é
   experimento, não correção. Mas é mudança de regra de jogo, e regra de jogo é
   decisão sua.
0b. **Onde é a linha de perdão do Soulmon?** *(ver I.1.2.)* Oito mecanismos de
   perdão foram decididos um a um, e nenhum documento pergunta o que ainda dói
   perder. A resposta não é punir — é nomear o que o produto protege como
   inviolável.

1. **Assinatura recorrente: sim ou não?** É a única resposta ao custo de IA que
   escala com DAU. Se sim, valem as 3 travas de C.3 #3.
2. **Preço.** Reprecificar o vitalício, mantê-lo como oferta de lançamento com
   data real, ou deixar como está.
3. **Cura instantânea por 10 Créditos** — manter, limitar a 1/semana como
   presente do pet, ou remover.
4. **Reroll pago sobre resultado aleatório** — risco ECA Digital (Lei
   15.211/2025). A recomendação técnica (M-6: "Nova Leitura" com seed derivada)
   resolve fantasia e risco de uma vez; a decisão de adotá-la é do dono.
5. **Licença dos sprites e uso de nomes de terceiros** — item 🔴 do plano.
6. **Modo cooperativo (4.3)** — exige decisão de moderação e abuso.
7. **Ferramenta de telemetria e a política de privacidade que acompanha** —
   PostHog (dado sai da stack) vs. Analytics Engine (fica na Cloudflare).
8. **Encomendar a arte de decoração (5.1)** — o brief está pronto.

---

**Veredito final.** O Soulmon hoje é **um sistema de regras eticamente
exemplar com um produto emocionalmente subexposto e comercialmente invisível**.
Ele precisa de **momentos** (o reveal que revela, a voz que lembra, o widget que
é o bicho, os picos animados) e de **medição** para virar **um companheiro que
as pessoas mantêm por anos e pelo qual se dispõem a pagar**. E a primeira coisa
a fazer é **instrumentar os ~20 eventos e pôr o sprite no reveal** — na mesma
semana: sem o primeiro nada mais pode ser priorizado com honestidade, e sem o
segundo todo o funil de onboarding trabalha para entregar um parágrafo.

---

## I. Rodada 2 — o que as transcrições de vídeo mudaram

A rodada 1 não conseguia ler transcrição de YouTube (bloqueio de IP no sandbox),
e por isso 84 vídeos entraram no guia por **título e fonte secundária**. As
16 perguntas de `00-PROMPTS-NOTEBOOKLM.md` foram executadas no NotebookLM e as
respostas verbatim estão em `08-transcricoes-notebooklm.md`. Todas as 16
responderam.

**Regra de leitura:** tudo nesta seção é `via transcrição` — vem da fala dentro
do vídeo, não de artigo sobre o vídeo. É a evidência mais forte do guia, e é a
única que pode **derrubar** recomendação da rodada 1.

### I.1 As três contradições (o motivo de ter ido buscar)

#### ⚠️ I.1.1 `REST_SHIELD_MAX = 3` provavelmente deveria ser 2

O Duolingo **testou exatamente isso**, na escala deles, e o 3º escudo não
entregou nada — pior, treinou ausência:

> "the really interesting insight of this experiment was that **three streak
> freezes was actually no better than two streak freezes**… But if you start
> taking three days off from any habit, it's just going to be less likely that
> you return even four days later. And so… **we were training them to take more
> time off**." — Jackson Shuttleworth, PM de retenção (≈00:46:30–00:48:30)

O mecanismo do dano é o mesmo que o Soulmon quer evitar: quem some três dias
seguidos tende a não voltar no quarto. O 3º escudo não protege o hábito — ele
compra mais um dia de ausência para alguém que já está saindo.

Vale registrar o que a mesma fonte **confirma**: o escudo equipado por padrão foi
"holy smokes" de ganho, e o `applyMissedDay` automático do Soulmon já é essa
lição implementada — inclusive antes de o guia ter a citação. O que não estava
verificado era o **teto**, e ele é o único número da família que a evidência
contraria.

Há um detalhe que impede transplantar direto: o escudo do Duolingo é **carregado
e gasto pelo usuário**, o do Soulmon é **ganho por constância e gasto sozinho**.
Ganhar 1 a cada 7 dias de boa constância já limita o acúmulo de um jeito que o
Duolingo não tinha. Então isto é **P1 e experimento, não correção de bug**:
`REST_SHIELD_MAX` de 3 → 2, medindo retorno após ausência. Depende de telemetria
(F) existir — que é justamente o P0.

#### ⚠️ I.1.2 O Soulmon nunca decidiu onde é a SUA linha de perdão

Esta é a mais estratégica, e não tem resposta pronta:

> "You can almost always get engagement wins, up to a certain point, by just
> **cheapening the streak**, making it easier to extend, letting users have more
> flexibility, but **you kind of got to hold the line at some point. And it's not
> clear where that line is.** … there's a point where you go too far and it's a
> one-way door, and all of a sudden those users, those 9 million users on
> one-year streaks **don't care about their streak anymore**. And that … would be
> an **extinction level event** for us." (≈00:52:00–00:53:30)

O Soulmon empilhou **oito** mecanismos de perdão — constância N/7, escudo
automático, never miss twice, teto de 1 coração/dia, perdão por ausência ≥2
dias, alívio de segunda, fresh start, `someday`/`dropped`. Cada um foi decidido
com bom argumento e **isoladamente**. Nenhum documento do projeto pergunta onde
o perdão para de significar cuidado e passa a significar que nada importa.

Isso **não** é argumento para punir — a tese anti-punição segue de pé e é o
diferencial do produto. É argumento para nomear o que o Soulmon protege como
inviolável. A pergunta que falta responder: *o que ainda dói perder no Soulmon?*
Hoje, honestamente: quase nada. A criatura do Oráculo é única e insubstituível —
e é justamente por isso que ela, e não a barra de HP, é o ativo que sustenta
significado. Ver I.3.1.

Vale notar a assimetria a favor do Soulmon: o "evento de extinção" do Duolingo é
sobre 9 milhões de pessoas perderem o apreço por um **número**. O Soulmon não
tem esse número exposto — o que ele tem é uma criatura. Um vínculo com criatura
não barateia pela mesma via, mas também não é imune: se cuidar não muda nada,
some o motivo de cuidar.

#### ⚠️ I.1.3 A crítica mais forte contra o produto, na íntegra

Pedimos o caso mais duro contra gamificar produtividade. Ele acerta o Soulmon:

> gamificação é "**colar um motivador extrínseco e frequentemente sem sentido a
> uma atividade** para induzir as pessoas a engajarem nela por mais tempo ou mais
> vezes"; o objetivo real é "explorar reações humanas instintivas a estímulos
> básicos para fazer você fazer algo que de outra forma não faria". Ian Bogost
> propõe renomear para **"exploitationware"**. — Errant Signal

E o golpe específico, que descreve uma mecânica que o Soulmon **tem**:

> ao anunciar antecipadamente a recompensa por concluir a tarefa, o cérebro
> reduz a atividade a "**um mero meio para um fim**" — o trabalho vira "um
> estorvo que se coloca entre o usuário e a notificação de conquista".

No Soulmon, concluir tarefa **dá comida**, que dá energia e pontos de atributo
que decidem o galho de evolução. Isso é literalmente recompensa tangível,
esperada e condicional — a configuração que a literatura de motivação
intrínseca aponta como a que corrói. O Extra Credits completa com a curva:
o entusiasmo inicial some, e sem recompensa intrínseca o engajamento "desmorona
de forma abrupta".

**Como isto entra no guia, honestamente:** não como recomendação de remover a
comida — a mecânica é o coração do produto e removê-la é outro produto. Entra
como **critério de decisão permanente**: toda mecânica nova de recompensa
precisa responder "isto faz a pessoa querer fazer a tarefa, ou querer a
notificação?". E entra como o argumento mais forte a favor das peças do Soulmon
que **não** são extrínsecas: o relatório que descreve sem julgar, o humor que
não vira score, o `soulGoal` devolvido, o ritmo de cuidado que muda quem a
criatura vira. Essas são a defesa contra a curva de colapso — e são as que o
roadmap P0 já manda investir.

### I.2 O que foi confirmado com evidência nova

| Regra atual do Soulmon | Evidência via transcrição |
|---|---|
| Escudo consumido **automaticamente** (`applyMissedDay`) | Duolingo: dar 2 freezes equipados no início do streak foi um dos maiores ganhos que a equipe já mediu ("holy smokes") |
| Hábito novo nasce em **ratio 1** (progresso dotado) | GDC/Engelstein cita Catan: todos começam com 2 dos 10 pontos; o progresso dado de presente aumenta motivação de continuar — o mesmo Nunes & Drèze, agora com precedente de design |
| **Streak que zera é proibido** | "Forced Play / Punição por Inatividade" aparece **nomeado como dark pattern** (Extra Credits): apagar progresso de streak sem opção de freeze |
| Faixas do Torneio **antes** do ranking global | Tim Gabe: placar global "parece impossível de vencer e desmotiva"; coortes reduzidas preservam a percepção de *winnability* |
| Carga do dia é **aviso, nunca bloqueio** | The Freedom Fallacy: autonomia é **volição** (querer fazer o que se faz), não liberdade irrestrita — e estrutura satisfaz autonomia melhor que ambiente sem direção |
| Humor **nunca** vira pontuação | Emily Greer (GDC): métrica isolada e avaliação precoce escondem canibalização — julgar por uma KPI é a armadilha, não a solução |

Um achado que **reposiciona** uma regra sem contradizê-la: a tese anti-punição
do Soulmon foi escrita como oposição ao Habitica. As transcrições mostram que
ela é mais defensável do que o guia dizia — o "Forced Play" é dark pattern
catalogado, e o Tamagotchi original **perdia** usuários exatamente por isso
(morte em menos de 12h, sem botão de pausa; ignorar 5–6h matava o bicho). O
criador Akihiro Yokoi projetou a dor de propósito, achando que bicho real "só é
fofo 20 a 30% do tempo" e que sem trabalho não haveria responsabilidade. Deu
apego **e** deu abandono em massa. O Soulmon fica com a primeira metade.

### I.3 Mecânicas novas que valem entrar

#### I.3.1 Prestígio cosmético por não usar a proteção (P1)

O Duolingo tem **Perfect Streak**: calendário dourado, **sem recompensa
material**, só para quem passou o período sem usar Streak Freeze. É a resposta
direta à I.1.2 — cria significado sem criar punição, porque quem usa o escudo
não perde nada, só não ganha o dourado.

No Soulmon isto encaixa em `habitTier` / na página de Evolução: uma marca visual
para o hábito levado sem escudo gasto. **Nunca** um número exposto que desce.

#### I.3.2 Compromisso ativo em vez de botão neutro (P1, barato)

Trocar `Continue` por **`Commit To My Goal`** rendeu ao Duolingo mais de **10.000
DAU** — só a mudança de texto. A meta de streak (14/30/50 dias) escolhida
ativamente e com opt-out visível aumentou engajamento **porque tornou a decisão
intencional**.

O check-in do Soulmon já escolhe até 3 focos: o botão que fecha o check-in é
candidato imediato ao mesmo tratamento (PT/EN, `rituals.ts` + o modal).

#### I.3.3 Celebração que faz PARAR, não acelerar (P1)

Duolingo usa háptico + animação rica **para o usuário pausar e saborear**, em vez
de acelerar pelo funil — e reserva as animações mais complexas para marcos.
No Duolingo, a animação existe para o personagem virar "um parceiro de estudos
atencioso" em vez de software frio.

O guia já pedia cerimônia nos marcos 7/21/66 (P0). As transcrições dão o
**mecanismo**: a celebração precisa interromper o fluxo, não decorá-lo.

#### I.3.4 A criatura é ESPÉCIE, não personagem (revisa uma decisão de conteúdo)

> Dar traços humanos muito específicos e rígidos à criatura **impede que o
> jogador projete sua própria história nela**. Criaturas com design mais neutro
> ou animalesco permitem que cada espécime tenha sua própria narrativa na mente
> do jogador. — frogMak

Isso tensiona o Oráculo, que entrega **nome + descrição + linha de essência**
prontos. A saída não é apagar a descrição — ela é o que prova que a criatura veio
das respostas da pessoa (I.1.2). É calibrar: a descrição deve dizer **de onde a
criatura veio** (a leitura da pessoa), não **como ela se comporta** (personalidade
fechada). Deixar o comportamento em aberto é o que dá espaço para o vínculo.

#### I.3.5 As atividades precisam estar acopladas a alguma necessidade (P2)

"Motivational sand traps": atividade desconectada de satisfação psicológica vira
**ponto de ruído**, não oportunidade. O exemplo do Far Cry 3 é o mais direto —
caçar tem valor até você fabricar tudo; depois os animais continuam no mapa como
poluição visual.

Aplicação no Soulmon: **a masmorra e os minijogos precisam continuar acoplados a
algo depois que o jogador comprou tudo da loja.** Hoje eles rendem Bits, e Bits
compram cosmético — quando o catálogo acaba, viram ruído. O eixo de conteúdo
D30–D90 (já apontado como o mais fraco do produto) é exatamente este buraco.

### I.4 Correções ao plano de telemetria (seção F)

Emily Greer (GDC) contradiz duas escolhas metodológicas comuns que o plano da
seção F fazia implicitamente:

1. **Média é a métrica errada.** Quase tudo em jogo segue **power law**, não curva
   normal — outliers distorcem qualquer ARPU/média. Usar **medianas** e testes
   para distribuição não-normal (Wilcoxon rank-sum). Com amostra pequena,
   priorizar métricas **binárias** estáveis (retenção D1, conversão) em vez de
   médias.
2. **Teste de 10 dias mente.** No caso "Office Space", uma promoção parecia
   sucesso em 10 dias e a análise de **30 dias** revelou canibalização de receita
   futura: **−11% líquido**. Nenhum experimento de monetização do Soulmon deve
   ser julgado antes de 30 dias.

Mais três, diretas:
- **Atribuir o usuário ao teste no momento em que ele interage com o recurso**,
  não no login — senão quem nunca abre a loja vira ruído que mascara o sinal.
- **Sempre exibir tamanho de amostra** em qualquer gráfico de coorte.
- **Eixo Y começa em zero.** Eixo cortado transforma flutuação irrelevante em
  pânico.

E o método do "aha moment" que a seção F não tinha: David Lee (YC) mede pelo
**achatamento da curva de retenção de coorte** sobre uma ação de valor real.
Se a curva estabiliza — mesmo em 20–30% — o valor foi provado; se continua caindo
para zero, não foi. Isso é implementável com os ~20 eventos já planejados.

### I.5 Checklist de monetização justa (fonte para a seção B.6)

Oito critérios, de GDC + Sub Club. Os três que mais mexem com decisões abertas:

- **Valores sagrados**: identificar o que nunca leva paywall. Para o Soulmon isto
  já tem nome — a barra que representa o cuidado que a pessoa teve consigo mesma.
  Reforça a recomendação de reenquadrar a **cura instantânea por Créditos**.
- **Double dipping**: se um dia houver assinatura + consumíveis, a assinatura
  precisa incluir franquia robusta. Cobrar mensalidade e ainda forçar consumível
  logo em seguida "destrói a reputação nas lojas".
- **Preço regionalizado**: reduzir preço de forma agressiva em mercados como o
  **Brasil** é citado nominalmente como prática justa, não como desconto. Isso
  responde parcialmente à lacuna "preço LATAM" declarada em C.4.

Mais: promoção deve ser **espaçada e imprevisível** — desconto programado ensina
o usuário a esperar; e o framework **GAMES** (Good times, Attitude, Mastery,
Engagement, Social health) como contrapeso holístico às métricas financeiras.

### I.6 O que continua sem resposta

- **4 fontes com erro de carregamento** no notebook (URLs cruas): não dá para
  saber por automação quais vídeos eram, e o conteúdo delas não está
  representado.
- **Timestamps são aproximados**, reconstruídos da transcrição pelo NotebookLM —
  indicativos, não exatos. Para citação pública, conferir no vídeo.
- **Duplicatas**: o notebook tem 168 itens para ~84 vídeos únicos; não impediu as
  respostas, mas consome o limite de fontes do plano.
- As lacunas de C.4 que nenhum vídeo cobria (ASO, som, QA com usuário real)
  **seguem abertas** — as transcrições não as tocaram.
