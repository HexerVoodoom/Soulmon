# Descritores visuais por elemento — relatório (10/11/2026)

Arquivo gerado: `src/utils/elementoDescritores.data.ts` (269 elementos = o catálogo inteiro de poções).

**Regra do dono:** todo elemento tem um kit próprio de assets de combate. Descritor = ~70% do kit do PRÓPRIO elemento + ~30% dos elementos que o compõem
(combinados: `with hints of <forma de cada componente>` e `with <cor de cada componente> accents`; elemento simples = só o próprio).

## De onde veio o descritor próprio (70%)
- imagem do kit (ícone + FX): 188 elementos
- texto: registro.jsonl: 61 elementos
- texto: ASSETS-A-GERAR.md: 20 elementos

- Texto-fonte: prompts de FX (`registro.jsonl`: paleta em hex → nome da cor, motivo traduzido) e a tabela de assets por elemento (`docs/ASSETS-A-GERAR.md`).
- Imagem do kit: ícone `src/assets/soulmon/elementos/el-<id>.png` + FX `fx-ataque/fx-<id>-{orb,impact,aura}.png`, lidos em folhas de contato (sem copiar assets);
  a forma e a paleta são o que está desenhado, sem acréscimos. O cenário de combate foi ignorado: 97 elementos nem têm cenário próprio e o dos outros é um fundo genérico.

## Exceções (elementos sem kit → fallback só nome)
Nenhuma entre os 269 do catálogo: todos têm ícone e FX. Fora do catálogo (16 ids do class-system sem poção, ex.: `abominacao`, `eclipse`, `big_bang`) os descritores do registro foram descartados.

## Limites
- Os descritores de imagem são leitura visual (modelo) de ícones/FX pixel-art, não prompts originais: podem descrever o símbolo do ícone mais do que a criatura.
- Verde pode aparecer (ex.: Sabá via vileza); o prompt troca o fundo chroma para magenta.
- Elementos simples: 20.
