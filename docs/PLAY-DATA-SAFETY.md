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
> **Atualizado em:** 08/09/2026 · **Confira antes de enviar** se nada mudou desde
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
| **IDs do dispositivo ou outros IDs** | ❌ Não | O identificador das métricas é **gerado no aparelho, aleatório, sem relação com e-mail nem com o save**, e o servidor o descarta antes de gravar (`functions/api/metrics.js`). Não é ID de publicidade nem ID de dispositivo |
| Registros de erro / diagnóstico | ❌ Não | Não há Crashlytics, Sentry ou similar |

> A inscrição de push guarda um **token do FCM**, que é um identificador de
> instalação. Ele existe só enquanto as notificações estiverem ligadas e morre
> ao desligá-las. Se o revisor questionar, a resposta honesta é essa — mas o
> token do FCM não é "ID do dispositivo" na taxonomia do Google, e a
> categoria correta já está coberta pelo consentimento de notificação.

---

## 3. Resumo em uma tela (o que marcar)

**Coletado e compartilhado:**
- E-mail → Firebase (Google)
- Outras mensagens no app → Groq

**Coletado, não compartilhado:**
- Nome de usuário
- Histórico de compras
- Interações no app *(opcional — dá para desligar)*
- Outras ações geradas pelo usuário (o save)
- **Informações de exercícios físicos** *(passos — opcional)* ← **não esqueça**
- **Informações de saúde** *(humor + texto livre — ver 2.6)*

**Não coletado:** localização, contatos, fotos, vídeo, áudio, arquivos,
calendário, IDs de dispositivo/publicidade, diagnóstico, histórico de pesquisa,
apps instalados, dados de pagamento, documentos.

---

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
