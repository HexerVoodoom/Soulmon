# Auditoria de direção da arte dos gratuitos e das linhas (14/10/2026)

Pedido do dono: "os Soulmons da versão gratuita estão pro lado errado". Convenção do app: a arte é tratada como virada à **DIREITA**
(`SPRITE_FACING_PROMPT`); `artFacesLeft` (`src/utils/sprites.ts`) marca a que nasceu virada à **esquerda** e o espelho do passeio
(`mirrorSprite`, `src/utils/spritePose.ts`) corrige. Método: inspeção visual sprite a sprite (folhas de contato Pillow, 256–380 px) —
cabeça/rosto/bico/chifres contra rabo/costas. **Nenhum PNG foi alterado** (a correção é metadado), logo nenhum hash/guard de asset mudou.

## Os 5 iniciais (os "gratuitos" da demo) — um sprite só em todas as formas

| id | nome | lado original | antes | correção |
|---|---|---|---|---|
| `industrial` | Crato | de frente (pilha de caixotes) | direita (ok) | — |
| `nascente` | Brooka | direita (bico à direita) | direita (ok) | — |
| `alento` | Zefi | de frente (asas abertas) | direita (ok) | — |
| `vida` | Oaken | de frente | direita (ok) | — |
| `meteoro` | Bolid | **ESQUERDA** (rosto e pernas à esquerda, rabo de brasas à direita) | direita (**errado**: andava de costas) | `LEFT_FACING_STARTERS` = `{meteoro}` |

## As 9 linhas (`DUNGEON_LINE_SPRITES`, inimigos da masmorra, NPCs e personagens prontos antigos)

| linha | nome | lado original | declarada hoje | correção |
|---|---|---|---|---|
| `ignar` | Ignar | direita (tricerátops, chifres à direita) | direita | — |
| `lumel` | Lumel | de frente | direita | — |
| `serah` | Serah | de frente | direita | — |
| `kaelen` | Pyraka | esquerda | esquerda (`LEFT_FACING_LINES`) | — |
| `orrin` | Akashai | de frente (escudo/cajado) | direita | — |
| `thalindra` | Nimbrata | de frente | direita | — |
| `igni` | Igni | esquerda (estegossauro) | esquerda | — |
| `nautilu` | Nautil | esquerda | esquerda | — |
| `astrase` | Astria | de frente | direita | — |

Conferido: as quatro formas de cada linha (rookie → mega) olham para o mesmo lado dentro da linha.

## O que mudou no código

- `LEFT_FACING_STARTERS` + ramo de `artFacesLeft` para iniciais (Home, passeio e overlay do desktop herdam: ambos leem `artFacesLeft`).
- **Combate**: o `BattleStage` só recebia a URL do sprite e nunca olhava a orientação da arte (eu = sem espelho, inimigo = espelhado).
  `spriteUrlFacesLeft(url)` (`src/utils/sprites.ts`) inverte o espelho para arte de perfil esquerdo, nos dois lados do palco. Sprite
  próprio gerado (acervo) segue tratado como direita.
- Teste: `sprites.facing.test.ts` (iniciais e URL).

## Por que o dono não achava o controle "Virar Soulmon"

Não havia condição de tier: `SpritePoseRows` aparece em Configurações › Aparência para qualquer jogador. O problema era **descoberta** —
dois toques fundo numa tela de conta. Agora o mesmo controle (mesma linha, mesma escrita `applySpritePose`) também aparece na página
do **Pet** (`data-testid="pet-virar"`), para todos os tiers.

## Dúvida que fica com o dono

- Se o "lado errado" que ele viu era outro bicho além do Bolid: pelas imagens, os demais iniciais olham de frente ou à direita, e o
  controle "Virar" resolve qualquer caso residual (inclusive para arte gerada).
