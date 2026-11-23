import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// WIDGET GRANDE DA HOME, lado nativo (decisão do dono, 18/11/2026). Nenhum
// teste em `node` alcança o RemoteViews: este guard lê os fontes.
// ---------------------------------------------------------------------------
const A = 'android/app/src/main/';
const ler = (p: string) => readFileSync(A + p, 'utf8');
const manifest = ler('AndroidManifest.xml');
const provider = ler('java/com/soulmon/widget/SoulmonWidgetHomeProvider.kt');
const service = ler('java/com/soulmon/widget/WidgetHomeTasksService.kt');
const renderer = ler('java/com/soulmon/widget/WidgetRenderer.kt');
const info = ler('res/xml/soulmon_widget_home_info.xml');
const layout = ler('res/layout/widget_soulmon_home.xml');

describe('widget grande da Home (nativo)', () => {
  it('registrado no manifesto, com a lista protegida por BIND_REMOTEVIEWS', () => {
    expect(manifest).toMatch(/android:name="\.widget\.SoulmonWidgetHomeProvider"/);
    expect(manifest).toMatch(/android:name="\.widget\.WidgetHomeTasksService"\s+android:permission="android\.permission\.BIND_REMOTEVIEWS"\s+android:exported="false"/);
  });

  it('vertical e redimensionável dentro de um limite', () => {
    expect(info).toMatch(/android:resizeMode="horizontal\|vertical"/);
    expect(info).toMatch(/android:targetCellWidth="4"/);
    expect(info).toMatch(/android:targetCellHeight="5"/);
    expect(info).toMatch(/android:maxResizeHeight="\d+dp"/);
    expect(info).toMatch(/android:minResizeHeight="\d+dp"/);
  });

  it('moldura = casco V-Pet PADRÃO, sem variante por elemento', () => {
    expect(renderer).toMatch(/vpetBitmap\(context, WidgetVpet\.CAGE, defaultCasing = true\)/);
    expect(layout).toMatch(/@drawable\/vpet_moldura/);
  });

  it('o check funciona em todas as versões: ImageView + fill-in, nunca só o checkbox da API 31+', () => {
    expect(service).toMatch(/setOnClickFillInIntent\(\s*R\.id\.widget_home_check_hit/);
    expect(service + renderer).not.toMatch(/setCompoundButtonChecked|setOnCheckedChangeResponse/);
    expect(renderer).toMatch(/setPendingIntentTemplate\(\s*R\.id\.widget_home_list/);
  });

  it('o check SÓ MARCA: grava na fila e redesenha; nada de regra de jogo no nativo', () => {
    expect(provider).toMatch(/WidgetEventQueue\.Store\.addDone\(context, eventKind, id,/);
    expect(provider + service).not.toMatch(/foodInventory|totalXP|gamePoints|awardBond/);
    // só item da lista de hoje, do mesmo tipo, aberto e sem etapas (adendo ao §478: hábitos)
    expect(provider).toMatch(/homeTaskItems\(context\)\.none \{ it\.id == id && it\.kind == kind && it\.checkable \}/);
    expect(service).toMatch(/if \(item\.checkable\)/);
  });

  it('o resto do widget abre o jogo e entra no updateAll (atualiza com o estado e com o WidgetRefreshWorker)', () => {
    const i = renderer.indexOf('fun renderHome(');
    expect(renderer.slice(i, renderer.indexOf('fun updateHome', i))).toMatch(/attachClick\(context, views\)/);
    const all = renderer.slice(renderer.indexOf('fun updateAll('), renderer.indexOf('private fun attachClick'));
    expect(all).toMatch(/SoulmonWidgetHomeProvider::class\.java[\s\S]*renderHome\(context, mgr, id\)/);
  });
});
