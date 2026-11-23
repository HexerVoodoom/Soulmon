# Revisão de segurança, rodada 1 (11/11/2026)

Escopo: o que entrou ou mudou em 10 e 11/11/2026 (de `b1fcf4d8f`/beta9 até `b10cc131e`). Leitura do código, `npm audit` sobre o
`package-lock.json` e varredura de segredos no diff. Nada foi testado contra produção.

## Corrigidos em PR (ALTO)

| # | Achado | PR |
|---|---|---|
| A1 | `guildDonate`: o registro da Casa guarda só o último dia e o `dayKey` vem do cliente (±1 dia). Alternar 10/11 ↔ 11/11 doava sem fim: tesouro e seiva sem teto, Buffs do clã de graça (`_casa.js:105`). | #785 |
| A2 | `sparOpponents` no teto LEVE (120/min/IP) lendo até 120 perfis + 120 saves inteiros por chamada, sem cache: ~30 mil leituras de KV/min por IP (`community.js:130`, `:1160`). | #786 |
| A3 | Revisão de sprite: (a) `formId` sem `sprite:img` + `prompt` do corpo + motivo "recorte" = geração paga com prompt livre, fora do `requirePaidTier`/`_aiGuard`; (b) retomada de `REGENERANDO` sem teto: cortar a conexão e chamar `continue` a cada 10 min gerava sem fim (`_spriteReview.js:613-620`). | #787 |

## Médios (não corrigidos aqui)

- **M1. `prompt` do cliente ainda vira prompt de regeneração** quando o registro existe mas não tem `prompt` (sprites anteriores a 10/11). Fica limitado a 1/dia/conta e 25/dia no servidor (com o #787), mas o texto é livre (até 12000 caracteres) e a imagem vira sprite público. Sugestão: montar o prompt da reserva NO SERVIDOR a partir de elemento/estágio, ou mandar esses casos para `precisa-manual`.
- **M2. `spriteUrl` do report aceita QUALQUER token de blob** (`tokenOfSpriteUrl`, `_spriteReview.js:109`), inclusive o de outro jogador (os tokens aparecem nos perfis públicos). O sprite alheio vai para o Claude e, no caminho "recortar" sem raw, vira o sprite da conta de quem pediu. Sugestão: exigir que o token seja o do `registro.image` (ou `registro.prev`) da própria conta.
- **M3. DoS dos tetos globais da revisão.** `evalsPerDay: 150` e `regenPerDay: 25` são globais; ~5 contas gastam o dia inteiro (30 reports/conta/dia) e ninguém mais é atendido. Sugestão: teto de avaliação por conta (ex.: 5/dia) além do global.
- **M4. Teto de Honra e tickets do Treino por "dia do jogador" de fuso livre** (`_treino.js:59`, `community.js:1196-1256`): `zone`/`off` vêm de cada requisição; com fusos nos extremos (±14 h) há até 2 dias válidos ao mesmo tempo, então o teto de 20 Honra e os 3 extras dobram. Atenuante: a Honra é creditada pelo app (o servidor só informa), então o teto já é consultivo. Sugestão: fixar o fuso da conta (como `lembrarTz`/`gtz:` nos presentes) e ler dele.
- **M5. Feira de verdade com `dayKey` ±1** (`guild.js` `guildRaidHit` → `abrirFeiraLoja`; `save.js` `hexFair`): o sorteio de 8% roda por dia informado, então dá para tentar até 3 dias por dia real (~22%) e comprar das 3 ofertas. Mesmo padrão que o TODO de `guild.js:681` já reconhece para os prédios do clã. Sugestão: dia do servidor para sorteio e compra, como nos prédios.
- **M6. Contadores em KV sem compare-and-set** (`takeDaily`, `spendSparMatch`, `buySparTicket`, `grantSparHonor`, `comprarBuff`, `doarBits`): rajada paralela por colos diferentes passa do teto. O `withDuelLock` serializa só dentro do isolate. Conhecido e documentado; só um Durable Object fecha.

## Baixos / informativos

- **B1.** `sparBuyTicket` não cobra nada no servidor (o app debita os 30 Bits). Com o teto de 3/dia e sem Honra, o ganho é só jogar mais. Coerente com o modelo atual (Bits moram no save).
- **B2.** `guildFeiraLojaBuy` só marca a compra; o app debita o preço. Mesmo modelo de confiança da loja.
- **B3.** `feiraHexOnServer` (e `forgeOnServer`) baixam `paidLeft` mesmo pagando com Bits ganhos, o que converte Bit pago em ganho (`_feiraLoja.js:289`). Herdado da forja; vale revisar a regra "pago primeiro".
- **B4.** E-mail à equipe (`_reviewTeam.js`): só texto via JSON da Resend, assunto sem quebra de linha, conta resumida a 8 caracteres, sem e-mail do jogador. Sem injeção de cabeçalho/HTML. A nota do jogador vai crua no corpo (texto, 300 caracteres, controles removidos). OK.
- **B5.** `ANTHROPIC_API_KEY` só é lida em `_spriteReview.js` (`callClaude`), nunca logada; logs da revisão só levam `err.message`. OK.
- **B6.** Painel `/gm/reviews` monta tudo com `textContent`; `gm-reviews` exige admin verificado. OK.
- **B7.** Nome do especial: só letras/números/espaço, 20 caracteres, filtro de palavrão e de contato, cooldown no servidor. OK.
- **B8.** `librarySeen`/`libraryForms` saneados com tetos (500 e 500×8) e allowlist de sprite. OK.
- **B9.** Android: só `READ_STEPS` (sem escrita, sem segundo plano, sem histórico); `HealthRationaleActivity` exportada como o Health Connect exige, só abre a política (URL fixa); o alias de uso exige `START_VIEW_PERMISSION_USAGE`; `<queries>` só do pacote do Health Connect. Chaves novas do widget (`starvingAtMs`, `maxEnergyPoints`, `petSleeping`, `vpetBg` com allowlist) vêm só da própria WebView. `privacidade.html` (PT e EN) descreve a leitura de passos do dia pelo Health Connect.
- **B10.** Segredos: nenhum segredo novo no diff. Aparece a chave web do Firebase (`AIza...`) nas páginas `/gm`, que é pública por desenho; confirmar no Console que ela tem restrição de API/referenciador.
- **B11.** CORS `*` nas rotas novas: aceitável porque a autenticação é por `Authorization: Bearer` (sem cookie).

## `npm audit` (11/11/2026)

- Produção (`--omit=dev`): 5 altos, todos pela cadeia `firebase` → `@firebase/firestore` → `@grpc/grpc-js`. O grpc-js é do lado Node; o app no navegador/WebView usa WebChannel. Atualizar `firebase` quando sair a versão corrigida, sem urgência.
- Desenvolvimento: 1 crítico (`tar`, transitivo) e altos em `vite`, `wrangler`/`miniflare`, `rollup`, `sharp`, `postcss`, `picomatch` etc. São ferramentas de build/teste local; risco real só em máquina de dev/CI. Rodar `npm audit fix` numa rodada própria, com o build e os testes.

## O que NÃO foi verificado

- Nada contra produção (sem chamadas reais, sem teste de carga, sem confirmar se o Pages corta o Worker ao desconectar o cliente: o A3(b) foi modelado, não reproduzido).
- Data Safety do Play Console (fora do repo).
- `_equipment.js` e `_profile.js` não mudaram nesse intervalo; não foram relidos inteiros.
- O lado do app que debita Bits/Honra (`src/`) só foi lido por cima.
