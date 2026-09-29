# L1 — Revisão adversarial do papel de admin/GM (guarda de sustento e segurança)

Data: 29/09/2026 · Branch `ccr-1aa8b7db-xk45mh` · Só leitura: nenhum código de produto foi alterado.
Portões rodados: `npx tsc -p tsconfig.server.json --noEmit` saiu com 0; `npx vitest run functions/api/admin src/utils/gmTools src/utils/corvoPet src/components/GmPanel src/utils/adminCorvo` deu 7 arquivos e 68 testes verdes.

## Veredito

**FATAL 0 · ALTO 0 · MÉDIO 3 · BAIXO 4** (e 1 informativo).
Ninguém vira admin sem um ID token Firebase verificado (`email_verified === true`) com e-mail que esteja em `ADMIN_EMAILS`, e o token tem de ser do próprio save. Nenhuma rota concede privilégio ou moeda real por `saveId`, corpo, cabeçalho ou campo do save. O risco que sobra é de **sustento**: o admin pode tomar uma fatia grande do orçamento global de sprite. Não há furo de autorização.

## Mutações (cópia em /tmp/mut, suíte `functions/api/admin*`)

| # | Mutação | Resultado |
|---|---|---|
| M1 | tirar `email_verified !== true` de `verifyIdToken` | morta (1 falha) |
| M2 | tirar o vínculo `emailToSaveId(claims.email) !== saveId` de `verifiedAdmin` | morta (2) |
| M3 | tirar `if (!projectId)` de `verifiedAdmin` | sobrevive; **equivalente**: `verifyIdToken(_, undefined)` já devolve null |
| M4 | tirar `.map(normalizeEmail)` de `parseAdminEmails` | morta (2) |
| M5 | `save.js` GET chama `verifiedAdmin(env, request)` sem saveId | sobrevive; equivalente hoje porque `authorizeSaveAccess` roda antes (ver B-1) |
| M6 | `generate-sprite.js`: admin passa em QUALQUER recusa de `requirePaidTier`, não só em 402 | sobrevive (B-1) |
| M7 | multiplicador ×10 vale para todos os buckets | morta |
| M8 | `spend` do admin debita | morta |
| M9 | teto global × `adminMul` | morta |
| M10 | `entitlements.js` GET sem saveId no `verifiedAdmin` | sobrevive; equivalente (mesmo motivo do M5) |
| M11 | `logAdminSession` passa a gravar e-mail | **sobrevive**: nada trava a ausência de PII (B-1) |
| M12 | `adminPublicView` injeta campo extra | sobrevive; sem impacto |

## Cenários exigidos

1. **Escalada**: e-mail com maiúsculas ou espaços casa (é o desejado). Ponto e `+alias` NÃO casam, e com razão: são outra conta no Firebase. `ADMIN_EMAILS` ausente, vazia ou só com separadores não dá admin a ninguém. Tokens com aud/iss/exp/iat/alg errados, assinatura adulterada, kid desconhecido ou `email_verified:false` são recusados (M1 e os testes de `admin.test.js`). `admin:true` no corpo ou `X-Admin` no cabeçalho não fazem nada (`admin.abuse.test.js`). Token do dono com saveId de outro é recusado (M2). No modo aberto (sem `FIREBASE_PROJECT_ID`) ninguém é admin. As rotas que chamam só `authorizeSaveAccess` (comunidade, guilda, torneio, conta, métricas) não conhecem admin (teste varre as fontes). No modo aberto elas seguem fail-open, como já eram; isso não é novo nem é do admin.
2. **saveId computável**: o e-mail do dono é público de propósito, como contato em `dist/privacidade.html`, `dist/termos.html`, `dist/index.html` e em dois docs. Portanto o saveId dele é calculável por qualquer pessoa. Conferi `verifiedAdmin`, `save.js`, `entitlements.js`, `_aiGuard.js` › `guardAiRequest` e `generate-sprite.js`: nenhum decide admin por saveId ou por dado do cliente. O único insumo é o Bearer token.
3. **Efeitos e custo**: ver M-1. `ent:` nunca recebe `admin` nem `tier:'paid'` (testes de GET, `spend` e `rebirth-reset`). O `credits: 999999` só existe na resposta: `save.js` › `SERVER_OWNED_FIELDS` o remove no POST, então ele não vai para o KV, nem para a exportação (que lê o KV), nem para o `spend`, que no caso do admin não debita e não escreve `spend:`. "Outra conta com o mesmo e-mail em outro aparelho" é a MESMA conta (saveId = hash do e-mail), então lá também é admin. O caso real é a revogação, tratado em M-2.
4. **Cliente**: `adminFlag.ts` guarda a flag só em memória e aceita só o booleano literal `true`. Quem edita localStorage ou `soulmonMeta.creature='corvo'` ganha apenas o próprio save local: o `GameStateContext` hidrata `creature` e o app desenha o corvo. Nenhuma rota lê `soulmonMeta`, `accountTier` do save, `gamePoints`, `emblems` ou `ownedBackgrounds` para conceder algo (grep em `community.js`, `guild.js`, `account.js`, `metrics.js`, `save.js`). O perfil público manda `stage`/`petName`/`attrs`, nunca o sprite, então o desenho do corvo não vaza para outros jogadores. O servidor não sanitiza `creature`, e não precisa: ninguém o lê.
5. **gmTools**: todos os updaters são puros, idempotentes (com exceção declarada de `gmAddPerfectDays`) e tocam só o save. Emblemas 999.999 compram só `TOURNAMENT_ITEMS` cosméticos. Os Emblemas "reais" da Guilda vêm de `guild.js` › `guildClaim` e não leem o saldo do cliente. Não entra vantagem nenhuma. Ressalvas em M-3 e B-3.
6. **Privacidade**: nenhum commit da branch (`git log -p origin/main..HEAD -S"@gmail.com"`) introduz e-mail. `ADMIN_EMAILS` não tem valor no repo (os testes usam `example.test`). Na captura `01-gm-pt-claro.png` não aparece e-mail. `logAdminSession` grava só `{event, route}`, mas não há teste travando isso (M11).
7. **Renomeio**: `_branchLegacy.js` › `legacyFormIdOf` deriva o id antigo SÓ de um `formId` já validado por `VALID_FORM_ID`. A leitura de `cacheKey(id, antigo)` acontece depois de `authorizeSaveAccess`, então não abre IDOR. A escrita usa sempre a chave nova. `formUsed` soma antigo + novo e `foldLegacyForm` apaga o antigo na mesma escrita: sem cobrança dupla e sem zerar o teto. `migrateBranchIds` roda só no cliente, sobre o save do próprio jogador, e não escreve chave KV.

## Achados

### M-1 (MÉDIO) — o ×10 do admin consegue consumir 65% do orçamento global mensal de sprite
`functions/api/_aiGuard.js` › `guardAiRequest` (`adminMul`) + `AI_LIMITS.sprite`.
Os limites do admin viram 60/dia, 30 por forma e 260 vitalício. O vitalício zera UMA vez em `_entitlements.js` › `resetSpriteLifetimeOnRebirth`, e a prova disso é `state.rebirth`, que o próprio cliente grava (B-4). Com o GM, o admin chega a ultra em um toque, então o teto vitalício efetivo é **520 imagens**.
**Pior caso de custo**: 520 × R$ 0,101 = **R$ 52,52**, uma vez na vida da conta. A 60/dia isso cabe em 9 dias, portanto num mês só. A fatura total NÃO cresce: o `globalMonth` de 800 continua valendo para o admin (M9 morta), o que dá um teto de 800 × R$ 0,101 = **R$ 80,80/mês** para o app inteiro. O dano é outro: esses 520 saem dos mesmos 800 de todos os pagantes. Um loop de retentativa do cliente, ou chamadas sem `formId` (que pulam o dedupe e o teto por forma), deixam os pagantes com 503 `ai-monthly-budget-reached` pelo resto do mês. A lógica é a mesma do caso Office Space: o custo aparece em quem paga, não no painel.
**Correção mínima**: dar ao admin um sub-teto mensal próprio, por exemplo `ADMIN_SPRITE_MONTH = 100` numa chave `ai:sprite:@admin:<mês>`, ou aplicar o multiplicador só ao diário e ao por forma, deixando o vitalício em ×1.

### M-2 (MÉDIO) — o painel diz "muda apenas o save deste aparelho", mas o save vai para a nuvem e sobrevive à revogação
`src/components/GmPanel.tsx` (texto do cabeçalho) + `GameStateContext` (cloud save).
Todo `setGameState` do GM é sincronizado para todos os aparelhos da conta. Se o e-mail sair de `ADMIN_EMAILS`, o corvo (`soulmonMeta.creature`), os 999.999 Bits e Emblemas, os cenários, as mobílias, as missões e os dias completos continuam no save. Só `credits` e `accountTier` voltam à verdade no próximo `fetchEntitlement`. O único prejudicado é a própria conta, mas o texto está errado.
**Correção mínima**: trocar o texto para "muda o save da sua conta (todos os aparelhos) e não é desfeito ao sair do papel". Opcionalmente, na abertura com `admin:false`, remover `creature:'corvo'`.

### M-3 (MÉDIO) — a forma e os atributos fabricados pelo GM aparecem para outros jogadores
`functions/api/community.js` › ação `profile` (`body.stage`, `unlockedStages`, `attrs`) + `src/utils/gmTools.ts` › `gmGoToForm`.
O perfil público sempre confiou no cliente; isso já existia. O GM transforma essa confiança em um toque: o dono aparece como ultra no PvP e no ranking, e o oponente perde partidas (e Emblemas locais) contra uma forma que não foi ganha. Não é moeda real, mas é integridade competitiva visível para terceiros.
**Correção mínima**: deixar de publicar o perfil PvP quando `isAdmin`, ou fazer `community.js` limitar `stage` pelo vitalício do servidor. O mínimo absoluto é declarar a exceção no `00-fatos.md`.

### B-1 (BAIXO) — lacunas de teste
Os mutantes M5, M6, M10 e M11 sobrevivem. Faltam testes para:
- o vínculo por saveId no `verifiedAdmin` de `save.js` e `entitlements.js` como defesa em profundidade (hoje só `authorizeSaveAccess` segura);
- `tier.status === 402` em `generate-sprite.js` (o admin não deve furar um 503 de tier indeterminável);
- a ausência de PII em `logAdminSession`.

Correção: um teste por item em `admin.abuse.test.js`. No caso do log, espiar `console.log` e reprovar `@` e `[0-9a-f]{32}`.

### B-2 (BAIXO) — o chat do admin continua na cota demo (30/dia)
`_aiGuard.js` › `perAccountByTier[ent.tier]`: o `ent` real é `demo` e o `adminMul` só vale para sprite. A interface mostra "paid", mas o chat usa a cota demo. É uma incoerência, não um risco. Não mexa sem decisão do dono.

### B-3 (BAIXO) — `gmGoToForm` rebaixa HP e energia ao descer de forma
`src/utils/gmTools.ts` › `gmGoToForm`: `healthPoints: Math.min(prev.healthPoints, maxHP)`. HP não é saldo, então a regra "nunca reduz saldo" se mantém. Mesmo assim, o cabeçalho diz "nunca REDUZEM um saldo/contador" e o HP é reduzido. O mínimo é ajustar o comentário.

### B-4 (BAIXO, anterior ao admin e amplificado por ele) — `rebirth-reset` confia em `state.rebirth` gravado pelo cliente
`functions/api/entitlements.js` › `rebirth-reset`. Qualquer conta paga pode forjar o campo e dobrar o vitalício uma vez (26 → 52). No admin, isso vira 260 → 520. Esse é o insumo do pior caso de M-1.
**Correção mínima**: exigir `aiLifetime.sprite` perto do teto e o estágio ultra registrado no servidor, ou aceitar o risco como declarado.

### I-1 (informativo)
O e-mail do dono é público por decisão (contato LGPD). O desenho não depende de o saveId ser segredo, e isso está correto.
