// Backup dos sprites gerados (KV de produção → disco) + checagem de que todo token referenciado nos saves tem blob.
// Só leitura no KV. Uso: node scripts/backup-sprites.mjs [pasta-destino]  (precisa do wrangler logado)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const NS='20b3ba78a3e84265b5e2d4cd0d411d43';
const keys=JSON.parse(execFileSync('node',['node_modules/wrangler/bin/wrangler.js','kv','key','list','--namespace-id',NS,'--remote'],{maxBuffer:64e6,stdio:['ignore','pipe','ignore']}).toString()).map(k=>k.name);
const dir=process.argv[2]||('E:/Soulmon-backup/sprites-'+new Date().toISOString().slice(0,10)); fs.mkdirSync(dir,{recursive:true});
const get=(k,bin)=>execFileSync('node',['node_modules/wrangler/bin/wrangler.js','kv','key','get',k,'--namespace-id',NS,'--remote',...(bin?[]:['--text'])],{maxBuffer:64e6,stdio:['ignore','pipe','ignore']});
const blobs=new Set(keys.filter(k=>k.startsWith('sprite:blob:')).map(k=>k.slice(12)));
const refs=new Map();
for(const k of keys.filter(n=>/^[0-9a-f]{32,64}$/.test(n)||n.startsWith('sprite:img:'))){
  const v=get(k).toString('utf8'); for(const m of v.matchAll(/sprite-image\?k=([0-9a-f]{32})/g)) refs.set(m[1],(refs.get(m[1])||[]).concat(k.slice(0,20)));
  if(k.startsWith('sprite:img:')) fs.writeFileSync(`${dir}/${k.replace(/:/g,'_')}.json`,v);
}
let faltando=0; for(const [t] of refs) if(!blobs.has(t)){faltando++; console.log('SEM BLOB:',t.slice(0,8));}
let n=0; for(const t of blobs){ const b=get('sprite:blob:'+t,true); fs.writeFileSync(`${dir}/${t}.png`,b); n++; }
console.log('tokens referenciados:',refs.size,'| blobs no KV:',blobs.size,'| referenciados sem blob:',faltando,'| copiados p/ disco:',n);
