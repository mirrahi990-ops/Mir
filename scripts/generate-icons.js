import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Helper to write a basic uncompressed/deflated RGBA PNG
function createPng(width, height, colorFn) {
  const bytesPerPixel = 4;
  const rowBytes = width * bytesPerPixel;
  const rawData = Buffer.alloc(height * (rowBytes + 1));

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = colorFn(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

// Simple CRC32 for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate icon color function (Dark cyan/blue water drop aesthetic)
const iconColorFn = (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / (w / 2);
  const dy = (y - cy) / (h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Rounded background squircle
  if (Math.abs(dx) > 0.88 || Math.abs(dy) > 0.88) {
    if (dist > 1.1) return [0, 0, 0, 0]; // Transparent outside
  }

  // Inside drop
  const dropDy = (y - (cy + h * 0.08)) / (h * 0.35);
  const dropDx = (x - cx) / (w * 0.3);
  const inDrop = (dropDx * dropDx + dropDy * dropDy) < 0.8 || (Math.abs(x - cx) < (cy - y) * 0.5 && y > cy - h * 0.25 && y < cy + h * 0.35);

  if (inDrop) {
    // Cyan to blue water gradient
    const t = y / h;
    const r = Math.round(6 + (56 - 6) * t);
    const g = Math.round(182 + (189 - 182) * t);
    const b = Math.round(212 + (248 - 212) * t);
    return [r, g, b, 255];
  }

  // Slate 950 background
  return [15, 23, 42, 255];
};

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, iconColorFn));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, iconColorFn));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, iconColorFn));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, iconColorFn));
console.log('PNG icons generated successfully in public/');
