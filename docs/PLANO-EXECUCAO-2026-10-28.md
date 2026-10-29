# Plano de execução — 28/10/2026 (noite)

Ordem pensada para: (1) destravar o que só o dono decide primeiro, (2) usar o PC liberado
enquanto ele está livre, (3) gastar Opus só em orquestração e revisão.

## Modelos (custo × benefício)

| Papel | Modelo | Quando |
|---|---|---|
| Orquestrar, decidir, revisar diff, integrar/merge | **Opus** (sessão principal) | sempre, pouco texto |
| Código, testes, docs técnicos | **Sonnet** (subagente, worktree próprio em D:) | toda implementação |
| GUI mecânica no PC (ChatGPT: colar prompt, esperar, baixar, renomear) | **Haiku** (subagente com computer-use) | lote de imagens |
| Leitura/resumo em massa, rascunho | **Sonnet** só-leitura (ou `agy` flash via ai-hub) | varreduras |
| Segunda opinião de código | `codex_review` (ai-hub) só em mudança de servidor/dinheiro | raro |

## Ordem

1. **Dúvidas do dono em modal** (Opus, agora): fila aberta de `PERGUNTAS-DO-DONO.md`, `DEPENDE-DE-VOCE.md`, essências. Respostas viram REGISTRO.
2. **Verificação visual no Browser pane** (Opus/Sonnet, sem o PC do dono): viewport 375×812 —
   pés na plataforma (Arena, Fenda, Torneio contra simulado, Chefe da Feira com flag local), voltar/título dos minijogos, anel da casinha. Prints para o dono.
3. **PC liberado → geração no ChatGPT** (Haiku + computer-use, Opus confere cada imagem):
   prompts em `docs/PROMPTS-CHATGPT-2026-10-28.md`, na ordem do arquivo (selo de recorde e o que destrava código primeiro; ícones pequenos em folha).
   Download em `E:\dowload`; conferir hash e alfa real; instalar (Sonnet) com o resolvedor de cada asset.
4. **Em paralelo à geração, código (Sonnet, worktrees separados, arquivos que não colidem):**
   - a. Essências dos elementos (depois das respostas do modal).
   - b. Feira: elemento da alma no `feiraMe` + teste ponta a ponta com `FEIRA_CHEFE_DESDE` local (sem ligar em produção).
   - c. Troféu `trophy-boss-<id>` no catálogo.
   - d. D-03: encurtar ~44 textos longos (Sonnet; pode ir em `agy` se a cota Claude apertar).
5. **Portões + build + merge na `main`** (Opus): `tsc`, testes tocados, suíte completa 1× com a máquina parada, `sw.js` +1, build, push.
6. **Depois (não cabe hoje / depende de outro recurso):** FX Fase 2 (A/B do dono), D-01 Kotlin (disco no C:), passos/rodada 5 (Play/AAB), testes vermelhos herdados.

## O que o Claude consegue fazer controlando o PC

- App **ChatGPT** desktop: colar prompts, anexar referência, esperar, baixar — tudo (tier full).
- **File Explorer**: mover/renomear downloads.
- **Chrome**: só ver por computer-use; para clicar use a extensão Claude in Chrome (Play Console, Higgsfield).
- **Não consegue**: ouvir os sons, testar no celular físico, aprovar diálogos de permissão por você.
