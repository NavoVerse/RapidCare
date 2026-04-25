const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('user_Database/rapidcare.db');
db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'", (err, rows) => {
    if (err) console.error(err);
    else console.log(rows[0].sql);
});
