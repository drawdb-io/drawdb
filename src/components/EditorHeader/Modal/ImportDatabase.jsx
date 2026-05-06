import { Checkbox, Banner, Switch } from "@douyinfe/semi-ui";
import { STATUS } from "../../../data/constants";
import { useTranslation } from "react-i18next";

export default function ImportDatabase({
  connectionParams,
  setConnectionParams,
  error,
  setError,
  dbLoading,
}) {
  const { t } = useTranslation();

  const update = (key, value) => {
    setConnectionParams((prev) => ({ ...prev, [key]: value }));
    if (error.type === STATUS.ERROR) {
      setError({ type: STATUS.NONE, message: "" });
    }
  };

  const noBackend = !import.meta.env.VITE_BACKEND_URL;

  return (
    <div>
      {noBackend && (
        <Banner
          type="warning"
          fullMode={false}
          description={t("no_backend")}
          className="mb-4"
        />
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("host")}</label>
          <input
            className="w-full border rounded px-3 py-1.5 text-sm dark:bg-zinc-800 dark:border-zinc-600"
            placeholder="localhost"
            value={connectionParams.host}
            onChange={(e) => update("host", e.target.value)}
            disabled={dbLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("port")}</label>
          <input
            className="w-full border rounded px-3 py-1.5 text-sm dark:bg-zinc-800 dark:border-zinc-600"
            placeholder="5432"
            value={connectionParams.port}
            onChange={(e) => update("port", e.target.value)}
            disabled={dbLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("database_name")}
          </label>
          <input
            className="w-full border rounded px-3 py-1.5 text-sm dark:bg-zinc-800 dark:border-zinc-600"
            placeholder="mydb"
            value={connectionParams.database}
            onChange={(e) => update("database", e.target.value)}
            disabled={dbLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("schema")}
          </label>
          <input
            className="w-full border rounded px-3 py-1.5 text-sm dark:bg-zinc-800 dark:border-zinc-600"
            placeholder="public"
            value={connectionParams.schema}
            onChange={(e) => update("schema", e.target.value)}
            disabled={dbLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("username")}
          </label>
          <input
            className="w-full border rounded px-3 py-1.5 text-sm dark:bg-zinc-800 dark:border-zinc-600"
            placeholder="postgres"
            value={connectionParams.user}
            onChange={(e) => update("user", e.target.value)}
            disabled={dbLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("password")}
          </label>
          <input
            type="password"
            className="w-full border rounded px-3 py-1.5 text-sm dark:bg-zinc-800 dark:border-zinc-600"
            placeholder="••••••••"
            value={connectionParams.password}
            onChange={(e) => update("password", e.target.value)}
            disabled={dbLoading}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <Switch
          checked={connectionParams.ssl}
          onChange={(v) => update("ssl", v)}
          disabled={dbLoading}
        />
        <span className="text-sm">SSL</span>
      </div>

      <div className="mt-4">
        <Checkbox
          checked={connectionParams.overwrite}
          onChange={(e) => update("overwrite", e.target.checked)}
          disabled={dbLoading}
        >
          {t("overwrite_existing_diagram")}
        </Checkbox>
      </div>

      <div className="mt-2">
        {error.type === STATUS.ERROR && (
          <Banner
            type="danger"
            fullMode={false}
            description={<div>{error.message}</div>}
          />
        )}
        {error.type === STATUS.OK && (
          <Banner
            type="info"
            fullMode={false}
            description={<div>{error.message}</div>}
          />
        )}
      </div>
    </div>
  );
}
