import { useTranslation } from "react-i18next";
import { IconSparkles } from "../../../icons";

export default function ImportWithAiButton({ loading, disabled, onClick }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="inline-flex h-8.5 items-center rounded-md bg-[color:rgba(var(--semi-grey-1),1)] text-sm leading-5 font-semibold text-[color:var(--semi-color-text-0)] transition-colors hover:bg-[color:rgba(var(--semi-grey-2),1)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[color:rgba(var(--semi-grey-1),1)]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-sky-900 via-sky-600 to-cyan-400 text-white shadow-md">
        {loading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <IconSparkles size={12} />
        )}
      </span>
      <span className="ps-2 pe-3">{t("import_with_ai")}</span>
    </button>
  );
}
