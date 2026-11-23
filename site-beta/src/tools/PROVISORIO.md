# Peças trocáveis do site

A fonte única é `src/content/assets.json`. Para trocar uma peça: colocar `<gerado>.png` em
`E:\Soulmon-marketing\site-assets\` e rodar `node src/tools/preparar-site-assets.mjs`. O estado vira
`aguarda-revisao`; só a revisão humana da squad-design marca `final`. O layout não muda.

Estados: `final`, `aguarda-revisao`, `provisorio` (SVG desenhado por script), `provisorio-css` (sem arquivo; a borda fina
só segura o lugar e não é solução final).

Fora do manifesto, ainda provisórios: `public/provisorio/chama.svg` e as capas de Combina 3, Soul Barrage e Corrida
na aba Jogos (ícone e sprites reais, porque essas atividades não têm arte própria instalada).
