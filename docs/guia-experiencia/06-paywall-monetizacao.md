# 06 — Paywall e Monetização (Soulmon)

Data: 2026-09-01 · Agente: soulmon-monetization-strategist (etapa PAYWALL)
Fontes internas lidas: `CLAUDE.md`, `docs/BILLING-SETUP.md` (o `docs/PLANO-EVOLUCAO.md` já está resumido no CLAUDE.md e rege a essência: "avatar que evolui COM o usuário, nunca um cobrador").

---

## 1. O que o Soulmon já tem (avaliação do funil atual)

**Infra pronta e correta (rara em apps nesse estágio):**
- Billing server-authoritative: `accountTier`/`credits` vivem em `ent:<saveId>` no servidor; o cliente nunca decide (regra travada em `functions/api/save.js`). `claimOrder` + `obfuscatedExternalAccountId` fecham o clone de recibo.
- Catálogo: `soulmon.unlock.full` (R$ 29,90, não consumível) + 3 packs de Créditos (R$ 4,90 / 9,90 / 19,90).
- Três moedas com fronteira testada: **Bits** (grátis, loja cosmética), **Emblemas** (torneio, só cosmético), **Créditos** (dinheiro real, servidor). Não existe Bits→Créditos.
- Tier **demo** com cap de criação; `UnlockNudge` em 3 pontos contextuais (CreateModal ao bater o cap, EditModal — que era o furo do cap —, página de Evolução de quem tem `demoCharacterId`). Nunca abre sozinho.
- Anúncios desligados por padrão (`ADMOB_SSV_ENABLED` ausente) e endpoint que se recusa a creditar sem SSV — decisão certa.
- AI guard com cota por conta + teto global — os Créditos existem em parte para cobrir Groq/Higgsfield/Gemini.

**Diagnóstico do funil:** o Soulmon hoje é um **soft paywall contextual puro** (freemium com desbloqueio único). Não há assinatura, não há trial, não há tela de oferta pós-onboarding — a compra só aparece quando o usuário esbarra no limite. Isso é eticamente exemplar e alinhado à tese ("a criatura é você; ninguém compra progresso"), mas deixa dois buracos clássicos:

1. **Ninguém descobre que existe algo pago** antes de esbarrar no cap — a maioria nunca esbarra. Sem um momento de apresentação da oferta, a conversão tende ao piso do freemium (mediana de realized revenue per install de freemium ~US$ 0,38 em D60 vs US$ 3,09 de hard paywall, RevenueCat 2025 — não é para virar hard paywall, é para medir o custo da invisibilidade).
2. **Compra única não cobre custo recorrente.** Chat (Groq) e sprites (Higgsfield) escalam com DAU; R$ 29,90 uma vez, menos 15–30% da Play, não paga um usuário de chat pesado por anos. Os Créditos consumíveis são o amortecedor — bom — mas o gasto recorrente deles hoje é fraco (reroll 50, cura 10, troca por Bits).

**Nota do desenho atual: forte em ética e integridade técnica; fraco em visibilidade da oferta e em receita recorrente.**

---

## 2. Benchmarks (com fonte e data)

| Métrica | Valor | Fonte |
|---|---|---|
| Trial → pago (média geral) | ~53%; Health & Fitness ~62% | Adapty 2026 via RocketShip HQ |
| Lift de conversão ao adicionar trial de 7 dias | +38–52% (maior alavanca isolada) | RocketShip HQ / Adapty 2026 |
| Paywall após "value moment" vs hard imediato | 2,1× mais trial starts | Adapty 2026 via RocketShip HQ |
| 82% dos trials começam no MESMO dia do download | timing importa: oferta cedo, mas pós-valor | RocketShip HQ |
| Preço doce | US$ 9,99/mês · US$ 59,99/ano; exibir anual como "/mês" → +28–34% de escolha do anual | RocketShip HQ 2026 |
| Produtividade: comprador direto out-earns trial em 1 ano (US$ 56,95 vs 49,13) | trial não é obrigatório na categoria | Adapty 2026 |
| RPI mediano Health & Fitness | US$ 0,44 (P90 US$ 2,97) | RevenueCat State of Subscription Apps 2025 |
| Hard paywall D60 | US$ 3,09 vs freemium US$ 0,38 | RevenueCat 2025 |
| Finch Plus | US$ 9,99/mês · US$ 69,99/ano; ~US$ 30M ARR sem VC; **Plus é majoritariamente cosmético**, ferramentas de autocuidado ficam grátis, sem ads | Finch help center / Sparrow blog / Adapty paywall library, 2025–2026 |
| Estrutural (trial, mix de planos, placement) vale ~2× mais que mudança visual/copy | priorização de testes | Airbridge 2026 |

**O comparável certo do Soulmon é o Finch, não o Duolingo.** Finch prova que paywall suave + free tier generoso + pago cosmético/apoio chega a US$ 30M ARR. Duolingo (Super/Max, remoção de ads, corações infinitos) monetiza a *fricção que ele mesmo cria* — corações infinitos pagos é exatamente o dark pattern que o Soulmon jurou não ter (a cura instantânea por 10 Créditos já está na fronteira; ver rec. 13). Fabulous/Cal AI usam onboarding longo + hard paywall pós-quiz — converte alto, mas queima confiança na categoria bem-estar e trairia o ritual do Oráculo.

---

## 3. Recomendações (16)

### Estrutura de oferta

1. **Adicionar assinatura "Soulmon Vínculo" ao lado do unlock vitalício, não no lugar dele.** Mensal ~R$ 14,90 / anual ~R$ 79,90 (exibir "R$ 6,60/mês"). O vitalício R$ 29,90 vira âncora de "apoiador fundador" ou sobe de preço (ver 3). Conteúdo: chat com modelo melhor e cota maior, gerações de sprite mensais (Créditos inclusos), cenários/temas exclusivos cosméticos, estatísticas longas. **Nada de progresso.**
2. **Assinatura = Créditos recorrentes por dentro.** Ex.: 60 Créditos/mês inclusos. Reusa toda a infra de entitlement, dá razão de renovar e amarra o custo variável de IA a receita recorrente.
3. **Reprecificar o unlock:** R$ 29,90 vitalício está barato demais como único produto (Finch cobra ~R$ 350/ano-equivalente). Ou sobe para R$ 49,90–69,90, ou permanece 29,90 explicitamente como "oferta de lançamento" com contador honesto (data real, sem timer falso que reseta).
4. **Um "value moment" mensurável antes de qualquer oferta:** o reveal do Oráculo + primeiro dia perfeito. A primeira apresentação *proativa* da oferta deve vir no **DailyReportModal do primeiro dia perfeito** ("Seu Soulmon cresceu porque você cresceu. Quer criá-lo à sua imagem?"), nunca no onboarding. Dados: paywall pós-value-moment = 2,1× trial starts; e como 82% das conversões acontecem no D0, o primeiro dia perfeito alcançável no D0 (é) mantém o timing.
5. **Não adotar hard paywall nem paywall pós-quiz estilo Fabulous/Cal AI.** O ritual do Oráculo termina em *reveal*, não em cobrança — cobrar ali contamina o momento emocional mais forte do produto. A conversão extra não paga o dano à tese.
6. **Trial: sim, mas do jeito Soulmon.** 7 dias de "Vínculo" oferecidos como *presente do pet* após o 3º dia perfeito ("Meu presente pra você: uma semana do meu melhor"). Trial via Play Billing padrão, cancelável, com lembrete antes de cobrar (o lembrete pró-usuário é diferencial de confiança na categoria — Finch faz).
7. **Restaurar compras e estado pago sempre visíveis** em Configurações → Conta (já existe); adicionar na tela de oferta o link "Já sou apoiador".

### Placement e gatilhos (mantendo "nunca abre sozinho")

8. **Manter os 3 UnlockNudge contextuais e adicionar um 4º ponto passivo:** uma linha discreta na página de Evolução para contas `paid`-elegíveis não-demo? Não — o 4º ponto certo é a **Loja**: uma aba/cartão "Apoie o Soulmon" listando unlock, assinatura e packs de Créditos. Loja é onde o usuário já está em mentalidade de troca; é descoberta sem interrupção.
9. **Nudge de recusa com saída sempre:** todo paywall fecha com um toque, botão de fechar visível no primeiro frame (nunca delay/fade no X), e a recusa não repete no mesmo dia (persistir `lastNudgeDay` no save, via `playerDayKey`).
10. **Cap de frequência global:** no máximo 1 apresentação proativa de oferta por semana por usuário. A conversão em apps de vínculo emocional vem de meses de retenção, não de pressão.

### Copy (EN base + PT-BR, padrão do repo)

11. **Título do paywall:** EN "Your Soulmon grows because you do. Make it truly yours." / PT "Seu Soulmon cresce porque você cresce. Faça dele algo só seu."
12. **Linha do que a compra dá:** EN "Create your own creature from your soul reading — and help keep Soulmon alive." / PT "Crie sua própria criatura a partir da sua leitura de alma — e ajude a manter o Soulmon vivo." Enquadrar como *apoio* (modelo Finch) converte melhor nesse público do que enquadrar como *desbloqueio de poder*.
13. **Copy do que NÃO muda (dentro do próprio paywall):** EN "Paying never makes your creature stronger. It can't." / PT "Pagar nunca deixa sua criatura mais forte. Não tem como." Isso é ativo de marketing, não rodapé jurídico.

### Linhas vermelhas (o que NUNCA vender — publicável)

14. **Nunca vender:** evolução, perfectDays, corações/HP irrestritos, escudos de descanso, conclusão de tarefa, "pular o dia", remoção de consequência criada pelo próprio jogo, vantagem em Torneio/PvP, Glitchtama, e nunca ads intersticiais. **Revisar a "cura instantânea por 10 Créditos"** já existente: é venda de HP com dinheiro real — ou remover, ou limitar a 1/semana e reenquadrar como "presente do pet" — ela é a única peça atual que flerta com "monetizar a dor". Emblemas continuam só-cosméticos (se um dia comprarem vantagem, migram pro servidor — regra já travada por teste).
15. **Rewarded ads só se algum dia existirem, e nunca por moeda de progresso** — no máximo Bits cosméticos, com AdMob SSV (o freio já está no código). Recomendação padrão: não ligar; eCPM não paga o dano emocional num app de vínculo, e complica COPPA/famílias.

### Medição

16. **Instrumentar o funil antes de otimizar:** eventos de nudge-mostrado / nudge-tocado / compra-verificada por origem (CreateModal, EditModal, Evolução, Loja, DailyReport). Metas iniciais realistas: conversão paga total 1,5–3% dos MAU (patamar freemium generoso, referência Finch), trial→pago ≥50% se o trial existir. Testar estrutura antes de visual (estrutura ≈ 2× o impacto).

---

## Fontes

- [RevenueCat — State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025)
- [RevenueCat — State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps)
- [RevenueCat — lessons/benchmarks 2026](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026)
- [Adapty — State of In-App Subscriptions 2026](https://adapty.io/state-of-in-app-subscriptions/)
- [RocketShip HQ — Adapty 2026 benchmark, timing de paywall](https://www.rocketshiphq.com/adapty-subscription-app-benchmark-2025-summary/)
- [RocketShip HQ — paywall optimization 2026](https://www.rocketshiphq.com/optimize-app-paywall-higher-conversion/)
- [Airbridge — Paywall conversion: structural decisions](https://www.airbridge.io/en/blog/paywall-conversion-structural-decisions)
- [Airbridge — Subscription pricing by category 2026](https://www.airbridge.io/en/blog/subscription-app-pricing-by-category-2026-benchmark)
- [Finch Plus Pricing (help center)](https://help.finchcare.com/hc/en-us/articles/38755205001869-Finch-Plus-Pricing)
- [Sparrow — Finch: $30M ARR sem VC](https://blog.sparrowapps.io/p/finch-how-a-self-care-app-hit-30m-arr-without-vc-money)
- [Adapty paywall library — Finch](https://adapty.io/paywall-library/finch/)
- [PaywallScreens — Finch (~$900K/mo)](https://www.paywallscreens.com/apps/finch-mobile-paywall-c882)
- [RevenueCat — guia de paywalls](https://www.revenuecat.com/blog/growth/guide-to-mobile-paywalls-subscription-apps)
