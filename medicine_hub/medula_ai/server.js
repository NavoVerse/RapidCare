const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Initialize Gemini Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const model = genAI.getGenerativeModel({ 
    model: modelName,
    systemInstruction: `You are Medula, a professional, empathetic, and highly accurate AI medical assistant for RapidCare Medicine Hub.
    
    GUIDELINES:
    1. Identity: Your name is Medula. You are powered by Gemini AI.
    2. Tone: Professional, reassuring, and concise.
    3. Medical Context: You can discuss medicines, symptoms, and wellness. 
    4. DISCLAIMER: Always include a brief disclaimer for medical advice (e.g., "Note: I am an AI, please consult a doctor for a definitive diagnosis").
    5. Emergency: For life-threatening situations, tell the user to CALL 112 immediately.
    6. RapidCare Context: Mention RapidCare services (30-min delivery, 2000+ partner pharmacies) when relevant.
    7. Formatting: Use bullet points for lists and keep paragraphs short.
    `
});

// Simple in-memory session storage (In production, use Redis or a database)
const sessions = {};

app.post('/api/chat', async (req, res) => {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    // Smart Fallback: Check for placeholder or missing API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE' || apiKey.trim() === '') {
        console.warn('⚠️ Medula is running in MOCK MODE (No API Key found).');
        return setTimeout(() => {
            res.json({ 
                reply: `### 🩺 Medula (Simulated Response)\n\nI see you're asking about **${message}**. \n\nTo give you a real AI-powered medical consultation, please update the \`GEMINI_API_KEY\` in your \`medula_ai/.env\` file. \n\n*Note: This is a placeholder response because no valid API key was detected.*`,
                sessionId: sessionId
            });
        }, 800);
    }

    try {
        // Get or create chat session
        if (!sessions[sessionId]) {
            sessions[sessionId] = model.startChat({
                history: [],
                generationConfig: {
                    maxOutputTokens: 500,
                },
            });
        }

        const chat = sessions[sessionId];
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.json({ 
            reply: text,
            sessionId: sessionId
        });
    } catch (error) {
        console.error('Medula Error:', error);
        
        if (error.message.includes('API_KEY_INVALID')) {
            return res.status(401).json({ error: "Invalid API Key. Please check your .env file." });
        }
        
        res.status(500).json({ 
            error: "Medula is momentarily unavailable.",
            details: error.message 
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'Medula is healthy', port: PORT });
});

app.listen(PORT, () => {
    console.log(`🚀 Medula AI Server running on http://localhost:${PORT}`);
});
