const { init } = require('../db/connection');
const { menuItemImage } = require('../db/menu-images');
const seed = require('../db/seed-menu');

init()
  .then(({ run }) => {
    for (const row of seed) {
      run('UPDATE menu_items SET image = ? WHERE id = ?', [row.image, row.id]);
    }
    console.log('Updated', seed.length, 'menu item images');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
