import axios from "axios";

export const AI_PROVIDERS = {
  OPENAI: "OpenAI",
  ANTHROPIC: "Anthropic",
};

const SYSTEM_PROMPT = `
You are a database schema expert. Your task is to generate a JSON object representing a database schema based on the user's description.
The output must strictly follow this JSON structure:
{
  "tables": [
    {
      "name": "TableName",
      "comment": "Description of the table",
      "fields": [
        {
          "name": "id",
          "type": "INT",
          "primary": true,
          "unique": true,
          "notNull": true,
          "increment": true,
          "comment": ""
        },
        {
          "name": "field_name",
          "type": "VARCHAR(255)",
          "primary": false,
          "unique": false,
          "notNull": false,
          "increment": false,
          "comment": "Description"
        }
      ]
    }
  ],
  "relationships": [
    {
      "startTable": "TableName1",
      "endTable": "TableName2",
      "startField": "id",
      "endField": "table1_id",
      "cardinality": "One to Many",
      "updateConstraint": "No action",
      "deleteConstraint": "Cascade",
      "name": "fk_table1_table2"
    }
  ]
}

Ensure all fields have appropriate data types.
Always include a primary key named 'id' for every table.
Use 'One to Many', 'Many to One', or 'One to One' for cardinality.
Return ONLY the JSON object, no markdown formatting or explanations.
`;

export const generateSchema = async (provider, apiKey, prompt) => {
  if (provider === AI_PROVIDERS.OPENAI) {
    return generateOpenAISchema(apiKey, prompt);
  } else if (provider === AI_PROVIDERS.ANTHROPIC) {
    return generateAnthropicSchema(apiKey, prompt);
  }
  throw new Error("Unsupported provider");
};

const generateOpenAISchema = async (apiKey, prompt) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const content = response.data.choices[0].message.content;
    return JSON.parse(content.replace(/```json|```/g, "").trim());
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error(
      error.response?.data?.error?.message || "Failed to generate schema",
    );
  }
};

const generateAnthropicSchema = async (apiKey, prompt) => {
  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
          "dangerously-allow-browser": true, // Required for client-side calls
        },
      },
    );

    const content = response.data.content[0].text;
    return JSON.parse(content.replace(/```json|```/g, "").trim());
  } catch (error) {
    console.error("Anthropic API Error:", error);
    throw new Error(
      error.response?.data?.error?.message || "Failed to generate schema",
    );
  }
};
