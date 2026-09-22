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

## ⚰️ A lápide do `d1 execute --remote --file` — e o estrago que ele fez de verdade

**Este README mandava `d1 execute --remote --file <arquivo>` por migração**, até
22/09/2026. Os dois caminhos coexistiam e **colidem**: um banco migrado à mão pelo
`execute` e depois submetido ao `apply` tenta o `0002` de novo e falha em
*duplicate column* (o `0001` é `IF NOT EXISTS` e passa; o `0002` **não** tem
`ADD COLUMN IF NOT EXISTS`).

**Isto não é hipótese: foi exatamente o que aconteceu.** Ao aplicar em
**22/09/2026** (registro do dono **#65**), o `0002` falhou com
`duplicate column name: expires_at` — a tabela já existia com a coluna, criada
por aquele caminho antigo, e **sem registro nenhum em `d1_migrations`**. O erro
foi a **prova de que já estava aplicado**, e o `0002` foi **marcado como
aplicado** (`wrangler d1 migrations` não tem "mark applied"; o jeito é `INSERT`
manual em `d1_migrations` com o nome do arquivo, com aval do dono).

**Por que a lápide fica aqui em vez de a linha simplesmente sumir:** o dano do
`execute --file` é que ele muda o banco **sem deixar rastro no próprio banco**.
A pergunta "está aplicado?" deixa de ser respondível por comando e passa a
depender de alguém lembrar. Quem reintroduzir esse caminho — por achar mais
direto, ou por copiar um README de outro projeto — recria o mesmo estado, e a
próxima pessoa gasta a mesma tarde. **Não use `execute --file` para migração.**
Ele continua servindo para **consulta** (`--command "PRAGMA table_info(…)"`),
que é leitura.

## Estado em produção — ✅ aplicado em 22/09/2026

| | |
|---|---|
| `0001_order_claims.sql` | ✅ aplicada |
| `0002_order_claims_expires_at.sql` | ✅ marcada como aplicada (ver a lápide acima) |
| `PRAGMA table_info(order_claims)` | ✅ **4 colunas**, com `expires_at` |
| `migrations list … --remote` | ✅ **"No migrations to apply"** |

Com a tabela no ar, `claimOrderAtomic` encontra o que precisa e **a 1ª compra da
Play não devolve mais 500**. ⚰️ Até a manhã de 22/09/2026 este parágrafo dizia
que as duas estavam **pendentes** e que a tabela **não existia em produção**
(QA Rodada 2, `docs/reviews/2026-09-22-qa-rodada-2/05-operador-governanca-r2.md`
§1.1) — medição correta para o `d1_migrations`, e enganosa sobre a tabela, que
existia por fora dele. Ver `docs/PLAY-LANCAMENTO.md` §E.4 e `docs/STATUS.md` §3.2.
