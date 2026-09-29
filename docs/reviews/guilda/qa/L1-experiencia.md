# L1 — QA de experiência da Guilda (app rodando)

29/09/2026. `npm run build` + `vite preview` (xdg-open falso) + Playwright/Chromium, 390×844, `hasTouch`.
Save semeado por `addInitScript` (`soulmon_state_v1` + flags de onboarding/tutorial); `/api/community?action=coop*` mockado por `page.route` com um servidor de estado (mensagens de erro reais de `functions/api/community.js`). Nenhum código de produto foi editado; `dist/` restaurado.

Matriz: 27 estados × {PT, EN} × {claro, escuro} pelo Hall → Salão da Guilda; subconjunto (vazio, g2, g4, get-500, entrar-ok) por Arena → Guilda em pt-claro e en-escuro; teclado/voltar/movimento reduzido/offline em pt-claro, pt-escuro e en-escuro. Screenshots citados estão em `shots/`; os demais ficaram no scratchpad (a matriz completa tem o mesmo comportamento nos 4 temas/idiomas).

Referência de escopo: só é bug o que diverge do que é regra HOJE (`CoopPanel`, `PLANO-COOP.md` §3.3–3.4, §4). O que é só `PLANO-GUILDA.md` (Bosque, 12 membros, Feira, gestos, `share`, botão de sair no erro "já em outra") NÃO foi reportado como bug.

## Tabela estado × achado

| # | Estado | Achado | Sev. | Evidência | Correção mínima |
|---|---|---|---|---|---|
| 1 | Sem guilda (vazio) | OK. Texto de regra, Criar `primary` / Entrar `outline`, botões inertes por superfície (contraste 5,09 claro / 6,3 escuro), sem ícone em box, sem cobrança. | — | `pt-light-vazio`, `en-dark-vazio` | — |
| 2 | Carregando | OK. Spinner + "Procurando seu grupo…"; com movimento reduzido o `animate-spin` cai para 1e-5s (parado) e o texto segue. Folha sem animação de entrada. | — | `pt-light-carregando` | — |
| 3 | Criar (ok) | OK. Grupo de 1 tem texto próprio ("Por enquanto é só você…"), código em chip 44×44 de copiar. | — | `pt-light-criar-ok` | — |
| 4 | Criar com nome de 24 letras largas sem espaço | O nome (`h2`) não quebra: estoura o card e o scroller da folha ganha overflow horizontal (`scrollWidth` 485 > 374). Nome com espaços quebra bem. | MÉDIO | `pt-light-criar-nome-longo` | `overflow-wrap: anywhere` no `.sm2-lib-h2` do card do grupo (e `min-width: 0` no card). |
| 5 | Criar com 500 | Alerta âmbar "Não deu certo agora. Tente de novo." e o formulário se mantém preenchido. Sem cobrança. | — | (scratchpad `criar-500`) | — |
| 6 | Código inválido (404) | Mensagem clara, âmbar, sem `danger`, campo preservado. | — | `pt-light-codigo-invalido` | — |
| 7 | Código curto (<8) | "Entrar" inerte até 8 caracteres; sem dica do porquê (só o placeholder). | BAIXO | (scratchpad `codigo-curto`) | Opcional: `aria-describedby` com "8 caracteres". |
| 8 | Entrar (ok) | OK, cai no grupo de 2. | — | (scratchpad `entrar-ok`) | — |
| 9 | Grupo cheio (409 `group full`) | Mensagem própria ("Esse grupo já está cheio.") e código preservado. OK. | — | `pt-light-entrar-cheio` | — |
| 10 | Já em um grupo (409) | **Beco sem saída.** Diz "Você já está num grupo." e mantém o formulário de criar/entrar; não mostra o grupo nem oferece sair/atualizar. Só fechar e reabrir a folha resolve. Chega-se aqui pelo caso #16 (leitura falhou → form → Criar). | MÉDIO | `pt-light-entrar-ja-em-grupo` | No `agir`, ao receber `already in a group`, refazer `getCoop(saveId)` e mostrar o grupo. |
| 11 | Colisão (409 `join collision`) e nome recusado | Caem na mensagem genérica "Não deu certo agora. Tente de novo." (não há copy própria hoje; o plano §5 a prevê para o futuro). | BAIXO | (scratchpad `entrar-colisao`) | Nada agora; entra no WP da Guilda. |
| 12 | Grupo com 1 membro | Estado próprio, sem barra "sozinha" sem contexto. OK. "Sair do grupo" fica na dobra (scroll 41 px). | BAIXO | `pt-light-g1` | — |
| 13 | Grupo com 2 membros | OK: por pessoa só ícone check/círculo + "apareceu hoje / ainda não hoje". Nenhum número por pessoa em nenhum estado (`digitsInMembers` vazio em toda a matriz). | — | (scratchpad `g2`) | — |
| 14 | Nome de membro longo | O nome é truncado com reticências **e o "· você" é cortado junto** (está dentro do mesmo `span.t`): a pessoa não reconhece a própria linha. Nome nulo vira "Alguém/Someone" (ok). | MÉDIO | `pt-light-g2-nomes-estranhos` | Tirar o "· você" do `span` truncável (irmão com `flex: none`) e deixar só o nome com `text-overflow`. |
| 15 | Grupo com 4 membros | Legível, mas a folha (2/3 da tela, 467 px) rola 106 px: código e **"Sair do grupo" ficam abaixo da dobra**; o corte do chip do código é a única pista de rolagem. A saída é regra de produto ("sair é um toque"), e aqui exige rolar. | MÉDIO | `pt-light-g4`, `en-dark-g4` | Tirar do topo a frase de regra repetida quando já há grupo (ganha ~80 px) ou fixar "Sair" no rodapé da folha. |
| 16 | Erro de rede / 500 / 429 / 200-não-JSON **ao abrir** | O painel se comporta como "sem grupo": mostra Criar/Entrar sob o alerta "Não deu para falar com o servidor." Quem TEM grupo vê um formulário de criar (falso) e **não há botão de tentar de novo**. O 429 usa a mesma frase "servidor" (não é queda). | ALTO | `pt-light-get-500` | Distinguir "falhou a leitura" de "sem grupo": no erro, mostrar só o alerta + botão "Tentar de novo" (não os formulários). |
| 17 | Sair | Um toque, sem confirmação, sem aviso e sem penalidade (regra §3.4 cumprida). Cai no formulário de criar/entrar. | — | (scratchpad `sair`) | — |
| 18 | Sair com 500 | Grupo permanece + alerta âmbar; correto. | — | `pt-light-sair-500` | — |
| 19 | Check-in | Inerte até cumprir a própria meta (com a frase de explicação, sem cobrança); com meta cumprida vira `primary`, o toque marca "apareceu hoje" e o botão some. Foco cai em `body` depois (ver #24). | — | `pt-light-g2-checkin` | — |
| 20 | Check-in 429 | Alerta âmbar genérico, botão continua ativo, grupo intacto. OK. | — | `pt-light-checkin-429` | — |
| 21 | Meta batida | Uma frase em `role=status` + 🌿; sem confete, sem dourado. O 🌿 tem contraste 3,52:1 sobre branco, mas é decorativo (`aria-hidden`). | — | `pt-light-g4-cheio-meta` | — |
| 22 | Offline ao abrir | O `OfflineSeal` "SEM SINAL" **cobre o título "Hall"/"Arena"** da barra de cima (sobreposição). O painel vira o estado #16 (mesma falha de "sem grupo" para quem tem grupo). | MÉDIO | `pt-light-offline-open` | Descer o selo (`topOffset`) ou encolher o título em áreas; corrigir #16 resolve o painel. |
| 23 | Offline agindo (grupo carregado, corta a rede, toca em "Avisar") | Alerta genérico "Não deu certo agora. Tente de novo."; grupo preservado; selo visível. Aceitável; a frase não diz que é a rede. | BAIXO | (scratchpad `offline-act`) | Opcional: copy "Sem conexão. Nada mudou." (já no plano §5). |
| 24 | Foco/teclado | (a) A folha tem `role=dialog aria-modal=true` mas **não prende o foco nem torna o fundo `inert`**: Tab sai da folha (Sair do grupo → body → "Pular para o conteúdo" → "Voltar ao mapa" → lotes do Hall → volta em Fechar). (b) Depois de sair/fazer check-in por teclado o foco vai a `body` (o botão some) e o Escape também deixa o foco em `body` em vez de voltar ao lote. (c) O anel de foco do "Fechar" é um quadrado de 36 px colado ao topo. Escape, ×, toque no fundo e o voltar do histórico fecham SÓ a folha (ficam no Hall). | ALTO | `en-dark-kbd-foco` | Prender Tab/inert no fundo em `AreaSheet` (é chrome compartilhado) e devolver o foco ao lote ao fechar; mover o foco para o alerta/título depois de ação que remove o botão. |
| 25 | Alvo de toque | Único < 44 px em toda a folha: **"Fechar ×" 36×36**. Botões, campos, copiar (44), voltar (44) e lotes ok. | MÉDIO | `pt-light-g4` (× no canto) | `width/height: 44` no `[data-area-sheet-close]` (mantendo o glifo em 20 px). |
| 26 | Contraste (pixel) | Menor razão medida em texto de folha: 5,09 (claro, texto de botão inerte) e 6,3 (escuro); alerta âmbar, "· você", rótulos: todos ≥ 5,09 nos 4 temas/idiomas. | — | `pt-light-vazio`, `en-dark-g4` | — |
| 27 | Ícone em box | Nenhum ícone em molde de fundo/borda dentro da folha (auditoria de DOM em 100 % dos estados). O anel do voltar é a exceção D1 documentada. | — | — | — |
| 28 | PT/EN | Nenhuma string só em PT em EN nem o inverso (varredura do texto da folha em todos os estados; "Grupo" achado em EN é o nome do mock). Ícones têm `aria-hidden`. | — | — | — |
| 29 | Movimento reduzido | Sem animação de entrada; spinner parado; nada a reduzir além disso. OK. | — | — | — |
| 30 | Rota Arena → Guilda | Mesma folha e mesmo comportamento; título "Guilda" (Arena) × "Salão da Guilda" (Hall); mesmo NPC (Marla, "grupo pequeno" — verdadeiro hoje, o plano §5 já lista que fica falso com 12). | — | `pt-light-arena-g2` | — |
| 31 | Folha vs. tela | A folha termina 40 px acima do fim da tela (moldura de 8 px + faixa vazia embaixo): perde-se área útil justamente onde o conteúdo já rola. | BAIXO | `pt-light-g4` | Chrome compartilhado; só mencionar ao design. |
| 32 | Cobrança / número por pessoa | Nenhuma fala culpa quem faltou; "ainda não hoje" é o binário aceito pelo `PLANO-COOP.md` §3.3 (nome+veio/não veio até 4). Nenhum número por membro. | — | `pt-light-g4` | — |

## Contagem por severidade

- FATAL: 0
- ALTO: 2 (#16 leitura falha vira "sem grupo" sem retry; #24 foco não preso + fundo não inert)
- MÉDIO: 6 (#4, #10, #14, #15, #22, #25)
- BAIXO: 5 (#7, #11, #12, #23, #31)

## O que não foi verificado e por quê

- **Servidor real**: tudo é mock de `page.route`; a copy de erros reais (503 `try again`, 400 `invalid name`) segue o `community.js` mas não passou pelo KV.
- **Autenticação real**: `authHeaders()` sem Firebase configurado; nenhum 401/403/410 testado.
- **Leitor de tela** (TalkBack/VoiceOver): só checei atributos (`aria-hidden`, `role`, `aria-label`) — anúncio real de `role=status`/`role=alert` não foi ouvido.
- **APK/WebView e desktop**: só Chromium desktop com viewport de celular; safe-area e teclado virtual não testados.
- **Fuso/virada de semana** do "apareceu hoje": mock estático.
- **Convite por link, gestos, Bosque, Feira, 12 membros**: são `PLANO-GUILDA.md`, não existem hoje.
- Estados reproduzidos só em pt-claro/en-escuro para a Arena; Hall cobre os 4 temas/idiomas.
