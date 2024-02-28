import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import logo_light from "../assets/logo_light_160.png";
import logo_dark from "../assets/logo_dark_160.png";

const Page = {
  MY_FILES: 0,
  SHARED: 1,
  TEMPLATES: 2,
  TODOS: 3,
  SETTINGS: 4,
};

export default function Dashboard() {
  const [cookies] = useCookies(["username"]);
  const [theme, setTheme] = useState("");
  const [currentPage, setCurrentPage] = useState(Page.MY_FILES);

  const buttons = [
    {
      icon: "fa-regular fa-folder-closed",
      label: "My files",
      onClick: () => setCurrentPage(Page.MY_FILES),
    },
    {
      icon: "fa-solid fa-share-from-square",
      label: "Shared",
      onClick: () => setCurrentPage(Page.SHARED),
    },
    {
      icon: "fa-solid fa-book",
      label: "Templates",
      onClick: () => setCurrentPage(Page.TEMPLATES),
    },
    {
      icon: "fa-solid fa-list",
      label: "My to-dos",
      onClick: () => setCurrentPage(Page.TODOS),
    },
    {
      icon: "fa-solid fa-diagram-project",
      label: "Editor",
      onClick: () => window.open("/editor"),
    },
    {
      icon: "bi bi-gear",
      label: "Settings",
      onClick: () => setCurrentPage(Page.SETTINGS),
    },
  ];

  const pages = [
    <div key={0}>My files</div>,
    <div key={0}>Shared</div>,
    <div key={0}>Templates</div>,
    <div key={0}>Todos</div>,
    <div key={0}>Settings</div>,
  ];

  useEffect(() => {
    const t = localStorage.getItem("theme");
    setTheme(t);
    if (t) document.body.setAttribute("theme-mode", t);
    document.title = cookies.username + "'s Dashboard | drawDB";
    document.body.setAttribute("class", "theme");
  }, [setTheme, cookies]);

  return (
    <div className="grid grid-cols-10">
      <div className="h-screen overflow-hidden border-r border-zinc-800 col-span-2 py-8 px-8">
        <img
          src={theme === "dark" ? logo_dark : logo_light}
          alt="logo"
          className="w-[70%]"
        />
        <div className="font-semibold my-6 tracking-wide ">
          {buttons.map((b, i) => (
            <button
              key={i}
              onClick={b.onClick}
              className="flex items-center w-full hover:bg-zinc-800 p-2 py-2.5 rounded-md cursor-pointer opacity-70 hover:opacity-100"
            >
              <i className={`${b.icon} me-5`}></i>
              <div>{b.label}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-8 py-8 px-24">{pages[currentPage]}</div>
    </div>
  );
}
