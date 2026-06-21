const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, '..', 'data', 'alquds.db');

initSqlJs().then((SQL) => {
  const db = new SQL.Database(fs.readFileSync(dbPath));
  const r = db.exec("SELECT id, image FROM menu_items WHERE id IN ('a1','a4','b1') ORDER BY id");
  console.log(r[0].values);
});
