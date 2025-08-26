// Use dynamic import to avoid build issues
let OpenAI;

class OpenAIService {
  constructor() {
    this.client = null;
    this.apiKey = null;
  }

  async configure(apiKey) {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('API key is required');
    }

    try {
      // Dynamic import to avoid build issues
      if (!OpenAI) {
        const module = await import('openai');
        OpenAI = module.default;
      }

      this.apiKey = apiKey;
      this.client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, // Required for browser usage
      });
    } catch (error) {
      console.error('Error importing or configuring OpenAI:', error);
      // Fallback: mark as configured but with limited functionality
      this.client = { configured: true };
      this.apiKey = apiKey;
    }
  }

  isConfigured() {
    return !!this.client && !!this.apiKey;
  }

  async sendMessage(message, context = {}) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI client not configured. Please set API key first.');
    }

    try {
      // Check if we have a real OpenAI client
      if (this.client.chat && this.client.chat.completions) {
        const systemPrompt = this.buildSystemPrompt(context);
        
        const completion = await this.client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user", 
              content: message,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('Empty response from OpenAI');
        }

        return response;
      } else {
        // Fallback mock response
        await new Promise(resolve => setTimeout(resolve, 1000));
        return "OpenAI não está disponível no momento. Por favor, recarregue a página e configure sua API key novamente.";
      }
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      if (error.status === 401) {
        throw new Error('API key inválida. Verifique sua chave de acesso.');
      } else if (error.status === 429) {
        throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
      } else if (error.status === 500) {
        throw new Error('Erro interno da OpenAI. Tente novamente mais tarde.');
      } else {
        throw new Error(`Erro na API: ${error.message}`);
      }
    }
  }

  async generateTables(description, currentDiagram = {}) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI client not configured');
    }

    const prompt = `
ANÁLISE DA MENSAGEM:
Primeiro, analise se a mensagem do usuário indica intenção de criar/gerar tabelas de banco de dados.

MENSAGEM: ${description}

Se a mensagem NÃO for sobre criação de tabelas (como perguntas gerais, pedidos de ajuda, conversas), responda apenas com:
{ "intent": "chat" }

Se a mensagem FOR sobre criação de tabelas (palavras como: criar, gerar, fazer, preciso de, monte, construa, desenhe, etc + tabela/banco/estrutura), gere uma estrutura de banco de dados.

DIAGRAMA ATUAL: ${JSON.stringify(currentDiagram, null, 2)}

Para criação de tabelas, responda APENAS com um JSON válido no seguinte formato:
{
  "tables": [
    {
      "name": "nome_da_tabela",
      "fields": [
        {
          "name": "nome_campo",
          "type": "VARCHAR",
          "size": "255",
          "primary": false,
          "notNull": true,
          "responsibility": "B"
        }
      ]
    }
  ],
  "relationships": [
    {
      "startTableName": "tabela1",
      "endTableName": "tabela2", 
      "startFieldName": "campo1",
      "endFieldName": "campo2",
      "cardinality": "one_to_many"
    }
  ]
}

REGRAS:
- Use nomes de tabelas e campos em português brasileiro
- Adicione campo "responsibility" para cada campo: "F" (Frontend), "B" (Backend), "N" (n8n), "S" (Supabase)
- Inclua campos id como chave primária
- Use tipos de dados apropriados: VARCHAR, INT, DECIMAL, BOOLEAN, DATETIME, TEXT
- Para relacionamentos, use: "one_to_one", "one_to_many", "many_to_one"
- Considere o diagrama atual para evitar duplicatas`;

    try {
      const response = await this.sendMessage(prompt);
      return this.parseTableResponse(response);
    } catch (error) {
      throw new Error(`Erro ao gerar tabelas: ${error.message}`);
    }
  }

  parseTableResponse(response) {
    try {
      // Remove any markdown formatting
      const cleanResponse = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleanResponse);
      
      // Check if this is just a chat intent (not table creation)
      if (parsed.intent === 'chat') {
        return null; // This will make generateTables return null, triggering regular chat
      }
      
      // Validate structure for table creation
      if (!parsed.tables || !Array.isArray(parsed.tables)) {
        throw new Error('Invalid response format: missing tables array');
      }

      // Add IDs and validate fields
      parsed.tables = parsed.tables.map((table, tableIndex) => ({
        ...table,
        id: `ai_table_${Date.now()}_${tableIndex}`,
        fields: table.fields?.map((field, fieldIndex) => ({
          ...field,
          id: `ai_field_${Date.now()}_${tableIndex}_${fieldIndex}`,
          responsibility: field.responsibility || 'B', // Default to Backend
        })) || [],
      }));

      // Add IDs to relationships
      if (parsed.relationships) {
        parsed.relationships = parsed.relationships.map((rel, relIndex) => ({
          ...rel,
          id: `ai_rel_${Date.now()}_${relIndex}`,
        }));
      }

      return parsed;
    } catch (error) {
      console.error('Error parsing AI response:', response);
      throw new Error('Não foi possível interpretar a resposta da IA. Tente reformular sua solicitação.');
    }
  }

  buildSystemPrompt(context) {
    const { currentProject, existingTables = [] } = context;
    
    let prompt = `Você é um especialista em modelagem de banco de dados e arquitetura de software. 
Sua função é ajudar na criação e otimização de diagramas de banco de dados.

CONTEXTO:
- Você está trabalhando em um projeto de modelagem de dados
- O usuário pode solicitar criação de tabelas, modificações, ou melhorias
- Sempre considere boas práticas de normalização e design de banco de dados
- Use nomes descritivos em português brasileiro
- Responda de forma clara e didática

RESPONSABILIDADES DOS CAMPOS:
- F (Frontend): Campos principalmente usados na interface do usuário
- B (Backend): Campos de lógica de negócio e processamento
- N (n8n): Campos relacionados a automações e workflows  
- S (Supabase): Campos específicos do Supabase (auth, metadata, etc.)

DIRETRIZES:
- Sempre inclua campos de auditoria (created_at, updated_at) quando apropriado
- Use relacionamentos adequados entre tabelas
- Considere índices para campos frequentemente consultados
- Sugira melhorias quando possível`;

    if (currentProject) {
      prompt += `\n\nPROJETO ATUAL: ${currentProject.name}`;
      if (currentProject.description) {
        prompt += `\nDESCRIÇÃO: ${currentProject.description}`;
      }
    }

    if (existingTables.length > 0) {
      prompt += `\n\nTABELAS EXISTENTES: ${existingTables.map(t => t.name).join(', ')}`;
    }

    return prompt;
  }
}

// Singleton instance
const openAIService = new OpenAIService();

export default openAIService;