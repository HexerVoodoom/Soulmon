import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { onRequestPost, __setHfPollMs } from './generate-sprite.js';
import { ENT_PREFIX } from './_entitlements.js';
import { encodePng } from './_png.js';
const SAVE='abcdefgh12345678', FORM='champion-power';
function fakeEnv(extra={}){const store=new Map(),meta=new Map();store.set(ENT_PREFIX+SAVE,JSON.stringify({tier:'paid'}));
 return {HF_CREDENTIALS:'kid:ksecret',...extra,DIGIAPP_SAVES:{get:async k=>store.has(k)?store.get(k):null,put:async(k,v,o)=>{store.set(k,v);if(o?.metadata)meta.set(k,o.metadata);},delete:async k=>{store.delete(k);meta.delete(k);},getWithMetadata:async k=>({value:store.has(k)?store.get(k):null,metadata:meta.get(k)??null})},_store:store};}
const mk=body=>new Request('https://soulmon.test/api/generate-sprite',{method:'POST',headers:{'Content-Type':'application/json'},body});
const req=()=>mk(JSON.stringify({prompt:'bicho',id:SAVE,formId:FORM}));
const json=o=>new Response(JSON.stringify(o),{status:200,headers:{'Content-Type':'application/json'}});
beforeEach(()=>__setHfPollMs(1)); afterEach(()=>vi.unstubAllGlobals());
describe('QA2 generate-sprite: polling e entrada hostil',()=>{
 it('status_url de outro domínio NÃO recebe a credencial',async()=>{
  const seen=[];
  vi.stubGlobal('fetch',vi.fn(async(url,init)=>{url=String(url);seen.push([url,init?.headers?.Authorization]);
   if(url.includes('/marketing-studio/'))return json({request_id:'r1',status_url:'https://evil.test/steal'});
   if(url.endsWith('/requests/r1/status'))return json({status:'failed'});
   return json({status:'failed'});}));
  const r=await onRequestPost({request:req(),env:fakeEnv()});
  expect(seen.some(([u])=>u.startsWith('https://evil.test'))).toBe(false);
  expect(seen.some(([u])=>u.startsWith('https://api.higgsfield.ai.evil'))).toBe(false);
  expect(r.status).toBe(500);
 });
 it('status_url com @ / userinfo disfarçado',async()=>{
  const seen=[];
  vi.stubGlobal('fetch',vi.fn(async(url)=>{url=String(url);seen.push(url);
   if(url.includes('/marketing-studio/'))return json({request_id:'r1',status_url:'https://api.higgsfield.ai/..%2f@evil.test/x'});
   return json({status:'failed'});}));
  await onRequestPost({request:req(),env:fakeEnv()});
  expect(seen.every(u=>new URL(u).hostname==='api.higgsfield.ai')).toBe(true);
 });
 it('polling que nunca completa: 500 e a unidade volta (timeout)',async()=>{
  vi.stubGlobal('fetch',vi.fn(async(url)=>{url=String(url);
   if(url.includes('/marketing-studio/'))return json({request_id:'r1'});
   return json({status:'in_progress'});}));
  const env=fakeEnv();
  const r=await onRequestPost({request:req(),env});
  expect(r.status).toBe(500);
  expect([...env._store.keys()].filter(k=>k.startsWith('sprite:lock:'))).toEqual([]);
 });
 it('REGRESSAO polling: corpo não-JSON (gateway) ou queda de rede numa consulta NÃO aborta a geração já aceita (continua pollando)',async()=>{
  let n=0;
  const w=64,d=new Uint8Array(w*w*4);for(let i=0;i<w*w;i++)d.set([0,255,0,255],i*4);for(let y=20;y<44;y++)for(let x=20;x<44;x++)d.set([200,40,40,255],(y*w+x)*4);
  const png=encodePng(w,w,d);
  vi.stubGlobal('fetch',vi.fn(async(url)=>{url=String(url);
   if(url.includes('/marketing-studio/'))return json({request_id:'r1'});
   if(url.endsWith('/status')){n++; if(n===1)return new Response('<html>502 bad gateway</html>',{status:200}); return json({status:'completed',images:[{url:'https://cdn.hf.test/o.png'}]});}
   return new Response(png,{headers:{'Content-Type':'image/png'}});}));
  const r=await onRequestPost({request:req(),env:fakeEnv()});
  expect(r.status).toBe(200);
 });
 it('REGRESSAO polling: exceção de rede numa consulta de status também não aborta',async()=>{
  let n=0;
  const w=64,d=new Uint8Array(w*w*4);for(let i=0;i<w*w;i++)d.set([0,255,0,255],i*4);for(let y=20;y<44;y++)for(let x=20;x<44;x++)d.set([200,40,40,255],(y*w+x)*4);
  const png=encodePng(w,w,d);
  vi.stubGlobal('fetch',vi.fn(async(url)=>{url=String(url);
   if(url.includes('/marketing-studio/'))return json({request_id:'r1'});
   if(url.endsWith('/status')){n++; if(n===1)throw new TypeError('network');return json({status:'completed',images:[{url:'https://cdn.hf.test/o.png'}]});}
   return new Response(png,{headers:{'Content-Type':'image/png'}});}));
  const r=await onRequestPost({request:req(),env:fakeEnv()});
  expect(r.status).toBe(200);
 });
 it('REGRESSAO entrada: corpo null/JSON quebrado/array -> 400, nunca 500',async()=>{
  for(const b of ['null','[]','"x"','{','{"prompt":{"a":1},"id":"abcdefgh12345678","formId":"champion-power"}','{"prompt":"x","id":5,"formId":"champion-power"}','{"prompt":"x","id":"abcdefgh12345678","formId":["a"]}']){
   const r=await onRequestPost({request:mk(b),env:fakeEnv()});
   
   expect(r.status).toBeLessThan(500);
  }
 });
});
