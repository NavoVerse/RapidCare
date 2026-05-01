const https = require('https');
const fs = require('fs');
const path = require('path');

const ids = [
  '1584308666744-24d5c474f2ae',
  '1550572017-edb7df08b493',
  '1628771065518-0d82f1938462',
  '1471864190281-a93a3070b6de',
  '1585435557343-3b092031a831',
  '1607619056574-7b8d3ee536b2',
  '1631549916768-4119b2e5f926',
  '1556228578-0d85b1a4d571',
  '1576602976047-174e57a47881',
  '1587854692152-cbe660dbde88',
  '1573883430060-705908b9813c',
  '1505751172876-fa143ce4b58b',
  '1512069772995-364ee62020e5',
  '1577401235411-bdc24e3a09e5',
  '1584362917165-526a968579e8',
  '1563298723-dcfebaa392e3',
  '1578496479763-c21c718af028',
  '1615486171448-6fcba852652b',
  '1583324113626-70df0f4deaab',
  '1579684385127-1ef15d508118'
];

const dir = path.join('c:', 'Users', 'DELL', 'OneDrive', 'Desktop', 'originalrapidcare', 'medicine_hub', 'images');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

async function download(id, index) {
  const url = `https://images.unsplash.com/photo-${id}?w=400&q=80`;
  const dest = path.join(dir, `med_${index}.jpg`);
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Unsplash might redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        https.get(res.headers.location, (res2) => {
          const file = fs.createWriteStream(dest);
          res2.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      } else {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }
    }).on('error', reject);
  });
}

async function main() {
  for (let i = 0; i < ids.length; i++) {
    try {
      await download(ids[i], i);
      console.log(`Downloaded med_${i}.jpg`);
    } catch (e) {
      console.error(`Failed ${i}: ${e}`);
    }
  }
}

main();
