import { useState, useEffect } from "react";
import { Form, Input, Button, Toast, Divider } from "@douyinfe/semi-ui";
import { useSettings, useDiagram } from "../../../hooks";
import { useTranslation } from "react-i18next";
import { dbToTypes } from "../../../data/datatypes";

export default function Defaults() {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();
  const { database } = useDiagram(); 

  const databaseType = settings.databaseType || 'mysql'; 
  const typeOptions = Object.keys(dbToTypes[database] || {}).map(type => ({ label: type, value: type }));

  const [editingFKNamingTemplate, setEditingFKNamingTemplate] = useState(settings.fkConstraintNaming?.template || "");
  const [editingIndexNamingTemplate, setEditingIndexNamingTemplate] = useState(settings.indexNaming?.template || "");

  useEffect(() => {
    if (settings) {
      if (settings.fkConstraintNaming?.template) {
        setEditingFKNamingTemplate(settings.fkConstraintNaming.template);
      }
      if (settings.indexNaming?.template) {
        setEditingIndexNamingTemplate(settings.indexNaming.template);
      }
    }
  }, [settings]);

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev, [field]: value
    }));
  };

  const handleSaveNamingConventions = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      fkConstraintNaming: {
        ...prevSettings.fkConstraintNaming,
        template: editingFKNamingTemplate,
      },
      indexNaming: {
        ...prevSettings.indexNaming,
        template: editingIndexNamingTemplate,
      },
    }));
    Toast.success(t("naming_conventions_saved_successfully"));
  };

  const previewFKName = (template) => {
    const exampleTable1 = "orders";
    const exampleField1 = "id";
    const exampleTable2 = "customers";
    const exampleField2 = "customer_id";
    let preview = template;
    preview = preview.replace(/{table1}/g, exampleTable1);
    preview = preview.replace(/{field1}/g, exampleField1);
    preview = preview.replace(/{table2}/g, exampleTable2);
    preview = preview.replace(/{field2}/g, exampleField2);
    return preview;
  };

  const previewIndexName = (template) => {
    const exampleTable = "products";
    const exampleIndexType = "unique";
    const exampleFields = "name,code";
    let preview = template;
    preview = preview.replace(/{table}/g, exampleTable);
    preview = preview.replace(/{indexType}/g, exampleIndexType);
    preview = preview.replace(/{fields}/g, exampleFields);
    return preview;
  };

  return (
    <div className="w-[450px] p-4">
      <Form initValues={{
        defaultFieldType: settings.defaultFieldType,
        upperCaseFields: settings.upperCaseFields,
        defaultNotNull: settings.defaultNotNull
      }}>
        <Form.Section text={t("field_defaults")}>
          <Form.Select
            field="defaultFieldType"
            label={t("default_field_type")}
            defaultValue={settings.defaultFieldType}
            onChange={(value) => handleChange('defaultFieldType', value)}
          >
            {Object.keys(dbToTypes[database]).map(type => (
              <Form.Select.Option key={type} value={type}>
                {type}
              </Form.Select.Option>
            ))}
          </Form.Select>

          <Form.Switch
            field="upperCaseFields"
            label={t("uppercase_fields")}
            defaultChecked={settings.upperCaseFields}
            onChange={(checked) => handleChange('upperCaseFields', checked)}
          />

          <Form.Switch
            field="defaultNotNull"
            label={t("default_not_null")}
            defaultChecked={settings.defaultNotNull}
            onChange={(checked) => handleChange('defaultNotNull', checked)}
          />
        </Form.Section>
      </Form>

      <Divider />
      <h3 className="text-lg font-semibold mb-3 mt-4">{t("naming_conventions")}</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">{t("foreign_key")}:</label>
        <Input
          value={editingFKNamingTemplate}
          onChange={(value) => setEditingFKNamingTemplate(value)}
          placeholder="{table1}_{table2}_{field1}_fk"
          title={t("fk_template_info")}
          style={{ width: '100%' }}
        />
        <p className="text-xs text-gray-500 mt-1">
          {t("fk_variables_available")} `&#123;table1&#125;`, `&#123;table2&#125;`, `&#123;field1&#125;`, `&#123;field2&#125;`
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {t("preview")}: {previewFKName(editingFKNamingTemplate)}
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">{t("index_naming")}:</label>
        <Input
          value={editingIndexNamingTemplate}
          onChange={(value) => setEditingIndexNamingTemplate(value)}
          placeholder="{table}_{indexType}_{fields}_idx"
          title={t("index_template_info")}
          style={{ width: '100%' }}
        />
        <p className="text-xs text-gray-500 mt-1">
          {t("index_template_variables_available")} `&#123;table&#125;`, `&#123;indexType&#125;` (e.g., unique), `&#123;fields&#125;` (comma-separated)
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {t("preview")}: {previewIndexName(editingIndexNamingTemplate)}
        </p>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={handleSaveNamingConventions} type="primary">
          {t("save_foreign_key")}
        </Button>
      </div>
    </div>
  );
}
