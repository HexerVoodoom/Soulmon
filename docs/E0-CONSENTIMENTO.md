# E0 — termo de consentimento para a pesquisa (separado dos Termos de Uso)

> **Dono:** `alpha-compliance` (texto) + `alpha-gestor-pesquisa` (o que se coleta) · controlador: **o dono do projeto** · **Data:** 22/09/2026 (QA Rodada 2, [`reviews/2026-09-22-qa-rodada-2/03-negocio-pesquisa-r2.md`](reviews/2026-09-22-qa-rodada-2/03-negocio-pesquisa-r2.md) §Pesquisa) · **Estado:** vivo — **rascunho até o dono revisar o §6 e datar** (pergunta #71). **Não é parecer jurídico**: é o mínimo que a squad consegue escrever a partir do que o app faz; o que o texto afirma de direito, o controlador confirma
> **Verificação:** o que o §2 diz que o app guarda é conferido contra `public/privacidade.html` (§2, §6, §8) e [`manual/07-DADOS-E-SAVE.md`](manual/07-DADOS-E-SAVE.md) §8 (o inventário KV); o que o §2 diz que a PESQUISA guarda a mais (o vínculo e-mail ↔ `saveId` ↔ pessoa nomeada, e a gravação) **não está em nenhum lugar do app** — é exatamente por isso que este termo existe fora dos Termos
> **Não cobre:** os Termos de Uso e a Política de Privacidade do app (o convidado aceita os dois no app, como qualquer usuário — `public/termos.html`, `public/privacidade.html`); o desenho do estudo (→ [`E0-PREREGISTRO.md`](E0-PREREGISTRO.md)); a cortesia em si (é um entitlement `provider:'courtesy'`, não faz parte do consentimento — ver §4)
> **Precedência:** código > teste > `CLAUDE.md` > manual > este documento. Se o app coletar algo que este termo não declara, o termo está errado e a coleta para até ele ser corrigido — nunca o contrário.

---

## 0. Por que separado dos Termos

A Política de Privacidade do app descreve o que o **app** guarda de **qualquer** usuário — e
promete que o `saveId` não é ligado a uma pessoa nomeada e que ninguém lê o comportamento de
uma pessoa (o agregado `m:<dia>` não tem chave por usuário). A **pesquisa** do E0 faz as duas
coisas que a política diz que o app não faz: **liga o e-mail e o `saveId` a uma pessoa com nome**
(para excluir os aparelhos do dono e para cruzar a entrevista com o funil) e **grava a fala**
da pessoa em duas entrevistas. Isso é tratamento novo, com finalidade nova, e precisa de
consentimento próprio (LGPD art. 7º, I — consentimento específico e destacado), não de uma
cláusula escondida nos Termos.

## 1. Texto para o convidado (PT-BR; EN em §7)

> **Convite para uma pesquisa de 14 dias com o Soulmon**
>
> Você está sendo convidado(a) para usar o Soulmon por 14 dias e conversar comigo duas vezes
> (perto do 7º e do 14º dia), por cerca de 20 minutos cada. Quem conduz e guarda os dados sou
> eu, **[nome do dono]**, controlador dos dados desta pesquisa (contato: **[e-mail]**).
>
> **O que a pesquisa guarda, além do que o app já guarda de qualquer usuário:**
> - o vínculo entre o seu **nome**, o **e-mail** com que você entrou e o **identificador do
>   seu save** — para eu saber quais números do app são seus e para cruzar com a conversa;
> - a **gravação de áudio** das duas conversas e a **transcrição** delas;
> - as minhas **anotações** sobre o que você disse.
>
> **O que eu NÃO faço com isso:** não vendo, não compartilho com terceiros, não uso para
> publicidade, não publico nada que identifique você. Se eu citar uma frase sua em algum
> documento, ela sai sem nome e sem detalhe que identifique.
>
> **Por quanto tempo:** o áudio é apagado em até **30 dias** depois da segunda conversa; as
> transcrições e anotações ficam por **12 meses** e depois são apagadas; o vínculo nome ↔
> e-mail ↔ save é apagado junto com as transcrições, ou antes, se você pedir.
>
> **Você pode sair quando quiser**, sem explicar. É só me avisar. Se sair, eu apago a gravação
> e o vínculo; o que já estiver agregado com o dos outros (sem nome) não dá para desfazer.
> **Sair não tira a versão completa do app** — ela é presente, não pagamento.
>
> **Não há remuneração.** A versão completa liberada é uma cortesia que você manteria de todo
> jeito, participando ou não.
>
> **Você precisa ter 18 anos ou mais.**
>
> Os Termos de Uso e a Política de Privacidade do app continuam valendo como para qualquer
> pessoa; este consentimento é só sobre a pesquisa.
>
> ☐ Li e concordo em participar da pesquisa nas condições acima.
> ☐ Concordo com a gravação de áudio das duas conversas.
>
> Nome: ______________ · Data: ____/____/2026 · Assinatura (ou "concordo" por escrito na mesma
> mensagem em que recebeu este texto): ______________

## 2. O que é coletado, base legal, prazo — a tabela que o controlador confirma

| Dado | Quem guarda | Onde | Base legal (LGPD) | Prazo | Já está na política do app? |
|---|---|---|---|---|---|
| Nome ↔ e-mail ↔ `saveId` | o dono | fora do app (planilha local do dono; nunca no repo, nunca no KV) | art. 7º, I (consentimento específico) | até 12 meses ou pedido de saída | **Não** — a política promete o contrário para o usuário comum; é o motivo deste termo |
| Áudio das entrevistas | o dono | aparelho do dono; sem serviço de transcrição em nuvem sem declarar aqui | art. 7º, I | ≤ 30 dias após a 2ª entrevista | Não |
| Transcrição + anotações + codificação em 3 baldes | o dono + 1 leitor (agente sobre a transcrição, sem nome) | local do dono | art. 7º, I | 12 meses | Não |
| Telemetria do app (agregado `m:<dia>`, sem chave por usuário) | o app | KV (`functions/api/metrics.js`) | a mesma da política (legítimo interesse, agregado) | 730 d (`m:` TTL) | **Sim** (política §2) |
| Save, entitlement, push | o app | KV/D1 conforme `07` §8 | a mesma da política | conforme `07` §8 | **Sim** |

Regras que valem sem exceção:

- **Nenhum `saveId` ou e-mail de convidado entra em documento do repo** — nem neste, nem no
  diário do E0, nem nos relatórios de leitura. Só contagens.
- A transcrição passa por um leitor que **não vê nome** (o dono tira nome/e-mail antes).
- Se o dono usar serviço de transcrição em nuvem, **declarar aqui antes** (nome do serviço,
  país, retenção) — até lá, transcrição é local.

## 3. Direitos do participante (o que o dono precisa saber responder)

Acesso, correção, exclusão, cópia dos dados da pesquisa, revogação do consentimento — a
qualquer momento, por mensagem ao e-mail de contato, atendido em até **15 dias** (art. 18/19).
A exclusão da CONTA do app continua sendo pelo app (`/privacidade#exclusao`), independente da
pesquisa.

## 4. O que a cortesia NÃO é

A cortesia (`provider:'courtesy'`, `grantCourtesy`) é um entitlement do app, concedido pelo
dono, que **não depende** de participar da pesquisa e **não é retirado** por sair dela. Não é
remuneração nem contrapartida — se fosse, viciaria o consentimento. Por isso o texto do §1 diz
"você manteria de todo jeito".

## 5. Checklist antes do 1º convite (o dono confere)

- [ ] §1 preenchido (nome, e-mail de contato) e §6 revisado/datado.
- [ ] Cada convidado devolveu "concordo" (por escrito) **antes** do `grant` de cortesia.
- [ ] Lista nome ↔ e-mail ↔ `saveId` criada **fora** do repo.
- [ ] `E0-PREREGISTRO.md` §9 assinado (o pré-registro congela junto com o 1º convite).
- [ ] `TERMS_VERSION`/`PRIVACY_VERSION` não mudam durante os 14 dias.

## 6. Revisão do controlador

| Campo | Valor |
|---|---|
| Nome do controlador (aparece no §1) | `[dono preenche]` |
| E-mail de contato (aparece no §1) | `[dono preenche]` |
| Serviço de transcrição, se houver | `[nenhum — local]` |
| Encarregado (art. 41) — nomeado? (pergunta #44) | `[dono preenche]` |
| Data da revisão | `[dono preenche]` |

## 7. English text (for the same convite, when the person prefers EN)

> **Invitation to a 14-day research study with Soulmon**
>
> You are being invited to use Soulmon for 14 days and talk to me twice (around day 7 and
> day 14), for about 20 minutes each. I, **[owner name]**, run the study and hold its data
> (contact: **[email]**).
>
> **What the study keeps, beyond what the app keeps for any user:** the link between your
> **name**, the **e-mail** you signed in with and your **save identifier**; the **audio
> recording** and **transcript** of the two conversations; my **notes**.
>
> **What I do NOT do with it:** no selling, no sharing with third parties, no advertising, no
> publishing anything that identifies you. Any quote is anonymised.
>
> **For how long:** audio deleted within **30 days** after the second conversation;
> transcripts and notes kept for **12 months**, then deleted; the name ↔ e-mail ↔ save link is
> deleted with them, or earlier if you ask.
>
> **You can leave at any time**, no reason needed. Leaving does **not** remove the full version
> of the app — it is a gift, not a payment. **There is no compensation.** **You must be 18 or
> older.** The app's Terms and Privacy Policy still apply as for anyone; this consent is only
> about the study.
>
> ☐ I have read the above and agree to take part. ☐ I agree to the audio recording.
