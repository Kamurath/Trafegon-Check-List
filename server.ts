import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Lazy loader for GoogleGenAI to prevent startup crash if GEMINI_API_KEY is not defined
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('API Key do Gemini não configurada. Por favor, adicione GEMINI_API_KEY no painel de configurações de Segredos / Settings do AI Studio.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API: Generate social suggestions based on a particular event / time of the year
app.post('/api/generate-suggestions', async (req, res) => {
  try {
    const { theme } = req.body;
    if (!theme || typeof theme !== 'string') {
      res.status(400).json({ error: 'O tema do período do ano é obrigatório.' });
      return;
    }

    const ai = getAIClient();

    const systemPrompt = `Você é um copywriter de elite de marketing digital especializado para franquias da Espaçolaser (estética e depilação a laser). 
O usuário trará um período do ano ou evento comemorativo (como "Natal", "Copa do Mundo", "Dia dos Namorados", "Festa Junina", "Carnaval", "Black Friday" ou outro tema de época).
Sua missão é gerar ideias exclusivas, altamente criativas, persuasivas e prontas para publicar no Instagram para movimentar as redes sociais da clínica local.

Atenção absoluta aos limites das Notas de Instagram:
- Devem ter tom leve, descontraído e próximo do consumidor local.
- Devem ter no MÁXIMO 50 caracteres (contando espaços e letras). Se puder, faça com menos, idealmente em torno de 30-45 caracteres.
- Nunca use emojis, hashtags, @marcações ou letras totalmente maiúsculas nas Notas. Elas precisam parecer escritas por um humano de forma nativa e limpa.

Exemplos de boas Notas curtas e limpas:
- "Adeus lâmina, olá liberdade" (27 caracteres)
- "Pele lisa para curtir o sol" (28 caracteres)
- "Sua sessão favorita te espera" (29 caracteres)
- "Agendou suas axilas essa semana?" (33 caracteres)`;

    const userPrompt = `Gere sugestões criativas de comunicação baseadas no tema: "${theme}". 
Pense em frases originais conectando o espírito de ${theme} com a sensação de ter uma pele macia, livre de pelos com depilação a laser e a autoestima lá em cima.

Gere exatamente:
1. 3 Notas de Instagram curtas dadas a limitação de caracteres (máx. 45-50 caracteres, SEM emojis e SEM hashtags).
2. 3 ideias/perguntas instigantes para Stories (interativas, estimulando respostas no direct ou enquetes).
3. 3 ganchos magnéticos para Reels de depilação a laser (frases de 3 segundos para reter atenção).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            notas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Três sugestões de Notas diárias de Instagram, cada uma estritamente com até 45-50 caracteres, sem hashtags ou emojis."
            },
            stories: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Três ideias ou frases interativas de Stories para engajamento local."
            },
            reels: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Três ganchos/temas magnéticos para vídeos rápidos de Reels."
            }
          },
          required: ['notas', 'stories', 'reels']
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Nenhum resultado retornado pelo modelo de linguagem.');
    }

    const parsedData = JSON.parse(textOutput.trim());
    res.json(parsedData);

  } catch (error: any) {
    console.error('Erro na rota de geração Gemini:', error);
    res.status(500).json({ error: error.message || 'Falha interna ao gerar as sugestões de IA.' });
  }
});

// Configure Vite integration or SPA static sever fallback
async function boot() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

boot();
