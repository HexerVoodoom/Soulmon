import { describe, it, expect } from 'vitest';
import { zlibSync } from 'fflate';
import { decodePng, encodePng } from './_png.js';
import { chromaKeyPng, BadChromaError } from './_chroma.js';

function crc32(buf){let t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}let c=0xffffffff;for(const b of buf)c=t[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(type,data){const o=new Uint8Array(12+data.length);const dv=new DataView(o.buffer);dv.setUint32(0,data.length);for(let i=0;i<4;i++)o[4+i]=type.charCodeAt(i);o.set(data,8);dv.setUint32(8+data.length,crc32(o.subarray(4,8+data.length)));return o;}
function mk(w,h,depth,ctype,rows,{interlace=0,plte=null,trns=null}={}){
  const ih=new Uint8Array(13);const dv=new DataView(ih.buffer);dv.setUint32(0,w);dv.setUint32(4,h);ih[8]=depth;ih[9]=ctype;ih[12]=interlace;
  const raw=[];for(const r of rows){raw.push(0,...r);}
  const parts=[Uint8Array.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih)];
  if(plte)parts.push(chunk('PLTE',Uint8Array.from(plte)));if(trns)parts.push(chunk('tRNS',Uint8Array.from(trns)));
  parts.push(chunk('IDAT',zlibSync(Uint8Array.from(raw))),chunk('IEND',new Uint8Array(0)));
  const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;}

describe('QA2 png e chroma: entradas hostis', () => {
  it('16 bit RGBA', () => { const p=mk(1,1,16,6,[[10,99,20,99,30,99,40,99]]); expect([...decodePng(p).data]).toEqual([10,20,30,40]); });
  it('16 bit gray', () => { const p=mk(1,1,16,0,[[77,1]]); expect([...decodePng(p).data]).toEqual([77,77,77,255]); });
  it('16 bit gray+alpha', () => { const p=mk(1,1,16,4,[[77,1,50,2]]); expect([...decodePng(p).data]).toEqual([77,77,77,50]); });
  it('palette trns', () => { const p=mk(2,1,8,3,[[0,1]],{plte:[1,2,3,4,5,6],trns:[0]}); expect([...decodePng(p).data]).toEqual([1,2,3,0,4,5,6,255]); });
  it('palette indice fora', () => { const p=mk(1,1,8,3,[[5]],{plte:[1,2,3]}); const d=decodePng(p); expect(d.data.every(Number.isFinite)).toBe(true); });
  it('interlace -> Error', () => { expect(()=>decodePng(mk(1,1,8,6,[[1,2,3,4]],{interlace:1}))).toThrow(/entrela/); });
  it('depth 4 gray -> Error', () => { expect(()=>decodePng(mk(1,1,4,0,[[1]]))).toThrow(Error); });
  it('lixo aleatório sempre Error', () => {
    let s=12345;const rnd=()=>(s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff;
    const base=encodePng(4,4,new Uint8Array(64).fill(200));
    for(let i=0;i<300;i++){const b=base.slice();for(let k=0;k<3;k++)b[Math.floor(rnd()*b.length)]=Math.floor(rnd()*256);const c=i%3===0?b.subarray(0,Math.floor(rnd()*b.length)):b;
      try{decodePng(c);}catch(e){expect(e).toBeInstanceOf(Error);} }
  });
  it('chroma: sem verde -> bad-chroma ; tudo verde -> bad-chroma', () => {
    const w=40,h=40;const a=new Uint8Array(w*h*4);for(let i=0;i<w*h;i++){a.set([200,50,50,255],i*4);}
    expect(()=>chromaKeyPng(encodePng(w,h,a))).toThrow(BadChromaError);
    for(let i=0;i<w*h;i++){a.set([0,255,0,255],i*4);}
    expect(()=>chromaKeyPng(encodePng(w,h,a))).toThrow(BadChromaError);
  });
  it('chroma: sprite no centro, sem franja', () => {
    const w=64,h=64;const a=new Uint8Array(w*h*4);for(let i=0;i<w*h;i++)a.set([0,255,0,255],i*4);
    for(let y=20;y<44;y++)for(let x=20;x<44;x++)a.set([200,40,40,255],(y*w+x)*4);
    const out=decodePng(chromaKeyPng(encodePng(w,h,a)));
    let green=0,op=0;for(let i=0;i<out.width*out.height;i++){if(out.data[i*4+3]){op++; if(out.data[i*4+1]>Math.max(out.data[i*4],out.data[i*4+2]))green++;}}
    expect(op).toBe(24*24);expect(green).toBe(0);
  });
  it('chroma: 1 pixel de sprite (ilha < 24) -> bad-chroma', () => {
    const w=40,h=40;const a=new Uint8Array(w*h*4);for(let i=0;i<w*h;i++)a.set([0,255,0,255],i*4);a.set([200,40,40,255],(20*w+20)*4);
    expect(()=>chromaKeyPng(encodePng(w,h,a))).toThrow(BadChromaError);
  });
});
