import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Button, Modal, Tag } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { DB, IMPORT_FROM, MODAL } from "../data/constants";
import { databases } from "../data/databases";
import { db } from "../data/db";
import { Slot } from "../context/ExtensionsContext";
import { useSettings } from "../hooks";
import New from "./EditorHeader/Modal/New";

const STEP = {
  DATABASE: 0,
  START: 1,
  TEMPLATE: 2,
};

export default function StartModal({ visible, onStart, onTemplate }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [step, setStep] = useState(STEP.DATABASE);
  const [selectedStart, setSelectedStart] = useState(0);
  const [selectedDb, setSelectedDb] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(-1);
  const templates = useLiveQuery(
    () =>
      db.templates
        .filter((template) => (template.database || DB.GENERIC) === selectedDb)
        .toArray(),
    [selectedDb],
  );

  const startOptions = [
    {
      icon: "bi-plus-square-dotted",
      title: t("start_blank"),
      description: t("start_blank_description"),
    },
    {
      icon: "bi-database-down",
      title: t("import_from_database"),
      description: t("start_database_description"),
      modal: MODAL.IMPORT_DB,
      unsupported: selectedDb === DB.GENERIC && t("not_supported"),
    },
    {
      icon: "bi-filetype-sql",
      title: t("import_from_source"),
      description: t("start_sql_description"),
      modal: MODAL.IMPORT_SRC,
      unsupported: selectedDb === DB.GENERIC && t("not_supported"),
    },
    {
      icon: "bi-code-square",
      title: "DBML",
      description: t("start_dbml_description"),
      modal: MODAL.IMPORT,
      importFrom: IMPORT_FROM.DBML,
    },
    {
      icon: "bi-filetype-json",
      title: "JSON",
      description: t("start_json_description"),
      modal: MODAL.IMPORT,
      importFrom: IMPORT_FROM.JSON,
    },
    ...(templates?.length
      ? [
          {
            icon: "bi-collection",
            title: t("start_template"),
            description: t("start_template_description"),
            template: true,
          },
        ]
      : []),
  ];

  const start = (option) => {
    if (option.template) {
      setSelectedTemplateId(-1);
      setStep(STEP.TEMPLATE);
      return;
    }
    onStart(selectedDb, option);
  };

  const cardClass = (selected) =>
    `p-3 rounded-md border-2 select-none outline-none ${
      settings.mode === "dark"
        ? "bg-zinc-700 enabled:hover:bg-zinc-600"
        : "bg-zinc-100 enabled:hover:bg-zinc-200"
    } ${selected ? "border-blue-400" : "border-transparent"}`;

  return (
    <Modal
      centered
      width={740}
      closable={false}
      title={
        step === STEP.START
          ? t("create_new_diagram")
          : step === STEP.TEMPLATE
            ? t("templates")
            : t("pick_db")
      }
      visible={visible}
      bodyStyle={{ maxHeight: window.innerHeight - 280, overflow: "auto" }}
      footer={
        step === STEP.DATABASE ? (
          <Button
            theme="solid"
            disabled={selectedDb === ""}
            onClick={() => {
              setSelectedStart(0);
              setStep(STEP.START);
            }}
          >
            {t("continue")}
          </Button>
        ) : (
          <>
            <Button
              type="tertiary"
              onClick={() =>
                setStep(step === STEP.TEMPLATE ? STEP.START : STEP.DATABASE)
              }
            >
              {t("back")}
            </Button>
            {step === STEP.TEMPLATE ? (
              <Button
                theme="solid"
                disabled={selectedTemplateId === -1}
                onClick={() => onTemplate(selectedTemplateId)}
              >
                {t("create")}
              </Button>
            ) : (
              <Button
                theme="solid"
                onClick={() => start(startOptions[selectedStart])}
              >
                {startOptions[selectedStart]?.template
                  ? t("next")
                  : t("create")}
              </Button>
            )}
          </>
        )
      }
    >
      {step === STEP.START && (
        <div className="grid grid-cols-3 gap-4 place-content-center">
          {startOptions.map((o, i) => (
            <button
              key={o.title}
              disabled={!!o.unsupported}
              tabIndex={selectedStart === i ? 0 : -1}
              onClick={() => setSelectedStart(i)}
              onFocus={() => setSelectedStart(i)}
              onDoubleClick={() => start(o)}
              onKeyDown={(e) => {
                const move = {
                  ArrowRight: 1,
                  ArrowLeft: -1,
                  ArrowDown: 3,
                  ArrowUp: -3,
                }[e.key];
                if (!move) return;
                e.preventDefault();
                let next = i + move;
                while (startOptions[next]?.unsupported) next += Math.sign(move);
                if (startOptions[next])
                  e.currentTarget.parentElement.children[next].focus();
              }}
              className={`flex flex-col items-start gap-2 text-start disabled:opacity-50 disabled:cursor-not-allowed ${cardClass(selectedStart === i)}`}
            >
              <div className="h-8 w-full flex items-center justify-between">
                <i
                  className={`bi ${o.icon} text-2xl leading-none opacity-60`}
                />
                {o.unsupported && <Tag size="small">{o.unsupported}</Tag>}
              </div>
              <div className="font-semibold">{o.title}</div>
              <div className="text-xs">{o.description}</div>
            </button>
          ))}
          <Slot name="start-options-end" />
        </div>
      )}
      {step === STEP.DATABASE && (
        <div className="grid grid-cols-3 gap-4 place-content-center">
          {Object.values(databases).map((x) => (
            <button
              key={x.name}
              onClick={() => setSelectedDb(x.label)}
              onDoubleClick={() => {
                setSelectedStart(0);
                setStep(STEP.START);
              }}
              className={`text-start space-y-3 ${cardClass(selectedDb === x.label)}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{x.name}</div>
                {x.beta && (
                  <Tag size="small" color="light-blue">
                    Beta
                  </Tag>
                )}
              </div>
              {x.image && (
                <img
                  src={x.image}
                  className="h-8"
                  style={{
                    filter:
                      "opacity(0.4) drop-shadow(0 0 0 white) drop-shadow(0 0 0 white)",
                  }}
                />
              )}
              <div className="text-xs">{x.description}</div>
            </button>
          ))}
        </div>
      )}
      {step === STEP.TEMPLATE && (
        <New
          templates={templates ?? []}
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={setSelectedTemplateId}
        />
      )}
    </Modal>
  );
}
