import { useTranslation } from "react-i18next";

export default function Shortcuts() {
    const { t } = useTranslation();

    const shortcuts = [
        { action: "Open", key: "Ctrl + O" },
        { action: "Save", key: "Ctrl + S" },
        { action: "Save As", key: "Ctrl + Shift + S" },
        { action: "Undo", key: "Ctrl + Z" },
        { action: "Redo", key: "Ctrl + Y" },
        { action: "Edit", key: "Ctrl + E" },
        { action: "Cut", key: "Ctrl + X" },
        { action: "Copy", key: "Ctrl + C" },
        { action: "Paste", key: "Ctrl + V" },
        { action: "Duplicate", key: "Ctrl + D" },
        { action: "Delete", key: "Del" },
        { action: "Copy as Image", key: "Ctrl + Alt + C" },
        { action: "DBML View", key: "Alt + E" },
        { action: "Strict Mode", key: "Ctrl + Shift + M" },
        { action: "Field Details", key: "Ctrl + Shift + F" },
        { action: "Reset View", key: "Enter" },
        { action: "Show Grid", key: "Ctrl + Shift + G" },
        { action: "Zoom In", key: "Ctrl + Up" },
        { action: "Zoom Out", key: "Ctrl + Down" },
        { action: "Docs", key: "Ctrl + H" },
    ];

    return (
        <div className="grid grid-cols-2 gap-4">
            {shortcuts.map((s, i) => (
                <div
                    key={i}
                    className="flex justify-between items-center border-b border-zinc-200 py-2"
                >
                    <div className="font-medium text-zinc-700">{s.action}</div>
                    <div className="bg-zinc-100 px-2 py-1 rounded text-sm font-mono text-zinc-600">
                        {s.key}
                    </div>
                </div>
            ))}
        </div>
    );
}
