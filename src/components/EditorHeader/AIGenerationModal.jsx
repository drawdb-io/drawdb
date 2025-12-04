import React, { useState } from "react";
import { Modal, TextArea, Select, Input, Button, Toast, Spin } from "@douyinfe/semi-ui";
import { IconCpu } from "@douyinfe/semi-icons";
import { AI_PROVIDERS, generateSchema } from "../../utils/aiUtils";
import { useDiagram } from "../../hooks";
import { nanoid } from "nanoid";
import { defaultBlue, ObjectType, Action } from "../../data/constants";

export default function AIGenerationModal({ visible, onClose }) {
    const [prompt, setPrompt] = useState("");
    const [provider, setProvider] = useState(AI_PROVIDERS.OPENAI);
    const [apiKey, setApiKey] = useState("");
    const [loading, setLoading] = useState(false);
    const { addTable, addRelationship, tables } = useDiagram();

    const handleGenerate = async () => {
        if (!prompt || !apiKey) {
            Toast.warning("Please enter both a prompt and an API key.");
            return;
        }

        setLoading(true);
        try {
            const schema = await generateSchema(provider, apiKey, prompt);

            const newTables = {};
            const startX = 100;
            let currentY = 100;

            // Create tables
            schema.tables.forEach((tableData, index) => {
                const tableId = nanoid();
                newTables[tableData.name] = tableId;

                const newTable = {
                    id: tableId,
                    name: tableData.name,
                    x: startX + (index % 3) * 250, // Simple grid layout
                    y: currentY + Math.floor(index / 3) * 200,
                    locked: false,
                    fields: tableData.fields.map((f) => ({
                        ...f,
                        id: nanoid(),
                    })),
                    comment: tableData.comment || "",
                    indices: [],
                    color: defaultBlue,
                };

                addTable({ table: newTable });
            });

            // Create relationships
            // We need to wait for state update or pass the new tables directly if possible.
            // Since addTable updates state, we might have a race condition if we rely on `tables` from hook immediately.
            // However, addTable uses functional state update, so it should be fine if we use the IDs we just generated.

            schema.relationships.forEach((rel) => {
                const startTableId = newTables[rel.startTable];
                const endTableId = newTables[rel.endTable];

                if (startTableId && endTableId) {
                    // We need to find the field IDs. Since we don't have easy access to the newly created field objects with their IDs here (unless we reconstruct them exactly as addTable does), 
                    // this part is tricky. 
                    // A better approach for `addTable` in DiagramContext would be to return the created table object, but we can't change that easily without refactoring.
                    // 
                    // Workaround: We can't easily add relationships immediately because we need the field IDs which are generated inside the loop above.
                    // But wait, in the loop above: `fields: tableData.fields.map((f) => ({ ...f, id: nanoid() }))`
                    // We ARE generating the IDs. We can store them!
                }
            });

            // Let's refactor the loop to store table data including field IDs

        } catch (error) {
            Toast.error(`Generation failed: ${error.message}`);
        } finally {
            setLoading(false);
            onClose();
        }
    };

    const handleGenerateWithRefinedLogic = async () => {
        if (!prompt || !apiKey) {
            Toast.warning("Please enter both a prompt and an API key.");
            return;
        }

        setLoading(true);
        try {
            const schema = await generateSchema(provider, apiKey, prompt);

            const createdTables = [];
            const startX = 100;
            let currentY = 100;

            // Prepare tables with IDs
            schema.tables.forEach((tableData, index) => {
                const tableId = nanoid();
                const fields = tableData.fields.map((f) => ({
                    ...f,
                    id: nanoid(),
                }));

                const newTable = {
                    id: tableId,
                    name: tableData.name,
                    x: startX + (index % 4) * 280,
                    y: currentY + Math.floor(index / 4) * 300,
                    locked: false,
                    fields: fields,
                    comment: tableData.comment || "",
                    indices: [],
                    color: defaultBlue,
                };

                createdTables.push(newTable);
                addTable({ table: newTable });
            });

            // Prepare relationships
            schema.relationships.forEach((rel) => {
                const startTable = createdTables.find(t => t.name === rel.startTable);
                const endTable = createdTables.find(t => t.name === rel.endTable);

                if (startTable && endTable) {
                    const startField = startTable.fields.find(f => f.name === rel.startField);
                    const endField = endTable.fields.find(f => f.name === rel.endField);

                    if (startField && endField) {
                        addRelationship({
                            id: nanoid(),
                            startTableId: startTable.id,
                            startFieldId: startField.id,
                            endTableId: endTable.id,
                            endFieldId: endField.id,
                            name: rel.name,
                            cardinality: rel.cardinality,
                            updateConstraint: rel.updateConstraint,
                            deleteConstraint: rel.deleteConstraint,
                        });
                    }
                }
            });

            Toast.success("Schema generated successfully!");
            setPrompt("");
        } catch (error) {
            Toast.error(`Generation failed: ${error.message}`);
        } finally {
            setLoading(false);
            onClose();
        }
    };

    return (
        <Modal
            title="AI Schema Generation"
            visible={visible}
            onCancel={onClose}
            footer={null}
            style={{ width: 600 }}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                    <label style={{ display: "block", marginBottom: 8 }}>AI Provider</label>
                    <Select
                        value={provider}
                        onChange={setProvider}
                        style={{ width: "100%" }}
                        optionList={Object.values(AI_PROVIDERS).map(p => ({ value: p, label: p }))}
                    />
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: 8 }}>API Key</label>
                    <Input
                        type="password"
                        value={apiKey}
                        onChange={setApiKey}
                        placeholder={`Enter your ${provider} API Key`}
                    />
                    <div style={{ fontSize: 12, color: "gray", marginTop: 4 }}>
                        Your key is only used for this request and not stored.
                    </div>
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: 8 }}>Prompt</label>
                    <TextArea
                        value={prompt}
                        onChange={setPrompt}
                        placeholder="Describe your database schema (e.g., 'A library system with books, authors, and loans')"
                        rows={6}
                    />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        theme="solid"
                        type="primary"
                        onClick={handleGenerateWithRefinedLogic}
                        disabled={loading}
                        icon={loading ? <Spin /> : <IconCpu />}
                    >
                        {loading ? "Generating..." : "Generate"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
