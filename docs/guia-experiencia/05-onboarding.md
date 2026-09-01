# 05 — Onboarding (Ritual do Oráculo)

Fontes de código: `src/components/SoulmonOnboarding.tsx` (1301 linhas, lido integralmente), `src/utils/oracle.ts` (`ORACLE_QUESTIONS`), `src/utils/soulProfile/personality/questions.ts` (20 itens), `CLAUDE.md` (regras 🧭 e Oráculo). Benchmark: pesquisa web 09/2026 (links no fim).

## 1. Mapa do fluxo atual (passo a passo)

Passos com id negativo existem para não renumerar o ritual.

```
0  INTRO — logo corvo + "Toda alma carrega uma criatura…"
   ├─ [primário] "Começar agora — é grátis"  → flow='demo'
   └─ [quiet]    "Quero o completo — R$…"    → Google Play → flow='oracle'
-2 GOAL_STEP     "O que você quer melhorar?" (textarea, pulável)
-3 STRUGGLE_STEP "O que mais te atrapalha?"  (textarea, pulável)
-4 CONSENT_STEP  Termos + Política + checkbox (+ MM/AAAA de idade SÓ no demo)
-5 AGE_BLOCK     muro 18+ (a partir de consent/demo ou do passo 2/oracle)

DEMO:   -1 DEMO_PICK  escolha entre 3 pré-prontos → REGISTER
ORACLE:  1 nome completo · 2 data (DD/MM/AAAA, gate 18+) · 3 hora (c/ "não sei")
         4 cidade (CityPicker) · 5 criatura favorita (opcional)
         6..11 as 6 ORACLE_QUESTIONS (auto-avança em 180ms)
         12 REFINE_OFFER — bifurcação SEM VOLTA: +20 itens psicométricos ou revelar já
         13..32 os 20 itens (só quem aceitou)
         GENERATING (spinner 1,4s + import dinâmico do soulProfile/efemérides)
         REVEAL — SÓ NOME + linha de essência + bio em card. SEM SPRITE.
REGISTER — batismo do pet (pré-preenchido) + nickname (obrig. ≥2) + e-mail
           (opcional no demo, obrigatório no pago; login por link mágico pode
           interromper aqui: "abra o e-mail NESTE aparelho")
→ onComplete → tutorial (o denominador da barra de progresso já o inclui)
```

Contagem de toques até "ver a criatura":
- **Demo**: intro → 2 telas de "porquê" (2 toques de skip) → consent (2 toques) → escolher entre 3 cards → **~6 toques e ele ainda não viu o pet dele animado** — vê um thumb 52px estático no card e só encontra o pet no app após REGISTER.
- **Oráculo**: 5 formulários + 6 perguntas + bifurcação (+20 opcionais) + 1,4s de geração ≈ **15–35 interações, 2–5 min**, antes de qualquer criatura. E o REVEAL **não mostra o sprite** — só nome e texto.

## 2. Fricções e diagnóstico

**F1 — O reveal não revela.** O momento pelo qual todo o funil trabalha entrega tipografia, não criatura. O sprite gerado (ou placeholder da linha) precisa estar ali. É o equivalente a Finch entregar o birb como um parágrafo. Maior alavanca única do funil.

**F2 — Ordem intro → porquê → LEGAL → jogo.** GOAL/STRUGGLE antes do consent estão certos em espírito (autonomia/SDT), mas o CONSENT_STEP (parede de texto + checkbox + campo de idade no demo) cai exatamente entre a motivação declarada e a recompensa. No demo, o usuário responde "o que quer melhorar" e a resposta do app é um contrato.

**F3 — Demo sem criatura própria = sem posse.** Os 3 pré-prontos são funcionais, mas o benchmark (Finch: escolher a cor do ovo + nome + traços → ~60% D1 retention) mostra que **posse mínima** (cor, nome, 1 traço) já cria vínculo. O batismo pré-preenchido ajuda; a escolha entre 3 estranhos, menos.

**F4 — O quiz longo está bem desenhado, mas subvendido.** A literatura (Fabulous com 42 telas; teste com +40% de conversão de pagamento; quiz funnels +60%) mostra que quiz longo converte QUANDO cada resposta visivelmente muda o resultado. Hoje a bifurcação diz "afinam quem ele vai ser" — abstrato. Não há feedback incremental durante os 20 itens (nenhuma leitura parcial, nenhum "seu elemento está pendendo para…").

**F5 — Nenhum permission priming de notificação no onboarding.** O pedido de push acontece depois, sem primer amarrado a valor. Duolingo pede DEPOIS de o usuário fixar uma meta diária, com tela-primer explicando o benefício — aceitação muito maior e sem queimar o prompt do sistema.

**F6 — Interrupção do link mágico no clímax.** No caminho com e-mail + auth configurada, o "Nascer X" vira "vá checar seu e-mail" — abandono no último passo. Inevitável tecnicamente, mas o texto/tela não preserva a emoção (poderia mostrar o pet "esperando o link").

**F7 — Sem preview de valor.** Nada no fluxo mostra o app funcionando (pet andando, tarefa sendo concluída, coração enchendo). O "aha" fica 100% adiado para depois do tutorial.

## 3. O que está certo (não mexer)

- E-mail **opcional no grátis** e pedido só quando há progresso a proteger — alinhado ao melhor da literatura.
- Skips honestos (porquê, hora de nascimento, criatura favorita) e muro de idade sem tom punitivo.
- Barra de progresso que desconta o bloco de 20 para quem recusa e inclui o tutorial no denominador.
- Auto-avanço de 180ms nas perguntas; voltar do teste longo devolve a bifurcação.
- Telemetria de funil separada por demo/pago (`TELEMETRY_FUNNEL`).
- Geração com fallback de erro que devolve à bifurcação em vez de travar no spinner.

## 4. Recomendações priorizadas

### P0 — antes do reveal / momento aha
1. **Mostrar o sprite no REVEAL** (ou placeholder animado da linha enquanto a arte gerada não chega). Sem isso, nada mais importa.
2. **Reveal cerimonial**: escurecer, silhueta → flash → sprite + nome, com `prefers-reduced-motion` respeitado (padrão já existe no SPIN_CSS).
3. **Demo com micro-posse**: antes do DEMO_PICK ou nele, deixar escolher 1 variação (paleta/cor) do pré-pronto. Custo baixo, replica o "egg color" do Finch.
4. **Teaser de valor entre STRUGGLE_STEP e CONSENT**: 1 tela com o pet animado + "é isso que você vai cuidar" — a criatura aparece ANTES do contrato. No demo, pode ser o mascote corvo interagindo.

### P1 — quiz do Oráculo como motor de percepção de valor
5. **Feedback incremental durante as 6 perguntas**: a cada resposta, uma linha curta do corvo ("Hmm… vejo água na sua alma") — perceived personalization é o que faz quiz longo converter (Fabulous/Flo/Cal AI).
6. **Reframe da bifurcação em ganho concreto**: em vez de "afinam quem ele vai ser", mostrar o que muda ("com o teste, a leitura usa 6 eixos de personalidade em vez de 1") e o custo real ("~2 min"). Manter a irreversibilidade declarada.
7. **Marcos no teste longo**: a cada 5 itens, 1 tela-fôlego de leitura parcial ("Metade feita — seu papel está se definindo…"). Quebra os 20 em 4 blocos percebidos.
8. **Usar `soulGoal` no reveal**: a bio da criatura ecoar o objetivo declarado ("nasceu para te acompanhar a voltar a estudar") — commitment & consistency; o dado já existe e já é devolvido no DailyReportModal, deveria estrear aqui.
9. **Ecoar a resposta do GOAL_STEP imediatamente** ("Anotado. Seu Soulmon vai lembrar disso.") — hoje o texto some sem acknowledgment.

### P2 — permissões e fechamento
10. **Permission priming de notificação no primeiro dia, não no onboarding**: primer contextual após a 1ª tarefa concluída ou ao pôr o pet para dormir ("Quer que [pet] te avise quando sentir sua falta?"), com tela própria ANTES do prompt do sistema (padrão Appcues/Duolingo). Nunca no fluxo de nascimento.
11. **Se pedir no onboarding, só no pós-reveal** e em nome do pet — o pet como remetente é o hook do Duolingo/Finch.
12. **Tela de link mágico com o pet presente**: sprite + "estou te esperando — abra o link". Reduz o custo emocional do desvio (F6).
13. **REGISTER em 2 momentos**: batismo logo no reveal (1 campo, emoção alta) e nickname/e-mail depois, já no app (ProtectProgressModal já existe para isso no demo). Diminui o formulário final a 1 campo.

### P3 — polimento do funil
14. **Intro com prova, não promessa**: 3 sprites de criaturas reais geradas rodando atrás do logo — "veja o que outras almas revelaram".
15. **Consent enxuto**: manter links e checkbox, cortar o parágrafo introdutório (redundante com o hint) — hoje são 3 blocos de texto antes da caixa.
16. **Medir e cortar pelo funil**: com `onboarding_step` por funil já instrumentado, definir alvos (demo: <60s até reveal; oracle: <4min) e revisar o passo de maior queda a cada release.
17. **Tutorial contado no reveal**: uma linha "faltam 2 passinhos e ele acorda" — a barra já inclui o tutorial no denominador; o texto pode explicitar.
18. **Hora/cidade com default de 1 toque**: "não sei a hora" já existe; oferecer também cidade recente/geolocalização opcional para reduzir digitação no passo 4.

## Fontes
- [Adapty — Mobile App Onboarding Best Practices 2026](https://adapty.io/blog/how-to-fix-your-onboarding-flow/) (Fabulous 42 telas; onboarding longo +40% conversão de pagamento)
- [Flo/Zoe quiz funnel — Medium/Bootcamp](https://medium.com/design-bootcamp/how-flo-and-zoe-use-a-web-to-app-to-boost-their-conversion-6f424171b1b7) (quiz funnel até +60%)
- [Naavik — New Horizons in Habit-Building Gamification](https://naavik.co/deep-dives/deep-dives-new-horizons-in-gamification/) (Finch: onboarding de vínculo → ~60% D1)
- [Design Critique: Finch — IXD@Pratt](https://ixd.prattsi.org/2026/02/design-critique-finch-self-care-pet-ios-app/) (egg color, nome, traços)
- [Appcues — Mobile permission priming](https://www.appcues.com/blog/mobile-permission-priming) · [Priming users to grant permission](https://www.appcues.com/product-adoption-academy/mobile-app-onboarding-101/priming-users-to-grant-mobile-apps-permission)
- [How Duolingo Perfected Push Notifications](https://tinomwadeyi.substack.com/p/how-duolingo-perfected-the-art-of) (meta diária → primer → prompt)
- [Cal AI onboarding-to-paywall — Adapty](https://adapty.io/blog/how-to-personalize-onboarding-and-paywalls-in-your-mobile-app/)
