// Generates og.png (1200x630 link preview) and icon.png (180x180 touch icon)
// in the repo root, drawn in the game's pixel style. Zero dependencies: pixels
// are laid out by hand and encoded as PNG via node's zlib.
//
//   node tools/make-og.js
//
// The font glyphs, mower sprite, and palette are duplicated from index.html —
// if the game's logo art changes, regenerate by updating these and re-running.
'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/* ---------- minimal PNG encoder (RGB, 8-bit) ---------- */
const CRC_T = [];
for (let n=0;n<256;n++){
  let c = n;
  for (let k=0;k<8;k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_T[n] = c >>> 0;
}
function crc32(buf){
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_T[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data){
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function writePng(file, lw, lh, scale, px /* Uint8Array lw*lh*3 */){
  const W = lw*scale, H = lh*scale;
  const raw = Buffer.alloc(H * (1 + W*3));
  let o = 0;
  for (let y=0;y<H;y++){
    raw[o++] = 0;                                    // filter: none
    const ly = (y/scale)|0;
    for (let x=0;x<W;x++){
      const li = (ly*lw + ((x/scale)|0)) * 3;
      raw[o++] = px[li]; raw[o++] = px[li+1]; raw[o++] = px[li+2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2;                          // 8-bit RGB
  const png = Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  console.log(file, W + 'x' + H, png.length + ' bytes');
}

/* ---------- tiny drawing surface ---------- */
function surface(w, h){
  return { w, h, px: new Uint8Array(w*h*3) };
}
function hex(c){ return [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)]; }
function rect(s, c, x, y, w, h){
  const [r,g,b] = hex(c);
  for (let yy=Math.max(0,y); yy<Math.min(s.h, y+h); yy++)
    for (let xx=Math.max(0,x); xx<Math.min(s.w, x+w); xx++){
      const i = (yy*s.w + xx)*3;
      s.px[i] = r; s.px[i+1] = g; s.px[i+2] = b;
    }
}

/* ---------- duplicated game art (see index.html) ---------- */
const FONT = {
  A:[2,5,7,5,5],B:[6,5,6,5,6],C:[3,4,4,4,3],D:[6,5,5,5,6],E:[7,4,6,4,7],
  F:[7,4,6,4,4],G:[3,4,5,5,3],H:[5,5,7,5,5],I:[7,2,2,2,7],J:[1,1,1,5,2],
  K:[5,5,6,5,5],L:[4,4,4,4,7],M:[7,7,5,5,5],N:[6,5,5,5,5],O:[2,5,5,5,2],
  P:[6,5,6,4,4],Q:[2,5,5,6,3],R:[6,5,6,5,5],S:[3,4,2,1,6],T:[7,2,2,2,2],
  U:[5,5,5,5,7],V:[5,5,5,5,2],W:[5,5,5,7,7],X:[5,5,2,5,5],Y:[5,5,2,2,2],
  Z:[7,1,2,4,7],' ':[0,0,0,0,0],'.':[0,0,0,0,2],'!':[2,2,2,0,2],
};
const FONT_WIDE_W = [17,17,21,21,10];   // 5px-wide W, matches index.html
function text(s, str, x, y, sc, col){
  for (const ch of str){
    if (ch === 'W'){
      for (let r=0;r<5;r++)
        for (let c2=0;c2<5;c2++)
          if ((FONT_WIDE_W[r]>>(4-c2)) & 1) rect(s, col, x+c2*sc, y+r*sc, sc, sc);
      x += 6*sc;
      continue;
    }
    const g = FONT[ch];
    if (g) for (let r=0;r<5;r++)
      for (let c2=0;c2<3;c2++)
        if ((g[r]>>(2-c2)) & 1) rect(s, col, x+c2*sc, y+r*sc, sc, sc);
    x += 4*sc;
  }
}
function textW(str, sc){
  let w = 0;
  for (const ch of str) w += ch === 'W' ? 6*sc : 4*sc;
  return w - sc;
}
function textC(s, str, cx, y, sc, col){ text(s, str, Math.round(cx - textW(str, sc)/2), y, sc, col); }

const SPAL = {
  s:'#eab98a', b:'#3e6fae', r:'#d04a35', d:'#9c2f21', h:'#ea7a5a',
  k:'#1c1a16', g:'#8f9389', y:'#ffd94a', x:'#56524a', u:'#2f6b2a',
};
const MOWER_R = [
  "......kkkk........",
  ".....kuuuuk.......",
  ".....kusssk.......",
  "......kssk........",
  ".....kbbbbk..gg...",
  "....kbbbbbbk..g...",
  "....kbbbbbbkkg....",
  "...kdrrhhhhhrrrk..",
  "..kdrrrrrrrrrrrkyk",
  ".kkkkrrrrrrrrrrrk.",
  "kkxxkkddddddddkkk.",
  "kkxxkk.ddddd.kxxk.",
  ".kkkk........kkk..",
];
function sprite(s, map, x, y, sc){
  for (let r=0;r<map.length;r++)
    for (let c2=0;c2<map[r].length;c2++){
      const ch = map[r][c2];
      if (ch !== '.') rect(s, SPAL[ch], x+c2*sc, y+r*sc, sc, sc);
    }
}
function lawn(s, y0, h, stripeW){
  for (let x=0;x<s.w;x+=stripeW)
    rect(s, ((x/stripeW)|0)%2 ? '#8ac74f' : '#9ed65e', x, y0, stripeW, h);
  let seed = 12345;
  const rnd = () => (seed = (seed*1103515245 + 12345) & 0x7FFFFFFF) / 0x7FFFFFFF;
  for (let i=0;i<s.w*h/28;i++)
    rect(s, '#7cb544', (rnd()*s.w)|0, y0 + ((rnd()*h)|0), 1, 2);
}
function fence(s, y, h){
  rect(s, '#b3a785', 0, y+3, s.w, 2);
  for (let x=2;x<s.w;x+=8){
    rect(s, '#e3d9b8', x, y+1, 4, h-1);
    rect(s, '#e3d9b8', x+1, y, 2, 1);
    rect(s, '#b3a785', x+3, y+1, 1, h-1);
  }
}
function logo(s, cx, y, sc){
  for (const o of [[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,-1],[-1,1],[1,1]])
    textC(s, 'LAWNMASTER', cx+o[0], y+o[1], sc, '#1e3a12');
  textC(s, 'LAWNMASTER', cx, y, sc, '#d3f292');
  // darker lower half, clipped the cheap way: redraw and mask by row
  const half = Math.round(sc*2.75);
  const keep = s.px.slice();
  textC(s, 'LAWNMASTER', cx, y, sc, '#7fc040');
  for (let yy=0; yy<y+half; yy++)
    for (let xx=0; xx<s.w; xx++){
      const i = (yy*s.w+xx)*3;
      s.px[i] = keep[i]; s.px[i+1] = keep[i+1]; s.px[i+2] = keep[i+2];
    }
}

/* ---------- og.png : 240x126 logical, x5 = 1200x630 ---------- */
const og = surface(240, 126);
lawn(og, 0, 126, 16);
fence(og, 4, 9);
logo(og, 120, 32, 5);
rect(og, '#1d3a20', 0, 72, 240, 16);
rect(og, '#0f1f10', 0, 71, 240, 1);
rect(og, '#0f1f10', 0, 88, 240, 1);
textC(og, 'MOW. SPRAY. HONK. SURVIVE THE HOA.', 120, 77, 1, '#f2eac9');
rect(og, '#9ed65e', 0, 104, 168, 10);              // freshly cut wake
sprite(og, MOWER_R, 150, 97, 2);
writePng(path.join(__dirname, '..', 'og.png'), 240, 126, 5, og.px);

/* ---------- icon.png : 36x36 logical, x5 = 180x180 ---------- */
const ic = surface(36, 36);
lawn(ic, 0, 36, 9);
rect(ic, '#9ed65e', 0, 24, 30, 8);                 // cut wake behind the mower
sprite(ic, MOWER_R, 0, 6, 2);
writePng(path.join(__dirname, '..', 'icon.png'), 36, 36, 5, ic.px);
