// Generates PWA icons into public/icons using only node built-ins (zlib PNG encoder).
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const INK = [15, 27, 45];
const HIVIS = [255, 212, 0];
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, c]);
};
function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

// W glyph as a thick polyline in unit space, centred on (0.5, 0.5)
const W = [[0.2, 0.3], [0.35, 0.7], [0.5, 0.42], [0.65, 0.7], [0.8, 0.3]];
const segDist = (px, py, [ax, ay], [bx, by]) => {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};

function render(size, { scale, rounded }) {
  const buf = Buffer.alloc(size * size * 4);
  const SS = 3;
  const r = rounded ? 0.22 : 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0, fg = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x + (sx + 0.5) / SS) / size, v = (y + (sy + 0.5) / SS) / size;
          // rounded-square coverage
          const qx = Math.abs(u - 0.5) - (0.5 - r), qy = Math.abs(v - 0.5) - (0.5 - r);
          const inside = r === 0 || Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) <= r;
          if (!inside) continue;
          bg++;
          const gu = (u - 0.5) / scale + 0.5, gv = (v - 0.5) / scale + 0.5;
          let d = 9;
          for (let i = 0; i < W.length - 1; i++) d = Math.min(d, segDist(gu, gv, W[i], W[i + 1]));
          if (d <= 0.052) fg++;
        }
      }
      const n = SS * SS, o = (y * size + x) * 4;
      const a = bg / n, f = fg / Math.max(bg, 1);
      buf[o] = Math.round(INK[0] + (HIVIS[0] - INK[0]) * f);
      buf[o + 1] = Math.round(INK[1] + (HIVIS[1] - INK[1]) * f);
      buf[o + 2] = Math.round(INK[2] + (HIVIS[2] - INK[2]) * f);
      buf[o + 3] = Math.round(a * 255);
    }
  }
  return png(size, buf);
}

mkdirSync("public/icons", { recursive: true });
const out = (name, size, opts) => writeFileSync(`public/icons/${name}`, render(size, opts));
out("icon-192.png", 192, { scale: 1, rounded: true });
out("icon-512.png", 512, { scale: 1, rounded: true });
out("icon-maskable-512.png", 512, { scale: 0.78, rounded: false });
out("apple-touch-icon.png", 180, { scale: 0.9, rounded: false });
console.log("icons written");
