import { useState, useEffect } from "react";
import { Button, Popover, Toast, Select, Checkbox, InputNumber, Input, Divider } from "@douyinfe/semi-ui"; // Añade Divider
import { IconEdit } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import useSettings from "../../hooks/useSettings";
import { dbToTypes } from "../../data/datatypes";


export default function ButtonWithPopover() {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();

  const databaseType = settings.databaseType || 'mysql';
  const typeOptions = Object.keys(dbToTypes[databaseType] || {}).map(type => ({ label: type, value: type }));

  const [editingFieldDefaults, setEditingFieldDefaults] = useState({
    type: "VARCHAR",
    size: null,
    default: null,
    notNull: false,
    primary: false,
    unique: false,
    increment: false,
    comment: "",
    foreignK: false, // Aunque este default no afecta directamente la creación, es buena práctica mantenerlo
  });

  const [editingFKNamingTemplate, setEditingFKNamingTemplate] = useState(settings.fkConstraintNaming.template);
  const [editingIndexNamingTemplate, setEditingIndexNamingTemplate] = useState(settings.indexNaming.template);

  useEffect(() => {
    // Es crucial que estos estados locales se inicialicen solo una vez o cuando settings cambien realmente.
    // El efecto con dependencias a `settings?.defaultNewTableFieldProps`, `settings?.fkConstraintNaming?.template`, etc.
    // ya maneja esto. Asegúrate de que `settings` no sea `null` o `undefined` al inicio.
    if (settings) { // Asegúrate de que settings esté cargado
        if (settings.defaultNewTableFieldProps) {
            setEditingFieldDefaults(settings.defaultNewTableFieldProps);
        }
        if (settings.fkConstraintNaming?.template) {
            setEditingFKNamingTemplate(settings.fkConstraintNaming.template);
        }
        if (settings.indexNaming?.template) {
            setEditingIndexNamingTemplate(settings.indexNaming.template);
        }
    }
  }, [settings]); // Dependencia solo de settings, y dentro del efecto se accede a sus propiedades

  const handleClose = () => setVisible(false);

  const handleSaveDefaults = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      defaultNewTableFieldProps: editingFieldDefaults,
      fkConstraintNaming: {
        ...prevSettings.fkConstraintNaming,
        template: editingFKNamingTemplate,
      },
      indexNaming: {
        ...prevSettings.indexNaming,
        template: editingIndexNamingTemplate,
      },
    }));
    Toast.success(t("defaults_set_successfully"));
    handleClose();
  };

  // Función para previsualizar el nombre de la FK
  const previewFKName = (template) => {
    // Usar nombres de ejemplo para la previsualización
    const exampleTable1 = "orders";
    const exampleField1 = "id";
    const exampleTable2 = "customers";
    const exampleField2 = "customer_id"; // Podría ser útil para {field2}
    let preview = template;
    preview = preview.replace(/{table1}/g, exampleTable1);
    preview = preview.replace(/{field1}/g, exampleField1);
    preview = preview.replace(/{table2}/g, exampleTable2);
    preview = preview.replace(/{field2}/g, exampleField2); // Asegúrate de que field2 también se maneje si lo usas
    return preview;
  };

  // Función para previsualizar el nombre del índice
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

  const popoverContent = (
    <div className="w-[450px] p-4">
      <h3 className="text-lg font-semibold mb-3">{t("set_new_field_defaults")}</h3>

      {/* Sección de Defaults de Campos */}
      {/* ... (tu código existente para defaults de campos) ... */}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">{t("field_type")}:</label>
        <Select
          value={editingFieldDefaults.type}
          onChange={(value) => setEditingFieldDefaults(prev => ({ ...prev, type: value }))}
          placeholder={t("select_type")}
          style={{ width: '100%' }}
          optionList={typeOptions}
        />
      </div>

      {dbToTypes[databaseType]?.[editingFieldDefaults.type]?.isSized && (
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">{t("size")}:</label>
          <InputNumber
            value={editingFieldDefaults.size}
            onChange={(value) => setEditingFieldDefaults(prev => ({ ...prev, size: value }))}
            placeholder={t("size")}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {!dbToTypes[databaseType]?.[editingFieldDefaults.type]?.noDefault && (
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">{t("default_value")}:</label>
          <Input
            value={editingFieldDefaults.default || ''}
            onChange={(value) => setEditingFieldDefaults(prev => ({ ...prev, default: value }))}
            placeholder={t("default_value")}
            style={{ width: '100%' }}
          />
        </div>
      )}

      <div className="mb-3 flex flex-col gap-2">
        <Checkbox
          checked={editingFieldDefaults.notNull}
          onChange={(e) => setEditingFieldDefaults(prev => ({ ...prev, notNull: e.target.checked }))}
        >
          {t("not_null")}
        </Checkbox>
        <Checkbox
          checked={editingFieldDefaults.primary}
          onChange={(e) => setEditingFieldDefaults(prev => ({ ...prev, primary: e.target.checked }))}
        >
          {t("primary_key")}
        </Checkbox>
        <Checkbox
          checked={editingFieldDefaults.unique}
          onChange={(e) => setEditingFieldDefaults(prev => ({ ...prev, unique: e.target.checked }))}
        >
          {t("unique")}
        </Checkbox>
        <Checkbox
          checked={editingFieldDefaults.increment}
          onChange={(e) => setEditingFieldDefaults(prev => ({ ...prev, increment: e.target.checked }))}
        >
          {t("auto_increment")}
        </Checkbox>
      </div>

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
        <Button onClick={handleSaveDefaults} type="primary">
          {t("save_defaults")}
        </Button>
        <Button onClick={handleClose} type="tertiary">
          {t("cancel")}
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      position="bottomRight"
      visible={visible}
      onVisibleChange={setVisible}
      showArrow
      trigger="click"
    >
      <Button icon={<IconEdit />} onClick={() => setVisible(true)}>
        {t("defaults")}
      </Button>
    </Popover>
  );
}