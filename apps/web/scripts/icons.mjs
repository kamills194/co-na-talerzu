import { deflateSync } from 'node:zlib';
import { writeFile } from 'node:fs/promises';
function crc(b){let c=0xffffffff;for(const v of b){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),len=Buffer.alloc(4),checksum=Buffer.alloc(4);len.writeUInt32BE(data.length);checksum.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([len,t,data,checksum]);}
for(const size of [192,512]){
  const pixels=Buffer.alloc((size*4+1)*size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const a=(x/size-.5),b=(y/size-.5),d=Math.hypot(a,b);
    let rgb=[35,77,60];if(d<.34)rgb=[255,250,241];if(d>.26&&d<.27)rgb=[222,207,174];
    const u=(a+b)*.707,v=(a-b)*.707;if((u/.12)**2+(v/.22)**2<1)rgb=[105,139,76];
    const offset=y*(size*4+1)+1+x*4;pixels.set([...rgb,255],offset);
  }
  const h=Buffer.alloc(13);h.writeUInt32BE(size);h.writeUInt32BE(size,4);h[8]=8;h[9]=6;
  await writeFile(new URL(`../src/icon-${size}.png`,import.meta.url),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]));
}
