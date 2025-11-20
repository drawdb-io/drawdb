import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo_light_160.png";
import { SideSheet } from "@douyinfe/semi-ui";
import { IconMenu } from "@douyinfe/semi-icons";
import { socials } from "../data/socials";
import { getTheme, toggleTheme, onSystemPrefChange } from "../theme";

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState(false);
  const [isDark, setIsDark] = useState(() => getTheme() === "dark");

  useEffect(() => {
    // Keep local state synced when system preference changes (only when user hasn't chosen a theme)
    const unsubscribe = onSystemPrefChange((prefersDark) => {
      // if there's an explicit stored preference, ignore system changes
      try {
        const stored = window.localStorage && window.localStorage.getItem("drawdb:theme");
        if (!stored) {
          setIsDark(prefersDark);
        }
      } catch (e) {
        // ignore storage errors
      }
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  return (
    <>
      <div className="py-4 px-12 sm:px-4 flex justify-between items-center">
        <div className="flex items-center justify-between w-full">
          <Link to="/">
            <img src={logo} alt="logo" className="h-[48px] sm:h-[32px]" />
          </Link>
          <div className="md:hidden flex gap-12">
            <Link
              className="text-lg font-semibold hover:text-sky-800 transition-colors duration-300"
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
              className="text-lg font-semibold hover:text-sky-800 transition-colors duration-300"
            >
              Editor
            </Link>
            <Link
              to="/templates"
              className="text-lg font-semibold hover:text-sky-800 transition-colors duration-300"
            >
              Templates
            </Link>
            <Link
              to={socials.docs}
              className="text-lg font-semibold hover:text-sky-800 transition-colors duration-300"
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
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const next = toggleTheme();
              setIsDark(next === "dark");
            }}
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark mode"
            className="inline-flex relative items-center justify-center w-10 h-10 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500"
            title="Toggle theme"
          >
            {/* Sun / Moon SVGs — visible depending on state */}
            <svg
              className={`w-5 h-5 transition-opacity duration-200 ${isDark ? "opacity-0" : "opacity-100"}`}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2M5 5l-1.5-1.5M20.5 20.5 19 19M19 5l1.5-1.5M4.5 19.5 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <svg
              className={`w-5 h-5 absolute transition-opacity duration-200 ${isDark ? "opacity-100" : "opacity-0"}`}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            onClick={() => setOpenMenu((prev) => !prev)}
            className="hidden md:inline-block h-[24px]"
            aria-label="Open menu"
          >
            <IconMenu size="extra-large" />
          </button>
        </div>
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
          className="hover:bg-zinc-100 block p-3 text-base font-semibold"
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
          className="hover:bg-zinc-100 block p-3 text-base font-semibold"
        >
          Editor
        </Link>
        <hr />
        <Link
          to="/templates"
          className="hover:bg-zinc-100 block p-3 text-base font-semibold"
        >
          Templates
        </Link>
        <hr />
        <Link
          to={socials.docs}
          className="hover:bg-zinc-100 block p-3 text-base font-semibold"
        >
          Docs
        </Link>
      </SideSheet>
    </>
  );
}
