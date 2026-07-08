const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (_) {
  sharp = null;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeUploadPath(uploadsRoot, urlPath) {
  const normalized = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const full = path.join(uploadsRoot, normalized);
  if (!full.startsWith(uploadsRoot)) return null;
  return full;
}

function createImageResizeMiddleware(uploadsRoot, cacheDir) {
  ensureDir(cacheDir);

  return async function imageResizeMiddleware(req, res, next) {
    if (!sharp) return next();

    const width = parseInt(req.query.w, 10);
    const quality = Math.min(90, Math.max(40, parseInt(req.query.q, 10) || 75));
    if (!width || width < 64 || width > 2400) return next();

    const rel = req.path.replace(/^\//, '');
    if (!rel || !/\.(jpe?g|png|webp|gif)$/i.test(rel)) return next();

    const filePath = safeUploadPath(uploadsRoot, rel);
    if (!filePath || !fs.existsSync(filePath)) return next();

    try {
      const stat = fs.statSync(filePath);
      const cacheKey =
        crypto.createHash('md5').update(`${rel}:${stat.mtimeMs}:${width}:${quality}`).digest('hex') + '.webp';
      const cachePath = path.join(cacheDir, cacheKey);

      if (!fs.existsSync(cachePath)) {
        await sharp(filePath)
          .rotate()
          .resize(width, null, { withoutEnlargement: true, fit: 'inside' })
          .webp({ quality, effort: 4 })
          .toFile(cachePath);
      }

      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Vary', 'Accept');
      return res.sendFile(cachePath);
    } catch (err) {
      console.warn('[image-resize]', rel, err.message);
      return next();
    }
  };
}

/** Compress source file in place (max width, strip metadata). */
async function optimizeImageFile(filePath, maxWidth = 1400) {
  if (!sharp || !filePath || !fs.existsSync(filePath)) return false;
  const ext = path.extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return false;

  try {
    const tmp = filePath + '.opt.tmp';
    const pipeline = sharp(filePath).rotate().resize(maxWidth, null, {
      withoutEnlargement: true,
      fit: 'inside',
    });

    if (ext === '.png') {
      await pipeline.png({ compressionLevel: 9, effort: 7 }).toFile(tmp);
    } else if (ext === '.webp') {
      await pipeline.webp({ quality: 82 }).toFile(tmp);
    } else {
      await pipeline.jpeg({ quality: 82, mozjpeg: true }).toFile(tmp);
    }

    fs.renameSync(tmp, filePath);
    return true;
  } catch (err) {
    console.warn('[image-optimize]', filePath, err.message);
    try {
      if (fs.existsSync(filePath + '.opt.tmp')) fs.unlinkSync(filePath + '.opt.tmp');
    } catch (_) {}
    return false;
  }
}

async function optimizeUploadsDir(dir) {
  if (!sharp || !fs.existsSync(dir)) return { ok: 0, skip: 0 };
  let ok = 0;
  let skip = 0;
  const walk = (folder) => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
        const stat = fs.statSync(full);
        if (stat.size > 350000) ok++;
        else skip++;
      }
    }
  };
  walk(dir);
  return { ok, skip };
}

module.exports = {
  createImageResizeMiddleware,
  optimizeImageFile,
  optimizeUploadsDir,
  hasSharp: () => !!sharp,
};
