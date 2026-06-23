const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { init } = require('./db/connection');
const multer = require('multer');

const PORT = Number(process.env.PORT) || 4000;

function isInRawalpindi(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  return (
    latitude >= 33.55 &&
    latitude <= 33.68 &&
    longitude >= 72.92 &&
    longitude <= 73.18
  );
}
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'alquds.db');
const uploadsDir = path.join(__dirname, 'uploads', 'banners');
const menuUploadsDir = path.join(__dirname, 'uploads', 'menu');
const paymentsDir = path.join(__dirname, 'uploads', 'payments');
const dealsUploadsDir = path.join(__dirname, 'uploads', 'deals');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(menuUploadsDir)) {
  fs.mkdirSync(menuUploadsDir, { recursive: true });
}
if (!fs.existsSync(paymentsDir)) {
  fs.mkdirSync(paymentsDir, { recursive: true });
}
if (!fs.existsSync(dealsUploadsDir)) {
  fs.mkdirSync(dealsUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = (file.mimetype === 'image/png') ? '.png' : (file.mimetype === 'image/gif') ? '.gif' : (file.mimetype === 'image/webp') ? '.webp' : '.jpg';
    cb(null, 'banner-' + Date.now() + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const paymentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, paymentsDir),
  filename: (req, file, cb) => {
    const ext = file.mimetype === 'image/png' ? '.png' : file.mimetype === 'image/webp' ? '.webp' : '.jpg';
    cb(null, 'payment-' + Date.now() + ext);
  },
});
const uploadPayment = multer({ storage: paymentStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const menuStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, menuUploadsDir),
  filename: (req, file, cb) => {
    const ext =
      file.mimetype === 'image/png'
        ? '.png'
        : file.mimetype === 'image/gif'
          ? '.gif'
          : file.mimetype === 'image/webp'
            ? '.webp'
            : '.jpg';
    const itemId = (req.body && req.body.itemId) || '';
    if (itemId && /^[a-zA-Z0-9_-]+$/.test(itemId)) {
      cb(null, itemId + ext);
    } else {
      cb(null, 'menu-' + Date.now() + ext);
    }
  },
});
const uploadMenu = multer({ storage: menuStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const categoryUploadsDir = path.join(menuUploadsDir, 'categories');
if (!fs.existsSync(categoryUploadsDir)) {
  fs.mkdirSync(categoryUploadsDir, { recursive: true });
}
const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, categoryUploadsDir),
  filename: (req, file, cb) => {
    const ext =
      file.mimetype === 'image/png'
        ? '.png'
        : file.mimetype === 'image/gif'
          ? '.gif'
          : file.mimetype === 'image/webp'
            ? '.webp'
            : '.jpg';
    const categoryId = (req.body && req.body.categoryId) || '';
    if (categoryId && /^[a-zA-Z0-9_-]+$/.test(categoryId)) {
      cb(null, categoryId + ext);
    } else {
      cb(null, 'cat-' + Date.now() + ext);
    }
  },
});
const uploadCategory = multer({ storage: categoryStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const addonUploadsDir = path.join(menuUploadsDir, 'addons');
if (!fs.existsSync(addonUploadsDir)) {
  fs.mkdirSync(addonUploadsDir, { recursive: true });
}
const addonStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, addonUploadsDir),
  filename: (req, file, cb) => {
    const ext =
      file.mimetype === 'image/png'
        ? '.png'
        : file.mimetype === 'image/gif'
          ? '.gif'
          : file.mimetype === 'image/webp'
            ? '.webp'
            : '.jpg';
    const itemId = (req.body && req.body.itemId) || '';
    if (itemId && /^[a-zA-Z0-9_-]+$/.test(itemId)) {
      cb(null, itemId + ext);
    } else {
      cb(null, 'addon-' + Date.now() + ext);
    }
  },
});
const uploadAddon = multer({ storage: addonStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const dealStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dealsUploadsDir),
  filename: (req, file, cb) => {
    const ext = file.mimetype === 'image/png' ? '.png' : file.mimetype === 'image/webp' ? '.webp' : file.mimetype === 'image/gif' ? '.gif' : '.jpg';
    cb(null, 'deal-' + Date.now() + ext);
  },
});
const uploadDeal = multer({ storage: dealStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'al-quds-api', ready: serverReady });
});

app.get('/', (_req, res) => {
  res.redirect('/admin');
});

let run, all, get, getParams, allParams, save;
let serverReady = false;
let notifyRidersNewOrder = () => {};
let pushService = null;
let trash = null;
let inventoryService = null;

function buildMenuImageMap() {
  const map = {};
  try {
    all('SELECT id, image, category FROM menu_items').forEach((m) => {
      if (m.category === 'fries') map[m.id] = '🍟';
      else if (m.category === 'drinks') map[m.id] = '🥤';
      else map[m.id] = m.image || '🍔';
    });
  } catch (_) {}
  return map;
}

function isEmojiImage(value) {
  return value && !value.startsWith('/') && !value.startsWith('http') && !value.startsWith('data:');
}

function readImageAsDataUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('data:')) return imagePath;
  if (isEmojiImage(imagePath)) return imagePath;

  let filePath = null;
  if (imagePath.startsWith('/uploads/')) {
    filePath = path.join(__dirname, imagePath.replace(/^\//, '').split('/').join(path.sep));
  } else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(imagePath)) {
    filePath = path.join(menuUploadsDir, imagePath);
  }
  if (!filePath || !fs.existsSync(filePath)) return null;

  try {
    const buf = fs.readFileSync(filePath);
    if (buf.length > 900000) return imagePath;
    const ext = path.extname(filePath).toLowerCase();
    const mime =
      ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch (_) {
    return null;
  }
}

function snapshotOrderItemImage(foodId, clientImage) {
  let imagePath = clientImage || null;
  if (!imagePath && foodId) {
    const row = getParams('SELECT image, category FROM menu_items WHERE id = ?', [foodId]);
    if (row?.category === 'fries') return '🍟';
    if (row?.category === 'drinks') return '🥤';
    imagePath = row?.image || null;
  }
  if (!imagePath) {
    if (foodId && /fries/i.test(foodId)) return '🍟';
    if (foodId && String(foodId).startsWith('addon_')) return '🥤';
    return '🍔';
  }
  if (isEmojiImage(imagePath)) return imagePath;
  const dataUrl = readImageAsDataUrl(imagePath);
  return dataUrl || imagePath;
}

function resolveItemImage(foodId, storedImage, menuMap) {
  if (storedImage) {
    if (storedImage.startsWith('data:') || isEmojiImage(storedImage)) return storedImage;
    const dataUrl = readImageAsDataUrl(storedImage);
    return dataUrl || storedImage;
  }
  if (foodId && menuMap[foodId]) {
    const fromMenu = menuMap[foodId];
    if (isEmojiImage(fromMenu)) return fromMenu;
    const dataUrl = readImageAsDataUrl(fromMenu);
    return dataUrl || fromMenu;
  }
  if (foodId && /fries/i.test(foodId)) return '🍟';
  if (foodId && String(foodId).startsWith('addon_')) return '🥤';
  return '🍔';
}

function backfillOrderItemImages() {
  try {
    const items = all('SELECT id, food_id, image FROM order_items');
    const menuMap = buildMenuImageMap();
    for (const it of items) {
      const current = it.image || '';
      if (current.startsWith('data:') || isEmojiImage(current)) continue;
      const snap = snapshotOrderItemImage(it.food_id, current || menuMap[it.food_id]);
      if (snap && snap !== current) {
        run('UPDATE order_items SET image = ? WHERE id = ?', [snap, it.id]);
      }
    }
  } catch (_) {}
}

function safeNum(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

// ============ API (for app or future use) ============

function parseJson(str) {
  if (!str || typeof str !== 'string') return null;
  try {
    return JSON.parse(str);
  } catch (_) {
    return null;
  }
}

function mapAddonRow(r) {
  return {
    id: r.id,
    name: r.name,
    price: Number(r.price),
    image: r.image || '',
    inStock: r.in_stock === 1 || r.in_stock === '1' || r.in_stock == null,
  };
}

app.get('/api/addons', (req, res) => {
  try {
    const rows = all('SELECT id, name, price, image, in_stock FROM addons WHERE in_stock = 1 OR in_stock IS NULL ORDER BY name');
    res.json(rows.map(mapAddonRow));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

function slugifyCategoryName(name) {
  const base = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'category';
}

function defaultCategoryImage(id) {
  return `/uploads/menu/categories/${id}.jpg`;
}

function normalizeCategoryImage(id, image) {
  const img = String(image || '').trim();
  if (img.startsWith('/uploads/')) return img;
  return defaultCategoryImage(id);
}

function mapCategoryRow(r) {
  return {
    id: r.id,
    label: r.name,
    name: r.name,
    icon: r.icon || '🍽️',
    image: normalizeCategoryImage(r.id, r.image),
    sortOrder: Number(r.sort_order) || 0,
    active: r.active === 1 || r.active === '1',
  };
}

app.get('/api/categories', (req, res) => {
  try {
    const rows = all(
      "SELECT id, name, icon, image, sort_order, active FROM menu_categories WHERE active = 1 ORDER BY sort_order, name"
    );
    res.json(rows.map(mapCategoryRow));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.get('/api/menu', (req, res) => {
  try {
    const rows = all('SELECT * FROM menu_items WHERE in_stock = 1 ORDER BY category, id');
    const addonsList = all('SELECT id, name, price, image FROM addons WHERE in_stock = 1 OR in_stock IS NULL');
    const addonsMap = {};
    addonsList.forEach((a) => {
      addonsMap[a.id] = { id: a.id, name: a.name, price: Number(a.price), image: a.image || '' };
    });
    let stockFlags = {};
    try {
      if (inventoryService) stockFlags = inventoryService.getStockFlagsForMenuItems();
    } catch (_) {}
    res.json(
      rows.map((r) => {
        const varieties = parseJson(r.varieties);
        const addonIds = parseJson(r.addon_ids);
        const addons = Array.isArray(addonIds) ? addonIds.map((id) => addonsMap[id]).filter(Boolean) : [];
        const stock = stockFlags[r.id] || { stockAvailable: true, stockMaxQty: 999, stockReason: null };
        return {
          id: r.id,
          name: r.name,
          description: r.description,
          price: r.price,
          category: r.category,
          image: r.image,
          rating: r.rating,
          prepTime: r.prep_time,
          varieties: Array.isArray(varieties) ? varieties : [],
          addons,
          stockAvailable: stock.stockAvailable !== false,
          stockMaxQty: stock.stockMaxQty,
          stockReason: stock.stockReason,
        };
      })
    );
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

function ensureOrderUser(userId, customerName, customerPhone) {
  const uid = userId || 'guest';
  const existing = getParams('SELECT id FROM users WHERE id = ?', [uid]);
  if (existing) return uid;
  const email =
    uid === 'guest'
      ? 'guest@local.app'
      : `${String(uid).replace(/[^a-zA-Z0-9]/g, '') || 'user'}@app.local`;
  run('INSERT OR IGNORE INTO users (id, email, name, phone, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)', [
    uid,
    email,
    customerName || (uid === 'guest' ? 'Guest' : 'Customer'),
    customerPhone || null,
    'customer',
    '',
  ]);
  return uid;
}

app.post('/api/orders', (req, res) => {
  try {
    const storeRow = get("SELECT value FROM app_settings WHERE key = 'store_open'");
    if (storeRow && storeRow.value === '0') {
      return res.status(503).json({ error: 'Store is currently closed. Orders are not being accepted.' });
    }
    const {
      id: bodyId,
      userId,
      items,
      total,
      subtotal,
      addressLabel,
      addressLine,
      latitude,
      longitude,
      customerName,
      customerPhone,
      paymentMethod,
      couponCode,
      couponId,
      discountAmount,
      deliveryFee,
      scheduledAt,
      contactless,
      specialInstructions,
      paymentProofUrl,
      tipAmount,
      walletUsed,
      loyaltyPointsEarned,
    } = req.body;
    if (!items || !Array.isArray(items) || total == null) {
      return res.status(400).json({ error: 'items and total required' });
    }
    if (latitude == null || longitude == null) {
      return res.status(400).json({
        error: 'Delivery location is required. We only accept orders within Rawalpindi.',
      });
    }
    if (!isInRawalpindi(latitude, longitude)) {
      return res.status(400).json({
        error: "Sorry, we don't deliver to this location. Please choose an address within Rawalpindi, Pakistan.",
      });
    }
    if (inventoryService) {
      const stockCheck = inventoryService.validateOrderItems(items);
      if (!stockCheck.ok) {
        const first = stockCheck.errors[0];
        return res.status(409).json({
          error: first?.reason || 'Some items are out of stock',
          stockErrors: stockCheck.errors,
        });
      }
    }
    const id = bodyId && String(bodyId).startsWith('order_') ? bodyId : `order_${Date.now()}`;
    const uid = ensureOrderUser(userId, customerName, customerPhone);
    run(
      `INSERT INTO orders (id, user_id, total, subtotal, address_label, address_line, latitude, longitude, customer_name, customer_phone, status, payment_method, coupon_code, discount_amount, delivery_fee, scheduled_at, contactless, special_instructions, payment_proof_url, tip_amount, wallet_used, loyalty_points_earned) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        uid,
        total,
        subtotal ?? total,
        addressLabel || 'Delivery',
        addressLine || '',
        latitude,
        longitude,
        customerName || '',
        customerPhone || '',
        'placed',
        paymentMethod || 'COD',
        couponCode || null,
        discountAmount || 0,
        deliveryFee || 0,
        scheduledAt || null,
        contactless ? 1 : 0,
        specialInstructions || null,
        paymentProofUrl || null,
        tipAmount || 0,
        walletUsed || 0,
        loyaltyPointsEarned || 0,
      ]
    );
    if (couponId && couponCode) {
      try {
        run('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [couponId]);
        run('INSERT INTO coupon_uses (coupon_id, user_id, order_id) VALUES (?, ?, ?)', [couponId, uid, id]);
      } catch (_) {}
    }
    insertOrderItems(id, items);
    if (uid !== 'guest') {
      const shortId = id.replace('order_', '#');
      const title = 'Order placed!';
      const body = `Your order ${shortId} has been received.`;
      if (pushService) {
        pushService.notifyUser(uid, title, body, { orderId: id, type: 'order_update' });
      } else {
        try {
          run('INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)', [uid, title, body]);
        } catch (_) {}
      }
    }
    try {
      // Riders are assigned manually from the admin dashboard.
    } catch (_) {}
    if (loyaltyPointsEarned > 0 && uid !== 'guest') {
      try {
        const acc = getParams('SELECT user_id FROM loyalty_accounts WHERE user_id = ?', [uid]);
        if (acc) {
          run('UPDATE loyalty_accounts SET points = points + ?, lifetime_points = lifetime_points + ? WHERE user_id = ?', [
            loyaltyPointsEarned,
            loyaltyPointsEarned,
            uid,
          ]);
        } else {
          run('INSERT INTO loyalty_accounts (user_id, points, lifetime_points, referral_code) VALUES (?, ?, ?, ?)', [
            uid,
            loyaltyPointsEarned,
            loyaltyPointsEarned,
            'AQ' + uid.slice(-6).toUpperCase(),
          ]);
        }
      } catch (_) {}
    }
    res.json({ id, status: 'placed' });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { id, email, name, phone } = req.body || {};
    if (!id || !email) return res.status(400).json({ error: 'id and email required' });
    const existing = getParams('SELECT id FROM users WHERE id = ?', [id]);
    if (existing) {
      run('UPDATE users SET email = ?, name = ?, phone = ? WHERE id = ?', [
        email,
        name || email.split('@')[0],
        phone || null,
        id,
      ]);
    } else {
      run('INSERT INTO users (id, email, name, phone, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)', [
        id,
        email,
        name || email.split('@')[0],
        phone || null,
        'customer',
        '123456',
      ]);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.get('/api/orders', (req, res) => {
  try {
    let rows = all(`
      SELECT o.*, GROUP_CONCAT(oi.food_id || ' x' || oi.quantity) as items_summary
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id ORDER BY o.created_at DESC
    `);
    const userId = req.query.userId;
    if (userId) rows = rows.filter((r) => r.user_id === userId);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

// ============ Banners (public + admin) ============
app.get('/api/banners', (req, res) => {
  try {
    const rows = all("SELECT id, title, subtitle, image, link, sort_order FROM banners WHERE (display = 1 OR display IS NULL) ORDER BY sort_order ASC, created_at DESC");
    res.json(rows.map((r) => ({
      id: r.id,
      title: r.title || '',
      subtitle: r.subtitle || '',
      image: r.image || '🍔',
      link: r.link || '',
      sortOrder: r.sort_order != null ? Number(r.sort_order) : 0,
    })));
  } catch (e) {
    res.json([]);
  }
});

app.post('/api/admin/banners/upload', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 5MB)' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = '/uploads/banners/' + req.file.filename;
    res.json({ url });
  });
});

app.get('/api/admin/categories', (req, res) => {
  try {
    const rows = all('SELECT id, name, icon, image, sort_order, active FROM menu_categories ORDER BY sort_order, name');
    res.json(rows.map(mapCategoryRow));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post('/api/admin/categories', (req, res) => {
  try {
    const { name, icon, image } = req.body || {};
    const trimmed = String(name || '').trim();
    if (!trimmed) return res.status(400).json({ error: 'Category name required' });

    let id = slugifyCategoryName(trimmed);
    const base = id;
    let n = 1;
    while (getParams('SELECT id FROM menu_categories WHERE id = ?', [id])) {
      id = `${base}-${n++}`;
    }

    const maxSort = get('SELECT MAX(sort_order) as m FROM menu_categories');
    const sortOrder = (Number(maxSort?.m) || 0) + 1;
    run('INSERT INTO menu_categories (id, name, icon, image, sort_order, active) VALUES (?, ?, ?, ?, ?, 1)', [
      id,
      trimmed,
      icon || '🍽️',
      image || '',
      sortOrder,
    ]);
    res.json({ ok: true, ...mapCategoryRow(getParams('SELECT * FROM menu_categories WHERE id = ?', [id])) });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.patch('/api/admin/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, image, active } = req.body || {};
    const cat = getParams('SELECT * FROM menu_categories WHERE id = ?', [id]);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    run('UPDATE menu_categories SET name = ?, icon = ?, image = ?, active = ? WHERE id = ?', [
      name != null ? String(name).trim() : cat.name,
      icon != null ? icon : cat.icon,
      image != null ? image : cat.image,
      active != null ? (active ? 1 : 0) : cat.active,
      id,
    ]);
    res.json(mapCategoryRow(getParams('SELECT * FROM menu_categories WHERE id = ?', [id])));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.delete('/api/admin/categories/:id', (req, res) => {
  try {
    if (!trash) return res.status(503).json({ error: 'Server starting' });
    const result = trash.softDeleteCategory(req.params.id);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    res.json({ ok: true, id: result.id, trashed: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post('/api/admin/categories/upload', (req, res, next) => {
  uploadCategory.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 5MB)' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = '/uploads/menu/categories/' + req.file.filename;
    res.json({ url });
  });
});

app.post('/api/admin/menu/upload', (req, res, next) => {
  uploadMenu.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 5MB)' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = '/uploads/menu/' + req.file.filename;
    res.json({ url });
  });
});

app.post('/api/admin/addons/upload', (req, res, next) => {
  uploadAddon.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 5MB)' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = '/uploads/menu/addons/' + req.file.filename;
    res.json({ url });
  });
});

// ============ Admin auth (simple session for localhost) ============
const ADMIN_PASSWORD = 'admin123';

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email === 'admin@alquds.local' && password === ADMIN_PASSWORD) {
    return res.json({ ok: true, token: 'admin-local' });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

function loadOrderItemsForAdmin(orderId, menuMap) {
  let rawItems = [];
  if (allParams) {
    try {
      rawItems = allParams(
        'SELECT id, food_id, name, price, quantity, variety, addons, image FROM order_items WHERE order_id = ? ORDER BY id',
        [orderId]
      );
    } catch (_) {
      rawItems = allParams(
        'SELECT id, food_id, name, price, quantity FROM order_items WHERE order_id = ? ORDER BY id',
        [orderId]
      );
    }
  } else {
    rawItems = all(
      "SELECT id, food_id, name, price, quantity, variety, addons, image FROM order_items WHERE order_id = '" +
        String(orderId).replace(/'/g, "''") +
        "' ORDER BY id"
    );
  }
  return rawItems.map((it) => {
    const image = resolveItemImage(it.food_id, it.image, menuMap);
    if (image && image.startsWith('data:') && it.image !== image && it.id != null) {
      try {
        run('UPDATE order_items SET image = ? WHERE id = ?', [image, it.id]);
      } catch (_) {}
    }
    return {
      foodId: it.food_id,
      name: it.name,
      price: Number(it.price),
      quantity: Number(it.quantity),
      variety: it.variety || '',
      addons: it.addons || '',
      image,
    };
  });
}

function formatOrderItemsText(items) {
  return items
    .map((i) => {
      let s = i.name;
      if (i.variety) s += ' (' + i.variety + ')';
      if (i.addons) s += ' + ' + i.addons;
      return s + ' x' + i.quantity + ' @ ' + i.price;
    })
    .join(', ');
}

const RAWALPINDI_DEFAULT_LAT = 33.5973;
const RAWALPINDI_DEFAULT_LNG = 73.0479;

function insertOrderItems(orderId, items) {
  for (const it of items) {
    const addonsStr =
      typeof it.addons === 'string'
        ? it.addons
        : Array.isArray(it.addons)
          ? it.addons.map((a) => (typeof a === 'string' ? a : a.name)).filter(Boolean).join(', ')
          : null;
    const itemImage = snapshotOrderItemImage(it.foodId, it.image);
    run(
      'INSERT INTO order_items (order_id, food_id, name, price, quantity, variety, addons, image, special_instructions, spice_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        orderId,
        it.foodId || it.food_id || 'manual_item',
        it.name,
        it.price,
        it.quantity,
        it.variety || null,
        addonsStr || null,
        itemImage || null,
        it.specialInstructions || null,
        it.spiceLevel || null,
      ]
    );
  }
}

app.get('/api/admin/orders', (req, res) => {
  try {
    const menuMap = buildMenuImageMap();
    const orders = all(
      `SELECT o.*, r.name AS rider_name, r.phone AS rider_phone, r.email AS rider_email
       FROM orders o
       LEFT JOIN users r ON r.id = o.rider_id
       ORDER BY o.created_at DESC`
    );
    for (const o of orders) {
      o.items = loadOrderItemsForAdmin(o.id, menuMap);
      o.items_text = o.items.length ? formatOrderItemsText(o.items) : o.items_text || '';
    }
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post('/api/admin/orders', (req, res) => {
  try {
    const body = req.body || {};
    const source = ['phone', 'foodpanda'].includes(body.source) ? body.source : 'phone';
    const items = Array.isArray(body.items) ? body.items : [];
    const customerName = String(body.customerName || body.customer_name || '').trim();
    const customerPhone = String(body.customerPhone || body.customer_phone || '').trim();
    const addressLine = String(body.addressLine || body.address_line || '').trim();
    const total = Number(body.total);
    const subtotal = Number(body.subtotal) || total;
    const deliveryFee = Number(body.deliveryFee || body.delivery_fee) || 0;
    const paymentMethod = String(body.paymentMethod || body.payment_method || (source === 'foodpanda' ? 'Food Panda' : 'COD'));
    const specialInstructions = String(body.specialInstructions || body.special_instructions || '').trim();
    const externalOrderId = String(body.externalOrderId || body.external_order_id || '').trim();
    const status = ['placed', 'confirmed', 'preparing'].includes(body.status) ? body.status : 'placed';

    if (!customerName) return res.status(400).json({ error: 'Customer name required' });
    if (!customerPhone) return res.status(400).json({ error: 'Customer phone required' });
    if (!addressLine) return res.status(400).json({ error: 'Delivery address required' });
    if (!items.length) return res.status(400).json({ error: 'Add at least one menu item' });
    if (!total || total <= 0) return res.status(400).json({ error: 'Valid total required' });
    if (source === 'foodpanda' && !externalOrderId) {
      return res.status(400).json({ error: 'Food Panda order ID required' });
    }

    for (const it of items) {
      if (!it.name || !it.quantity || it.price == null) {
        return res.status(400).json({ error: 'Each item needs name, price, and quantity' });
      }
    }
    if (inventoryService) {
      const stockCheck = inventoryService.validateOrderItems(
        items.map((it) => ({
          foodId: it.foodId || it.food_id,
          name: it.name,
          quantity: it.quantity,
          addons: it.addons,
        }))
      );
      if (!stockCheck.ok) {
        const first = stockCheck.errors[0];
        return res.status(409).json({
          error: first?.reason || 'Some items are out of stock',
          stockErrors: stockCheck.errors,
        });
      }
    }

    const id = `order_${Date.now()}`;
    const addressLabel = source === 'foodpanda' ? 'Food Panda' : 'Phone order';
    const latitude = body.latitude != null ? Number(body.latitude) : RAWALPINDI_DEFAULT_LAT;
    const longitude = body.longitude != null ? Number(body.longitude) : RAWALPINDI_DEFAULT_LNG;
    let notes = specialInstructions || '';
    if (source === 'foodpanda' && externalOrderId) {
      notes = (notes ? notes + ' | ' : '') + `Food Panda #${externalOrderId}`;
    } else if (source === 'phone' && notes === '') {
      notes = 'Phone order';
    }

    run(
      `INSERT INTO orders (id, user_id, total, subtotal, address_label, address_line, latitude, longitude, customer_name, customer_phone, status, payment_method, delivery_fee, special_instructions, order_source, external_order_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        'admin_manual',
        total,
        subtotal,
        addressLabel,
        addressLine,
        latitude,
        longitude,
        customerName,
        customerPhone,
        status,
        paymentMethod,
        deliveryFee,
        notes || null,
        source,
        externalOrderId || null,
      ]
    );
    insertOrderItems(id, items);

    try {
      // Riders are assigned manually from the admin dashboard.
    } catch (_) {}

    res.json({ id, status, orderSource: source, externalOrderId: externalOrderId || null });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.patch('/api/admin/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const existing = getParams('SELECT * FROM orders WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const allowed = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    const updates = [];
    const params = [];

    if (body.status !== undefined) {
      if (!allowed.includes(body.status)) return res.status(400).json({ error: 'Invalid status' });
      updates.push('status = ?');
      params.push(body.status);
    }
    if (body.customer_name !== undefined) {
      updates.push('customer_name = ?');
      params.push(body.customer_name || null);
    }
    if (body.customer_phone !== undefined) {
      updates.push('customer_phone = ?');
      params.push(body.customer_phone || null);
    }
    if (body.address_line !== undefined) {
      updates.push('address_line = ?');
      params.push(body.address_line || '');
    }
    if (body.total !== undefined) {
      updates.push('total = ?');
      params.push(Number(body.total) || 0);
    }
    if (body.special_instructions !== undefined) {
      updates.push('special_instructions = ?');
      params.push(body.special_instructions || null);
    }

    let assignedRiderId = null;
    let unassignedRider = false;
    if (body.riderId !== undefined) {
      const rawRiderId = body.riderId;
      if (rawRiderId === null || rawRiderId === '') {
        updates.push('rider_id = ?');
        params.push(null);
        if (existing.rider_id) unassignedRider = true;
      } else {
        const riderId = String(rawRiderId);
        const rider = getParams("SELECT id, name, phone, role FROM users WHERE id = ?", [riderId]);
        if (!rider || rider.role !== 'rider') {
          return res.status(400).json({ error: 'Invalid rider selected' });
        }
        updates.push('rider_id = ?');
        params.push(riderId);
        assignedRiderId = riderId;
        if (existing.status === 'placed') {
          updates.push('status = ?');
          params.push('confirmed');
        }
      }
    }

    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    params.push(id);
    run('UPDATE orders SET ' + updates.join(', ') + ' WHERE id = ?', params);

    const newStatus = body.status !== undefined ? body.status : existing.status;
    const statusAfterAssign =
      assignedRiderId && existing.status === 'placed' && body.status === undefined ? 'confirmed' : newStatus;
    if (body.status !== undefined && body.status !== existing.status && inventoryService) {
      try {
        inventoryService.onOrderStatusChange(id, existing.status, body.status);
      } catch (invErr) {
        console.error('Inventory update failed:', invErr.message || invErr);
      }
    }
    if (body.status !== undefined && body.status !== existing.status && existing.user_id) {
      const labels = {
        confirmed: 'Order confirmed',
        preparing: 'Your food is being prepared',
        out_for_delivery: 'Rider is on the way!',
        delivered: 'Order delivered — enjoy!',
        cancelled: 'Order cancelled',
      };
      if (labels[body.status]) {
        const shortId = id.replace('order_', '#');
        const title = labels[body.status];
        const notifyBody = `Order ${shortId} is now ${body.status.replace(/_/g, ' ')}.`;
        if (pushService) {
          pushService.notifyUser(existing.user_id, title, notifyBody, {
            orderId: id,
            type: 'order_update',
          });
        } else {
          try {
            run('INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)', [
              existing.user_id,
              title,
              notifyBody,
            ]);
          } catch (_) {}
        }
      }
    }

    if (assignedRiderId && assignedRiderId !== existing.rider_id) {
      const rider = getParams('SELECT name FROM users WHERE id = ?', [assignedRiderId]);
      const shortId = id.replace('order_', '#');
      const assignTitle = 'New delivery assigned';
      const assignBody = `Order ${shortId} · ${existing.customer_name || 'Customer'} · Rs. ${existing.total}`;
      if (pushService) {
        pushService.notifyUser(assignedRiderId, assignTitle, assignBody, {
          orderId: id,
          type: 'rider_assignment',
        });
      } else {
        try {
          run('INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)', [
            assignedRiderId,
            assignTitle,
            assignBody,
          ]);
        } catch (_) {}
      }
      if (existing.user_id && existing.user_id !== 'guest') {
        const customerTitle = 'Rider assigned';
        const customerBody = `Your order ${shortId} has been assigned to ${rider?.name || 'a rider'}.`;
        if (pushService) {
          pushService.notifyUser(existing.user_id, customerTitle, customerBody, {
            orderId: id,
            type: 'order_update',
          });
        } else {
          try {
            run('INSERT INTO notifications (user_id, title, body) VALUES (?, ?, ?)', [
              existing.user_id,
              customerTitle,
              customerBody,
            ]);
          } catch (_) {}
        }
      }
    }

    const updated = getParams('SELECT status, rider_id FROM orders WHERE id = ?', [id]);
    res.json({ id, status: updated.status, riderId: updated.rider_id || null });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.delete('/api/admin/orders/:id', (req, res) => {
  try {
    if (!trash) return res.status(503).json({ error: 'Server starting' });
    const result = trash.softDeleteOrder(req.params.id);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    res.json({ ok: true, id: result.id, trashed: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.get('/api/admin/users', (req, res) => {
  try {
    const rows = all(
      "SELECT id, email, name, phone, role, created_at FROM users WHERE role IS NULL OR role = '' OR role = 'customer' ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.get('/api/admin/riders', (req, res) => {
  try {
    const rows = allParams(
      "SELECT id, email, name, phone, phone_verified, created_at FROM users WHERE role = 'rider' ORDER BY created_at DESC",
      []
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post('/api/admin/riders', (req, res) => {
  try {
    const { createOtpService } = require('./otp');
    const otp = createOtpService({ run, getParams });
    const { name, phone, otp: code } = req.body || {};
    if (!name || !phone || !code) {
      return res.status(400).json({ error: 'Name, phone, and OTP are required' });
    }
    const normalized = otp.verifyOtp(phone, code, 'rider_create');
    if (!normalized) {
      return res.status(401).json({ error: 'Invalid or expired OTP. Send a new code.' });
    }
    const existing = getParams("SELECT id FROM users WHERE phone = ? AND role = 'rider'", [normalized]);
    if (existing) {
      return res.status(409).json({ error: 'A rider with this phone number already exists' });
    }
    const id = `rider_${Date.now()}`;
    const email = `${normalized}@rider.alquds.local`;
    run(
      `INSERT INTO users (id, email, name, phone, password_hash, role, phone_verified) VALUES (?, ?, ?, ?, ?, 'rider', 1)`,
      [id, email, String(name).trim(), normalized, '']
    );
    res.json({
      ok: true,
      id,
      name: String(name).trim(),
      phone: normalized,
      email,
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.delete('/api/admin/riders/:id', (req, res) => {
  try {
    if (!trash) return res.status(503).json({ error: 'Server starting' });
    const result = trash.softDeleteRider(req.params.id);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    res.json({ ok: true, id: result.id, trashed: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.get('/api/admin/stats', (req, res) => {
  try {
    const orders = get('SELECT COUNT(*) as c FROM orders');
    const users = get('SELECT COUNT(*) as c FROM users');
    const menu = get('SELECT COUNT(*) as c FROM menu_items');
    res.json({
      orders: safeNum(orders?.c),
      users: safeNum(users?.c),
      menuItems: safeNum(menu?.c),
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

// ============ Admin menu (CRUD + in stock) ============
const MENU_PAGE_SIZE = 10;

function mapMenuRow(r) {
  return {
    id: r.id,
    name: r.name || '',
    description: r.description || '',
    price: Number(r.price) || 0,
    category: r.category || 'burgers',
    image: r.image || '🍔',
    rating: r.rating != null ? Number(r.rating) : 4.5,
    prepTime: r.prep_time != null ? Number(r.prep_time) : 15,
    inStock: r.in_stock === 1 || r.in_stock === '1' || r.in_stock == null,
    varieties: parseJson(r.varieties) || [],
    addonIds: parseJson(r.addon_ids) || [],
  };
}

app.get('/api/admin/menu', (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || MENU_PAGE_SIZE));
    const offset = (page - 1) * limit;

    let rows;
    let total;
    const from = 'FROM menu_items';
    const order = 'ORDER BY category, id';
    const colsWithStock = 'id, name, description, price, category, image, rating, prep_time, in_stock, varieties, addon_ids';
    const colsNoStock = 'id, name, description, price, category, image, rating, prep_time, varieties, addon_ids';

    try {
      if (q) {
        const like = '%' + q.replace(/%/g, '') + '%';
        rows = allParams(
          `SELECT ${colsWithStock} ${from} WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ? ${order} LIMIT ${limit} OFFSET ${offset}`,
          [like, like, like]
        );
        const totalRow = getParams(`SELECT COUNT(*) as c ${from} WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ?`, [like, like, like]);
        total = totalRow ? safeNum(totalRow.c) : 0;
      } else {
        rows = all(`SELECT ${colsWithStock} ${from} ${order} LIMIT ${limit} OFFSET ${offset}`);
        const totalRow = get('SELECT COUNT(*) as c FROM menu_items');
        total = safeNum(totalRow?.c);
      }
    } catch (e) {
      if (q) {
        const like = '%' + q.replace(/%/g, '') + '%';
        rows = allParams(
          `SELECT ${colsNoStock} ${from} WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ? ${order} LIMIT ${limit} OFFSET ${offset}`,
          [like, like, like]
        );
        const totalRow = getParams(`SELECT COUNT(*) as c ${from} WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ?`, [like, like, like]);
        total = totalRow ? safeNum(totalRow.c) : 0;
      } else {
        rows = all(`SELECT ${colsNoStock} ${from} ${order} LIMIT ${limit} OFFSET ${offset}`);
        const totalRow = get('SELECT COUNT(*) as c FROM menu_items');
        total = safeNum(totalRow?.c);
      }
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({
      items: rows.map(mapMenuRow),
      total,
      page,
      totalPages,
      limit,
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post('/api/admin/menu', (req, res) => {
  try {
    const { name, description, price, category, image, rating, prepTime, varieties, addonIds } = req.body || {};
    if (!name || price == null) return res.status(400).json({ error: 'name and price required' });
    const id = 'm' + Date.now();
    const varietiesJson = Array.isArray(varieties) ? JSON.stringify(varieties) : null;
    const addonIdsJson = Array.isArray(addonIds) ? JSON.stringify(addonIds) : null;
    run(
      'INSERT INTO menu_items (id, name, description, price, category, image, rating, prep_time, in_stock, varieties, addon_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
      [
        id,
        String(name),
        description || '',
        Number(price),
        category || 'burgers',
        image || '🍔',
        rating != null ? Number(rating) : 4.5,
        prepTime != null ? Number(prepTime) : 15,
        varietiesJson,
        addonIdsJson,
      ]
    );
    res.json({ id, ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.patch('/api/admin/menu/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { inStock, name, description, price, category, image, varieties, addonIds } = req.body || {};
    const item = getParams('SELECT id FROM menu_items WHERE id = ?', [id]);
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    if (inStock !== undefined) {
      run('UPDATE menu_items SET in_stock = ? WHERE id = ?', [inStock ? 1 : 0, id]);
    }
    if (name !== undefined) run('UPDATE menu_items SET name = ? WHERE id = ?', [name, id]);
    if (description !== undefined) run('UPDATE menu_items SET description = ? WHERE id = ?', [description, id]);
    if (price !== undefined) run('UPDATE menu_items SET price = ? WHERE id = ?', [Number(price), id]);
    if (category !== undefined) run('UPDATE menu_items SET category = ? WHERE id = ?', [category, id]);
    if (image !== undefined) run('UPDATE menu_items SET image = ? WHERE id = ?', [image, id]);
    if (varieties !== undefined) run('UPDATE menu_items SET varieties = ? WHERE id = ?', [Array.isArray(varieties) ? JSON.stringify(varieties) : null, id]);
    if (addonIds !== undefined) run('UPDATE menu_items SET addon_ids = ? WHERE id = ?', [Array.isArray(addonIds) ? JSON.stringify(addonIds) : null, id]);
    res.json({ id, ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.delete('/api/admin/menu/:id', (req, res) => {
  try {
    if (!trash) return res.status(503).json({ error: 'Server starting' });
    const result = trash.softDeleteMenuItem(req.params.id);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    res.json({ ok: true, id: result.id, trashed: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

// ============ Add-ons (public + admin) ============
app.get('/api/admin/addons', (req, res) => {
  try {
    const rows = all('SELECT id, name, price, image, in_stock FROM addons ORDER BY name');
    res.json(rows.map(mapAddonRow));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post('/api/admin/addons', (req, res) => {
  try {
    const { name, price, image } = req.body || {};
    if (!name || price == null) return res.status(400).json({ error: 'name and price required' });
    const id = 'addon_' + Date.now();
    const defaultImage = /fries/i.test(name)
      ? '/uploads/menu/addons/addon_fries.jpg'
      : '/uploads/menu/addons/addon_drink.jpg';
    run('INSERT INTO addons (id, name, price, image, in_stock) VALUES (?, ?, ?, ?, 1)', [
      id,
      String(name),
      Number(price),
      image || defaultImage,
    ]);
    res.json({ id, ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.patch('/api/admin/addons/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, image, inStock } = req.body || {};
    const existing = getParams('SELECT id FROM addons WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Add-on not found' });
    if (inStock !== undefined) run('UPDATE addons SET in_stock = ? WHERE id = ?', [inStock ? 1 : 0, id]);
    if (name !== undefined) run('UPDATE addons SET name = ? WHERE id = ?', [name, id]);
    if (price !== undefined) run('UPDATE addons SET price = ? WHERE id = ?', [Number(price), id]);
    if (image !== undefined) run('UPDATE addons SET image = ? WHERE id = ?', [image, id]);
    res.json({ id, ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.delete('/api/admin/addons/:id', (req, res) => {
  try {
    if (!trash) return res.status(503).json({ error: 'Server starting' });
    const result = trash.softDeleteAddon(req.params.id);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    res.json({ ok: true, id: result.id, trashed: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

// ============ Admin banners CRUD ============
app.get('/api/admin/banners', (req, res) => {
  try {
    const rows = all('SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC');
    res.json(Array.isArray(rows) ? rows : []);
  } catch (e) {
    res.json([]);
  }
});

app.post('/api/admin/banners', (req, res) => {
  try {
    const { title, subtitle, image, link, sortOrder, display } = req.body || {};
    if (!image) return res.status(400).json({ error: 'image required' });
    const show = display === false || display === 0 ? 0 : 1;
    const titleVal = title != null && String(title).trim() ? String(title).trim() : 'Banner';
    run(
      'INSERT INTO banners (title, subtitle, image, link, sort_order, display) VALUES (?, ?, ?, ?, ?, ?)',
      [titleVal, subtitle || '', image || '', link || '', sortOrder != null ? Number(sortOrder) : 0, show]
    );
    const row = get('SELECT id FROM banners ORDER BY id DESC LIMIT 1');
    res.json({ id: row?.id, ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.patch('/api/admin/banners/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, image, link, sortOrder, display } = req.body || {};
    const existing = getParams('SELECT id FROM banners WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Banner not found' });
    if (title !== undefined) run('UPDATE banners SET title = ? WHERE id = ?', [title, id]);
    if (subtitle !== undefined) run('UPDATE banners SET subtitle = ? WHERE id = ?', [subtitle, id]);
    if (image !== undefined) run('UPDATE banners SET image = ? WHERE id = ?', [image, id]);
    if (link !== undefined) run('UPDATE banners SET link = ? WHERE id = ?', [link, id]);
    if (sortOrder !== undefined) run('UPDATE banners SET sort_order = ? WHERE id = ?', [Number(sortOrder), id]);
    if (display !== undefined) run('UPDATE banners SET display = ? WHERE id = ?', [display ? 1 : 0, id]);
    res.json({ id, ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.delete('/api/admin/banners/:id', (req, res) => {
  try {
    if (!trash) return res.status(503).json({ error: 'Server starting' });
    const result = trash.softDeleteBanner(req.params.id);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    res.json({ ok: true, id: result.id, trashed: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

// ============ Deals (public + admin) ============
function dealImageUrl(image) {
  if (!image) return '🎁';
  return image;
}

function isDealCurrentlyActive(row) {
  if (row.active === 0 || row.active === '0') return false;
  const now = Date.now();
  if (row.valid_from) {
    const from = Date.parse(String(row.valid_from).replace(' ', 'T'));
    if (!Number.isNaN(from) && from > now) return false;
  }
  if (row.valid_until) {
    const until = Date.parse(String(row.valid_until).replace(' ', 'T'));
    if (!Number.isNaN(until) && until < now) return false;
  }
  return true;
}

function resolveDealMenuItems(menuItemIds) {
  const ids = Array.isArray(menuItemIds) ? menuItemIds : [];
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(',');
  const rows = allParams(
    `SELECT id, name, description, price, category, image, rating, prep_time, varieties, addon_ids
     FROM menu_items WHERE id IN (${placeholders}) AND (in_stock = 1 OR in_stock IS NULL)`,
    ids
  );
  const byId = {};
  rows.forEach((r) => {
    byId[r.id] = mapMenuRow(r);
  });
  return ids.map((id) => byId[id]).filter(Boolean);
}

function mapDealRow(row, req, includeItems = false) {
  const menuItemIds = parseJson(row.menu_item_ids) || [];
  const deal = {
    id: row.id,
    title: row.title || '',
    subtitle: row.subtitle || '',
    description: row.description || '',
    image: dealImageUrl(row.image),
    dealPrice: Number(row.deal_price) || 0,
    originalPrice: Number(row.original_price) || 0,
    menuItemIds,
    badge: row.badge || '',
    sortOrder: row.sort_order != null ? Number(row.sort_order) : 0,
    active: row.active !== 0 && row.active !== '0',
    validFrom: row.valid_from || null,
    validUntil: row.valid_until || null,
  };
  if (includeItems) {
    deal.items = resolveDealMenuItems(menuItemIds);
    if (!deal.originalPrice && deal.items.length) {
      deal.originalPrice = deal.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    }
  }
  try {
    if (inventoryService) {
      const stock = inventoryService.getTargetAvailability('deal', row.id, 1, []);
      deal.stockAvailable = stock.available;
      deal.stockMaxQty = stock.maxQty;
      deal.stockReason = stock.reason;
    } else {
      deal.stockAvailable = true;
    }
  } catch (_) {
    deal.stockAvailable = true;
  }
  return deal;
}

app.get('/api/deals', (req, res) => {
  try {
    const rows = all('SELECT * FROM deals ORDER BY sort_order ASC, created_at DESC');
    const deals = rows
      .filter(isDealCurrentlyActive)
      .map((row) => mapDealRow(row, req, true));
    res.json(deals);
  } catch (e) {
    res.json([]);
  }
});

app.get('/api/deals/:id', (req, res) => {
  try {
    const row = getParams('SELECT * FROM deals WHERE id = ?', [req.params.id]);
    if (!row || !isDealCurrentlyActive(row)) return res.status(404).json({ error: 'Deal not found' });
    res.json(mapDealRow(row, req, true));
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post('/api/admin/deals/upload', (req, res, next) => {
  uploadDeal.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 5MB)' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: '/uploads/deals/' + req.file.filename });
  });
});

app.get('/api/admin/deals', (req, res) => {
  try {
    const rows = all('SELECT * FROM deals ORDER BY sort_order ASC, created_at DESC');
    res.json(rows.map((row) => mapDealRow(row, req, true)));
  } catch (e) {
    res.json([]);
  }
});

app.post('/api/admin/deals', (req, res) => {
  try {
    const {
      id,
      title,
      subtitle,
      description,
      image,
      dealPrice,
      originalPrice,
      menuItemIds,
      badge,
      sortOrder,
      active,
      validFrom,
      validUntil,
    } = req.body || {};
    const trimmedTitle = String(title || '').trim();
    if (!trimmedTitle) return res.status(400).json({ error: 'Title required' });
    const price = Number(dealPrice);
    if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: 'Valid deal price required' });

    let dealId = String(id || '').trim();
    if (!dealId) {
      dealId = 'deal_' + slugifyCategoryName(trimmedTitle);
      let n = 1;
      const base = dealId;
      while (getParams('SELECT id FROM deals WHERE id = ?', [dealId])) {
        dealId = `${base}-${n++}`;
      }
    } else if (getParams('SELECT id FROM deals WHERE id = ?', [dealId])) {
      return res.status(400).json({ error: 'Deal id already exists' });
    }

    const itemIds = Array.isArray(menuItemIds) ? menuItemIds : [];
    const maxSort = get('SELECT MAX(sort_order) as m FROM deals');
    const order = sortOrder != null ? Number(sortOrder) : (Number(maxSort?.m) || 0) + 1;

    run(
      `INSERT INTO deals (id, title, subtitle, description, image, deal_price, original_price, menu_item_ids, badge, sort_order, active, valid_from, valid_until)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dealId,
        trimmedTitle,
        subtitle || '',
        description || '',
        image || '🎁',
        price,
        Number(originalPrice) || 0,
        JSON.stringify(itemIds),
        badge || '',
        order,
        active === false || active === 0 ? 0 : 1,
        validFrom || null,
        validUntil || null,
      ]
    );
    res.json({ id: dealId, ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.patch('/api/admin/deals/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = getParams('SELECT id FROM deals WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Deal not found' });

    const {
      title,
      subtitle,
      description,
      image,
      dealPrice,
      originalPrice,
      menuItemIds,
      badge,
      sortOrder,
      active,
      validFrom,
      validUntil,
    } = req.body || {};

    if (title !== undefined) run('UPDATE deals SET title = ? WHERE id = ?', [String(title).trim(), id]);
    if (subtitle !== undefined) run('UPDATE deals SET subtitle = ? WHERE id = ?', [subtitle, id]);
    if (description !== undefined) run('UPDATE deals SET description = ? WHERE id = ?', [description, id]);
    if (image !== undefined) run('UPDATE deals SET image = ? WHERE id = ?', [image, id]);
    if (dealPrice !== undefined) run('UPDATE deals SET deal_price = ? WHERE id = ?', [Number(dealPrice) || 0, id]);
    if (originalPrice !== undefined) run('UPDATE deals SET original_price = ? WHERE id = ?', [Number(originalPrice) || 0, id]);
    if (menuItemIds !== undefined) run('UPDATE deals SET menu_item_ids = ? WHERE id = ?', [JSON.stringify(Array.isArray(menuItemIds) ? menuItemIds : []), id]);
    if (badge !== undefined) run('UPDATE deals SET badge = ? WHERE id = ?', [badge, id]);
    if (sortOrder !== undefined) run('UPDATE deals SET sort_order = ? WHERE id = ?', [Number(sortOrder), id]);
    if (active !== undefined) run('UPDATE deals SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
    if (validFrom !== undefined) run('UPDATE deals SET valid_from = ? WHERE id = ?', [validFrom || null, id]);
    if (validUntil !== undefined) run('UPDATE deals SET valid_until = ? WHERE id = ?', [validUntil || null, id]);
    res.json({ id, ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.delete('/api/admin/deals/:id', (req, res) => {
  try {
    if (!trash) return res.status(503).json({ error: 'Server starting' });
    const result = trash.softDeleteDeal(req.params.id);
    if (!result.ok) return res.status(result.status || 500).json({ error: result.error });
    res.json({ ok: true, id: result.id, trashed: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

// ============ Admin trash ============
app.get('/api/admin/trash', (req, res) => {
  try {
    if (!trash) return res.json([]);
    res.json(trash.listTrash());
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.get('/api/admin/trash/:id', (req, res) => {
  try {
    if (!trash) return res.status(503).json({ error: 'Server starting' });
    const item = trash.getTrashItem(req.params.id);
    if (!item) return res.status(404).json({ error: 'Trash item not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post('/api/admin/trash/:id/restore', (req, res) => {
  try {
    if (!trash) return res.status(503).json({ error: 'Server starting' });
    const result = trash.restore(req.params.id);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

// ============ Serve admin page ============
app.get('/admin', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ============ Start ============
async function start() {
  const server = http.createServer(app);
  server.on('error', (err) => {
    console.error('HTTP server error:', err);
    process.exit(1);
  });

  await new Promise((resolve, reject) => {
    server.listen({ port: PORT, host: '::', ipv6Only: false }, () => {
      const addr = server.address();
      console.log('');
      console.log('  Al-Quds backend listening on', JSON.stringify(addr));
      console.log('  PORT env:', process.env.PORT || '(unset, default ' + PORT + ')');
      console.log('  Initializing database…');
      console.log('');
      resolve();
    });
    server.once('error', reject);
  });

  try {
    const api = await init();
    run = api.run;
    all = api.all;
    get = api.get;
    getParams = api.getParams;
    allParams = api.allParams;
    save = api.save;
  } catch (err) {
    console.error('Database init failed:', err);
    process.exit(1);
  }

  const { registerV2Routes } = require('./api-v2');
  registerV2Routes(app, { run, all, get, allParams, getParams }, uploadPayment);

  const { createPushService } = require('./push-service');
  pushService = createPushService({ run, all, getParams, allParams });

  const { createNotificationCampaigns } = require('./notification-campaigns');
  const notificationCampaigns = createNotificationCampaigns({ run, all, getParams, pushService });
  notificationCampaigns.registerRoutes(app);
  notificationCampaigns.startScheduler();

  const { createInventoryService } = require('./inventory');
  inventoryService = createInventoryService({ run, all, get, getParams, allParams });
  inventoryService.registerRoutes(app);
  try {
    inventoryService.updateLowStockAlertCache();
  } catch (_) {}

  const { createRiderApi } = require('./rider-api');
  const riderApi = createRiderApi({ run, all, get, allParams, getParams }, pushService, inventoryService);
  riderApi.registerRoutes(app);
  notifyRidersNewOrder = riderApi.notifyRidersNewOrder;

  backfillOrderItemImages();

  const { createTrashService } = require('./trash');
  trash = createTrashService({ run, all, get, getParams, allParams });
  trash.startAutoPurge();

  serverReady = true;
  console.log('  API:     http://0.0.0.0:' + PORT + '/api/menu');
  console.log('  Admin:   http://0.0.0.0:' + PORT + '/admin');
  console.log('  DB file: ' + dbPath);
  console.log('');
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
