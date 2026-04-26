const Database = require('better-sqlite3');
const db = new Database(':memory:');
console.log('better-sqlite3 works!');
db.close();
