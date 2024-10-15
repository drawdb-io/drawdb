import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IconCrossStroked } from "@douyinfe/semi-icons";
import SimpleCanvas from "../components/SimpleCanvas";
import Navbar from "../components/Navbar";
import { diagram } from "../data/heroDiagram";
import mysql_icon from "../assets/mysql.png";
import postgres_icon from "../assets/postgres.png";
import sqlite_icon from "../assets/sqlite.png";
import mariadb_icon from "../assets/mariadb.png";
import sql_server_icon from "../assets/sql-server.png";
import discord from "../assets/discord.png";
import github from "../assets/github.png";
import screenshot from "../assets/screenshot.png";
import FadeIn from "../animations/FadeIn";
import axios from "axios";
import { languages } from "../i18n/i18n";
import { Tweet } from "react-tweet";

function shortenNumber(number) {
  if (number < 1000) return number;

  if (number >= 1000 && number < 1_000_000)
    return `${(number / 1000).toFixed(1)}k`;
}

export default function LandingPage() {
  const [showSurvey, setShowSurvey] = useState(true);
  const [stats, setStats] = useState({ stars: 18000, forks: 1200 });

  useEffect(() => {
    const fetchStats = async () => {
      await axios
        .get("https://api.github-star-counter.workers.dev/user/drawdb-io")
        .then((res) => setStats(res.data));
    };

    document.body.setAttribute("theme-mode", "light");
    document.title =
      "drawDB | Online database diagram editor and SQL generator";

    fetchStats();
  }, []);

  return (
    <div>
      <div className="flex flex-col h-screen bg-zinc-100">
        {showSurvey && (
          <div className="text-white font-semibold py-1.5 px-4 text-sm text-center bg-gradient-to-r from-[#12495e] from-10% via-slate-500 to-[#12495e]">
            <Link to="/survey" className="hover:underline">
              Help us improve! Share your feedback.
            </Link>
            <div className="float-right">
              <button onClick={() => setShowSurvey(false)}>
                <IconCrossStroked size="small" />
              </button>
            </div>
          </div>
        )}
        <FadeIn duration={0.6}>
          <Navbar />
        </FadeIn>

        {/* Hero section */}
        <div className="flex-1 flex-col relative mx-4 md:mx-0 mb-4 rounded-3xl bg-white">
          <div className="h-full md:hidden">
            <SimpleCanvas diagram={diagram} zoom={0.85} />
          </div>
          <div className="hidden md:block h-full bg-dots" />
          <div className="absolute left-12 w-[45%] top-[50%] translate-y-[-54%] md:left-[50%] md:translate-x-[-50%] p-8 md:p-3 md:w-full text-zinc-800">
            <FadeIn duration={0.75}>
              <div className="md:px-3">
                <h1 className="text-[42px] md:text-3xl font-bold tracking-wide bg-gradient-to-r from-sky-900 from-10% via-slate-500 to-[#12495e] inline-block text-transparent bg-clip-text">
                  Draw, Copy, and Paste
                </h1>
                <div className="text-lg font-medium mt-1 sliding-vertical">
                  Free and open source, simple, and intuitive database design
                  editor, data-modeler, and SQL generator.{" "}
                  <span className="ms-2 sm:block sm:ms-0 text-slate-500 bg-white font-bold whitespace-nowrap">
                    No sign up
                  </span>
                  <span className="ms-2 sm:block sm:ms-0 text-slate-500 bg-white font-bold whitespace-nowrap">
                    Free of charge
                  </span>
                  <span className="ms-2 sm:block sm:ms-0 text-slate-500 bg-white font-bold whitespace-nowrap">
                    Quick and easy
                  </span>
                </div>
              </div>
            </FadeIn>
            <div className="mt-4 font-semibold md:mt-12">
              <button
                className="py-3 mb-4 xl:mb-0 mr-4 transition-all duration-300 bg-white border rounded-full shadow-lg px-9 border-zinc-200 hover:bg-zinc-100"
                onClick={() =>
                  document
                    .getElementById("learn-more")
                    .scrollIntoView({ behavior: "smooth" })
                }
              >
                Learn more
              </button>
              <Link
                to="/editor"
                className="inline-block py-3 text-white transition-all duration-300 rounded-full shadow-lg bg-sky-900 ps-7 pe-6 hover:bg-sky-800"
              >
                Try it for yourself <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Learn more */}
      <div id="learn-more">
        <div className="bg-zinc-100 py-10 px-28 md:px-8">
          <div className="flex justify-center items-center gap-28 md:block">
            <div className="text-center mb-4">
              <div className="text-5xl md:text-3xl font-bold text-sky-800">
                {shortenNumber(stats.stars)}
              </div>
              <div className="ms-1 mt-1 font-medium tracking-wide">
                GitHub stars
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="text-5xl md:text-3xl font-bold text-sky-800">
                {shortenNumber(stats.forks)}
              </div>
              <div className="ms-1 mt-1 font-medium tracking-wide">
                GitHub forks
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="text-5xl md:text-3xl font-bold text-sky-800">
                {shortenNumber(languages.length)}
              </div>
              <div className="ms-1 mt-1 font-medium tracking-wide">
                Languages
              </div>
            </div>
            <div className="w-96 md:w-full h-full md:text-center">
              <div>
                Join our community, become one of us. Help us become bigger and
                better, support us by donating.
              </div>
              <a
                href="https://buymeacoffee.com/drawdb"
                className="inline-block bg-white hover:bg-zinc-50 transition-all duration-300 rounded-full px-9 py-2.5 shadow mt-2"
              >
                Support us{" "}
                <i className="ms-2 text-rose-600 fa-regular fa-heart"></i>
              </a>
            </div>
          </div>
          <div className="mt-16 w-[75%] text-center sm:w-full mx-auto shadow-sm rounded-2xl border p-6 bg-white space-y-3">
            <div className="text-lg font-medium">
              Build diagrams with a few clicks, see the full picture, export SQL
              scripts, customize your editor, and more.
            </div>
            <img src={screenshot} className="mx-auto" />
          </div>
          <div className="text-lg font-medium text-center mt-12 mb-6">
            Design for your database
          </div>
          <div className="flex justify-center items-center gap-8 md:block">
            {dbs.map((s, i) => (
              <img
                key={"icon-" + i}
                src={s.icon}
                style={{ height: s.height }}
                className="opacity-70 hover:opacity-100 transition-opacity duration-300 md:scale-[0.7] md:mx-auto"
              />
            ))}
          </div>
        </div>
        <svg
          viewBox="0 0 1440 54"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          className="bg-transparent"
        >
          <path
            d="M0 54C0 54 320 0 720 0C1080 0 1440 54 1440 54V0H0V100Z"
            fill="#f4f4f5"
          />
        </svg>
      </div>

      {/* Features */}
      <div id="features" className="py-8 px-36 md:px-8">
        <FadeIn duration={1}>
          <div className="text-base font-medium text-center text-sky-900">
            More than just an editor
          </div>
          <div className="text-2xl mt-1 font-medium text-center">
            What drawDB has to offer
          </div>
          <div className="grid grid-cols-3 gap-8 mt-10 md:grid-cols-2 sm:grid-cols-1">
            {features.map((f, i) => (
              <div
                key={"feature" + i}
                className="flex rounded-xl hover:bg-zinc-100 border border-zinc-100 shadow-sm hover:-translate-y-2 transition-all duration-300"
              >
                <div className="bg-sky-700 px-0.5 rounded-l-xl" />
                <div className="px-8 py-4 ">
                  <div className="text-lg font-semibold mb-3">{f.title}</div>
                  {f.content}
                  <div className="mt-2 text-xs opacity-60">{f.footer}</div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* Tweets */}
      <div className="px-40 mt-6 md:px-8">
        <div className="text-center text-2xl md:text-xl font-medium">
          What the internet says about us
        </div>
        <div
          data-theme="light"
          className="grid grid-cols-2 place-items-center md:grid-cols-1"
        >
          <Tweet id="1816111365125218343" />
          <Tweet id="1817933406337905021" />
          <Tweet id="1785457354777006524" />
          <Tweet id="1776842268042756248" />
        </div>
      </div>

      {/* Contact us */}
      <svg
        viewBox="0 0 1440 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        className="bg-transparent -scale-100"
      >
        <path
          d="M0 48 C0 48 320 0 720 0C1080 0 1440 48 1440 48V0H0V100Z"
          fill="#f4f4f5"
        />
      </svg>
      <div className="bg-zinc-100 py-8 px-32 md:px-8">
        <div className="mt-4 mb-2 text-2xl font-bold text-center">
          Reach out to us
        </div>
        <div className="text-lg text-center mb-4">
          We love hearing from you. Join our community on Discord, GitHub, and
          X.
        </div>
        <div className="px-36 text-center md:px-8">
          <div className="md:block md:space-y-3 flex gap-3 justify-center">
            <a
              className="inline-block"
              href="https://github.com/drawdb-io/drawdb"
              target="_blank"
              rel="noreferrer"
            >
              <div className="bg-zinc-800 hover:opacity-90 transition-all duration-300 flex items-center gap-4 px-14 py-4 rounded-lg">
                <img src={github} className="h-8" />
                <div className="text-lg text-white font-bold">
                  See the source
                </div>
              </div>
            </a>
            <a
              className="inline-block"
              href="https://discord.gg/BrjZgNrmR6"
              target="_blank"
              rel="noreferrer"
            >
              <div className="bg-[#5865f2] hover:opacity-90 transition-all duration-300 flex items-center gap-4 px-8 py-4 rounded-lg">
                <img src={discord} className="h-8" />
                <div className="text-lg text-white font-bold">
                  Join us on Discord
                </div>
              </div>
            </a>
            <a
              className="inline-block"
              href="https://x.com/drawdb_"
              target="_blank"
              rel="noreferrer"
            >
              <div className="text-white bg-zinc-800 hover:opacity-90 transition-all duration-300 flex items-center gap-4 px-12 py-4 rounded-lg">
                <i className="text-2xl bi bi-twitter-x" />
                <div className="text-lg  font-bold">Follow us on X</div>
              </div>
            </a>
          </div>
          <div className="my-8">
            <div>
              If you&apos;re finding drawDB useful and would like to help us in
              improving and adding new features, consider making a donation.
            </div>
            <div>Your support means a lot to us!</div>
            <a
              href="https://buymeacoffee.com/drawdb"
              className="inline-block bg-white hover:bg-zinc-50 transition-all duration-300 rounded-full px-16 py-2.5 shadow mt-2"
            >
              Support us{" "}
              <i className="ms-2 text-rose-600 fa-regular fa-heart"></i>
            </a>
          </div>
        </div>
      </div>

      <div className="bg-red-700 py-1 text-center text-white text-xs font-semibold px-3">
        Attention! The diagrams are saved in your browser. Before clearing the
        browser make sure to back up your data.
      </div>
      <hr className="border-zinc-300" />
      <div className="text-center text-sm py-3">
        &copy; 2024 <strong>drawDB</strong> - All right reserved.
      </div>
    </div>
  );
}

const dbs = [
  { icon: mysql_icon, height: 80 },
  { icon: postgres_icon, height: 48 },
  { icon: sqlite_icon, height: 64 },
  { icon: mariadb_icon, height: 64 },
  { icon: sql_server_icon, height: 64 },
];

const features = [
  {
    title: "Export",
    content: (
      <div>
        Export the DDL script to run on your database or export the diagram as a
        JSON or an image.
      </div>
    ),
    footer: "",
  },
  {
    title: "Reverse engineer",
    content: (
      <div>
        Already have a schema? Import a DDL script to generate a diagram.
      </div>
    ),
    footer: "",
  },
  {
    title: "Customizable workspace",
    content: (
      <div>
        Customize the UI to fit your preferences. Select the components you want
        in your view.
      </div>
    ),
    footer: "",
  },
  {
    title: "Keyboard shortcuts",
    content: (
      <div>
        Speed up development with keyboard shortuts. See all available shortcuts
        <Link to="/shortcuts" className="ms-1.5 text-blue-500 hover:underline">
          here
        </Link>
        .
      </div>
    ),
    footer: "",
  },
  {
    title: "Templates",
    content: (
      <div>
        Start off with pre-built templates. Get a quick start or get inspirition
        for your design.
      </div>
    ),
    footer: "",
  },
  {
    title: "Custom Templates",
    content: (
      <div>
        Have boilerplate structures? Save time by saving them as templates and
        load them when needed.
      </div>
    ),
    footer: "",
  },
  {
    title: "Robust editor",
    content: (
      <div>
        Undo, redo, copy, paste, duplacate and more. Add tables, subject areas,
        and notes.
      </div>
    ),
    footer: "",
  },
  {
    title: "Issue detection",
    content: (
      <div>
        Detect and tackle errors in the diagram to make sure the scripts are
        correct.
      </div>
    ),
    footer: "",
  },
  {
    title: "Relational databases",
    content: (
      <div>
        We support 5 relational databases - MySQL, PostgreSQL, SQLite, MariaDB,
        SQL Server.
      </div>
    ),
    footer: "",
  },
  {
    title: "Object-Relational databases",
    content: (
      <div>
        Add custom types for object-relational databases, or create custom JSON
        schemes.
      </div>
    ),
    footer: "",
  },
  {
    title: "Presentation mode",
    content: (
      <div>
        Present your diagrams on a big screen during team meetings and
        discussions.
      </div>
    ),
    footer: "",
  },
  {
    title: "Track todos",
    content: <div>Keep track of tasks and mark them done when finished.</div>,
    footer: "",
  },
];
