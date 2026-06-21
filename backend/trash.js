const TRASH_RETENTION_DAYS = 30;

const TYPE_LABELS = {
  category: 'Category',
  menu_item: 'Menu item',
  addon: 'Add-on',
  banner: 'Banner',
  deal: 'Deal',
  order: 'Order',
  rider: 'Rider',
};

function createTrashService({ run, all, get, getParams, allParams }) {
  function moveToTrash(entityType, entityId, title, payload) {
    run(
      'INSERT INTO admin_trash (entity_type, entity_id, title, payload) VALUES (?, ?, ?, ?)',
      [entityType, String(entityId), String(title || entityId), JSON.stringify(payload)]
    );
  }

  function daysUntilPurge(deletedAt) {
    if (!deletedAt) return TRASH_RETENTION_DAYS;
    const deletedMs = Date.parse(String(deletedAt).replace(' ', 'T'));
    if (Number.isNaN(deletedMs)) return TRASH_RETENTION_DAYS;
    const purgeMs = deletedMs + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((purgeMs - Date.now()) / (24 * 60 * 60 * 1000)));
  }

  function listTrash() {
    const rows = all('SELECT * FROM admin_trash ORDER BY deleted_at DESC');
    return rows.map((row) => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      title: row.title,
      typeLabel: TYPE_LABELS[row.entity_type] || row.entity_type,
      deletedAt: row.deleted_at,
      daysUntilPurge: daysUntilPurge(row.deleted_at),
    }));
  }

  function getTrashItem(trashId) {
    const row = getParams('SELECT * FROM admin_trash WHERE id = ?', [trashId]);
    if (!row) return null;
    let payload;
    try {
      payload = JSON.parse(row.payload);
    } catch (_) {
      payload = null;
    }
    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      title: row.title,
      typeLabel: TYPE_LABELS[row.entity_type] || row.entity_type,
      deletedAt: row.deleted_at,
      daysUntilPurge: daysUntilPurge(row.deleted_at),
      payload,
    };
  }

  function insertRow(table, row, omitKeys = []) {
    const keys = Object.keys(row).filter(
      (k) => row[k] !== undefined && !omitKeys.includes(k) && k !== 'undefined'
    );
    if (!keys.length) return;
    const cols = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    run(
      `INSERT OR REPLACE INTO ${table} (${cols}) VALUES (${placeholders})`,
      keys.map((k) => row[k])
    );
  }

  function restore(trashId) {
    const row = getParams('SELECT * FROM admin_trash WHERE id = ?', [trashId]);
    if (!row) return { ok: false, error: 'Trash item not found' };

    let payload;
    try {
      payload = JSON.parse(row.payload);
    } catch (_) {
      return { ok: false, error: 'Invalid trash data' };
    }

    switch (row.entity_type) {
      case 'category':
        insertRow('menu_categories', payload);
        break;
      case 'menu_item':
        insertRow('menu_items', payload);
        break;
      case 'addon':
        insertRow('addons', payload);
        break;
      case 'banner':
        insertRow('banners', payload);
        break;
      case 'deal':
        insertRow('deals', payload);
        break;
      case 'order': {
        const { order, items } = payload;
        if (!order) return { ok: false, error: 'Missing order data' };
        insertRow('orders', order);
        if (Array.isArray(items)) {
          for (const item of items) {
            insertRow('order_items', item, ['id']);
          }
        }
        break;
      }
      case 'rider':
        insertRow('users', payload);
        break;
      default:
        return { ok: false, error: 'Unknown item type' };
    }

    run('DELETE FROM admin_trash WHERE id = ?', [trashId]);
    return { ok: true, entityType: row.entity_type, entityId: row.entity_id };
  }

  function purgeExpired() {
    const expired = all(
      `SELECT id FROM admin_trash WHERE datetime(deleted_at) <= datetime('now', '-${TRASH_RETENTION_DAYS} days')`
    );
    for (const row of expired) {
      run('DELETE FROM admin_trash WHERE id = ?', [row.id]);
    }
    return expired.length;
  }

  function startAutoPurge(intervalMs = 60 * 60 * 1000) {
    purgeExpired();
    return setInterval(() => {
      const n = purgeExpired();
      if (n > 0) console.log(`  Trash: permanently removed ${n} item(s) older than ${TRASH_RETENTION_DAYS} days`);
    }, intervalMs);
  }

  function softDeleteCategory(id) {
    const cat = getParams('SELECT * FROM menu_categories WHERE id = ?', [id]);
    if (!cat) return { ok: false, status: 404, error: 'Category not found' };
    const used = getParams('SELECT COUNT(*) as c FROM menu_items WHERE category = ?', [id]);
    if (Number(used?.c) > 0) {
      return { ok: false, status: 409, error: 'Cannot delete — menu items still use this category' };
    }
    moveToTrash('category', id, cat.name || id, cat);
    run('DELETE FROM menu_categories WHERE id = ?', [id]);
    return { ok: true, id };
  }

  function softDeleteMenuItem(id) {
    const item = getParams('SELECT * FROM menu_items WHERE id = ?', [id]);
    if (!item) return { ok: false, status: 404, error: 'Menu item not found' };
    moveToTrash('menu_item', id, item.name || id, item);
    run('DELETE FROM menu_items WHERE id = ?', [id]);
    return { ok: true, id };
  }

  function softDeleteAddon(id) {
    const addon = getParams('SELECT * FROM addons WHERE id = ?', [id]);
    if (!addon) return { ok: false, status: 404, error: 'Add-on not found' };
    moveToTrash('addon', id, addon.name || id, addon);
    run('DELETE FROM addons WHERE id = ?', [id]);
    return { ok: true, id };
  }

  function softDeleteBanner(id) {
    const banner = getParams('SELECT * FROM banners WHERE id = ?', [id]);
    if (!banner) return { ok: false, status: 404, error: 'Banner not found' };
    moveToTrash('banner', id, banner.title || `Banner #${id}`, banner);
    run('DELETE FROM banners WHERE id = ?', [id]);
    return { ok: true, id };
  }

  function softDeleteDeal(id) {
    const deal = getParams('SELECT * FROM deals WHERE id = ?', [id]);
    if (!deal) return { ok: false, status: 404, error: 'Deal not found' };
    moveToTrash('deal', id, deal.title || id, deal);
    run('DELETE FROM deals WHERE id = ?', [id]);
    return { ok: true, id };
  }

  function softDeleteOrder(id) {
    const order = getParams('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return { ok: false, status: 404, error: 'Order not found' };
    const items = allParams('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', [id]);
    moveToTrash('order', id, order.customer_name ? `Order ${id} · ${order.customer_name}` : `Order ${id}`, {
      order,
      items,
    });
    try {
      run('DELETE FROM coupon_uses WHERE order_id = ?', [id]);
    } catch (_) {}
    run('DELETE FROM order_items WHERE order_id = ?', [id]);
    run('DELETE FROM orders WHERE id = ?', [id]);
    return { ok: true, id };
  }

  function softDeleteRider(id) {
    const rider = getParams('SELECT * FROM users WHERE id = ?', [id]);
    if (!rider || rider.role !== 'rider') {
      return { ok: false, status: 404, error: 'Rider not found' };
    }
    moveToTrash('rider', id, rider.name || rider.phone || id, rider);
    run('DELETE FROM rider_locations WHERE rider_id = ?', [id]);
    run('DELETE FROM push_tokens WHERE user_id = ?', [id]);
    run('DELETE FROM notifications WHERE user_id = ?', [id]);
    run('DELETE FROM users WHERE id = ?', [id]);
    return { ok: true, id };
  }

  return {
    TRASH_RETENTION_DAYS,
    listTrash,
    getTrashItem,
    restore,
    purgeExpired,
    startAutoPurge,
    softDeleteCategory,
    softDeleteMenuItem,
    softDeleteAddon,
    softDeleteBanner,
    softDeleteDeal,
    softDeleteOrder,
    softDeleteRider,
  };
}

module.exports = { createTrashService, TRASH_RETENTION_DAYS, TYPE_LABELS };
