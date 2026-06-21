/**
 * v2 migrations — coupons, loyalty, settings, extended orders, featured items, push tokens.
 */
function runMigrationsV2({ run, all, get, execMulti }) {
  const ensureColumn = (table, col, ddl) => {
    const cols = all(`PRAGMA table_info(${table})`).map((r) => r.name);
    if (!cols.includes(col)) run(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`);
  };

  // --- coupons ---
  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='coupons'")) {
    execMulti(`
      CREATE TABLE coupons (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL DEFAULT 'flat',
        value INTEGER NOT NULL DEFAULT 0,
        min_order INTEGER DEFAULT 0,
        max_uses INTEGER DEFAULT 0,
        used_count INTEGER DEFAULT 0,
        first_order_only INTEGER DEFAULT 0,
        free_delivery INTEGER DEFAULT 0,
        valid_from TEXT,
        valid_until TEXT,
        active INTEGER DEFAULT 1,
        description TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE coupon_uses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        coupon_id TEXT NOT NULL,
        user_id TEXT,
        order_id TEXT,
        used_at TEXT DEFAULT (datetime('now'))
      );
    `);
    run(
      `INSERT INTO coupons (id, code, type, value, min_order, description, active) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      ['coupon_welcome', 'WELCOME50', 'flat', 50, 500, 'Rs. 50 off first orders above Rs. 500']
    );
    run(
      `INSERT INTO coupons (id, code, type, value, min_order, description, active) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      ['coupon_friday', 'FRIDAY10', 'percent', 10, 800, '10% off orders above Rs. 800']
    );
  }

  // --- app settings (key-value) ---
  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='app_settings'")) {
    execMulti(`
      CREATE TABLE app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
    const defaults = {
      free_delivery_min: '1500',
      default_delivery_fee: '0',
      busy_mode: '0',
      busy_extra_mins: '15',
      delivery_time_min: '25',
      delivery_time_max: '40',
      loyalty_points_per_100: '5',
      referral_bonus: '100',
      pro_monthly_fee: '299',
      pro_free_delivery: '1',
      partial_advance_percent: '50',
      support_whatsapp: '03175858934',
      support_phone: '03175858934',
      store_open: '1',
    };
    for (const [k, v] of Object.entries(defaults)) {
      run('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)', [k, v]);
    }
  }

  // --- loyalty ---
  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='loyalty_accounts'")) {
    execMulti(`
      CREATE TABLE loyalty_accounts (
        user_id TEXT PRIMARY KEY,
        points INTEGER DEFAULT 0,
        lifetime_points INTEGER DEFAULT 0,
        is_pro INTEGER DEFAULT 0,
        pro_until TEXT,
        referral_code TEXT,
        referred_by TEXT,
        wallet_balance INTEGER DEFAULT 0,
        birthday TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  // --- push tokens ---
  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='push_tokens'")) {
    execMulti(`
      CREATE TABLE push_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        token TEXT NOT NULL,
        platform TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  // --- in-app notifications ---
  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'")) {
    execMulti(`
      CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  // --- delivery zones ---
  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='delivery_zones'")) {
    execMulti(`
      CREATE TABLE delivery_zones (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        delivery_fee INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        eta_min INTEGER DEFAULT 25,
        eta_max INTEGER DEFAULT 40
      );
    `);
    const zones = [
      ['zone_saddar', 'Saddar / City', 0, 25, 35],
      ['zone_satellite', 'Satellite Town', 0, 25, 40],
      ['zone_bahria', 'Bahria Town', 150, 40, 55],
      ['zone_chaklala', 'Chaklala', 50, 30, 45],
      ['zone_other', 'Other Rawalpindi', 0, 30, 45],
    ];
    for (const [id, name, fee, emin, emax] of zones) {
      run('INSERT OR IGNORE INTO delivery_zones (id, name, delivery_fee, eta_min, eta_max) VALUES (?, ?, ?, ?, ?)', [
        id, name, fee, emin, emax,
      ]);
    }
  }

  // --- auto promotions ---
  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='promotions'")) {
    execMulti(`
      CREATE TABLE promotions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        value INTEGER DEFAULT 0,
        min_order INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        description TEXT
      );
    `);
    run(
      `INSERT OR IGNORE INTO promotions (id, title, type, value, min_order, description, active) VALUES (?, ?, ?, ?, ?, ?, 1)`,
      ['promo_free_del', 'Free delivery', 'free_delivery', 0, 1500, 'Free delivery on orders above Rs. 1,500']
    );
  }

  // --- extend orders ---
  ensureColumn('orders', 'payment_method', 'TEXT');
  ensureColumn('orders', 'coupon_code', 'TEXT');
  ensureColumn('orders', 'discount_amount', 'INTEGER DEFAULT 0');
  ensureColumn('orders', 'delivery_fee', 'INTEGER DEFAULT 0');
  ensureColumn('orders', 'subtotal', 'INTEGER');
  ensureColumn('orders', 'scheduled_at', 'TEXT');
  ensureColumn('orders', 'contactless', 'INTEGER DEFAULT 0');
  ensureColumn('orders', 'special_instructions', 'TEXT');
  ensureColumn('orders', 'payment_proof_url', 'TEXT');
  ensureColumn('orders', 'tip_amount', 'INTEGER DEFAULT 0');
  ensureColumn('orders', 'rating', 'INTEGER');
  ensureColumn('orders', 'rating_comment', 'TEXT');
  ensureColumn('orders', 'loyalty_points_earned', 'INTEGER DEFAULT 0');
  ensureColumn('orders', 'wallet_used', 'INTEGER DEFAULT 0');
  ensureColumn('orders', 'order_source', "TEXT DEFAULT 'app'");
  ensureColumn('orders', 'external_order_id', 'TEXT');

  // --- extend order_items ---
  ensureColumn('order_items', 'special_instructions', 'TEXT');
  ensureColumn('order_items', 'spice_level', 'TEXT');

  // --- extend menu_items ---
  ensureColumn('menu_items', 'featured', 'INTEGER DEFAULT 0');
  ensureColumn('menu_items', 'spice_levels', 'TEXT');

  // --- extend addons ---
  ensureColumn('addons', 'in_stock', 'INTEGER DEFAULT 1');

  // --- extend users ---
  ensureColumn('users', 'birthday', 'TEXT');
  ensureColumn('users', 'referral_code', 'TEXT');
  ensureColumn('users', 'role', "TEXT DEFAULT 'customer'");
  ensureColumn('users', 'phone_verified', 'INTEGER DEFAULT 0');

  // --- OTP codes (phone verification / login) ---
  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='otp_codes'")) {
    execMulti(`
      CREATE TABLE otp_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        code TEXT NOT NULL,
        purpose TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX idx_otp_phone_purpose ON otp_codes (phone, purpose);
    `);
  }

  // --- rider / delivery ---
  ensureColumn('orders', 'rider_id', 'TEXT');
  ensureColumn('orders', 'latitude', 'REAL');
  ensureColumn('orders', 'longitude', 'REAL');

  run("UPDATE users SET role = 'customer' WHERE role IS NULL OR role = ''");
  run(
    `INSERT OR IGNORE INTO users (id, email, name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)`,
    ['user_customer_demo', 'customer@alquds.local', 'Demo Customer', '03001234567', '123456', 'customer']
  );
  run(
    `INSERT OR IGNORE INTO users (id, email, name, phone, password_hash, role, phone_verified) VALUES (?, ?, ?, ?, ?, ?, 1)`,
    ['user_rider_demo', 'rider@alquds.local', 'Demo Rider', '03007654321', '123456', 'rider']
  );
  run("UPDATE users SET phone_verified = 1 WHERE role = 'rider' AND phone IS NOT NULL AND phone != ''");

  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='rider_locations'")) {
    execMulti(`
      CREATE TABLE rider_locations (
        rider_id TEXT PRIMARY KEY,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='feedback'")) {
    execMulti(`
      CREATE TABLE feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        user_email TEXT,
        rating INTEGER,
        comment TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  run("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('store_open', '1')");

  // --- menu categories (admin-managed) ---
  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='menu_categories'")) {
    execMulti(`
      CREATE TABLE menu_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT DEFAULT '🍽️',
        image TEXT,
        sort_order INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }
  ensureColumn('menu_categories', 'icon', "TEXT DEFAULT '🍽️'");
  ensureColumn('menu_categories', 'image', 'TEXT');
  ensureColumn('menu_categories', 'sort_order', 'INTEGER DEFAULT 0');
  ensureColumn('menu_categories', 'active', 'INTEGER DEFAULT 1');
  ensureColumn('menu_categories', 'created_at', "TEXT DEFAULT (datetime('now'))");

  const defaultCategories = [
    ['burgers', 'Burgers', '🍔', '/uploads/menu/categories/burgers.jpg', 1],
    ['arabian', 'Arabian', '🥙', '/uploads/menu/categories/arabian.jpg', 2],
    ['chinese', 'Chinese', '🍜', '/uploads/menu/categories/chinese.jpg', 3],
    ['fried', 'Fried', '🍗', '/uploads/menu/categories/fried.jpg', 4],
    ['pasta', 'Pasta', '🍝', '/uploads/menu/categories/pasta.jpg', 5],
    ['fries', 'Fries', '🍟', '/uploads/menu/categories/fries.jpg', 6],
    ['drinks', 'Drinks', '🥤', '/uploads/menu/categories/drinks.jpg', 7],
  ];
  for (const [id, name, icon, image, sort] of defaultCategories) {
    run(
      'INSERT OR IGNORE INTO menu_categories (id, name, icon, image, sort_order, active) VALUES (?, ?, ?, ?, ?, 1)',
      [id, name, icon, image, sort]
    );
    run(
      `UPDATE menu_categories SET name = ?, icon = ?, image = ?, sort_order = ?, active = 1
       WHERE id = ? AND (image IS NULL OR image = '' OR image NOT LIKE '/uploads/%')`,
      [name, icon, image, sort, id]
    );
  }

  // --- deals (combos / offers shown separately in app) ---
  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='deals'")) {
    execMulti(`
      CREATE TABLE deals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subtitle TEXT,
        description TEXT,
        image TEXT,
        deal_price INTEGER NOT NULL DEFAULT 0,
        original_price INTEGER DEFAULT 0,
        menu_item_ids TEXT,
        badge TEXT,
        sort_order INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        valid_from TEXT,
        valid_until TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
    run(
      `INSERT INTO deals (id, title, subtitle, description, image, deal_price, original_price, menu_item_ids, badge, sort_order, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        'deal_zinger_wings',
        'Zinger + Wings Combo',
        'Best seller combo',
        'Chicken Zinger Tower + 6 Funky Wings. Perfect for one hungry person.',
        '/uploads/deals/deal-zinger-wings.png',
        999,
        1248,
        JSON.stringify(['b3', 'f5']),
        '20% OFF',
        1,
      ]
    );
    run(
      `INSERT INTO deals (id, title, subtitle, description, image, deal_price, original_price, menu_item_ids, badge, sort_order, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        'deal_family_feast',
        'Family Feast',
        'Feed 3–4 people',
        'Cocain Signature burger, 4pc fried chicken & Special Pasta.',
        '/uploads/deals/deal-family-feast.png',
        2499,
        2897,
        JSON.stringify(['b1', 'f1', 'p1']),
        'SAVE Rs. 400',
        2,
      ]
    );
  }

  // --- admin trash (soft-deleted items, auto-purge after 30 days) ---
  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='admin_trash'")) {
    execMulti(`
      CREATE TABLE admin_trash (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        title TEXT NOT NULL,
        payload TEXT NOT NULL,
        deleted_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX idx_admin_trash_deleted ON admin_trash (deleted_at);
    `);
  }

  // --- push notification campaigns (deals / promos / broadcasts) ---
  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='notification_campaigns'")) {
    execMulti(`
      CREATE TABLE notification_campaigns (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        target TEXT NOT NULL DEFAULT 'customers',
        link TEXT,
        deal_id TEXT,
        scheduled_at TEXT,
        sent_at TEXT,
        status TEXT DEFAULT 'pending',
        recipient_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX idx_notification_campaigns_schedule ON notification_campaigns (status, scheduled_at);
    `);
  }

  // --- inventory (raw stock + recipes) ---
  ensureColumn('orders', 'inventory_deducted', 'INTEGER DEFAULT 0');

  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='inventory_items'")) {
    execMulti(`
      CREATE TABLE inventory_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        unit TEXT NOT NULL DEFAULT 'kg',
        quantity REAL NOT NULL DEFAULT 0,
        low_stock REAL DEFAULT 0,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='recipe_ingredients'")) {
    execMulti(`
      CREATE TABLE recipe_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        inventory_item_id TEXT NOT NULL,
        amount REAL NOT NULL,
        unit TEXT NOT NULL,
        UNIQUE(target_type, target_id, inventory_item_id)
      );
      CREATE INDEX idx_recipe_target ON recipe_ingredients (target_type, target_id);
      CREATE INDEX idx_recipe_inventory ON recipe_ingredients (inventory_item_id);
    `);
  }

  if (!get("SELECT name FROM sqlite_master WHERE type='table' AND name='inventory_movements'")) {
    execMulti(`
      CREATE TABLE inventory_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inventory_item_id TEXT NOT NULL,
        delta REAL NOT NULL,
        quantity_after REAL NOT NULL,
        order_id TEXT,
        reason TEXT NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX idx_inventory_movements_item ON inventory_movements (inventory_item_id);
      CREATE INDEX idx_inventory_movements_order ON inventory_movements (order_id);
    `);
  }
}

module.exports = { runMigrationsV2 };
