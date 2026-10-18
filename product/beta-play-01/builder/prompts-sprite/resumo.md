# Resumo comparativo dos prompts de sprite (beta-play-01)

| Usuário | Elemento | Papel | Reino | Caminho | Forma | Chars | Cor (colorDesc) | Acento | Inspiração (bestiário) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | fogo+industrial | fisico | deserto | power | rookie  | 801 | sunset orange and molten-gold | red | Spider Ancião |
| 1 | fogo+industrial | fisico | deserto | power | champion-power  | 840 | sunset orange and molten-gold | red | Chelicerae |
| 1 | fogo+industrial | fisico | deserto | power | ultimate-power  | 846 | sunset orange and molten-gold | red | Deathweaver |
| 1 | fogo+industrial | fisico | deserto | power | mega-power  | 854 | sunset orange and molten-gold | red | Spidoc Vermelho |
| 1 | fogo+industrial | fisico | deserto | power | ultra  | 872 | sunset orange and molten-gold | red, cyan and gold | Ettercap |
| 1 | fogo+industrial | fisico | deserto | power | champion-harmony (ramo comparação) | 840 | sunset orange and molten-gold | cyan | Chelicerae |
| 1 | fogo+industrial | fisico | deserto | power | champion-benevolence (ramo comparação) | 848 | sunset orange and molten-gold | gold | Chelicerae |
| 2 | sombra | magico | akasha | harmony | rookie  | 815 | midnight blue and smoky black | cyan | Agumon -Yuki no Kizuna- |
| 2 | sombra | magico | akasha | harmony | champion-harmony  | 839 | midnight blue and smoky black | cyan | Doomguard Guerreiro |
| 2 | sombra | magico | akasha | harmony | ultimate-harmony  | 853 | midnight blue and smoky black | cyan | Demônio do Círculo Radiação |
| 2 | sombra | magico | akasha | harmony | mega-harmony  | 865 | midnight blue and smoky black | cyan | Belphemon(Rage Mode) |
| 2 | sombra | magico | akasha | harmony | ultra  | 866 | midnight blue and smoky black | red, cyan and gold | Eligor Divino |
| 2 | sombra | magico | akasha | harmony | champion-power (ramo comparação) | 843 | midnight blue and smoky black | red | Doomguard Guerreiro |
| 2 | sombra | magico | akasha | harmony | champion-benevolence (ramo comparação) | 847 | midnight blue and smoky black | gold | Doomguard Guerreiro |
| 3 | agua+planta | suporte | oceano | benevolence | rookie  | 816 | turquoise and pearl-white | gold | Puffy Verde |
| 3 | agua+planta | suporte | oceano | benevolence | champion-benevolence  | 839 | turquoise and pearl-white | gold | Goldeen |
| 3 | agua+planta | suporte | oceano | benevolence | ultimate-benevolence  | 857 | turquoise and pearl-white | gold | Tubarão Negro |
| 3 | agua+planta | suporte | oceano | benevolence | mega-benevolence  | 869 | turquoise and pearl-white | gold | Tubarão Veneno |
| 3 | agua+planta | suporte | oceano | benevolence | ultra  | 871 | turquoise and pearl-white | red, cyan and gold | Skrelp |
| 3 | agua+planta | suporte | oceano | benevolence | champion-power (ramo comparação) | 856 | turquoise and pearl-white | red | Goldeen |
| 3 | agua+planta | suporte | oceano | benevolence | champion-harmony (ramo comparação) | 855 | turquoise and pearl-white | cyan | Goldeen |

## O que muda entre formas (mesma criatura)

Só três fatias variam: (a) `levelBlock` (forma corporal sorteada por alinhamento/estágio), (b) acento de cor (por alinhamento: poder=red, harmonia=cyan, benevolência=gold; ultra=red, cyan and gold), (c) a "inspiração" do bestiário (por ESTÁGIO, igual nos 3 ramos). O conceito (`earth elemental-eel, Berserker, ...`), a paleta-base e toda a moldura são idênticos.

| Usuário | Forma | levelBlock |
|---|---|---|
| 1 | rookie | a tiny bouncy body |
| 1 | champion-power | it has evolved into a haunted marionette with living strings |
| 1 | ultimate-power | it has transformed into a chained war minotaur with cracked horns |
| 1 | mega-power | in its final form, it is a dragon overlord clad in black spiked armor |
| 1 | ultra | a towering tri-part fusion silhouette, the ultra fusion of its three mega forms |
| 1 | champion-harmony | it has evolved into a proud beast with a blazing flame mane |
| 1 | champion-benevolence | it has evolved into a gentle snow yeti guardian with icicle bracers |
| 2 | rookie | small and simple with a big head |
| 2 | champion-harmony | it has evolved into a mystic fox with multiple flowing tails |
| 2 | ultimate-harmony | it has transformed into an enigmatic sphinx posing eternal riddles |
| 2 | mega-harmony | in its final form, it is a world-tree avatar with continents of moss on its shoulders |
| 2 | ultra | a towering tri-part fusion silhouette, the ultra fusion of its three mega forms |
| 2 | champion-power | it has evolved into a hooded venomous serpent with dripping fangs |
| 2 | champion-benevolence | it has evolved into a giant dawn songbird with radiant tail feathers |
| 3 | rookie | a pint-sized simple shape |
| 3 | champion-benevolence | it has evolved into a flower dragon with petal wings |
| 3 | ultimate-benevolence | it has transformed into a glacier maiden crowned with aurora ice |
| 3 | mega-benevolence | in its final form, it is an aurora stag god with antlers of northern lights |
| 3 | ultra | a supreme combined silhouette, the ultra fusion of its three mega forms |
| 3 | champion-power | it has evolved into a savage four-legged wolf beast with bristling fur |
| 3 | champion-harmony | it has evolved into a sleek quadruped beast with a blade-tipped tail |

## Problemas de qualidade observados (nada foi alterado no repo)

1. **Incoerência conceito x forma (maior).** O `concept` (ex.: "earth elemental-eel, Berserker, polluted") é igual nas 11 formas, mas o `levelBlock` sorteia um molde sem relação com ele ("haunted marionette", "dragon overlord", "snow yeti", "life goddess"). O gerador recebe duas descrições de espécie brigando; só a imagem de referência (image2image) segura a identidade, e ela é só 1 imagem (a forma anterior). Ajuste: citar a espécie-base no levelBlock ("an evolved form of the same creature, now resembling X") e/ou repetir um traço-âncora (cabeça/crista/cor) em todas as formas.
2. **Identidade vs. ramo.** Os 3 ramos do mesmo estágio só diferem em levelBlock e acento (red/cyan/gold). Elemento (fogo, sombra, água) NÃO entra no texto do prompt, só na paleta; o usuário 1 (fogo) recebe "snow yeti with icicle bracers" no ramo benevolência. `pickShape` pesa por elemento, mas o texto final não menciona o elemento.
3. **Risco de IP real.** A "inspiração" do bestiário injeta nomes de personagens registrados no prompt principal: "Agumon -Yuki no Kizuna-", "Belphemon(Rage Mode)" (usuário 2), "Goldeen", "Skrelp" (usuário 3), "Doomguard", "Ettercap", "Deathweaver", "Eligor". Somado à lista de 12 franquias, a frase "Do not copy any existing franchise character" briga com "Draw inspiration from Agumon". É decisão do dono (D-B1, 27/09), mas: (a) `baseDeInspiracao` não tira sufixos como "-Yuki no Kizuna-" e "(Rage Mode)"; (b) nomes em PT ("Ancião", "Vermelho", "Guerreiro", "Tubarão Negro") entram num prompt em inglês; (c) a recusa do provedor só é detectada em 400/422 do Higgsfield. Sugestão: filtrar por lista de marcas conhecidas da base antes de montar, ou trocar o nome por descrição de biologia.
4. **Inspiração muda por estágio, não por ramo.** Cada estágio recebe um bicho diferente (usuário 1: Spider Ancião, Chelicerae, Deathweaver, Spidoc Vermelho, Ettercap), o que puxa a arte para direções diferentes a cada evolução, contra a consistência de personagem.
5. **"Fundo transparente" não existe no provedor.** O prompt pede "no background, transparent background", mas o Higgsfield Soul devolve imagem opaca (1536x1536); o cliente remove só fundo CLARO conectado às bordas. Sem chroma verde (#00FF00). Sprite com fundo colorido/xadrez baked sai sujo. Sugestão: pedir "plain solid white background" (que o `removeLightBackground` entende) ou migrar para chroma.
6. **"16x16 pixel art" é pedido a um modelo que gera 1536x1536.** Termos como "no anti-aliasing", "no shading", "no outlines" tendem a ser ignorados; a pixelização real vem do cliente (grid 16, 4 cores). Resultado de 4 cores com palavra "Flat colors... distinct colors" é contraditório com "Grayscale acceptable".
7. **Direção.** `SPRITE_FACING_PROMPT` ("faces RIGHT ... never facing left") ficou posicionada depois do levelBlock e antes das cores: bom e presente nas 11 formas. Risco: modelos de imagem tratam negação ("never facing left") mal, e "toward the right edge of the image" convive com forma frontal/andrógina (unidades "tri-part fusion silhouette" no ultra, deusa/esfinge de frente). Sugestão: reforçar para o ultra "in profile, facing right".
8. **Comprimento.** 801 a 879 caracteres; ~330 só da lista de 12 franquias. A lista dilui o conceito (60-80 caracteres úteis). O fallback (~470-540 chars) é mais denso.
9. **Ultra.** "the ultra fusion of its three mega forms" não diz quais são as 3 mega do jogador, e a referência anexada é só o mega atual (não os 3 ramos). A fusão não tem como ser fiel. Acento do ultra é fixo "red, cyan and gold" nas 3 pessoas.
10. **Cota.** `_aiGuard.js`: perFormLifetime=1, perAccountLifetime=15 (11 formas cabem; sobram 4 para reroll/retry). O cabeçalho de `generate-sprite.js` ainda fala em "as 3 tentativas" (comentário velho, discrepância). Fallback Gemini só liga com `SPRITE_GEMINI_IMAGE` (flag; sem ela fica fora). A recusa com troca de prompt (fallback) conta como UMA geração.
11. Termos em PT na saída (nome-base do bestiário, "Ancião") e conceitos de classe ("Berserker", "Void Mage", "Tide Priestess") podem ser lidos pelo gerador como nomes de personagens de jogos (Warcraft, FF).
