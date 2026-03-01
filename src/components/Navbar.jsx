import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo_light_160.png";
import { SideSheet } from "@douyinfe/semi-ui";
import { IconMenu } from "@douyinfe/semi-icons";
import { socials } from "../data/socials";
import useSettings from "../hooks/useSettings";

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState(false);
  const { settings, setSettings } = useSettings();

  const toggleTheme = () => {
    setSettings({
      ...settings,
      mode: settings.mode === "light" ? "dark" : "light",
    });
  };

  return (
    <>
      <div className="py-4 px-12 sm:px-4 flex justify-between items-center">
        <div className="flex items-center justify-between w-full">
          <Link to="/">
            <img src={logo} alt="logo" className="h-[48px] sm:h-[32px] dark:invert transition-all duration-300" />
          </Link>
          <div className="md:hidden flex gap-12">
            <Link
              className="text-lg font-semibold hover:text-sky-800 dark:hover:text-sky-400 transition-colors duration-300"
              onClick={() =>
                document
                  .getElementById("features")
                  .scrollIntoView({ behavior: "smooth" })
              }
            >
              Features
            </Link>
            <Link
              to="/editor"
              className="text-lg font-semibold hover:text-sky-800 dark:hover:text-sky-400 transition-colors duration-300"
            >
              Editor
            </Link>
            <Link
              to="/templates"
              className="text-lg font-semibold hover:text-sky-800 dark:hover:text-sky-400 transition-colors duration-300"
            >
              Templates
            </Link>
            <Link
              to={socials.docs}
              className="text-lg font-semibold hover:text-sky-800 dark:hover:text-sky-400 transition-colors duration-300"
            >
              Docs
            </Link>
          </div>
          <div className="md:hidden block space-x-3 ms-12">
            <a
              title="Jump to Github"
              className="px-2 py-2 hover:opacity-60 transition-all duration-300 rounded-full text-2xl"
              href={socials.github}
              target="_blank"
              rel="noreferrer"
            >
              <i className="opacity-70 bi bi-github" />
            </a>
            <a
              title="Follow us on X"
              className="px-2 py-2 hover:opacity-60 transition-all duration-300 rounded-full text-2xl"
              href={socials.twitter}
              target="_blank"
              rel="noreferrer"
            >
              <i className="opacity-70 bi bi-twitter-x" />
            </a>
            <a
              title="Join the community on Discord"
              className="px-2 py-2 hover:opacity-60 transition-all duration-300 rounded-full text-2xl"
              href={socials.discord}
              target="_blank"
              rel="noreferrer"
            >
              <i className="opacity-70 bi bi-discord" />
            </a>
            <button
              title={`Switch to ${settings.mode === "light" ? "dark" : "light"} mode`}
              className="px-2 py-2 hover:opacity-60 transition-all duration-300 rounded-full text-2xl"
              onClick={toggleTheme}
            >
              <i className={`opacity-70 bi bi-${settings.mode === "light" ? "moon-stars-fill" : "sun-fill"}`} />
            </button>
          </div>
        </div>
        <button
          onClick={() => setOpenMenu((prev) => !prev)}
          className="hidden md:inline-block h-[24px]"
        >
          <IconMenu size="extra-large" />
        </button>
      </div>
      <hr />
      <SideSheet
        title={
          <img src={logo} alt="logo" className="sm:h-[32px] md:h-[42px]" />
        }
        visible={openMenu}
        onCancel={() => setOpenMenu(false)}
        width={window.innerWidth}
      >
        <Link
          className="hover:bg-zinc-100 dark:hover:bg-zinc-800 block p-3 text-base font-semibold"
          onClick={() => {
            document
              .getElementById("features")
              .scrollIntoView({ behavior: "smooth" });
            setOpenMenu(false);
          }}
        >
          Features
        </Link>
        <hr />
        <Link
          to="/editor"
          className="hover:bg-zinc-100 dark:hover:bg-zinc-800 block p-3 text-base font-semibold"
        >
          Editor
        </Link>
        <hr />
        <Link
          to="/templates"
          className="hover:bg-zinc-100 dark:hover:bg-zinc-800 block p-3 text-base font-semibold"
        >
          Templates
        </Link>
        <hr />
        <Link
          to={socials.docs}
          className="hover:bg-zinc-100 dark:hover:bg-zinc-800 block p-3 text-base font-semibold"
        >
          Docs
        </Link>
        <hr />
        <button
          onClick={() => {
            toggleTheme();
            setOpenMenu(false);
          }}
          className="hover:bg-zinc-100 dark:hover:bg-zinc-800 block p-3 text-base font-semibold w-full text-left"
        >
          <i className={`bi bi-${settings.mode === "light" ? "moon-stars-fill" : "sun-fill"} me-2`} />
          {settings.mode === "light" ? "Dark" : "Light"} Mode
        </button>
      </SideSheet>
    </>
  );
}
