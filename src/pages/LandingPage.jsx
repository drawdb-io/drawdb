import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { IconCrossStroked } from "@douyinfe/semi-icons";
import SimpleCanvas from "../components/SimpleCanvas";
import Navbar from "../components/Navbar";
import { diagram } from "../data/heroDiagram";
import { Steps } from "@douyinfe/semi-ui";
import mysql_icon from "../assets/mysql.png";
import postgres_icon from "../assets/postgres.png";
import sqlite_icon from "../assets/sqlite.png";
import mariadb_icon from "../assets/mariadb.png";
import sql_server_icon from "../assets/sql-server.png";
import discord from "../assets/discord.png";
import github from "../assets/github.png";
import FadeIn from "../animations/FadeIn";
import SlideIn from "../animations/SlideIn";

export default function LandingPage() {
  const [showSurvey, setShowSurvey] = useState(true);

  useEffect(() => {
    document.body.setAttribute("theme-mode", "light");
    document.title =
      "drawDB | Online database diagram editor and SQL generator";
  });

  return (
    <div>
      <div className="flex flex-col h-screen">
        {showSurvey && (
          <div className="text-white font-semibold py-1.5 px-4 text-sm text-center bg-gradient-to-r from-slate-700 from-10% via-slate-500 to-slate-700">
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
        <Navbar />
        <div className="flex-1 flex-col relative">
          <div className="h-full md:hidden">
            <SimpleCanvas diagram={diagram} zoom={0.85} />
          </div>
          <div className="hidden md:block h-full bg-dots"></div>
          <div className="absolute left-12 top-[50%] translate-y-[-50%] md:left-[50%] md:translate-x-[-50%] p-8 md:p-3 md:w-full text-zinc-800 text-center">
            <FadeIn duration={0.75}>
              <div className="text-4xl font-bold tracking-wide">
                <h1 className="py-1 bg-gradient-to-r from-slate-700 from-10% via-slate-500 to-slate-700 inline-block text-transparent bg-clip-text">
                  Draw, Copy, and Paste
                </h1>
              </div>
              <div className="text-lg font-semibold mt-3">
                Free, simple, and intuitive database design tool and SQL
                generator.
              </div>
            </FadeIn>
            <div className="mt-4 flex gap-4 justify-center font-semibold">
              <button
                className="bg-white shadow-lg px-9 py-2 rounded border border-zinc-200 hover:bg-zinc-100 transition-all duration-300"
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
                className="bg-slate-700 text-white px-4 py-2 rounded shadow-lg hover:bg-slate-600 transition-all duration-200"
              >
                Try it for yourself
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div id="learn-more">
        <div className="bg-zinc-100 py-20 px-24 md:px-8 rounded-b-[40px]">
          <FadeIn duration={1}>
            <div className="text-2xl text-slate-900 font-bold text-center mb-10 md:hidden">
              Entity-Relationship diagrams simplified
            </div>
            <div className="md:hidden">
              <Steps type="basic" current={3}>
                <Steps.Step
                  title="Create tables"
                  description="Define tables with the necessary fields and indices."
                />
                <Steps.Step
                  title="Add relationships"
                  description="Build relationships by simply dragging"
                />
                <Steps.Step
                  title="Export"
                  description="Export to your preferred SQL flavor"
                />
              </Steps>
            </div>
          </FadeIn>
          <div className="mt-20 text-center w-[75%] sm:w-full mx-auto shadow-sm rounded-lg border p-12 bg-white">
            <div className="text-2xl font-bold text-slate-900 mb-8">
              Why drawDB?
            </div>
            <div className="grid grid-cols-3 gap-4 md:grid-cols-1 h-full">
              <SlideIn delay={0} duration={0.4} className="h-full">
                <div className="h-full border rounded-lg p-6 hover:bg-slate-100 transition-all duration-300">
                  <span className="text-white bg-green-400 rounded-full py-2.5 px-3">
                    <i className="fa-solid fa-credit-card"></i>
                  </span>
                  <div className="mt-6 text-lg font-semibold text-slate-700">
                    Free
                  </div>
                  <div className="text-sm mt-3">
                    drawDB is completely free of charge.
                  </div>
                </div>
              </SlideIn>
              <SlideIn delay={1 * 0.4} duration={0.4} className="h-full">
                <div className="h-full border rounded-lg p-6 hover:bg-slate-100 transition-all duration-300">
                  <span className="text-white bg-blue-400 rounded-full py-2.5 px-3">
                    <i className="fa-solid fa-user-xmark"></i>
                  </span>
                  <div className="mt-6 text-lg font-semibold text-slate-700">
                    No registration
                  </div>
                  <div className="text-sm mt-3">
                    No need to sign up or login. Just jump into development.
                  </div>
                </div>
              </SlideIn>
              <SlideIn delay={2 * 0.4} duration={0.4} className="h-full">
                <div className="h-full border rounded-lg p-6 hover:bg-slate-100 transition-all duration-300">
                  <span className="text-white bg-emerald-400 rounded-full py-2.5 px-3">
                    <i className="fa-regular fa-star "></i>
                  </span>
                  <div className="mt-6 text-lg font-semibold text-slate-700">
                    Simple to use
                  </div>
                  <div className="text-sm mt-3">
                    Intuitive design that&apos;s easy to navigate.
                  </div>
                </div>
              </SlideIn>
            </div>
          </div>
        </div>
      </div>
      <div id="features" className="py-20 px-36 md:px-8">
        <FadeIn duration={1}>
          <div className="text-2xl font-bold text-center">
            Here is what drawDB offers
          </div>
          <div className="text-sm opacity-75 text-center">
            More coming soon...
          </div>
          <div className="grid grid-cols-3 gap-8 mt-10 md:grid-cols-2 sm:grid-cols-1">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-xl hover:bg-zinc-100 border shadow-sm hover:-translate-y-2 transition-all duration-300"
              >
                <div className="bg-sky-700 py-1 rounded-t-xl" />
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
      <div className="bg-zinc-100 py-20 px-32 md:px-8 rounded-t-[40px]">
        <div className="text-center text-2xl font-bold mb-4">
          We support these DBMS
        </div>
        <div className="grid grid-cols-5 place-items-center items-baseline sm:grid-cols-1 sm:gap-4">
          <img
            src={mysql_icon}
            className="opacity-70 hover:opacity-100 transition-all duration-300 h-20"
          />
          <img
            src={postgres_icon}
            className="opacity-70 hover:opacity-100 transition-all duration-300 h-12"
          />
          <img
            src={sqlite_icon}
            className="opacity-70 hover:opacity-100 transition-all duration-300 h-16"
          />
          <img
            src={mariadb_icon}
            className="opacity-70 hover:opacity-100 transition-all duration-300 h-16"
          />
          <img
            src={sql_server_icon}
            className="opacity-70 hover:opacity-100 transition-all duration-300 h-16"
          />
        </div>
        <div className="mt-16 mb-2 text-2xl font-bold text-center">
          Reach out to us
        </div>
        <div className="text-lg text-center mb-4">
          Your feedback is important to us. Share your thoughts and help us
          improve.
        </div>
        <div className="px-36 text-center md:px-8">
          <div className="w-full flex gap-8 sm:block">
            <Link
              to="/survey"
              className="w-full flex items-center gap-2 font-semibold justify-center bg-white shadow-lg px-9 py-2 rounded border border-zinc-200 hover:bg-zinc-100 transition-all duration-300"
            >
              <div>Take a survey</div>
              <i className="bi bi-arrow-right"></i>
            </Link>
            <Link
              to="/bug-report"
              className="sm:mt-2 w-full flex items-center gap-2 font-semibold justify-center bg-white shadow-lg px-9 py-2 rounded border border-zinc-200 hover:bg-zinc-100 transition-all duration-300"
            >
              <div>Report a bug</div>
              <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
          <div className="mt-10">
            Connect with us at
            <a
              href="mailto:drawdb@outlook.com"
              className="text-blue-500 font-semibold hover:underline ms-1.5"
            >
              drawdb@outlook.com
            </a>
          </div>
          <div className="sm:block flex gap-3 justify-center">
            <a
              className="inline-block mt-2"
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
              className="inline-block mt-2"
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
    title: "Import",
    content: (
      <div>
        Already have a diagram? Import a DDL script, or a JSON file to generate
        or a diagram.
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
        schemes and alias types.
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
