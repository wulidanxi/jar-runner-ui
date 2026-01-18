const fs = require("fs");
const path = require("path");

const assetsDir = path.resolve(__dirname, "..", "assets");
const pngPath = path.join(assetsDir, "icon.png");
const icoPath = path.join(assetsDir, "icon.ico");

if (!fs.existsSync(pngPath)) {
  console.error("PNG not found:", pngPath);
  process.exit(1);
}

const pngBuf = fs.readFileSync(pngPath);
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
const dir = Buffer.alloc(16);
dir.writeUInt8(0, 0);
dir.writeUInt8(0, 1);
dir.writeUInt8(0, 2);
dir.writeUInt8(0, 3);
dir.writeUInt16LE(0, 4);
dir.writeUInt16LE(32, 6);
dir.writeUInt32LE(pngBuf.length, 8);
dir.writeUInt32LE(6 + 16, 12);
const icoBuf = Buffer.concat([header, dir, pngBuf]);
fs.writeFileSync(icoPath, icoBuf);
console.log("ICO generated at", icoPath);
