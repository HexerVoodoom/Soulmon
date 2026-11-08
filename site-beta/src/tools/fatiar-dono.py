# Fatia as folhas do dono (src/assets-dono) em peças em public/dono. Lossless nos recortes; redução só nos cartões (LANCZOS, arte não é grade de pixel).
from PIL import Image
import numpy as np, os
A='src/assets-dono/'; O='public/dono/'; os.makedirs(O,exist_ok=True)
t=Image.open(A+'Pixel-Art Sci-Fi Triptych UI Panel.png').convert('RGBA')
a=np.array(t)[:,:,3]; col=(a>40).sum(0)
# cada cartão = trecho contínuo largo; o "elo" de gema entre eles tem poucas linhas
runs=[];ini=None
for x,v in enumerate(col):
    ok=v>400
    if ok and ini is None: ini=x
    if not ok and ini is not None:
        if x-ini>200: runs.append((ini,x))
        ini=None
if ini is not None: runs.append((ini,len(col)))
print('cartões',runs)
for i,(x0,x1) in enumerate(runs[:3]):
    c=t.crop((x0,0,x1,t.height)); bb=c.getbbox(); c=c.crop(bb)
    c=c.resize((420,round(420*c.height/c.width)),Image.LANCZOS); c.save(O+f'passo-card-{i+1}.png'); print(i+1,c.size,bb)
