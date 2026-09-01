# 07 — Retenção e engajamento (Soulmon)

> **Veredito em uma frase:** o Soulmon não tem NENHUMA telemetria — toda afirmação
> sobre comportamento de usuário neste e nos demais relatórios é hipótese não
> testada, e o primeiro investimento de retenção é instrumentar, não otimizar.

> **Guarda de essência:** o `PLANO-EVOLUCAO.md` já cortou punição por padrão
> (teto de 1 coração/dia, perdão de ausência, `perfectDays` que só sobem, escudos
> automáticos, "never miss twice"). Nada abaixo pode reintroduzir culpa — o tom
> de referência é o Finch (D1 ~54% / D7 ~37%, **acima** do Duolingo, sem
> guilt-trip), não o Duolingo.

---

## 1. Benchmarks públicos (2025/2026)

| Categoria | D1 | D7 | D30 | Fonte |
|---|---|---|---|---|
| Média cross-vertical (Adjust 2026) | 25–26% | 11–13% | 5–7% | vmobify/Adjust |
| Health & Fitness | 20–27% | ~7% | ~3% | benchmarks agregados |
| Produtividade | — | — | 10–18% | idem |
| Casual/hyper-casual | 20–33% | ~12% | 2–4% | segwise/appagent |
| Simulação (pet games!) | 45–60% | — | 20–30% | segwise |
| Finch (referência direta) | ~54% | ~37% | — | Deconstructor of Fun |
| Top quartil geral | >30% | >15% | >8% | Adjust |

O Soulmon é híbrido produtividade × pet-sim. **Metas realistas** (projeção, sem
dado próprio): D1 ≥ 35% · D7 ≥ 18% · D30 ≥ 10% = "suficiente para continuar".
D1 < 20% ou D30 < 4% sustentado = problema estrutural de onboarding/loop, hora de
rever rumo. Fontes: [MWM retention glossary](https://mwm.ai/glossary/retention),
[Segwise 2026](https://segwise.ai/blog/mobile-gaming-app-user-retention-strategies),
[vmobify benchmarks](https://vmobify.com/blog/app-retention-benchmarks),
[appagent](https://appagent.com/blog/mobile-game-retention-benchmarks/),
[Deconstructor of Fun — Finch](https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl),
[Duolingo push teardown](https://pushpilot.ai/blog/duolingo-push-notification-strategy-teardown),
[Duolingo widget](https://duoplanet.com/duolingo-widget/).

---

## 2. Mapa de churn previsto (hipóteses, com sinal que confirmaria)

| Janela | Ponto de abandono | Hipótese | Sinal de confirmação | Mitigação |
|---|---|---|---|---|
| Install → pet | Oráculo: 6 perguntas + bifurcação de 20 itens psicométricos + mapa astral (data/hora/local de nascimento) + e-mail | Cada campo digitado é uma porta de saída; o teste longo antes do reveal é o funil mais arriscado do app | Drop-off por passo do onboarding | Já existe skip em `soulGoal`/`soulStruggle` — medir se o teste de 20 itens converte ou mata; considerar reveal ANTES do teste longo |
| Dia 1 | Não cadastra nenhuma tarefa | Sem tarefa não há loop nenhum (comida vem de concluir) | % de novos com ≥1 tarefa criada em D0 | Templates de 3 hábitos sugeridos a partir de `soulGoal` |
| Dias 2–3 | Pico universal de churn | Nada traz de volta além do push genérico | curva de coorte D2/D3 | Push D1 no tom Finch ("fulano sonhou com você"); primeiro sonho colecionável na 1ª noite |
| Dias 4–7 | Primeira evolução não chega | Evolução manual exige perfectDays; se demorar >7 dias, maioria nunca vê | tempo mediano até 1ª evolução | Garantir 1ª evolução alcançável em ≤5 dias de uso normal |
| 1º fracasso | Perde coração na virada | **Provável maior ponto de churn** — mesmo com teto de 1, ver o pet "pior" por sua causa dói | churn D+1 após perda de coração vs sem perda | Já mitigado (teto, Teimoso, perdão); medir e, se confirmar, trocar a mensagem da virada por convite de carinho ("ele quer um abraço") |
| Retorno após ausência | Volta após ≥5 dias | Perdão de ausência já existe (`welcomeBack`) — vantagem competitiva rara; mas se o retorno não for celebrado, o alívio passa despercebido | taxa de retorno pós-push de win-back; retenção D+7 dos que voltam | Tela de reencontro explícita + sonho/lembrança do período fora |
| Dia 30 | Fim da novidade | Loja/missões/masmorra seguram? Torneio semanal é o único live-ops | DAU da coorte no D30, uso de camada 3 | Rodada do Torneio já é âncora semanal; adicionar rotação de conteúdo (ver §6) |
| Dia 90 | Teto de conteúdo | Mega/ultra atingido, missões completas, 30 sonhos coletados | % de veteranos sem objetivo ativo | Seasons de torneio com troféus, novos sonhos/cenários por atualização |

---

## 3. Plano de telemetria mínimo (~20 eventos)

**Ferramenta recomendada:** PostHog Cloud (free tier 1M eventos/mês, EU host,
SDK web funciona no WebView do Capacitor e no PWA) OU **Cloudflare Analytics
Engine** (já na stack, custo ~zero, mas sem funil/coorte pronto — exige SQL à
mão). Recomendação: PostHog agora (velocidade de insight), migrar se custo
aparecer. Alternativa gratuita intermediária: Amplitude free (50k MTU).

**Privacidade (LGPD/Data Safety):** identificar por `saveId` (hash), nunca
e-mail; NÃO coletar texto de tarefas, `soulGoal`/`soulStruggle`, respostas
psicométricas, dados de nascimento, humor individual (só agregado opt-in);
opt-out nas Configurações; declarar na Data Safety da Play Store.

### Eventos

| Evento | Dispara | Propriedades | Por quê |
|---|---|---|---|
| `onboarding_step` | cada passo do Oráculo | step_id, skipped | funil install→pet |
| `onboarding_long_test` | escolha da bifurcação | accepted | o teste longo converte ou mata? |
| `pet_revealed` | fim do reveal | duration_s, demo | conclusão do funil |
| `task_created` | criar tarefa/hábito | type, effort, schedule_kind | ativação D0 |
| `task_completed` | concluir | type, effort, was_haunted, was_focus | **insumo do farol** |
| `perfect_day` | virada com dia perfeito | streak_len (janela 7) | eficácia |
| `heart_lost` | virada com perda | hearts_after, cause (goal/poop) | hipótese nº1 de churn |
| `degeneration` | HP 0 | days_since_install | evento crítico |
| `evolution` | cerimônia | stage, days_since_install | tempo até 1ª evolução |
| `welcome_back` | retorno ≥2 dias | days_away | win-back |
| `checkin_done` | check-in diário | focus_count, mood_answered(bool) | ritual |
| `care_action` | carinho/comida/banho/dormir | kind | vínculo |
| `layer3_used` | masmorra/torneio/dino/loja/sonhos | feature | uso de camada 3 |
| `push_received` / `push_opened` | sw.js / abertura | campaign, hour, channel(webpush/fcm) | CTR por horário |
| `push_optout` | desativar push | — | guarda-corpo |
| `session_start` | abertura | source (push/widget/icon/direct) | DAU, atribuição |
| `widget_tap` | deep link do widget | — | efeito do widget |
| `purchase` / `paywall_view` | billing | sku | monetização |
| `error` | erro capturado | code | qualidade |

### Métricas derivadas
Retenção por coorte D1/D7/D30 · **tarefas concluídas por usuário ativo/dia
(ponderadas por effort) = MÉTRICA-FAROL** · taxa de dia perfeito · tempo até 1ª
evolução · churn condicional pós-`heart_lost` e pós-`degeneration` · CTR de push
por horário · taxa de retorno pós-`welcome_back` · DAU/MAU.

**Por que esse farol:** mede a promessa (executar tarefas reais de forma
sustentada), não o vício. **Tempo de sessão é anti-indicador aqui**: quem abre
3×/dia e conclui 1 tarefa está pior do que quem abre 1× e conclui 5.

**Guarda-corpos (se piorarem, estamos otimizando dano):** aberturas/dia sem
conclusão de tarefa ↑ · churn pós-degeneração ↑ · `push_optout` ↑ · % de
respostas de humor negativas em dias de perda de coração ↑.

---

## 4. Calendário de re-engajamento (push já existe: Web Push + FCM, cron em `workers/push-scheduler.js`)

Tom SEMPRE Finch (curiosidade/carinho), nunca Duolingo-guilt ("Você abandonou o
Duo 😢" funciona lá por ser meme — aqui quebraria a essência).

| Momento | Push | Tom |
|---|---|---|
| D1, ~19h | "\<pet\> aprendeu a fazer uma coisa nova hoje. Quer ver?" | curiosidade |
| D2 sem abertura | "\<pet\> sonhou com você esta noite" (+ 1º sonho garantido) | afeto |
| Diário (existente, 22h?) | Personalizar com nome do pet e 1 fato do dia (X tarefas, humor do pet) | contexto |
| 30 min antes do tick de cocô (existente) | manter — é o único push "urgente" legítimo | prático |
| `sleepReminderAt` (existente) | manter | gentil |
| Sexta (abre Rodada do Torneio) | "A arena abriu! \<pet\> está aquecendo" | evento |
| Segunda (fresh start + alívio semanal) | "Semana nova, +meio coração de presente. Recomeço sem dívida." | perdão |
| D5–D7 ausente (win-back 1) | "\<pet\> guardou uma surpresa pra quando você voltar" — e ENTREGAR (coraçãozinho/sonho) | promessa cumprida |
| D14 ausente (win-back 2, último) | "Sem cobrança: \<pet\> está bem e sente saudade. O save te espera." | fecho digno; depois disso, silêncio |

Regras: máx. 1 push de campanha/dia; nunca dois canais (WebPush+FCM) para a
mesma mensagem (deduplicar por saveId no scheduler); todo push mensurado
(`push_opened` com campaign).

---

## 5. Widget Android (já existe — subutilizado como ativo de retenção)

Finch e Duolingo reportam widget "tão eficaz quanto push" para retenção
([duoplanet](https://duoplanet.com/duolingo-widget/), DoF). O do Soulmon já
mostra o pet; alavancas baratas:

1. **Estado emocional dinâmico**: sprite feliz/sonolento/saudade conforme hora e
   progresso do dia — o Duolingo troca a cara do Duo no widget e isso é o motor.
2. **Contador do dia**: "2/4 hoje" (peso feito vs meta) — visível sem abrir.
3. **Deep link instrumentado** (`session_start source=widget`).
4. **Prompt de adicionar widget** no D2–D3 (momento de maior risco), não no D0.
5. Nunca estado negativo/culpado no widget — no máximo "com saudade".

---

## 6. 20+ recomendações priorizadas (impacto × esforço)

### Agora (alto impacto, baixo esforço)
1. **Instrumentar os ~20 eventos do §3** — pré-requisito de tudo.
2. Funil do onboarding medido passo a passo; cortar/adiar o que mata conversão.
3. Push D1/D2 personalizados com nome do pet (o scheduler já existe).
4. Deduplicação WebPush×FCM por saveId (push dobrado = optout).
5. Widget com progresso do dia (2/4) e humor do pet.
6. Prompt de widget no D2–D3.
7. Garantir 1ª evolução em ≤5 dias (ajustar requisito do rookie se preciso).
8. Templates de hábitos derivados de `soulGoal` no fim do onboarding.
9. Mensagem da virada com perda de coração reescrita como convite de cuidado
   ("ele quer carinho"), nunca boletim de dano.
10. Win-back D5 com recompensa entregue de verdade.
11. A/B leve de horário de push por CTR (Duolingo ganhou +3% só nisso — mas ver
    §7: com poucos usuários, começar segmentando por horário observado, não por teste).

### Próximo ciclo (alto impacto, médio esforço)
12. **Daily quests suaves**: os 3 focos do check-in já são isso — dar selo visual
    e celebração ao fechar os 3 (mecânica já existe, falta o fecho de loop).
13. **Live-ops semanal**: a Rodada do Torneio (sex–dom) como âncora + 1 "visita
    especial" rotativa (NPC/cenário na masmorra) por semana — FOMO saudável:
    perder = não ganhar algo extra, nunca perder algo que já se tem.
14. Streak de sonhos como coleção (já é só-cresce) exposta na home de manhã —
    o "chat da manhã" do Finch.
15. Tela de reencontro pós-ausência com lembrança do período fora.
16. Seasons de torneio com troféus permanentes (vitrines já existem).
17. Push de "quase-marco": "amanhã seu hábito X completa 7 dias" (marco 7/21/66).
18. Onboarding: mostrar o pet ANTES do e-mail (reveal → depois "salve seu
    companheiro na nuvem" como motivo para o cadastro).
19. Entrevistas pós-churn (5 usuários) — mais valioso que qualquer A/B agora.

### Depois (médio impacto ou maior esforço)
20. Sonho garantido na 1ª noite (colecionável D1).
21. Rotação mensal de cenários/sonhos novos (conteúdo D90).
22. "Memórias" do pet: aos 30/90 dias, retrospectiva do que fizeram juntos
    (investimento acumulado = retenção estrutural).
23. Notificação rica com sprite do pet (imagem no push, FCM suporta).
24. Widget iOS/desktop tray parity (o overlay Electron já é um "widget" — medir).
25. Social leve: visitar o pet de um amigo (gate de Vínculo já existe).

---

## 7. Quando A/B é fantasia

Com < ~1.000 usuários ativos, detectar ±5pp de retenção exige semanas e o
resultado sai ruído. **Sequência certa:** (1) telemetria + funis descritivos,
(2) 5 entrevistas moderadas + entrevista pós-churn, (3) fake doors para
demanda (ex.: paywall), (4) A/B só quando houver >2–3k usuários/braço.

## 8. Retenção estrutural — os três eixos hoje

- **Hábito** (gatilho externo): push + widget existem, mas genéricos → **médio**.
- **Investimento** (o que se perderia): pet único gerado do Oráculo, evolução,
  sonhos, troféus — **o eixo mais forte do produto**; protegê-lo é a razão de
  perdão de ausência e fresh start sem amnésia.
- **Conteúdo** (o que há de novo): só o Torneio semanal → **o eixo mais fraco**;
  é onde o D30/D90 vai morrer sem rotação de conteúdo (recs 13, 21, 22).
