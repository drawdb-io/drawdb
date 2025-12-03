import { useState } from "react";
import { TextArea, Input, Banner, Button, Spin, Select } from "@douyinfe/semi-ui";
import { generateSchema, AI_PROVIDERS } from "../../../api/ai";
import { useDiagram, useUndoRedo } from "../../../hooks";

export default function AiGenerate({ setModal }) {
  // User input state
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  
  // AI provider configuration
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("");
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Diagram manipulation hooks
  const { setTables, setRelationships } = useDiagram();
  const { setUndoStack, setRedoStack } = useUndoRedo();

  // Get the currently selected provider's configuration
  const currentProvider = Object.values(AI_PROVIDERS).find(p => p.id === provider);
  const availableModels = currentProvider?.models || [];

  /**
   * Handles the schema generation process
   * 1. Validates input
   * 2. Calls AI API
   * 3. Processes coordinates to avoid table overlap
   * 4. Updates the diagram
   */
  const handleGenerate = async () => {
    // Validate that user has entered required fields
    if (!prompt || !apiKey) return;

    setLoading(true);
    setError(null);

    try {
      // Call AI API to generate schema
      const schema = await generateSchema(prompt, apiKey, provider, model);

      // Intelligently position tables in a grid layout to prevent overlap
      if (schema?.tables && Array.isArray(schema.tables)) {
        schema.tables.forEach((table, index) => {
          // Arrange tables in a 4-column grid, 300px apart
          table.x = typeof table.x === "number" ? table.x : (index % 4) * 300;
          table.y = typeof table.y === "number" ? table.y : Math.floor(index / 4) * 300;
        });
      }

      // Update the diagram with the generated schema
      setTables(schema.tables ?? []);
      setRelationships(schema.relationships ?? []);

      // Clear undo/redo history since this is a fresh generation
      setUndoStack([]);
      setRedoStack([]);

      // Close the modal on success
      setModal(0);
    } catch (err) {
      // Display user-friendly error message
      setError(err.message || "Failed to generate schema");
    } finally {
      setLoading(false);
    }
  };

  /**
   * When user changes AI provider, reset the model selection
   * since different providers have different available models
   */
  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    setModel(""); 
  };

  /**
   * Returns the appropriate placeholder text for API key input
   * based on the selected provider
   */
  const getApiKeyPlaceholder = () => {
    switch (provider) {
      case "openai":
        return "sk-...";
      case "anthropic":
        return "sk-ant-...";
      case "google":
        return "AIza...";
      case "groq":
        return "gsk_...";
      default:
        return "Enter your API key";
    }
  };

  return (
    <div className="space-y-4">
      {error && <Banner type="danger" description={error} />}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="font-semibold mb-1">AI Provider</div>
          <Select
            value={provider}
            onChange={handleProviderChange}
            style={{ width: "100%" }}
          >
            {Object.values(AI_PROVIDERS).map((p) => (
              <Select.Option key={p.id} value={p.id}>
                {p.name}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <div className="font-semibold mb-1">Model</div>
          <Select
            value={model || currentProvider?.defaultModel}
            onChange={setModel}
            style={{ width: "100%" }}
            placeholder="Select model"
          >
            {availableModels.map((m) => (
              <Select.Option key={m} value={m}>
                {m}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <div className="font-semibold mb-1">API Key</div>
        <Input
          type="password"
          placeholder={getApiKeyPlaceholder()}
          value={apiKey}
          onChange={setApiKey}
        />
        <div className="text-xs text-gray-500 mt-1">
          Your key is never stored on our server.
        </div>
      </div>

      <div>
        <div className="font-semibold mb-1">Describe your database</div>
        <TextArea
          rows={6}
          placeholder="E.g., An e-commerce system with users, products, orders, and reviews."
          value={prompt}
          onChange={setPrompt}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button
          theme="solid"
          disabled={loading || !prompt || !apiKey}
          onClick={handleGenerate}
        >
          {loading ? <Spin /> : "Generate Schema"}
        </Button>
      </div>
    </div>
  );
}
