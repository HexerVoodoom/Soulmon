import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// O WIDGET NÃO COBRA — e agora há régua.
//
// A auditoria de 06/09/2026 achou o WP2.6 com o aceite falhando: o widget
// mantinha as três frases que a spec do dossiê mandou REMOVER e recebia as
// duas chaves que ela VETOU. Nada ficava vermelho porque nenhum teste em
// `node` alcança Kotlin — a mesma cegueira que deixou o teto de carinho por
// aparelho (ver o footgun 9).
//
// Este teste lê o FONTE do renderer. É grosseiro de propósito: um guard que só
// sabe ler string ainda é infinitamente melhor que nenhum, e o que ele protege
// é vocabulário, que é justamente o que se lê.
//
// Por que o widget importa mais que qualquer tela: ele é visto dezenas de
// vezes por dia sem que a pessoa tenha decidido abrir nada. É a única
// superfície do produto que fala sem ser chamada.
// ---------------------------------------------------------------------------
const renderer = readFileSync(
  'android/app/src/main/java/com/hexervoodoom/soulmon/widget/WidgetRenderer.kt',
  'utf8',
);
const plugin = readFileSync(
  'android/app/src/main/java/com/hexervoodoom/soulmon/plugins/SoulmonWidgetPlugin.kt',
  'utf8',
);

/** Só o código; os comentários CITAM as frases proibidas para explicar por que
 *  saíram, e essa citação é o registro que impede a reintrodução. */
const semComentarios = (fonte: string) =>
  fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('o widget não cobra', () => {
  const codigo = semComentarios(renderer);

  it('não conta o que falta', () => {
    // "N tarefas restantes" só aparece quando a razão é BAIXA — o placar
    // aparecendo justamente para quem está perdendo o dia.
    expect(codigo).not.toMatch(/task\(s\) left/);
    expect(codigo).not.toMatch(/total - completed/);
    expect(codigo).not.toMatch(/\$completed de \$total/);
  });

  it('não trata HP baixo como alarme', () => {
    // O HP representa o cuidado que a pessoa teve consigo mesma; um ⚠️ ali
    // converte culpa (reparável) em vergonha (motiva desinstalar).
    expect(codigo).not.toMatch(/Cuide de mim/);
    expect(codigo).not.toMatch(/I need some care/);
    expect(codigo).not.toMatch(/⚠️/);
  });

  it('não lê percentual cru nem escudo — as duas chaves vetadas', () => {
    expect(codigo).not.toMatch(/constancy_pct/);
    expect(codigo).not.toMatch(/"shields"/);
  });

  it('o contador some no zero: nunca "0/N", nunca um traço (13.16 — X10 do canvas Fora do app)', () => {
    // Até 20/09/2026 o renderer escrevia `"$completed/$total"` com zero feitas
    // ("0/5" — o placar de quem ainda não começou) e `else "—"` sem tarefa — e
    // este guard NÃO travava nenhum dos dois (só as substrings de cobrança). A
    // regra 13.16 é a linha SUMIR (`setViewVisibility(GONE)`), não trocar de texto.
    expect(codigo).not.toMatch(/"0\//);
    expect(codigo).not.toMatch(/"—"/);
    expect(codigo).not.toMatch(/else "-"/);
    // O interpolado só pode existir atrás de um `completed > 0`.
    expect(codigo).toMatch(/completed > 0\) "\$completed\/\$total" else null/);
    expect(codigo).toMatch(/setViewVisibility\(R\.id\.widget_tasks, View\.GONE\)/);
  });

  it("não cobra presença: \"Don't forget about me today!\" (PRINCÍPIOS §12) saiu do pool do chat", () => {
    expect(codigo).not.toMatch(/forget about me/i);
  });

  it('não sente saudade nem culpa a pessoa pela ausência — em EN também (L11/L6)', () => {
    // A 13.18 tornou o widget só EN e este guard ficou vigiando `saudade` (PT).
    // "I missed you!", "I miss you..." (hp≤20) e "I've been missing you" passaram
    // até 22/09/2026 (QA rodada 1 §4.2): a criatura nunca sente por causa do que
    // a pessoa fez ou deixou de fazer — e ligar saudade ao placar de HP é pior.
    expect(codigo).not.toMatch(/miss(ed|ing)? you|waited for you|lonely|alone without/i);
    // D-F3: sem emoji — o ✨ tinha sobrevivido.
    expect(codigo).not.toMatch(/✨/);
  });

  it('a escada é só EN e sem emoji (13.18, D-F3)', () => {
    // As frases PT com emoji do fabricante eram o que o widget dizia até 20/09/2026.
    expect(codigo).not.toMatch(/saudade|Quase lá|Continue assim|Dia perfeito|Um dia de cada vez/);
    expect(codigo).toMatch(/"Complete day!"/);
  });
});

describe('o bridge não grava o que a spec vetou', () => {
  const codigo = semComentarios(plugin);

  it('nenhum putInt de constância, escudo ou vínculo', () => {
    expect(codigo).not.toMatch(/putInt\("constancy_pct"/);
    expect(codigo).not.toMatch(/putInt\("shields"/);
    expect(codigo).not.toMatch(/putInt\("bond_level"/);
  });

  it('grava a FAIXA no lugar do número', () => {
    expect(codigo).toMatch(/putBoolean\("habit_steady"/);
  });

  it('as chaves antigas são REMOVIDAS, não só deixadas de escrever', () => {
    // Um aparelho que já rodou a versão anterior tem os valores gravados no
    // SharedPreferences: parar de escrever não apaga o que está lá.
    for (const chave of ['constancy_pct', 'shields', 'bond_level']) {
      expect(codigo).toMatch(new RegExp(`remove\\("${chave}"\\)`));
    }
  });
});

// ---------------------------------------------------------------------------
// O CORVINHO E O BOSQUE NO WIDGET (29/09/2026, decisão do dono).
// Duas chaves NOVAS no bridge (`pet_line`, `grove_stage`); nenhuma renomeada.
// O widget ganha o NOME do estágio do Bosque — e nada que conte, compare ou cobre.
// ---------------------------------------------------------------------------
import { readdirSync } from 'node:fs';
import { CORVO_FORM_IDS } from '../utils/corvoPet';
import { GROVE_STAGES } from '../utils/guildRules';
import { widgetPetLine, widgetGroveStage } from './SoulmonWidgetPlugin';

const bridgeTs = readFileSync('src/plugins/SoulmonWidgetPlugin.ts', 'utf8');
const app = readFileSync('src/App.tsx', 'utf8');
const layoutA = readFileSync('android/app/src/main/res/layout/widget_soulmon.xml', 'utf8');
const stringsEn = readFileSync('android/app/src/main/res/values/strings.xml', 'utf8');
const stringsPt = readFileSync('android/app/src/main/res/values-pt/strings.xml', 'utf8');
const NODPI = 'android/app/src/main/res/drawable-nodpi';

describe('pet_line e grove_stage: chaves novas, allowlist dos dois lados', () => {
  const plug = semComentarios(plugin);
  const rend = semComentarios(renderer);

  it('o bridge TS declara as duas e o App as envia a partir dos donos', () => {
    expect(bridgeTs).toMatch(/petLine\?:/);
    expect(bridgeTs).toMatch(/groveStage\?:/);
    expect(app).toMatch(/petLine: widgetPetLine\(gameState\)/);
    expect(app).toMatch(/groveStage: widgetGroveStage\(grove\)/);
  });

  it('o plugin grava pet_line SÓ quando é "corvo" e remove caso contrário', () => {
    expect(plug).toMatch(/if \(petLine == "corvo"\) editor\.putString\("pet_line", petLine\) else editor\.remove\("pet_line"\)/);
  });

  it('o plugin grava grove_stage SÓ com id da allowlist e remove caso contrário', () => {
    expect(plug).toMatch(/if \(groveStage in GROVE_STAGE_IDS\) editor\.putString\("grove_stage", groveStage\) else editor\.remove\("grove_stage"\)/);
    const m = /GROVE_STAGE_IDS = setOf\(([^)]*)\)/.exec(plug);
    expect(m).not.toBeNull();
    const ids = [...m![1].matchAll(/"([^"]+)"/g)].map(x => x[1]);
    expect(ids).toEqual([...GROVE_STAGES]);
  });

  it('o renderer traduz grove_stage por tabela fechada (mesmos ids) e esconde sem roda', () => {
    const ids = [...rend.matchAll(/"([a-z-]+)" -> R\.string\.widget_grove_/g)].map(x => x[1]);
    expect(ids).toEqual([...GROVE_STAGES]);
    expect(rend).toMatch(/setViewVisibility\(R\.id\.widget_grove, View\.GONE\)/);
  });

  it('TS: widgetPetLine só devolve "corvo" ou vazio; widgetGroveStage só id de estágio', () => {
    expect(widgetPetLine({ soulmonMeta: { creature: 'corvo' } })).toBe('corvo');
    expect(widgetPetLine({ demoCharacterId: 'kaelen' })).toBe('');
    expect(widgetGroveStage(null)).toBe('');
    const base = { gid: 'g', base: 0, tracked: 0, joinedDay: '', marks: {}, pending: null, scenes: 0 };
    expect(widgetGroveStage({ ...base, index: 0 })).toBe('');
    expect(widgetGroveStage({ ...base, index: 3 })).toBe('copa');
    expect(widgetGroveStage({ ...base, index: 1, pending: { index: 5, day: 'x' } })).toBe('bosque-antigo');
  });

  it('as strings do Bosque são SÓ os nomes canônicos (PT e EN), sem número nem cobrança', () => {
    const nomes = (xml: string) => [...xml.matchAll(/name="widget_grove_[a-z_]+">([^<]*)</g)].map(x => x[1]);
    expect(nomes(stringsEn)).toEqual(['Clearing', 'Boughs', 'Canopy', 'Thicket', 'Old grove']);
    expect(nomes(stringsPt)).toEqual(['Clareira', 'Ramagem', 'Copa', 'Mata', 'Bosque antigo']);
    for (const t of [...nomes(stringsEn), ...nomes(stringsPt)]) expect(t).not.toMatch(/\d|falta|left|membro|member|%/i);
  });

  it('a linha do Bosque no layout é um TextView discreto, sem cor de alerta', () => {
    const bloco = /<TextView\s+android:id="@\+id\/widget_grove"[^>]*\/>/.exec(layoutA);
    expect(bloco).not.toBeNull();
    expect(bloco![0]).toMatch(/android:visibility="gone"/);
    expect(bloco![0]).toMatch(/android:textColor="#AAB6B4"/);
    expect(bloco![0]).not.toMatch(/android:text=/);
    expect(layoutA).not.toMatch(/<View[\s>]|ProgressBar/);
    expect(rend).not.toMatch(/setInt\(R\.id\.widget_grove/);
  });

  it('nenhuma chave vetada voltou por causa do Bosque', () => {
    expect(plug).not.toMatch(/put\w+\("(constancy_pct|shields|bond_level)"/);
    expect(rend).not.toMatch(/constancy_pct|"shields"|bond_level/);
    expect(plug + rend).not.toMatch(/grove_(members|count|progress|pct)/);
  });
});

describe('paridade: as 11 formas do corvo (src) ↔ drawables ↔ mapa Kotlin', () => {
  const rend = semComentarios(renderer);
  const nome = (forma: string) => `sprite_corvo_${forma.replace(/-/g, '_')}`;

  it('cada forma tem o drawable em drawable-nodpi, e nenhum drawable sobra', () => {
    const arquivos = readdirSync(NODPI).filter(f => f.startsWith('sprite_corvo_')).map(f => f.replace(/\.png$/, '')).sort();
    expect(arquivos).toEqual(CORVO_FORM_IDS.map(nome).sort());
  });

  it('o mapa CORVO_SPRITES do Kotlin tem exatamente as 11 formas, cada uma no seu drawable', () => {
    const pares = [...rend.matchAll(/"([a-z-]+)" to R\.drawable\.(sprite_corvo_[a-z_]+)/g)].map(x => [x[1], x[2]]);
    expect(pares).toEqual(CORVO_FORM_IDS.map(f => [f, nome(f)]));
  });

  it('o corvo cai no sprite_rookie e só é resolvido com pet_line == "corvo"', () => {
    expect(rend).toMatch(/prefs\.getString\("pet_line", ""\) == "corvo"/);
    expect(rend).toMatch(/CORVO_SPRITES\[stage\.lowercase\(\)\] \?: R\.drawable\.sprite_rookie/);
  });
});
