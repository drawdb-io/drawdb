import { useSettings } from "../../../hooks";
import { languages } from "../../../i18n/i18n";

export default function Language({ language, setLanguage }) {
  const { settings } = useSettings();
  const isDarkMode = settings.mode === "dark";

  return (
    <div className="grid grid-cols-4 md:grid-cols-2 gap-4">
      {languages.map((l) => (
        <button
          key={l.code}
          onClick={() => setLanguage(l.code)}
          className={`space-y-1 py-3 px-4 rounded-md border-2 ${
            isDarkMode
              ? "bg-zinc-700 hover:bg-zinc-600"
              : "bg-zinc-100 hover:bg-zinc-200"
          } ${language === l.code ? "border-zinc-400" : "border-transparent"}`}
        >
          <div className="flex justify-between items-center">
            <div className="font-semibold">{l.native_name}</div>
            <div className="opacity-60">{l.code}</div>
          </div>
          <div className="text-start">{l.name}</div>
        </button>
      ))}
    </div>
  );
}
