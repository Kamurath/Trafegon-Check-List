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

// Google Sheets metrics configuration
const METRICS_SHEETS: Record<string, string> = {
  '1': '1XxorSEspVwY-VAa8XeR2YleixguDwGwVaumu3rQS9OI',
  '2': '1xkhRGEhHMyntv2DcGtZPovX3vAzKglqEnbIRAFPxx10',
  '3': '1XPFZn437dv9wzMG7jX9kZVpPhsuzlRkWPlhmSC19DYY',
  '4': '12eWifNFUc5gVLGdPG48OUgWXzgiKnCxckNz2bXT3e_Q',
  '5': '1bZYM4-lw-7TWMtNcgX1apj5jrSpR1pBPXKAVxciSOWo',
  '6': '1NOeinp7l0oiXKb5zdjzmJ6C1YwMmwrsAqBrfGgnJ0cU',
  '7': '12kkXFpvxDbn-iOAEph1BW6kVJCed2C41ht37rPt6ZJM',
  '8': '19XhgdbWXFZLM3WbNASowzuBhKEhBxXHw2erhZwrHaY0',
  '9': '1eK26sKMqm_B8jyVXBeMJ9XYp1lK94yDsI8vk4xkv95k',
  '10': '197SLVpeuz1Bt3W9oLmnto_MyFU5fijUcGo-OjKzhN6c',
  '11': '1oVNAUdxSa1v-54QfAOLP7lyq0s-NYunU24sItzolrBw',
  '12': '15A37s0jyQEsLK5KTlRHkOPO1Hu1Bc3I-xQV1nWUiIZM',
  '13': '12XNNZnOJza65yNGagTXQEIwfwcPwf1gklaIW8pFHDlU'
};

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// API: Get Google Sheets metrics for all units
app.get('/api/metrics', async (req, res) => {
  try {
    const promises = Object.entries(METRICS_SHEETS).map(async ([unitId, sheetId]) => {
      try {
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        
        // Timeout control for spreadsheet downloads
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP status ${response.status}`);
        }
        
        const text = await response.text();
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        if (lines.length < 2) {
          throw new Error('Planilha vazia ou com formato incorreto.');
        }
        
        const rowValues = parseCSVRow(lines[1]);
        
        // Clean values stripping quotes and converting decimals formatted with Brazilian commas to Standard Floats
        const rawSpend = rowValues[0] || '0';
        const spend = parseFloat(rawSpend.replace(/"/g, '').replace(/\./g, '').replace(',', '.')) || 0;
        const impressions = parseInt((rowValues[1] || '0').replace(/"/g, ''), 10) || 0;
        const reach = parseInt((rowValues[2] || '0').replace(/"/g, ''), 10) || 0;
        const engagement = parseInt((rowValues[3] || '0').replace(/"/g, ''), 10) || 0;
        const clicks = parseInt((rowValues[4] || '0').replace(/"/g, ''), 10) || 0;
        const conversations = parseInt((rowValues[5] || '0').replace(/"/g, ''), 10) || 0;
        
        return {
          unitId,
          success: true,
          spend,
          impressions,
          reach,
          engagement,
          clicks,
          conversations,
          updatedAt: new Date().toISOString()
        };
      } catch (err: any) {
        console.error(`Erro ao buscar métricas da unidade ${unitId}:`, err.message);
        return {
          unitId,
          success: false,
          error: err.message || 'Erro de conexão/timeout'
        };
      }
    });
    
    const results = await Promise.all(promises);
    const metricsMap: Record<string, any> = {};
    results.forEach(res => {
      metricsMap[res.unitId] = res;
    });
    
    // Set response headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.json(metricsMap);
  } catch (error: any) {
    console.error('Erro ao processar métricas:', error);
    res.status(500).json({ error: error.message || 'Falha ao buscar ou processar dados de métricas.' });
  }
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
