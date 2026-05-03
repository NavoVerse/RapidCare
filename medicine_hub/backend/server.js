const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Load products
const productsPath = path.join(__dirname, 'products.json');
let db = {};
try {
    const data = fs.readFileSync(productsPath, 'utf8');
    db = JSON.parse(data);
} catch (err) {
    console.error('Error loading products:', err);
}

// API Routes
app.get('/api/medicines', (req, res) => {
    const { category, search } = req.query;
    let filtered = [...db.medicines];

    if (category && category !== 'All') {
        filtered = filtered.filter(p => p.category === category);
    }

    if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.molecule.toLowerCase().includes(query)
        );
    }

    res.json(filtered);
});

app.get('/api/kits', (req, res) => res.json(db.kits));
app.get('/api/oxygen', (req, res) => res.json(db.oxygen));
app.get('/api/devices', (req, res) => res.json(db.devices));
app.get('/api/ayurveda', (req, res) => res.json(db.ayurveda));

app.post('/api/order', (req, res) => {
    const { items, total } = req.body;
    console.log('Order received:', { items, total });
    res.json({ success: true, orderId: 'RC-' + Math.random().toString(36).substr(2, 9).toUpperCase() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
