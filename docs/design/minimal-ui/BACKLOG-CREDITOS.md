# Backlog de geração — créditos Higgsfield

Tudo que depende de gerar imagem fica aqui, com o custo, pra gente somar no fim e recarregar uma vez só.
Preço medido em 23/09/2026 (`higgsfield generate cost`), modelo `gpt_image_2`, sempre `--background transparent`
quando a peça precisa de alfa (regra máxima — ver memória `assets-transparencia-real`):

| Qualidade | Custo |
|---|---|
| alta 2k (padrão dos assets aprovados) | **6,5 cr** |
| média 1k (rascunho/provisório) | 1 cr |
| baixa 1k | 0,5 cr |

Regra: tudo que vai ficar no app sai em **alta 2k**. Média só para testar ideia.

## Pendentes

| # | Item | Onde entra | Qualidade | Custo |
|---|---|---|---|---|
| 1 | NPC carneiro paladino | Conquistas (Mercado) | alta | 6,5 |
| 2 | NPC serpente-esqueleto do pântano, mago vermelho | Masmorra (Exploração) | alta | 6,5 |
| 3 | NPC gata egípcia + russa (elegante, sem sexualizar) | sem loja ainda | alta | 6,5 |
| 4 | NPC caranguejo ferreiro de lava e gelo | futura forja/oficina | alta | 6,5 |
| 5 | Refazer em alta: NPC gnomo cogumelo cyber | Itens | alta | 6,5 |
| 6 | Refazer em alta: NPC panda-vermelho + porco-espinho | Decoração | alta | 6,5 |
| 7 | Refazer em alta: NPC fada-sereia | Background | alta | 6,5 |
| 8 | Fundo 9:16 da Arena (`bg-arena-v4-916`) | Arena | alta | 6,5 |
| 9 | Fundo 9:16 do Laboratório (interior da árvore, 1 lote) | Laboratório | alta | 6,5 |
| 10 | Fundo 9:16 do Hall (templo etéreo) | Hall | alta | 6,5 |
| 11 | Ícones dos itens da mochila (folha: maçã, 3 chips, coraçãozinho, Glitchtama…) | Mochila | alta | 6,5 |
| 12 | Ícone de sol (pet acordado) + variações de estado da lua | Home | alta (folha) | 6,5 |
| 13 | Folha de 5 insígnias de faixa do Torneio (Semente, Broto, Guardião, Ancião, Lendário) | Modal Torneio | alta (folha) | 6,5 |
| 14 | Folha de moedas: Bits, Honra/Emblema, Créditos (ícones pixel, contorno preto) | todas as telas | alta (folha) | 6,5 |
| 15 | Folha de ícones de atributo/elemento: Poder, Harmonia, Benevolência + habilidade | Modal Duelo, Laboratório | alta (folha) | 6,5 |
| 16 | Folha de andares/drops da Masmorra: porta de andar, baú, Glitchtama, coraçãozinho | Modal Masmorra | alta (folha) | 6,5 |
| 17 | Retratos de oponente para o Duelo (folha de 6 bustos pequenos) | Modal Duelo | alta (folha) | 6,5 |

**Total pendente: 17 × 6,5 = 110,5 cr**

Margem para refações (o histórico desta sessão foi ~1 refação a cada 2 peças): **+40 cr**
→ **recarga sugerida: ~160 cr**

## Já gasto nesta frente (referência)

~422 cr em 23/09/2026: construções v1→v5, fundos v4, kit de UI, ícones, NPCs v1→v3.

## Como adicionar

Toda vez que surgir uma peça nova que precise de geração: uma linha na tabela, com onde entra e o custo,
e atualizar o total. Assets prontos vivem em `E:/Soulmon-assets/iso-20260923/` (originais) e são copiados
redimensionados para `product/squad-minimal-ui/propostas/<área>/arte/`.

## Decisões pendentes que mexem em arte

- Moeda do Torneio: no jogo real é **Emblemas** (campo `emblems`, CLAUDE.md); nos mocks virou **Honra** a pedido do dono. Definir antes de gerar a folha de moedas (#14).
