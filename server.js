// server.js - AL CIELO Engine (solo OpenAI)
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Tu llave de OpenAI configurada en variables de entorno
const OPENAI_KEY = process.env.OPENAI_API_KEY;

// Endpoint para consultas de AURA
app.post('/api/ask-aura', async (req, res) => {
    const { prompt, taxData } = req.body;

    // Contexto profesional de AURA (Senior Tax Specialist)
    const systemContext = `
Actúa como Senior Tax Specialist en impuestos USA 2026.
Datos del contribuyente: AGI: ${taxData.agi}, Net Profit: ${taxData.net}.
No menciones que eres una IA.
Responde de forma técnica, directa y con ejemplos si aplica.
`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4",
                messages: [
                    { role: "system", content: systemContext },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return res.json({
            source: 'OPENAI',
            answer: response.data.choices[0].message.content
        });

    } catch (error) {
        console.error("Error OpenAI:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: "El servicio de OpenAI falló." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AL CIELO Engine activo en puerto ${PORT}`));
