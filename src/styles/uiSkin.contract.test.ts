/**
 * Guard das duas interfaces (`data-ui="arte"` | `"minimal"`, ver DESIGN-GUIDE
 * "Duas interfaces"): regra de ARTE só vale sob `html[data-ui="arte"]`.
 *
 * "Regra de arte" = declaração com `url(...)` de um arquivo de
 * `assets/soulmon/ui/` (png/webp) em `src/index.css`. Ela está "no escopo"
 * quando TODO seletor da lista do bloco mais externo começa por
 * `html[data-ui="arte"]`. A base de tokens É a minimalista: sem o escopo, a
 * pele minimalista baixaria a arte só por estar referenciada no CSS.
 *
 * ALLOWLIST CONGELADA: as regras que já existiam antes da chave (fase 1,
 * 24/11/2026) ficam em `FORA_DO_ESCOPO_HOJE`, para o guard não reprovar o que
 * já existe. Ela só pode ENCOLHER:
 *  - regra de arte NOVA fora do escopo e fora da lista  => teste vermelho;
 *  - entrada da lista que deixou de ser violação (migrada ou apagada) => teste
 *    vermelho, mandando remover a entrada (não sobra permissão morta);
 *  - a lista não pode passar de `TETO` (baixe o número ao remover entradas).
 *
 * COMO MIGRAR UMA REGRA (fase 2): em `src/index.css`, prefixe o seletor com
 * `html[data-ui="arte"] ` (todos os seletores da lista, se houver vírgula) —
 * sem mudar a declaração — e apague a linha correspondente de
 * `FORA_DO_ESCOPO_HOJE` e baixe `TETO`. A chave de cada entrada é
 * `seletor => arquivo` (aninhado: `externo >> interno`).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');

const ESCOPO = 'html[data-ui="arte"]';
const ARTE_URL = /url\(\s*['"]?([^'")]*assets\/soulmon\/ui\/[^'")]+\.(?:png|webp))['"]?\s*\)/g;

/** Percorre o CSS (com blocos aninhados) e devolve cada `url()` de arte com a cadeia de seletores. */
export function regrasDeArte(fonte: string): { cadeia: string[]; arquivo: string }[] {
  const texto = fonte.replace(/\/\*[\s\S]*?\*\//g, '');
  const pilha: string[] = [];
  const achados: { cadeia: string[]; arquivo: string }[] = [];
  let buf = '';
  const declaracao = () => {
    for (const m of buf.matchAll(ARTE_URL)) {
      achados.push({ cadeia: pilha.filter(s => !s.startsWith('@')), arquivo: m[1].replace(/^.*assets\/soulmon\/ui\//, '') });
    }
    buf = '';
  };
  for (const ch of texto) {
    if (ch === '{') { pilha.push(buf.trim().replace(/\s+/g, ' ')); buf = ''; }
    else if (ch === '}') { declaracao(); pilha.pop(); }
    else if (ch === ';') declaracao();
    else buf += ch;
  }
  return achados;
}

const noEscopo = (cadeia: string[]) =>
  cadeia.length > 0 && cadeia[0].split(',').every(s => s.trim().startsWith(ESCOPO));

const chave = (r: { cadeia: string[]; arquivo: string }) => `${r.cadeia.join(' >> ')} => ${r.arquivo}`;

const violacoes = () => [...new Set(regrasDeArte(css).filter(r => !noEscopo(r.cadeia)).map(chave))];

/** Congelada em 24/11/2026. Só encolhe. */
const FORA_DO_ESCOPO_HOJE: readonly string[] = [
  ".sm2-elem-carta => carta-elemento.webp",
  ".sm2-moldura-modal--files .sm2-moldura-modal__topo => files/files-topo.webp",
  ".sm2-moldura-modal--files .sm2-moldura-modal__base => files/files-base.webp",
  ".sm2-moldura-modal--files .sm2-moldura-modal__lado--e => files/files-lado-e.webp",
  ".sm2-moldura-modal--files .sm2-moldura-modal__lado--d => files/files-lado-d.webp",
  ".sm2-moldura-modal--aco .sm2-moldura-modal__topo => hex-moldura/aco-topo.webp",
  ".sm2-moldura-modal--aco .sm2-moldura-modal__base => hex-moldura/aco-base.webp",
  ".sm2-moldura-modal--aco .sm2-moldura-modal__lado--e => hex-moldura/aco-lado-e.webp",
  ".sm2-moldura-modal--aco .sm2-moldura-modal__lado--d => hex-moldura/aco-lado-d.webp",
  ".sm3-files .sm3-mochila-abas button::before => files/files-aba.webp",
  ".sm3-files .sm3-mochila-abas button[data-on]::before => files/files-aba-ativa.webp",
  ".sm3-item-slot => files/files-slot.webp",
  ".sm3-item[data-on] .sm3-item-slot => files/files-slot-sel.webp",
  ".sm3-item-slot[data-disquete] => files/files-disquete.webp",
  ".sm3-item[data-on] .sm3-item-slot[data-disquete] => files/files-disquete-sel.webp",
  ".sm2-cta => btn-cta.webp",
  ".sm2-cta >> &[data-cta-tone=\"acao\"] => btn-cta-hover.webp",
  ".sm2-cta >> &:hover:not(:disabled) => btn-cta-hover.webp",
  ".sm2-cta >> &:active:not(:disabled), &[data-cta-state=\"pressed\"]:not(:disabled) => btn-cta-press.webp",
  ".sm2-cta >> &:focus-visible => btn-cta-hover.webp",
  ".sm2-cta >> &:disabled => btn-cta-off.webp",
  ".sm2-especial => btn-especial.webp",
  ".sm2-especial >> &:active:not(:disabled), &[data-especial-state=\"pressed\"]:not(:disabled) => btn-especial-press.webp",
  ".sm2-especial >> &:disabled => btn-especial-off.webp",
  ".sm2-especial[data-especial-variant=\"pve\"] => btn-pve.webp",
  ".sm2-especial[data-especial-variant=\"pve\"]:active:not(:disabled), .sm2-especial[data-especial-variant=\"pve\"][data-especial-state=\"pressed\"]:not(:disabled) => btn-pve-press.webp",
  ".sm2-especial[data-especial-variant=\"pve\"]:disabled => btn-pve-off.webp",
  ".sm2-especial[data-especial-variant=\"pvp\"] => btn-pvp.webp",
  ".sm2-especial[data-especial-variant=\"pvp\"]:active:not(:disabled), .sm2-especial[data-especial-variant=\"pvp\"][data-especial-state=\"pressed\"]:not(:disabled) => btn-pvp-press.webp",
  ".sm2-especial[data-especial-variant=\"pvp\"]:disabled => btn-pvp-off.webp",
  ".sm2-especial[data-especial-variant=\"ranking\"] => btn-ranking.webp",
  ".sm2-especial[data-especial-variant=\"ranking\"]:active:not(:disabled), .sm2-especial[data-especial-variant=\"ranking\"][data-especial-state=\"pressed\"]:not(:disabled) => btn-ranking-press.webp",
  ".sm2-especial[data-especial-variant=\"ranking\"]:disabled => btn-ranking-off.webp",
  ".sm2-especial[data-especial-variant=\"rift\"] => btn-rift.webp",
  ".sm2-especial[data-especial-variant=\"rift\"]:active:not(:disabled), .sm2-especial[data-especial-variant=\"rift\"][data-especial-state=\"pressed\"]:not(:disabled) => btn-rift-press.webp",
  ".sm2-especial[data-especial-variant=\"rift\"]:disabled => btn-rift-off.webp",
  ".sm2-especial[data-especial-variant=\"rift-sec\"] => btn-rift-sec.webp",
  ".sm2-especial[data-especial-variant=\"rift-sec\"]:active:not(:disabled), .sm2-especial[data-especial-variant=\"rift-sec\"][data-especial-state=\"pressed\"]:not(:disabled) => btn-rift-sec-press.webp",
  ".sm2-especial[data-especial-variant=\"rift-sec\"]:disabled => btn-rift-sec-off.webp",
  ".sm2-moldura-modal__lado--e => moldura/painel-lado-e.webp",
  ".sm2-moldura-modal__lado--d => moldura/painel-lado-d.webp",
  ".sm2-moldura-modal__topo => moldura/painel-topo.webp",
  ".sm2-moldura-modal__base => moldura/painel-base.webp",
  ".sm2-moldura-modal--dono .sm2-moldura-modal__lado--e => moldura/npc-lado-e.webp",
  ".sm2-moldura-modal--dono .sm2-moldura-modal__lado--d => moldura/npc-lado-d.webp",
  ".sm2-moldura-modal--dono .sm2-moldura-modal__topo => moldura/npc-topo.webp",
  ".sm2-moldura-modal--dono .sm2-moldura-modal__base => moldura/npc-base.webp",
  ".sm2-moldura-modal--cristal .sm2-moldura-modal__placa => moldura-cristal/placa-titulo-meio.webp",
  ".sm2-moldura-modal--cristal .sm2-moldura-modal__placa::before => moldura-cristal/placa-titulo-esq.webp",
  ".sm2-moldura-modal--cristal .sm2-moldura-modal__placa::after => moldura-cristal/placa-titulo-dir.webp",
];
const TETO = 50;

describe('duas interfaces — arte só sob html[data-ui="arte"]', () => {
  it('AUTOVERIFICAÇÃO: o parser enxerga regras de arte e distingue o escopo', () => {
    const amostra = `
      .a { background: url('./assets/soulmon/ui/x.webp'); }
      html[data-ui="arte"] .b, html[data-ui="arte"] .c { border-image: url("./assets/soulmon/ui/y.png") 1; }
      html[data-ui="arte"] .d, .e { background: url(./assets/soulmon/ui/z.webp); }
      .f { &:hover { border-image-source: url('./assets/soulmon/ui/w.webp'); } }
      .g { background: url('./assets/soulmon/icones-ui/n.png'); }
      @media (hover: hover) { .h { background: url('./assets/soulmon/ui/m.webp'); } }
      /* .i { background: url('./assets/soulmon/ui/c.webp'); } */
    `;
    const r = regrasDeArte(amostra);
    expect(r.map(x => x.arquivo)).toEqual(['x.webp', 'y.png', 'z.webp', 'w.webp', 'm.webp']);
    expect(r.map(x => noEscopo(x.cadeia))).toEqual([false, true, false, false, false]);
    expect(regrasDeArte(css).length).toBeGreaterThan(30);
  });

  it('nenhuma regra de arte NOVA fora do escopo (nem da allowlist)', () => {
    const permitidas = new Set(FORA_DO_ESCOPO_HOJE);
    const novas = violacoes().filter(v => !permitidas.has(v));
    expect(novas, 'regra de arte fora de html[data-ui="arte"]: prefixe o seletor com o escopo (ver cabeçalho)').toEqual([]);
  });

  it('a allowlist só encolhe: sem entrada morta, sem duplicata, sem passar do teto', () => {
    const vivas = new Set(violacoes());
    const mortas = FORA_DO_ESCOPO_HOJE.filter(e => !vivas.has(e));
    expect(mortas, 'entrada já migrada/apagada: remova de FORA_DO_ESCOPO_HOJE e baixe TETO').toEqual([]);
    expect(new Set(FORA_DO_ESCOPO_HOJE).size).toBe(FORA_DO_ESCOPO_HOJE.length);
    expect(FORA_DO_ESCOPO_HOJE.length).toBeLessThanOrEqual(TETO);
  });
});
