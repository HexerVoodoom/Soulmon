# migrations/ — o schema do D1, versionado

Até 26/08/2026 o único schema do banco D1 deste projeto vivia como um bloco de
SQL solto dentro de `docs/BILLING-SETUP.md`, para ser colado à mão. Nada no
repositório dizia qual era a forma real da tabela em produção, e uma mudança de
coluna não tinha onde ser registrada. Este diretório existe para fechar isso.

Regras:

- **Ordem numérica, uma vez cada.** `0001`, `0002`, … Aplicar fora de ordem
  quebra, porque cada arquivo assume o estado deixado pelo anterior.
- **Migração aplicada não se edita.** Se o resultado estiver errado, escreve-se
  a próxima. Editar uma que já rodou faz o arquivo mentir sobre o banco.
- **Toda migração declara o que acontece com as linhas existentes**, no
  cabeçalho do próprio arquivo. Um banco vazio não é o caso interessante.

Aplicar (o binding é `DB`, banco `soulmon-billing`, ver `docs/BILLING-SETUP.md`) — o caminho
canônico é o **`migrations apply`** do wrangler, que registra o que rodou na tabela
`d1_migrations` do próprio banco e torna a pergunta "está aplicado?" respondível por comando:

```
npx wrangler d1 migrations list  soulmon-billing --remote   # o que falta
npx wrangler d1 migrations apply soulmon-billing --remote   # aplica em ordem, uma vez cada
```

Prova de feito: `migrations list` vazio, e
`npx wrangler d1 execute soulmon-billing --remote --command "PRAGMA table_info(order_claims)"`
listando `expires_at`.

⚰️ **Este README mandava `d1 execute --remote --file <arquivo>` por migração** (até 22/09/2026).
Os dois caminhos coexistiam e **colidem**: um banco migrado à mão pelo `execute` e depois
submetido ao `apply` tenta o `0002` de novo e falha em *duplicate column* (o `0001` é
`IF NOT EXISTS` e passa; o `0002` não tem `ADD COLUMN IF NOT EXISTS`). Se isso acontecer, o
erro é a prova de que já estava aplicado — registre as duas como aplicadas
(`wrangler d1 migrations` não tem "mark applied"; o jeito é `INSERT` manual em `d1_migrations`
com o nome do arquivo, com aval do dono). Não use mais o `execute --file` para migração.

**Estado medido em 22/09/2026** (QA Rodada 2, `docs/reviews/2026-09-22-qa-rodada-2/05-operador-governanca-r2.md`
§1.1): `migrations list … --remote` → `0001_order_claims.sql` e `0002_order_claims_expires_at.sql`
**pendentes** — a tabela não existe em produção. Enquanto isso, `claimOrder` desvia para
`claimOrderAtomic` (o binding `DB` existe) e a 1ª compra Play daria **500** (o `DELETE` inicial
está fora do `try`); o `try/catch` com fallback para o KV está em correção. Aplicar é do dono ou
do operador com aval (pergunta #65 em `docs/PERGUNTAS-DO-DONO.md`).
