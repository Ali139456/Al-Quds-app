const { init, dbPath } = require('./connection');

init()
  .then(() => {
    console.log('DB initialized at', dbPath);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
