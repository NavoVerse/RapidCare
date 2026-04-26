const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    console.log('sqlite3 works!');
});
db.close();
