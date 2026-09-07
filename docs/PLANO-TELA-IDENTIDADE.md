# Plano — tela de identidade antes da escolha free/full

> **Status:** proposta, aguardando aprovacao do dono. Nada implementado.
> Decisao registrada em 07/09/2026: **e-mail obrigatorio para todos**.

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

Logo: usuario novo que toca em "Quero o completo" compra com `saveId:
undefined`, e a compra chega ao Google Play **sem `obfuscatedExternalAccountId`**.

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

## 8. O que eu preciso de voce

1. **A ordem da secao 3** (identidade DEPOIS do consentimento, nao antes) — e o
   unico jeito de nao regredir D-07 e o portao de idade.
2. **O Android da secao 6.1.** Ou o portao sai so na web por enquanto, ou App
   Links entra antes. Nao da para as duas coisas ao mesmo tempo.
