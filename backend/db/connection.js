const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'alquds.db');

let db = null;
let SQL = null;

function save() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dbPath, buffer);
}

function run(sql, params = []) {
  if (params.length) {
    db.run(sql, params);
  } else {
    db.run(sql);
  }
  save();
}

function all(sql) {
  const result = db.exec(sql);
  if (!result || !result.length || !result[0]) return [];
  const first = result[0];
  const cols = first.columns;
  const values = first.values;
  if (!cols || !values || !values.length) return [];
  return values.map((row) => {
    const o = {};
    cols.forEach((c, i) => (o[c] = row[i]));
    return o;
  });
}

function get(sql) {
  const rows = all(sql);
  return rows[0] ?? null;
}

function allParams(sql, params = []) {
  if (!params.length) return all(sql);
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function getParams(sql, params = []) {
  const rows = allParams(sql, params);
  return rows[0] ?? null;
}

function execMulti(sql) {
  db.exec(sql);
  save();
}

async function init() {
  if (db) return { db, run, all, get, allParams, getParams, save, execMulti };
  SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file),
  });
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  const hasMenu = get("SELECT name FROM sqlite_master WHERE type='table' AND name='menu_items'");
  if (!hasMenu) {
    runSchema();
    runSeed();
  }
  try {
    const ordersExists = get("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'");
    if (ordersExists) {
      const cols = all('PRAGMA table_info(orders)').map((r) => r.name);
      if (!cols.includes('customer_name')) run('ALTER TABLE orders ADD COLUMN customer_name TEXT');
      if (!cols.includes('customer_phone')) run('ALTER TABLE orders ADD COLUMN customer_phone TEXT');
    }
    const menuExists = get("SELECT name FROM sqlite_master WHERE type='table' AND name='menu_items'");
    if (menuExists) {
      const menuCols = all('PRAGMA table_info(menu_items)').map((r) => r.name);
      if (!menuCols.includes('in_stock')) run('ALTER TABLE menu_items ADD COLUMN in_stock INTEGER DEFAULT 1');
      if (!menuCols.includes('varieties')) run('ALTER TABLE menu_items ADD COLUMN varieties TEXT');
      if (!menuCols.includes('addon_ids')) run('ALTER TABLE menu_items ADD COLUMN addon_ids TEXT');
    }
    const addonsExists = get("SELECT name FROM sqlite_master WHERE type='table' AND name='addons'");
    if (!addonsExists) {
      execMulti(`
        CREATE TABLE addons (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price INTEGER NOT NULL DEFAULT 0
        );
      `);
    }
    // Ensure add-ons exist (fries, drinks – Pepsi, Coca Cola, Fanta, etc.)
    const defaultAddons = [
      ['addon_fries', 'Fries', 80],
      ['addon_drink', 'Cold Drink', 60],
      ['addon_pepsi', 'Pepsi', 80],
      ['addon_coca_cola', 'Coca Cola', 80],
      ['addon_fanta', 'Fanta', 80],
      ['addon_sprite', 'Sprite', 80],
      ['addon_7up', '7Up', 80],
      ['addon_mirinda', 'Mirinda', 80],
    ];
    for (const [id, name, price] of defaultAddons) {
      run('INSERT OR IGNORE INTO addons (id, name, price) VALUES (?, ?, ?)', [id, name, price]);
    }

    const addonCols = all('PRAGMA table_info(addons)').map((r) => r.name);
    if (!addonCols.includes('image')) run('ALTER TABLE addons ADD COLUMN image TEXT');
    if (!addonCols.includes('in_stock')) run('ALTER TABLE addons ADD COLUMN in_stock INTEGER DEFAULT 1');
    const addonImageDefaults = {
      addon_fries: '/uploads/menu/addons/addon_fries.jpg',
      addon_drink: '/uploads/menu/addons/addon_drink.jpg',
      addon_pepsi: '/uploads/menu/addons/addon_pepsi.jpg',
      addon_coca_cola: '/uploads/menu/addons/addon_coca_cola.jpg',
      addon_fanta: '/uploads/menu/addons/addon_fanta.jpg',
      addon_sprite: '/uploads/menu/addons/addon_sprite.jpg',
      addon_7up: '/uploads/menu/addons/addon_7up.jpg',
      addon_mirinda: '/uploads/menu/addons/addon_mirinda.jpg',
    };
    for (const [id, image] of Object.entries(addonImageDefaults)) {
      run("UPDATE addons SET image = ? WHERE id = ? AND (image IS NULL OR image = '')", [image, id]);
    }

    if (menuExists) {
      const burgerRows = all("SELECT id FROM menu_items WHERE category = 'burgers' AND (varieties IS NULL OR varieties = '')");
      for (const row of burgerRows) {
        run('UPDATE menu_items SET varieties = ?, addon_ids = ? WHERE id = ?', [
          DEFAULT_BURGER_VARIETIES_JSON,
          DEFAULT_ADDON_IDS_JSON,
          row.id,
        ]);
      }
      const noAddonRows = all("SELECT id FROM menu_items WHERE addon_ids IS NULL OR addon_ids = ''");
      for (const row of noAddonRows) {
        run('UPDATE menu_items SET addon_ids = ? WHERE id = ?', [DEFAULT_ADDON_IDS_JSON, row.id]);
      }
    }
    const orderItemsExists = get("SELECT name FROM sqlite_master WHERE type='table' AND name='order_items'");
    if (orderItemsExists) {
      const oiCols = all('PRAGMA table_info(order_items)').map((r) => r.name);
      if (!oiCols.includes('variety')) run('ALTER TABLE order_items ADD COLUMN variety TEXT');
      if (!oiCols.includes('addons')) run('ALTER TABLE order_items ADD COLUMN addons TEXT');
      if (!oiCols.includes('image')) run('ALTER TABLE order_items ADD COLUMN image TEXT');
    }
    const bannersExists = get("SELECT name FROM sqlite_master WHERE type='table' AND name='banners'");
    if (!bannersExists) {
      execMulti(`
        CREATE TABLE banners (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          subtitle TEXT,
          image TEXT,
          link TEXT,
          sort_order INTEGER DEFAULT 0,
          display INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now'))
        );
      `);
    } else {
      const bannerCols = all('PRAGMA table_info(banners)').map((r) => r.name);
      if (!bannerCols.includes('display')) run('ALTER TABLE banners ADD COLUMN display INTEGER DEFAULT 1');
    }
    try {
      const { runMigrationsV2 } = require('./migrations-v2');
      runMigrationsV2({ run, all, get, execMulti });
    } catch (e) {
      console.warn('v2 migrations:', e.message);
    }
  } catch (e) {}
  return { db, run, all, get, allParams, getParams, save, execMulti };
}

function runSchema() {
  execMulti(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      password_hash TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      label TEXT NOT NULL,
      area TEXT,
      address_line TEXT NOT NULL,
      city TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      image TEXT,
      rating REAL,
      prep_time INTEGER,
      in_stock INTEGER NOT NULL DEFAULT 1,
      varieties TEXT,
      addon_ids TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS addons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      total INTEGER NOT NULL,
      address_label TEXT NOT NULL,
      address_line TEXT NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      status TEXT NOT NULL DEFAULT 'placed',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      food_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
  `);
}

const DEFAULT_BURGER_VARIETIES_JSON = JSON.stringify([
  { name: 'Regular', priceModifier: 0 },
  { name: 'Large', priceModifier: 150 },
  { name: 'XLarge', priceModifier: 250 },
]);
const DEFAULT_ADDON_IDS_JSON = JSON.stringify([
  'addon_fries', 'addon_drink', 'addon_pepsi', 'addon_coca_cola',
  'addon_fanta', 'addon_sprite', 'addon_7up', 'addon_mirinda',
]);

function runSeed() {
  const menuRows = require('./seed-menu.js');
  for (const row of menuRows) {
    const isBurger = row.category === 'burgers';
    run(
      `INSERT OR REPLACE INTO menu_items (id, name, description, price, category, image, rating, prep_time, in_stock, varieties, addon_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        row.id,
        row.name,
        row.description || '',
        row.price,
        row.category,
        row.image || '🍔',
        row.rating ?? 4.5,
        row.prepTime ?? 15,
        isBurger ? DEFAULT_BURGER_VARIETIES_JSON : null,
        isBurger ? DEFAULT_ADDON_IDS_JSON : null,
      ]
    );
  }
  const adminHash = Buffer.from('admin123').toString('base64');
  run('INSERT OR IGNORE INTO admin_users (email, password_hash) VALUES (?, ?)', [
    'admin@alquds.local',
    adminHash,
  ]);
}

module.exports = {
  init,
  getRun: run,
  getAll: all,
  getGet: get,
  getGetParams: getParams,
  getSave: save,
  getExecMulti: execMulti,
  dbPath,
};
