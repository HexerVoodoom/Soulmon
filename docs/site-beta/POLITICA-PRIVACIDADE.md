# Política de privacidade do cadastro do beta (texto legível)

Extraída de `site-beta/src/components/Privacidade.astro` (versão 1, novembro de 2026; `POLITICA_VERSAO=2026-11-v1`). Proposta, **não é parecer jurídico**. Não editar aqui o texto publicado: a fonte é o `.astro`.

## Português

**Privacidade do cadastro do beta** (Versão 1, novembro de 2026.)

**Quem cuida dos dados**
Mateus Sperandio, responsável pelo projeto Soulmon. Contato: mateus.sprnd@gmail.com.

**O que guardamos**
E-mail da conta Google; idioma; origem da visita (UTM) quando houver; versão desta política e data do aceite; leva, data do convite, data de instalação, data de entrada no teste fechado (opt-in), e último dia de uso do jogo (esses dois últimos marcados à mão pelo responsável).
Ao tocar em Entrar no beta, você aceita esta política e declara ter 18 anos ou mais. Guardamos a data do aceite, e não um campo separado para a declaração.
Não guardamos IP puro nem user-agent.

**Para quê**
Enviar o convite do beta, por ordem de inscrição, e administrar as levas e a lista de espera e enviar avisos do beta. Seu e-mail é usado só para isso: o cadastro é apenas para o beta.
Base: seu consentimento, que você pode retirar a qualquer momento.

**Proteção contra abuso**
Para limitar tentativas, calculamos um hash do IP com chave secreta e data (HMAC). Esse hash é apagado na primeira tentativa de cadastro do dia seguinte, mesmo que essa tentativa seja inválida, e não fica junto da inscrição.
Também contamos, por dia, quantos cadastros deram certo e quantos falharam. É um número agregado, sem e-mail, IP ou qualquer dado pessoal.
O formulário usa o Cloudflare Turnstile, verificação anti-robô normalmente invisível, que processa dados técnicos do seu navegador sob as regras da Cloudflare.
Duplicatas são detectadas por um hash do e-mail normalizado.

**Quem processa**
Cloudflare: hospedagem, banco de dados (D1), Turnstile e estatística de visitas sem cookies.
Resend: envia ao responsável um aviso de que houve inscrição. O aviso não contém o seu e-mail.

**Por quanto tempo**
Os cadastros são removidos automaticamente 12 meses depois do cadastro (ou antes, se você pedir).
Depois de apagados, os dados ainda podem existir por até 7 dias no backup automático do D1, até expirarem sozinhos.

**Seus direitos**
Você pode pedir acesso, correção ou remoção escrevendo do próprio endereço inscrito para mateus.sprnd@gmail.com. A remoção apaga o registro de verdade, ressalvado o backup de 7 dias acima.
Quem recebeu um convite sem ter se inscrito pode pedir remoção da mesma forma.

**Cookies**
Este site não grava cookies próprios e não tem banner porque não há o que aceitar. A estatística de visitas funciona sem cookies.

**O jogo**
Esta política cobre só o cadastro do beta. O uso do app segue os termos e a política do app.

(Rodapé da página: link "Termos do app" e botão de inscrição.)

## English

**Beta sign-up privacy** (Version 1, November 2026.)

**Who looks after the data**
Mateus Sperandio, who runs the Soulmon project. Contact: mateus.sprnd@gmail.com.

**What we keep**
Your Google account email; language; visit source (UTM) when present; version of this policy and date you accepted it; wave, invite date, install date, closed-test opt-in date, and last day the game was used (the last two set by hand by the project owner).
By tapping Join the beta, you accept this policy and declare you are 18 or older. We keep the date you accepted, not a separate field for the statement.
We do not keep raw IP addresses or user agents.

**What for**
To send the beta invite, in sign-up order, to run the waves and waiting list, and to send beta notices. Your email is used only for that: the sign-up is for the beta only.
Legal basis: your consent, which you can withdraw at any time.

**Abuse protection**
To limit attempts we compute a keyed, dated hash of your IP (HMAC). It is deleted on the first sign-up attempt of the following day, even if that attempt is invalid, and is not stored with your sign-up.
We also count, per day, how many sign-ups worked and how many failed. It is an aggregate number, with no email, IP or any personal data.
The form uses Cloudflare Turnstile, a usually invisible anti-bot check that processes technical data from your browser under Cloudflare rules.
Duplicates are detected through a hash of the normalized email.

**Who processes it**
Cloudflare: hosting, database (D1), Turnstile and cookieless visit statistics.
Resend: sends the project owner a notice that a sign-up happened. The notice does not contain your email.

**How long**
Sign-ups are removed automatically 12 months after the sign-up (or sooner if you ask).
After deletion, data may still exist for up to 7 days in the automatic D1 backup, until it expires.

**Your rights**
You can request access, correction or removal by writing from the signed-up address to mateus.sprnd@gmail.com. Removal truly deletes the record, apart from the 7-day backup above.
Anyone who got an invite without signing up can request removal the same way.

**Cookies**
This site sets no cookies of its own and has no banner because there is nothing to accept. Visit statistics work without cookies.

**The game**
This policy covers only the beta sign-up. Using the app follows the app terms and policy.

## O que o código realmente faz

Fontes: `site-beta/migrations/0001_inscritos.sql`, `0002_conversao.sql`, `0003_limpeza.sql`, `functions/api/inscrever.js`, `functions/_lib/notificar.js`, `scripts/remover.mjs`, `scripts/limpar-antigos.mjs`.

| Dado | Onde | Como |
|---|---|---|
| E-mail (como digitado, com trim) | `inscritos.email` | texto puro no D1 |
| Hash do e-mail normalizado | `inscritos.chave` (UNIQUE) | HMAC com `HASH_SALT`; serve para duplicata e para remoção |
| Idioma | `inscritos.idioma` | `pt-BR` ou `en` |
| UTM source/medium/campaign | `inscritos.utm_*` | depois de `limparUtm` |
| Versão da política e data/hora do aceite | `politica_versao`, `aceite_em` | ISO; a declaração de 18+ não é gravada, só exigida (`maior18 === true`) |
| Leva, convite, instalação, opt-in, ativo | `leva`, `convidado_em`, `instalou_em`, `optin_em`, `ativo_ate` | marcados à mão pelos scripts; não há coluna de remoção (remover faz DELETE) |
| Dia do cadastro | `criado_dia` | AAAA-MM-DD; usado no teto diário |
| Hash do IP | `limite_ip(chave, dia, n)` | HMAC(IP, sal+dia); linhas de dias anteriores apagadas a cada requisição, antes do Turnstile |
| Contagem de conversão | `conversao(dia, evento, n)` | só `form_success` e `form_error`, sem identificador |
| Notificação | `notificacoes(dia, n)` + Resend | teto de 20 por dia; texto com o total, sem o e-mail; remetente `onboarding@resend.dev` |
| Logs | Cloudflare | `console.log` só com evento/motivo, nunca e-mail, IP ou token |

Retenção real: **limpeza automática de cadastros com mais de 12 meses** (`DELETE FROM inscritos WHERE criado_dia < date('now','-12 months')`), no máximo uma vez por dia por isolate dentro de `inscrever.js`, e sob demanda por `npm run limpar-antigos`; a remoção a pedido continua manual (`npm run remover`). Operadores: Cloudflare (Pages, D1, Turnstile, Web Analytics sem cookies) e Resend (aviso ao responsável). Backup: D1 Time Travel, 7 dias.

## Divergências entre o texto e o código

Resolvidas nesta versão: novidades (campo e coluna removidos), retenção de 12 meses (agora automática), `removido_em` (coluna removida pela 0003), copy de "24 horas" (agora "nos próximos dias"). Sobram:

1. **Limpeza é oportunista:** roda no primeiro cadastro de cada dia por isolate; sem tráfego, nada é apagado até o próximo cadastro ou `npm run limpar-antigos`. Um cron em Worker separado pode ser acrescentado depois.
2. **`criado_dia` e e-mail como digitado** não são citados de forma explícita (o primeiro é derivável da data do aceite).
3. **Logs da Cloudflare:** a plataforma pode registrar IP nas suas camadas de rede; "Não guardamos IP puro" vale para o nosso banco e logs, não para a Cloudflare como operadora (já listada).
4. **Backup de 7 dias do Time Travel:** dados apagados por limpeza ou remoção persistem lá por até 7 dias (já dito no texto).
5. **Avisos do beta:** o texto agora permite "avisos do beta"; hoje não há envio automático, só o convite manual pelo dono.

## Pontos para o dono decidir ou o jurídico revisar

- **Prazo de retenção:** decisão do dono: 12 meses após o cadastro, automático. Confirmar com o jurídico.
- **Transferência internacional:** Cloudflare e Resend processam fora do Brasil; o texto não menciona isso nem a base (LGPD art. 33 / GDPR).
- **Base legal:** consentimento declarado; revisar se basta para a lista de espera e se a retirada de consentimento está operacional (hoje, por e-mail).
- **18+ autodeclarado:** sem verificação; só a data do aceite é guardada, não a declaração em si. Avaliar se isso basta.
- **Backup de 7 dias do D1 (Time Travel):** o texto já avisa; confirmar que é aceitável e se a resposta ao titular deve citá-lo.
- **Contato:** mateus.sprnd@gmail.com é e-mail pessoal; decidir se continua sendo o canal oficial e quem responde.
- **Resposta ao titular:** definir prazo (sugestão: 15 dias), procedimento de verificação do remetente e registro do atendimento.
- **Papéis:** quem é controlador (Mateus Sperandio como pessoa física?) e se precisa de encarregado/DPO.
- **Divergências acima**, antes de publicar. Todo o texto segue **pendente de revisão do dono/jurídico**.
