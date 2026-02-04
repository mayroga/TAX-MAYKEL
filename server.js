const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Tus llaves secretas configuradas en las variables de entorno de Render
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

app.post('/api/ask-aura', async (req, res) => {
    const { prompt, taxData } = req.body;

    // Contexto de experto para obligar a la IA a responder como Senior Tax Specialist
    const systemContext = `Actúa como Senior Tax Specialist. Datos actuales: AGI: ${taxData.agi}, Net Profit: ${taxData.net}. No menciones que eres una IA. Responde de forma técnica y directa sobre impuestos 2026.`;

    try {
        // INTENTO 1: GEMINI
        const geminiRes = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`, {
            contents: [{ parts: [{ text: systemContext + prompt }] }]
        });
        
        return res.json({ 
            source: 'GEMINI_PRIMARY', 
            answer: geminiRes.data.candidates[0].content.parts[0].text 
        });

    } catch (error) {
        console.log("Gemini falló o límite excedido. Activando OpenAI...");

        try {
            // INTENTO 2: OPENAI (Failover)
            const openaiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: "gpt-4",
                messages: [
                    { role: "system", content: systemContext },
                    { role: "user", content: prompt }
                ]
            }, {
                headers: { 'Authorization': `Bearer ${OPENAI_KEY}` }
            });

            return res.json({ 
                source: 'OPENAI_BACKUP', 
                answer: openaiRes.data.choices[0].message.content 
            });

        } catch (err2) {
            return res.status(500).json({ error: "Ambos sistemas IA están fuera de servicio." });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AL CIELO Engine activo en puerto ${PORT}`));
