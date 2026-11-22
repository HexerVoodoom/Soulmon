import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { WIDGET_FRAME_ELEMENTS } from '../utils/widgetFrames';

// Beta12 (frente A, nativo Android). A lógica de decisão vive em Kotlin e tem JUnit (`WidgetFrameStoreTest`, `WidgetAdaptiveTest`,
// `WidgetVpetTest`); aqui ficam o que só se confere lendo o fonte/arquivo: o manifesto de molduras servido pela web, os receivers
// (nenhum antigo sai), os rótulos, o teto de altura, o KeepAwake registrado e o bump de versão.
const main = 'android/app/src/main';
const read = (p: string) => readFileSync(p, 'utf8');
const semComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

interface Frame { id: string; name: Record<string, string>; url: string; sha256: string; bytes: number; acquire: { type: string; element?: string } }
const manifest = JSON.parse(read('public/widget-frames/manifest.json')) as {
  schema: number; version: number; enabled: boolean;
  geometry: { w: number; h: number; screen: { l: number; t: number; r: number; b: number } };
  frames: Frame[];
};

describe('A1 › manifesto de molduras do widget (public/widget-frames)', () => {
  it('schema 1, versão inteira positiva, ligado, geometria = constantes do Kotlin (WidgetVpet)', () => {
    expect(manifest.schema).toBe(1);
    expect(Number.isInteger(manifest.version) && manifest.version >= 1).toBe(true);
    expect(manifest.enabled).toBe(true);
    const kt = read(`${main}/java/com/soulmon/widget/WidgetVpet.kt`);
    expect(kt).toContain(`const val W = ${manifest.geometry.w}`);
    expect(kt).toContain(`const val H = ${manifest.geometry.h}`);
    expect(kt).toContain(`const val SCREEN_L = ${manifest.geometry.screen.l}`);
    expect(kt).toContain(`const val SCREEN_T = ${manifest.geometry.screen.t}`);
    expect(kt).toContain(`const val SCREEN_R = ${manifest.geometry.screen.r}`);
    expect(kt).toContain(`const val SCREEN_B = ${manifest.geometry.screen.b}`);
  });

  it('v1 = as 20 embutidas do APK (mesmos ids da allowlist do TS e arte idêntica à do drawable)', () => {
    expect(manifest.frames.map(f => f.id).sort()).toEqual([...WIDGET_FRAME_ELEMENTS].sort());
    for (const f of manifest.frames) {
      const embutida = readFileSync(`${main}/res/drawable-nodpi/moldura_vpet_${f.id}.png`);
      expect(createHash('sha256').update(embutida).digest('hex')).toBe(f.sha256);
    }
  });

  it('todo arquivo citado existe com sha256, bytes, hash no nome e PNG 576x384; nada sobra fora do manifesto', () => {
    const ids = new Set<string>();
    for (const f of manifest.frames) {
      expect(f.id).toMatch(/^[a-z][a-z0-9_]{1,31}$/);
      expect(ids.has(f.id)).toBe(false);
      ids.add(f.id);
      expect(f.url).toBe(`${f.id}.${f.sha256.slice(0, 8)}.png`);
      expect(f.url).toMatch(/^[a-z0-9][a-z0-9_.-]{0,95}\.png$/);
      const buf = readFileSync(`public/widget-frames/${f.url}`);
      expect(buf.length).toBe(f.bytes);
      expect(f.bytes).toBeLessThanOrEqual(256 * 1024);
      expect(createHash('sha256').update(buf).digest('hex')).toBe(f.sha256);
      // IHDR: largura e altura (big-endian) nos bytes 16..23 de um PNG.
      expect(buf.subarray(1, 4).toString()).toBe('PNG');
      expect(buf.readUInt32BE(16)).toBe(manifest.geometry.w);
      expect(buf.readUInt32BE(20)).toBe(manifest.geometry.h);
    }
    const arquivos = readdirSync('public/widget-frames').filter(n => n !== 'manifest.json').sort();
    expect(arquivos).toEqual(manifest.frames.map(f => f.url).sort());
  });

  it('dist/ (commitado) tem o mesmo manifesto, e os cabeçalhos: manifesto revalida, imagens com hash são imutáveis', () => {
    expect(read('dist/widget-frames/manifest.json')).toBe(read('public/widget-frames/manifest.json'));
    for (const arq of ['public/_headers', 'dist/_headers']) {
      const h = read(arq);
      expect(h).toMatch(/\/widget-frames\/manifest\.json\r?\n\s+Cache-Control: no-cache\r?\n/);
      expect(h).toMatch(/\/widget-frames\/\*\.png\r?\n\s+Cache-Control: public, max-age=31536000, immutable/);
    }
  });

  it('nada mexe em assets/run_worker_first do wrangler (regra permanente, incidente de 09/11/2026)', () => {
    expect(semComentarios(read('wrangler.jsonc'))).not.toMatch(/run_worker_first/);
  });
});

describe('A1 › cliente nativo só baixa do host do app, com hash, e o renderer só lê do disco', () => {
  const sync = semComentarios(read(`${main}/java/com/soulmon/widget/WidgetFramesSync.kt`));
  const store = semComentarios(read(`${main}/java/com/soulmon/widget/WidgetFrameStore.kt`));
  const renderer = semComentarios(read(`${main}/java/com/soulmon/widget/WidgetRenderer.kt`));

  it('Policy: host exato do Worker (o mesmo do server.url), https, sem redirecionamento', () => {
    expect(store).toMatch(/const val APP_HOST = WidgetOwnSprite\.Policy\.APP_HOST/);
    expect(read(`${main}/java/com/soulmon/widget/WidgetOwnSprite.kt`)).toContain('soulmon.mateus-sprnd.workers.dev');
    expect(JSON.parse(read('capacitor.config.json')).server.url).toContain('soulmon.mateus-sprnd.workers.dev');
    expect(sync).toMatch(/instanceFollowRedirects = false/);
    expect(sync).toMatch(/sha256Hex\(bytes\) != f\.sha256/);
    expect(sync).toMatch(/\.tmp/);
  });

  it('o renderer NÃO faz rede: lê o cache (WidgetFrameStore.Disk) e cai na embutida', () => {
    expect(renderer).not.toMatch(/HttpURLConnection|WidgetFramesSync\./);
    expect(renderer).toMatch(/WidgetFrameStore\.Disk\.cachedFrame\(/);
    expect(renderer).toMatch(/bundledCasingRes\(/);
    expect(renderer).toMatch(/R\.drawable\.vpet_moldura/);
  });

  it('o plugin aceita o id pela FORMA (dado, não lista fechada) e expõe syncWidgetFrames sem argumentos de URL', () => {
    const plugin = semComentarios(read(`${main}/java/com/soulmon/plugins/SoulmonWidgetPlugin.kt`));
    expect(plugin).toMatch(/WidgetVpet\.isFrameIdShape\(vpetFrame\)/);
    expect(plugin).toMatch(/fun syncWidgetFrames\(call: PluginCall\)/);
    expect(plugin.slice(plugin.indexOf('fun syncWidgetFrames'))).not.toMatch(/call\.getString/);
    expect(read('src/plugins/SoulmonWidgetPlugin.ts')).toMatch(/syncWidgetFrames\(\): Promise<void>/);
    expect(read('src/App.tsx')).toMatch(/SoulmonWidget\.syncWidgetFrames\(\)/);
  });
});

describe('A2/A3 › receivers, rótulos e tamanhos', () => {
  const man = read(`${main}/AndroidManifest.xml`);
  const receivers = [...man.matchAll(/android:name="\.widget\.(\w+)"/g)].map(m => m[1]);

  it('NENHUM receiver antigo saiu (tirar um apaga o widget já colocado) e o Companheiro entrou', () => {
    for (const r of [
      'SoulmonWidgetClearProvider', 'SoulmonWidgetVpetProvider', 'SoulmonWidgetAdaptiveProvider', 'SoulmonWidgetProvider',
      'SoulmonWidgetVerticalProvider', 'SoulmonWidgetPetProvider', 'SoulmonWidgetChatProvider', 'SoulmonWidgetScreenProvider',
    ]) expect(receivers).toContain(r);
    expect(receivers).toContain('SoulmonWidgetCompanionProvider');
    // 18/11/2026: + o widget grande da Home (SoulmonWidgetHomeProvider, widgetHomeGrande.contract.test.ts).
    expect(receivers).toContain('SoulmonWidgetHomeProvider');
    expect(receivers.length).toBe(11); // 10 receivers + o WidgetHomeTasksService (a regex pega todo .widget.*)
  });

  it('rótulos: Cage (pt e en) para o widget com moldura; Companheiro/Companion para o 3º', () => {
    expect(read(`${main}/res/values/strings.xml`)).toContain('<string name="widget_vpet_label">Cage</string>');
    expect(read(`${main}/res/values-pt/strings.xml`)).toContain('<string name="widget_vpet_label">Cage</string>');
    expect(read(`${main}/res/values/strings.xml`)).toContain('<string name="widget_companion_label">Companion</string>');
    expect(read(`${main}/res/values-pt/strings.xml`)).toContain('<string name="widget_companion_label">Companheiro</string>');
  });

  it('widget sem moldura (clear): 1 célula de largura, teto de 4 células de altura, layout vertical com a fala ABAIXO', () => {
    const info = read(`${main}/res/xml/soulmon_widget_clear_info.xml`);
    expect(info).toMatch(/minResizeWidth="40dp"/);
    expect(info).toMatch(/maxResizeHeight="250dp"/);
    const v = read(`${main}/res/layout/widget_soulmon_clear_vertical.xml`);
    expect(v).toMatch(/android:orientation="vertical"/);
    expect(v.indexOf('@+id/widget_sprite"')).toBeLessThan(v.indexOf('@+id/widget_message'));
    // O horizontal continua como era: fala à direita.
    expect(read(`${main}/res/layout/widget_soulmon_clear.xml`)).toMatch(/android:orientation="horizontal"/);
  });

  it('o Cage (V-Pet com moldura) NÃO ganha formato vertical (decisão 9 do dono)', () => {
    const info = read(`${main}/res/xml/soulmon_widget_vpet_info.xml`);
    expect(info).toMatch(/minResizeWidth="180dp"/);
    expect(info).not.toMatch(/maxResizeHeight/);
  });

  it('Companheiro: 2x2 inicial, redimensionável, layout de um bitmap quadrado e redesenhado no updateAll', () => {
    const info = read(`${main}/res/xml/soulmon_widget_companion_info.xml`);
    expect(info).toMatch(/targetCellWidth="2"/);
    expect(info).toMatch(/targetCellHeight="2"/);
    expect(info).toMatch(/resizeMode="horizontal\|vertical"/);
    expect(read(`${main}/res/layout/widget_soulmon_companion.xml`)).toMatch(/scaleType="fitCenter"/);
    expect(semComentarios(read(`${main}/java/com/soulmon/widget/WidgetRenderer.kt`))).toMatch(/SoulmonWidgetCompanionProvider::class\.java[\s\S]{0,80}renderCompanion/);
  });
});

describe('H › keep-awake nativo', () => {
  it('plugin Kotlin KeepAwake (keepAwake/allowSleep, FLAG_KEEP_SCREEN_ON) registrado na MainActivity, sem dependência nova', () => {
    const kt = semComentarios(read(`${main}/java/com/soulmon/plugins/KeepAwakePlugin.kt`));
    expect(kt).toMatch(/@CapacitorPlugin\(name = "KeepAwake"\)/);
    expect(kt).toMatch(/fun keepAwake\(/);
    expect(kt).toMatch(/fun allowSleep\(/);
    expect(kt).toMatch(/FLAG_KEEP_SCREEN_ON/);
    expect(read(`${main}/java/com/soulmon/MainActivity.java`)).toMatch(/registerPlugin\(KeepAwakePlugin\.class\)/);
    expect(read('package.json')).not.toMatch(/keep-awake/);
  });

  it('o hook web usa o plugin nativo quando o APK o tem (isPluginAvailable) e mantém o Wake Lock da web como reserva', () => {
    const ts = read('src/utils/keepAwake.ts');
    expect(ts).toMatch(/Capacitor\.isPluginAvailable\('KeepAwake'\)/);
    expect(ts).toMatch(/navigator as unknown as \{ wakeLock/);
    expect(read('src/plugins/KeepAwakePlugin.ts')).toMatch(/registerPlugin<KeepAwakePlugin>\('KeepAwake'/);
  });
});

describe('versão do APK', () => {
  it('beta12 = versionCode 32 / 1.3.0-beta12', () => {
    const g = semComentarios(read('android/app/build.gradle'));
    expect(g).toMatch(/versionCode 32\b/);
    expect(g).toMatch(/versionName "1\.3\.0-beta12"/);
  });
});
