# Plano — tela de identidade antes da escolha free/full

> **Status: IMPLEMENTADO em 07/09/2026 — e este documento e o registro do que
> foi ENTREGUE, nao mais a proposta.** O que a secao 3 propunha (identidade
> DEPOIS do consentimento) foi **recusado pelo dono** e o desenho mudou; as
> secoes 3 e 4 abaixo ficam preservadas como historico do raciocinio, e a
> secao 3-bis descreve o que realmente esta no ar. Decisao de 07/09/2026:
> **e-mail obrigatorio para todos**.

## 1. Por que isto existe

Nao e polimento de UX. Ha um defeito de DINHEIRO no fluxo de hoje.

O passo 0 do `SoulmonOnboarding` oferece "Comecar agora — e gratis" e "Quero o
completo — R$ 29,90". O segundo chama `handleUnlockFull`, que compra assim:

```js
plugin.purchase({ productId, saveId: readLocal(STORAGE_KEYS.SAVE_ID) ?? undefined })
```

O `saveId` **so existe derivado do e-mail** (`emailToSaveId` = SHA-256 de
`soulmon:<email>`, `src/utils/cloudSave.ts`). Nao ha id anonimo nem por
aparelho. E o e-mail so e pedido no ULTIMO passo do onboarding.

> ### ⚠️ CORRECAO de 07/09/2026 — o defeito e PIOR do que este documento dizia
>
> Este texto afirmava que a compra saia com `saveId: undefined`. **Errado**, e
> descoberto ao rodar o app de verdade: `App.tsx` gera um `saveId` **UUID
> aleatorio** na primeira abertura (`if (!id) { id = crypto.randomUUID(); ... }`).
>
> Entao a compra nao vai "sem vinculo" — vai amarrada a um id DESCARTAVEL. Ao
> entrar com e-mail, o saveId e SUBSTITUIDO pelo SHA-256 do endereco, e
> `isPlayPurchaseBoundTo` compara os dois por igualdade:
>
> ```js
> if (bound) return !!saveId && String(bound) === String(saveId);
> ```
>
> Como o campo vem PREENCHIDO, cai no ramo da igualdade e a comparacao falha —
> ou seja, **a compra e recusada mesmo com `PLAY_REQUIRE_ACCOUNT_BINDING`
> desligado**. O defeito e ATUAL, nao futuro, e a flag nao o protege.
>
> Consequencia pratica no codigo: a guarda em `handleUnlockFull` olha o E-MAIL
> comprovado, e nao a presenca do saveId — o saveId sempre existe, entao uma
> guarda por presenca nunca dispararia.

Logo: usuario novo que toca em "Quero o completo" compra com um `saveId`
descartavel, e o recibo fica amarrado a um id que a conta abandona no login.

O servidor ja tem a trava correspondente (`functions/api/_billing.js`):

```js
const bound = purchase?.obfuscatedExternalAccountId;
...
return env.PLAY_REQUIRE_ACCOUNT_BINDING !== 'true';
```

No dia em que `PLAY_REQUIRE_ACCOUNT_BINDING` for ligado — que e o plano
registrado no handoff, secao 2.6 — **toda compra feita por aquele botao e
recusada**. A pessoa paga e nao recebe. Hoje nao aparece porque a trava esta
desligada, do mesmo jeito que `denyUnlessOwner` ficou inerte ate 07/09/2026.

**Segundo buraco, mesma origem:** nao existe caminho de "ja tenho conta". O
login mora em Configuracoes, alcancavel so DEPOIS do onboarding. Quem reinstala
o app ou troca de aparelho e obrigado a refazer o onboarding inteiro para
chegar ao campo de e-mail.

## 2. O que ja esta pronto e nao precisa ser escrito

O retorno do link ja faz a coisa certa (`src/App.tsx`, efeito de
`completeLoginFromLink`):

1. prova o e-mail;
2. deriva o `saveId`;
3. `cloudLoad(id)` — **se ja existe save, `adoptCloudSave` traz o save de
   volta** (o caso "ja tenho conta" funciona ponta a ponta);
4. se nao existe, grava `SAVE_ID` + `USER_EMAIL` locais (conta nova);
5. `window.location.reload()`.

E `App.tsx` so mostra o onboarding quando `!hasCompletedOnboarding`. Entao,
depois do login: quem tinha save cai direto no jogo; quem nao tinha cai no
onboarding. **A maquina de risco ja existe e ja tem teste.** O que falta e so
um lugar na UI, antes do onboarding, para digitar o e-mail.

## 3. A ordem proposta

Hoje: `0 (free/full)` → GOAL → STRUGGLE → CONSENT(+idade) → DEMO_PICK → ...

Proposta: `0 (so intro)` → GOAL → STRUGGLE → CONSENT(+idade) →
**IDENTIDADE (e-mail)** → **free/full** → DEMO_PICK → ...

Muda o MINIMO: nada troca de posicao relativa, a escolha free/full desce do
passo 0 para depois da identidade, e um passo novo entra entre consentimento e
essa escolha.

### Por que a identidade NAO pode ser a primeira tela

Foi o que voce pediu ao pe da letra, e nao da — por dois motivos que estao
escritos no proprio codigo:

- **D-07.** O `CONSENT_STEP` existe exatamente para por Termos + Politica
  **antes de coletar dado pessoal** ("ANTES de nome e data de nascimento", e o
  run 01 achou que caixa embutida no texto nao vale como consentimento
  especifico). E-mail e dado pessoal. Coletar antes do aceite regride esse
  achado.
- **Portao de idade.** O `CONSENT_STEP` tambem carrega o `demoAgeMonth` /
  `isAgeBlockedByMonth` → `AGE_BLOCK`. Por a identidade antes dele significa
  **mandar e-mail para um menor antes de verificar a idade**.

Colocar a identidade logo DEPOIS do consentimento satisfaz o seu pedido
("antes de decidir free ou full") sem desfazer nenhum dos dois.

## 3-bis. O que FOI ao ar (07/09/2026) — substitui a secao 3

O dono manteve o pedido literal: a conta e a **primeira** tela, antes de
qualquer outra coisa. O argumento da secao 3 (D-07, portao de idade) estava
correto no diagnostico e errado na conclusao: a saida nao era adiar a
identidade, era **trazer o bloco legal para dentro da tela de conta**.

Tres telas, nesta ordem, todas antes do free/full:

| Passo | Constante | O que mostra |
|---|---|---|
| 1 | `IDENTITY_STEP` (-6) | So `Continue com Google` / `ou` / `Novo usuario`. Nada de Termos aqui — a pedido do dono. |
| 2 | `CHOICE_STEP` (-7) | Escolha entre e-mail e Google, ja com o bloco legal. |
| 3 | `EMAIL_STEP` (-8) / `GOOGLE_STEP` (-9) | O formulario propriamente dito. |

O `CONSENT_STEP` e o antigo passo 0 (intro) foram **removidos**. O bloco legal
(`blocoLegal`) e um JSX unico compartilhado pelos passos que autenticam, com
duas caixas, nesta ordem: **"Li e concordo"** e, logo abaixo, **"sou maior de
idade"**. Nada de autenticacao acontece sem `podeAutenticar` — as duas caixas.

### O portao de idade virou caixa, nao formulario

`demoAgeMonth` / `isAgeBlockedByMonth` / `ageOnMonth` / `monthYearFromText`
foram **deletados** de `src/utils/consent.ts` (decisao do dono: "deixe que o
Google mesmo verifique, ou no maximo um checkbox"). Coletar mes/ano de
nascimento para depois so comparar com uma constante era pedir dado pessoal
sensivel a mais para obter um booleano que a propria pessoa ja podia declarar
— menos dado, mesmo efeito legal.

`src/utils/gateDraft.ts` guarda `soulGoal`, `soulStruggle` e `consent` durante
a ida e volta do `signInWithRedirect`, e **nunca** o e-mail nem data alguma.

### Achados de producao desta entrega

- **CSP bloqueava o login com Google.** `auth/internal-error` generico; a causa
  real era `script-src` sem `https://apis.google.com` em `public/_headers`.
  Travado por `src/security/csp.test.ts`.
- **O build do CI apagava o login a cada push** — ver a nota do `.env.production`
  no `CLAUDE.md`.
- **A compra nao ia sem vinculo, ia com vinculo DESCARTAVEL** — ver a correcao
  na secao 1.

## 4. A tela

Uma tela, um campo. Como o login e **link por e-mail sem senha**, "entrar" e
"criar conta" sao a MESMA acao: o mesmo e-mail ou reencontra o save (o
`saveId` e derivado dele) ou comeca um novo. Nao ha senha, nao ha cadastro.
Prometer duas portas seria inventar uma diferenca que o sistema nao tem.

Estados que precisam existir (todos em PT **e** EN — ha guard
`i18nSemPtSozinho.contract.test.ts`):

| Estado | O que mostra |
|---|---|
| vazio | campo de e-mail + acao primaria; texto diz que serve para nao perder progresso E para a compra ficar amarrada a conta |
| invalido | erro no campo, sem perder o que foi digitado |
| enviando | spinner, acao desabilitada |
| link enviado | instrucao de abrir o e-mail **no mesmo navegador**, com opcao de reenviar e de corrigir o endereco |
| falha de envio | mensagem acionavel + reenviar (nunca um beco sem saida) |
| ja logado | pula a tela inteira (`getCurrentEmail()` ja resolve) |
| auth indisponivel | ver secao 6 — NAO pode virar parede |

## 5. Arquivos

- `src/components/SoulmonOnboarding.tsx` — passo novo `IDENTITY_STEP`; tirar os
  dois botoes free/full do passo 0 e criar o passo `CHOICE_STEP` com eles;
  religar `next()`/`back()`; `handleUnlockFull` passa a exigir `saveId`
  presente (guarda defensiva, ver secao 7).
- `src/App.tsx` — sem mudanca de logica esperada; conferir que o reload pos-link
  cai no passo certo.
- Campo de e-mail do passo de cadastro final — vira **somente leitura**
  (preenchido e comprovado), ou sai. A decidir na implementacao.
- `emailRequired` (`flow !== 'demo'`) perde a razao de existir: passa a ser
  sempre verdadeiro. Remover o ramo em vez de deixar constante morta.

## 6. RISCO QUE PODE INVIABILIZAR — ler antes de aprovar

### 6.1 Android: o link de e-mail nao volta para o APK

O APK carrega a URL de producao numa WebView (Capacitor). O link do Firebase
abre no **navegador do sistema**, cujo `localStorage` e OUTRO. Sem **App Links**
configurado, quem completar o login no Chrome nao volta logado para o APK —
e com e-mail OBRIGATORIO isso deixa de ser inconveniencia e vira **app
travado na primeira tela**.

App Links depende de `ASSETLINKS_SHA256`, que esta na lista "quando for
publicar" (handoff 2.6) e **ainda nao esta configurado**.

**Consequencia:** e-mail obrigatorio pode ir para web/PWA agora, mas **nao pode
ir para o APK** antes de App Links funcionar e ser testado num aparelho real.

### 6.2 Desktop (Electron)

`startDesktopAuthBridge()` existe para o overlay. Um portao obrigatorio muda
quem autentica primeiro. Precisa ser exercitado antes de valer para o desktop.

### 6.3 Sem `VITE_FIREBASE_*`, o portao nao pode existir

Se `isAuthConfigured()` for false (build sem `.env`), uma tela obrigatoria de
e-mail **tranca o app inteiro** — inclusive num build de contribuidor. O portao
tem de degradar para o comportamento de hoje (e-mail opcional, sem link), com
teste travando isso.

## 7. Testes que travam a regra

1. Compra sem `saveId` e **recusada no cliente** — o defeito da secao 1 nao pode
   voltar por refatoracao.
2. A escolha free/full nao e alcancavel antes de identidade comprovada.
3. Identidade nao e alcancavel antes de consentimento + idade (protege D-07).
4. `isAuthConfigured() === false` → portao ausente, app utilizavel.
5. Cada estado da tela em PT e EN.
6. E-mail ja logado → tela pulada.

## 8. O que ainda depende de voce

1. ~~A ordem da secao 3~~ — **respondido**: a conta e a primeira tela; ver 3-bis.
2. **O Android da secao 6.1.** Continua aberto: o portao esta **so na web**. Ele
   so vale no APK depois de App Links, que depende do Play Console e da service
   account (itens 11/12 do `docs/DEPENDE-DE-VOCE.md`). Ate la,
   `PLAY_REQUIRE_ACCOUNT_BINDING` **fica desligado** — liga-lo antes de publicar
   o APK novo quebraria a compra de quem instalasse o antigo.
