# Contrato do cadastro

## POST /api/inscrever
Corpo JSON: `{ email, idioma: "pt-BR"|"en", aceitePrivacidade: true, maior18: true, turnstile: string, site: "" (honeypot), utm: { source?, medium?, campaign? } }`

| Status | Corpo | Front mostra |
|---|---|---|
| 200 | `{ ok: true }` (idêntico para novo e repetido) | Estado de confirmação |
| 400 | `{ ok: false, erro: "email" | "aceite" | "corpo" }` | Erro no campo |
| 403 | `{ ok: false, erro: "turnstile" | "origem" }` | Pede nova verificação; `turnstile.reset` |
| 429 | `{ ok: false, erro: "limite" }` | "Tente de novo em alguns minutos" |
| 503 | `{ ok: false, erro: "teto" | "indisponivel" }` | Mostra e-mail de contato |

Sem JS: `application/x-www-form-urlencoded` não é aceito no v1; o bloco `<noscript>` mostra o e-mail de contato para pedir a inscrição (o Turnstile exige JS).

## GET /api/vagas
`{ estado: "abertas"|"espera" }`, vindo da variável `LEVA_ESTADO`.

Todas as respostas de `/api/*` (inclusive 405 e erros) saem de `functions/_lib/resp.js` com `Cache-Control: no-store` e `X-Content-Type-Options: nosniff`.

A cada POST em `/api/inscrever` (logo depois da checagem de Origin) apaga-se o hash de IP de dias anteriores; sucesso e erro de validação incrementam `conversao(dia, evento, n)`, sem identificador.
Falhou: o front mantém o texto da regra e o CTA.

## Variáveis
`LEVA_ESTADO`, `LEVA_VAGAS` (só scripts), `TETO_DIA`, `ORIGENS` (lista), `TURNSTILE_HOST`; secrets `TURNSTILE_SECRET`, `RESEND_API_KEY`, `HASH_SALT`, `NOTIFICAR_PARA`.
No front: `PUBLIC_TURNSTILE_SITEKEY`. Em preview, usar a chave de teste oficial do Turnstile.
