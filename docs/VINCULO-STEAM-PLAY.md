# Vínculo Steam ↔ Google/Play — desenho (NÃO implementado)

Origem: checklist do dono `docs/AJUSTES-NAVEGACAO-2026-10-01.md`, **A3**.
Decisão do dono (01/10/2026): *"login Google amarrado à conta Play agora; vínculo
Steam só documentado para depois"*. Este arquivo é **plano**: nada aqui existe
em código.

## Hoje — a identidade única é a conta Google

- O portão do onboarding (`IDENTITY_STEP` em `src/components/SoulmonOnboarding.tsx`)
  abre com **"Continue with Google"** como porta primária (Firebase Auth,
  projeto `soulmon-app`, `entrarComGoogle` em `src/utils/auth.ts`).
- O save é endereçado por `saveId = SHA-256("soulmon:" + e-mail)`
  (`emailToSaveId`, três implementações travadas por
  `functions/api/saveId.parity.test.js`). Com Google, o e-mail é o da conta
  Google — a mesma conta que o aparelho Android usa na Play Store.
- A compra na Play leva `obfuscatedAccountId = saveId` (`purchase()` em
  `src/utils/playBilling.ts`); o resgate só vale para o mesmo `saveId`
  (`isPlayPurchaseBoundTo`, `functions/api/_billing.js`). Ou seja: **compra Play ⇄ save ⇄ conta Google** já
  formam uma identidade só, desde que o login seja com a mesma conta Google do
  aparelho.
- Ressalva honesta: a porta **"New User" (e-mail + senha)** continua existindo.
  Ela leva ao MESMO save quando o e-mail é o mesmo Gmail, mas permite uma
  identidade sem Google. Fechar essa porta é decisão do dono (ela é a saída
  quando o popup do Google é bloqueado) — está listada como pendência.

## Depois — como o Steam entra (desenho)

Princípio: **o Steam não cria identidade nova; ele se PENDURA numa conta
Google já existente.** O dono do save continua sendo o `uid` do Firebase.

1. **Login no desktop (Electron, `desktop/`)**: o app abre a janela do app web
   (`auth-preload.js`), como hoje. A pessoa entra com Google primeiro.
2. **"Vincular Steam"** (Configurações → Conta): abre o **Steam OpenID 2.0**
   (`https://steamcommunity.com/openid/login`, `openid.mode=checkid_setup`,
   `return_to` = endpoint nosso). O Steam devolve o `claimed_id` com o
   **SteamID64**.
3. **Backend** (nova Pages Function, ex.: `functions/api/steam-link.js`):
   - exige `Authorization: Bearer <idToken Firebase>` e valida com o
     `verifyIdToken` que já existe em `functions/api/_auth.js` → obtém o `uid`;
   - valida a resposta OpenID **no servidor** (`openid.mode=check_authentication`
     de volta ao Steam — nunca confiar no `claimed_id` vindo do cliente);
   - grava no KV **duas chaves**: `steam:<steamId64> → uid` e
     `uidsteam:<uid> → steamId64`. Recusa se o SteamID já estiver ligado a outro
     `uid` (uma conta Steam = uma conta Google), e devolve 409 com mensagem.
4. **Entrar pelo Steam depois de vinculado**: o desktop faz o OpenID, o backend
   acha `steam:<id> → uid` e emite um **Firebase custom token**
   (`createCustomToken` via conta de serviço, a mesma `FIREBASE_SERVICE_ACCOUNT`
   do push) → o cliente faz `signInWithCustomToken` e cai no MESMO `uid` / e-mail
   / `saveId`. Sem vínculo, o Steam não abre conta: pede para entrar com Google
   antes.
5. **Compras Steam**: `functions/api/_billing.js` já tem a metade de cobrança
   (MicroTxn/DLC e `verifySteamOwnership` para o desbloqueio por posse do
   jogo). O que falta é a ponte: o recibo conferido no servidor concede o mesmo
   `entitlement` em `ent:<saveId>` — a regra "um comprovante vale para uma conta
   só" (`claimOrder`) vale igual.
6. **Desvincular**: apaga as duas chaves; o save não muda (ele é do `uid`).

## O que precisa existir antes (fora do código)

- Conta Steamworks + App ID; Web API key no `wrangler secret`.
- Decidir se o `saveId` passa a derivar do `uid` em vez do e-mail (hoje é do
  e-mail — custom token traz o mesmo e-mail, então o desenho acima funciona sem
  essa troca).
- Revisão de segurança do endpoint de vínculo (CSRF no `return_to`, replay do
  `openid.response_nonce`).
