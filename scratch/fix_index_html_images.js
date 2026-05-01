const fs = require('fs');
let html = fs.readFileSync('c:\\Users\\DELL\\OneDrive\\Desktop\\originalrapidcare\\medicine_hub\\index.html', 'utf8');

let imgCounter = 0;
html = html.replace(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-]+\?w=400(?:&amp;|&)q=80/g, () => {
    const src = `images/med_${imgCounter % 20}.jpg`;
    imgCounter++;
    return src;
});

// Also fix any other unsplash links just in case
html = html.replace(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-]+/g, () => {
    const src = `images/med_${imgCounter % 20}.jpg`;
    imgCounter++;
    return src;
});

fs.writeFileSync('c:\\Users\\DELL\\OneDrive\\Desktop\\originalrapidcare\\medicine_hub\\index.html', html, 'utf8');
console.log('Replaced all unsplash links in index.html with local images.');
