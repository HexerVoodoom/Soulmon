// Uso: node capturar-benchmark.mjs   (precisa de puppeteer-core: npx --cache E:/tmp/npmcache -p puppeteer-core node capturar-benchmark.mjs)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = 'E:/Soulmon-marketing/_pesquisa/benchmark-mobile';
const SITES = {
  'pokemon-go': 'https://pokemongolive.com/',
  'pokemon-sleep': 'https://www.pokemonsleep.net/',
  'pokemon-tcg-pocket': 'https://tcgpocket.pokemon.com/',
  'monster-hunter-now': 'https://www.monsterhunternow.com/',
  'pikmin-bloom': 'https://pikminbloom.com/',
  'peridot': 'https://peridotbeasts.com/',
  'honkai-star-rail': 'https://hsr.hoyoverse.com/',
  'genshin': 'https://genshin.hoyoverse.com/',
  'zenless': 'https://zenless.hoyoverse.com/',
  'wuthering-waves': 'https://wutheringwaves.kurogames.com/',
  'marvel-snap': 'https://www.marvelsnap.com/',
  'brawl-stars': 'https://supercell.com/en/games/brawlstars/',
  'squad-busters': 'https://supercell.com/en/games/squadbusters/',
  'clash-royale': 'https://supercell.com/en/games/clashroyale/',
  'monument-valley': 'https://www.monumentvalleygame.com/',
  'altos-odyssey': 'https://altosodyssey.com/',
  'sky-cotl': 'https://www.thatskygame.com/',
  'cookie-run-kingdom': 'https://www.cookierun-kingdom.com/',
  'afk-journey': 'https://afkjourney.farlightgames.com/',
  'neko-atsume': 'https://hitpoint.co.jp/nekoatsume/',
  'habitica': 'https://habitica.com/',
  'finch': 'https://finchcare.com/',
  'forest': 'https://www.forestapp.cc/',
  'duolingo': 'https://www.duolingo.com/',
};
const VPS = { mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, desktop: { width: 1440, height: 900 } };

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });
for (const [slug, url] of Object.entries(SITES)) {
  const dir = path.join(OUT, slug); fs.mkdirSync(dir, { recursive: true });
  for (const [vn, vp] of Object.entries(VPS)) {
    const page = await browser.newPage();
    try {
      await page.setViewport(vp);
      if (vn === 'mobile') await page.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
      await new Promise(r => setTimeout(r, 3000));
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      const n = vn === 'mobile' ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const y = Math.min(i * vp.height * (vn === 'mobile' ? 1.5 : 2), Math.max(0, h - vp.height));
        await page.evaluate(yy => window.scrollTo(0, yy), y);
        await new Promise(r => setTimeout(r, 1200));
        await page.screenshot({ path: path.join(dir, `${vn}-${i + 1}.png`) });
      }
      fs.appendFileSync(path.join(dir, 'meta.txt'), `${vn} ${url} altura=${h} ${new Date().toISOString()}\n`);
    } catch (e) {
      fs.appendFileSync(path.join(dir, 'meta.txt'), `${vn} FALHOU ${url}: ${e.message}\n`);
    } finally { await page.close(); }
  }
}
await browser.close();
