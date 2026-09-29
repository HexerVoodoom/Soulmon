# Admin/GM do dono — notas de implementação do backend (29/09/2026)

## Quem é admin
`functions/api/_admin.js` › `verifiedAdmin(env, request, saveId?)` → `{ admin: boolean }`.
Verdadeiro **só** quando: `FIREBASE_PROJECT_ID` existe **e** `ADMIN_EMAILS` (secret) tem ao
menos um e-mail **e** o `Authorization: Bearer` é um ID token Firebase aceito por
`verifyIdToken` (assinatura, `aud`, `iss`, `exp`, `iat`, `email_verified === true`) **e** o
e-mail normalizado (`normalizeEmail`, a mesma régua do `emailToSaveId`) está na lista **e**,
quando a rota passa `saveId`, o token é do dono daquele save. Corpo e outros cabeçalhos
nunca são lidos.

## Contrato para o front — `GET /api/entitlements?id=<saveId>`
```jsonc
// admin
{ "admin": true,  "tier": "paid", "credits": 999999, "adsLeft": 3, "provider"?: "...", "adsEnabled": false }
// qualquer outra conta (inclusive modo aberto)
{ "admin": false, "tier": "demo" | "paid", "credits": <int>, "adsLeft": <int>, "provider"?: "play"|"steam"|"courtesy", "adsEnabled": <bool> }
```
- `admin` é SEMPRE booleano nesta rota e nas respostas de `POST ?action=spend|rebirth-reset|ad`.
- `credits` do admin é `ADMIN_CREDITS_DISPLAY` (999999): **exibição**, para o cliente não recusar
  localmente; não é saldo e não existe em `ent:`. A UI pode mostrar "∞"/"GM" quando `admin`.
- `POST ?action=spend` do admin: `200 { ok: true, admin: true, tier: 'paid', credits: 999999, ... }`
  sem debitar e sem gravar `ent:`/`spend:`. Valor inválido (≤0/não inteiro) segue 402.
- `GET /api/save`: `state.accountTier = 'paid'` e `state.credits = 999999` para o admin (só na
  resposta; o que o cliente grava continua passando por `SERVER_OWNED_FIELDS`).
- `/api/generate-sprite`: admin passa do `requirePaidTier` (só em 402; 503 de tier indeterminável
  continua recusando); tetos por conta (dia, vitalício, por forma) × `ADMIN_AI_CAP_MULTIPLIER` (3,
  era 10) **e** sub-teto mensal próprio `ADMIN_SPRITE_MONTHLY_CAP` (40). Teto global mensal
  (`globalMonth`) inalterado.
- Chat do admin usa a cota paga (`perAccountByTier.paid`, 120/dia), sem multiplicador (B-2).

## Custo do admin — novo pior caso (correção do M-1 do L1)
Contador KV `ai:sprite:@admin:<AAAA-MM UTC>` (TTL de mês, sem saveId nem e-mail), debitado junto do
global e devolvido pelo mesmo `release`. Estouro devolve 503 `ai-monthly-budget-reached`, idêntico ao
do teto global (não revela o papel). O admin nunca consome mais de 40 imagens/mês do `globalMonth`
(800): pior caso **40 x R$ 0,101 = ~R$ 4,04/mês** (5% do global; antes 520 x R$ 0,101 = R$ 52,52
vitalício, ~65% do global). Tetos por conta agora: 18/dia, 9 por forma, 78 vitalício (156 com
rebirth-reset forjado, B-4) — todos subordinados ao sub-teto mensal. O corvinho (sem geração) já cobre o
pet do dono.

## Dívidas registradas (L1: M-3, B-3, B-4) — sem mudança de comportamento
- **M-3**: `community.js` ação `profile` confia em `stage`/`unlockedStages`/`attrs` do cliente; o GM
  (`gmGoToForm`) leva isso a um toque e o dono aparece em forma não ganha no PvP/ranking. Correção
  sugerida: não publicar perfil PvP quando `isAdmin`, ou limitar `stage` pelo vitalício do servidor.
- **B-3**: `gmGoToForm` reduz HP/energia ao descer de forma (`Math.min`); HP não é saldo, mas o cabeçalho
  diz "nunca reduzem". Correção: ajustar o comentário.
- **B-4**: `entitlements.js` `rebirth-reset` confia em `state.rebirth` gravado pelo cliente; conta paga
  pode forjar e dobrar o vitalício uma vez. Correção: exigir `aiLifetime.sprite` perto do teto e ultra
  registrado no servidor, ou aceitar o risco. Ver STATUS §4.

## O que NÃO muda
`ent:<saveId>` nunca recebe `admin` nem tier/créditos de admin. Nenhuma rota nova; nenhum
parâmetro `saveId` arbitrário; token do admin sobre outro saveId → 403 como qualquer um.
`community.js`/`guild.js` não conhecem o admin. A cortesia (`ENTITLEMENTS_ADMIN_KEY`) fica igual.

## Auditoria
Log estruturado `{"event":"admin_session","route":...}` sem e-mail nem saveId, no `GET` de
entitlements e no `spend`. **Não** virou evento de telemetria (`/api/metrics`): os eventos de lá
são enviados pelo CLIENTE, então um contador de admin seria forjável/omissível por quem controla
o cliente e exigiria o esquema duplicado em `src/utils/telemetry.ts` sem ganho de prova.

## Mutação (cópia em /tmp/mut, 21 mutantes)
18 mortos. Sobreviventes são equivalentes: os guardas de `projectId` e de lista vazia em
`verifiedAdmin` (redundantes com `verifyIdToken`/`isAdminEmail`, ficam como defesa em
profundidade) e `porTier * adminMul` (sprite não tem teto por tier).

## Depende do dono
`npx wrangler secret put ADMIN_EMAILS` na raiz (produção é Worker `soulmon`).
