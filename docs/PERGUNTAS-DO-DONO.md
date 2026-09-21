# Perguntas para o dono — acumuladas na rodada autônoma (20/09/2026 →)

> Regra do dono (20/09/2026): seguir a melhor sugestão sem travar; o que for decisão
> só dele fica aqui e é perguntado no fim, quando não houver mais nada a fazer sem resposta.
> Cada item traz a decisão PROVISÓRIA já aplicada (para nada ficar parado) e o que muda se ele disser outra coisa.

| # | Pergunta | Provisório aplicado | Se mudar |
|---|---|---|---|
| 1 | **Arte pixel que ainda falta e só a `squad-arte` gera** (≈ 20–30 cr Higgsfield): (a) 36 ícones-ficha 32² (9 linhas × 4 tiers) + 64² para Dino/oponentes (D-J13); (b) miniaturas 1× dos 35 cenários da loja em 96×52 (D-L-R6); (c) auras por elemento 96² (hoje `attackFxArt.auraForElement` é CSS); (d) "Z" de sono em variante clara; (e) glifos pixel de comida/sono do overlay (D-F10). Gero tudo numa rodada 2? | **Transições em código**: ranking usa mini-visor 32 com o sprite reduzido; loja reduz o cenário 800² por CSS; aura CSS; Material `restaurant`/`bedtime` no overlay | Se "sim", rodo `/squad-arte` com a fila §12 do `ASSETS-A-GERAR.md` e troco os fallbacks; se "não", os fallbacks viram definitivos e o doc é fechado |
| 2 | **`bg-gameboy` fugiu do conceito** (LCD retrô virou cena genérica) nas duas gerações. Regerar com outra referência, aceitar como está, ou tirar da loja? | Mantido o 800² atual, à venda | "Regerar" custa 2 cr + revisão sua; "tirar" remove de `backgrounds.ts` e do sorteio da masmorra |
| 3 | **`UnlockNudge` — 440 (canvases Loja/Conta) × 280 (nudge do código)**. O lead padronizou **280** e as folhas foram medidas assim. Confirma 280 em todo lugar? | 280 (`UnlockAccountModal.tsx`, `maxWidth: 280`) | Se 440, é só o número no `UnlockNudge` + refazer as folhas Loja/Conta que o medem |
| 4 | **As quatro divergências código × `CLAUDE.md` (D11, 13/09)** ficaram no código: loja em segmentos, `UnlockNudge` em 6 pontos, microfone = "enviar", marco espera o gesto. O `CLAUDE.md` ainda descreve o antigo ("dois lugares"/"TRÊS"). Posso corrigir o `CLAUDE.md` eu mesmo? | Nada tocado no `CLAUDE.md` (você disse que corrige depois) | "Sim" = um commit de docs, com a régua `filaDeAvisos`/`UnlockNudge` conferida |
| 5 | **Worker de push** (`workers/`) mudou (ícone/cor/copy do push, `e3851a92`) e **não builda no push da `main`** — precisa de `wrangler deploy` dentro de `workers/` com a sua conta. Eu rodo, ou você? | Não deployado; produção manda o push antigo | Se eu rodar, preciso que o `wrangler login` esteja feito nesta máquina |
| 6 | **Bump do `CACHE_VERSION`**: hoje `public/sw.js` está em v146 e a Fase 2 trocou HTML/CSS/assets em massa. Já bumpo para v147 no próximo commit? | Não bumpado (cada leva anterior bumpou a sua) | Sem bump, quem já abriu o app fica com CSS velho até o SW atualizar sozinho |
| 7 | **Worktrees antigos removidos** (`.claude/worktrees/agent-a093c7e1bab3f09ae` = `fix/tier-gate-generate-sprite`, `agent-a4c6bc875962d5f25`) para o guard do Supabase passar. As branches continuam no git. Apago as branches também? | Branches mantidas | `git branch -D` das duas se você confirmar que o conteúdo já entrou na `main` |

## Respostas (21/09/2026)

Todas as sete respondidas em modal, sempre pela recomendada: (1) rodada 2 gerada — R2-1…R2-4 derivados sem crédito (`118131f4`, `66e32d43`), R2-5 glifos (`02d483af`), R2-6 `bg-gameboy` regerado (`b52fa074`, 7 cr); (2) idem; (3) `UnlockNudge` 280; (4) `CLAUDE.md` corrigido (`26c7aab0`); (5) push scheduler deployado (`digiapp-push-scheduler`, versão `e90f05a6`); (6) `CACHE_VERSION` v147 → v148 na rodada 2; (7) branches apagadas (0 commits fora da `main`). Fila vazia.

## SQUAD-SOM (21/09/2026)

| # | Pergunta | Provisório aplicado | Se mudar |
|---|---|---|---|
| 8 | **Ouvir o A/B cego** — `E:/Soulmon-assets/som-01/ab/escuta.html`: 3 pares × 3 perguntas, alto-falante do celular primeiro e fone depois, volume fixo; salvar os dois `ab-respostas-*.json` na pasta `ab`. **Não abrir `ab-mapa-cego.md` antes.** | S10 intacta: procedural vigente, nenhum byte de áudio no repo | IA vence P1 em ≥2 de 3 nas duas condições → lote entra sob S6/S9 + `Attributions.md` no mesmo commit + `CACHE_VERSION` +1; empate/derrota → S1 cai para SFX (registro §6.1) |
| 9 | **Quatro candidatos saíram fora da janela de corte** (`presence` ×2, `shower`, `sleep`: +20,7 a +31,8 dB de ganho pós-corte, acima do limite de plausibilidade de 20 dB — o gerador entrega 1,6–1,7 s e o corpo do som fica fora dos 120/200 ms). E **`transaction` foi RECUSADO duas vezes** por crista inconsertável (7,9 e 15,2 dB > 6,0): o prompt pede *"dry muted click"*, e click é, por definição, crista alta — é conflito prompt × spec, não sorte. Regero os quatro com prompt pedindo *"the entire sound within the first N ms"*? E `transaction`: reescrever o prompt (som seco sem ser click), ou o `som-engenheiro-audio` revê o limite de 6,0 dB da classe Transação? | Nenhum dos cinco entra no lote; `end-zero-2` regenerado APROVOU (0,65 dB de atenuação) | Regerar custa 2,5 cr cada; mudar o limite é decisão do dono único do número |

## Respostas SQUAD-SOM (21/09/2026, modal)

#8 **fica aberto** (o dono respondeu "aceito como está": S10 intacta, A/B montado e não ouvido). #9: **regerar os 4** com cláusula de duração no fim do prompt e **reescrever `transaction`** sem click (limite de 6,0 dB mantido) — variantes v2 em `pacote-prompts.md` §2.13. Instalação, se a IA vencer: **só os 3 vencedores primeiro**.

**Resultado das v2 (21/09/2026, 4 gerações, saldo 429,35 cr) — achado, não conserto.** A cláusula de duração no fim do prompt **funcionou** (o gerador devolveu exatamente 0,200 s em vez de 1,7 s), mas o som que cabe em 120–200 ms sai **quase mudo**: −55,6 / −40,5 / −56,9 LUFS-M cru, ou seja, ganho pós-corte de **+39,7 / +21,9 / +39,1 dB** — pior que antes (crista no teto de 12,0 nos três). `transaction-v2`, sem click, **RECUSADO pela 3ª vez** (10,3 dB > 6,0). Leitura: o `seed_audio` não entrega, dentro da spec, os quatro sons **curtos e secos** do lote (Cuidado ×3, Transação) — ele é bom nos longos (Marco, Degeneração, Conclusão a 1 s). Paro de regerar (3 tentativas é o teto da regra do `CLAUDE.md`). **Nova pergunta #10:** para Cuidado e Transação, (a) manter procedural mesmo que a IA vença o A/B (híbrido já admitido na alternativa que perdeu da S1), ou (b) gerar longo (1–2 s) e cortar por envelope, aceitando que o "som" é um recorte? Provisório: **(a)**.

**Fechado pelo dono em 21/09/2026 ("resolva tudo e tenha tudo pronto e mergeado"):** #8 continua sendo dele
(ouvir o A/B) mas deixou de bloquear — S16 instalou os assets "só pra ter pronto"; #9 e #10 resolvidos por S16
(curtos ficam procedurais; os três longos e a trilha entraram). A trilha ganhou a **segunda camada** (`ritmo`),
loop em 28,800 s exatos (12 compassos), trim de 2 camadas em `loudness.ts`. Fila vazia.

**#8 respondido (21/09/2026):** "Coloca o A" e, perguntado, **"quero o gerado nos 3"** → os 3 assets de IA ficam. Fila vazia.
