import { useEffect, useState } from "react";
import logo_light from "../assets/logo_light_160.png";
import logo_dark from "../assets/logo_dark_160.png";
import { AutoComplete, Button } from "@douyinfe/semi-ui";
import { IconSearch, IconSun, IconMoon } from "@douyinfe/semi-icons";
import { Link } from "react-router-dom";

const shortcuts = [
  { shortcut: "CTRL+S", title: "Save diagram", description: "" },
  { shortcut: "CTRL+Shift+S", title: "Save diagram as", description: "" },
  {
    shortcut: "CTRL+O",
    title: "Open a diagram",
    description: "Load a saved diagram",
  },
  { shortcut: "CTRL+C", title: "Copy selected element", description: "" },
  { shortcut: "CTRL+V", title: "Paste selected element", description: "" },
  { shortcut: "CTRL+X", title: "Cut selected element", description: "" },
  { shortcut: "CTRL+D", title: "Duplicate selected element", description: "" },
  { shortcut: "DEL", title: "Delete selected element", description: "" },
  { shortcut: "CTRL+E", title: "Edit selected element", description: "" },
  {
    shortcut: "CTRL+I",
    title: "Import a diagram",
    description: "Import a diagram by uploadng a valid json or dbb file.",
  },
  { shortcut: "CTRL+Z", title: "Undo" },
  { shortcut: "CTRL+Y", title: "Redo" },
  {
    shortcut: "CTRL+SHIFT+M",
    title: "Enable/disable strict mode",
    description:
      "Disabling strict mode entails that the diagram will not undergo error or inconsistency checks.",
  },
  {
    shortcut: "CTRL+SHIFT+F",
    title: "Enable/disable field summaries",
    description:
      "Disabling field summaries will prevent the display of details for each field in the table when hovered over.",
  },
  { shortcut: "CTRL+SHIFT+G", title: "Show/hide grid" },
  {
    shortcut: "CTRL+ALT+C",
    title: "Copy as image",
    description: "Save the canvas as an image to the clipboard.",
  },
  {
    shortcut: "CTRL+R",
    title: "Reset view",
    description: "Resetting view will set diagram pan to (0, 0).",
  },
  { shortcut: "CTRL+UP / Wheel up", title: "Zoom in" },
  { shortcut: "CTRL+DOWN / Wheel down", title: "Zoom out" },
  { shortcut: "CTRL+H", title: "Open shortcuts" },
];

export default function Shortcuts() {
  const [theme, setTheme] = useState("");
  const [value, setValue] = useState("");
  const [filteredResult, setFilteredResult] = useState(
    shortcuts.map((t) => {
      return t.shortcut;
    })
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      shortcuts
        .filter(
          (i) =>
            i.shortcut.toLowerCase().includes(value.toLowerCase()) ||
            i.title.toLowerCase().includes(value.toLowerCase())
        )
        .map((i) => i.shortcut)
    );
  };

  useEffect(() => {
    setTheme(localStorage.getItem("theme"));
    document.title = "Shortcuts | drawDB";
    document.body.setAttribute("class", "theme");
  }, [setTheme]);

  const changeTheme = () => {
    const body = document.body;
    const t = body.getAttribute("theme-mode");
    if (t === "dark") {
      if (body.hasAttribute("theme-mode")) {
        body.setAttribute("theme-mode", "light");
        setTheme("light");
      }
    } else {
      if (body.hasAttribute("theme-mode")) {
        body.setAttribute("theme-mode", "dark");
        setTheme("dark");
      }
    }
  };

  return (
    <>
      <div className="sm:py-3 py-5 px-20 sm:px-6 flex justify-between items-center">
        <div className="flex items-center justify-start">
          <Link to="/">
            <img
              src={theme === "dark" ? logo_dark : logo_light}
              alt="logo"
              className="me-2 sm:h-[28px] md:h-[46px] h-[48px]"
            />
          </Link>
          <div className="ms-4 sm:text-sm xl:text-lg font-semibold">
            Keyboard shortcuts
          </div>
        </div>
        <div className="flex items-center">
          <Button
            icon={
              theme === "dark" ? (
                <IconSun size="extra-large" />
              ) : (
                <IconMoon size="extra-large" />
              )
            }
            theme="borderless"
            onClick={changeTheme}
          ></Button>
          <div className="ms-2 lg:inline md:inline sm:hidden">
            <AutoComplete
              prefix={<IconSearch />}
              placeholder="Search..."
              data={filteredResult}
              value={value}
              onSearch={(v) => handleStringSearch(v)}
              emptyContent={
                <div className="p-3 popover-theme">No shortcuts found</div>
              }
              onChange={(v) => setValue(v)}
              onSelect={() => {}}
            ></AutoComplete>
          </div>
        </div>
      </div>
      <hr
        className={theme === "dark" ? "border-zinc-700" : "border-zinc-300"}
      />
      <div className="w-full mt-4 mx-auto sm:inline-block hidden text-center">
        <AutoComplete
          prefix={<IconSearch />}
          placeholder="Search..."
          className="w-[80%]"
          data={filteredResult}
          value={value}
          onSearch={(v) => handleStringSearch(v)}
          emptyContent={
            <div className="p-3 popover-theme">No shortcuts found</div>
          }
          onChange={(v) => setValue(v)}
          onSelect={() => {}}
        ></AutoComplete>
      </div>
      <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 my-6 mx-20 sm:mx-6 gap-5 select-none">
        {shortcuts.map((s, i) => (
          <div className="p-3 card-theme rounded" key={i}>
            <div className="flex justify-between sm:text-sm">
              <div className="font-semibold me-2">{s.shortcut}</div>
              <div>{s.title}</div>
            </div>
            {s.description && (
              <>
                <hr
                  className={`${
                    theme === "dark" ? "border-zinc-600" : "border-zinc-400"
                  } my-2`}
                />
                <div className="sm:text-xs text-sm">{s.description}</div>
              </>
            )}
          </div>
        ))}
      </div>
      <hr
        className={`${
          theme === "dark" ? "border-zinc-700" : "border-zinc-300"
        } my-1`}
      />
      <div className="text-center text-sm py-3">
        &copy; 2024 <strong>drawDB</strong> - All right reserved.
      </div>
    </>
  );
}
