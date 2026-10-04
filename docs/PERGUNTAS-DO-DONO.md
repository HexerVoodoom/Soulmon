# Perguntas para o dono — acumuladas na rodada autônoma (20/09/2026 →)

> Regra do dono (20/09/2026): seguir a melhor sugestão sem travar; o que for decisão
> só dele fica aqui e é perguntado no fim, quando não houver mais nada a fazer sem resposta.
> Cada item traz a decisão PROVISÓRIA já aplicada (para nada ficar parado) e o que muda se ele disser outra coisa.

| # | Pergunta | Provisório aplicado | Se mudar |
|---|---|---|---|
| 1 | **Arte pixel que ainda falta e só a `squad-arte` gera** (≈ 20–30 cr Higgsfield): (a) 36 ícones-ficha 32² (9 linhas × 4 tiers) + 64² para Dino/oponentes (D-J13); (b) miniaturas 1× dos 35 cenários da loja em 96×52 (D-L-R6); (c) auras por elemento 96² (hoje `attackFxArt.auraForElement` é CSS); (d) "Z" de sono em variante clara; (e) glifos pixel de comida/sono do overlay (D-F10). Gero tudo numa rodada 2? | **Transições em código**: ranking usa mini-visor 32 com o sprite reduzido; loja reduz o cenário 800² por CSS; aura CSS; Material `restaurant`/`bedtime` no overlay | Se "sim", rodo `/squad-arte` com a fila §12 do `ASSETS-A-GERAR.md` e troco os fallbacks; se "não", os fallbacks viram definitivos e o doc é fechado |
| 2 | **`bg-gameboy` fugiu do conceito** (LCD retrô virou cena genérica) nas duas gerações. Regerar com outra referência, aceitar como está, ou tirar da loja? | Mantido o 800² atual, à venda | "Regerar" custa 2 cr + revisão sua; "tirar" remove de `backgrounds.ts` e do sorteio da masmorra |
| 3 | **`UnlockNudge` — 440 (canvases Loja/Conta) × 280 (nudge do código)**. O lead padronizou **280** e as folhas foram medidas assim. Confirma 280 em todo lugar? | 280 (`UnlockAccountModal.tsx`, `maxWidth: 280`) | Se 440, é só o número no `UnlockNudge` + refazer as folhas Loja/Conta que o medem |
| 4 | **As quatro divergências código × `CLAUDE.md` (D11, 13/09)** ficaram no código: loja em segmentos, `UnlockNudge` em 6 pontos, microfone = "enviar", marco espera o gesto. O `CLAUDE.md` ainda descreve o antigo ("dois lugares"/"TRÊS"). Posso corrigir o `CLAUDE.md` eu mesmo? | Nada tocado no `CLAUDE.md` (você disse que corrige depois) | "Sim" = um commit de docs, com a régua `filaDeAvisos`/`UnlockNudge` conferida |
| 5 | **Worker de push** (`workers/`) mudou (ícone/cor/copy do push, `e3851a92`) e **não builda no push da `main`** — precisa de `wrangler deploy` dentro de `workers/` com a sua conta. Eu rodo, ou você? | Não deployado; produção manda o push antigo | Se eu rodar, preciso que o `wrangler login` esteja feito nesta máquina |
| 6 | **Bump do `CACHE_VERSION`**: hoje `public/sw.js` está em v146 e a Fase 2 trocou HTML/CSS/assets em massa. Já bumpo para v147 no próximo commit? | Não bumpado (cada leva anterior bumpou a sua) | Sem bump, quem já abriu o app fica com CSS velho até o SW atualizar sozinho |
| 7 | **Worktrees antigos removidos** (`.claude/worktrees/agent-a093c7e1bab3f09ae` = `fix/tier-gate-generate-sprite`, `agent-a4c6bc875962d5f25`) para o guard do Supabase passar. As branches continuam no git. Apago as branches também? | Branches mantidas | `git branch -D` das duas se você confirmar que o conteúdo já entrou na `main` |

## Respostas (21/09/2026)

Todas as sete respondidas em modal, sempre pela recomendada: (1) rodada 2 gerada — R2-1…R2-4 derivados sem crédito (`118131f4`, `66e32d43`), R2-5 glifos (`02d483af`), R2-6 `bg-gameboy` regerado (`b52fa074`, 7 cr); (2) idem; (3) `UnlockNudge` 280; (4) `CLAUDE.md` corrigido (`26c7aab0`); (5) push scheduler deployado (`digiapp-push-scheduler`, versão `e90f05a6`); (6) `CACHE_VERSION` v147 → v148 na rodada 2; (7) branches apagadas (0 commits fora da `main`). Fila vazia.

## SQUAD-SOM (21/09/2026)

| # | Pergunta | Provisório aplicado | Se mudar |
|---|---|---|---|
| 8 | **Ouvir o A/B cego** — `E:/Soulmon-assets/som-01/ab/escuta.html`: 3 pares × 3 perguntas, alto-falante do celular primeiro e fone depois, volume fixo; salvar os dois `ab-respostas-*.json` na pasta `ab`. **Não abrir `ab-mapa-cego.md` antes.** | S10 intacta: procedural vigente, nenhum byte de áudio no repo | IA vence P1 em ≥2 de 3 nas duas condições → lote entra sob S6/S9 + `Attributions.md` no mesmo commit + `CACHE_VERSION` +1; empate/derrota → S1 cai para SFX (registro §6.1) |
| 9 | **Quatro candidatos saíram fora da janela de corte** (`presence` ×2, `shower`, `sleep`: +20,7 a +31,8 dB de ganho pós-corte, acima do limite de plausibilidade de 20 dB — o gerador entrega 1,6–1,7 s e o corpo do som fica fora dos 120/200 ms). E **`transaction` foi RECUSADO duas vezes** por crista inconsertável (7,9 e 15,2 dB > 6,0): o prompt pede *"dry muted click"*, e click é, por definição, crista alta — é conflito prompt × spec, não sorte. Regero os quatro com prompt pedindo *"the entire sound within the first N ms"*? E `transaction`: reescrever o prompt (som seco sem ser click), ou o `som-engenheiro-audio` revê o limite de 6,0 dB da classe Transação? | Nenhum dos cinco entra no lote; `end-zero-2` regenerado APROVOU (0,65 dB de atenuação) | Regerar custa 2,5 cr cada; mudar o limite é decisão do dono único do número |

## Respostas SQUAD-SOM (21/09/2026, modal)

#8 **fica aberto** (o dono respondeu "aceito como está": S10 intacta, A/B montado e não ouvido). #9: **regerar os 4** com cláusula de duração no fim do prompt e **reescrever `transaction`** sem click (limite de 6,0 dB mantido) — variantes v2 em `pacote-prompts.md` §2.13. Instalação, se a IA vencer: **só os 3 vencedores primeiro**.

**Resultado das v2 (21/09/2026, 4 gerações, saldo 429,35 cr) — achado, não conserto.** A cláusula de duração no fim do prompt **funcionou** (o gerador devolveu exatamente 0,200 s em vez de 1,7 s), mas o som que cabe em 120–200 ms sai **quase mudo**: −55,6 / −40,5 / −56,9 LUFS-M cru, ou seja, ganho pós-corte de **+39,7 / +21,9 / +39,1 dB** — pior que antes (crista no teto de 12,0 nos três). `transaction-v2`, sem click, **RECUSADO pela 3ª vez** (10,3 dB > 6,0). Leitura: o `seed_audio` não entrega, dentro da spec, os quatro sons **curtos e secos** do lote (Cuidado ×3, Transação) — ele é bom nos longos (Marco, Degeneração, Conclusão a 1 s). Paro de regerar (3 tentativas é o teto da regra do `CLAUDE.md`). **Nova pergunta #10:** para Cuidado e Transação, (a) manter procedural mesmo que a IA vença o A/B (híbrido já admitido na alternativa que perdeu da S1), ou (b) gerar longo (1–2 s) e cortar por envelope, aceitando que o "som" é um recorte? Provisório: **(a)**.

**Fechado pelo dono em 21/09/2026 ("resolva tudo e tenha tudo pronto e mergeado"):** #8 continua sendo dele
(ouvir o A/B) mas deixou de bloquear — S16 instalou os assets "só pra ter pronto"; #9 e #10 resolvidos por S16
(curtos ficam procedurais; os três longos e a trilha entraram). A trilha ganhou a **segunda camada** (`ritmo`),
loop em 28,800 s exatos (12 compassos), trim de 2 camadas em `loudness.ts`. Fila vazia.

**#8 respondido (21/09/2026):** "Coloca o A" e, perguntado, **"quero o gerado nos 3"** → os 3 assets de IA ficam. Fila vazia.

## QA GERAL (21/09/2026) — 29 perguntas, todas com provisório aplicado

> Origem: `docs/reviews/2026-09-21-qa-geral/00-CONSOLIDADO.md` §5 (o "por quê" de cada uma está lá, com o relatório da frente). Nada ficou parado: a squad segue o provisório até você responder. As que mais destravam: **#11, #12, #18** (primeiro usuário real + rota de cortesia + chave de métricas) e **#38** (`CLAUDE.md`).

| # | Pergunta | Provisório aplicado | Se mudar |
|---|---|---|---|
| 11 | Quem é o primeiro usuário real? (a) 10 conhecidos, PWA, cortesia, 14 dias · (b) estranhos via TikTok · (c) esperar a Play | (a) | (b) exige landing + domínio + vídeo; (c) adia meses |
| 12 | Rota de cortesia (tier pago sem compra) pode existir, com `ADMIN_KEY` + teto de N contas, `provider:'courtesy'`? | Sim — squad implementa quando autorizada | Sem ela o 1º usuário só vê demo |
| 13 | Congelar Camada 3 (Steam, coop, som, arte extra, narrativa) até 10 usuários × 14 dias? | Congelar e registrar no `REGISTRO` | Registrar o contrário — o que não pode é drift sem registro |
| 14 | Anúncios recompensados (`ADS_ENABLED`, `grantAdReward`): apagar com lápide ou manter desligado? | Apagar | Se manter: `PLAY-DATA-SAFETY.md` ganha seção de ads |
| 15 | 18+ é ICP ou só defesa legal? | ICP; remover a persona adolescente dos check-ups | Menores = LGPD art. 14 + Play Families |
| 16 | Domínio próprio: qual, e compra agora? | Comprar agora | Sem domínio, TikTok aponta para `workers.dev` |
| 17 | Cobrança na web (Pix/cartão) antes ou depois da Play? | Depois do 1º usuário; corrigir `PLANO-PRODUTO` Parte 3 | "Nunca" = apagar "priorizar funil web" |
| 18 | `METRICS_ADMIN_KEY`: você define hoje? | Definir; script de leitura vem junto | Sem ela o 1º usuário gera dado invisível |
| 19 | Aviso de WebView velho por `CSS.supports` agora? | Sim | Fica parado até decidir `minSdk` |
| 20 | Trava de crise do chat: revisão por profissional antes do 1º usuário? | 1 h de revisão | Registrar risco assumido no `REGISTRO` §14.2 |
| 21 | Token FCM / endpoint Web Push entra em "IDs do dispositivo" na ficha da Play? (`PLAY-DATA-SAFETY.md` §2.7 diz "não" sem fonte) | Ficha diz "não" | Subdeclaração = risco de remoção |
| 22 | Existe exigência da Play/Steam de declarar conteúdo gerado por IA (sprites, chat, áudio)? O repo não documenta a regra | Nada declarado, sem aviso in-app | Bloqueia ficha e eventual aviso |
| 23 | Push que sobrevive à exclusão da conta (`push:*`/`fcm:*` fora do alcance de `account.js`): corrigir no código ou declarar na política? E a retenção de `ord:` por 5 anos entra na política §8? | Código atual; política silenciosa | Política promete mais do que o sistema apaga |
| 24 | Termos §10 prometem aviso in-app antes de mudança relevante: re-aceite (nova caixa + `ConsentRecord`) ou banner? — **já vale**: `TERMS_VERSION` subiu hoje | Sem mecanismo; save antigo segue válido (`normalizeConsent`) | Define o fluxo de cada bump |
| 25 | "R$ 29,90" fixo nos termos EN quando a Play cobra em moeda local (WP5.8) | Mantido (travado por `publishedPrice.test.ts`) | Texto |
| 26 | `Attributions.md`: cobre deps npm (`astronomy-engine`, `@capgo/capacitor-pedometer`)? E as 3 fontes (Material Symbols Rounded, Fredoka, Rubik) + arte de IA ganham linha no mesmo formato do áudio? | Só arte/som/Silkscreen; fontes e arte de IA sem linha | Escopo do doc |
| 27 | Redação oficial da cláusula de crise/IA nos termos §8 (o chat é modelo sem revisão humana; não é serviço de emergência; canais curados de `chatSafety.ts`) | Nenhuma | Termos descompassados do produto desde 21/09 |
| 28 | Roster de agentes 64 → 37 (`13` §8): cortar 9 genéricos + `prod-squad` do repo + 12 do maestro, fundir 6 `arte-*`, criar `soulmon-operador` e `soulmon-guarda-plataforma`? | Nada cortado; tabela do coordenador já aponta os globais | Mantém 15 agentes que só existem no `.md` |
| 29 | Linha vermelha #20 × `widgetSemCobranca.contract.test.ts` (`remove()` de chaves vetadas): #20 ganha a exceção "chave vetada por outra proibição" ou o teste volta? | Teste fica; exceção não registrada em `vetos.md` | — |
| 30 | `achievements.ts` › `'tasks-100'` (recompensa cosmética por contagem de tarefas, #16): renomear para comportamento ou registrar exceção? | Fica | — |
| 31 | Orçamento de performance (`06` §6): JS entrada ≤ 250 KB, CSS ≤ 100 KB, cenário ≤ 400 KB, vídeo ≤ 800 KB — adota como régua? | Sem orçamento | Sem número, a squad-arte instala sem teto |
| 32 | `dist/`: apagar os PNG após a conversão WebP (100 MB de peso morto que o `sw.js` nunca serve) e só depois discutir tirar `dist/` do git? | Como está | Pack de 553 MiB continua crescendo |
| 33 | 38 dependências sem import (26 `@radix-ui/*`, `hono`, `recharts`…): remover + guard "todo pacote tem import"? | Como está | Supply chain sem uso |
| 34 | Electron 33.4 (sem suporte desde abr/2025): bump agora ou junto com o Steam? | Como está | — |
| 35 | ADRs 001–003 (fora do git em `squad-alpha-runs/`): promover para `docs/adr/`? E o ROADMAP de lá, que ainda descreve o fail-open como aberto, apagar ou datar? | Fora do git | A única descrição de 3 decisões de infra vive numa pasta que não versiona |
| 36 | `product/soulmon-01/**` (30 arquivos fora do índice): indexar como registro ou mover para `historico-digiapp/`? | Fora do índice | — |
| 37 | `SettingsModal` (duplicata do mudo, aberto via `handleOpenAISettings`): remover? | Fica | — |
| 38 | **`CLAUDE.md`** — autoriza corrigir as 7 afirmações falsas de `14` (Coraçãozinho "à venda por 150", "cura instantânea (10)", `digiapp_push` → `soulmon_push`, `DigiWidgetPlugin` → `SoulmonWidgetPlugin`, `canPvp` → `meetsPvpBond`, `DÍVIDA` → `EXCECOES` (D31), "17 documentos" → 18) e as 2 refs `arquivo:linha`? | Nada tocado (só o dono edita o `CLAUDE.md`) | Um commit de docs com cada correção conferida por grep |
| 39 | Fósseis da raiz (`README.md`, `PWA-SETUP.md`, `PWA-CHECKLIST.md`, `PROJETO.md`, `PLANO_MELHORIAS.md`, `index.html.example`, `manifest.webmanifest`, `registerSW.js`): apagar, ou mover para `docs/historico-digiapp/` com lápide? | Como está | Uma sessão nova abre `PLANO_MELHORIAS.md` achando que é `docs/PLANO-MELHORIAS.md` |

## Respostas QA GERAL (21/09/2026, modal)

Todas as 29 respondidas. Divergências da recomendada em **negrito**.

| # | Resposta |
|---|---|
| 11 | (a) 10 conhecidos, PWA, 14 dias |
| 12 | Sim — implementar rota de cortesia (`ADMIN_KEY` + teto, `provider:'courtesy'`) |
| 13 | Congelar Camada 3 e registrar no `REGISTRO-DE-DECISOES.md` |
| 14 | **Manter ads desligados e avaliar** (não apagar); `PLAY-DATA-SAFETY.md` ganha seção de ads na fila de monetização |
| 15 | 18+ é ICP; persona adolescente sai dos check-ups |
| 16 | Domínio: **depois**. Play Store: **preparar tudo do lado da squad** (APK novo, ficha, screenshots, checklist passo a passo do que é do console); o dono executa o console |
| 17 | Cobrança web depois do 1º usuário; corrigir `PLANO-PRODUTO` Parte 3 |
| 18 | `METRICS_ADMIN_KEY`: o dono define; squad entrega `scripts/metrics-report.mjs` |
| 19 | Aviso de WebView velho por `CSS.supports` agora |
| 20 | 1 h de revisão por profissional da trava de crise antes do 1º usuário |
| 21 | Token FCM/Web Push: **declarar** como ID na ficha; atualizar `PLAY-DATA-SAFETY.md` §2.7 |
| 22 | Declarar IA na ficha da loja + aviso in-app (Configurações › Sobre) |
| 23 | Corrigir código (cliente chama os DELETE de push na exclusão) + declarar retenção de `ord:` na política §8 |
| 24 | Banner informativo ao subir `TERMS_VERSION`; sem re-aceite obrigatório |
| 25 | **Termos EN mostram o preço em dólar** (não "preço da loja"); `publishedPrice.test.ts` passa a aceitar R$ no PT e US$ no EN com paridade declarada |
| 26 | `Attributions.md`: fontes (Material Symbols, Fredoka, Rubik) + arte de IA, sem deps npm |
| 27 | Cláusula de crise/IA nos termos §8: **squad redige e autoaprova** |
| 28 | Aplicar a proposta 64 → 37 (`13-governanca-agentes.md` §8) |
| 29 | LV #20 ganha exceção registrada em `vetos.md` |
| 30 | `'tasks-100'` renomeada para gatilho de comportamento |
| 31 | Orçamento de performance vira régua (guard) |
| 32 | Apagar PNG de `dist/` após WebP |
| 33 | Remover 38 deps sem import + guard |
| 34 | Electron: bump junto com o Steam |
| 35 | ADRs 001–003 → `docs/adr/`; ROADMAP datado com lápide |
| 36 | `product/soulmon-01/**` indexado como registro no MAPA |
| 37 | Remover `SettingsModal` |
| 38 | `CLAUDE.md`: corrigir as 7 afirmações + 2 refs `arquivo:linha` |
| 39 | Fósseis da raiz → `docs/historico-digiapp/` com lápide; README novo aponta para o MAPA |

Fila vazia. Execução: ver o bloco datado do `STATUS.md`.

## QA RODADA 1 (21/09/2026, noite) — 14 perguntas, todas com provisório aplicado

> Origem: `docs/reviews/2026-09-21-qa-rodada-1/00-CONSOLIDADO.md` §5 (o "por quê" de cada uma está lá, com o relatório da frente). Nada ficou parado: a squad segue o provisório até você responder. As que mais destravam: **#48** (GitHub Actions por cobrança — só você), **#50/#51** (E0: worker de push + quem faz o quê) e **#42** (o que vai ao Groq: declarar ou cortar).

| # | Pergunta | Provisório aplicado | Se mudar |
|---|---|---|---|
| 40 | **Cortesia × reembolso da Play**: conta com `provider:'courtesy'` válido e uma compra Play desfeita continua `paid`? (`auditRefunds` rebaixava para `demo`; `functions/api/_entitlements.tierDerivado.qa.test.js` reprovava nas duas ordens) | **Sobrevive** — `tier` recomputado de `paidProviderOf` no fim do laço | Se não sobrevive: o pedido `courtesy` vira `voided` junto; o tier nunca pode discordar do histórico |
| 41 | **Glitchtama conta como dia completo para conquistas?** (→ medição em #60, QA Rodada 2: 51 % dos dias completos do perfil B; o provisório `vetos.md` **não foi aplicado** até 22/09) Um item da masmorra abre `perfect-day`; 30 abrem `dias-completos-30` (`totalPerfectDays++` em `src/utils/specialItemUse.ts`) | **Registrar como decisão da missão** em `ledger/vetos.md` (recompensa por 5 andares; a conquista lê o mesmo contador da escada) | Se não: campo que só `computeDailyReset` escreve, e a conquista lê dele |
| 42 | **Dados ao Groq — declarar ou cortar?** `runDecompose` manda `task.name`; `GameTutorialFlow` pré-preenche `goalText` com `soulGoal`; `customKeywords`, `moodToday`, estágio e galho vão no prompt. A política §2b dizia "nunca texto seu" | **Declarar** (política §2b/§6 PT+EN reescritas nesta rodada) + guard "que campos saem para IA" | Cortar = `runDecompose` manda só categoria; `useState('')` no tutorial; `customKeywords` fora do prompt |
| 43 | **Supabase como terceiro** na política §6 (repasse do áudio até o Groq Whisper) e na ficha da Play — nomear os dois? | Nomear (política + `PLAY-DATA-SAFETY` + `PLAY-FICHA`) | Transcribe desligado de vez = sai a linha; `supabase.contract.test.ts` muda |
| 44 | **Encarregado LGPD** (art. 41): a política tem e-mail de contato, não nomeia encarregado. É você? | Sem nomeação (só e-mail) | Nomear = 1 linha na política; obrigação do controlador |
| 45 | **US$ nos termos EN — redação A ou B?** A = `US$ 6.99` fixo com fonte declarada (`PLANO-PRODUTO` Parte 3; a Play converte) · B = "the store price at checkout", sem número | **A** (publicado; `publishedPrice.test.ts` trava) | B = tirar número e `data-price`; o teste muda |
| 46 | **Steam na política §6**: entra agora ou só quando a Camada 3 descongelar? | Só ao sair da C3 (hoje não há usuário Steam) | Entrar agora = 1 linha PT+EN |
| 47 | **Retenção do save: 365 d** (`SAVE_TTL_SECONDS`) — declarar na política §8? E `ent:` "5 anos" ancorado em "a partir da exclusão"? | Declarar os dois | TTL muda → frase e constante juntas |
| 48 | **GitHub Actions parado por cobrança desde 16/09/2026** — **ainda parado em 22/09/2026** (`gh run list` → 260 runs `failure` desde 16/09; repete em #68) (⚰️ "339 runs", *"recent account payments have failed…"*) — só você regulariza *Billing & plans*. Até lá nenhum portão roda fora da máquina local e o merge automático do `CLAUDE.md` › Deploy está sem a prova não-local | Squad nada pode; `soulmon-operador` mede `gh run list --limit 5` em toda sessão | Alternativa: CI só local por regra registrada, ou outro runner |
| 49 | **iOS no E0**: algum dos 10 usa iPhone? PWA iOS = storage separado (dobra `install`), sem `beforeinstallprompt`, Web Push só instalado (16.4+), `selector(&)` exige Safari 17.2+ | Assumir que **há**: 1 passada de teste antes do convite (R-D6) e denominador = pessoas | Nenhum = registrar "E0 só Android/desktop" |
| 50 | **Push no D0 do E0**: (a) o worker (`workers/`) está deployado? Sem `wrangler deploy` o E0 roda **sem push** e a H1 fica confundida; (b) suprimir o push no dia do nascimento (`pushCopy` → `null` em `ageDays === 0`, como o comentário promete)? | (a) não medido — exige login; se não subir, **declarar "E0 sem push"** no diário; (b) suprimir (`alpha-compliance` confere a comunicação) | (a) você roda `cd workers && npx wrangler deploy`; (b) manter = corrigir o comentário |
| 51 | **E0 — quem faz o quê**: convite (texto + lista + datas), grant (`scripts/save-id.mjs` + `curl` com `ENTITLEMENTS_ADMIN_KEY`), leitura (segunda 09:00 BRT, `metrics-report.mjs --days 21 --full`), suporte (`FEEDBACK_EMAIL` + grupo, SLA ≤ 24 h), entrevista D7/D14 | Dono = convite + secrets + grant; `soulmon-operador` = worker/secret list; `alpha-insights` = leitura e veredito; `alpha-gestor-pesquisa` = entrevista; suporte = dono até existir dono | Papel que você não queira vira pergunta de roster |
| 52 | **ADRs 004–006** (concorrência do save · KV único × D1 para dinheiro · versionamento do esquema do save) — aprovar os rascunhos promovidos a `docs/adr/` (estado **Proposta — aguarda o dono**)? A 004 é exceção declarada a "UI antes de infra" | Ficam como Proposta; nada executado | Aprovar = 004 D1–D3 (~2 d), 005 D2 (~1 d, antes do 1º pagante), 006 junto da 004 |
| 53 | **`skills-lock.json` + symlinks `higgsfield-*` no Windows**: os 3 ponteiros em `.claude/skills/` são symlinks git (`120000`) que `core.symlinks=false` materializa como texto — a skill do repo não carrega e `.agents/` divergiu da global. Apagar do repo (a skill vive na conta) ou virar diretório real? | Como está (a sessão carrega a skill global) | Apagar = `git rm .claude/skills/higgsfield-* .agents/ skills-lock.json`; diretório real = duplicar e assumir o drift |

## QA RODADA 2 (22/09/2026) — regra de jogo: 7 perguntas, provisório = como está

> Origem: `docs/reviews/2026-09-22-qa-rodada-2/07-simulacao-jogo-r2.md` (simulação de 90 dias, 15 perfis; tabela em `sim/tabela-dia-x-perfil.md`). Guardas constância · permanência · vínculo · sustento, com a linha vermelha. **Regra da rodada: só se corrigiu onde `02-REGRAS`/`REGISTRO` diz X e o código faz Y** — foram dois consertos (trilha E0 no sono automático/janela de descanso, `SOM.md` §2.1; e `XP_PERFECT_DAY` emitido na virada, `02` §55). Tudo abaixo é o que a doc fixa como está e a simulação mediu como ruim: decisão sua. Cada linha tem um teste que fotografa o comportamento atual e um `it.todo` com o provisório proposto (`src/utils/regrasDeJogo.qaRodada2.test.ts`, `src/utils/bond.diaCompleto.test.ts`).

| # | Pergunta | Provisório aplicado | Se mudar |
|---|---|---|---|
| 57 | **"3× por semana" cobra coração 3×/semana** feito seg/qua/sex (perfil Bt: 25 ♥, 6 quedas em 90 d; o mesmo jogador com dias fixos seg/qua/sex: 0 ♥). `02` §24 fixa: `habitCountsOn` conta "enquanto `done < target`", então terça (1/3) e quinta (2/3) entram na meta de coração e a falta cobra. O "perdão embutido" do formato existe só na constância, não no HP | **Como está** (a doc é explícita) | Meta de CORAÇÃO (`heartGoalFor`) não conta `timesPerWeek` enquanto `diasRestantesNaSemana >= target − done`; crédito (`dailyDone`) continua. Guard: 4 semanas seg/qua/sex = 0 ♥. É perdão nº 9 — a linha vermelha pede a D4 respondida antes |
| 58 | **Dreno de cocô × travas da virada**: `02` §8 diz "exatamente as mesmas travas" na frase-resumo e depois lista **três** (teto/dia, Teimoso, ausência). Não lê carência de save novo (`NEW_SAVE_GRACE_DAYS`: Dp perde ♥ em d1–d3), rampa de retorno, nem o piso da raiz (rookie em 0 pelo dreno fica em 0 TODO dia: a virada devolve 1, o dreno tira). E o teto é por MECANISMO: virada + dreno = **2 ♥/dia** (Dmp: 4 → 0 em 2 dias), contra `02` §1 "tira no máximo um coração" | **Como está** (a lista explícita de três travas vence a frase-resumo) | `applyPoopDrain` lê `saveDaysLived`/`returnGraceLeft` (já estão em `lastDayReport`), desconta `lastDayReport.heartsLost` do teto (teto do DIA, não do mecanismo) e devolve rookie a 1. Escolher: teto do dia vale para os dois? Se sim, reescrever §8 e §1 juntos |
| 59 | **Vínculo: 6 dos 11 eventos nunca são emitidos** (`restNight`, `dreamNew`, `nightmareCleared`, `dungeonFloor`, `habitMilestone`, `triageCleared` — `App.tsx`), **e comer soma `totalXP` fora de `awardBondXP`** (`careRules.feedFood`, 40 XP/comida = 76% do XP real; `02` §55 diz "único caminho" E, no invariante 5, reconhece o XP da comida). Curva calibrada para "dia bom ≈ 165 XP"; medido A: L3 d1 · L7 d7 · L13 d30 · L23 d90 (declarado L2/L6). Ligar os 6 sem recalibrar sobe mais ~3 níveis | **`perfectDay` ligado** (dono `computeDailyReset`, §55 cita o arquivo); **os 6 do `App.tsx` NÃO** — patch pronto em `docs/reviews/2026-09-22-qa-rodada-2/sim/patch-vinculo-app-eventos.md`; comida fica como está | (a) aplicar o patch + recalibrar `BOND_EARLY_STEPS`; (b) comida: entrar na tabela como `kind:'feed'` com teto (`BOND_DAILY_CAP`) OU parar de somar (save existente não perde nada — `totalXP` nunca desce); (c) `bond.wiring.test.ts` varrer `src/` por `kind` |
| 60 | **A virada julga só ONTEM**: quem faz tudo na segunda e reabre na quarta é perdoado E não creditado (perfis Bx/Bsx: **0 dias completos em 90 dias**, rookie para sempre, fazendo 100% dos hábitos 3×/semana). É a persona da métrica-norte (`01-VISAO` §3). `02` §7 não diz que o dia completo exige abrir no dia seguinte | **Como está** (regra nova, não bug) | Julgar o dia de `lastResetDate` (o último em que a pessoa esteve) em vez de `now − 1`, ou creditar cada dia entre `lastResetDate` e ontem em que `habitRhythms[*].done` cobre a meta. Guard: "seg feito, qua aberto → `perfectDays` +1". É a pergunta D4 pelo outro lado: o jogo julga DIAS ou ABERTURAS? |
| 61 | **Queda = cura cheia grátis**: `degeneratedPerfectDays` = `max(floor(req/2), prev − 5)` deixa mega com 26 dias em ultimate com 21 ≥ 5 → o botão Evoluir acende na MESMA abertura e devolve HP máximo (Dm d46; B d54/d66/d89). `applyRedemption` marca `redeemed` por um clique. Quem não clica cai 3 estágios em 14 dias com 11 dias no banco | **Como está** (`02` §18 descreve piso+custo, não este efeito) | Ou a queda zera `perfectDays` até `required − 1` do estágio novo, ou `canEvolve`/`handleEvolve` exigem uma virada com `dayWasPerfect` depois de `degeneratedByHP`. Guard em `degeneracao.cenarios.test.ts`: "cair e evoluir na mesma virada é impossível". Linha vermelha: nenhuma das duas tira progresso acumulado (o piso continua) |
| 62 | **(= #41, agora com número)** 🌀 Glitchtama infla `totalPerfectDays`: perfil G (zero hábitos, 1 run/dia) fecha 90 "dias completos" sem um único dia completo, e abre `perfect-day`, `dias-completos-30` e `mission-perfect-30` (a troca `tasks-100 → dias-completos-30` da rodada 1 pôs um contador que um minijogo infla). Para o perfil B o 🌀 é 51% dos "dias completos" | **Como está** (#41 já registrado em `vetos.md`) | 🌀 credita `perfectDays` sem tocar `totalPerfectDays` (conquista e missão leem o vitalício), ou só vale em dia com `dailyDone > 0`. Dono: `specialItemUse.ts` |
| 63 | **Bits só vêm de minijogo**: hábito, tarefa, dia completo e evolução = 0 Bits. Perfil A (tudo, todo dia) tem **0 Bits em 90 dias** — nunca compra nada; B compra 152% da loja em 90 d; G 4× (e 288 chips = +864 de atributo: o galho é comprável). Nenhum guarda é dono da curva de Bits | **Como está** | Bits por dia completo (torna a loja alcançável a quem cuida; é a unidade sancionada, não contagem de tarefas — LV #16 não morde) OU escrever em `02` §47 "a loja é dos minijogos". Teto de runs/dia é outra alavanca (custo de ENTRADA, nunca coração) |

Sem decisão sua, nada acima muda. O que mudou nesta rodada, com teste: `src/utils/trilha.e0.test.ts` (S-1 do `06-som`) e `src/utils/bond.diaCompleto.test.ts` (2.4, só o `perfectDay`).

## QA RODADA 2 (22/09/2026) — 18 perguntas, todas com provisório aplicado

> Origem: `docs/reviews/2026-09-22-qa-rodada-2/00-CONSOLIDADO.md` §5 (o "por quê" de cada uma está lá, com o relatório da frente). Nada ficou parado: a squad segue o provisório até você responder. Regra nova desta rodada: **provisório que muda código ou texto publicado ganha linha no `REGISTRO-DE-DECISOES.md` com `[provisório #N]`** (começa por #55). As que mais destravam: **#65/#67/#66** (D1, cortesia e FCM — só você digita), **#64** (Workers Paid antes do E0) e **#71** (assinar pré-registro + consentimento antes do 1º convite). #68 repete #48; #60 estende #41.

| # | Pergunta | Provisório aplicado | Se mudar |
|---|---|---|---|
| 54 | **SteamID64 pós-exclusão**: `ord:steam:own:<appid>:<steamid>` (`functions/api/_billing.js` › `verifySteamOwnership`) sobrevive **5 anos** à exclusão de conta sob a justificativa "fiscal" da política §8 — licença de posse Steam não é comprovante fiscal nosso. Apagar na exclusão (perde a trava "um Steam, uma conta" só para quem apagou) ou declarar? | **Declarar** nominalmente em `NOT_INCLUDED` (`account.js`) e na política §8 + `PLAY-DATA-SAFETY`; nada apagado (Camada 3: hoje não há usuário Steam) | Apagar = 1 `delete` por prefixo em `handleDeleteConfirm` + linha em `plan().apaga`; a política tira a frase |
| 55 | **Cota de chat por tier**: `AI_LIMITS.chat.perAccount` era igual para demo e pago (120/dia) — 1.000 demos no teto = R$ 950/mês, receita zero, alcançável por `curl`. Demo 30 / paid 120 está bem? | **Aplicado** em `functions/api/_aiGuard.js` (demo 30 / paid 120); linha `[provisório #55]` no `REGISTRO-DE-DECISOES.md` junto com "sem SKU recorrente, sem modelo acima do 8b" | Outro número = 2 constantes; "sem cota para demo" = reverter a linha e aceitar o custo |
| 56 | **Lápide × mesmo e-mail**: a lápide `del:done:` (30 d) bloqueava o próprio titular que fazia login de novo (onboarding inteiro → 410 → wipe + logout em loop). Provisório: login com `auth_time` do token **posterior** a `tombstone.at` limpa a lápide e a conta renasce vazia. Ok? | **Aplicado** (`_auth.js` expõe `auth_time`; `save.js` › `clearTombstone`); cliente faz `CONFLICT_BACKUP` antes de apagar o local | Se a lápide deve valer 30 d para o titular também: aviso com prazo + "entrar com outro e-mail" no portão, sem reabrir |
| 57 | **Marcar feita — desfazer no mesmo dia?** Hoje o check (44 px, colado ao chevron de 44 px) marca sem confirmação nem desfazer; o toque errado dá comida/XP/Vínculo irreversíveis. Desmarcar no mesmo dia revertendo os ganhos, ou toast "Desfazer" 5 s? | Toast **"Desfazer" 5 s** (reverte `withHabitCompletion` inteiro dentro da janela); depois disso, feita é feita | Desmarcar o dia todo = reverter comida já comida (impossível sem ledger) — só se aceitar que reverte parcialmente |
| 58 | **A virada julga só ONTEM** (`computeDailyReset` › `yesterdayString`): quem faz tudo na segunda e reabre na quarta nunca recebe o dia completo — perfil "3×/semana que só abre nesses dias" = **0 dias completos em 90**, rookie para sempre (`07-simulacao-jogo-r2.md` §2.1). Julgar o dia de `lastResetDate` (ou creditar cada dia entre `lastResetDate` e ontem via `habitRhythms.done`)? | **Como está** (nenhuma regra de jogo muda sem você); `02-REGRAS` §7 passa a avisar "dia completo só existe se houver virada no dia seguinte" | Mudar = `computeDailyReset` julga `lastResetDate`; guard "seg feito, qua aberto → `perfectDays` +1"; é a pergunta D4 ("dias ou aberturas?") |
| 59 | **Queda = cura grátis**: `degeneratedPerfectDays` devolve `max(floor(req/2), prev − 5)`, que costuma ser ≥ `required` do estágio novo → o botão Evoluir acende **na mesma abertura** e devolve HP cheio; `redeemed: true` por um clique (`07` §2.2). Exigir uma virada completa depois da queda, ou piso ≤ `required − 1`? | **Como está**; `02-REGRAS` §18 passa a descrever o efeito | Opção A: `canEvolve` exige `!degeneratedByHP` até o próximo `dayWasPerfect`; opção B: piso ≤ `required − 1`; guard em `degeneracao.cenarios.test.ts` |
| 60 | **Glitchtama conta dia completo — agora com número** (estende #41): no perfil B (faz tudo seg/qua/sex + 1 run/dia) o 🌀 responde por **39 de 77** `totalPerfectDays` (**51 %**) e antecipa mega de d32 para d18; no perfil G (zero hábitos, 1 run/dia) são 90 "dias completos" com 0 dias completos e `dias-completos-30`/`mission-perfect-30`/`perfect-day` abrem por masmorra (`07` §2.6). O provisório de #41 (`vetos.md`) não foi aplicado | **Como está** (#41 segue aberto; `vetos.md` ainda sem a linha — registrar ou reverter é sua escolha) | 🌀 credita `perfectDays` sem tocar `totalPerfectDays`, **ou** só vale em dia com `dailyDone > 0` |
| 61 | **Economia: quem só cuida = 0 Bits em 90 dias.** Bits vêm só de minijogo (masmorra 327–417/run, sem teto de runs); hábito, tarefa, dia completo, evolução = 0. Perfil A (tudo, todo dia) nunca vê a loja; perfil G (só masmorra) compra 4× a loja e 288 chips (+864 de atributo — o galho vira comprável) (`07` §2.7) | **Documentar** "a loja é dos minijogos" em `02-REGRAS` §46 (nenhuma curva muda) | Bits por dia completo (unidade já sancionada, risco #16) e/ou teto de runs/dia |
| 62 | **Rebirth × `perAccountLifetime 26`**: o renascimento promete 11 formas novas contra um teto vitalício de 26 gerações sem reset de `aiLifetime` → renascido recebe arte de reserva após ~5 recusas (`03` passivos). 48, ou zerar no rebirth? | **Como está** (26; arte de reserva é declarada) | 48 = 1 constante; zerar no rebirth = `aiLifetime` reset em `rebirth.ts` + custo de IA dobra por conta |
| 63 | **Higgsfield Starter vs Gemini para o E0**: Starter (R$ 81/mês fixo) só compensa acima de ~35 pagantes novos/mês; para o E0 o Gemini avulso custa R$ 23 vs R$ 92 (`03` §0.3). Pausar o Starter? | **Manter o Starter** — no ar **não há `GEMINI_API_KEY`** (`wrangler secret list`), então sem `HF_API_KEY` o sprite morre, não cai no fallback | Pausar = definir `GEMINI_API_KEY` primeiro, depois remover `HF_API_KEY`; prova: `/api/generate-sprite` devolve `provider:'gemini'` |
| 64 | **Workers Paid antes do E0?** O free tier estoura por **escrita de KV (1.000/dia) em ~18 DAU** (~55 writes/usuário/dia); `_aiGuard.js` fail-closed → `put` falho = **503 no chat**, cloud save perdido em silêncio; o E0 (10 + você + 2º aparelho) já é ~72 % do teto (`03` §0.2). US$ 5/mês | **Não contratar**; o runbook do operador ganha "olhar a cota de KV writes no painel" e 1 `put` por chamada de IA entra na fila do backend | Contratar = painel Cloudflare, 1 clique; some a linha do runbook |
| 65 | **Aplicar migrações D1 em produção** — `npx wrangler d1 migrations list soulmon-billing --remote` mostra `0001` e `0002` **"to be applied"**; `claimOrderAtomic` sem a tabela = **500 na 1ª compra Play** (a frase do STATUS "cai no caminho antigo" era falsa). A máquina já está logada (`wrangler whoami`). O operador pode rodar `npx wrangler d1 migrations apply soulmon-billing --remote`? | **Não roda sem o seu aval** (é o banco de dinheiro); o código ganha `try/catch` caindo para o KV com log (§3.1 do consolidado) | "Pode" = o operador roda, cola a saída no STATUS e `d1 migrations list` vazio é a prova; 0 pagantes hoje = zero risco |
| 66 | **`FIREBASE_SERVICE_ACCOUNT` no worker de push** — o worker **está deployado** (21/09 12:57Z; #50(a) respondida) mas `wrangler secret list --name digiapp-push-scheduler` lista só `SEASON_ADMIN_KEY` e `VAPID_JWK` → o canal FCM (APK Android) **nunca envia**; só Web Push (PWA) funciona. `cd workers && npx wrangler secret put FIREBASE_SERVICE_ACCOUNT` (JSON da conta de serviço do projeto `soulmon-app`) | Ausente = o diário do E0 registra **"E0 sem push no APK; PWA com push"** e a H1 lê só a PWA | Definir = 1 comando; `wrangler deploy` não é necessário (secret sobrevive) |
| 67 | **`ENTITLEMENTS_ADMIN_KEY` + `COURTESY_MAX_ACCOUNTS=10`** — no ar, `POST /api/entitlements?action=grant` responde **404** (a rota não existe sem a chave) → nenhuma cortesia pode ser concedida → o E0 não começa. `COURTESY_DEFAULT_MAX` no código é 25 (≠ plano de 10). `npx wrangler secret put ENTITLEMENTS_ADMIN_KEY` e `… COURTESY_MAX_ACCOUNTS` (valor `10`) | Ausentes = **E0 não começa**; nada mais a fazer pela squad | Definidos = prova: grant com chave errada → 401; 11ª conta → recusa |
| 68 | **GitHub billing** (repete #48) — **ainda parado em 22/09/2026**: 260 runs `failure` desde 16/09 (`gh run list --limit 1000 --json conclusion,createdAt`), último `success` = `docs-sync` 15/09. Nenhum portão roda fora da máquina local há 6 dias | Squad nada pode; o consolidado da R2 registra "compile Android não provado" | Regularizar *Billing & plans* → `workflow_dispatch` de `ci.yml` e `android-build.yml` e ler os logs |
| 69 | **iOS / Firefox Android são suportados?** Nunca foi declarado. O gate de WebView mandava Firefox Android "atualizar o WebView" (em correção); PWA iOS = storage separado, Web Push só instalado (16.4+) | **Declarar**: suportados = Android Chrome (PWA/APK) + desktop Chromium; iOS e Firefox Android = "melhor esforço", sem teste de paridade; entra em `PLAY-FICHA` e no portão | Suportar iOS = 1 passada de teste (R-D6) + guarda-plataforma ganha o alvo |
| 70 | **Tagline única** — hoje são 3 em 3 lugares: `PLAY-FICHA.md` §6.3 "Ela cresce com o seu dia." (única escrita, sem `narrative-critic`), `og:description` do `index.html` ("cadastre…", "retrô, pixel art") e `manifest.json`. Qual vale? | **"Ela cresce com o seu dia." / "It grows with your day."** até o `narrative-critic` passar a ficha e o `<head>` juntos (R1 #6 ainda aberto); é a que os briefs L2/L3 usam | Outra frase = trocar na ficha, no `<head>`, no `manifest.json` e nos briefs — um lugar só de verdade |
| 71 | **Pré-registro e consentimento do E0 — assinar.** `docs/E0-PREREGISTRO.md` (H1–H3 com critério de falseamento, morte precoce, roteiros D7/D14, o que n=10 não conclui) e `docs/E0-CONSENTIMENTO.md` (separado dos Termos: liga e-mail↔saveId a pessoa nomeada, grava fala, controlador = você, LGPD art. 7º I, 18+). Você é o controlador e o entrevistador | Docs prontos e indexados; **nenhum convite antes** de você datar os dois e de #67 estar definido | Mudar hipótese/critério = editar o pré-registro **antes** do 1º convite (depois, não muda mais — é o sentido do pré-registro) |

## Respostas QA RODADAS 1 e 2 (22/09/2026, modal)

As 32 (#40–#71) respondidas. Divergências da recomendada em **negrito**. Numeração: #57–#63 saíram
duplicadas por dois agentes na mesma rodada; abaixo os pares estão desfeitos com sufixo `b`.

| # | Resposta |
|---|---|
| 40 | Cortesia **sobrevive** ao reembolso da Play (como aplicado) |
| 41/60 | 🌀 Glitchtama **não conta** para conquistas: `totalPerfectDays` só por dia completo real (segue contando para a missão) |
| 42 | Dados ao Groq: **declarar** (política §2b/§6 + hints + guard) |
| 43 | Transcrição: **nomear** Supabase (repasse) e Groq Whisper |
| 44 | **Nomear encarregado LGPD** na política (dono, `mateus.sprnd@gmail.com`) |
| 45 | Termos EN: redação **A** (`US$ 6.99` com fonte) |
| 46 | Steam na política: manter "quando disponível" |
| 47 | Save 365 d e `ent:` "5 anos a partir da exclusão": declarados, mantidos |
| 48/68 | GitHub billing: **o dono resolve depois** — CI segue parado; compile Kotlin sem prova |
| 49/69 | Suportados: **Android Chrome (PWA/APK) + desktop Chromium**; iOS e Firefox Android = melhor esforço. E0 assume que há iPhone: 1 passada antes do convite |
| 50 | Push D0 suprimido (ok). E0 roda **com Web Push**; o FCM do APK espera #66 — declarar no pré-registro |
| 51 | E0: dono convida e entrevista; squad lê (seg 09:00) e dá suporte |
| 52 | ADRs: **aprovar a 006 agora** (versionamento do save); 004 e 005 depois do E0 |
| 53 | Symlinks `higgsfield-*`: **apagar do repo** (a skill vive na conta) |
| 54 | SteamID64: **apagar na exclusão** (perde a trava "um Steam, uma conta"; privacidade vence) |
| 55 | **Modelo novo**: compra única R$ 29,90 (jogo + 11 formas) **+ assinatura de IA R$ 9,90/mês com 300 mensagens**, só **texto/voz** (chat melhor, sugestões, transcrição) — **sprite fica fora da assinatura** (custo de imagem); estourou a cota, compra créditos; 1º mês de cortesia para quem comprou o desbloqueio. **Construir DEPOIS do E0**; por ora vale o teto por tier (demo 30 / paid 120) |
| 56 | Lápide: login posterior reabre a conta vazia (como aplicado) |
| 57 | Marcar feita: **toast "Desfazer" 5 s** revertendo a conclusão inteira |
| 57b | "3× por semana": coração **só cobra se a semana fechar sem a meta** |
| 58 | Virada: **julgar o último dia aberto** (credita o dia de `lastResetDate` quando o app reabre depois de pular dias) |
| 58b | Dreno de cocô: **mesmas travas da virada** (carência de save novo, rampa de retorno, piso da raiz) |
| 59 | Queda: **exigir uma virada completa** antes de re-evoluir (acaba a cura grátis por um clique) |
| 59b | Vínculo: **aplicar o patch** (emitir os 6 eventos mudos) **agora**, antes do E0; tabela do §55 passa a incluir a comida |
| 61/63 | Economia: **Bits por dia completo + teto de runs** por dia (números a calibrar na simulação) |
| 62 | Rebirth: **zerar `aiLifetime.sprite`** no renascimento |
| 63b | E0 com **Higgsfield Starter** (não há `GEMINI_API_KEY` no ar) |
| 64 | Workers Paid: **não contratar ainda**; runbook mede KV writes e a squad reduz puts por chamada de IA |
| 65 | D1: **aplicado em 22/09/2026** — `0001` ok; `0002` falhou (`duplicate column name: expires_at`: a tabela já existia com a coluna, vinda do caminho `d1 execute --file` do README antigo) e foi **marcada como aplicada**; `PRAGMA table_info` confirma as 4 colunas; `migrations list` → "No migrations to apply". A 1ª compra da Play não dá mais 500 |
| 66 | `FIREBASE_SERVICE_ACCOUNT`: **o dono cola o JSON** (comando abaixo); depois a squad redeploya o worker |
| 67 | `ENTITLEMENTS_ADMIN_KEY` + `COURTESY_MAX_ACCOUNTS=10`: **o dono faz depois** — sem isso a cortesia responde 404 e o E0 não começa |
| 70 | Tagline única: **"Ela cresce com o seu dia." / "It grows with your day."** (vai para `og:description`, `manifest.json` e ficha) |
| 71 | Pré-registro e consentimento do E0: **assinados em 22/09/2026** |

**Comandos que dependem do dono** (rodar no terminal dele, no repo):

```
cd workers && npx wrangler secret put FIREBASE_SERVICE_ACCOUNT   # cola o JSON da conta de serviço
npx wrangler secret put ENTITLEMENTS_ADMIN_KEY                    # chave de 32+ bytes, só dele
npx wrangler secret put COURTESY_MAX_ACCOUNTS                     # 10
```

Fila vazia até a próxima rodada.

## Respostas ALOCAÇÃO DE ELEMENTO (22/09/2026, modal)

As sete (#72–#78) da spec `docs/plano-melhorias/G-alocacao-elemento.md`.
Divergência da recomendada em **negrito**.

| # | Resposta |
|---|---|
| 72 | `ALLOC_FRACTION` = **0,25** — o jogador redistribui 1/4 do `ELEMENT_ORCAMENTO_BY_STAGE`, o oráculo segue dono de 3/4 (no ultra, 187 pontos = os dois componentes de um par) |
| 73 | Se a simulação adversarial de arena reprovar, **a alocação perde efeito de combate**: `getArenaAttributes` passa a ler a distribuição automática. Nunca afrouxar a janela 40–80% |
| 74 | Sem v1 da forma, a referência cai para o **ancestral da mesma linha** (rookie no limite). Galho irmão **nunca** |
| 75 | **A referência é CONDIÇÃO** (diverge da recomendada, que era best-effort): com referência a enviar, a geração espera o provedor que aceita imagem em vez de cair para o Gemini. Responde 202/reserva; o Invariante nº 1 cede aqui e só aqui — ver §9.4 |
| 76 | **Só o aviso na Home**, nenhum push. WP4.30b cortado |
| 77 | **Construir agora**, validando com os portões locais; os PRs esperam o runner para mergear (o GitHub Actions segue parado, #48) |
| 78 | O elemento alocado **troca a arte do golpe**, sem tocar em dano — usa as 1.078 peças de `fx-ataque/` que a D9 mantém sem uso. Escopo: só o pet renascido (WP4.33) |

## Decisão AVULSA — incubação de 30 min (22/09/2026, na conversa)

Não veio de pergunta minha; foi instrução direta do dono. Fica aqui porque
altera duas decisões já registradas da spec `G-alocacao-elemento.md`.

| # | Decisão |
|---|---|
| 79 | **A incubação tem espera mínima de 30 minutos** (`INCUBATION_MIN_MS`). Palavras do dono: *"A incubação deve começar um processo de 30min peo usuário voltar depois e evoluir de fato. Nesse tempo o sprite é gerado."* Entra como **D-G8b** na spec. É PISO, não prazo: passados os 30 min a evolução fica disponível e assim permanece — o relógio só LIBERA, nunca tira. O D-G8 (nada se perde por não abrir o app) continua inteiro. |
| 79b | **Consequência necessária, não uma segunda decisão:** a alocação passa a fechar no **início da incubação**, e não mais no gesto de evoluir (D-G9 revisto). O sprite é gerado a partir da ficha, e a ficha é o que a alocação mexe — editável durante os 30 min, a alocação deixaria de influenciar a forma, que é a razão de a funcionalidade existir. Isto RESTAURA o desenho original do dono (*"o último dia é de incubação (…) deve deixar claro que status novos não influenciarão mais na evolução"*), desfeito por tabela quando o prazo de 24h foi revogado. Se o dono quiser o contrário — alocação editável até o gesto —, o preço é a forma não refletir a alocação, e aí a funcionalidade inteira perde o sentido. |

⚠️ **Pendente, e é do dono:** isto vale só para o **renascido** (v2.0, onde a
geração é tardia por estágio — D-G5) ou a espera de 30 min também entra no
**v1**, para todo jogador? No v1 as 11 formas já nascem todas de uma vez, então
não há o que incubar em relação à alocação — mas a ocasião B do
`spriteTrigger.ts` já gera o sprite da próxima forma na véspera, e hoje quem
evolui na hora em que o último ponto cai pode pegar a forma sem sprite pronto
(quem atende é a ocasião C, de resgate). Pôr os 30 min no v1 resolveria isso e
**acrescentaria uma espera à evolução de todo mundo** — é troca de produto, não
detalhe técnico. Não implementado em nenhum dos dois casos: a funcionalidade
segue PARQUEADA para a v2.0.

## Decisão AVULSA — geração tardia no v1 (22/09/2026, na conversa)

| # | Decisão |
|---|---|
| 80 | **Os 30 min de incubação valem no v1** — *"No v1 mesmo"*. Não é só do renascido. Entra como escopo do **D-G8b**. |
| 81 | **Nasce só o rookie; o resto é sob demanda, na incubação** — *"nao nascem as 11 de uma vez. Só nasce o rookie e o restante é sob demanda, na incubação"*. Entra como **D-G5b**, substituindo o D-G5 (que restringia a geração tardia ao renascido). ⚠️ **É mudança, não descrição**: hoje o TEXTO das 11 formas (`soulmonStages`) é escrito de uma vez no nascimento e o SPRITE já é incremental, mas a ocasião A gera **duas** formas (rookie + champion previsto), não uma. Medição em §6.4-A da spec. |

✅ **RESOLVIDO na mesma conversa (22/09/2026) — opção (b):**

| # | Decisão |
|---|---|
| 82 | **A incubação começa na ELEGIBILIDADE.** Palavras do dono: *"B. Quando pode evoluir começa a incubação e depois de 30min volta e completa sob o comando do user."* Gatilho `faltam <= 0`, não `faltam === 1`. Entra como **D-G8c**. Reverte de propósito o *"pra evitar espera"* da instrução original: a espera passa a ser o conteúdo — é o tempo de incubar. A ocasião B (véspera) deixa de existir; a C (resgate) vira a própria incubação. Quem completa continua sendo o gesto do jogador. |

**Decidido por mim, e declarado (D-G8d)** — o portão é o RELÓGIO, nunca o
sprite ficar pronto. Aos 30 min a evolução libera mesmo que a geração tenha
falhado, sido recusada, ou o jogador esteja em `sprite-form-cap` /
`sprite-lifetime-cap` — que é o estado normal de quem bateu o teto. Amarrar o
portão ao sprite prenderia o jogador fora da própria evolução por falha de
terceiro. Se o dono quiser o contrário, é aqui que se muda.

## minimal-ui F2 — Home B (23/09/2026, decididas pela recomendação, pendentes do dono)

| # | Pergunta | O que foi feito (recomendação) |
|---|---|---|
| F2-1 | A frase de apoio do chat (`.sm2-chat-support`, parecer clínico de 21/09) aparecia SEMPRE sob a barra. Com o terminal sempre aberto no rodapé, ela comia ~3 linhas da lista. | Aparece **enquanto a pessoa escreve** (campo focado, com texto, ou foco em qualquer peça da barra — o link não some antes do toque). Se o dono quiser a frase sempre visível, é uma linha em `ChatBox.tsx` (`focado \|\| inputValue`). |
| F2-2 | A captura de uma linha (`QuickAddBar`) não está no mock aprovado; o "+" do cabeçalho abre o `CreateModal`. | Saiu da Home; o componente e o `handleQuickAdd` ficaram no repo. Voltar é recolocar o JSX acima do `DailyRituals`. |
| F2-3 | Brincar perdeu a célula do deck ("brincar e carinho seguem no gesto sobre o pet"). Qual gesto? | **Toque duplo** no pet (e a tecla **P** com o foco nele). Toque simples continua sendo a fala; segurar e esfregar, o carinho. |

## Catálogo de atividades (28/09/2026) — F1–F6 fechados nesta sessão (2 rodadas)

Rodada 1 entregou F1/F2 e deixou F3–F6 como CAT-1..CAT-6 abaixo. Rodada 2
(mesmo dia) aplicou a revisão de psicologia inteira (vetos V1–V3 e ajustes
A1–A6 de `docs/reviews/2026-09-28-catalogo-psicologia.md`) e fechou F3–F6 de
forma ADITIVA — ver `docs/REGISTRO-DE-DECISOES.md` §16.1. Status de cada
pendência antiga:

| # | Pendência (rodada 1) | Status (rodada 2) |
|---|---|---|
| CAT-1 | Onboarding com seletores + starter set + retroativo | **Feito**, sem tocar em `SoulmonOnboarding.tsx`: `CatalogOnboardingFlow.tsx` roda como intersticial de "uma vez só" (`utils/catalogOnboarding.ts`), mesmo mecanismo para novo e antigo. `soulGoal`/`soulStruggle` continuam intocados. |
| CAT-2 | `CreateModal` → navegador; `EvolveTaskModal` → convite de nível | **Parcial.** `CatalogBrowserModal.tsx` substitui a abertura direta do `CreateModal` pelo "+" (busca, abas, "por que funciona", "Algo que não está aqui?"). O convite de nível é um componente NOVO (`CatalogLevelInviteModal.tsx`, testado) em vez de reaproveitar `EvolveTaskModal` — mas **ainda não tem gatilho automático** ligado à constância real na virada. Ver CAT-7. |
| CAT-3 | UI dos itens de TCC (aviso + CVV + copy sem promessa) | **Feito**: `CatalogMindNotice.tsx` (A1), copy reescrita (A2, com teste que reprova trata/cura/terapia), itens `optInOnly` com peso 0 na meta (V2) e nunca no starter set automático (V1). |
| CAT-4 | Pool com 28 de ~60 itens | **Decidido pelo dono (28/09/2026, rodada 3): fica com 28.** Não expandir — encerrado, não é mais pendência. |
| CAT-5 | Simulação de economia + verificação visual | **Feito**: `utils/catalogEconomy.simulation.test.ts` (200 perfis sintéticos) + verificação no navegador (localStorage limpo e save legado, sem erro de console). |
| CAT-6 | Docs (`PLANO-TAREFAS.md`, `CHANGELOG.md`) | **Feito**: `docs/CHANGELOG.md` criado (movido da raiz em `7fb869f0`), `PLANO-TAREFAS.md` Fase 6 e `REGISTRO-DE-DECISOES.md` §16.1 atualizados. |
| CAT-7 | `CatalogLevelInviteModal` não tinha gatilho automático | **Feito (rodada 3, 28/09/2026 — decisão do dono: "ligar agora")**: `utils/catalogLevelSignal.ts` calcula `ratio` real em duas janelas (21 dias para subir via `LEVEL_UP_WINDOW_DAYS`, 7 dias para descer), `lowConstancyStreak` conta dias consecutivos SEM contar dias perdoados (escudo/ausência), cooldown de 14 dias após recusa, nunca sobe em `optInOnly`. `pickCatalogLevelInviteCandidate` varre as atividades de catálogo e entra na fila única de intersticiais do `App.tsx` (`catalogLevelInvite`), no máximo 1 convite por dia (app inteiro, campo `lastCatalogLevelInviteDayKey`). |
| CAT-8 | Dois mecanismos de onboarding (ritual do Oráculo + convite do catálogo) coexistindo | **Decidido pelo dono (28/09/2026, rodada 3): manter separados.** Não fundir — encerrado, não é mais pendência. |

### Pendências novas desta rodada (nenhuma bloqueante)

Nenhuma. `pickCatalogLevelInviteCandidate` é determinístico e testado (17
casos em `catalogLevelSignal.test.ts`); a única simplificação consciente é
que `daysAtLevel` conta a partir de `catalogLevelSetAt` — hábitos criados
ANTES desta sessão (via onboarding/navegador das rodadas 1–2) não têm esse
campo, então nunca vão sugerir SUBIR até o dono aceitar o primeiro convite de
DESCER ou até o item ser recriado. Isso é intencional (nunca assumir tempo
não observado) e autolimitante: não há dado incorreto, só uma janela de
"ainda não elegível" para os poucos hábitos de catálogo já existentes.


## Exploração — o que pôr ao lado da Masmorra (30/09/2026) — proposta formal, NADA implementado

Fonte: [`BENCHMARK-EXPLORACAO.md`](BENCHMARK-EXPLORACAO.md) (pesquisa) e os três pareceres em
`docs/reviews/2026-09-30-exploracao/` (linha vermelha, psicologia, gênero monster taming). **Nenhuma linha de
código foi escrita e nenhuma regra foi decidida:** a coluna "Recomendação" é a leitura dos pareceres, não um
provisório aplicado. Toda a Camada 3 segue congelada (`REGISTRO-DE-DECISOES.md` §5.6) até o dono responder a
EXP-1. **Achado que muda as perguntas:** a Aventura da noite (`adventure.ts`, `AdventureDiary`, decisão de
08/09/2026: só narrativa, sem recompensa material) já é "o pet saiu e voltou com um achado". Os três pareceres
convergem em que Passeio e Diário de Campo, do jeito proposto, duplicam o que já existe.

Vereditos: **Passeio** VETADO na forma proposta pela linha vermelha (Bits pelo achado, retorno por relógio real
como convite a push, achados acumulados por ausência) e APROVADO COM RESSALVA pela psicologia e pelo gênero,
sempre na forma emendada (sem Bits, sem push, sem fila, um postal, fundido com a Aventura) · **Diário de Campo**
APROVADO COM RESSALVA nos três (extensão do `AdventureDiary`, sem silhueta do que falta, sem contagem, sem
raridade, fora do `weeklyReport`) · **Escavação** APROVADO COM RESSALVA nos três (lore em ordem fixa,
determinística, uma por dia; decoração rara só com 1/dia e semente do dia, ou fora).

| # | Pergunta | Recomendação (nada aplicado) | Se o dono disser outra coisa | Gatilho de revisão |
|---|---|---|---|---|
| EXP-1 | **Abrir exceção ao congelamento da Camada 3 (§5.6) para a Exploração**, como foi a Guilda e o Ateliê? | **Sim, estreita:** só a versão emendada (Diário de Campo como extensão do `AdventureDiary`, Escavação só lore e determinística, Passeio como face da Aventura existente). Nenhum parecer vê razão para bloquear essa versão; a parte que só funde com a Aventura talvez nem precise de exceção. Sem a exceção: nada é implementado e a Exploração fica só com a Masmorra. | "Não": arquivar; o benchmark e os pareceres ficam como registro. "Sim, ampla" (Passeio com Bits e push): volta ao `soulmon-guarda-linha-vermelha` antes de virar tarefa; o Passeio original segue VETADO. | 10 usuários × 14 dias de dado (o gatilho do próprio congelamento). Qualquer proposta com Bits pelo achado ou com push de retorno reabre o parecer. |
| EXP-2 | **No Passeio, o pet pode sair da Home** (palco vazio ou "passeando" diegético), ou o Passeio é só um timer com o pet presente? | **O pet não sai.** Fica presente e cuidável (comer, banho, sono, carinho, que é a única cura de HP). O Passeio se sinaliza por rastro/bilhete diegético ou pela folha, nunca por palco vazio mudo. Motivo: o dreno do cocô segue ativo e um palco vazio lê como abandono. Se o dono quiser "passeando" diegético: só sem bloquear nenhuma ação de cuidado. | "Palco vazio": exige que carinho e cura continuem disponíveis com o pet "fora" e testes que provem isso; parecer volta ao guarda e à psicologia. | Dado (≥ 10 × 14) de que o palco vazio não gera abertura sem conclusão nem opt-out; ou qualquer estado em que o cuidado fique indisponível por causa do Passeio. |
| EXP-3 | **Os achados podem render decoração rara**, ou só lore e Bits? | **Achados do Passeio: só lore** (Bits pelo achado é a alternativa que perdeu em 08/09/2026; reabrir exige responder "o que mudou desde então?"). **Decoração rara só na Escavação**, e só determinística (no máximo 1 por dia, semente `dayKey`, cosmética, nunca à venda, nunca em `trophy`) — ou fora. | "Bits também": registrar a reversão da decisão de 08/09 com o custo (a tela do relatório passa a ser aquela que a pessoa PRECISA abrir; farm por ausência). | Aposta 9 do registro: se a abertura do relatório da noite cair depois que o catálogo de cenas é visto, a primeira resposta é conteúdo novo, e só depois reabrir a decisão. |
| EXP-4 | **O Diário de Campo entra no resumo semanal (`weeklyReport`)** ou fica fora? | **Fora.** Um "N achados" no relatório é contagem de coleção virando métrica de desempenho (#16) e cria semana fraca visível. No máximo uma frase de cena, sem número. | "Dentro, só frase": aceitável se o `weeklyReport` ganhar antes um critério de descrição pura verificável em teste. | O `weeklyReport` já traz `dreams` (contagem); isso não serve de precedente para outra. Rever se um dia houver critério de descrição pura. |
| EXP-5 | **A Escavação paga Bits (com teto) ou só lore?** | **Só lore no v1** (psicologia e gênero). Se pagar, a linha vermelha aceita só pelo funil `handleEarnGamePoints` com o teto de 150 e sem tocar Glitchtama; e o dono registra a resposta a "o que mudou desde que a Aventura perdeu o pagamento". | "Bits com teto": pelo funil existente, sem bônus por sequência nem por fragmento, sem jogada extra à venda. | Se o teto de 150 for atingido só pela Escavação, o balanço de minijogos revê o valor. Mesmo gatilho da EXP-3. |
| EXP-6 | *(nova, do B2)* **Passeio e Diário de Campo fundem com a Aventura da noite e o `AdventureDiary`** (um relógio de retorno, um catálogo, um diário) **ou o dono reabre a decisão de 08/09** e aceita dois sistemas? | **Fundir.** Os três pareceres pedem um relógio só e um diário só; dois "voltou?" com horários diferentes duplicam o gatilho de verificação e dois registros do mesmo fato dão números diferentes na mesma tela. | "Dois sistemas": o parecer da linha vermelha e o da psicologia precisam ser refeitos sobre o desenho novo. | Mesma Aposta 9 (abertura do relatório noturno estável em 90 dias). |
| EXP-7 | *(nova, do parecer de gênero)* **Que biomas o Passeio usa?** As 13 cenas de `SPIRIT_BG_SCENES` são cenas de fenda e arena, não bioma: duas são arenas do Torneio, uma é a cena fixa do Pesadelo, e a Necrópole de Ossos fere a regra de arte sem caveiras da Exploração. | **Não usar as 13 no todo.** Só as que casam com os reinos da bíblia (§7.2): cavernas, oceano e talvez gelo; o resto pede arte nova, que é decisão da `squad-arte`, não deste pacote. | "Usar as 13": aceitar que passear vire "descer na fenda" outra vez. | Quando houver arte de reino (deserto, picos, pântano, floresta, campina). |

### Respostas do dono à Exploração (30/09/2026, por modal) — ainda NADA implementado

- **Ideias escolhidas:** só o **Passeio, fundido à Aventura da noite** (EXP-1 = sim, estreita; EXP-6 = fundir). **Diário de Campo e Escavação não foram marcados** — ficam fora até o dono dizer o contrário.
- **EXP-2:** o pet **"passeando" diegético** (não a recomendação "pet presente"). Condição herdada dos pareceres: nenhuma ação de cuidado (comer, banho, sono, carinho) pode ficar indisponível por causa do Passeio, com testes que provem isso; o parecer da linha vermelha e o da psicologia voltam a olhar o desenho antes de virar tarefa.
- **EXP-3 / EXP-5 (respostas dadas, valem se a Escavação entrar):** decoração rara só na Escavação, 1/dia, determinística (semente `dayKey`), cosmética, nunca à venda; Escavação **só lore** no v1, sem Bits.
- **EXP-4 (`weeklyReport`) e EXP-7 (biomas):** **não respondidas**; seguem a recomendação (Diário fora do `weeklyReport`; só as cenas que casam com os reinos, o resto é arte nova).
- **Continua VETADO:** Passeio com Bits pelo achado, push de retorno, achados acumulados por ausência.

## Travessias (missões de vida real na Exploração) — 30/09/2026

Fonte: [`PROPOSTA-MISSOES-EXPLORACAO.md`](PROPOSTA-MISSOES-EXPLORACAO.md) e os três pareceres em
`docs/reviews/2026-09-30-missoes/` (todos **APROVADO COM RESSALVA**). **Nada implementado.**

**Decididas pelo dono (modal de 30/09/2026):** MIS-1 exceção à Camada 3 **sim, com as condições dos pareceres** ·
MIS-2 nome **Travessias / Crossings** · MIS-3 barra por **amplitude**, não por dificuldade · MIS-4 **postal e lore
exclusivos por região** (exceção à regra 4 da Aventura; catálogo comum segue alcançável). Registradas no
`REGISTRO-DE-DECISOES.md` §5.6.

| # | Pergunta aberta | Recomendação (aplicada como padrão até resposta) | Gatilho de revisão |
|---|---|---|---|
| MIS-5 | A Travessia pode entrar na meta do dia? | **Nunca**, nem como bônus (linha vermelha R-37: viraria perdão de coração sem prova; psicologia: fora nas duas direções) | Só com dado ≥ 10 × 14 e novo parecer |
| MIS-6 | Texto livre do usuário (reflexão depois do "Fiz")? | **Não no v1.** Se entrar: uma linha opcional, fora de IA e telemetria (#18, D8) | Quando D8 for respondida |
| MIS-7 | O mapa é finito? O que vem depois de tudo aberto? | 8 reinos (sem akasha): 1 de casa + 7 a abrir, ordem livre; regiões abertas continuam convidando, **sem estado "completo"** | Quando o 1º jogador abrir todas |
| MIS-8 | Quem cura o pool de desafios? | `squad-narrativa` escreve, **psicologia com veto**; toda região com opção solitária, em casa, sem gasto, ≤ 10 min | A cada leva nova de desafios |
| MIS-9 | Região de casa? | O reino do pet se estiver no save; senão `campina` (hoje o reino mora só no `localStorage`) | Quando o reino for para o save |
| MIS-10 | Abrir a região dá o cenário do reino na loja? | **Não** (gênero: abrir região não é item) | Se o dono quiser cosmético pela Travessia |
| MIS-11 | Interruptor para esconder a camada inteira de Travessias? | **Sim** (psicologia: período ruim) | — |
| MIS-12 | Menores de idade | Pedir parecer do `soulmon-ip-brand-guardian` antes de implementar | Antes do v1 |

**Implementado em 30/09/2026** (Passeio + Travessias, `feat/passeio-travessias`). Parecer de menores e marca
(`reviews/2026-09-30-missoes/04-menores-e-marca.md`, APROVADO COM RESSALVA) respondeu a MIS-12 com piso 13+ no pool
(`minAge: 13`), sem contato com desconhecido, lugar novo só público/perto/de dia, sem postar/filmar, sem a palavra
"challenge" na UI — tudo travado em `travessias.contract.test.ts`.

| # | Pergunta aberta | Recomendação (aplicada como padrão) | Gatilho de revisão |
|---|---|---|---|
| MIS-13 | O portão de idade continua sendo só a caixa "Tenho 18 anos ou mais"? As Travessias são o primeiro recurso que manda agir fora do app | Manter a caixa (verificação dura coleta dado de todos) e as travas R-1..R-11 do parecer 04 como compensação | Primeira telemetria; parecer jurídico sobre a ECA Digital (Lei 15.211/2025, não lida) |
| MIS-14 | Travessias aparecem na ficha da loja/screenshots? | **Não na v1.** Depois: sem "challenge", sem pessoa real, sem cena de rua | Próxima revisão da ficha |
| MIS-15 | Frase de segurança no `termos.html` §8 (parecer 04 R-9)? | Acrescentar uma frase PT+EN ("as Travessias são opcionais; escolha só o que for seguro para você") — mexe em página legal, por isso não entrou sem o dono | Antes de publicar na loja |
| MIS-16 | Busca de marca de "Crossings" (INPI/USPTO)? | Não usar "Crossing" sozinho em marketing (Animal Crossing); busca antes de qualquer uso fora do app | Antes do marketing |

**Respostas do dono (modal, 30/09/2026):** MIS-13 **manter a caixa de 18+** (as travas do pool compensam) · MIS-14
**Travessias fora da ficha da loja na v1** · MIS-15 **frase de segurança no `termos.html` §8** — feita, PT+EN,
`TERMS_VERSION` 2026-09-30 (quem já aceitou vê o aviso de atualização, sem bloqueio) · MIS-16 **"Crossings" fica no
app**; em marketing nunca "Crossing" sozinho, e busca de marca (INPI/USPTO) antes de qualquer uso fora do app.

## NPCs de função — onde cada um aparece (30/09/2026, `arte-instalador`)

Os 6 bustos de função da leva `npcs-flare` estão instalados (`src/assets/soulmon/npcs` › `FUNCTION_NPC_ART`,
nome e fala em `src/utils/areaNpcVoice.ts` › `FUNCTION_NPC_VOICE`), mas **nenhuma tela os desenha ainda** — onde
entram é decisão de design.

| # | Pergunta aberta | Recomendação (do ROSTER; nada aplicado até resposta) | Gatilho de revisão |
|---|---|---|---|
| NPC-1 | Onde cada NPC de função aparece? | **Ambra** → IntroScreen, SoulmonOnboarding, FirstDayCard · **Iris** → OraclePage · **Faro** → UnlockAccountModal, CreditsModal, AccountSection, ProtectProgressModal · **Sona** → DreamDex, RestWindowCard, MorningDream · **Nuri** → CareSystem, DailyRituals · **Tobi** → SettingsPage. **+12 extras (01/10/2026, leva `npcs-femininas`; `EXTRA_NPC_ART` + `EXTRA_NPC_VOICE`, sem chamada)** — ofício sugerido pelo ROSTER: **Scoria** forjadora · **Kama** mestra de combate (dojo) · **Sable** caçadora de recompensas da Masmorra · **Bastia** capitã da guarda · **Zahra** guardiã das feras da Arena · **Salvia** curandeira · **Gila** mercenária de expedição · **Vela** navegadora do Passeio · **Trill** barda da Feira · **Datura** alquimista de venenos · **Rime** arqueira · **Oriel** sacerdotisa do Oráculo. Nenhuma tem lote hoje; a pergunta é se ganham lote/função nova ou substituem alguém **+3 do banco (01/10/2026, instalação final da rodada 3; mesmos mapas, sem chamada)** — **Selene** rainha arlequina da lua (função futura: deusa da lua, sombras, morte, mistérios e pântano) · **Mallo** ferreiro e forjador de martelos · **Kova** ferreira. Os dois ferreiros se sobrepõem à Scoria (forjadora): a pergunta é se ficam no mesmo lugar (Mercado/forja) ou se um vira o dojo | Próximo canvas de design que tocar uma dessas telas |
| BOSS-1 | Onde os 24 chefes entram? (leva `poderosos`, 01/10/2026; `src/data/bossRoster.ts` + `BOSS_ART`, **sem chamada** — masmorra/arena intocadas) | Sugestão do ROSTER por função: **Torneio** Cinderhorn (preliminar) → Arauto do Fim (final; é BUSTO, não corpo inteiro) · **Corrida** Thrummer → Squallstride · **Masmorra** Orbitant (andar 3), Mycelar (4), Obsidarch (5) · **Duelo** Bladeveil → Sabrefin · **Feira** Glimmerswarm, Corallume (Bestiário) · **Ateliê** Halorune → Chorale · **Refúgio** Drifela → Hollowmere · **Passeio** Astrawing → Nebulara · **Laboratório** Voltbloom → Graftfang · **Sonhos** Duskveil, Dawnloom → Aeonyx · **Mercado** Tallyjack → Cuprex. Chefe com combate muda regra de jogo (masmorra = 6 inimigos/andar hoje) — por isso não foi ligado | Quando o dono decidir o papel de chefe em cada modo |
| DUELO-1 | Os 6 retratos de oponente do Duelo (`utils/dueloArt.ts`, 01/10/2026) entram onde? | O oponente do Torneio é um amigo real, no estágio REAL dele — o retrato genérico apagaria essa informação, então **não foi ligado**. Sugestão: usar só num duelo contra "criatura da Arena" (sem jogador por trás), escolhendo o retrato por `dueloOponenteArt(id)` | Quando o dono decidir se existe duelo contra criatura da Arena |


## Torcida por toques — o que o plano deixou em aberto (02/10/2026)

Decisao do dono aplicada: torcida = tocar na tela + gauge + golpe especial (`REGISTRO-DE-DECISOES.md` §20). Ficou para o dono:

| # | Pergunta aberta | Recomendacao (nada aplicado alem do provisorio) | Gatilho de revisao |
|---|---|---|---|
| TORC-4 | O Desafio do Torneio exige Vinculo nivel 5 + rede (o interruptor de PvP saiu: todo personagem ja nasce no PvP, H13). Quem esta abaixo do 5 ve a aba explicando o requisito e quanto falta; o dono, para ver a torcida no Torneio, precisa chegar ao 5 ou de um save de teste | Manter o gate (regra de produto: unico destrave social, `bond.ts` §6) | O dono nao conseguir testar o Torneio, ou querer o duelo fantasma aberto antes do 5 |
| TORC-6 | A Masmorra (5 camadas) ja era dificil para o jogador medio da barra: com defesa 0,70 a camada 1 nao e limpa nem pelo estagio certo (so quem desviava a ~0,90 passava: champion@1 42%, ultimate@1 72%). A defesa automatica foi calibrada para o jogador MEDIO (resultado identico ao de antes) e a vida/dano dos inimigos nao foi tocada. Qual deve ser a dificuldade-alvo? | Nada aplicado. Se a camada 1 deve ser limpavel pelo estagio certo (~50%), a opcao menos invasiva e reduzir a vida dos inimigos da Masmorra (`buildDungeonWave`, ~x0,5) e rodar a simulacao de `autoDefesa.test.ts` de novo; a alternativa e subir `AUTO_DEF_MEAN` (~0,85) | O dono jogar a Masmorra e achar impossivel ou trivial |
Respondida (02/10/2026): **TORC-5** — SIM, e implementado: interruptor "Aparecer na lista publica do Torneio" / "Show me on the public Tournament list" em Configuracoes → Seus dados, ligado por padrao (`hideFromPublicList` no save, `publicHidden` no perfil do servidor). Desligado, a pessoa some na hora do diretorio, dos oponentes, do ranking e do perfil publico, nao e adicionavel como amigo e o apelido nao vai nos presentes; segue jogando e vendo o proprio lugar (`rank&id=` devolve `me`). Politica de privacidade bumpada para `2026-10-02`. Detalhe e riscos remanescentes em `REGISTRO-DE-DECISOES.md` §20 (item 8).

Respondidas (02/10/2026, noite): **TORC-1** — o especial do Pesadelo e da Masmorra vale **3x** o golpe-base (era 2x provisorio); **TORC-3** — a esquiva TAMBEM saiu: o jogador so torce e o Soulmon se defende sozinho (`utils/autoDefesa.ts`, calibrada para o jogador medio, resultado identico ao da esquiva media; `TimingBar` guardada atras de `TIMING_DODGE_ENABLED = false`); **TORC-4** — manter o gate do Vinculo 5. Conta e alternativas em `REGISTRO-DE-DECISOES.md` §20.8. Nova pendencia: **TORC-6** (dificuldade-alvo da Masmorra).

Respondida (02/10/2026): **TORC-2** — o Duelo da Arena TAMBEM virou torcida (H14): pet golpeia sozinho, gauge de 8 toques, golpe de torcida ×1,35, esquiva segue na barra; calibracao e conta em `REGISTRO-DE-DECISOES.md` §20.6.

## Rodada de QA de 04/10/2026 — achados que EXIGEM decisao do dono (nada aplicado)

Tres rodadas de QA (conta/save/economia, loop do jogo, combate/servidor/lojas) corrigiram 37 bugs com teste. Os itens abaixo mudam comportamento ou arquitetura e por isso ficaram para o dono.

| # | Pergunta aberta | Recomendacao (nada aplicado) | Gatilho de revisao |
|---|---|---|---|
| QA-1 | **Relogio que volta** (viagem para oeste, relogio atrasado): `computeDailyReset` roda sobre um dia anterior, apaga o progresso de hoje, pode cobrar 1 coracao e regrava `lastResetDate` para tras. | Nao virar o dia quando `lastResetDate` estiver 1–2 dias a frente (guard em `rolloverPendingFor`/`computeDailyReset`); inverte um teste existente (`useDailyReset.clock.test.ts`) | Relato de progresso apagado apos viagem/fuso |
| QA-2 | **Duas abas/janelas** do app: nenhuma le o evento `storage` de `GAME_STATE`; a ultima aba a agir apaga o progresso da outra. | Politica de multi-aba (adotar o estado da outra aba, com cuidado de ping-pong) — precisa de ADR | Dono usar web e PWA ao mesmo tempo |
| QA-3 | **Corrida no KV do Torneio** (`match` e `duelStart` sao ler-modificar-escrever sem atomicidade): dois `match` paralelos com o mesmo duelo aberto podem liquidar duas vezes; dois `duelStart` gastam uma cota so. | Fechar com D1 ou Durable Object (decisao de arquitetura) | Ranking com pontos duplicados |
| QA-4 | **`match` que falha por rede**: `TournamentPage.resolveMatch` zera o duelo sem retry; o servidor segue com duelo pendente que vira derrota na proxima acao mesmo que o jogador tenha vencido a animacao. | Entrar "tentar de novo" ou guardar o resultado local ate confirmar | Jogador reclamar de derrota apos vitoria |
| QA-5 | **Oponente que se oculta (ou desliga o PvP) no meio de um duelo**: `match` responde 404 e o duelo fica pendente ate virar derrota; o oponente ainda ganha pontos. | Cancelar sem custo quando o oponente some | Idem |
| QA-6 | **Pos-exclusao de conta**: `AccountDataSection` mostra "Pronto, apagamos" mas nao limpa o aparelho; o save local e a sessao ficam ate o proximo POST tomar 410; `reagirContaExcluida` entao grava uma copia do save apagado em `soulmon-reconcile-backup`, nunca limpa. | Limpar tudo na hora (sem a copia de backup quando foi o proprio titular que excluiu) | LGPD/exclusao verificavel |
| QA-7 | **`consumedOrders` poda em 200** (`applyVerifiedPurchase`): replay de um pedido de credito mais antigo que isso pode creditar de novo. | Deduplicar por `ord:` (o claim ja existe) | Auditoria de compras |
| QA-8 | **Compra paga pendente sem retry no boot**: o reenvio cobre so a mesma sessao; se o app fechar entre a cobranca e o `verify`, so "Restaurar compras" recupera. | Reconciliar `getPurchases` ao abrir o app (e feature, nao bug) | Estorno da Play por compra nao entregue |
| QA-9 | **Missao `shower` ("De 3 banhos")**: `handleShower` conta cada toque, sem exigir coco e sem teto diario; farmavel em 3 toques. | Definir o que conta como "banho" (so com sujeira? teto 1/dia?) | Missao completa sem cuidar do pet |
| QA-10 | **Renascimento mantem `perfectDays`**: o novo rookie herda os dias perfeitos do ultra e pode evoluir em seguida. | Confirmar se e intencional (esta documentado no codigo) | Evolucao "rapida demais" apos renascer |
| QA-11 | **Habito "a cada N dias" (`from: 'start'`)**: a ancora e `done[0]` e `done` e truncado em 120; a fase pode mudar apos ~120 conclusoes. | Gravar a ancora no save (mudanca de modelo) | Habito "a cada N dias" fora de fase |
| QA-12 | **`EditModal` em estagio sem grade de dias** (rookie, inclusive apos queda) regrava `schedule` como "todo dia": editar so o nome de um habito `timesPerWeek` apaga a agenda. | Preservar a agenda quando a grade nao existe | Habito semanal virando diario |
| QA-13 | **Reaceite apos subir `TERMS_VERSION`/`PRIVACY_VERSION`** (#24 ja listada): conta com onboarding feito e consentimento antigo nunca volta a tela de termos (o aviso aparece, o reaceite nao e exigido). | Exigir reaceite quando a politica muda de forma material | Auditoria LGPD |

## Torneio R8 — Mestre/Grão-Mestre, molduras e NPCs (04/10/2026)

Implementado na branch `feat/r8-torneio` com a recomendação do lead; detalhe e alternativas em
`REGISTRO-DE-DECISOES.md` §23. Nenhuma bloqueia.

1. **Lugar de Mestre/Grão-Mestre: vivo ou congelado?** Hoje é VIVO (saiu do top 100/20, volta na hora à faixa de
   pontos — nunca abaixo dela). Alternativa: congelar o lugar até o fim da season.
2. **Piso para disputar o lugar:** hoje lifetime ≥ 1500 (faixa Diamante). Mantém?
3. **Moldura dos OUTROS no ranking:** hoje só você vê a sua. Mostrar a dos outros exige publicar o id da moldura no
   perfil público (servidor + política de privacidade).
4. **Molduras de loja/conquista/evento:** preços sugeridos 600/900 Bits; quais conquistas e eventos dão moldura? A
   compra na loja ainda não está ligada (o catálogo já existe).
5. **NPCs do Torneio vazio:** o cartão diz "Treino" (honesto); se preferir o disfarce total, some o selo — o resultado
   continua dizendo "Sem prêmio e sem custo".
6. **"i" único:** o pedido citava a Feira; a Feira é outra folha (Guilda) e não aparece no Torneio, por isso não está
   no texto. Incluir uma linha apontando para ela?
