# Como criar as chaves do site do beta

São duas chaves. Depois de pegá-las, rode `LIBERAR-PRODUCAO.ps1` nesta pasta e cole quando ele pedir.

## 1. Turnstile (o anti-robô do formulário)

1. Abra o painel: https://dash.cloudflare.com/52a8625042461ea7d1395da4b9e25bdb/turnstile
2. Clique em **Add widget**.
3. Preencha:
   - **Widget name:** Soulmon beta
   - **Hostname:** `soulmon.pages.dev` (opcional: acrescente `previa.soulmon.pages.dev` para testar a prévia)
   - **Widget Mode:** Managed
4. Clique em **Create**.
5. Copie as duas chaves que aparecem:
   - **Site Key**, começa com `0x`: é pública, o script pede no passo 3.
   - **Secret Key**: é o `TURNSTILE_SECRET`, o script pede no passo 2.

Se fechar a tela, as duas chaves continuam no widget: clique no nome dele para vê-las.

## 2. Resend (o aviso de cada inscrição por e-mail)

O site usa a mesma conta da Resend do app (a de `soulmon.revisor@gmail.com`).

1. Abra: https://resend.com/api-keys
2. Se você tem a chave do app guardada, use a mesma.
3. Se não tem (a Resend só mostra a chave uma vez), clique em **Create API Key**:
   - **Name:** soulmon-site-beta
   - **Permission:** Sending access
   - **Domain:** All domains
4. Copie a chave, que começa com `re_`: é o `RESEND_API_KEY`.

**Remetente e domínio:** não precisa configurar nada agora. O aviso sai de `onboarding@resend.dev` e só pode ir para o e-mail da própria conta da Resend, que é `soulmon.revisor@gmail.com`. Domínio próprio só vira necessário se um dia o site mandar e-mail para os inscritos: https://resend.com/domains

## 3. Rodar

No PowerShell, na pasta `E:\Projetos\soulmon-site-beta\site-beta`:

```powershell
powershell -ExecutionPolicy Bypass -File .\LIBERAR-PRODUCAO.ps1
```

O script pede, um de cada vez: a secret do Turnstile, a chave da Resend, o e-mail de aviso (Enter vazio usa `soulmon.revisor@gmail.com`) e a site key do Turnstile. Ele também confirma antes de mexer no banco e antes de publicar (digite `S`).

Para os convites depois de publicado, carregue o salt antes:

```powershell
. .\CARREGAR-SALT.ps1
```
