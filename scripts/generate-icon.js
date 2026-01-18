const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const width = 256;
const height = 256;
const png = new PNG({ width, height });

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexToRgb(hex) {
  const n = hex.replace("#", "");
  const bigint = parseInt(n, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function setPixel(x, y, r, g, b, a = 255) {
  const idx = (width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

const top = hexToRgb("#0f172a");
const bottom = hexToRgb("#334155");
for (let y = 0; y < height; y++) {
  const t = y / (height - 1);
  const r = Math.round(lerp(top.r, bottom.r, t));
  const g = Math.round(lerp(top.g, bottom.g, t));
  const b = Math.round(lerp(top.b, bottom.b, t));
  for (let x = 0; x < width; x++) {
    setPixel(x, y, r, g, b, 255);
  }
}

const cx = width / 2;
const cy = height / 2;
const radius = 92;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < radius) {
      const falloff = 1 - d / radius;
      const a = Math.floor(falloff * 48);
      const idx = (width * y + x) << 2;
      png.data[idx + 3] = Math.min(255, png.data[idx + 3] + a);
    }
  }
}

function pointInPolygon(px, py, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0],
      yi = points[i][1];
    const xj = points[j][0],
      yj = points[j][1];
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + 0.00001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function insideRoundedRect(px, py, lx, ty, w, h, r) {
  const rx = px - lx;
  const ry = py - ty;
  if (rx < 0 || ry < 0 || rx > w || ry > h) return false;
  if (rx < r && ry < r) {
    const dx = rx - r;
    const dy = ry - r;
    return dx * dx + dy * dy <= r * r;
  }
  if (rx > w - r && ry < r) {
    const dx = rx - (w - r);
    const dy = ry - r;
    return dx * dx + dy * dy <= r * r;
  }
  if (rx < r && ry > h - r) {
    const dx = rx - r;
    const dy = ry - (h - r);
    return dx * dx + dy * dy <= r * r;
  }
  if (rx > w - r && ry > h - r) {
    const dx = rx - (w - r);
    const dy = ry - (h - r);
    return dx * dx + dy * dy <= r * r;
  }
  return true;
}

function insideEllipse(px, py, ex, ey, rx, ry) {
  const dx = (px - ex) / rx;
  const dy = (py - ey) / ry;
  return dx * dx + dy * dy <= 1;
}

const cupBodyColor = hexToRgb("#f1f5f9");
const cupStrokeColor = hexToRgb("#94a3b8");
const cupX = Math.round(cx - 50);
const cupY = Math.round(cy - 20);
const cupW = 100;
const cupH = 70;
const cupR = 14;
for (let y = cupY; y <= cupY + cupH; y++) {
  for (let x = cupX; x <= cupX + cupW; x++) {
    if (insideRoundedRect(x, y, cupX, cupY, cupW, cupH, cupR)) {
      setPixel(x, y, cupBodyColor.r, cupBodyColor.g, cupBodyColor.b, 230);
    }
  }
}
for (let y = cupY; y <= cupY + cupH; y++) {
  for (let x = cupX; x <= cupX + cupW; x++) {
    const outer = insideRoundedRect(x, y, cupX, cupY, cupW, cupH, cupR);
    const inner = insideRoundedRect(
      x,
      y,
      cupX + 1,
      cupY + 1,
      cupW - 2,
      cupH - 2,
      Math.max(0, cupR - 1)
    );
    if (outer && !inner) {
      setPixel(x, y, cupStrokeColor.r, cupStrokeColor.g, cupStrokeColor.b, 255);
    }
  }
}

const handleCX = cupX + cupW - 8;
const handleCY = cupY + 32;
const handleOuter = 18;
const handleInner = 11;
for (let y = handleCY - handleOuter; y <= handleCY + handleOuter; y++) {
  for (let x = handleCX - handleOuter; x <= handleCX + handleOuter; x++) {
    const dx = x - handleCX;
    const dy = y - handleCY;
    const d2 = dx * dx + dy * dy;
    if (d2 < handleOuter * handleOuter && d2 > handleInner * handleInner) {
      setPixel(x, y, cupStrokeColor.r, cupStrokeColor.g, cupStrokeColor.b, 255);
    }
  }
}

const plateRX = 70;
const plateRY = 10;
const plateCX = Math.round(cx);
const plateCY = cupY + cupH + 14;
const plateFill = hexToRgb("#e5e7eb");
const plateStroke = hexToRgb("#64748b");
for (let y = plateCY - plateRY; y <= plateCY + plateRY; y++) {
  for (let x = plateCX - plateRX; x <= plateCX + plateRX; x++) {
    if (insideEllipse(x, y, plateCX, plateCY, plateRX, plateRY)) {
      setPixel(x, y, plateFill.r, plateFill.g, plateFill.b, 200);
    }
  }
}
for (let y = plateCY - plateRY; y <= plateCY + plateRY; y++) {
  for (let x = plateCX - plateRX; x <= plateCX + plateRX; x++) {
    const outer = insideEllipse(x, y, plateCX, plateCY, plateRX, plateRY);
    const inner = insideEllipse(
      x,
      y,
      plateCX,
      plateCY,
      plateRX - 1,
      plateRY - 1
    );
    if (outer && !inner) {
      setPixel(x, y, plateStroke.r, plateStroke.g, plateStroke.b, 255);
    }
  }
}

const steamColor = hexToRgb("#ef4444");
const s1 = [
  [Math.round(cx - 24), cupY - 6],
  [Math.round(cx - 18), cupY - 44],
  [Math.round(cx - 12), cupY - 6],
];
const s2 = [
  [Math.round(cx - 6), cupY - 2],
  [Math.round(cx), cupY - 40],
  [Math.round(cx + 6), cupY - 2],
];
const s3 = [
  [Math.round(cx + 12), cupY - 8],
  [Math.round(cx + 18), cupY - 46],
  [Math.round(cx + 24), cupY - 8],
];
const sp = [s1, s2, s3];
for (const tri of sp) {
  const minX = Math.min(...tri.map((p) => p[0]));
  const maxX = Math.max(...tri.map((p) => p[0]));
  const minY = Math.min(...tri.map((p) => p[1]));
  const maxY = Math.max(...tri.map((p) => p[1]));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pointInPolygon(x + 0.5, y + 0.5, tri)) {
        setPixel(x, y, steamColor.r, steamColor.g, steamColor.b, 220);
      }
    }
  }
}

const speedColor = hexToRgb("#22c55e");
const arrow = [
  [Math.round(cx + 34), cupY + 6],
  [Math.round(cx + 34), cupY + 58],
  [Math.round(cx + 92), cupY + 32],
];
const aminX = Math.min(...arrow.map((p) => p[0]));
const amaxX = Math.max(...arrow.map((p) => p[0]));
const aminY = Math.min(...arrow.map((p) => p[1]));
const amaxY = Math.max(...arrow.map((p) => p[1]));
for (let y = aminY; y <= amaxY; y++) {
  for (let x = aminX; x <= amaxX; x++) {
    if (pointInPolygon(x + 0.5, y + 0.5, arrow)) {
      setPixel(x + 1, y + 1, 0, 0, 0, 40);
      setPixel(x, y, speedColor.r, speedColor.g, speedColor.b, 255);
    }
  }
}
for (const ly of [cupY + 18, cupY + 32, cupY + 46]) {
  for (let y = ly; y <= ly + 4; y++) {
    for (let x = Math.round(cx + 8); x <= Math.round(cx + 30); x++) {
      setPixel(x, y, speedColor.r, speedColor.g, speedColor.b, 160);
    }
  }
}

const outDir = path.resolve(__dirname, "..", "assets");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "icon.png");
png
  .pack()
  .pipe(fs.createWriteStream(outPath))
  .on("finish", async () => {
    console.log("Icon generated at", outPath);
    try {
      const toIco = require("to-ico");
      const pngBuf = fs.readFileSync(outPath);
      const icoBuf = await toIco([pngBuf]);
      const icoPath = path.join(outDir, "icon.ico");
      fs.writeFileSync(icoPath, icoBuf);
      console.log("ICO generated at", icoPath);
    } catch (e) {
      console.warn(
        "ICO generation failed, please ensure to-ico installed.",
        e?.message || e
      );
    }
  });
