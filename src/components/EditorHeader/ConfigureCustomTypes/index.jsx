import { Button, Modal, Select, Toast } from "@douyinfe/semi-ui";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Empty from "../../EditorSidePanel/Empty";
import TypeRow from "./components/TypeRow";
import { DB } from "../../../data/constants";
import { databases } from "../../../data/databases";
import {
  getCustomTypes,
  saveCustomTypes,
  resolveType,
} from "../../../utils/customTypes";
import { useDiagram } from "../../../hooks";

const dbFilterOptions = [
  { label: "All", value: "" },
  ...Object.values(DB)
    .filter((value) => value !== DB.GENERIC)
    .map((value) => ({
      label: databases[value].name,
      value,
    })),
];

function storedToArray(stored) {
  const arr = [];
  for (const [db, types] of Object.entries(stored)) {
    for (const [name, entry] of Object.entries(types)) {
      arr.push({
        type: name,
        color: entry.color,
        database: db,
        _originalName: name,
      });
    }
  }
  return arr;
}

function arrayToStored(arr) {
  const result = {};
  for (const item of arr) {
    const db = item.database;
    const name = item.type.toUpperCase();
    if (!result[db]) result[db] = {};
    result[db][name] = { type: name, color: item.color };
  }
  return result;
}

export default function ConfigureCustomTypes({ open, onClose }) {
  const { t } = useTranslation();
  const { setTables, database } = useDiagram();
  const [customTypes, setCustomTypes] = useState([]);
  const [filterDb, setFilterDb] = useState("");
  const savedTypesRef = useRef([]);

  const addType = () => {
    setCustomTypes((prev) => [
      {
        type: "",
        color: "#ccc",
        database: filterDb || database || DB.MYSQL,
      },
      ...prev,
    ]);
  };

  const handleChange = (index, field, value) => {
    setCustomTypes((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const handleDelete = (index) => {
    setCustomTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const invalid = customTypes.find((ct) => !ct.type.trim());
    if (invalid) {
      Toast.warning(t("type_name_required"));
      return;
    }

    const renames = [];
    for (const ct of customTypes) {
      if (ct._originalName && ct._originalName !== ct.type.toUpperCase()) {
        renames.push({
          oldName: ct._originalName,
          newName: ct.type.toUpperCase(),
        });
      }
    }

    const newStored = arrayToStored(customTypes);
    const oldStored = getCustomTypes();
    const deleted = new Set();
    for (const [db, types] of Object.entries(oldStored)) {
      for (const name of Object.keys(types)) {
        const wasRenamed = renames.some((r) => r.oldName === name);
        if (!wasRenamed && (!newStored[db] || !newStored[db][name])) {
          deleted.add(name);
        }
      }
    }

    saveCustomTypes(newStored);

    setTables((prev) =>
      prev.map((table) => ({
        ...table,
        fields: table.fields.map((field) => {
          const upper = field.type.toUpperCase();
          const rename = renames.find((r) => r.oldName === upper);
          if (rename) return { ...field, type: rename.newName };
          if (deleted.has(upper)) {
            const fallback = resolveType(database, upper);
            return { ...field, type: fallback.type };
          }
          return { ...field };
        }),
      })),
    );

    Toast.success(t("saved"));
    onClose();
  };

  const handleClose = () => {
    setCustomTypes([]);
    setFilterDb("");
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const loaded = storedToArray(getCustomTypes());
    setCustomTypes(loaded);
    savedTypesRef.current = loaded;
  }, [open]);

  const filteredTypes = filterDb
    ? customTypes
        .map((ct, i) => ({ ...ct, _index: i }))
        .filter((ct) => ct.database === filterDb)
    : customTypes.map((ct, i) => ({ ...ct, _index: i }));

  return (
    <Modal
      title={t("configure_custom_types")}
      centered
      size="medium"
      visible={open}
      onCancel={handleClose}
      footer={
        <div
          className={`flex items-center ${customTypes.length === 0 ? "justify-end" : "justify-between"}`}
        >
          {customTypes.length > 0 && (
            <Button onClick={addType} className="m-0!">
              {t("add_custom_type")}
            </Button>
          )}
          <div>
            <Button onClick={handleClose} type="tertiary">
              {t("close")}
            </Button>
            <Button theme="solid" onClick={handleSave}>
              {t("save")}
            </Button>
          </div>
        </div>
      }
    >
      <p className="opacity-80 mb-5">{t("custom_types_description")}</p>

      {customTypes.length > 0 && (
        <div className="mb-3">
          <Select
            value={filterDb}
            optionList={dbFilterOptions}
            onChange={setFilterDb}
            prefix={t("database") + ":"}
            className="w-48"
          />
        </div>
      )}

      {filteredTypes.length > 0 && (
        <div className="max-h-96 overflow-y-auto">
          <table className="configure-custom-types-table w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[var(--semi-color-text-2)]">
                <th className="font-medium align-bottom">{t("name")}</th>
                <th className="font-medium align-bottom whitespace-nowrap">
                  {t("type_color")}
                </th>
                <th
                  className="font-medium align-bottom"
                  aria-label={t("database")}
                >
                  {t("database")}
                </th>
                <th aria-label={t("delete")} />
              </tr>
            </thead>
            <tbody>
              {filteredTypes.map((type) => (
                <TypeRow
                  key={type._index}
                  type={type}
                  index={type._index}
                  onChange={handleChange}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {customTypes.length === 0 && (
        <div className="text-center">
          <Empty />
          <div className="text-md font-semibold">{t("no_custom_types")}</div>
          <Button theme="solid" className="mt-5" onClick={addType}>
            {t("add_custom_type")}
          </Button>
        </div>
      )}

      {customTypes.length > 0 && filteredTypes.length === 0 && (
        <div className="text-center py-8 opacity-60">
          {t("no_custom_types")}
        </div>
      )}
    </Modal>
  );
}
