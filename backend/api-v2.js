const path = require('path');
const fs = require('fs');

function registerV2Routes(app, db, uploadPayment) {
  const { run, all, get, allParams, getParams } = db;

  function getSettings() {
    const rows = all('SELECT key, value FROM app_settings');
    const s = {};
    rows.forEach((r) => (s[r.key] = r.value));
    return s;
  }

  function setSetting(key, value) {
    run('INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime("now"))', [
      key,
      String(value),
    ]);
  }

  // --- Public settings ---
  app.get('/api/settings', (req, res) => {
    try {
      const s = getSettings();
      const zones = all('SELECT id, name, delivery_fee, eta_min, eta_max FROM delivery_zones WHERE active = 1');
      const promos = all('SELECT id, title, type, value, min_order, description FROM promotions WHERE active = 1');
      res.json({
        freeDeliveryMin: Number(s.free_delivery_min) || 1500,
        defaultDeliveryFee: Number(s.default_delivery_fee) || 0,
        storeOpen: s.store_open !== '0',
        busyMode: s.busy_mode === '1',
        busyExtraMins: Number(s.busy_extra_mins) || 15,
        deliveryTimeMin: Number(s.delivery_time_min) || 25,
        deliveryTimeMax: Number(s.delivery_time_max) || 40,
        loyaltyPointsPer100: Number(s.loyalty_points_per_100) || 5,
        referralBonus: Number(s.referral_bonus) || 100,
        proMonthlyFee: Number(s.pro_monthly_fee) || 299,
        partialAdvancePercent: Number(s.partial_advance_percent) || 50,
        supportWhatsapp: s.support_whatsapp || '03175858934',
        supportPhone: s.support_phone || '03175858934',
        deliveryZones: zones.map((z) => ({
          id: z.id,
          name: z.name,
          deliveryFee: Number(z.delivery_fee),
          etaMin: Number(z.eta_min),
          etaMax: Number(z.eta_max),
        })),
        promotions: promos,
      });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  // --- Coupon validate ---
  app.post('/api/coupons/validate', (req, res) => {
    try {
      const { code, subtotal, userId, isFirstOrder } = req.body || {};
      if (!code) return res.status(400).json({ error: 'Code required' });
      const coupon = getParams('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND active = 1', [
        String(code).trim(),
      ]);
      if (!coupon) return res.json({ valid: false, error: 'Invalid coupon code' });
      const now = new Date().toISOString();
      if (coupon.valid_from && coupon.valid_from > now)
        return res.json({ valid: false, error: 'Coupon not yet active' });
      if (coupon.valid_until && coupon.valid_until < now)
        return res.json({ valid: false, error: 'Coupon expired' });
      if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses)
        return res.json({ valid: false, error: 'Coupon fully used' });
      if (coupon.min_order > 0 && subtotal < coupon.min_order)
        return res.json({
          valid: false,
          error: `Minimum order Rs. ${coupon.min_order} required`,
        });
      if (coupon.first_order_only && !isFirstOrder)
        return res.json({ valid: false, error: 'Valid for first order only' });

      let discount = 0;
      let freeDelivery = !!coupon.free_delivery;
      if (coupon.type === 'flat') discount = Number(coupon.value);
      else if (coupon.type === 'percent') discount = Math.round((subtotal * Number(coupon.value)) / 100);
      discount = Math.min(discount, subtotal);

      res.json({
        valid: true,
        code: coupon.code,
        couponId: coupon.id,
        discount,
        freeDelivery,
        description: coupon.description,
      });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  // --- Order detail ---
  app.get('/api/orders/:id', (req, res) => {
    try {
      const order = getParams('SELECT * FROM orders WHERE id = ?', [req.params.id]);
      if (!order) return res.status(404).json({ error: 'Not found' });
      const items = allParams(
        'SELECT food_id, name, price, quantity, variety, addons, image, special_instructions, spice_level FROM order_items WHERE order_id = ?',
        [req.params.id]
      );
      order.items = items.map((it) => ({
        foodId: it.food_id,
        name: it.name,
        price: Number(it.price),
        quantity: Number(it.quantity),
        variety: it.variety,
        addons: it.addons,
        image: it.image,
        specialInstructions: it.special_instructions,
        spiceLevel: it.spice_level,
      }));
      res.json(order);
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  // --- Rate order ---
  app.post('/api/orders/:id/rate', (req, res) => {
    try {
      const { rating, comment } = req.body || {};
      if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });
      run('UPDATE orders SET rating = ?, rating_comment = ? WHERE id = ?', [
        rating,
        comment || null,
        req.params.id,
      ]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  // --- General feedback ---
  app.post('/api/feedback', (req, res) => {
    try {
      const { rating, comment, userId, email } = req.body || {};
      if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });
      run('INSERT INTO feedback (user_id, user_email, rating, comment) VALUES (?, ?, ?, ?)', [
        userId || null,
        email || null,
        rating,
        comment || null,
      ]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  // --- Push token ---
  app.post('/api/push-token', (req, res) => {
    try {
      const { userId, token, platform } = req.body || {};
      if (!token) return res.status(400).json({ error: 'token required' });
      if (!userId || userId === 'guest') {
        return res.status(400).json({ error: 'userId required — log in and enable notifications in the app' });
      }
      const existing = getParams('SELECT id FROM push_tokens WHERE token = ?', [token]);
      if (existing) {
        run('UPDATE push_tokens SET user_id = ?, platform = ? WHERE token = ?', [
          userId,
          platform || 'unknown',
          token,
        ]);
      } else {
        run('INSERT INTO push_tokens (user_id, token, platform) VALUES (?, ?, ?)', [
          userId,
          token,
          platform || 'unknown',
        ]);
      }
      const countRow = getParams('SELECT COUNT(*) as c FROM push_tokens WHERE user_id = ?', [userId]);
      res.json({ ok: true, registered: true, tokenCount: Number(countRow?.c) || 1 });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  // --- Loyalty ---
  app.get('/api/loyalty/:userId', (req, res) => {
    try {
      let acc = getParams('SELECT * FROM loyalty_accounts WHERE user_id = ?', [req.params.userId]);
      if (!acc) {
        const refCode = 'AQ' + req.params.userId.slice(-6).toUpperCase();
        run('INSERT INTO loyalty_accounts (user_id, referral_code) VALUES (?, ?)', [
          req.params.userId,
          refCode,
        ]);
        acc = getParams('SELECT * FROM loyalty_accounts WHERE user_id = ?', [req.params.userId]);
      }
      res.json({
        points: Number(acc.points),
        lifetimePoints: Number(acc.lifetime_points),
        isPro: !!acc.is_pro,
        proUntil: acc.pro_until,
        referralCode: acc.referral_code,
        walletBalance: Number(acc.wallet_balance),
      });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  // --- Notifications ---
  app.get('/api/notifications', (req, res) => {
    try {
      const userId = req.query.userId || 'guest';
      const rows = allParams(
        'SELECT id, title, body, read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        [userId]
      );
      res.json(rows);
    } catch (e) {
      res.json([]);
    }
  });

  app.patch('/api/notifications/:id/read', (req, res) => {
    try {
      run('UPDATE notifications SET read = 1 WHERE id = ?', [req.params.id]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.patch('/api/notifications/read-all', (req, res) => {
    try {
      const userId = req.body?.userId || req.query.userId || 'guest';
      run('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0', [userId]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  // --- Payment proof upload ---
  if (uploadPayment) {
    app.post('/api/payment-proof', (req, res, next) => {
      uploadPayment.single('image')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.file) return res.status(400).json({ error: 'No file' });
        const url = '/uploads/payments/' + req.file.filename;
        res.json({ url });
      });
    });
  }

  // --- Featured menu ---
  app.get('/api/menu/featured', (req, res) => {
    try {
      const rows = all('SELECT id, name, price, image, category, rating FROM menu_items WHERE featured = 1 AND in_stock = 1 LIMIT 12');
      res.json(rows);
    } catch (e) {
      res.json([]);
    }
  });

  // ============ ADMIN v2 ============

  app.get('/api/admin/coupons', (req, res) => {
    try {
      res.json(all('SELECT * FROM coupons ORDER BY created_at DESC'));
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.post('/api/admin/coupons', (req, res) => {
    try {
      const b = req.body || {};
      const id = b.id || 'coupon_' + Date.now();
      run(
        `INSERT OR REPLACE INTO coupons (id, code, type, value, min_order, max_uses, first_order_only, free_delivery, valid_until, active, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          String(b.code).toUpperCase(),
          b.type || 'flat',
          Number(b.value) || 0,
          Number(b.min_order) || 0,
          Number(b.max_uses) || 0,
          b.first_order_only ? 1 : 0,
          b.free_delivery ? 1 : 0,
          b.valid_until || null,
          b.active !== false ? 1 : 0,
          b.description || '',
        ]
      );
      res.json({ ok: true, id });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.patch('/api/admin/coupons/:id', (req, res) => {
    try {
      const active = req.body?.active === 1 || req.body?.active === true || req.body?.active === '1' ? 1 : 0;
      run('UPDATE coupons SET active = ? WHERE id = ?', [active, req.params.id]);
      res.json({ ok: true, active });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.delete('/api/admin/coupons/:id', (req, res) => {
    try {
      run('UPDATE coupons SET active = 0 WHERE id = ?', [req.params.id]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.get('/api/admin/settings', (req, res) => {
    try {
      res.json(getSettings());
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.patch('/api/admin/settings', (req, res) => {
    try {
      const body = req.body || {};
      for (const [k, v] of Object.entries(body)) setSetting(k, v);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.get('/api/admin/reports', (req, res) => {
    try {
      const totalOrders = get('SELECT COUNT(*) as c, SUM(total) as revenue FROM orders');
      const todayOrders = get(
        "SELECT COUNT(*) as c, SUM(total) as revenue FROM orders WHERE date(created_at) = date('now')"
      );
      const topItems = all(`
        SELECT oi.name, SUM(oi.quantity) as qty, SUM(oi.price * oi.quantity) as revenue
        FROM order_items oi GROUP BY oi.name ORDER BY qty DESC LIMIT 10
      `);
      const couponUsage = all(`
        SELECT coupon_code, COUNT(*) as uses, SUM(discount_amount) as saved
        FROM orders WHERE coupon_code IS NOT NULL AND coupon_code != ''
        GROUP BY coupon_code ORDER BY uses DESC
      `);
      const statusBreakdown = all('SELECT status, COUNT(*) as c FROM orders GROUP BY status');
      res.json({
        totalOrders: Number(totalOrders?.c) || 0,
        totalRevenue: Number(totalOrders?.revenue) || 0,
        todayOrders: Number(todayOrders?.c) || 0,
        todayRevenue: Number(todayOrders?.revenue) || 0,
        topItems,
        couponUsage,
        statusBreakdown,
      });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.get('/api/admin/delivery-zones', (req, res) => {
    try {
      res.json(all('SELECT * FROM delivery_zones ORDER BY name'));
    } catch (e) {
      res.json([]);
    }
  });

  app.patch('/api/admin/delivery-zones/:id', (req, res) => {
    try {
      const { delivery_fee, active, eta_min, eta_max } = req.body || {};
      run('UPDATE delivery_zones SET delivery_fee = ?, active = ?, eta_min = ?, eta_max = ? WHERE id = ?', [
        delivery_fee ?? 0,
        active !== false ? 1 : 0,
        eta_min ?? 25,
        eta_max ?? 40,
        req.params.id,
      ]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  app.patch('/api/admin/menu/:id/featured', (req, res) => {
    try {
      run('UPDATE menu_items SET featured = ? WHERE id = ?', [req.body.featured ? 1 : 0, req.params.id]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e.message) });
    }
  });

  return { getSettings, setSetting };
}

module.exports = { registerV2Routes };
