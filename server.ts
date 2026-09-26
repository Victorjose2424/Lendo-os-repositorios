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

// Polsia Agent Dispatch endpoint (calls Gemini to execute autonomous agent orders)
app.post('/api/polsia-agent-dispatch', async (req, res) => {
  try {
    const { agentName, agentRole, instruction, companyName, mrr } = req.body;

    if (!instruction || typeof instruction !== 'string') {
      res.status(400).json({ error: 'A instrução para o agente é obrigatória.' });
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `Você é o agente autônomo "${agentName || 'Atlas'}" da plataforma Polsia AI (Autonomous AI Operating System).
Sua função na empresa "${companyName || 'SaaS Venture'}": "${agentRole || 'Autonomous Agent'}".
A empresa tem MRR atual de $${mrr || 18940} e opera 24/7 sem intervenção manual.
Você deve planejar e executar a instrução solicitada com alto rigor técnico e foco em resultados concretos.

Responda em JSON estrito com o esquema:
{
  "agent": "${agentName || 'Atlas'}",
  "actionTitle": "título curto e impactante da ação executada",
  "thinking": "raciocínio analítico e estratégico do agente explicando a abordagem adotada",
  "toolCalls": ["Ferramenta1", "Ferramenta2"],
  "output": "entregável completo gerado (código fonte funcional, template de cold email, plano estratégico com OKRs, ou relatório financeiro)"
}
IMPORTANTE: Retorne APENAS o JSON válido sem blocos markdown adicionais em volta.`;

    const userPrompt = `INSTRUÇÃO DA LIDERANÇA / USUÁRIO:
${instruction}

Por favor, execute a tarefa e gere o entregável correspondente com nível de excelência profissional.`;

    const CANDIDATE_MODELS = [
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.1-pro-preview',
    ];

    let responseText = '';
    let lastError: any = null;

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
        console.warn(`Polsia dispatch attempt with ${modelName} failed:`, err?.message);
      }
    }

    if (!responseText) {
      throw lastError || new Error('Não foi possível processar a ordem do agente.');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedResult = JSON.parse(match[0]);
      } else {
        throw new Error('Falha ao interpretar resposta estruturada do agente.');
      }
    }

    res.json(parsedResult);
  } catch (error: any) {
    console.error('Erro na API /api/polsia-agent-dispatch:', error);
    res.status(500).json({
      error: error?.message || 'Erro ao processar despacho do agente.',
    });
  }
});

// Synthesize Real Functional Interactive App for ANY imported repository
app.post('/api/synthesize-app', async (req, res) => {
  try {
    const { repoName, fullName, description, readme, language, files } = req.body;

    if (!repoName) {
      res.status(400).json({ error: 'Nome do repositório é obrigatório.' });
      return;
    }

    const ai = getGeminiClient();

    const filesStr = Array.isArray(files)
      ? files.slice(0, 20).map((f: any) => `- ${f.path || f.name} (${f.size || 'file'})`).join('\n')
      : 'N/A';

    const readmeExcerpt = typeof readme === 'string' ? readme.slice(0, 3000) : '';

    const systemInstruction = `Você é um Engenheiro de Software Sênior e Arquiteto Full-Stack.
O usuário importou o repositório do GitHub "${fullName || repoName}" (${language || 'Web'}).
Descrição: "${description || 'Repositório de software'}"
Seu objetivo é gerar um APLICATIVO WEB INTERATIVO, COMPLETO E FUNCIONAL em um único arquivo HTML (HTML5 + CSS Tailwind + JavaScript vanilla moderno) que replique com perfeição e autenticidade as funcionalidades, interface, fluxo e propósito deste repositório!

Regras Cruciais:
1. O HTML deve ser 100% autônomo e executável dentro de um iframe.
2. Inclua o script CDN do Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
3. Crie uma interface rica, profissional e interativa, com formulários, botões que realmente alteram o estado da tela, painéis dinâmicos, gráficos simulados ou tabelas com dados interativos.
4. Se o repositório for uma ferramenta, CLI ou IA (como agentes, APIs, geradores, utilitários), forneça entradas reais para o usuário testar e ver os resultados operando na hora.
5. Se for um jogo, faça o jogo jogável com teclas e controles na tela.
6. Se for um dashboard, monte o painel com filtros e interações que respondem aos cliques.
7. Não crie placeholders estáticos ou páginas vazias. Forneça uma experiência interativa deslumbrante e de ponta a ponta.

Formato de resposta JSON estrito:
{
  "title": "Título conciso da aplicação",
  "summary": "Resumo do que a aplicação faz e como opera",
  "html": "<!DOCTYPE html><html>...</html>"
}`;

    const userPrompt = `REPOSITÓRIO: ${fullName || repoName}
LINGUAGEM: ${language}
DESCRIÇÃO: ${description}

ARQUIVOS DO REPOSITÓRIO:
${filesStr}

EXCERTO DO README:
${readmeExcerpt}

Por favor, gere o código HTML completo da aplicação interativa para este repositório.`;

    const CANDIDATE_MODELS = [
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.1-pro-preview',
    ];

    let responseText = '';
    let lastError: any = null;

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
        console.warn(`Synthesize app attempt with ${modelName} failed:`, err?.message);
      }
    }

    if (!responseText) {
      throw lastError || new Error('Não foi possível sintetizar a aplicação para este repositório.');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedResult = JSON.parse(match[0]);
      } else {
        throw new Error('Falha ao interpretar JSON retornado pela IA.');
      }
    }

    res.json({
      success: true,
      title: parsedResult.title || repoName,
      summary: parsedResult.summary || 'Aplicação sintetizada com sucesso.',
      html: parsedResult.html || '',
    });
  } catch (error: any) {
    console.error('Erro na API /api/synthesize-app:', error);
    res.status(500).json({
      error: error?.message || 'Erro ao sintetizar aplicação para o repositório.',
    });
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
