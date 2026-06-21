const { init } = require('../db/connection');

init()
  .then(({ run, save }) => {
    run("UPDATE deals SET image = ? WHERE id = ?", [
      '/uploads/deals/deal-zinger-wings.png',
      'deal_zinger_wings',
    ]);
    run("UPDATE deals SET image = ? WHERE id = ?", [
      '/uploads/deals/deal-family-feast.png',
      'deal_family_feast',
    ]);
    save();
    console.log('Deal images updated in database.');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
