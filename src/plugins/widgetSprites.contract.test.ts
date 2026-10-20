import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { STARTER_IDS, fallbackStarterFor, DEMO_CHARACTER_IDS } from '../utils/sprites';
import { widgetPetLine } from './SoulmonWidgetPlugin';

// O widget Android NÃO tem mais a árvore genérica (§138, 20/10/2026): mostra o inicial do jogador
// (`pet_line`) ou, sem linha, um inicial por hash estável do estágio. Kotlin não compila em `node`:
// este teste lê o FONTE do renderer, reimplementa o hash do Kotlin e compara com `fallbackStarterFor`.
const NODPI = 'android/app/src/main/res/drawable-nodpi';
const rend = readFileSync('android/app/src/main/java/com/soulmon/widget/WidgetRenderer.kt', 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Cópia fiel do `fallbackStarterId` Kotlin: Long mascarado em 32 bits (= `>>> 0`), `lowercase()`, módulo 5. */
function kotlinFallback(stage: string): string {
  let h = 0n;
  for (const c of stage.toLowerCase()) h = (h * 31n + BigInt(c.charCodeAt(0))) & 0xFFFFFFFFn;
  return STARTER_IDS[Number(h % BigInt(STARTER_IDS.length))];
}

describe('widget Android: iniciais no lugar da árvore genérica (§138)', () => {
  it('STARTER_SPRITES do Kotlin = os 5 iniciais, NA ORDEM de STARTER_IDS, cada um no seu drawable', () => {
    const pares = [...rend.matchAll(/"([a-z]+)" to R\.drawable\.(sprite_starter_[a-z]+)/g)].map(x => [x[1], x[2]]);
    expect(pares).toEqual(STARTER_IDS.map(id => [id, `sprite_starter_${id}`]));
  });

  it('cada inicial tem o drawable 256² e NENHUM sprite_* genérico sobrou (só starter e corvo)', () => {
    const arquivos = readdirSync(NODPI).filter(f => f.startsWith('sprite_'));
    for (const id of STARTER_IDS) expect(arquivos).toContain(`sprite_starter_${id}.png`);
    for (const f of arquivos) expect(f, f).toMatch(/^sprite_(starter|corvo)_/);
    for (const id of STARTER_IDS) {
      const png = readFileSync(`${NODPI}/sprite_starter_${id}.png`);
      expect(png.readUInt32BE(16), id).toBe(256);
      expect(png.readUInt32BE(20), id).toBe(256);
      expect(png.length, id).toBeLessThan(60 * 1024);
    }
  });

  it('o hash do Kotlin dá o MESMO inicial que fallbackStarterFor, em estágios reais e inventados', () => {
    const estagios = ['rookie', 'champion-power', 'champion-harmony', 'champion-benevolence', 'ultimate-power',
      'ultimate-harmony', 'ultimate-benevolence', 'mega-power', 'mega-harmony', 'mega-benevolence', 'ultra',
      'ROOKIE', 'Champion-Power', 'agumon', 'baby-i', '', 'x'.repeat(400)];
    for (let i = 0; i < 300; i++) estagios.push(`estagio-${i}-${i * 7919}`);
    for (const s of estagios) expect(kotlinFallback(s), s).toBe(fallbackStarterFor(s));
  });

  it('o renderer: corvo -> tabela do corvo; inicial por pet_line; senão hash; nunca getIdentifier nem sprite_rookie', () => {
    expect(rend).toMatch(/STARTER_SPRITES\[line\] \?: STARTER_SPRITES\.getValue\(fallbackStarterId\(stage\)\)/);
    expect(rend).toMatch(/\(h \* 31L \+ c\.code\.toLong\(\)\) and 0xFFFFFFFFL/);
    expect(rend).not.toMatch(/sprite_rookie|getIdentifier\(candidateName/);
    for (const f of ['widget_soulmon', 'widget_soulmon_chat', 'widget_soulmon_pet', 'widget_soulmon_screen', 'widget_soulmon_vertical']) {
      const xml = readFileSync(`android/app/src/main/res/layout/${f}.xml`, 'utf8');
      expect(xml, f).not.toMatch(/@drawable\/sprite_(?!starter_|corvo_)/);
    }
  });

  it('a ponte manda o inicial do jogador; todo id de demo válido produz um valor aceito pelo plugin', () => {
    const aceitos = new Set<string>(['', 'corvo', ...STARTER_IDS]);
    for (const id of DEMO_CHARACTER_IDS) expect(aceitos.has(widgetPetLine({ demoCharacterId: id })), id).toBe(true);
    for (const id of STARTER_IDS) expect(widgetPetLine({ demoCharacterId: id })).toBe(id);
  });

  it('o script de geração é idempotente e os drawables em disco batem com a fonte canônica', () => {
    expect(existsSync('tools/gerar-sprites-widget.mjs')).toBe(true);
    const r = spawnSync(process.execPath, ['tools/gerar-sprites-widget.mjs', '--check'], { encoding: 'utf8' });
    expect(r.stdout + r.stderr).not.toMatch(/DIVERGE|ÓRFÃO|FALTA/);
    expect(r.status).toBe(0);
  });
});
