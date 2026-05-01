const fs = require('fs');
let code = fs.readFileSync('c:\\Users\\DELL\\OneDrive\\Desktop\\originalrapidcare\\medicine_hub\\products.js', 'utf8');

// The file literally contains string "\`" instead of "`"
code = code.replace(/\\`/g, '`');
// It also contains "\${" instead of "${"
code = code.replace(/\\\${/g, '${');

fs.writeFileSync('c:\\Users\\DELL\\OneDrive\\Desktop\\originalrapidcare\\medicine_hub\\products.js', code, 'utf8');
console.log('Fixed syntax errors in products.js');
