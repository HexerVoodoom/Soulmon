# Referências em vídeo: @Mobbingdesign (Mobbin) e @TimGabe — lições para o Soulmon

> **Método e limites da pesquisa.** O sandbox não consegue renderizar páginas do
> YouTube (o WebFetch devolve só o rodapé) e a API de transcrição está bloqueada
> por IP (`IpBlocked` no `youtube-transcript-api`). Este relatório foi montado a
> partir de: títulos e metadados encontrados por busca; **uma transcrição completa
> de terceiro** (Sozai) de um vídeo do Tim Gabe; a biblioteca/flows do próprio
> Mobbin (mobbin.com); e artigos de terceiros que cobrem os mesmos estudos
> (RevenueCat, Growth Gems, UserGuiding, trophy.so). Onde a lição vem do título +
> conhecimento consolidado do tema, isso está sinalizado. Cada fonte tem URL.

---

## 1. O que cada canal ensina

### 1.1 Tim Gabe (@TimGabe) — youtube.com/@TimGabe

Quem é: Tim Gabrielsson, fundador da agência ZipZap Design (ex-Spotify),
~150k inscritos. A tese do canal: **design não é estética, é a alavanca de
aquisição, retenção e receita** — "he's helped companies raise over $40M…
by focusing on the right design problems". Os vídeos são estudos em massa
("I Studied 100/500+…") e breakdowns de mecânicas específicas.

Temas/vídeos identificados:

| Vídeo / tema | O que ensina | Fonte |
|---|---|---|
| **"I Studied 500+ Gamified Apps (Here's What Actually Works)"** (mai/2026) | Gamificação que retém vs. gamificação de enfeite: a maioria dos apps gamificados falha porque cola pontos/badges por cima sem ligar a recompensa ao valor real; o que funciona é loop ligado ao progresso do usuário (streaks com recuperação, mascote com emoção, recompensa variável com teto) | https://www.youtube.com/watch?v=LXX_qOA5D8E |
| **"Why Leaderboards Kill App Retention (How To Fix It)"** (jun/2026) | Ranking global cru desmotiva a maioria (só o topo é recompensado); consertos: ligas/faixas pequenas, comparação consigo mesmo, coortes de nível parecido — o mesmo achado que a literatura reporta (31%+ de efeito negativo de comparação em ambientes só-leaderboard) | https://www.youtube.com/watch?v=BxhsCu9hNpY |
| **"How To Solve The App Onboarding Paradox"** (jun/2026) | O paradoxo: onboarding precisa coletar contexto para personalizar, mas cada tela a mais perde gente. Solução: pedir só o que muda a experiência imediata, mostrar valor antes de pedir cadastro (gradual engagement), e transformar as perguntas em *parte do produto*, não formulário | https://www.youtube.com/watch?v=Aa89MC8jX2c |
| **"This app onboarding hides the paywall"** | Breakdown de onboarding que embute o paywall no fim do fluxo de personalização (padrão Noom/Cal AI): o quiz cria investimento e o paywall chega como "seu plano está pronto" | https://www.youtube.com/watch?v=uw0Y_FiKkYQ |
| **"I Studied 100 Paywalls, Here's What I Found"** | Padrões de paywall que convertem: benefícios concretos em vez de lista de features, âncora anual com preço/dia, social proof, trial com timeline explicada ("hoje / dia 5 lembrete / dia 7 cobra"), botão de fechar presente mas discreto | https://www.youtube.com/watch?v=y0f8-CSOJ58 |
| **"Viral Design Tricks from Spotify (Founder Playbook)"** (jan/2026) | O que o Spotify faz de compartilhável por design (Wrapped-style: resumo pessoal, identidade, momento anual) e como founder pequeno replica | https://www.youtube.com/watch?v=Tpg0pxKHrCA |
| **"Our World Class App Design Formula"** (transcrição completa via Sozai, jun/2026) | Processo de 6 etapas: Onboarding (do cliente) → Discovery → UX (wireflows antes de visual) → UI (micro-detalhes compõem polish) → **Emotional Integration** (animações e momentos estratégicos como camada própria, citando as animações Rive do Duolingo e o sistema de diamantes do Free Cash) → Delivery. Frase-chave: "Wireframing is a super effective tool for focusing on solving problems before obsessing over visual details" | https://sozai.app/transcript/world-class-app-design-formula/ e https://www.youtube.com/@TimGabe |
| **"New UX/UI Trends… Duolingo End UX, Rise of AX Design" (Design Breakdown Ep. 5)** (mar/2025) | Série de breakdowns de tendências; discute o "end UX" do Duolingo (o que acontece depois que o usuário domina o produto) e design para agentes/IA | https://www.youtube.com/watch?v=Bu77RJKOUvA |

O fio condutor do canal: **retenção vem de emoção projetada de propósito**
(mascote, celebração, streak com perdão), **conversão vem de onboarding que
personaliza antes de cobrar**, e **comparação social crua destrói mais do que
constrói**.

### 1.2 Mobbin (@mobbindesign) — youtube.com/channel/UCgf9aPtUQMvxL7x-_hT13KQ

Mobbin é antes de tudo a maior biblioteca de referência de UI/UX real
(1.700+ apps, 400k+ screens, flows anotados). O canal de YouTube é o braço
educacional dela, com dois formatos:

| Formato | O que ensina | Fonte |
|---|---|---|
| **Curso [MOBBIN] 01–06** ("Introduction to UI/UX Design" … "UX Research and Design Flows") | Fundamentos: pesquisa por referência real (não por imaginação), decompor apps existentes em flows, montar UI a partir de padrões comprovados | https://www.youtube.com/watch?v=BB8uOVJQnLg · https://www.youtube.com/watch?v=9hFFyNHKr7A |
| **Mobbin Workflows** (playlist) + builds completos ("We Finally Completed the Fintech App With Mobbin – Full Design + Prototype") | Workflow de designer: buscar o padrão (onboarding, paywall, empty state) em apps top, comparar variações e só então desenhar | https://www.youtube.com/playlist?list=PLl0Umi92CQzW04B2-suFw7wPN5GkdDErO · https://www.youtube.com/watch?v=fDkCdTc8LUY |

O material mais valioso do Mobbin para o Soulmon não é o vídeo em si, é o
**catálogo de flows anotados** que os vídeos ensinam a usar — por exemplo os
flows de onboarding do Duolingo nas 3 plataformas (seleção de idioma → metas →
permissões → 1ª lição antes do cadastro) e a categoria inteira de telas de
paywall:

- Duolingo iOS onboarding: https://mobbin.com/explore/flows/0acc27c7-4e01-481c-83b2-99f8d741bef1
- Duolingo Android onboarding: https://mobbin.com/explore/flows/afd9076d-2599-44fe-962f-fc723a7a7b6b
- Galeria de paywalls mobile: https://mobbin.com/explore/mobile/screens/subscription-paywall

Método Mobbin em uma frase: **nenhuma tela nova nasce do zero — nasce da
comparação de como 10 apps de topo resolveram o mesmo problema.**

### 1.3 Contexto de terceiros usado para completar (mesmos temas dos vídeos)

- Duolingo onboarding breakdown (gradual engagement, 7 passos, lição antes do
  cadastro): https://userguiding.com/blog/duolingo-onboarding-ux e
  https://goodux.appcues.com/blog/duolingo-user-onboarding
- Fabulous vs **Finch** onboarding (Finch: setup de hábito em 1 tela, 22 telas
  totais das quais 11 são decisões simples):
  https://medium.com/design-bootcamp/main-character-energy-how-two-habit-building-apps-build-motivation-in-onboarding-a3d144bd2818
- Streaks e retenção (usuário com streak 7+ dias = 2,3× mais engajamento diário;
  a infraestrutura em volta — recuperação, notificação, status — é o que retém):
  https://trophy.so/blog/streaks-gamification-case-study
- Paywalls (onboarding responde por ~50% dos trial starts; quiz longo estilo
  Noom aumenta valor percebido; paywall com vídeo dobrou install→trial):
  https://www.revenuecat.com/blog/growth/guide-to-mobile-paywalls-subscription-apps ·
  https://growthgems.substack.com/p/hard-paywalls-9-tactics-to-mitigate ·
  https://dev.to/paywallpro/subscription-onboarding-15-patterns-you-must-know-4n4f
- Cal AI UI breakdown: https://screensdesign.com/showcase/cal-ai-calorie-tracker

---

## 2. As lições mais acionáveis — e como aplicar no Soulmon

Cada lição cita a mecânica REAL do Soulmon (nomes de arquivos/constantes do
repositório). Marcação: ✅ = o Soulmon já faz (manter/reforçar) · 🔧 = ação
concreta proposta · ⚖️ = conflita com a essência declarada, adaptar.

### Onboarding (Tim Gabe: Onboarding Paradox / paywall escondido; Mobbin: flows do Duolingo)

**1. Valor antes de cadastro (gradual engagement).** O Duolingo dá a 1ª lição
antes de pedir e-mail. 🔧 No Soulmon, o caminho demo (`demoCharacterId`,
`DEMO_PICK`) já existe — garanta que o fluxo padrão da loja/landing leve ao
demo com o mínimo de fricção, e que o cadastro (e-mail → `saveId`) só seja
pedido quando houver algo a perder (um pet vivo, progresso). O ritual do
oráculo com as 6 perguntas já É a "primeira lição" — é jogo, não formulário.

**2. Cada pergunta do onboarding precisa mudar a experiência visivelmente.**
(Onboarding Paradox.) ✅ O Soulmon acerta: `soulGoal`/`soulStruggle` voltam no
`DailyReportModal`; as 6 perguntas do oráculo + os 20 itens psicométricos
geram literalmente a criatura. 🔧 Reforçar o "porquê" na UI do próprio passo:
uma linha "isso molda quem seu Soulmon vai ser" em cada pergunta do ritual —
é o que o Duolingo faz ("para personalizar sua experiência").

**3. Perguntas puláveis, investimento crescente.** Finch faz setup de hábito em
1 tela. ✅ `soulGoal`/`soulStruggle` já são puláveis por regra. 🔧 Medir (se um
dia houver analytics) em qual passo do ritual as pessoas abandonam; o
benchmark do Finch são decisões de 1 toque por tela.

**4. O quiz cria o momento do paywall ("seu plano está pronto").** Tim Gabe
mostra que o paywall convertendo é o que chega como conclusão do
investimento do quiz. 🔧 No Soulmon a compra (Créditos → `accountTier:'paid'`
→ gerar o pet próprio) deveria ser oferecida exatamente no **reveal do
oráculo**: "este é o Soulmon do modo demo; a leitura completa da sua alma
gera o SEU" — que é o que a variante `reveal` do `UnlockNudge` na página de
Evolução já sugere. A regra do app de que o nudge **nunca abre sozinho** deve
ficar: o gatilho é o momento, não o pop-up.

### Paywall / monetização (Tim Gabe: I Studied 100 Paywalls)

**5. Venda o resultado, não a feature.** Paywalls que convertem dizem "tenha o
seu companheiro único" e não "gera sprite por IA". 🔧 Revisar o texto do
`UnlockAccountModal`: liderar com identidade ("um Soulmon que é só seu, nascido
da sua leitura") — os 3 pontos do modal devem ser resultados, não tecnologia.

**6. Um preço, uma decisão.** Paywalls com 3+ planos convertem pior que âncora
simples. ✅ O Soulmon vende Créditos com usos claros (reroll 50 / cura 10 /
1 Crédito = 10 Bits). 🔧 Na tela de compra, destaque UM caminho ("desbloqueie
seu Soulmon") e deixe a tabela de usos secundária.

**7. Nunca esconda o que o dinheiro compra.** (Anti-padrão que os dois canais
condenam.) ✅ Já é regra travada por teste: as 3 moedas nunca se misturam
visualmente (`utils/currencies.ts`), Créditos nunca compram vantagem além de
identidade/conveniência. Manter — é diferencial de confiança, e o
`PLANO-EVOLUCAO.md` (Princípio 1) já o declara.

**8. A recusa precisa ter saída.** Lição do caso `24870bf7` do próprio repo,
que coincide com o que Tim Gabe ensina sobre dead-ends: quando o app recusa
uma ação (cap do demo no `CreateModal`/`EditModal`), a tela de recusa mostra o
convite (`UnlockNudge`). ✅ Feito nos três lugares — não regredir.

### Gamificação e retenção (Tim Gabe: 500+ Gamified Apps / Leaderboards; trophy.so)

**9. Streak que zera destrói; contador que acumula retém.** Achado central do
estudo de gamificação e do benchmark do próprio Soulmon. ✅ O app já é
estado-da-arte aqui: constância "N das últimas 7" (`habitRhythm.ts`,
`CONSTANCY_WINDOW_DAYS`), `perfectDays` que só sobem, teste que trava a
reintrodução de streak-que-zera. **Nada a fazer além de defender o teste.**

**10. Proteção de streak só funciona automática.** O Streak Freeze do Duolingo
só reteve quando veio equipado por padrão. ✅ Os escudos de descanso do
Soulmon (`REST_SHIELD_*`, consumidos automaticamente em `applyMissedDay`) já
implementam exatamente isso. Manter a automaticidade.

**11. Leaderboard global cru mata retenção; faixas pequenas e progresso
próprio retêm.** (Why Leaderboards Kill App Retention.) ✅ O Torneio já mostra
faixas (Semente→Lendário, `tournamentTiers.ts`) ANTES do ranking global, e
acumular pontos nunca rebaixa. 🔧 Duas extensões alinhadas ao vídeo: (a) no
ranking global, mostrar por padrão a vizinhança do jogador (±5 posições) em
vez do topo-10, que só celebra quem já ganhou; (b) quando existir o modo
cooperativo (item 4.3 do plano), preferir meta coletiva a ranking entre
amigos — cooperação tem evidência mais forte que competição.

**12. Recompensa variável com teto, nunca à venda.** O estudo de gamificação
separa "variável que vicia" de "variável que deleita": drop raro ganho
jogando = deleite; drop comprado = loot box. ✅ O Soulmon já traça essa linha:
coraçãozinho 5%/inimigo com `DUNGEON_HEART_DROPS` máx. 2/dia, Glitchtama
nunca vendido, Princípio 2 do plano ("nada de conteúdo aleatório vendido").
⚖️ O reroll pago por Créditos é o único ponto de fricção (já mapeado em
"Depende do dono" — Lei 15.211/2025); a mitigação sugerida lá (declarar na
tela que todo resultado é mecanicamente equivalente) é a mesma que um
breakdown de paywall honesto pediria.

**13. O mascote é o sistema de emoção, não decoração.** (Emotional Integration
do formula video; Duolingo/Rive citado nominalmente; o elogio nº 1 ao Finch é
"não me faz sentir culpado".) ✅ O Soulmon é literalmente isso por tese. 🔧 O
investimento certo, na linguagem do Tim Gabe, é **animar os momentos de pico**:
a explosão de corações do carinho já existe; faltam equivalentes para marco de
hábito (7/21/66 — `milestoneReached` existe justamente para a celebração tocar
uma vez), conclusão de tarefa assombrada (o "bônus de alívio" merece a maior
comemoração do app) e a cerimônia de evolução manual. Prioridade de polish:
esses 3 momentos antes de qualquer tela nova.

**14. Celebre o retorno, não a ausência.** (Padrão Finch; anti-padrão
Habitica.) ✅ `welcomeBack: true` + `ABSENCE_FORGIVENESS_DAYS` já fazem a
mecânica. 🔧 Fazer a **fala** do pet no retorno ser o centro da tela (saudade,
não fatura), e nunca mostrar números negativos no relatório de boas-vindas.

### Notificações e ritmo (Tim Gabe: retenção; princípio de carga do plano)

**15. Notificação = informação que o usuário quer, no momento que ele
escolheu.** Push de culpa ("seu pet está triste 😢") é o padrão que os
breakdowns condenam — e que o Duolingo usa com ironia consciente, coisa que o
Soulmon **não deve** imitar porque a essência é "nunca um cobrador". ✅ O app
já restringe: push de cocô só se o tick for cobrar, push de deitar
(`sleepReminderAt`) 30 min antes e opt-in. 🔧 Auditar os textos dos workers de
push (`workers/push-scheduler.js`) contra a régua: toda notificação deve ser
escrita como o PET falando algo que ajuda ("achei que você ia querer saber que
o cocô cobra em 30min"), nunca como o app cobrando.

**16. Uma ação, várias barras — o feedback composto.** (Pokémon GO no plano;
"reward stacking" nos breakdowns de gamificação.) ✅ Item 4.4 do plano já
implementado: concluir tarefa alimenta energia + comida + evolução + missão
numa animação. Manter como padrão para toda mecânica nova.

**17. Sessões curtas por meses > sessões longas por semanas.** Tim Gabe mede
retenção D30/D90, não tempo de sessão. ✅ Princípio 7 do plano ("passou muito
tempo no app é antipadrão") e a auditoria de ~3 aberturas/dia. Qualquer
feature nova responde primeiro: "isso exige uma 4ª visita programada?"

### Momento compartilhável e fim de jogo (Tim Gabe: Spotify tricks / Duolingo End UX)

**18. Fabrique o momento Wrapped.** O resumo pessoal, visual e com identidade
é o truque viral nº 1 do Spotify. 🔧 O Soulmon tem a matéria-prima pronta: o
**relatório semanal** (`weeklyReport` em `rituals.ts`) + a tela de jornada
(item 5.2 ✅) + o dex de sonhos. Um card exportável mensal — "o mês do meu
Soulmon": estágio, galho, constância, sonhos coletados, no estilo 8-bit do
app — é share orgânico sem ranking e sem comparação, 100% dentro da essência.

**19. Projete o "end UX".** (Design Breakdown Ep. 5: o que o Duolingo oferece
a quem já domina.) ✅/🔧 O Soulmon já achatou a escada no topo (item 3.4: o
eixo vira consistência em semanas) e tem colecionáveis de longo prazo (30
sonhos, 6 missões permanentes, base da masmorra semanal). O próximo degrau de
end-game na linha dos vídeos é **identidade acumulada**: a vitrine de troféus
de season já mostra 🥇🥈🥉 reais — estender o mesmo princípio ("o palco conta a
história do jogador") é melhor end-game que qualquer número maior.

**20. Micro-detalhes compõem o polish que diferencia.** (UI stage do formula
video: border radius, consistência de cor, opacidade.) 🔧 O repo já tem as
réguas (ícone nunca em box, 3 moedas com estilos distintos, footgun 10 de
contraste); a prática Mobbin a adotar é: **antes de desenhar qualquer tela
nova (paywall, check-in, relatório), abrir a categoria correspondente no
Mobbin e comparar 5+ apps top** — ex.: mobbin.com/explore/mobile/screens/subscription-paywall
para a próxima iteração do `UnlockAccountModal`.

**21. Empty states e primeiras 24h decidem tudo.** (~50% dos trial starts e a
maior parte do churn acontecem no D0-D1 — RevenueCat/Tim Gabe.) 🔧 Checklist
D0 do Soulmon: ao sair do reveal, o jogador deve em <1 min (a) dar carinho,
(b) cadastrar 1 hábito (com a sugestão de versão de 2 min do
`taskSuggestions.ts`), (c) ver a 1ª barra subir. O check-in
(`needsCheckIn`) não deve disparar no D0 — o ritual de manhã só faz sentido a
partir do D1.

**22. Never miss twice + versão reduzida.** (Modelo Finch, citado nos
breakdowns de habit apps.) ✅ `MISS_INTERVENTION_AT = 2` + oferta de "hoje, só
5 minutos?" já é exatamente o estado da arte. Não mexer.

**23. Personalização percebida = valor percebido.** (Noom/Cal AI: o mesmo
conteúdo, apresentado como "seu plano", vale mais.) ✅ O traço de nascimento
(`petPassive`), o galho previsto pelo ritmo (`carePattern.ts`) e a linha de
essência do reveal já fazem isso. 🔧 Torná-los mais visíveis: o traço hoje
mora em Estatísticas; uma menção ocasional na fala idle do pet ("sou guloso
mesmo…") custa zero e multiplica a percepção de "é O MEU bichinho".

---

## 3. Síntese: onde o Soulmon já está à frente e onde os canais apontam buracos

**Já à frente do que os canais pregam** (não regredir; há testes travando):
sem streak que zera; escudo automático; perdão de ausência; faixas antes de
ranking; moedas separadas; humor nunca vira score; leaderboard nunca cobra da
barra de cuidado.

**Os 5 itens de maior alavancagem apontados pela pesquisa**, em ordem:

1. **Paywall no momento do reveal** com copy de resultado/identidade (lições
   4, 5, 6) — é onde onboarding investido encontra a compra, o padrão que os
   dois canais mais documentam.
2. **Animar os 3 momentos de pico** — marco de hábito, tarefa assombrada,
   cerimônia de evolução (lição 13) — a "Emotional Integration" como etapa
   própria do processo.
3. **Card mensal compartilhável** do relatório/jornada (lição 18) — único canal
   de crescimento orgânico compatível com a essência (sem comparação).
4. **Checklist D0** de primeira sessão (lição 21).
5. **Auditoria de copy dos pushes** contra a régua "o pet ajuda, o app não
   cobra" (lição 15).

---

## Fontes

- Canal Tim Gabe: https://www.youtube.com/@TimGabe · LinkedIn: https://www.linkedin.com/in/timgabe/
- Vídeos: [500+ Gamified Apps](https://www.youtube.com/watch?v=LXX_qOA5D8E) · [Leaderboards Kill Retention](https://www.youtube.com/watch?v=BxhsCu9hNpY) · [Onboarding Paradox](https://www.youtube.com/watch?v=Aa89MC8jX2c) · [Onboarding hides the paywall](https://www.youtube.com/watch?v=uw0Y_FiKkYQ) · [100 Paywalls](https://www.youtube.com/watch?v=y0f8-CSOJ58) · [Spotify Tricks](https://www.youtube.com/watch?v=Tpg0pxKHrCA) · [Design Breakdown Ep.5 / Duolingo End UX](https://www.youtube.com/watch?v=Bu77RJKOUvA)
- Transcrição completa (formula video): https://sozai.app/transcript/world-class-app-design-formula/
- Canal Mobbin: https://www.youtube.com/@mobbindesign · curso [MOBBIN] [01](https://www.youtube.com/watch?v=BB8uOVJQnLg) / [06](https://www.youtube.com/watch?v=9hFFyNHKr7A) · [Workflows playlist](https://www.youtube.com/playlist?list=PLl0Umi92CQzW04B2-suFw7wPN5GkdDErO) · [Fintech build completo](https://www.youtube.com/watch?v=fDkCdTc8LUY)
- Mobbin flows/galerias: [Duolingo iOS](https://mobbin.com/explore/flows/0acc27c7-4e01-481c-83b2-99f8d741bef1) · [Duolingo Android](https://mobbin.com/explore/flows/afd9076d-2599-44fe-962f-fc723a7a7b6b) · [Paywalls mobile](https://mobbin.com/explore/mobile/screens/subscription-paywall)
- Terceiros sobre os mesmos temas: [UserGuiding — Duolingo UX](https://userguiding.com/blog/duolingo-onboarding-ux) · [Appcues GoodUX — Duolingo](https://goodux.appcues.com/blog/duolingo-user-onboarding) · [Fabulous vs Finch onboarding](https://medium.com/design-bootcamp/main-character-energy-how-two-habit-building-apps-build-motivation-in-onboarding-a3d144bd2818) · [trophy.so — streaks case study](https://trophy.so/blog/streaks-gamification-case-study) · [RevenueCat — guia de paywalls](https://www.revenuecat.com/blog/growth/guide-to-mobile-paywalls-subscription-apps) · [Growth Gems — hard paywalls](https://growthgems.substack.com/p/hard-paywalls-9-tactics-to-mitigate) · [15 subscription onboarding patterns](https://dev.to/paywallpro/subscription-onboarding-15-patterns-you-must-know-4n4f) · [Cal AI UI breakdown](https://screensdesign.com/showcase/cal-ai-calorie-tracker)
