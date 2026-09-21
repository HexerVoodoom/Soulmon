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
