const { init } = require('../db/connection');
const { createInventoryService } = require('../inventory');

(async () => {
  const { run, get, getParams, allParams, all } = await init();
  const inv = createInventoryService({ run, all, get, getParams, allParams });

  run(
    "INSERT OR REPLACE INTO inventory_items (id, name, unit, quantity, low_stock) VALUES ('inv_test_chicken', 'Chicken', 'kg', 5, 1)"
  );

  const menu = get('SELECT id FROM menu_items LIMIT 1');
  if (!menu) {
    console.log('No menu items — skip');
    process.exit(0);
  }

  run('DELETE FROM recipe_ingredients WHERE target_type = ? AND target_id = ?', ['menu_item', menu.id]);
  run(
    'INSERT INTO recipe_ingredients (target_type, target_id, inventory_item_id, amount, unit) VALUES (?, ?, ?, ?, ?)',
    ['menu_item', menu.id, 'inv_test_chicken', 50, 'g']
  );

  const oid = 'order_inv_test_' + Date.now();
  run(
    `INSERT INTO orders (id, user_id, total, subtotal, address_label, address_line, latitude, longitude, status, inventory_deducted)
     VALUES (?, 'guest', 500, 500, 'T', 'T', 33.6, 73.0, 'preparing', 0)`,
    [oid]
  );
  run('INSERT INTO order_items (order_id, food_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)', [
    oid,
    menu.id,
    'Test',
    500,
    2,
  ]);

  const before = getParams('SELECT quantity FROM inventory_items WHERE id = ?', ['inv_test_chicken']);
  inv.deductForOrder(oid);
  const after = getParams('SELECT quantity FROM inventory_items WHERE id = ?', ['inv_test_chicken']);

  console.log('Menu item:', menu.id);
  console.log('Before:', before.quantity, 'kg');
  console.log('After:', after.quantity, 'kg');
  console.log('Expected: 4.9 kg (2 × 50g)');

  run('DELETE FROM inventory_movements WHERE order_id = ?', [oid]);
  run('DELETE FROM order_items WHERE order_id = ?', [oid]);
  run('DELETE FROM orders WHERE id = ?', [oid]);
  run('UPDATE inventory_items SET quantity = 5 WHERE id = ?', ['inv_test_chicken']);
  process.exit(Math.abs(after.quantity - 4.9) < 0.01 ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
