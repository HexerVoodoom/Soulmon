# Requisitos — Soulmon (run `soulmon-01`)

> Produzido por `alpha-requisitos`. **P3–P8 respondidas por default do HANDOFF, não por
> escolha explícita do dono** (P1 e P2 foram respondidas pelo dono — ver `PROGRAMA.md`).
> Duas fronteiras, não misturadas: **(A)** 🔧 obrigatório para proteger os únicos titulares de
> dado de terceiro do sistema hoje — os 2 usuários do DigiApp — e para o Soulmon não repetir
> o mesmo erro quando ganhar seu primeiro usuário de terceiro. **(B)** obrigatório
> para lançar na Play Store (`soulmon-04`). Quem prioriza ENTRE os 4 runs do programa é o
> `alpha-product-manager` — este documento só classifica DENTRO da iniciativa e nomeia o run
> a que cada item pertence (`soulmon-01`…`soulmon-04`). Requisito bloqueado por decisão que só
> o dono toma está marcado **BLOQUEADO POR DECISÃO DO DONO**, com a pergunta nomeada.

> ## ⚠️ CORREÇÃO PÓS-GATE (2026-08-25)
>
> A definição original da Fronteira A era **"obrigatório para o produto continuar em
> produção HOJE, com jogadores reais"**. Isso é falso: Soulmon tem zero usuários de
> terceiro. **Corrigido acima.** A fronteira A não esvazia — ela troca de titular: os únicos
> 2 seres humanos de terceiro que dependem de qualquer parte desta infraestrutura
> (URL/KV/Firebase compartilhados) são os usuários do DigiApp.
>
> **Efeito sobre os itens abaixo (ver `gate.md` → Recalibração):**
> - **O-1 (autorização de save) CAI de "incidente, hoje" para "dívida com prazo"** — a
>   correção certa **não é ligar `FIREBASE_PROJECT_ID` no host atual** (isso arrisca os 2
>   usuários do DigiApp), é **construir infraestrutura própria do Soulmon e ligar a
>   autorização lá**, onde ainda não há ninguém. O item permanece 🔴, mas a ação certa
>   mudou de lugar.
> - **O-2, O-3, O-4** (dreno de cocô, `tasksDone`, gate de `pvpEnabled`) **não dependem de
>   população real** — são correções de código que fazem o produto cumprir a própria
>   promessa escrita, independente de quem usa. **Não caem.**
> - **O-12** (mitigação de tela do reroll) **já foi resolvido pelo dono** (D-05: mitigar e
>   seguir).
> - **O-11** (idade mínima) **já foi parcialmente resolvido** (D-06: 18+) — falta só o gate
>   de idade e a correção do texto da política (ver `classe-regulatoria.md`, E6, que subiu).
> - **O-16** (keystores) tem decisão do dono já tomada (D-11: gerar nova antes do envio).

---

## OBRIGATÓRIO — sem isso o DigiApp fica exposto hoje, o Soulmon repete o erro quando ganhar usuários, ou o produto não pode lançar na loja

| # | Requisito | Fronteira | Justificativa (o que quebra se remover) | Critério de aceite testável | Run |
|---|---|---|---|---|---|
| O-1 🔧 | Construir infraestrutura própria do Soulmon (Pages/KV/Firebase novos, sem tocar em `digiapp-a5e`) e ligar a autorização de save **lá**, e não no host atual | A | Hoje `GET /api/save?id=<saveId>` devolve 200 sem `Authorization` no host compartilhado — sonda confirmada em produção (`security-escopo-e-reverificacao.md §0`). Isso atinge os **2 usuários reais do DigiApp**, não "jogadores do Soulmon" (não existem). Ligar `FIREBASE_PROJECT_ID` no host atual sem antes publicar login dá 401 para 100% dos usuários do DigiApp — a correção certa é infraestrutura nova para o Soulmon, deixando `digiapp-a5e` intocado até seus 2 usuários migrarem por decisão combinada do dono | Dado o Firebase ligado no projeto **próprio** do Soulmon e o front publicado lá com login, quando um `GET /api/save?id=<saveId>` for feito sem header `Authorization`, então a resposta é 401 | `soulmon-01`→execução em `soulmon-02` |
| O-2 | Corrigir o dreno de cocô (`App.tsx:2027`) para respeitar `MAX_HEARTS_LOST_PER_DAY` e `forgivesHP`/ausência ≥2 dias | A | Viola literalmente a regra de identidade do produto (`CLAUDE.md:76`, teto de 1 coração/dia; ausência ≥2 dias não cobra nada). É mecânica em produção contradizendo a promessa escrita do produto — achado do `alpha-comportamento` (C1 🔴). Independe de população: é correção de código | Dado `poopPenaltyClockAt` = agora−30h e `lastResetDate` = agora−3 dias, quando o app monta e o dreno roda, então `healthPoints` não cai mais que `MAX_HEARTS_LOST_PER_DAY` em relação ao valor anterior | `soulmon-01`→execução imediata (fix de 1 linha, não depende de infra) |
| O-3 | Remover `tasksDone` de `PlayerDetailModal.tsx:100-101` (PT e EN) | A | Expõe contagem bruta e não-consentida de conclusões de vida real de outro jogador — é o score que o produto jura não ter (`PLANO-PRODUTO.md:69-71`), sem opt-in efetivo (`pushProfile` não é condicionado a `pvpEnabled`) — achado C3 🔴. Hoje quem seria exposto no diretório, se populado, é o universo de contas do namespace compartilhado (dono + DigiApp) | Dado o modal de perfil de outro jogador aberto, quando renderizado, então a string não contém `tasksDone` nem equivalente em PT/EN | `soulmon-01`→execução imediata |
| O-4 | Condicionar `pushProfile` (`GameStateContext.tsx:917`) a `gameState.pvpEnabled` | A | Hoje quem nunca ligou PvP aparece no diretório público mesmo assim — consentimento obscurecido (achado C3, agravante) | Dado `pvpEnabled = false`, quando `setGameState` roda, então nenhuma chamada a `pushProfile`/`community` acontece para esse save | `soulmon-01`→execução imediata |
| O-5 | Implementar rota de exclusão de dados (save, entitlement, assinatura de push) a pedido do titular | A/B | Hoje `save.js` responde 405 a `DELETE`; não existe endpoint nem botão. É fato confirmado pelo `alpha-security` (nenhuma das duas rotas — exclusão/exportação — existe). Sem isto, o app viola o exercício básico de direito do titular sobre seus próprios dados pessoais, e o formulário de Segurança de Dados da Play (O-8) não pode declarar retenção/exclusão corretamente | Dado um titular autenticado solicitando exclusão, quando a rota é chamada, então save/entitlement/assinatura de push daquele `saveId` são apagados e uma nova leitura devolve "not found" | `soulmon-04` (bloqueia formulário de loja) |
| O-6 | Implementar rota de exportação dos dados do titular | A/B | Mesma fonte que O-5: nenhuma das duas rotas existe. Exportação é o par simétrico da exclusão para o titular poder auditar o que foi coletado | Dado um titular autenticado solicitando exportação, quando a rota é chamada, então o titular recebe um JSON com todos os campos do seu save/entitlement em até N segundos definidos por QA | `soulmon-04` |
| O-7 | Implementar Play Billing (produto não-consumível R$29,90 + consumíveis de crédito) | B | `playBilling.ts:5-6` confirma que não existe nenhum plugin de billing instalado. Sem isto, o app não pode cobrar em produção na Play Store — trava o run inteiro `soulmon-04` | Dado o app publicado num track de teste da Play, quando um usuário completa a compra do desbloqueio, então `accountTier` vira `'paid'` no servidor, validado por recibo assinado da Google (não pelo cliente) | `soulmon-04` |
| O-8 | Preencher o formulário de Segurança de Dados da Play Store | B | Pendência confirmada em `DEPENDE-DE-VOCE.md:145`; sem ele o app não pode ser submetido à revisão da loja. **BLOQUEADO POR DECISÃO DO DONO**: depende de Q3 (o que declarar sobre os eixos derivados do perfil psicométrico que vão ao servidor) e de E3 corrigido primeiro (`classe-regulatoria.md`) | Dado o formulário preenchido, quando comparado campo a campo com `functions/api/*` que de fato coletam/transmitem dado, então não há divergência entre declarado e comportamento do código | `soulmon-04` |
| O-9 | Publicar/atualizar política de privacidade cobrindo todos os terceiros reais (Groq, Higgsfield, Gemini, Firebase, Cloudflare) e os eixos derivados de psicometria — **e a idade mínima correta (18+)** | B | `public/privacidade.html` existe mas não foi avaliado se cobre os quatro terceiros (`security-escopo-e-reverificacao.md §2` item 6); `classe-regulatoria.md` E3 confirma que o texto atual não declara os eixos derivados enviados à nuvem; **E6 subiu de severidade**: o texto ainda diz "não direcionado a menores de 13", contradizendo a decisão já tomada pelo dono (D-06, 18+). Play exige política que reflita o comportamento real e as decisões já tomadas | Dado a política publicada, quando cada terceiro que recebe dado do usuário (grep em `functions/api/*.js`) é conferido contra o texto, então todos aparecem nomeados com a finalidade, e a idade mínima declarada é 18+ | `soulmon-04` (correção da idade mínima pode e deve sair **antes**, é edição de texto) |
| O-10 | Publicar Termos de Uso e linká-los no onboarding (não só em Configurações) | B | `alpha-compliance` (E5) confirma: nenhum link de Termos existe hoje no app; a política só é alcançável em Configurações. Play exige termos acessíveis antes do uso pago. **BLOQUEADO POR DECISÃO DO DONO** (Q4: existirão Termos? onde aparecem no onboarding?) | Dado o onboarding pago (ritual do Oráculo), quando a tela de compra é exibida, então há um link visível e funcional para Termos de Uso e Política de Privacidade | `soulmon-04` |
| O-11 🔧 | Implementar gate de idade condizente com a idade mínima já decidida (18+, `D-06`) | B | `alpha-compliance` (E6) confirma: não há nenhum gate no app apesar da decisão já tomada. Play exige classificação etária e declaração de Famílias coerentes com o comportamento real. **Parcialmente resolvido**: a idade mínima já está decidida (D-06); falta só a implementação do gate e a correção do texto (O-9) | Dado a idade mínima de 18+, quando o onboarding é percorrido, então existe uma tela de confirmação/gate de idade condizente com essa declaração, antes de qualquer coleta de dado de perfil | `soulmon-04` |
| O-12 🔧 | ✅ Mitigação de tela para o Reroll por Créditos — **decisão já tomada pelo dono (D-05): implementar e seguir** | A/B | Lei 15.211/2025 citada em `DEPENDE-DE-VOCE.md:132-137`/`STATUS.md:698`; mitigação sugerida (deixar explícito que todo pet é mecanicamente equivalente) nunca foi implementada — `CreditsModal.tsx:216,228-229` não menciona a equivalência. Perdeu o agravante "já vale hoje": ninguém pode comprar Crédito (billing inexistente) | Dado a tela de confirmação de reroll, quando exibida, então contém o texto declarando que todo pet é mecanicamente equivalente (identidade, não poder) | `soulmon-01` (achado)→`soulmon-04` (bloqueia checklist de loja) — **texto pode ser escrito já, decisão está tomada** |
| O-13 | Corrigir `generate-sprite.js` para checar `accountTier === 'paid'` antes de gerar sprite | A | `tese-e-unit-economics.md §0`: a rota mais cara do produto não verifica tier — só a cota de `_aiGuard.js`, que é inoperante enquanto `FIREBASE_PROJECT_ID` estiver desligado (depende de O-1). Sem isso, qualquer atacante gera sprites pagos por conta nova a cada chamada, e nenhuma medição de "custo de IA por usuário pago" (tese nº3 do negócio) significa algo. **Com zero usuários pagos reais hoje, qualquer geração que ocorra é, por definição, não paga por ninguém** — item mais urgente, não menos | Dado uma conta com `accountTier !== 'paid'`, quando `POST /api/generate-sprite` é chamado, então a resposta é rejeitada (403) antes de qualquer chamada ao provedor de imagem | `soulmon-01`→execução após O-1 |
| O-14 | Corrigir `claimOrder` (SEC-3) para caminho atômico real (D1) em vez de read-then-write sobre KV eventualmente consistente | A/B | `security-escopo-e-reverificacao.md`: SEC-3 é falso-positivo admitido pelo próprio `STATUS.md`; sem D1 configurado, um recibo pode virar N contas pagas — "maior risco de dinheiro que sobrou" (`DEPENDE-DE-VOCE.md:47-64`). Em modelo de pagamento único, vazamento de entitlement é perda irrecuperável (`tese-e-unit-economics.md §8.2`). Só vira 🔴 de fato quando o billing for ligado (O-7), pois hoje não há billing configurado | Dado um dublê de KV com janela de consistência configurável (get servindo snapshot de T-60s), quando dois `claimOrder` concorrentes chegam para o mesmo `orderId`, então só um é aceito | `soulmon-04` (pré-requisito de O-7); infraestrutura pode começar em `soulmon-02` |
| O-15 | Ligar `PLAY_REQUIRE_ACCOUNT_BINDING=true` no ambiente de produção quando o billing for configurado | B | `_billing.js:179-183`: hoje é fail-open — recibo sem vínculo é aceito por padrão. Fecha a mesma classe de risco de O-14 no canal Play | Dado a flag ligada, quando uma compra sem `obfuscatedExternalAccountId` chega, então é rejeitada | `soulmon-04` |
| O-16 🔧 | ✅ Keystores no histórico do git — **decisão já tomada pelo dono (D-11): gerar keystore nova antes do primeiro envio à Play**, sem rotação/reescrita de histórico | A | Blobs de `android.keystore`/`signing.keystore` continuam recuperáveis por qualquer clone (`security-escopo-e-reverificacao.md`). Risco real só se o repo for público — **ainda `[a definir]`**. A decisão de como proceder já foi tomada; falta a execução no momento certo (antes do 1º envio) | Dado o primeiro envio à Play, quando a keystore usada é verificada, então é uma keystore gerada após 25/08/2026, distinta da que está no histórico do git | `soulmon-02`/`soulmon-04` |

---

## DESEJÁVEL — valor claro, lançamento não depende

| # | Requisito | Fronteira | Justificativa | Critério de aceite testável | Run |
|---|---|---|---|---|---|
| D-1 | Rotear crédito de Cura Instantânea (C2) para gasto cosmético, condicionado à correção de O-2 | A | Vender alívio de uma dor que o próprio app fabrica (dreno sem teto) é *pay-to-relieve*; deixa de ser problema assim que O-2 corrigir o teto (`mecanismo-e-etica.md` C2). Não é obrigatório porque, corrigido O-2, HP volta a ser recuperável de graça dentro do dia — a urgência cai | Dado O-2 corrigido, quando o usuário perde HP só pelo teto diário, então a cura por Crédito continua disponível mas não é a única saída em menos de 24h | `soulmon-01`/backlog de produto |
| D-2 | Subir o teto de cadastro diário do usuário demo (`DEMO_ACTIVITY_DAILY_CAP`) de 1 para um valor que permita o loop rodar (ex.: 3) | A | C4 🟠: reatância e frustração de autonomia; o demo mal experimenta o dia-perfeito. Não é obrigatório para produção continuar nem para a loja — é hipótese de conversão sem dado (P4=B, não medido) | Dado o teto alterado, quando o usuário demo cadastra 3 itens no mesmo dia, então nenhum é bloqueado antes do 3º | backlog de produto (`soulmon-03`, condicionado a medir antes) |
| D-3 | Corrigir `getDemoCreatureStages` para não repetir nome/sprite entre os 3 galhos demo | A | O demo vê evidência ativa contra o produto (evolução "falsa"), oposto de vender o diferencial — achado A.1 do `alpha-comportamento` | Dado o demo abre a página de Evolução, quando os 3 galhos são exibidos, então nenhum par tem nome+sprite idênticos | backlog de produto |
| D-4 | Não ligar `adsEnabled` (anúncio recompensado → Crédito → reroll) sem separar origem de crédito de anúncio do reroll | A | C5 🟠: reforço de razão variável monetizado; SDK ainda não existe, custo de desligar é zero hoje | Dado `adsEnabled=true` no futuro, quando um crédito de origem "anúncio" é gasto, então `spendCredits` recusa uso em `reroll` | backlog de produto, pré-condição antes de ligar SDK de anúncio |
| D-5 | Antecipar o aviso de irreversibilidade da bifurcação do teste de 20 itens para um passo antes da escolha | A | C6 🟡: escassez + arrependimento antecipado no pico de decisão; correção é só de texto/framing | Dado o fluxo do Oráculo, quando o passo anterior à bifurcação é exibido, então o texto já anuncia que a escolha seguinte é sem volta | backlog de produto/UX |
| D-6 | Reenquadrar ou remover o push de urgência do dreno de cocô (C7) | A | Resolve-se sozinho se O-2 for aplicado (deixa de ser emergência); caso o push permaneça, reenquadrar para ganho sem prazo | Dado O-2 aplicado, quando o cocô não é limpo, então nenhuma notificação usa linguagem de contagem regressiva de perda | backlog de produto |
| D-7 | Instrumentar o funil (ligar `telemetry.ts` já existente) nos ~6-8 pontos identificados: `install`, `onboarding_step`, `demo_pick`, `first_task_done`, `day_active`, `unlock_view`, `purchase` | B (instrumentação, não bloqueia loja) | `evidencia-comportamento.md`: infraestrutura pronta e testada, zero eventos saem hoje. É a maior alavanca por esforço do programa, mas pertence ao objetivo `soulmon-03` (P1=B), não a este run. Vale ligar mesmo com zero população hoje — prepara o terreno | Dado o cliente ligado, quando um usuário completa o onboarding, então ao menos um evento `onboarding_step` chega ao servidor e é lido em `m:*` | `soulmon-03` |
| D-8 | Diferenciar funil demo vs. pago no schema de telemetria (`EVENT_SCHEMA`) | B | Sem isso, D-7 mistura os dois usuários opostos no mesmo agregado — trava explícita do contexto (§3) | Dado dois eventos `onboarding_step` de origem demo e pago, quando agregados, então são segmentáveis por uma prop de variante | `soulmon-03` |
| D-9 | Agregado por coorte de instalação para D7/D30 | B | `applyAggregate` hoje só soma por dia, não preserva coorte — sem isso a tese nº2 do negócio nunca é medível | Dado dois usuários instalados em dias diferentes, quando ambos emitem `day_active` em D+7, então o agregado permite calcular retenção D7 por coorte de instalação | `soulmon-03` |
| D-10 | Instrumentar custo de IA por tier (`chat.js`) | B | Necessário para medir a tese nº3 do negócio de forma correta (hoje o denominador está errado, O-13 corrige o vazamento, mas a métrica em si não existe) | Dado uma chamada de chat de conta paga, quando processada, então um registro diário grava tokens/chamadas segmentado por tier | `soulmon-03` |
| D-11 | Dashboard/leitura dos agregados `m:*` | B | Hoje é escrita sem leitura; sem isso D-7 a D-10 não geram decisão nenhuma | Dado agregados gravados, quando uma rota autenticada é chamada, então devolve os agregados por dia em JSON | `soulmon-03` |
| D-12 | Mergear `claude/canonical-classification` do Bestiário na `main` e apontar o ref default para `origin/main` | — (infra do Oráculo, transversal) | Decisão já tomada pelo dono (P2=A); fecha o modo de falha silencioso descrito no contexto §8 | Dado o merge feito, quando `export-canonico.mjs`/`sync-oracle-data.mjs` rodam sem flag, então usam `origin/main` como ref, não a branch antiga | `soulmon-01` (bloqueado hoje — repos irmãos não clonados, ver Suposições/Lacunas) |

---

## OPCIONAL — só se sobrar capacidade

| # | Requisito | Fronteira | Justificativa | Critério de aceite testável | Run |
|---|---|---|---|---|---|
| P-1 | Esconder a barra "N/30 dias perfeitos" abaixo de um piso de histórico | A | C8 🟡, o mais fraco dos oito achados éticos — o próprio autor recomenda não priorizar antes de C1–C4 | Dado `totalPerfectDays < piso`, quando a missão é exibida, então mostra só o número, sem barra visual | backlog de produto, baixa prioridade |
| P-2 | Permitir ao demo percorrer o ritual do Oráculo até a véspera do reveal (ver a leitura de si mesmo antes de comprar) | A | `mecanismo-e-etica.md` A.1: troca "contar sobre" o diferencial por "experimentá-lo", mas **alonga o funil do demo** — o próprio autor nomeia isso como aposta que precisa ser testada, não decisão | Dado o novo fluxo, quando testado A/B, então mede-se conversão sem decidir por opinião | `soulmon-03` (precisa de telemetria e população para validar antes) |
| P-3 | Travar `class-system` por commit/SHA fixo em vez de branch default | — | Risco de versão citado no contexto §8 (mudança upstream altera comportamento silenciosamente); baixo, porque hoje é integração real testada por `cascata.parity.test.ts` | Dado o `package.json`, quando lido, então a dependência aponta para um commit fixo, não um branch móvel | backlog técnico |

---

## Não-funcionais transversais

| # | Requisito | Classe | Fronteira | Justificativa | Critério de aceite testável | Run |
|---|---|---|---|---|---|---|
| NF-1 | CI de `tsc --noEmit` + `vitest run` rodando em todo PR | OBRIGATÓRIO | A | Autorizado explicitamente (P5=A). Hoje só existem builds Android/desktop; a regra de auto-merge (`CLAUDE.md:43-53`) depende de alguém lembrar de rodar os comandos à mão — maior alavanca de confiabilidade por esforço do repo | Dado um PR aberto, quando o workflow roda, então falha o merge se `tsc` ou `vitest` falharem, sem intervenção manual | `soulmon-01` |
| NF-2 | Performance mínima em Android `minSdkVersion=24` — declarar que o app exige Chromium 111+ e o comportamento em aparelhos abaixo disso | OBRIGATÓRIO | B | `DEPENDE-DE-VOCE.md:81-91`: o app é oferecido a aparelhos que não conseguem rodá-lo. Sem decisão, a Play recebe reviews de crash em aparelhos incompatíveis, e a ficha da loja pode declarar suporte que não existe. **Parcialmente resolvido**: dono decidiu subir `minSdkVersion` para o que realmente funciona (`D-20`) | Dado a decisão tomada, quando testado em um emulador com Chromium <111, então o app OU não é oferecido (Play filtra por `minSdkVersion` correto) OU mostra mensagem de incompatibilidade em vez de tela branca | `soulmon-04` |
| NF-3 | i18n pt-BR + en-US sempre os dois, sem string órfã | OBRIGATÓRIO | A | `CLAUDE.md:5-6`; já houve regressão documentada (`aria-label` e push das 22h só em PT) — é regra de produto, não estética | Dado qualquer string de UI nova, quando revisada, então existe par PT/EN condicionado por `language === 'pt-BR'` — grep não encontra string hardcoded só em um idioma fora dos falares do pet (`speak()`) | contínuo, todos os runs |
| NF-4 | Deploy manual do worker (`workers/`) documentado como pendência 🔴, não corrigido neste run | OBRIGATÓRIO (do processo, não de código) | A | `CLAUDE.md:67-68`; `workers/` não builda no push da `main`; é pendência aberta em `DEPENDE-DE-VOCE.md:1`. Este run não propõe automação (fora do escopo declarado C — auditar/priorizar), mas precisa registrar o risco de versão desatualizada afetando SEC-5 (push), que hoje atinge os 2 usuários do DigiApp | Dado o `DEPENDE-DE-VOCE.md` atualizado, quando lido, então contém a pergunta "qual versão do `push-scheduler.js` está deployada hoje?" com 🟠 | `soulmon-01` (já registrado em `security-escopo-e-reverificacao.md`) |
| NF-5 | Bump de `CACHE_VERSION` em `public/sw.js` a cada mudança incompatível de asset/HTML | OBRIGATÓRIO | A | `CLAUDE.md:69-70`; sem isso usuários ficam presos em cache velho — regra de processo já em vigor, só listada para não regredir | Dado uma mudança incompatível de asset/HTML em um PR, quando revisado, então `CACHE_VERSION` foi incrementado no mesmo PR | contínuo |
| NF-6 | Acessibilidade: nenhum requisito específico documentado no contexto além do que já existe (`prefers-reduced-motion`, contraste dos dois temas) | DESEJÁVEL | A | Não há norma de acessibilidade citada em §6; o único ponto com evidência concreta é o footgun 10 (texto quase-preto sobre fundo escuro), já corrigido. Não afirmar WCAG sem fonte | Dado qualquer tela nova, quando revisada, então `prefers-reduced-motion` é respeitado e a cor de texto usa os tokens `--sm-*`, não `--foreground`/`--background` do scaffold shadcn | contínuo |
| NF-7 | Observabilidade mínima de erro em produção (Cloudflare Real-time Logs) documentada como acesso não disponível a este run | OPCIONAL (para este run) | A | `evidencia-comportamento.md`: logs existem mas não são estruturados nem acessíveis à squad; não é ação executável aqui, só registro de lacuna | Dado o `DEPENDE-DE-VOCE.md`, quando lido, então contém pergunta sobre acesso ao dashboard do Cloudflare para leitura de logs | pendência registrada, sem run designado |

---

## Conformidade (contexto §6) — só o que está documentado, lacuna vira pergunta ao dono

| # | Requisito | Fonte documentada | Classe | Pergunta ao dono se bloqueado |
|---|---|---|---|---|
| C-1 | Mitigar/decidir o Reroll por Créditos face à Lei 15.211/2025 (ECA Digital) | `DEPENDE-DE-VOCE.md:132-137`, `STATUS.md:698` | ✅ RESOLVIDO (= O-12, D-05) | — |
| C-2 | Consentimento específico e destacado por finalidade para dado sensível (sono/passos), se Fase 4 avançar | LGPD art. 11, citado em `PLANO-TAREFAS.md:187` | FORA DE ESCOPO deste run | Fase 4 está fora de escopo por decisão do contexto §10.5 — não reabrir, e agora também bloqueada pela ausência de conta Play verificada (conta será pessoal, sem CNPJ) |
| C-3 | Formulário de Segurança de Dados da Play + declaração de idade/Famílias | `DEPENDE-DE-VOCE.md:145`, contexto §6 | OBRIGATÓRIO (= O-8, O-11) | Q3 (o que declarar sobre eixos derivados) segue aberta; idade mínima **já respondida** (Q5=18+, D-06) |
| C-4 | Política de privacidade linkada e atualizada, cobrindo transferência internacional a terceiros | `BILLING-SETUP.md:194,209` | OBRIGATÓRIO (= O-9) | Q4 (Termos existirão? onde aparecem?) segue aberta |
| C-5 | Direitos autorais — sprites/nomes de terceiro | `STATUS.md:697`, `Attributions.md` | ✅ RESOLVIDO — não é requisito pendente | — |
| C-6 | Health Connect / conta de organização verificada / declaração de health app | `PLANO-TAREFAS.md:186` | FORA DE ESCOPO — só se Fase 4 for aprovada | Não perguntar agora; §1 do contexto **já confirma**: conta será pessoal, sem CNPJ — bloqueio conhecido e aceito enquanto Fase 4 não avançar |

**Nenhuma norma é afirmada aqui além do que o contexto §6 já cita como documentado.** Toda
leitura de "isto é exigido por LGPD/ECA Digital/Play" acima é citação da fonte já presente no
contexto ou nos artefatos da onda 1 — não é parecer jurídico novo deste documento (P7=B).

---

## Linha de corte — o que fica FORA desta iniciativa e por quê

A linha de corte separa "quebra o produto ou a barra do contexto" de "fica pior, mas roda":

1. **D-2 (subir teto do demo) e P-2 (ritual estendido ao demo) ficam ABAIXO da linha**
   apesar de terem justificativa comportamental forte, porque P4=B proíbe qualquer afirmação
   quantitativa — ambos são apostas de conversão sem dado, e P-2 explicitamente alonga o
   funil de um dos dois usuários opostos, o que a trava do contexto (§3) exige testar antes
   de decidir, não decidir por opinião de squad. E ambos, hoje, dependem de existir
   população de terceiro para serem testados.
2. **D-7 a D-11 (telemetria) ficam classificados DESEJÁVEL/run `soulmon-03`, não
   OBRIGATÓRIO deste run**, porque o objetivo declarado de `soulmon-01` é C (auditar e
   priorizar), não B (instrumentar) — mesmo sendo, na prática, a maior alavanca do
   programa inteiro. Não confundir "mais importante" com "obrigatório desta fronteira".
3. **Tudo que toca Fase 4 (sensores/Health Connect) fica fora por decisão explícita do
   contexto §10.5** — nenhum requisito de conformidade dela entra nem como OBRIGATÓRIO
   nem como DESEJÁVEL, e agora há um segundo motivo: conta Play pessoal, sem CNPJ (§1).
4. **Rotação de keystore e troca de URL de produção não viram requisito de execução deste
   run** (§10.1 e §10.6) — só a decisão em si (O-16) é registrada como pendência, **já
   respondida pelo dono** (D-11: keystore nova, sem reescrever histórico).
5. **P-1 e P-3 ficam OPCIONAL** porque nenhum dos dois altera a barra binária de "quebra
   sem isto": C8 é o achado ético mais fraco (o próprio `alpha-comportamento` recomenda não
   priorizar); travar o `class-system` por SHA é higiene de engenharia sem incidente hoje.
6. **Mudança de preço nunca entra em nenhuma lista** (§10.7) — nem como requisito nem como
   recomendação, em nenhum nível.

---

## Suposições e lacunas

- `[suposição]` Este documento assume que o run `soulmon-01` só **classifica e prioriza
  DENTRO da iniciativa** — a ordem final entre OBRIGATÓRIOS de fronteira A (proteção dos
  usuários do DigiApp / preparo do Soulmon) e fronteira B (Play Store) é decisão do
  `alpha-product-manager`, que roda em paralelo.
- `[a definir]` Itens marcados **BLOQUEADO POR DECISÃO DO DONO** que **seguem abertos**:
  O-8, O-10 (Q3, Q4). Itens que **já foram resolvidos** pelo dono nesta rodada: O-11
  (parcial, D-06), O-12 (D-05), O-16 (D-11), NF-2 (D-20) — falta apenas execução.
- `[a definir]` D-12 (merge do Bestiário) está registrado como requisito mas **não é
  executável hoje**: os repos irmãos (`../Besti-rio-`, `../Class-System`,
  `../teste-personalidade`) não estão clonados neste ambiente — é pendência material, não
  só de decisão.
- `[suposição]` A ordem "run" atribuída a cada item segue o sequenciamento do
  `PROGRAMA.md` (01=auditar, 02=separar do DigiApp, 03=telemetria, 04=lançamento). Onde um
  item de segurança (O-1, O-13, O-14) tem consequência tanto na proteção do DigiApp/Soulmon
  hoje quanto no lançamento, ele aparece com as duas fronteiras (A/B) e o run mais cedo é o
  que resolve o incidente aberto, não necessariamente o run "dono" do tema.
- Nenhuma contagem de requisitos usa dado de telemetria (P4=B) — todos os critérios de
  aceite são testáveis por código/comportamento observável, nunca por "achamos que melhora
  conversão".
