import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo_light_160.png";
import { SideSheet } from "@douyinfe/semi-ui";
import { IconMenu } from "@douyinfe/semi-icons";
import { socials } from "../data/socials";

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState(false);

  // Top navigation links
  const navLinks = [
    {
      label: "Features",
      onClick: () => {
        const el = document.getElementById("features");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      },
    },
    { label: "Editor", to: "/editor" },
    { label: "Templates", to: "/templates" },
    { label: "Docs", to: socials.docs },
  ];

  // Social links
  const socialLinks = [
    { title: "Jump to Github", href: socials.github, icon: "bi-github" },
    { title: "Follow us on X", href: socials.twitter, icon: "bi-twitter-x" },
    { title: "Join the community on Discord", href: socials.discord, icon: "bi-discord" },
  ];

  return (
    <>
      <div className="py-4 px-12 sm:px-4 flex justify-between items-center">
        <div className="flex items-center justify-between w-full">
          {/* Logo */}
          <Link to="/">
            <img src={logo} alt="logo" className="h-[48px] sm:h-[32px]" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="md:hidden flex gap-12">
            {navLinks.map(({ label, to, onClick }) =>
              to ? (
                <Link
                  key={label}
                  to={to}
                  className="text-lg font-semibold hover:text-sky-800 transition-colors duration-300"
                >
                  {label}
                </Link>
              ) : (
                <button
                  key={label}
                  onClick={onClick}
                  className="text-lg font-semibold hover:text-sky-800 transition-colors duration-300"
                >
                  {label}
                </button>
              )
            )}
          </div>

          {/* Social Icons */}
          <div className="md:hidden block space-x-3 ms-12">
            {socialLinks.map(({ title, href, icon }) => (
              <a
                key={title}
                title={title}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-2 transition-colors duration-300 rounded-full text-2xl hover:text-sky-800"
              >
                <i className={`opacity-90 bi ${icon}`} />
              </a>
            ))}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpenMenu((prev) => !prev)}
          className="hidden md:inline-block h-[24px]"
          aria-label="Open navigation menu"
        >
          <IconMenu size="extra-large" />
        </button>
      </div>

      <hr />

      {/* Mobile Side Sheet */}
      <SideSheet
        title={<img src={logo} alt="logo" className="sm:h-[32px] md:h-[42px]" />}
        visible={openMenu}
        onCancel={() => setOpenMenu(false)}
        width={window.innerWidth}
        role="navigation"
        aria-label="Mobile Navigation Menu"
      >
        {navLinks.map(({ label, to, onClick }) => (
          <div key={label}>
            {to ? (
              <Link
                to={to}
                className="hover:bg-zinc-100 block p-3 text-base font-semibold"
                onClick={() => setOpenMenu(false)}
              >
                {label}
              </Link>
            ) : (
              <button
                className="hover:bg-zinc-100 block w-full text-left p-3 text-base font-semibold"
                onClick={() => {
                  onClick();
                  setOpenMenu(false);
                }}
              >
                {label}
              </button>
            )}
            <hr />
          </div>
        ))}
      </SideSheet>
    </>
  );
}
