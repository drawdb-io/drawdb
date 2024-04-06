import { useEffect, useState } from "react";
import logo_light from "../assets/logo_light_160.png";
import logo_dark from "../assets/logo_dark_160.png";
import { AutoComplete, Button } from "@douyinfe/semi-ui";
import { IconSearch, IconSun, IconMoon } from "@douyinfe/semi-icons";
import { Link } from "react-router-dom";
import { shortcuts } from "../data/shortcuts";

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
          />
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
