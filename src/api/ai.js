import axios from "axios";

/**
 * System prompt that instructs AI models to generate database schemas
 * in a specific JSON format compatible with DrawDB's internal structure.
 */
const SYSTEM_PROMPT = `
You are a database architect. Your task is to generate a database schema based on the user's description.
You must output strictly valid JSON format that matches the application's internal state structure.

Output Structure:
{
  "tables": [
    {
      "id": 0,
      "name": "TableName",
      "x": 0,
      "y": 0,
      "fields": [
        {
          "id": 0,
          "name": "id",
          "type": "INT",
          "primary": true,
          "unique": true,
          "notNull": true,
          "increment": true
        }
      ],
      "indices": []
    }
  ],
  "relationships": [
    {
      "id": 0,
      "name": "fk_table_other",
      "startTableId": 0,
      "startFieldId": 0,
      "endTableId": 1,
      "endFieldId": 0,
      "cardinality": "ONE_TO_MANY",
      "updateConstraint": "No action",
      "deleteConstraint": "No action"
    }
  ]
}

Rules:
1. Ensure Table IDs and Field IDs are integers and unique within the context.
2. Relationships must reference valid Table IDs and Field IDs.
3. Spread out the "x" and "y" coordinates so tables don't overlap (e.g., increment x by 300 for each table).
4. Do not include markdown formatting (like \`\`\`json). Return raw JSON only.
`;

/**
 * Configuration for supported AI providers and their available models.
 * Each provider has a unique ID, display name, list of available models,
 * and a default model that's selected when the provider is chosen.
 */
export const AI_PROVIDERS = {
  OPENAI: {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    defaultModel: "gpt-4o-mini",
  },
  ANTHROPIC: {
    id: "anthropic",
    name: "Anthropic",
    models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
    defaultModel: "claude-3-5-sonnet-20241022",
  },
  GOOGLE: {
    id: "google",
    name: "Google AI",
    models: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-flash-latest", "gemini-pro-latest"],
    defaultModel: "gemini-2.0-flash",
  },
  GROQ: {
    id: "groq",
    name: "Groq",
    models: ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"],
    defaultModel: "llama-3.3-70b-versatile",
  },
};

/**
 * Calls OpenAI's API to generate a database schema.
 * @param {string} apiKey - The OpenAI API key
 * @param {string} model - The model to use (e.g., 'gpt-4o-mini')
 * @param {string} description - User's natural language description of the database
 * @returns {Promise<string>} The generated schema as a JSON string
 */
async function callOpenAI(apiKey, model, description) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: description },
      ],
      temperature: 0.2, // Low temperature for more consistent, structured output
      max_tokens: 2000,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );
  return response.data.choices[0].message.content;
}

/**
 * Calls Anthropic's Claude API to generate a database schema.
 * @param {string} apiKey - The Anthropic API key
 * @param {string} model - The model to use (e.g., 'claude-3-5-sonnet-20241022')
 * @param {string} description - User's natural language description of the database
 * @returns {Promise<string>} The generated schema as a JSON string
 */
async function callAnthropic(apiKey, model, description) {
  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          // Anthropic combines system and user prompts in a single message
          content: `${SYSTEM_PROMPT}\n\nUser request: ${description}`,
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey, // Anthropic uses x-api-key header instead of Authorization
        "anthropic-version": "2023-06-01",
      },
    }
  );
  return response.data.content[0].text;
}

/**
 * Calls Google's Gemini API to generate a database schema.
 * @param {string} apiKey - The Google AI API key
 * @param {string} model - The model to use (e.g., 'gemini-2.0-flash')
 * @param {string} description - User's natural language description of the database
 * @returns {Promise<string>} The generated schema as a JSON string
 */
async function callGoogle(apiKey, model, description) {
  const response = await axios.post(
    // Google embeds the API key in the URL instead of headers
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      contents: [
        {
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\nUser request: ${description}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2000,
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.candidates[0].content.parts[0].text;
}

/**
 * Calls Groq's API to generate a database schema.
 * Groq uses an OpenAI-compatible API format.
 * @param {string} apiKey - The Groq API key
 * @param {string} model - The model to use (e.g., 'llama-3.3-70b-versatile')
 * @param {string} description - User's natural language description of the database
 * @returns {Promise<string>} The generated schema as a JSON string
 */
async function callGroq(apiKey, model, description) {
  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: description },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );
  return response.data.choices[0].message.content;
}

/**
 * Main function to generate a database schema using AI.
 * Supports multiple AI providers and automatically handles their different API formats.
 * 
 * @param {string} description - Natural language description of the database (e.g., "A blog system with users and posts")
 * @param {string} apiKey - API key for the selected provider
 * @param {string} [provider='openai'] - AI provider to use ('openai', 'anthropic', 'google', or 'groq')
 * @param {string|null} [model=null] - Specific model to use, or null to use the provider's default
 * @returns {Promise<Object>} Parsed schema object with 'tables' and 'relationships' arrays
 * @throws {Error} If the API call fails or the response cannot be parsed
 */
export async function generateSchema(description, apiKey, provider = "openai", model = null) {
  try {
    // Step 1: Determine which model to use
    const selectedModel = model || AI_PROVIDERS[provider.toUpperCase()]?.defaultModel;

    // Step 2: Call the appropriate AI provider
    let generatedContent;
    switch (provider.toLowerCase()) {
      case "openai":
        generatedContent = await callOpenAI(apiKey, selectedModel, description);
        break;
      case "anthropic":
        generatedContent = await callAnthropic(apiKey, selectedModel, description);
        break;
      case "google":
        generatedContent = await callGoogle(apiKey, selectedModel, description);
        break;
      case "groq":
        generatedContent = await callGroq(apiKey, selectedModel, description);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Step 3: Clean up the response (remove markdown code blocks if AI added them)
    let cleanedContent = generatedContent.trim();
    if (cleanedContent.startsWith("```")) {
      // Remove opening ```json and closing ```
      cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n/, "").replace(/\n```\s*$/, "");
    }

    // Step 4: Parse the JSON and return the schema object
    return JSON.parse(cleanedContent);
  } catch (error) {
    // Log the full error for debugging
    console.error("AI Generation Error:", error?.response?.data || error);
    
    // Extract a user-friendly error message
    const userFriendlyMessage = error?.response?.data?.error?.message || error.message;
    throw new Error(`Failed to generate schema: ${userFriendlyMessage}`);
  }
}
