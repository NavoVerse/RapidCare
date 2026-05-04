const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Gemini Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "You are Medula, a friendly and highly knowledgeable medical assistant for RapidCare Medicine Hub. Your goal is to help users find medicines, explain their uses (always with a disclaimer), and provide health tips. You should be polite, concise, and helpful. If asked about medical emergencies, advise calling 112 or the RapidCare helpline. Answer like Gemini - helpful, structured, and insightful. Keep responses short and optimized for a chat bubble."
});

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

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    try {
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();
        res.json({ reply: text });
    } catch (err) {
        console.error('Gemini Error:', err);
        res.status(500).json({ error: "Medula is resting. Please try again later." });
    }
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
