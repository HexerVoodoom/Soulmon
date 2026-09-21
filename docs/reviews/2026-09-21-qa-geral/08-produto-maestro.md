# Rodada 08 — Produto (maestro + especialistas inline)

**Data:** 2026-09-21 · **Condução:** `soulmon-maestro`, com os 13 especialistas rodados inline (condensado, sem subagentes)
**Pergunta da rodada:** *Que parte do PRODUTO nunca foi analisada por nenhuma rodada, e o que falta para o primeiro usuário real?*
**Contexto crítico:** ninguém nunca usou o app em produção (`docs/manual/01-VISAO.md` §10); gargalo declarado = distribuição (`docs/PLANO-PRODUTO.md` Parte 5).
**Modo:** somente leitura. Nenhum arquivo do repo foi tocado.

## 0. O que as rodadas anteriores já cobriram (para não repetir)

Só existe **uma** rodada: `docs/reviews/2026-08-03/`. Quatro arquivos:

| Arquivo | O que cobriu | O que aconteceu desde então |
|---|---|---|
| `00-CONSOLIDADO.md` | PI (Digimon no prompt/sprites/masmorra), curva 10 dias perfeitos, zero telemetria, `GENERIC_LINES` (diferencial desligado), economia invertida (Bits só de minijogos), chat sem memória, contas por hash de e-mail, punição/vergonha, chave VAPID exposta, `App.tsx` monolítico | PI: resolvido 09/08 (sprites e nomes originais). Nome `Soulmon`: **mantido por decisão do dono** 21/09 (`REGISTRO-DE-DECISOES.md` §14.1). Curva: Fase 1 (teto 1 coração/dia, perdão de ausência). Telemetria: **existe** (`functions/api/metrics.js` `EVENT_SCHEMA`), agregada. Sprite no reveal: demo vê **silhueta** (`REVEAL_DEMO`). Chat: `chat.memoria.test.js` existe. Contas: Firebase Auth no portão. Economia: **ainda invertida** (ver gamification). |
| `soulmon-growth-aso.md` | Posicionamento, nome, categoria de loja, listagem pt-BR/en-US completa, canais, viralidade, comunidade mínima | Listagem foi escrita sob a premissa de **trocar o nome** — premissa vetada. Nenhum canal foi testado. |
| `soulmon-monetization-strategist.md` | 8 modelos, preço, COGS de IA, 4 portas da loja, lista do que nunca se vende | Modelo decidido (compra única + estação cosmética). Sprite sob demanda por ocasião (`spriteTrigger.ts`). |
| `soulmon-user-researcher.md` | Só o Anexo A (achado do `GENERIC_LINES`). 14 seções `[EM ABERTO]` | Continua em rascunho. **ICP/personas seguem sem dono.** |

Fora de `docs/reviews/`, o repo tem auditorias internas que funcionam como rodadas: `PLANO-PRODUTO.md` (2 rodadas + QA), `REGISTRO-DE-DECISOES.md` §8/§10 (mapa de exposição, o que os relatórios não cobriram), `STATUS.md` §5 (loop de QA), check-up com 5 personas dirigidas por agente (`STATUS.md` §2). Quando um achado abaixo já está num desses, marco **"já coberto (interno)"**.

Convenção: `[FATO]` verificável no repo · `[HIPÓTESE]` julgamento · evidência em `caminho` + SÍMBOLO.

---

## 1. Achados por especialista

### 1.1 `soulmon-user-researcher`

1. **[FATO] O primeiro usuário real é forçado, pela arquitetura, a ser um usuário que nunca vê o diferencial.** A compra só existe pela Google Play (`src/utils/playBilling.ts`, comentário de cabeçalho: *"No navegador/PWA: `isBillingAvailable()` é false"*; `src/components/UnlockAccountModal.tsx` `unavailable`: *"No navegador não dá para cobrar"*) e o app **não está na Play** (`docs/STATUS.md` §3.2, 12 itens 🔴). Logo, qualquer pessoa que abrir `soulmon.mateus-sprnd.workers.dev` hoje só pode ser **demo**: escolhe 1 de 6 criaturas prontas (`src/utils/monetization.ts` `PREMADE_CHARACTERS`) e nunca chega ao pet gerado. Consequência: **todo teste com usuário real feito hoje testa o Soulmon sem a única coisa que o diferencia do Finch.** Nenhuma rodada nomeou isso.
2. **[FATO] O muro de 18+ contradiz as personas usadas para testar.** `src/utils/consent.ts` `MIN_AGE_YEARS = 18`, aplicado nos dois caminhos (`SoulmonOnboarding.tsx`, comentário *"Muro de idade"*). O check-up de personas de ago/2026 (`docs/STATUS.md` §2) usou "adolescente com TDAH que some e volta" como persona nº 1. O produto barra essa pessoa. Ninguém decidiu se o ICP é 18+ ou se o muro é só defesa legal — o público "cresceu com Digimon/Tamagotchi" (`PLANO-PRODUTO.md` Parte 3) hoje tem 25–40, então provavelmente cabe; mas é decisão, não acidente.
3. **[FATO] O caminho pago pede nome completo, data, hora e cidade de nascimento** (`docs/manual/02-REGRAS-DE-NEGOCIO.md` §22, passos 1–4; `functions/api/account.js`, nota *"seu nome completo, data, hora e local de nascimento NUNCA são enviados ao servidor"*). **[HIPÓTESE]** Para um app de tarefas é um pedido inédito na categoria; parte do ICP (o gamer racional) pode rejeitar mapa astral/numerologia como insumo, outra parte pode ser atraída. Zero evidência nos dois sentidos. Nunca analisado.
4. **[FATO] Não existe canal de feedback ou suporte dentro do app.** `grep mailto|suporte|feedback` em `src/` só acha a frase *"fale com o suporte"* em `src/components/AccountSection.tsx` — sem link, e-mail ou formulário. O primeiro usuário real não tem como contar o que viu.
5. **Já coberto:** ICP vazio (`01-VISAO.md` §3 declara). **Novo:** o único "teste com usuário" do repo é um agente dirigindo o navegador com 5 personas sintéticas — registrado como check-up, e foi útil (achou o checkbox de 2 px), mas o `REGISTRO-DE-DECISOES.md` §2 lista corretamente **um** teste real (o dono, `carga-diaria.md`). Não há teste de 5 pessoas no Oráculo (experimento nº 1 do consolidado) e ele continua sendo o mais barato de todos.

### 1.2 `soulmon-ip-brand-guardian`

1. **Já coberto:** Digimon removido (09/08); nome `Soulmon` = criatura da Bandai, **decisão do dono de manter** (§14.1) com gatilho de revisão = notificação formal. Não reabro.
2. **[FATO] Anúncios recompensados existem no código e nenhum documento de produto os declara.** `functions/api/_entitlements.js` `grantAdReward` (`AD_DAILY_CAP`, `AD_REWARD_CREDITS`), `src/components/CreditsModal.tsx` `onWatchAd` / *"Assistir anúncio (+N)"*, `src/utils/monetization.ts` `ADS_ENABLED`. O briefing (`docs/squad/00-BRIEFING.md` §2) diz "nenhum anúncio"; o relatório de monetização não avaliou ads; `docs/PLAY-DATA-SAFETY.md` não declara SDK de publicidade. Se `ADS_ENABLED` for ligado, o formulário de Segurança de Dados muda (identificador de publicidade) e o AdMob exige política própria. O botão fica escondido até o servidor confirmar (`CreditsModal.tsx`), o que é correto — mas é uma porta latente sem dono.
3. **[FATO] O app tem sinais de "saúde e bem-estar" e ninguém avaliou a classificação da Play.** Check-in de humor (`moodLog` sobe no save — `PLAY-DATA-SAFETY.md` §2.6), janela de sono (`src/utils/restWindow.ts`), trava de crise no chat (`src/utils/chatSafety.ts` `needsBridge` / `bridgeReply`). A Play trata "humor" e "sono" como dados de saúde; a Fase 4 (sensores) já foi identificada como "conta de organização verificada" (`STATUS.md` §3.2), mas **a Fase 3 sem sensores** pode já cair na declaração de app de saúde por causa do humor. `[HIPÓTESE]` — conferir na política vigente antes de submeter.
4. **[FATO] Licença comercial dos sprites gerados pela Higgsfield e das fontes em `public/fonts` não está em `docs/Attributions.md`** com a mesma disciplina que o áudio ganhou (seção "Áudio", 21/09). Para o pet gerado ser "seu, único", o titular comercial da imagem precisa estar claro nos termos (`public/termos.html`). Nunca analisado.

### 1.3 `soulmon-productivity-expert` (nunca rodou)

1. **[FATO] Não existe prazo, hora nem lembrete por tarefa.** `src/types/taskModel.ts` tem `HabitSchedule` (`weekdays` / `timesPerWeek` / `everyNDays`), `effort`, `HabitAnchor` — modelo de hábito rico — mas `grep dueDate|deadline|reminder|remindAt` em `src/types/` = 0. O push é global por horário (10/16/21/22 BRT, `workers/`) e condicionado ao progresso, não à tarefa. Para um app cuja Camada 1 é "gestão de tarefas", é ausência de paridade com **qualquer** to-do — e o ICP que já usa Todoist/Google Tasks não migra sem isso. `[HIPÓTESE]` Pode ser decisão deliberada (hábitos, não tarefas de projeto); se for, `01-VISAO.md` deveria dizer.
2. **[FATO] Zero importação ou integração** (calendário, Google Tasks, Todoist, Notion): nenhum arquivo em `src/utils/` ou `functions/api/`. Custo de troca do usuário = recomeçar do zero. Nunca discutido.
3. **[FATO] Duas funções de IA de produtividade existem e nunca foram avaliadas como produto:** `functions/api/suggest-tasks.js` (IA sugere tarefas) e `functions/api/transcribe.js` (voz → tarefa). Estão sob teto de custo (`functions/api/costCeiling.test.js`, `_aiGuard.js`), mas ninguém perguntou se são o que faz a pessoa cadastrar a 1ª tarefa mais rápido — o evento `first_task_done` (`src/utils/telemetry.ts` `TELEMETRY_EVENTS`) tem `tier`, não tem `path` (voz/sugestão/manual).
4. **Já coberto (interno):** "4 cards de meta-gestão antes da 1ª tarefa" (`PLANO-PRODUTO.md` Parte 6 item 3); quick-add (`src/components/QuickAddBar.tsx` existe → parece feito).

### 1.4 `soulmon-gamification-expert`

1. **Já coberto, NÃO corrigido:** economia invertida — Bits continuam vindo só de minijogos e masmorra (`01-VISAO.md` §8 tabela "As três moedas"; `src/utils/currencies.ts`). O consolidado pôs em "Próximo". Um mês e meio depois, a Camada 3 ganhou som, arte, torneio por season, coop — e a Camada 1 continua sem gerar moeda. É o desvio de foco mais mensurável do repo.
2. **[FATO] O Nível de Vínculo foi implementado** (`src/utils/bond.ts` `BondRewardKind`, `CompanionHUD.vinculo.render.test.tsx`) com a regra "só entra na home se duas outras leituras saírem" (`PLANO-PRODUTO.md` Parte 4). **Ninguém auditou se as duas leituras saíram.** A contagem de leituras da HUD pós-Fase 2 não existe em doc nenhum.
3. **[FATO] A calibragem "1ª recompensa cosmética no dia 1, 2ª no dia 3"** (`PLANO-PRODUTO.md` "A correção de calibragem da rodada 2") nunca foi conferida contra as constantes reais de `bond.ts`. É um `grep` de 5 minutos que nenhuma rodada fez.
4. **Já coberto (interno):** dez perdões empilhados e "o que ainda dói perder" (`REGISTRO-DE-DECISOES.md` §10.1) — a resposta candidata (prestígio cosmético por não usar proteção, §10.5 I.3.1) segue **não implementada**.

### 1.5 `soulmon-monster-taming-designer` (nunca rodou)

1. **[FATO] "Única no mundo" é, na prática, 9 linhas × 4 tiers + um sprite gerado.** `docs/PERGUNTAS-DO-DONO.md` #1 fala em "36 ícones-ficha (9 linhas × 4 tiers)"; `src/utils/soulProfile/bestiary/select.ts` mapeia perfil → linha. Quantos perfis caem na mesma linha? Não há evento de telemetria de linha (por privacidade, correto) nem simulação offline da distribuição. Se 60% dos perfis caírem em 2 linhas, a promessa (`PLANO-PRODUTO.md` Parte 3, "Pet único por pessoa") vira "9 famílias". Nunca medido — e é mensurável **sem usuário** (Monte Carlo sobre respostas).
2. **[FATO] Consistência visual entre estágios nunca foi vista por olhos de fora.** `src/utils/spriteTrigger.ts` `SpriteOccasion 'A'|'B'|'C'`, `birthBatch`/`spriteBatch` geram por ocasião (rookie no nascimento, resto na evolução — implementa a recomendação §2.0 do consolidado). O experimento nº 5 do consolidado (teste cego "são a mesma criatura?") **não foi feito**. Sem ele a evolução — o segundo maior momento emocional — é aposta.
3. **[FATO] A criatura grátis ramifica?** Pergunta em aberto desde `REGISTRO-DE-DECISOES.md` §10.4 #1. Segue sem resposta; decide se o demo tem mecânica igual (`01-VISAO.md` §8 diz "regras idênticas") **e** árvore igual. Se idênticas, o pago compra só arte — a copy do `UnlockAccountModal` precisa dizer isso.
4. **[FATO] Renascimento (uma vez só, `src/utils/rebirth.ts`, `docs/RENASCIMENTO.md`)** nunca foi avaliado pelo repertório do gênero (Digimon V-Pet: morte → ovo novo é o loop de longo prazo). Fora do demo (`rebirthRefusal 'not-paid'`).

### 1.6 `soulmon-mobile-game-designer` (nunca rodou)

1. **[FATO] Peso do primeiro carregamento nunca medido.** `dist/assets` = 122 MB commitados; JS: `pool-*.js` 832 KB + `index-*.js` 638 KB + `index.esm-*.js` 194 KB; CSS 143 KB; `intro-*.mp4` 2,5 MB e `evolution-bg-*.mp4` 3,9 MB; `vite.config.ts` `build.target: 'esnext'` (sem transpilação). `public/sw.js` `PRECACHE_URLS` pré-cacheia no install. Em 4G brasileiro, o splash pode ser a 1ª e última tela. Sem Lighthouse, sem orçamento.
2. **Já coberto (interno), decisão pendente:** WebView velho → tela branca (`docs/STATUS.md` §5 "🔴 ABERTO — `minSdkVersion = 24`"): 87 usos de `oklch()`, 97 de `color-mix()`. Três saídas listadas; a opção 2 (aviso por `CSS.supports` no `index.html`) não muda alcance e não precisa do dono — está parada por estar dentro de um item "decisão do dono".
3. **[FATO] Cold start social: o primeiro usuário verá telas sociais vazias.** `src/components/CoopPanel.tsx`, `TournamentPage.tsx` (`community.pvpGate.test.js`), `LibraryPage.amigos.render.test.tsx`, ranking em `functions/api/community.js`. Com 0–10 usuários, torneio, amigos e coop são salas vazias. Nenhum doc desenha o estado "você é o primeiro" nem esconde essas abas até haver gente.
4. **[FATO] Steam antes da Play.** `functions/api/_billing.js` seção Steam (*"Nada aqui foi testado contra a Valve"*), `desktop/`, `docs/PLANO-DESKTOP-STEAM.md`, `STATUS.md` §3.3 (US$ 100 + App ID). Uma 3ª loja com investimento contínuo enquanto a 1ª não tem usuário. Custo de foco nunca contabilizado.

### 1.7 `soulmon-behavioral-psychologist` (nunca rodou)

1. **[HIPÓTESE forte] O Oráculo funciona por efeito Barnum — força e risco.** Nome completo → numerologia, data/hora/cidade → mapa astral (`02-REGRAS-DE-NEGOCIO.md` §22), + 6 perguntas + 20 itens Big Five/HH (`src/utils/soulProfile/personality/questions.ts` `SOUL_TEST_ITEMS`). O "essa sou eu" é o mecanismo do produto; descrições com insumo pessoal produzem identificação alta **independentemente da validade**. Torna o reveal robusto (bom) e vulnerável ao usuário cético que percebe o truque (ruim). Nenhum doc discute; `docs/ORACULO.md` descreve o pipeline, não o efeito.
2. **[FATO] Trava de crise existe e nunca foi revisada por quem entende de crise.** `src/utils/chatSafety.ts` `needsBridge`, `bridgeReply`, `chatSafetyDecision`; diretório externo + serviços locais decididos em §14.2; "caminho determinístico no servidor" ainda **aberto** (`01-VISAO.md` adendo). O app convida a pessoa em crise (tese anti-punição) e responde com um LLM de 8B (`llama-3.1-8b-instant`). Risco alto, custo de revisão baixo.
3. **[FATO] O ponto de menor motivação recebe a maior fricção:** conta na 1ª tela (já coberto, aposta 6) **+** muro 18+ **+** consentimento **+** `GOOGLE_SEM_RESPOSTA_MS = 120_000` (`SoulmonOnboarding.tsx`) — dois minutos de espera silenciosa se o popup do Google não responder. Novo: o timeout de 120 s. Ninguém mediu quanto tempo a pessoa aguenta ali.
4. **Já coberto:** superjustificação (`REGISTRO` §9), punição/vergonha (consolidado §5 → Fase 1 feita). **Novo:** o "modo pausa" (consolidado §5 item 2) virou perdão automático de ausência ≥2 dias (`PLANO-EVOLUCAO.md` 1.2) — melhor que pausa manual, mas ninguém confirmou se a pessoa que **planeja** sumir (viagem, cirurgia) sabe que pode.

### 1.8 `soulmon-product-designer` (nunca rodou)

1. **[FATO] Não existe compartilhamento em lugar nenhum.** `grep navigator.share|canShare` em `src/` = 0. O "steelman viral" (`PLANO-PRODUTO.md` Parte 5: "o reveal do Oráculo é conteúdo nativamente compartilhável") não tem botão. A "lição 18 — card mensal compartilhável" (`REGISTRO` §10.5) segue não feita. `src/components/BirthCard.tsx` existe (a peça) — sem saída.
2. **[FATO] Sem feedback/suporte/avaliação in-app** (ver 1.1.4). Também sem prompt de avaliação na loja (irrelevante agora, relevante no dia da Play).
3. **[FATO] O fluxo de onboarding mudou depois da última contagem.** `PLANO-PRODUTO.md` Parte 0 registra 3 contagens erradas e a lição "só o navegador mede" (8 telas). Desde então entraram: portão Firebase com Google (`SoulmonOnboarding.portao.render.test.tsx`), `REVEAL_DEMO` em silhueta (REGISTRO 13.19), 14 canvases da Fase 2. **Não há contagem nova.** A lição foi registrada e não virou rotina.
4. **[FATO] Estados vazios sociais** (ver 1.6.3) e **estado "sem rede"**: `navigator.onLine` aparece em 7 componentes, mas o princípio 4 ("o jogo continua íntegro com o backend morto") nunca foi testado como jornada (abrir o app em modo avião no dia 2).
5. **Já coberto (interno), parece feito:** focus-trap/Escape (`src/hooks/useDialogA11y.ts`), checkbox 44 px, `:focus-visible`, contraste `--sm-muted`.

### 1.9 `soulmon-monetization-strategist`

1. **[FATO] O plano manda "priorizar o funil web"; o código não cobra na web.** `PLANO-PRODUTO.md` Parte 3: *"~R$ 27 no funil web direto. Priorizar o funil web."* × `playBilling.ts` / `UnlockAccountModal.tsx` `unavailable`. Nenhum provedor web (Stripe, Mercado Pago, Pix) em `functions/api/_billing.js` — só `PRODUCTS` (Play) e `STEAM_ITEMS`. Contradição plano × código que ninguém apontou. **Receita possível hoje = 0 em todas as superfícies** (Play não publicada, web não cobra, Steam não configurada).
2. **[FATO] Anúncios recompensados** (ver 1.2.2): o relatório de monetização avaliou 8 modelos e **ads não estava entre eles**, e o código já tem a porta. Precisa de decisão: apagar (lápide, como `HEART_COST_CREDITS`) ou avaliar.
3. **Já coberto e feito:** reembolso Play × sprite (`_billing.js` `isPlayPurchaseVoided`, `_entitlements.js` `auditRefunds`); sprite sob demanda; Nova Leitura determinística (loot box resolvida).
4. **[FATO] Não existe cortesia/cupom.** `_entitlements.js` só concede via `applyVerifiedPurchase` (Play/Steam). Para o dono dar o tier pago a 10 testadores (a única forma de alguém ver o diferencial antes da Play), não há rota. É a peça mais barata e mais bloqueante desta rodada.

### 1.10 `soulmon-retention-analyst`

1. **Já coberto → resolvido em parte:** telemetria existe — `functions/api/metrics.js` `EVENT_SCHEMA` (install, onboarding_step, demo_pick, first_task_done, day_active, unlock_view, purchase, week_active, reveal_seen, retained, evolve, welcome_back, after_bad_day…), agregada por dia, allowlist, opt-out (`src/utils/telemetry.ts`). Desenho de privacidade sólido.
2. **[FATO] Ninguém consegue ler.** `METRICS_ADMIN_KEY` não definido (`STATUS.md` §3.2: *"você não consegue ler nada até definir esse segredo"*). E **não há relatório/dashboard/script de leitura** — `metrics.js` expõe JSON bruto. O primeiro usuário real vai gerar dado que ninguém vai olhar.
3. **[FATO] O desenho agregado responde 2 das 3 teses do Apêndice, não 3.** Conversão demo→pago: `unlock_view` + `purchase` ✔. D30: `retained { bucket }` ✔ (aproximado, sem coorte). **Custo de IA por usuário pago ≤ R$ 8: nenhum evento** — só o painel da Higgsfield/Groq, manual. Ninguém apontou o buraco.
4. **[FATO] Não existe runbook do primeiro usuário:** quem olha o quê, em que dia, e qual número faz parar ou seguir. `REGISTRO-DE-DECISOES.md` §7 tem 12 apostas com número — mas não diz *quando* a primeira leitura acontece nem o tamanho mínimo de amostra para decidir algo.
5. **[FATO] Sem reengajamento fora do push.** Firebase Auth tem e-mail; nenhum e-mail transacional/lifecycle em `functions/` ou `workers/`. Quem nega push some para sempre. Nunca analisado.

### 1.11 `soulmon-growth-aso`

1. **[FATO] O relatório de ASO ficou órfão da premissa.** Recomenda trocar o nome e escreve listagem para o nome novo (§A/§B); o dono manteve `Soulmon` (§14.1). Listagem, keywords e roteiro de screenshots precisam de **re-baseline** com o nome mantido — e com a decisão de PI documentada como risco assumido na ficha.
2. **[FATO] Sem domínio próprio e sem landing.** URL de produção `soulmon.mateus-sprnd.workers.dev` (`capacitor.config.json`, `desktop/renderer/src/config.ts`); `STATUS.md` §3.4 passo 2 "Publicar o domínio próprio" pendente; `grep landing` em `docs/` = 0. O canal nº 1 recomendado (TikTok/Reels) não tem para onde apontar.
3. **[FATO] O teste de distribuição (Parte 5: ~10 vídeos de reveal) nunca foi executado** — nenhum registro em `docs/`. É o único experimento que ataca o gargalo declarado, e o único que não aconteceu.
4. **[FATO] `public/screenshots` tem 3 imagens** (manifest PWA). Os 8 screenshots de loja (A.5) e o vídeo de 25 s (A.6) não foram produzidos. A SQUAD-ARTE gerou dezenas de assets de jogo e zero de loja.

### 1.12 `soulmon-tech-feasibility` (nunca rodou)

1. **[FATO] `src/App.tsx` = 6.149 linhas** (briefing: ~1.500; consolidado: 1.904). Cresceu 3× desde a última rodada. Regra de banho mora nele acoplada a React (`STATUS.md` §2, nota do overlay). Já coberto como "monolítico"; **novo é a taxa de crescimento** — e como overlay/widgets importam regras de `src/utils/`, tudo que fica no `App.tsx` é regra que as outras superfícies não alcançam.
2. **[FATO] Ponto forte real:** 227 arquivos de teste, contratos que travam teses (`src/*.contract.test.ts`, `docsSemMentira.contract.test.ts`, `i18nSemPtSozinho.contract.test.ts`), paridade cliente↔servidor (`saveId.parity.test.js`, `bond.parity.test.js`). Nenhuma rodada creditou isso; é o que permite a um dev solo mudar regra sem medo.
3. **[FATO] SEC-3 segue aberto por falta de binding:** `wrangler.jsonc` sem `d1_databases` → `claimOrderAtomic` nunca roda (`STATUS.md` §3.2). Migrations prontas (`migrations/0001_order_claims.sql`). Já coberto (interno); bloqueia dinheiro, não bloqueia o 1º usuário demo.
4. **[FATO] `dist/` (123 MB) commitado** (`PLANO-EVOLUCAO.md` "dist/ é commitado"). Cada build de mp4/PNG entra no histórico; o clone cresce a cada rodada de arte. Nunca analisado como custo de bus-factor (clone lento; limite de 100 MB/arquivo do GitHub é o próximo muro).
5. **[FATO] Redirect do Firebase (`authDomain` ≠ domínio do app)** — já coberto (`REGISTRO` §10.2) como hipótese **não reproduzível sem conta real**. Continua sem reprodução; se verdadeira, o portão é parede para Safari/Firefox.

### 1.13 `soulmon-product-manager`

1. **[FATO] "Primeiro usuário real" não está definido em nenhum documento.** Não há resposta para: é o dono? 10 conhecidos? estranho via TikTok? PWA ou APK? demo ou cortesia paga? `01-VISAO.md` §10 diz "gargalo = distribuição" e `PLANO-PRODUTO.md` Parte 5 diz "instrumentar e testar distribuição. Só isso." — mas nenhum dos dois diz **qual é o menor primeiro usuário**. Sem isso, distribuição é substantivo, não tarefa.
2. **[FATO] O caminho para a Play tem 12+ itens 🔴 do dono** (`STATUS.md` §3.2) e o caminho para um usuário **PWA demo** tem, na prática, **3**: `METRICS_ADMIN_KEY`, um link e um canal de feedback. Ninguém separou os dois caminhos; a lista do dono trata "publicar na loja" e "ter 1 usuário" como o mesmo marco.
3. **[FATO] Desvio de foco documentado por omissão.** Desde 19/08 (Parte 5 "só isso") entraram: SQUAD-SOM (S1–S16), SQUAD-ARTE (rodadas 1–2), 14 canvases da Fase 2, torneio por season, coop, empacotamento Steam, narrativa/bíblia (`NARRATIVA-E-UNIVERSO.md`). Nenhum é telemetria nem distribuição. Nenhum doc registra a decisão de **não** seguir a Parte 5 — foi drift, não escolha. (Não é crítica ao trabalho: é crítica à ausência do registro.)
4. **[FATO] A lição "só o navegador mede" não virou ritual.** Três contagens erradas do onboarding (`PLANO-PRODUTO.md` Parte 0) → lição registrada → fluxo mudou de novo (portão, `REVEAL_DEMO`, Fase 2) → **nenhuma contagem nova**. Proponho: walkthrough gravado (vídeo + contagem) como artefato obrigatório de todo PR que toca `SoulmonOnboarding.tsx` / `GameTutorialFlow.tsx`.

---

## 2. Veredito do maestro

### 2.a Temas de produto NUNCA analisados por nenhuma rodada

| # | Tema | Onde mora | Quem devia ter olhado |
|---|---|---|---|
| 1 | **Definição do primeiro usuário real** e do caminho mínimo até ele (PWA-demo ≠ Play) | `STATUS.md` §3 mistura os dois | PM |
| 2 | **Ausência de cobrança na web** vs. plano "priorizar funil web" | `playBilling.ts`, `_billing.js` | Monetização |
| 3 | **Cortesia/cupom** para dar o tier pago a testadores | `_entitlements.js` | Monetização, PM |
| 4 | **Anúncios recompensados** já no código | `grantAdReward`, `ADS_ENABLED` | Monetização, IP/loja |
| 5 | **Muro 18+** vs. personas/ICP | `consent.ts` `MIN_AGE_YEARS` | User research, IP |
| 6 | **PII de nascimento + astrologia/numerologia**: aceitação, efeito Barnum, LGPD, categoria "saúde" na Play (humor/sono/crise) | `02-REGRAS` §22, `chatSafety.ts`, `PLAY-DATA-SAFETY.md` | Psicologia, IP, User research |
| 7 | **Canal de feedback/suporte** in-app | inexistente | Designer, PM |
| 8 | **Compartilhamento** (zero `navigator.share`) — o ativo viral sem botão | `BirthCard.tsx` sem saída | Designer, Growth |
| 9 | **Cold start social** (torneio/amigos/coop vazios no dia 1) | `CoopPanel.tsx`, `TournamentPage.tsx` | Game design, Designer |
| 10 | **Peso do 1º carregamento** (122 MB de assets, 1,6 MB de JS, mp4 no splash) | `dist/assets`, `sw.js` | Game design, Tech |
| 11 | **Prazo/lembrete por tarefa e integrações** (paridade com to-do) | `taskModel.ts` | Produtividade |
| 12 | **Legibilidade da telemetria** (sem chave, sem relatório, sem evento de custo de IA, sem runbook) | `metrics.js`, `STATUS` §3.2 | Retenção |
| 13 | **Distribuição real das 9 linhas** (Monte Carlo sobre o bestiário) e **teste cego de consistência entre estágios** | `bestiary/select.ts`, `spriteTrigger.ts` | Monster taming |
| 14 | **Domínio + landing** (para onde o TikTok aponta) | `STATUS` §3.4 passo 2 | Growth |
| 15 | **Re-baseline do ASO** com o nome mantido | `reviews/…/soulmon-growth-aso.md` | Growth |
| 16 | **Desvio de foco pós-Parte 5** (Camada 3 continuou; distribuição não começou) e **Steam antes da Play** | `STATUS` §2–§3.3 | PM |
| 17 | **Reengajamento sem push** (e-mail lifecycle) | inexistente | Retenção |
| 18 | **Walkthrough como ritual** (fluxo mudou, contagem não) | `PLANO-PRODUTO` Parte 0 | Designer, PM |

Já cobertos e ainda abertos (não são novidade, mas pesam na prioridade): economia invertida (Bits só de minijogos); prestígio cosmético não implementado; redirect Firebase não provado; WebView velho; SEC-3/D1; ICP em rascunho.

### 2.b Top 10 priorizado para chegar ao primeiro usuário real

Ordenado por **dependência e custo**, não por importância abstrata. Regra: o primeiro usuário real é **PWA, sem Play**, porque a Play tem 12 itens do dono e o PWA tem 3. Tudo que é Play fica em "Depois do 1º".

| # | Ação | Por quê | Esforço | Dono |
|---|---|---|---|---|
| 1 | **Definir o primeiro usuário: 10 pessoas conhecidas, PWA, 14 dias, tier pago por cortesia** — registrar em `docs/` como marco com data | Sem definição não há tarefa. 10 conhecidos = feedback direto, sem loja, sem ASO | Muito baixo (decisão + 1 parágrafo) | Dono decide perfil; squad registra |
| 2 | **Rota de cortesia** (`functions/api/entitlements.js`: `action=grant` com `ADMIN_KEY`, ou lista de e-mails em variável) | Única forma de o 1º usuário ver o diferencial antes da Play. Sem isso, testa-se o Soulmon sem o Oráculo | Baixo (reusa `applyVerifiedPurchase`, provider `courtesy`) | Squad |
| 3 | **`METRICS_ADMIN_KEY` + script de leitura semanal** (`scripts/metrics-report.mjs` → tabela dos eventos do funil) | Dado que ninguém lê não existe | Baixo | Dono define o segredo; squad faz o script |
| 4 | **Canal de feedback in-app** (botão "Falar com quem faz o Soulmon" → `mailto:` ou form, em `SettingsPage` e no `ErrorBoundary`) | O 1º usuário precisa de um lugar para falar | Muito baixo | Squad |
| 5 | **Aviso de WebView velho** por `CSS.supports('color','oklch(0 0 0)')` no `index.html` (opção 2 do `STATUS` §5) | Tela branca sem mensagem é o pior 1º contato possível; não muda alcance, não precisa do dono | Muito baixo | Squad |
| 6 | **Walkthrough gravado do fluxo atual** (localStorage limpo → home, vídeo + contagem de telas + tempo) e reprovar PR se a contagem subir | A lição de 3 contagens erradas não virou ritual; o fluxo mudou de novo | Baixo | Squad |
| 7 | **Botão de compartilhar o reveal/`BirthCard`** (`navigator.share` com imagem; fallback download) | Ativo viral sem botão. É o único crescimento orgânico compatível com a essência | Baixo–médio | Squad |
| 8 | **Congelar Camada 3** (Steam, coop, som novo, arte extra, narrativa) até os 10 usuários terem 14 dias de dado — registrar como decisão, não drift | Parte 5 mandou "só isso" há 5 semanas; o registro de que **não** foi seguido não existe | Zero (é parar) | Dono |
| 9 | **Decidir ads**: apagar `ADS_ENABLED`/`grantAdReward` com lápide **ou** avaliar formalmente | Porta latente sem dono; muda o Data Safety | Baixo | Dono decide; squad executa |
| 10 | **Domínio próprio + landing de 1 página** apontando para o PWA (e, depois, para a Play) | TikTok/Reels não tem destino; `workers.dev` não é marca | Baixo–médio (domínio é do dono) | Dono compra; squad publica |

**Depois do 1º usuário (não antes):** os 12 itens da Play (`STATUS` §3.2), D1/SEC-3, cobrança web, re-baseline do ASO, teste cego de sprites, Monte Carlo do bestiário, lembretes por tarefa, e-mail lifecycle, prestígio cosmético, economia (Bits por tarefa).

**Cortado deliberadamente desta onda:** qualquer coisa de Steam, coop, torneio, som, arte de loja, narrativa. Não porque seja ruim — porque nenhum deles muda se o Soulmon tem 0 ou 10 usuários.

**Veredito em uma frase:** *O Soulmon hoje é um produto completo que nenhum humano pode comprar e cujo diferencial nenhum humano pode ver; precisa de uma rota de cortesia, uma chave de métricas e um botão de feedback para ter 10 usuários reais em duas semanas; e a primeira coisa a fazer é o dono escrever, em um parágrafo, quem é o primeiro usuário.*

### 2.c Decisões que só o dono pode tomar

Formato de `docs/PERGUNTAS-DO-DONO.md`. Numeração continua da fila (última = #10).

| # | Pergunta | Provisório aplicado (recomendação) | Se mudar |
|---|---|---|---|
| 11 | **Quem é o primeiro usuário real?** (a) 10 conhecidos, PWA, cortesia paga, 14 dias; (b) estranhos via TikTok, PWA demo; (c) esperar a Play | **(a)** — menor caminho, feedback direto, testa o diferencial | (b) exige landing + domínio + vídeos antes; (c) exige os 12 itens 🔴 e adia meses |
| 12 | **Rota de cortesia** (tier pago sem compra) pode existir? Com que trava (`ADMIN_KEY` + lista de e-mails)? | Sim, com `ADMIN_KEY` e teto de N contas, registrada como `provider:'courtesy'` no entitlement | Se não: o 1º usuário só vê demo; toda leitura sobre "vínculo" fica inválida |
| 13 | **Congelar a Camada 3** (Steam, coop, som, arte extra, narrativa) até 10 usuários × 14 dias? | Congelar e registrar em `REGISTRO-DE-DECISOES.md` como decisão datada | Se não: registrar o contrário — o que não pode continuar é o drift sem registro |
| 14 | **Anúncios recompensados**: apagar do código (lápide) ou manter desligado e avaliar? | Apagar (`ADS_ENABLED`, `grantAdReward`, botão do `CreditsModal`) — contradiz o briefing e complica o Data Safety | Se manter: entra na fila do relatório de monetização + `PLAY-DATA-SAFETY.md` ganha seção de ads |
| 15 | **Público 18+ é ICP ou só defesa legal?** Se ICP, personas menores saem dos check-ups; se defesa, existe caminho para 13–17 com consentimento parental? | 18+ é ICP (ex-fãs de Digimon/Tamagotchi têm 25–40); remover a persona adolescente | Se quiser menores: LGPD art. 14 + Play Families — meses de trabalho e advogado |
| 16 | **Domínio próprio**: qual, e compra agora? | Comprar agora (pré-requisito de landing, de `authDomain` alinhado e do ASO) | Sem domínio: TikTok aponta para `workers.dev` e o redirect do Firebase segue sob suspeita |
| 17 | **Cobrança na web** (Pix/cartão via Stripe/Mercado Pago) entra antes ou depois da Play? | Depois do 1º usuário, antes de qualquer marketing — e o plano (`PLANO-PRODUTO` Parte 3) precisa ser corrigido para dizer que hoje não existe | Se "nunca": apagar "priorizar funil web" do plano |
| 18 | **`METRICS_ADMIN_KEY`**: você define e guarda? | Definir hoje; o script de leitura vem junto | Sem ela, o item 3 do top 10 não existe e o 1º usuário gera dado invisível |
| 19 | **WebView velho**: aplicar a opção 2 (aviso por `CSS.supports`) agora, sem esperar a decisão de `minSdk`? | Sim — não muda alcance, só troca tela branca por mensagem | Se preferir decidir `minSdk` junto: fica parado mais semanas |
| 20 | **Trava de crise do chat**: aceita revisão por profissional (psicólogo) antes do 1º usuário, ou o caminho curado (§14.2) basta? | Revisão de 1 hora por profissional do diretório escolhido | Se "basta": registrar o risco assumido no `REGISTRO` §14.2 |

---

## 3. Riscos desta análise

- Rodada feita por um agente só, inline, sem pesquisa externa nova: onde afirmo política de loja (categoria saúde, ads) é `[HIPÓTESE]` a conferir no texto vigente da Play.
- Não rodei o app no navegador nesta rodada (somente leitura de repo); a contagem de telas pós-Fase 2 é justamente o que falta — item 6 do top 10.
- Não medi `bond.ts` contra a calibragem "dia 1 / dia 3" nem simulei a distribuição do bestiário — apontei como não feitos, não como errados.
- "Desvio de foco" é leitura de omissão nos docs, não juízo sobre a qualidade do que foi feito (som, arte e Fase 2 estão bem registrados).
