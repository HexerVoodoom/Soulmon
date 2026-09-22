# DOSSIÊ DE ESTADO pós-execução — QA Rodada 1 (21/09/2026, noite)

Repo `D:\Soulmon\repo`, branch `qa/rodada-a`, HEAD `5228145e`. Base lida: `docs/manual/00-MAPA.md`,
`docs/reviews/2026-09-21-qa-geral/00-CONSOLIDADO.md`, `docs/PERGUNTAS-DO-DONO.md` ("Respostas QA
GERAL"), os 3 blocos "EXECUÇÃO"/"sincronização" no topo de `docs/STATUS.md`, `CLAUDE.md`,
`docs/REGISTRO-DE-DECISOES.md` §5.6/§6.1, `docs/plano-melhorias/ledger/*.md`, `docs/Attributions.md`,
`docs/PLAY-DATA-SAFETY.md`, `docs/PLANO-PRODUTO.md`.

---

## 1. As 29 decisões (#11–#39): implementada · parcial · só registrada · contradita

| # | Decisão | Estado | Prova / o que falta |
|---|---|---|---|
| 11 | 1º usuário = (a) 10 conhecidos, PWA, cortesia, 14 dias | **só registrada** (decisão de estratégia, não de código) | `docs/REGISTRO-DE-DECISOES.md` §5.6 linha "Camada 3 CONGELADA" cita #11/#13; gatilho de revisão = 10 usuários × 14 dias de dado — nada a implementar em código |
| 12 | Rota de cortesia (`ADMIN_KEY` + teto + `provider:'courtesy'`) | **implementada** | `functions/api/_entitlements.js` → `grantCourtesy`, `ENTITLEMENTS_ADMIN_KEY`, `COURTESY_MAX_ACCOUNTS` (padrão 25); `functions/api/entitlements.grant.qa.test.js`. **Parcial no que depende do dono**: `STATUS.md` linha 96 lista `ENTITLEMENTS_ADMIN_KEY`/`COURTESY_MAX_ACCOUNTS` como segredo ainda não configurado no painel — código pronto, secret pendente |
| 13 | Congelar Camada 3 e registrar no REGISTRO | **implementada** | `docs/REGISTRO-DE-DECISOES.md` §5.6, linha "Camada 3 CONGELADA até 10 usuários × 14 dias de dado (21/09/2026)", com gatilho de revisão nomeado |
| 14 | Manter ads desligados e avaliar (não apagar) | **parcial** | `ADS_ENABLED`/`grantAdReward` continuam em `src/utils/monetization.ts` (não apagados, condizente com a decisão) — **mas** a seção de ads em `PLAY-DATA-SAFETY.md` prometida ("ganha seção de ads na fila de monetização") **não existe**: o único hit de "ads" no arquivo é a linha 273, que ainda diz "o app não tem anúncios" (frase resquício, não a seção nova) |
| 15 | 18+ é ICP; persona adolescente sai dos check-ups | **implementada** | `docs/manual/01-VISAO.md` linha 119: "**18+ é o ICP, não só defesa legal**... a persona adolescente... sai dos check-ups" com link para `REGISTRO-DE-DECISOES.md` |
| 16 | Domínio depois; Play: squad prepara tudo, dono executa console | **implementada** (o que é da squad) | `docs/PLAY-FICHA.md` + `docs/PLAY-LANCAMENTO.md` (ficha PT/EN, IARC, checklist §A–§I). **Divergência a registrar**: a resposta final registrada em `PERGUNTAS-DO-DONO.md` linha 88 ("Domínio: depois") diverge do provisório original da pergunta #16 ("Comprar agora") — é negrito na tabela de respostas, então já está marcada como divergência da recomendada, não é achado novo |
| 17 | Cobrança web depois do 1º usuário; corrigir PLANO-PRODUTO Parte 3 | **parcial** | `docs/PLANO-PRODUTO.md` linha 147 tem a nota de 21/09/2026 corrigindo "priorizar o funil web" para "web hoje NÃO cobra" — mas a Parte 3 (linha ~145) **ainda contém a frase original** "Receita líquida:... **Priorizar o funil web**" logo ACIMA da nota corretiva, sem tachar/substituir — o doc hoje se contradiz na mesma página (frase antiga + nota que a desmente, nenhuma apagada) |
| 18 | `METRICS_ADMIN_KEY`: dono define; squad entrega script | **parcial** | `scripts/metrics-report.mjs` entregue (STATUS linha 73-74); `METRICS_ADMIN_KEY` continua sem valor no painel — bloqueado do lado do dono, como o próprio STATUS admite ("Depende do dono", linha 96) |
| 19 | Aviso de WebView velho por `CSS.supports` agora | **implementada** | `index.html` linhas 121-139: `CSS.supports('selector(&)')`, comentado, com hash novo na CSP (citado no STATUS) |
| 20 | 1h de revisão profissional na trava de crise antes do 1º usuário | **só registrada / não cumprida** | `STATUS.md` linha 97: "**Depende do dono:**... 1 h com profissional na trava de crise (#20)" — nada além do registro; a trava técnica (`ChatBox`, `findahelpline`, CVV 188) já existia de rodada anterior, a REVISÃO PROFISSIONAL em si não ocorreu |
| 21 | Token FCM/Web Push declarado como ID na ficha; `PLAY-DATA-SAFETY.md` §2.7 atualizado | **implementada** | `PLAY-DATA-SAFETY.md` linha 189: "não é ID do dispositivo... **sem fonte**" foi substituído — carimbo "Atualizado em: 21/09/2026 (§2.7 e §3b)" na linha 14; §2.7 hoje declara o token como ID |
| 22 | Declarar IA na ficha + aviso in-app (Configurações › Sobre) | **implementada** | `PLAY-DATA-SAFETY.md` §3b (linha 244-252) declara IA (Higgsfield/Gemini/Groq/S16); `SettingsPage.tsx` tem grupo "Sobre"/"About" (linha 412) com `FeedbackLink` — **não confirmei o texto literal do aviso de IA dentro do grupo Sobre** (grep não achou string "gerado por IA" no `SettingsPage.tsx`; achado só o grupo e o import do `FeedbackLink`) — **parcial**: rebaixo para parcial por falta de prova direta da frase de aviso na tela |
| 23 | Corrigir código (DELETE push na exclusão) + declarar retenção `ord:` na política §8 | **implementada** | `functions/api/account.js` + `account.pushScan.qa.test.js` têm `revokePushBeforeDelete`; `docs/STATUS.md` linha 82-83 registra "exclusão de conta revoga push" e "política §8 (o que a exclusão apaga; `ord:` 5 anos)" |
| 24 | Banner informativo ao subir `TERMS_VERSION`, sem re-aceite | **implementada** | `src/components/TermsUpdateBanner.tsx` + `.render.test.tsx`; `src/utils/termsNotice.ts` + testes; `STORAGE_KEYS.TERMS_NOTICE_SEEN` (confirmado em `storageKeys.ts`) |
| 25 | Termos EN em dólar (`publishedPrice.test.ts` aceita paridade declarada) | **implementada** | `src/utils/monetization.ts` → `FULL_UNLOCK_PRICE_LABEL_USD`; `src/utils/publishedPrice.test.ts` |
| 26 | `Attributions.md`: fontes + arte de IA (sem deps npm) | **implementada** | `docs/Attributions.md` seções "Tipografia" (Material Symbols/Fredoka/Rubik/Silkscreen) e "Arte gerada por IA — procedência por lote" (linha 206+), com a linha final explícita: "sem linha, de propósito: dependências npm... o dono decidiu... que o escopo é arte, som e fontes" |
| 27 | Cláusula de crise/IA no §8 dos termos — squad redige e autoaprova | **implementada** | `STATUS.md` linha 80: "termos §8 reescrito (IA sem revisão humana, não é emergência, CVV 188/findahelpline)" |
| 28 | Roster 64→37 agentes | **implementada** | `STATUS.md` linha 89-93 descreve a redução; `.claude/agents/` — presença confirmada de `soulmon-operador.md` e `soulmon-guarda-plataforma.md` (novos), ausência de `prod-squad` do repo (não contei os 37 letra por letra — decisão de escopo do QA anterior fez essa contagem, não repetida aqui) |
| 29 | LV #20 ganha exceção registrada em `vetos.md` | **implementada** | `docs/plano-melhorias/ledger/vetos.md` linha 65: entrada de 21/09/2026, "Exceção da #20 (QA GERAL #29)", com a regra da exceção nomeada (chave vetada por OUTRA proibição pode ser removida, só por `remove()` explícito) |
| 30 | `'tasks-100'` renomeada para gatilho de comportamento | **implementada** | `src/utils/achievements.ts` linhas 11-23: `dias-completos-30`/`DIAS_COMPLETOS_PARA_CONQUISTA = 30`, lendo `totalPerfectDays`, não mais `.length` de tarefas; `vetos.md` linha 66 registra o veto e a saída. **Nota**: a arte do emblema "ainda desenha '100'" (STATUS linha 44) — dívida cosmética aberta, é a que o PREÂMBULO pediu para checar |
| 31 | Orçamento de performance vira guard | **implementada** | `src/deploy/orcamentoDeBytes.contract.test.ts` (STATUS linha 49-52): JS ≤250KB, CSS ≤100KB, imagem ≤400KB, vídeo ≤800KB, com a dívida atual nomeada (`index.js` 641KB etc. — reprova crescimento, não a dívida existente) |
| 32 | Apagar PNG de `dist/` após WebP | **implementada** | STATUS linha 47-49: `scripts/convert-to-webp.mjs` reescreve refs e apaga PNG; `dist/` 123MB→24MB, "provado no vite preview + Chrome" |
| 33 | Remover 38 deps sem import + guard | **implementada** | STATUS linha 45-47: "40 dependências... removidas... 37 aliases mortos"; `src/deploy/depsVivas.contract.test.ts` |
| 34 | Electron: bump junto com o Steam | **só registrada / não implementada (correto)** | `PERGUNTAS-DO-DONO.md` linha 70: "Como está" — decisão é adiar, então "não mexido" É o estado correto, não uma pendência |
| 35 | ADRs 001–003 → `docs/adr/`; ROADMAP datado com lápide | **implementada (ADRs); não confirmada a lápide do ROADMAP** | `docs/adr/ADR-001-conta-e-save.md`, `ADR-002-repos-irmaos.md`, `ADR-003-limitador-audioworklet.md` existem. Não localizei o ROADMAP de `squad-alpha-runs/som-01/` (fora do git, por design — `.gitignore` o exclui) para confirmar a lápide; **parcial** por essa parte não verificável no repo versionado |
| 36 | `product/soulmon-01/**` indexado como registro no MAPA | **implementada** | STATUS linha 85-86: "`product/soulmon-01` e `docs/adr` no MAPA"; `00-MAPA.md §5` citado no índice (não recontado linha a linha) |
| 37 | Remover `SettingsModal` | **implementada** | STATUS linha 42: "`SettingsModal` apagado (prop `onOpenAISettings` saiu da cadeia App → CompanionHUD → ChatBox)" |
| 38 | `CLAUDE.md`: corrigir as 7 afirmações + 2 refs `arquivo:linha` | **implementada** | Confirmado por leitura direta do `CLAUDE.md` atual: Coraçãozinho tem lápide (⚰️ saiu da loja), `HEART_COST_CREDITS` tem lápide, canal é `soulmon_push` (com nota "⚰️ era digiapp_push"), plugin é `SoulmonWidgetPlugin` (nota "⚰️ era DigiWidgetPlugin"), `meetsPvpBond` é o símbolo citado, tabela é `EXCECOES` (nota "⚰️ era DÍVIDA"); refs por SÍMBOLO, não `arquivo:linha`, nos dois pontos de URL de produção |
| 39 | Fósseis da raiz → `docs/historico-digiapp/` com lápide; README novo | **implementada** | `docs/historico-digiapp/` tem 21 arquivos incluindo `README.md`, `PWA-SETUP.md`, `PWA-CHECKLIST.md`, `PROJETO.md`, `PLANO_MELHORIAS.md`, `index.html.example`, `manifest.webmanifest`, `registerSW.js`; raiz do repo não voltou a ser lida (README novo não confirmado por leitura direta nesta rodada) |

**Resumo:** 20 implementadas · 5 parciais (14, 17, 18, 22, 35) · 3 só registradas/aguardando o dono (11, 13 é registro mas completo, 20, 34 correto como está) · **0 contraditas por outro doc dentro do próprio escopo da decisão** — mas ver §2 abaixo para a contradição mais grave da rodada, que é sobre a EXECUÇÃO da #38-adjacente (ledger).

---

## 2. Contradições NOVAS entre os docs de hoje (grep cruzado)

### 2.1 A mais grave: STATUS.md afirma um conserto no ledger que os arquivos do ledger não têm

`docs/STATUS.md` linha 87 (bloco "EXECUÇÃO... etapas 1–3 e 5"), datado 21/09/2026:

> "LEDGER 87 WPs, **WP1.14 RECUSADO**, **WP3.4 IMPLEMENTADO**, 8 comandos de aceite vivos."

Grep direto nos arquivos-fonte do ledger, feitos hoje (verificados agora):

- `docs/plano-melhorias/ledger/nascimento.md` linha 20 — **WP1.14 continua `VERIFICADO`** (não `RECUSADO`), com o texto original intacto ("Link mágico com o pet presente... APROVADO").
- `docs/plano-melhorias/ledger/vinculo.md` linha 10 — **WP3.4 continua `VERIFICADO`** (não `IMPLEMENTADO`), texto idêntico ao que o QA GERAL já tinha apontado como "falso positivo".

**Isto é uma contradição nova, produzida hoje**: o STATUS registra uma correção que o commit não fez. Os dois "falsos positivos" que a `09-guardas.md` (QA GERAL) apontou em 21/09 de manhã seguem exatamente como estavam à tarde/noite, só que agora há um registro afirmando o contrário. Quem ler só o STATUS acredita que o ledger foi corrigido; quem abrir o ledger real vê o erro de novo.

### 2.2 PLANO-PRODUTO.md se contradiz na mesma página

`docs/PLANO-PRODUTO.md` linha 145: "Receita líquida:... **Priorizar o funil web.**" — texto original, não removido.
`docs/PLANO-PRODUTO.md` linha 147-149 (nota de 21/09/2026, decisão #17): "a web **hoje NÃO cobra**... a única compra que existe é pela Play".

A "correção" foi ANEXADA logo abaixo da frase que ela contradiz, sem riscar/reescrever a frase antiga. Resultado: o mesmo documento, na mesma seção, manda "priorizar o funil web" (frase de venda) e diz duas linhas depois que esse funil não cobra nada. É a mesma classe de apodrecimento que o `CLAUDE.md` corrigiu para si mesmo (comentário-lápide sobre a linha ruim) — aqui não foi feito.

### 2.3 `PLAY-DATA-SAFETY.md`: seção de ads prometida no STATUS não existe no doc

`docs/PERGUNTAS-DO-DONO.md` linha 86, resposta #14: "**Manter ads desligados e avaliar** (não apagar); `PLAY-DATA-SAFETY.md` ganha seção de ads na fila de monetização."

`docs/PLAY-DATA-SAFETY.md` grep por "anúncio|ads|Ads" retorna **uma linha só** (273): "O app não tem anúncios e não usa `AdvertisingId`" — frase antiga sobre publicidade ID, não uma seção nova "na fila de monetização". A seção prometida pela resposta #14 não foi escrita.

### 2.4 Sem outras divergências novas achadas entre os 3 blocos do STATUS, os PLAY-*.md, REGISTRO e CLAUDE.md corrigido

Os três blocos "EXECUÇÃO"/"sincronização" do STATUS concordam entre si sobre o que fizeram (não achei uma etapa que um bloco diga feita e outro diga pendente). `CLAUDE.md` corrigido bate com `Attributions.md` (coraçãozinho, `HEART_COST_CREDITS`, `soulmon_push`) e com `PLAY-FICHA.md`/`PLAY-LANCAMENTO.md` nos pontos cruzados (versionCode 15/1.1.4, billing 6.2.1).

---

## 3. Docs que os agentes de hoje declararam fora do escopo — o que continua pendente

| Doc/item | Declarado fora do escopo, por quem | Continua pendente? |
|---|---|---|
| `11-GLOSSARIO.md` | `STATUS.md` linha 37: "**Fora do delta, de propósito**: `11-GLOSSARIO` (termos 'cortesia'/'dias completos 30' não indexados — o delta não o lista)" | **Sim, continua pendente.** Não indexado hoje; não faz parte de nenhuma das 29 decisões executadas |
| `09-HISTORICO.md` | mesma linha do STATUS: "e `09-HISTORICO` (sem linha para `42b07bec`/`4a8b8049`)" | **Sim, continua pendente.** Os dois commits da execução de hoje não têm entrada no histórico do manual |
| `ledger/<guarda>.md` com WP1.14/WP3.4 velhos | STATUS afirmava correção (linha 87); provado falso em §2.1 acima | **Sim, pior que pendente — o STATUS mente que já foi corrigido.** `nascimento.md` e `vinculo.md` seguem com o texto original |
| `.claude/agents/soulmon-guarda-linha-vermelha.md` "20 proibições" | Não declarado como fora de escopo — **já foi corrigido antes desta rodada**: `docs/plano-melhorias/ledger/vetos.md` linha 11 já diz "**21 proibições**... contagem de 21/09/2026" com lápide "⚰️ '20 proibições'... valeu até 02/09/2026". O agente `.md` em si não foi grepado por número (o arquivo do agente não necessariamente repete a contagem) | **Não é mais pendência** — a fonte viva (`vetos.md`) já está em 21, com data e comando de contagem (`awk`/`grep -cE`) |
| Arte do emblema `dias-completos-30` | `STATUS.md` linha 44: "arte do emblema renomeada, **ainda desenha '100'** — squad-arte" | **Sim, continua pendente** — dívida cosmética explicitamente aberta, dono é a squad-arte |
| `PLAY-DATA-SAFETY.md` §2.3 | Preâmbulo pede checar; achado: §2.3 recebeu Higgsfield+Gemini conforme STATUS linha 56 ("`PLAY-DATA-SAFETY.md` §2.3/§3 ganharam Higgsfield + Gemini") | **Não pendente** — confirmado feito (grep linha 205: "Higgsfield + Google Gemini") |

---

## 4. Fósseis restantes: `grep -ril digiapp` fora de `docs/historico-digiapp` e `dist`

Rodei o grep pedido (case-insensitive) e filtrei. **A esmagadora maioria dos ~85 hits fora dos dois diretórios excluídos são COMENTÁRIOS/LÁPIDES intencionais** (a mesma prática que o `CLAUDE.md` usa: "⚰️ era X até a data Y") — não é fóssil ativo, é registro de migração, e o próprio `CLAUDE.md` instrui a manter essas menções (ex.: identificadores internos que nunca aparecem ao usuário). Amostrado por categoria:

**Comentário-lápide / narração histórica (não é fóssil funcional, é rastro documentado):**
- `android/app/build.gradle:102` — comentário citando "compartilhado com o DigiApp" como referência ao `CLAUDE.md`, não configuração ativa de compartilhamento
- `src/utils/safeStorage.ts:30` — comentário: "Era `contact@digiapp.app`"
- `workers/push-scheduler.js:8` — comentário-lápide sobre o que o comentário antigo dizia
- `.gitignore:5` — "# Artefato de build TWA antigo (DigiApp) — o app hoje é Capacitor."
- `functions/api/_kv.js` — **este é funcional, não fóssil morto**: `DIGIAPP_SAVES` é fallback ATIVO e documentado (linhas 4-35), aceito de propósito pelo `CLAUDE.md` ("aceita `SOULMON_SAVES` e `DIGIAPP_SAVES`") até o dono separar o KV no painel — é dívida CONHECIDA e nomeada, não um fóssil escondido

**Ainda vivo e sem lápide própria (candidato real a fóssil funcional):**
- `functions/api/_kv.js` continua sendo o único ponto de acoplamento real com o binding antigo; não é "fóssil esquecido" — está documentado no `CLAUDE.md` (seção Arquitetura) como dependendo do dono trocar o painel. Não é achado novo.

**Não achei, nesta varredura, nenhum arquivo de CÓDIGO ativo (fora dos dois diretórios excluídos e fora do `_kv.js` já conhecido) com lógica DigiApp funcional não documentada.** Os demais hits em `docs/manual/*`, `docs/PERGUNTAS-DO-DONO.md`, `docs/SEPARACAO-DIGIAPP.md`, `docs/reviews/`, `.claude/agents/*` são todos DOCUMENTAÇÃO narrando a separação (histórico, não fóssil ativo) — inclusive `docs/SEPARACAO-DIGIAPP.md` é o próprio documento-registro da limpeza, existe para isso.

**Conclusão do item 4:** não há fóssil novo — o único acoplamento DigiApp funcional que resta é o binding KV (`DIGIAPP_SAVES` fallback em `_kv.js`), já conhecido, já nomeado no `CLAUDE.md`, e depende do dono mexer no painel do Cloudflare (não é algo que a squad possa fechar sozinha).

---

## 5. Tabela final

| Achado | Severidade | Conserto | Dono |
|---|---|---|---|
| STATUS.md afirma "WP1.14 RECUSADO, WP3.4 IMPLEMENTADO" mas `ledger/nascimento.md` e `ledger/vinculo.md` continuam com o texto original (`VERIFICADO`) — o registro mente sobre o próprio conserto | **alto** | Editar os dois arquivos de ledger de fato, ou corrigir o STATUS para não afirmar um conserto que não ocorreu | squad-docs / doc-mantenedor |
| `PLANO-PRODUTO.md` diz "priorizar o funil web" e, duas linhas depois, que o funil web não cobra — nota anexada sem riscar a frase original | **médio** | Reescrever o parágrafo (não anexar nota) ou lapidar a frase antiga como foi feito no `CLAUDE.md` | doc-mantenedor |
| `PLAY-DATA-SAFETY.md` não ganhou a seção de ads prometida na resposta #14 | **médio** | Escrever a seção "ads" na fila de monetização, como a resposta registrou | squad-compliance |
| Aviso de IA em Configurações › Sobre (#22) não confirmado por grep de texto — só a existência do grupo "Sobre" e do `FeedbackLink` | **baixo** | Confirmar/escrever a frase de aviso de conteúdo de IA dentro do grupo Sobre | squad-compliance |
| Arte do emblema `dias-completos-30` ainda desenha "100" | **baixo** | Regerar/editar a arte do emblema (registrado, aberto de propósito) | squad-arte |
| `11-GLOSSARIO.md` e `09-HISTORICO.md` sem entrada para o delta de hoje | **baixo** | Indexar "cortesia"/"dias completos 30" no glossário; lançar `42b07bec`/`4a8b8049` no histórico | doc-mantenedor |
| Lápide do ROADMAP em `squad-alpha-runs/som-01/` (fora do git) não verificável no repo | **baixo** | Confirmar fora desta sessão (pasta não versionada) | dono / squad-som |

**O que continua sem dono:** a correção real do ledger (achado 1 acima) — ninguém assumiu editar os dois arquivos-fonte, só o STATUS foi escrito como se estivesse feito; e a seção de ads em `PLAY-DATA-SAFETY.md`, que a resposta #14 prometeu e nenhuma sessão escreveu.
