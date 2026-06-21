/**
 * Inventory: raw stock items, recipes (menu/addon/deal → ingredients),
 * auto-deduct when order status becomes delivered.
 */

function parseJson(str) {
  if (!str || typeof str !== 'string') return null;
  try {
    return JSON.parse(str);
  } catch (_) {
    return null;
  }
}

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs'];

const UNIT_META = {
  kg: { family: 'mass', factor: 1000 },
  g: { family: 'mass', factor: 1 },
  L: { family: 'volume', factor: 1000 },
  ml: { family: 'volume', factor: 1 },
  pcs: { family: 'count', factor: 1 },
};

function convertAmount(amount, fromUnit, toUnit) {
  const from = UNIT_META[fromUnit];
  const to = UNIT_META[toUnit];
  if (!from || !to) throw new Error('Unknown unit');
  if (from.family !== to.family) {
    throw new Error('Cannot convert ' + fromUnit + ' to ' + toUnit);
  }
  return (Number(amount) * from.factor) / to.factor;
}

function formatQty(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '0';
  return Math.abs(v - Math.round(v)) < 0.001 ? String(Math.round(v)) : v.toFixed(2).replace(/\.?0+$/, '');
}

function createInventoryService(db) {
  const { run, all, get, getParams, allParams } = db;

  function mapItemRow(r) {
    const quantity = Number(r.quantity) || 0;
    const lowStock = Number(r.low_stock) || 0;
    return {
      id: r.id,
      name: r.name,
      unit: r.unit,
      quantity,
      lowStock,
      notes: r.notes || '',
      isLow: lowStock > 0 && quantity <= lowStock,
      updatedAt: r.updated_at,
    };
  }

  function getRawRecipeRows(targetType, targetId) {
    return allParams(
      'SELECT inventory_item_id, amount, unit FROM recipe_ingredients WHERE target_type = ? AND target_id = ?',
      [targetType, targetId]
    );
  }

  /** Per-unit ingredient needs in each inventory item's unit. */
  function computePerUnitNeeds(targetType, targetId, addonIds = []) {
    const needs = {};

    function addIngredient(ing, multiplier) {
      const inv = getParams('SELECT id, unit, quantity, name FROM inventory_items WHERE id = ?', [
        ing.inventory_item_id,
      ]);
      if (!inv) return;
      const perUnit = convertAmount(Number(ing.amount), ing.unit, inv.unit) * multiplier;
      if (perUnit <= 0) return;
      if (!needs[inv.id]) {
        needs[inv.id] = { inventoryItemId: inv.id, name: inv.name, unit: inv.unit, stock: Number(inv.quantity) || 0, perUnit: 0 };
      }
      needs[inv.id].perUnit += perUnit;
      needs[inv.id].stock = Number(inv.quantity) || 0;
    }

    function addTargetNeeds(type, id, multiplier = 1) {
      const rows = getRawRecipeRows(type, id);
      for (const ing of rows) addIngredient(ing, multiplier);
    }

    if (targetType === 'deal') {
      const dealRows = getRawRecipeRows('deal', targetId);
      if (dealRows.length) {
        for (const ing of dealRows) addIngredient(ing, 1);
      } else {
        const deal = getParams('SELECT menu_item_ids FROM deals WHERE id = ?', [targetId]);
        const menuIds = parseJson(deal?.menu_item_ids) || [];
        for (const mid of menuIds) addTargetNeeds('menu_item', mid, 1);
      }
    } else {
      addTargetNeeds(targetType, targetId, 1);
    }

    for (const addonId of addonIds) {
      if (addonId) addTargetNeeds('addon', addonId, 1);
    }

    return needs;
  }

  function evaluateNeeds(needs, quantity = 1) {
    const keys = Object.keys(needs);
    if (!keys.length) {
      return { available: true, maxQty: 999, reason: null, shortages: [] };
    }

    let maxQty = Infinity;
    let bottleneck = null;
    const shortages = [];

    for (const invId of keys) {
      const n = needs[invId];
      if (!n.perUnit || n.perUnit <= 0) continue;
      const canMake = Math.floor(n.stock / n.perUnit);
      if (canMake < maxQty) {
        maxQty = canMake;
        bottleneck = n.name;
      }
      const required = n.perUnit * quantity;
      if (n.stock < required) {
        shortages.push({
          ingredient: n.name,
          need: formatQty(required) + ' ' + n.unit,
          have: formatQty(n.stock) + ' ' + n.unit,
        });
      }
    }

    if (maxQty === Infinity) maxQty = 999;
    if (maxQty <= 0) {
      return {
        available: false,
        maxQty: 0,
        reason: bottleneck ? 'Out of ' + bottleneck : 'Out of stock',
        shortages,
      };
    }
    if (quantity > maxQty) {
      return {
        available: false,
        maxQty,
        reason: bottleneck ? 'Only ' + maxQty + ' left (' + bottleneck + ')' : 'Only ' + maxQty + ' left',
        shortages,
      };
    }
    return { available: true, maxQty, reason: null, shortages };
  }

  function getTargetAvailability(targetType, targetId, quantity = 1, addonIds = []) {
    const needs = computePerUnitNeeds(targetType, targetId, addonIds);
    return evaluateNeeds(needs, quantity);
  }

  function resolveTargetForFoodId(foodId) {
    const deal = getParams('SELECT id FROM deals WHERE id = ?', [foodId]);
    if (deal) return { targetType: 'deal', targetId: foodId };
    return { targetType: 'menu_item', targetId: foodId };
  }

  function resolveAddonIdsFromOrderItem(item) {
    const ids = [];
    if (Array.isArray(item.addonIds)) {
      item.addonIds.forEach((id) => id && ids.push(String(id)));
    }
    if (Array.isArray(item.addons)) {
      item.addons.forEach((a) => {
        if (typeof a === 'string') {
          const row =
            getParams('SELECT id FROM addons WHERE lower(name) = lower(?)', [a.trim()]) ||
            getParams('SELECT id FROM addons WHERE name LIKE ?', ['%' + a.trim() + '%']);
          if (row) ids.push(row.id);
        } else if (a && a.id) {
          ids.push(String(a.id));
        }
      });
    } else if (typeof item.addons === 'string' && item.addons.trim()) {
      item.addons.split(',').forEach((name) => {
        const row =
          getParams('SELECT id FROM addons WHERE lower(name) = lower(?)', [name.trim()]) ||
          getParams('SELECT id FROM addons WHERE name LIKE ?', ['%' + name.trim() + '%']);
        if (row) ids.push(row.id);
      });
    }
    return ids;
  }

  function validateOrderItems(items) {
    const errors = [];
    for (const item of items || []) {
      const foodId = item.foodId || item.food_id;
      const qty = Math.max(1, Number(item.quantity) || 1);
      if (!foodId) continue;
      const { targetType, targetId } = resolveTargetForFoodId(foodId);
      const addonIds = resolveAddonIdsFromOrderItem(item);
      const avail = getTargetAvailability(targetType, targetId, qty, addonIds);
      if (!avail.available) {
        errors.push({
          foodId,
          name: item.name || foodId,
          quantity: qty,
          maxQty: avail.maxQty,
          reason: avail.reason || 'Out of stock',
        });
      }
    }
    return { ok: errors.length === 0, errors };
  }

  function getStockFlagsForMenuItems() {
    const flags = {};
    const rows = all('SELECT id FROM menu_items');
    for (const row of rows) {
      const avail = getTargetAvailability('menu_item', row.id, 1, []);
      flags[row.id] = {
        stockAvailable: avail.available,
        stockMaxQty: avail.maxQty,
        stockReason: avail.reason,
      };
    }
    return flags;
  }

  function getStockFlagsForDeals() {
    const flags = {};
    const rows = all('SELECT id FROM deals');
    for (const row of rows) {
      const avail = getTargetAvailability('deal', row.id, 1, []);
      flags[row.id] = {
        stockAvailable: avail.available,
        stockMaxQty: avail.maxQty,
        stockReason: avail.reason,
      };
    }
    return flags;
  }

  function getLowStockItems() {
    return all(
      'SELECT * FROM inventory_items WHERE low_stock > 0 AND quantity <= low_stock ORDER BY quantity ASC, name'
    ).map(mapItemRow);
  }

  function updateLowStockAlertCache() {
    try {
      const low = getLowStockItems();
      const payload = JSON.stringify(
        low.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, unit: i.unit, lowStock: i.lowStock }))
      );
      const existing = getParams("SELECT value FROM app_settings WHERE key = 'inventory_low_stock'", []);
      run("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('inventory_low_stock', ?)", [payload]);
      return { changed: existing?.value !== payload, count: low.length, items: low };
    } catch (_) {
      return { changed: false, count: 0, items: [] };
    }
  }

  function afterStockChange() {
    updateLowStockAlertCache();
  }

  function buildDealRecipeFromMenuItems(dealId) {
    const deal = getParams('SELECT id, title, menu_item_ids FROM deals WHERE id = ?', [dealId]);
    if (!deal) throw new Error('Deal not found');
    const menuIds = parseJson(deal.menu_item_ids) || [];
    if (!menuIds.length) throw new Error('Deal has no menu items linked');

    const merged = {};
    const sources = [];

    for (const mid of menuIds) {
      const menuRow = getParams('SELECT name FROM menu_items WHERE id = ?', [mid]);
      const ings = getRawRecipeRows('menu_item', mid);
      sources.push({ menuItemId: mid, name: menuRow?.name || mid, ingredientCount: ings.length });
      for (const ing of ings) {
        const inv = getParams('SELECT id, unit, name FROM inventory_items WHERE id = ?', [ing.inventory_item_id]);
        if (!inv) continue;
        const inInvUnit = convertAmount(Number(ing.amount), ing.unit, inv.unit);
        if (!merged[inv.id]) {
          merged[inv.id] = { inventoryItemId: inv.id, amount: 0, unit: inv.unit, name: inv.name };
        }
        merged[inv.id].amount += inInvUnit;
      }
    }

    const ingredients = Object.values(merged)
      .filter((m) => m.amount > 0)
      .map((m) => ({
        inventoryItemId: m.inventoryItemId,
        amount: Math.round(m.amount * 1000) / 1000,
        unit: m.unit,
      }));

    saveRecipe('deal', dealId, ingredients);
    return {
      dealId,
      title: deal.title,
      sourceMenuItems: sources,
      ingredients: loadRecipe('deal', dealId),
    };
  }

  function applyDelta(invId, delta, orderId, reason, notes) {
    const inv = getParams('SELECT id, name, quantity, unit FROM inventory_items WHERE id = ?', [invId]);
    if (!inv) return null;
    const after = Math.max(0, Number(inv.quantity) + Number(delta));
    run("UPDATE inventory_items SET quantity = ?, updated_at = datetime('now') WHERE id = ?", [after, invId]);
    run(
      `INSERT INTO inventory_movements (inventory_item_id, delta, quantity_after, order_id, reason, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [invId, Number(delta), after, orderId || null, reason, notes || null]
    );
    afterStockChange();
    return { id: invId, name: inv.name, unit: inv.unit, quantityAfter: after, delta: Number(delta) };
  }

  function addToDeductions(deductions, ing, orderQty) {
    const inv = getParams('SELECT id, unit FROM inventory_items WHERE id = ?', [ing.inventory_item_id]);
    if (!inv) return;
    const perItem = convertAmount(Number(ing.amount), ing.unit, inv.unit);
    const total = perItem * orderQty;
    deductions[inv.id] = (deductions[inv.id] || 0) + total;
  }

  function accumulateRecipeDeductions(deductions, targetType, targetId, orderQty) {
    const ingredients = allParams(
      'SELECT inventory_item_id, amount, unit FROM recipe_ingredients WHERE target_type = ? AND target_id = ?',
      [targetType, targetId]
    );
    for (const ing of ingredients) {
      addToDeductions(deductions, ing, orderQty);
    }
    return ingredients.length;
  }

  function processOrderLine(deductions, line) {
    const qty = Math.max(1, Number(line.quantity) || 1);
    const foodId = line.food_id;

    const deal = getParams('SELECT id, menu_item_ids FROM deals WHERE id = ?', [foodId]);
    if (deal) {
      const dealRecipeCount = accumulateRecipeDeductions(deductions, 'deal', foodId, qty);
      if (!dealRecipeCount) {
        const menuIds = parseJson(deal.menu_item_ids) || [];
        for (const mid of menuIds) {
          accumulateRecipeDeductions(deductions, 'menu_item', mid, qty);
        }
      }
    } else {
      accumulateRecipeDeductions(deductions, 'menu_item', foodId, qty);
    }

    if (line.addons) {
      const names = String(line.addons)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const aname of names) {
        const addon =
          getParams('SELECT id FROM addons WHERE lower(name) = lower(?)', [aname]) ||
          getParams('SELECT id FROM addons WHERE name LIKE ?', ['%' + aname + '%']);
        if (addon) accumulateRecipeDeductions(deductions, 'addon', addon.id, qty);
      }
    }
  }

  function deductForOrder(orderId) {
    const order = getParams('SELECT id, inventory_deducted FROM orders WHERE id = ?', [orderId]);
    if (!order) return { ok: false, error: 'Order not found' };
    if (order.inventory_deducted === 1) return { ok: true, skipped: true };

    const lines = allParams('SELECT food_id, name, quantity, addons FROM order_items WHERE order_id = ?', [orderId]);
    const deductions = {};

    for (const line of lines) {
      processOrderLine(deductions, line);
    }

    const changes = [];
    for (const [invId, amount] of Object.entries(deductions)) {
      if (!amount) continue;
      const result = applyDelta(invId, -amount, orderId, 'order_delivered', null);
      if (result) changes.push(result);
    }

    run('UPDATE orders SET inventory_deducted = 1 WHERE id = ?', [orderId]);
    return { ok: true, changes };
  }

  function restoreForOrder(orderId) {
    const order = getParams('SELECT inventory_deducted FROM orders WHERE id = ?', [orderId]);
    if (!order || order.inventory_deducted !== 1) return { ok: true, skipped: true };

    const movements = allParams(
      "SELECT inventory_item_id, delta FROM inventory_movements WHERE order_id = ? AND reason = 'order_delivered'",
      [orderId]
    );

    const changes = [];
    for (const m of movements) {
      const result = applyDelta(
        m.inventory_item_id,
        -Number(m.delta),
        orderId,
        'order_restored',
        'Stock restored after status change'
      );
      if (result) changes.push(result);
    }

    run('UPDATE orders SET inventory_deducted = 0 WHERE id = ?', [orderId]);
    return { ok: true, changes };
  }

  function onOrderStatusChange(orderId, oldStatus, newStatus) {
    if (newStatus === 'delivered' && oldStatus !== 'delivered') {
      return deductForOrder(orderId);
    }
    if (oldStatus === 'delivered' && newStatus === 'cancelled') {
      return restoreForOrder(orderId);
    }
    return { ok: true, skipped: true };
  }

  function loadRecipe(targetType, targetId) {
    const rows = allParams(
      `SELECT ri.id, ri.inventory_item_id, ri.amount, ri.unit, ii.name AS inventory_name, ii.unit AS inventory_unit, ii.quantity AS stock_qty
       FROM recipe_ingredients ri
       JOIN inventory_items ii ON ii.id = ri.inventory_item_id
       WHERE ri.target_type = ? AND ri.target_id = ?
       ORDER BY ii.name`,
      [targetType, targetId]
    );
    return rows.map((r) => ({
      id: r.id,
      inventoryItemId: r.inventory_item_id,
      inventoryName: r.inventory_name,
      inventoryUnit: r.inventory_unit,
      stockQty: Number(r.stock_qty) || 0,
      amount: Number(r.amount),
      unit: r.unit,
    }));
  }

  function saveRecipe(targetType, targetId, ingredients) {
    if (!targetType || !targetId) throw new Error('targetType and targetId required');
    run('DELETE FROM recipe_ingredients WHERE target_type = ? AND target_id = ?', [targetType, targetId]);
    for (const ing of ingredients || []) {
      const invId = ing.inventoryItemId || ing.inventory_item_id;
      const amount = Number(ing.amount);
      const unit = ing.unit;
      if (!invId || !amount || amount <= 0 || !unit) continue;
      if (!UNITS.includes(unit)) continue;
      const exists = getParams('SELECT id FROM inventory_items WHERE id = ?', [invId]);
      if (!exists) continue;
      run(
        'INSERT INTO recipe_ingredients (target_type, target_id, inventory_item_id, amount, unit) VALUES (?, ?, ?, ?, ?)',
        [targetType, targetId, invId, amount, unit]
      );
    }
    return loadRecipe(targetType, targetId);
  }

  function registerRoutes(app) {
    app.get('/api/admin/inventory/low-stock', (req, res) => {
      try {
        const items = getLowStockItems();
        res.json({ count: items.length, items });
      } catch (e) {
        res.status(500).json({ error: String(e.message) });
      }
    });

    app.post('/api/inventory/check', (req, res) => {
      try {
        const result = validateOrderItems(req.body?.items || []);
        res.json(result);
      } catch (e) {
        res.status(500).json({ error: String(e.message) });
      }
    });

    app.post('/api/admin/recipes/build-deal', (req, res) => {
      try {
        const dealId = req.body?.dealId || req.body?.deal_id;
        if (!dealId) return res.status(400).json({ error: 'dealId required' });
        const result = buildDealRecipeFromMenuItems(String(dealId));
        res.json(result);
      } catch (e) {
        res.status(400).json({ error: String(e.message) });
      }
    });

    app.get('/api/admin/inventory', (req, res) => {
      try {
        const rows = all('SELECT * FROM inventory_items ORDER BY name');
        const items = rows.map(mapItemRow);
        const lowCount = items.filter((i) => i.isLow).length;
        res.json({ items, lowCount, units: UNITS });
      } catch (e) {
        res.status(500).json({ error: String(e.message) });
      }
    });

    app.get('/api/admin/inventory/summary', (req, res) => {
      try {
        const totalItems = get('SELECT COUNT(*) AS c FROM inventory_items');
        const lowRow = all(
          'SELECT id FROM inventory_items WHERE low_stock > 0 AND quantity <= low_stock'
        );
        const recipeCount = get('SELECT COUNT(DISTINCT target_type || target_id) AS c FROM recipe_ingredients');
        const recent = allParams(
          `SELECT m.id, m.delta, m.quantity_after, m.reason, m.created_at, m.order_id, ii.name, ii.unit
           FROM inventory_movements m
           JOIN inventory_items ii ON ii.id = m.inventory_item_id
           ORDER BY m.id DESC LIMIT 8`,
          []
        );
        res.json({
          totalItems: totalItems?.c || 0,
          lowCount: lowRow.length,
          lowItems: getLowStockItems(),
          recipeCount: recipeCount?.c || 0,
          recent,
        });
      } catch (e) {
        res.status(500).json({ error: String(e.message) });
      }
    });

    app.post('/api/admin/inventory', (req, res) => {
      try {
        const body = req.body || {};
        const name = String(body.name || '').trim();
        const unit = UNITS.includes(body.unit) ? body.unit : 'kg';
        const quantity = Number(body.quantity);
        const lowStock = Number(body.lowStock ?? body.low_stock) || 0;
        const notes = String(body.notes || '').trim();
        if (!name) return res.status(400).json({ error: 'Name required' });

        let id = String(body.id || '').trim();
        if (!id) {
          id = 'inv_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
          let n = 2;
          const base = id;
          while (getParams('SELECT id FROM inventory_items WHERE id = ?', [id])) {
            id = base + '_' + n++;
          }
        } else if (getParams('SELECT id FROM inventory_items WHERE id = ?', [id])) {
          return res.status(400).json({ error: 'ID already exists' });
        }

        run(
          `INSERT INTO inventory_items (id, name, unit, quantity, low_stock, notes)
           VALUES (?, ?, ?, 0, ?, ?)`,
          [id, name, unit, lowStock, notes || null]
        );

        const qty = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
        if (qty > 0) {
          applyDelta(id, qty, null, 'initial_stock', 'Opening stock');
        }

        const row = getParams('SELECT * FROM inventory_items WHERE id = ?', [id]);
        res.json(mapItemRow(row));
      } catch (e) {
        res.status(500).json({ error: String(e.message) });
      }
    });

    app.patch('/api/admin/inventory/:id', (req, res) => {
      try {
        const { id } = req.params;
        const body = req.body || {};
        const existing = getParams('SELECT * FROM inventory_items WHERE id = ?', [id]);
        if (!existing) return res.status(404).json({ error: 'Not found' });

        if (body.name !== undefined) run('UPDATE inventory_items SET name = ? WHERE id = ?', [String(body.name).trim(), id]);
        if (body.unit !== undefined && UNITS.includes(body.unit)) {
          run('UPDATE inventory_items SET unit = ? WHERE id = ?', [body.unit, id]);
        }
        if (body.lowStock !== undefined || body.low_stock !== undefined) {
          run('UPDATE inventory_items SET low_stock = ? WHERE id = ?', [
            Number(body.lowStock ?? body.low_stock) || 0,
            id,
          ]);
        }
        if (body.notes !== undefined) run('UPDATE inventory_items SET notes = ? WHERE id = ?', [body.notes || null, id]);
        if (body.quantity !== undefined) {
          const newQty = Math.max(0, Number(body.quantity) || 0);
          const oldQty = Number(existing.quantity) || 0;
          const delta = newQty - oldQty;
          if (delta !== 0) {
            applyDelta(id, delta, null, 'manual_set', body.adjustNote || 'Manual quantity update');
          } else {
            run("UPDATE inventory_items SET updated_at = datetime('now') WHERE id = ?", [id]);
          }
        }

        run("UPDATE inventory_items SET updated_at = datetime('now') WHERE id = ?", [id]);
        const row = getParams('SELECT * FROM inventory_items WHERE id = ?', [id]);
        res.json(mapItemRow(row));
      } catch (e) {
        res.status(500).json({ error: String(e.message) });
      }
    });

    app.post('/api/admin/inventory/:id/adjust', (req, res) => {
      try {
        const { id } = req.params;
        const body = req.body || {};
        const delta = Number(body.delta);
        if (!Number.isFinite(delta) || delta === 0) {
          return res.status(400).json({ error: 'Non-zero delta required' });
        }
        const existing = getParams('SELECT id FROM inventory_items WHERE id = ?', [id]);
        if (!existing) return res.status(404).json({ error: 'Not found' });

        const reason = body.reason === 'purchase' ? 'purchase' : 'manual_adjust';
        const result = applyDelta(id, delta, null, reason, body.notes || null);
        const row = getParams('SELECT * FROM inventory_items WHERE id = ?', [id]);
        res.json({ item: mapItemRow(row), change: result });
      } catch (e) {
        res.status(500).json({ error: String(e.message) });
      }
    });

    app.delete('/api/admin/inventory/:id', (req, res) => {
      try {
        const { id } = req.params;
        const existing = getParams('SELECT id FROM inventory_items WHERE id = ?', [id]);
        if (!existing) return res.status(404).json({ error: 'Not found' });
        run('DELETE FROM recipe_ingredients WHERE inventory_item_id = ?', [id]);
        run('DELETE FROM inventory_movements WHERE inventory_item_id = ?', [id]);
        run('DELETE FROM inventory_items WHERE id = ?', [id]);
        res.json({ ok: true });
      } catch (e) {
        res.status(500).json({ error: String(e.message) });
      }
    });

    app.get('/api/admin/inventory/movements', (req, res) => {
      try {
        const itemId = req.query.itemId || req.query.item_id;
        const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
        let rows;
        if (itemId) {
          rows = allParams(
            `SELECT m.*, ii.name AS item_name, ii.unit AS item_unit
             FROM inventory_movements m
             JOIN inventory_items ii ON ii.id = m.inventory_item_id
             WHERE m.inventory_item_id = ?
             ORDER BY m.id DESC LIMIT ${limit}`,
            [itemId]
          );
        } else {
          rows = allParams(
            `SELECT m.*, ii.name AS item_name, ii.unit AS item_unit
             FROM inventory_movements m
             JOIN inventory_items ii ON ii.id = m.inventory_item_id
             ORDER BY m.id DESC LIMIT ${limit}`,
            []
          );
        }
        res.json(rows);
      } catch (e) {
        res.status(500).json({ error: String(e.message) });
      }
    });

    app.get('/api/admin/recipes/targets', (req, res) => {
      try {
        const menu = all('SELECT id, name, category FROM menu_items ORDER BY category, name').map((m) => ({
          type: 'menu_item',
          id: m.id,
          name: m.name,
          category: m.category,
        }));
        const addons = all('SELECT id, name FROM addons ORDER BY name').map((a) => ({
          type: 'addon',
          id: a.id,
          name: a.name,
          category: 'Add-on',
        }));
        const deals = all('SELECT id, title FROM deals ORDER BY title').map((d) => ({
          type: 'deal',
          id: d.id,
          name: d.title || d.id,
          category: 'Deal',
        }));
        const counts = {};
        all('SELECT target_type, target_id, COUNT(*) AS c FROM recipe_ingredients GROUP BY target_type, target_id').forEach(
          (r) => {
            counts[r.target_type + ':' + r.target_id] = r.c;
          }
        );
        const allTargets = menu.concat(addons, deals).map((t) => ({
          ...t,
          ingredientCount: counts[t.type + ':' + t.id] || 0,
        }));
        res.json(allTargets);
      } catch (e) {
        res.status(500).json({ error: String(e.message) });
      }
    });

    app.get('/api/admin/recipes', (req, res) => {
      try {
        const targetType = req.query.targetType || req.query.target_type;
        const targetId = req.query.targetId || req.query.target_id;
        if (!targetType || !targetId) {
          return res.status(400).json({ error: 'targetType and targetId required' });
        }
        res.json({ targetType, targetId, ingredients: loadRecipe(targetType, targetId) });
      } catch (e) {
        res.status(500).json({ error: String(e.message) });
      }
    });

    app.put('/api/admin/recipes', (req, res) => {
      try {
        const body = req.body || {};
        const targetType = body.targetType || body.target_type;
        const targetId = body.targetId || body.target_id;
        if (!targetType || !targetId) {
          return res.status(400).json({ error: 'targetType and targetId required' });
        }
        const ingredients = saveRecipe(targetType, targetId, body.ingredients);
        res.json({ targetType, targetId, ingredients });
      } catch (e) {
        res.status(500).json({ error: String(e.message) });
      }
    });
  }

  return {
    registerRoutes,
    onOrderStatusChange,
    deductForOrder,
    restoreForOrder,
    validateOrderItems,
    getStockFlagsForMenuItems,
    getStockFlagsForDeals,
    getTargetAvailability,
    getLowStockItems,
    buildDealRecipeFromMenuItems,
    updateLowStockAlertCache,
    convertAmount,
    formatQty,
    UNITS,
  };
}

module.exports = { createInventoryService, UNITS, convertAmount, formatQty };
