import sharp from 'sharp';
const [,,SRC,OUT,SIZE='128']=process.argv;
const S=+SIZE;
const {data,info}=await sharp(SRC).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const W=info.width,H=info.height,px=Buffer.from(data);
for(let i=0;i<W*H;i++){const r=px[i*4],g=px[i*4+1],b=px[i*4+2];
  if(g>110&&g>r+55&&b<g-40&&r<g-40){px[i*4+3]=0;continue;}
  const mx=Math.max(r,b); if(g>mx+20)px[i*4+1]=mx;}
const on=i=>px[i*4+3]>25;
const comp=new Int32Array(W*H).fill(-1),size=[];
for(let k=0;k<W*H;k++){if(comp[k]!==-1||!on(k))continue;const id=size.length;let n=0;const st=[k];comp[k]=id;
 while(st.length){const c=st.pop();n++;const cx=c%W,cy=(c-cx)/W;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=cx+dx,ny=cy+dy;
   if(nx<0||ny<0||nx>=W||ny>=H)continue;const kk=ny*W+nx;if(comp[kk]!==-1||!on(kk))continue;comp[kk]=id;st.push(kk);}}
 size.push(n);}
let killed=0;
for(let k=0;k<W*H;k++) if(comp[k]!==-1&&size[comp[k]]<24){px[k*4+3]=0;killed++;}
let minX=W,minY=H,maxX=-1,maxY=-1;
for(let k=0;k<W*H;k++) if(px[k*4+3]>25){const x=k%W,y=(k-x)/W;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
const cw=maxX-minX+1,ch=maxY-minY+1,s=Math.min(S/cw,S/ch);
const dw=Math.max(1,Math.round(cw*s)),dh=Math.max(1,Math.round(ch*s));
const cropped=await sharp(px,{raw:{width:W,height:H,channels:4}})
  .extract({left:minX,top:minY,width:cw,height:ch}).resize(dw,dh,{kernel:'nearest'}).png().toBuffer();
await sharp({create:{width:S,height:S,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
  .composite([{input:cropped,left:Math.round((S-dw)/2),top:Math.round((S-dh)/2)}]).png().toFile(OUT);
console.log(JSON.stringify({killed,bbox:[minX,minY,cw,ch],out:[dw,dh]}));
