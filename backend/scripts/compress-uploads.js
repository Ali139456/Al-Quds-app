/**
 * One-off: compress large images under backend/uploads (run from repo root).
 * node backend/scripts/compress-uploads.js
 */
const fs = require('fs');
const path = require('path');
const { optimizeImageFile, hasSharp } = require('../image-service');

const uploadsRoot = path.join(__dirname, '..', 'uploads');

async function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
      const before = fs.statSync(full).size;
      if (before < 300000) continue;
      const ok = await optimizeImageFile(full);
      if (ok) {
        const after = fs.statSync(full).size;
        console.log(`${path.relative(uploadsRoot, full)}: ${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB`);
      }
    }
  }
}

(async () => {
  if (!hasSharp()) {
    console.error('Install sharp first: cd backend && npm install');
    process.exit(1);
  }
  console.log('Compressing uploads in', uploadsRoot);
  await walk(uploadsRoot);
  console.log('Done.');
})();
