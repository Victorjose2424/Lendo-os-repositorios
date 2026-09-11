import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client to avoid crashes if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('A variável de ambiente GEMINI_API_KEY não foi configurada.');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Proxy GitHub File endpoint (bypasses browser CORS & rate limit errors)
app.get('/api/proxy-github-file', async (req, res) => {
  try {
    const { owner, repo, path: filePath, branch } = req.query as {
      owner?: string;
      repo?: string;
      path?: string;
      branch?: string;
    };
    if (!owner || !repo || !filePath) {
      res.status(400).json({ error: 'Parâmetros owner, repo e path são obrigatórios.' });
      return;
    }
    const b = branch || 'main';
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${b}/${filePath}`;
    const rawRes = await fetch(rawUrl);
    if (rawRes.ok) {
      const text = await rawRes.text();
      res.json({ content: text });
      return;
    }
    res.status(404).json({ error: 'Arquivo não encontrado no GitHub.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Falha ao buscar arquivo do GitHub.' });
  }
});

// AI Prompt Edit endpoint
app.post('/api/prompt-edit', async (req, res) => {
  try {
    const { filePath, fileContent, prompt, repoName } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'O prompt de alteração é obrigatório.' });
      return;
    }

    if (typeof fileContent !== 'string') {
      res.status(400).json({ error: 'O conteúdo do arquivo é obrigatório.' });
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `Você é um Engenheiro de Software Sênior especialista em desenvolvimento web (HTML5, CSS3, JavaScript, TypeScript, Three.js, React).
O usuário deseja alterar o arquivo "${filePath || 'código'}" do projeto "${repoName || 'repositório'}".
Siga rigorosamente as instruções do usuário.
Você deve responder em formato JSON estrito com o seguinte esquema:
{
  "updatedCode": "código completo atualizado com as alterações solicitadas",
  "summary": "resumo conciso em português do que foi alterado",
  "explanation": "explicação técnica breve dos pontos alterados"
}
IMPORTANTE: Retorne APENAS o JSON válido sem blocos markdown adicionais em volta. O campo "updatedCode" DEVE conter o código integral do arquivo atualizado e funcional.`;

    const userMessage = `ARQUIVO: ${filePath}
PROJETO: ${repoName}

INSTRUÇÃO / PROMPT DO USUÁRIO:
${prompt}

CÓDIGO ATUAL DO ARQUIVO:
\`\`\`
${fileContent}
\`\`\`

Por favor, gere o código atualizado atendendo exatamente ao prompt do usuário.`;

    const CANDIDATE_MODELS = [
      'gemini-3.6-flash',
      'gemini-3.1-pro-preview',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
    ];

    let lastError: any = null;
    let responseText = '';

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: userMessage,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Tentativa com modelo ${modelName} falhou, tentando próximo modelo...`, err?.message);
      }
    }

    if (!responseText) {
      throw lastError || new Error('Não foi possível gerar alterações com os modelos de IA.');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      // Fallback in case there are wrapping characters
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Não foi possível interpretar a resposta da IA.');
      }
    }

    res.json({
      success: true,
      updatedCode: parsedResult.updatedCode || fileContent,
      summary: parsedResult.summary || 'Alterações geradas com sucesso.',
      explanation: parsedResult.explanation || '',
    });
  } catch (error: any) {
    console.error('Erro na API de prompt-edit:', error);
    res.status(500).json({
      error: error?.message || 'Erro ao processar alteração com IA.',
    });
  }
});

// AI Chat Copilot endpoint (conversational improvements directly on cloned repos)
app.post('/api/chat-copilot', async (req, res) => {
  try {
    const { userMessage, repoName, targetFile, fileContent, availableFiles, chatHistory } = req.body;

    if (!userMessage || typeof userMessage !== 'string') {
      res.status(400).json({ error: 'A mensagem do usuário é obrigatória.' });
      return;
    }

    const ai = getGeminiClient();

    const filesListStr = Array.isArray(availableFiles)
      ? availableFiles.map((f: any) => `- ${f.path || f.name} (${f.size || 'arquivo'})`).join('\n')
      : '- index.html\n- editor.html\n- 3d-preview.html\n- dashboard.html\n- login.html';

    const historyStr = Array.isArray(chatHistory) && chatHistory.length > 0
      ? chatHistory
          .slice(-6)
          .map((m: any) => `${m.sender === 'user' ? 'USUÁRIO' : 'COPILOT'}: ${m.text}`)
          .join('\n')
      : 'Início da conversa.';

    const systemInstruction = `Você é o Copilot de IA do GitRepo Hub, especialista sênior em engenharia de software (HTML5, CSS3, JavaScript, TypeScript, Three.js, React).
O usuário clonou o repositório "${repoName || 'repositório'}" e está solicitando melhorias, novas funcionalidades, ajustes de design ou correções através deste chat.

Arquivos disponíveis no repositório clonado:
${filesListStr}

Seu papel é responder conversacionalmente e fornecer as alterações completas de código para que o usuário possa aplicá-las IMEDIATAMENTE no repositório clonado e ver o resultado na hora.

Formato de resposta JSON estrito exigido:
{
  "targetFile": "nome exato do arquivo modificado (ex: ${targetFile || 'index.html'})",
  "replyText": "explicação conversacional, clara e amigável em português do que foi feito e como melhora o projeto",
  "summary": "resumo curto em uma frase do que foi modificado",
  "explanation": "detalhes técnicos dos elementos e estilos adicionados ou alterados",
  "updatedCode": "código completo funcional do arquivo modificado pronto para ser aplicado no repositório (HTML/JS/CSS completo se for arquivo web)",
  "suggestedFollowUps": ["ideia de melhoria 1", "ideia de melhoria 2", "ideia de melhoria 3"]
}

IMPORTANTE:
- Se o usuário pedir para alterar o visual, cores, botões, modo escuro ou novas seções, gere o arquivo integral atualizado com código de alta qualidade, responsivo e moderno.
- O campo "updatedCode" DEVE conter o código integral do arquivo para ser aplicado diretamente no repositório clonado.
- Responda apenas o JSON puro, sem blocos markdown adicionais em volta.`;

    const userPrompt = `HISTÓRICO RECENTE:
${historyStr}

ARQUIVO SELECIONADO: ${targetFile || 'Auto-detectar pelo prompt'}

SOLICITAÇÃO DO USUÁRIO NO CHAT:
${userMessage}

${fileContent ? `CÓDIGO ATUAL DE "${targetFile}":
\`\`\`
${fileContent}
\`\`\`` : 'Nota: Nenhum código base foi fornecido previamente. Se for necessário, gere uma implementação moderna para o arquivo correspondente.'}

Por favor, atenda à solicitação do usuário e gere a resposta com o código melhorado para aplicar no repositório.`;

    const CANDIDATE_MODELS = [
      'gemini-3.6-flash',
      'gemini-3.1-pro-preview',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
    ];

    let lastError: any = null;
    let responseText = '';

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Tentativa chat com modelo ${modelName} falhou, tentando próximo...`, err?.message);
      }
    }

    if (!responseText) {
      throw lastError || new Error('Não foi possível processar a resposta do Copilot.');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Formato de resposta inesperado do modelo.');
      }
    }

    res.json({
      success: true,
      targetFile: parsedResult.targetFile || targetFile || 'index.html',
      replyText: parsedResult.replyText || 'Melhorias geradas com sucesso!',
      summary: parsedResult.summary || 'Código melhorado com sucesso.',
      explanation: parsedResult.explanation || '',
      updatedCode: parsedResult.updatedCode || fileContent || '',
      suggestedFollowUps: parsedResult.suggestedFollowUps || [],
    });
  } catch (error: any) {
    console.error('Erro na API /api/chat-copilot:', error);
    res.status(500).json({
      error: error?.message || 'Erro interno ao processar chat do repositório.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GitRepo Hub server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
