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
- `/api/generate-sprite`: admin passa do `requirePaidTier`; tetos por conta (dia, vitalício, por
  forma) × `ADMIN_AI_CAP_MULTIPLIER` (10). Teto global mensal (`globalMonth`) inalterado.

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
