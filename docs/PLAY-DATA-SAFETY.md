# Formulário de Segurança de Dados do Google Play — respostas do Soulmon

> **Para que serve:** o Play Console pede um formulário ("Data safety" / "Segurança
> de dados") declarando cada dado que o app coleta. Este documento traz a resposta
> de cada pergunta, já mapeada para as categorias que o Google usa, para você só
> transcrever.
>
> **Regra de ouro, e o motivo de este arquivo existir:** declarar **menos** do que
> o app coleta é motivo de rejeição e, se passar, de remoção depois. O caminho
> seguro é declarar tudo que realmente sai do aparelho — mesmo o que "não parece
> dado pessoal". Cada linha abaixo aponta para o código que a sustenta, então dá
> para reconferir em vez de acreditar.
>
> **Atualizado em:** 21/09/2026 (§2.7 e §3b) · **Confira antes de enviar** se nada mudou desde
> essa data — a fonte viva é `public/privacidade.html` e o inventário de eventos
> em `functions/api/metrics.js`.

---

## 0. Antes de abrir o formulário

| Campo | Resposta |
|---|---|
| **URL da política de privacidade** | `https://soulmon.mateus-sprnd.workers.dev/privacidade` ✅ **já está no ar** |
| **URL de exclusão de conta** (obrigatória desde 2024) | `https://soulmon.mateus-sprnd.workers.dev/privacidade#exclusao` — e, no app, **Configurações → Seus dados → Excluir conta** |
| **Público-alvo (Content rating)** | Maiores de 18. A política declara isso na seção 7, e o app tem caixa de confirmação de maioridade na tela de conta |
| **Anúncios** | Não. O app não tem publicidade e não usa ID de publicidade |

> ⚠️ **A exclusão precisa funcionar no dia da revisão.** Ela depende do
> `FIREBASE_PROJECT_ID` ligado no worker (feito em 07/09/2026) — `/api/account`
> respondia 503 antes disso. Se um dia o worker for redeployado sem essa var, o
> botão volta a falhar e a declaração vira falsa.

---

## 1. Perguntas gerais

| Pergunta do formulário | Resposta | Por quê |
|---|---|---|
| O app coleta ou compartilha algum dos tipos de dados exigidos? | **Sim** | Save na nuvem, e-mail e chat de IA |
| Todos os dados coletados são criptografados em trânsito? | **Sim** | Tudo passa por HTTPS (Cloudflare Workers); não há endpoint em texto claro |
| Você oferece um jeito de o usuário pedir a exclusão dos dados? | **Sim** | Autoatendimento no app (**Configurações → Seus dados**) e por e-mail |

---

## 2. Tipo a tipo — o que declarar

Legenda: **Coletado** = sai do aparelho e chega ao nosso servidor. **Compartilhado**
= vai para um terceiro. *Obrigatório* = o app não funciona sem; *Opcional* = o
usuário escolhe.

### 2.1 Informações pessoais

| Tipo do Google | Coletado? | Compartilhado? | Finalidade | Obrigatório? | Onde no código |
|---|---|---|---|---|---|
| **Endereço de e-mail** | ✅ Sim | ✅ Sim — Google (Firebase Authentication) | Gerenciamento de conta; funcionalidades do app | **Obrigatório** (o portão de conta é a primeira tela) | `src/utils/auth.ts`, `functions/api/_auth.js` |
| **Nome de usuário** | ✅ Sim | ❌ Não | Funcionalidades do app (aparecer para outros jogadores na Biblioteca, Torneio e no grupo) | Opcional | `functions/api/community.js` → `profile:` |
| Nome real, endereço, telefone, documento, etc. | ❌ Não | — | — | — | O app nunca pede |

> **Sobre o e-mail:** ele é guardado no nosso lado apenas como **hash**
> (`saveId` = SHA-256 do endereço, `functions/api/_auth.js`). Ainda assim,
> **declare como coletado** — o Google considera coleta o envio ao servidor,
> independentemente da forma de armazenamento, e o endereço em si trafega até o
> Firebase. Declarar "não" aqui por causa do hash é o erro clássico.

### 2.2 Informações financeiras

| Tipo do Google | Coletado? | Finalidade | Onde |
|---|---|---|---|
| **Histórico de compras** | ✅ Sim | Funcionalidades do app (manter o desbloqueio válido e restaurável) | `functions/api/billing.js`, D1 `soulmon-billing` |
| Dados de pagamento (cartão etc.) | ❌ Não | — | Quem processa é o Google Play; o app **nunca** vê dado de pagamento |

### 2.3 Mensagens

| Tipo do Google | Coletado? | Compartilhado? | Finalidade | Obrigatório? | Onde |
|---|---|---|---|---|---|
| **Outras mensagens no app** | ✅ Sim | ✅ Sim — **Groq** (provedor de IA, EUA) | Funcionalidades do app (a criatura responder) | Opcional | `functions/api/chat.js` |
| **Outras mensagens no app** — descrição da criatura para gerar a imagem (inclui o campo opcional "criatura favorita" e a escolha do Renascimento, texto livre) | ✅ Sim | ✅ Sim — **Higgsfield** e **Google Gemini** (geração de imagem) | Funcionalidades do app (desenhar a criatura) | Opcional (só quem gera/regenera o sprite) | `functions/api/generate-sprite.js` (`generateHiggsfield`, `generateGemini`) — achado do QA de 21/09/2026 (`reviews/2026-09-21-qa-geral/11-compliance.md` §1); política §6 já declara |

> **Não esconda isto.** É o item mais fácil de esquecer e o mais caro: o texto
> que a pessoa escreve no chat sai do país. O app minimiza antes de enviar
> (`functions/api/_redact.js` tira e-mail, telefone, documento, cartão, URL e
> @perfil), e a política explica isso na seção 2b — mas **minimizar não é deixar
> de coletar**, e a declaração tem de dizer "sim".

### 2.4 Fotos, vídeos, áudio, contatos, calendário, arquivos

| Tipo do Google | Coletado? | Compartilhado? | Finalidade | Obrigatório? | Onde no código |
|---|---|---|---|---|---|
| **Gravações de voz ou som** | ✅ Sim | ✅ Sim — serviço de transcrição | Funcionalidades do app (falar com a criatura em vez de digitar) | Opcional | `src/components/ChatBox.tsx` → `functions/api/transcribe.js` |
| Fotos, vídeos, contatos, calendário, arquivos, músicas | ❌ Não | — | — | — | O app não pede nenhuma dessas permissões |

> ⚠️ **Marque "Sim" mesmo não guardando o áudio.** O formulário pergunta se o
> dado é COLETADO, e coletar inclui transitar pelo servidor — não guardar é
> outra pergunta (a de retenção). Responder "não" aqui porque "é só de
> passagem" é o erro clássico que derruba a ficha na revisão.
>
> Na pergunta de **processamento efêmero**, responda **sim**: o áudio é
> repassado ao provedor e descartado, sem gravação em KV, R2, disco ou backup.
> Há um teste que afirma isso lendo o código da rota
> (`functions/api/transcribe.test.js` → "a rota NÃO grava o áudio").
>
> O botão de gravar **só existe quando o servidor tem provedor configurado**
> (`/api/config` → `transcribeAvailable`). Enquanto ele estiver desligado o app
> não pede a permissão nem coleta nada — mas a permissão está no manifesto, e
> **a ficha tem que ser preenchida pelo que o APK pode fazer**, não pelo que a
> configuração de hoje faz.

**Declarado na política:** seção **2c** (PT) / **2c** (EN), com destino,
retenção ("não guardamos o áudio") e como revogar.

**As permissões que o app REALMENTE declara** (conferidas em
`android/app/src/main/AndroidManifest.xml`, 08/09/2026), para você não ser
surpreendido pela ficha da loja:

| Permissão | Para quê | Aparece na ficha? |
|---|---|---|
| `INTERNET` | Save na nuvem, login, chat | Não (normal) |
| `POST_NOTIFICATIONS` | Lembretes | Sim — diálogo do sistema |
| `SCHEDULE_EXACT_ALARM` | Lembrete na hora certa | Sim |
| `RECEIVE_BOOT_COMPLETED` | Reagendar lembretes após reiniciar | Não (normal) |
| **`ACTIVITY_RECOGNITION`** | **Contador de passos** — ver 2.6 | **Sim, e exige declaração** |
| **`RECORD_AUDIO`** | **Recado falado no chat** — ver 2.4 | **Sim, e exige declaração** |

> Se o manifesto ganhar uma permissão nova, esta tabela mente e a declaração
> enviada ao Play fica falsa. Confira antes de cada envio.

### 2.5 Atividade no app

| Tipo do Google | Coletado? | Compartilhado? | Finalidade | Obrigatório? | Onde |
|---|---|---|---|---|---|
| **Interações no app** | ✅ Sim | ❌ Não | Análise (melhorar o app) | **Opcional** — dá para desligar em Configurações → Seus dados | `functions/api/metrics.js` |
| **Outras ações geradas pelo usuário** | ✅ Sim | ❌ Não | Funcionalidades do app (o save é o jogo) | Obrigatório | `functions/api/save.js` |
| Histórico de pesquisa, apps instalados | ❌ Não | — | — | — | — |

> As estatísticas são **agregadas e pseudonimizadas** (a lista completa dos
> eventos está na seção 4 da política, e há teste conferindo essa lista contra o
> código). Ainda assim declare "Interações no app: sim" — o Google pergunta se
> você coleta, não se você identifica.

### 2.6 Saúde e bem-estar

> 🔴 **A seção mais fácil de errar do formulário inteiro, e a que eu quase errei.**
> A primeira versão deste documento dizia "não há sensor nem integração de
> atividade física". **É falso.** O app declara `ACTIVITY_RECOGNITION` no
> manifesto e usa o contador de passos do aparelho
> (`@capgo/capacitor-pedometer`, `src/utils/steps.ts`), e o agregado diário
> viaja dentro do save (`steps?: StepsRecord` no `GameState`, e o save inteiro
> é serializado para a nuvem em `src/utils/cloudSave.ts`). Declarar "não" aqui
> seria a divergência clássica entre ficha e comportamento.

| Tipo do Google | Coletado? | Compartilhado? | Finalidade | Obrigatório? | Onde |
|---|---|---|---|---|---|
| **Informações de exercícios físicos** | ✅ **Sim** | ❌ Não | Funcionalidades do app | **Opcional** (o app roda inteiro sem a permissão) | `src/utils/steps.ts`, `GameState.steps` |
| **Informações de saúde** | ✅ **Sim** (leitura conservadora — ver abaixo) | ❌ Não | Funcionalidades do app | Opcional | `GameState.moodLog`, `soulGoal`, `soulStruggle` |

**Sobre os passos.** É o contador do próprio Android, **não é o Health
Connect** — logo **não** exige conta de organização verificada, nem a
declaração de acesso a dados de saúde, nem política dedicada. O que sobe é só
`{ dia, âncora, total }`, nunca uma linha do tempo de movimento. Se o revisor
perguntar, é isso.

**Sobre "informações de saúde", e a decisão é sua.** Três campos justificam
declarar sim:

- **`moodLog`** — a nota de humor de 1 a 5 por dia. Ela **sobe no save** (está
  em `GameState`, e o save inteiro é serializado). ⚠️ Uma versão anterior deste
  documento afirmava que o humor "fica só no aparelho": isso vale para as
  **estatísticas de uso**, onde ele realmente nunca entra — não para o save.
- **`soulGoal` / `soulStruggle`** — texto livre escrito pela pessoa, que pode
  conter o que ela quiser, inclusive algo sobre a saúde dela. Sobe no save; não
  passa por IA nem por métricas.

Nada disso é dado clínico, e o app não é de saúde. Mas o formulário pergunta se
você **coleta**, não se você trata como sensível — e como esses campos saem do
aparelho, **a recomendação é declarar sim**. É mais rígido que o mínimo, e é o
lado certo para errar.

### 2.7 Localização, dispositivo, identificadores

| Tipo do Google | Coletado? | Observação |
|---|---|---|
| Localização aproximada ou precisa | ❌ Não | Nenhuma permissão de localização. `ACTIVITY_RECOGNITION` **não** é localização: ela dá acesso ao contador de passos, não a onde você esteve |
| **IDs do dispositivo ou outros IDs** | ✅ **Sim** | **Token do FCM** (app Android, `functions/api/fcm-subscribe.js`, chaves `fcm:*`) e **endpoint do Web Push** (PWA/navegador, `functions/api/subscribe.js`, chaves `push:*`). Finalidade: **funcionalidades do app** (entregar lembretes). **Opcional** — só existe com as notificações ligadas e é apagado ao desligá-las ou ao excluir a conta pelo app. Não compartilhado (o FCM é o transporte, não um destinatário). O identificador das métricas continua **fora** desta linha: é gerado no aparelho, aleatório, e o servidor o descarta antes de gravar (`functions/api/metrics.js`) |
| Registros de erro / diagnóstico | ❌ Não | Não há Crashlytics, Sentry ou similar |

> **Por que "sim" (decisão do dono, 21/09/2026 — pergunta #21 do QA geral).**
> Até essa data este documento dizia "não" e argumentava que o token do FCM
> "não é ID do dispositivo na taxonomia do Google" — **sem fonte**. Um token
> de push é um identificador estável por instalação que sai do aparelho e
> fica guardado no nosso servidor; a zona é cinzenta, e o lado seguro de errar
> numa ficha da Play é **declarar**. Subdeclarar é motivo de remoção;
> sobredeclarar, no máximo, uma linha a mais na ficha pública. Se o revisor
> perguntar: o token existe só enquanto as notificações estiverem ligadas,
> não é ID de publicidade, e não é cruzado com e-mail nem com o save
> (`account.js` diz por escrito que o servidor **não consegue** achar as
> inscrições a partir da conta).

---

## 3. Resumo em uma tela (o que marcar)

**Coletado e compartilhado:**
- E-mail → Firebase (Google)
- Outras mensagens no app → Groq (chat, sugestões) e Higgsfield + Google Gemini (descrição da criatura para a imagem)
- **Gravações de voz ou som** → serviço de transcrição, via `functions/api/transcribe.js` *(opcional; processamento efêmero — ver 2.4)*

**Coletado, não compartilhado:**
- Nome de usuário
- Histórico de compras
- Interações no app *(opcional — dá para desligar)*
- Outras ações geradas pelo usuário (o save)
- **Informações de exercícios físicos** *(passos — opcional)* ← **não esqueça**
- **Informações de saúde** *(humor + texto livre — ver 2.6)*
- **IDs do dispositivo ou outros IDs** *(token FCM / endpoint Web Push — opcional; ver 2.7, decisão de 21/09/2026)*

**Não coletado:** localização, contatos, fotos, vídeo, arquivos,
calendário, ID de publicidade, diagnóstico, histórico de pesquisa,
apps instalados, dados de pagamento, documentos.

> ⚠️ **`áudio` saiu desta lista em 09/09/2026, e o motivo importa.** A tabela do
> §2.4 passou a declarar **"Gravações de voz ou som — ✅ Sim, coletado e
> compartilhado"** quando o recado falado foi assumido (`06ef9ea0`), mas **esta
> lista-resumo continuou dizendo "não coletado: áudio"** — o documento se
> contradizia em duas páginas.
>
> Não é detalhe de redação: **é desta lista que se preenche a ficha da Play**, e
> a tabela do §2.4 é a que ninguém relê na hora de preencher. Uma ficha marcada
> "não" para áudio, com `RECORD_AUDIO` declarado no manifesto e o áudio saindo
> para um serviço de transcrição, é exatamente o descompasso que derruba a
> revisão — e a §2.4 já avisa por escrito que *"responder 'não' porque é só de
> passagem é o erro clássico"*.
>
> **Regra que fica:** ao mudar a tabela do §2.4, mude as duas listas-resumo no
> mesmo commit. Elas são a mesma verdade escrita duas vezes, e a segunda é a que
> vai para o formulário.

---

## 3b. Conteúdo gerado por IA — o que é, e onde está declarado

> Decisão do dono, 21/09/2026 (pergunta #22 do QA geral): **declarar** na ficha
> da loja e avisar dentro do app. O repo não documenta o texto exato da regra
> da Play/Steam sobre conteúdo de IA; a postura é a mesma da §2.7 — declarar
> o que existe em vez de apostar que a regra não alcança.

| O que o jogador vê | Como é gerado | Onde no código | Revisão humana? |
|---|---|---|---|
| **Sprite da criatura** (as 11 formas do jogador pago; os personagens de demonstração foram gerados antes e revisados) | Higgsfield (modelo Soul), fallback Gemini `gemini-2.5-flash-image` | `functions/api/generate-sprite.js`, prompts em `src/utils/oracle.ts` | Não, no caminho pago (gerado sob demanda por conta) |
| **Chat da criatura** (texto e, com microfone, transcrição do recado) | Groq `llama-3.1-8b-instant`, personalidade via `aiSettings` | `functions/api/chat.js` (cláusula SAFETY), `src/utils/chatSafety.ts` (ponte local, lista curada) | Não — em tempo real |
| **Sons** — 3 eventos (`evolve`, `degenerate`, `task-complete`) + 2 camadas da trilha | Higgsfield CLI `seed_audio` / `sonilo_music` | `public/sounds/`, manifesto em `src/utils/sonsAssets.ts` | Sim — gerados uma vez, ouvidos e instalados (S16) |
| Arte estática do app (cenários, decoração, sonhos, aventuras, FX, ícones dentro do visor) | Gemini (navegador) e Higgsfield (`gpt_image_2`, `nano_banana_pro`) | `src/assets/`, mapas `src/utils/*Art.ts` | Sim — gerada uma vez, curada e instalada |

**Onde isso está declarado, e as três têm que dizer a mesma coisa:**

1. **Ficha da Play** — na seção de conteúdo gerado por IA do Play Console
   (declarar sprite, chat e sons; a arte estática curada é indistinguível de
   arte encomendada para efeito de ficha, mas nada impede citá-la).
2. **Aviso in-app** — **Configurações › Sobre**, texto curto PT/EN: o chat é
   escrito por IA sem revisão humana e não é serviço de emergência; a imagem da
   criatura e os sons de marco/evolução são gerados por IA.
3. **Termos §8** (`public/termos.html`, PT e EN, versão 2026-09-21) — a
   cláusula completa: modelo sem revisão humana, não é aconselhamento nem
   emergência, canais de ajuda fixos (CVV 188 / findahelpline.com), sprite e
   sons gerados por IA.

A procedência asset a asset (modelo, provedor, data, onde vive o prompt) mora
em `docs/Attributions.md`, não aqui.

## 4. O que NÃO declarar por engano

- **Dados de pagamento.** Quem cobra é o Google Play; o app nunca vê cartão.
- **ID de publicidade.** O app não tem anúncios e não usa `AdvertisingId`.
- **Localização.** O fuso horário usado nas notificações é lido do aparelho e
  **não é enviado nem guardado** — fuso não é localização na taxonomia do Google.
- **Contatos.** O grupo cooperativo funciona por **código de convite digitado à
  mão**; o app não lê a agenda e não sugere ninguém.

---

## 5. Depois de enviar

O formulário vira uma seção pública na ficha da loja. Se o app passar a coletar
algo novo, **a declaração tem de ser atualizada antes da versão ir ao ar** —
divergência entre o declarado e o comportamento real é a causa mais comum de
suspensão nessa área.

Gatilhos concretos para revisitar este arquivo:

- entrar qualquer provedor novo de IA, análise ou crash;
- o contador de passos passar a usar **Health Connect** em vez do sensor do
  aparelho — aí muda de categoria e passa a exigir conta verificada e política
  dedicada;
- o modo cooperativo passar a mostrar mais do que "apareceu hoje";
- `soulGoal`/`soulStruggle` passarem a ir para alguma rota de IA;
- qualquer permissão nova no `AndroidManifest.xml`.
