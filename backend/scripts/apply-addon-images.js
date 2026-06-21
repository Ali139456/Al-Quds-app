const { init } = require('../db/connection');

const ADDON_IMAGES = {
  addon_fries: '/uploads/menu/addons/addon_fries.jpg',
  addon_drink: '/uploads/menu/addons/addon_drink.jpg',
  addon_pepsi: '/uploads/menu/addons/addon_pepsi.jpg',
  addon_coca_cola: '/uploads/menu/addons/addon_coca_cola.jpg',
  addon_fanta: '/uploads/menu/addons/addon_fanta.jpg',
  addon_sprite: '/uploads/menu/addons/addon_sprite.jpg',
  addon_7up: '/uploads/menu/addons/addon_7up.jpg',
  addon_mirinda: '/uploads/menu/addons/addon_mirinda.jpg',
};

init()
  .then(({ run }) => {
    for (const [id, image] of Object.entries(ADDON_IMAGES)) {
      run('UPDATE addons SET image = ? WHERE id = ?', [image, id]);
    }
    console.log('Updated', Object.keys(ADDON_IMAGES).length, 'addon images');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
