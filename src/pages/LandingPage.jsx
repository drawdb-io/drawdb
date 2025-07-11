import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SimpleCanvas from "../components/SimpleCanvas";
import Navbar from "../components/Navbar";
import { diagram } from "../data/heroDiagram";
import mysql_icon from "../assets/mysql.png";
import postgres_icon from "../assets/postgres.png";
import sqlite_icon from "../assets/sqlite.png";
import mariadb_icon from "../assets/mariadb.png";
import oraclesql_icon from "../assets/oraclesql.png";
import sql_server_icon from "../assets/sql-server.png";
import github from "../assets/github.png";
import warp from "../assets/warp.png";
import screenshot from "../assets/screenshot.png";
import FadeIn from "../animations/FadeIn";
import axios from "axios";
import { languages } from "../i18n/i18n";
import { Tweet } from "react-tweet";
import { socials } from "../data/socials";

function shortenNumber(number) {
  if (number < 1000) return number;

  if (number >= 1000 && number < 1_000_000)
    return `${(number / 1000).toFixed(1)}k`;
}

export default function LandingPage() {
  const [stats, setStats] = useState({ stars: 18000, forks: 1200 });

  useEffect(() => {
    const fetchStats = async () => {
      await axios
        .get("https://api.github-star-counter.workers.dev/user/drawdb-io")
        .then((res) => setStats(res.data));
    };

    document.body.setAttribute("theme-mode", "light");
    document.title =
      "drawDB | 在线数据库图表编辑器和 SQL 生成器";

    fetchStats();
  }, []);

  return (
    <div>
      <div className="flex flex-col h-screen bg-zinc-100">
        <div className="text-white font-semibold py-1 text-sm text-center bg-linear-to-r from-[#12495e] from-10% via-slate-500 to-[#12495e]" />

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
                <h1 className="text-[42px] md:text-3xl font-bold tracking-wide bg-linear-to-r from-sky-900 from-10% via-slate-500 to-[#12495e] inline-block text-transparent bg-clip-text">
                  绘制、复制和粘贴
                </h1>
                <div className="text-lg font-medium mt-1 sliding-vertical">
                  免费开源、简单直观的数据库设计编辑器、数据建模器和 SQL 生成器。{" "}
                  <span className="ms-2 sm:block sm:ms-0 text-slate-500 bg-white font-bold whitespace-nowrap">
                    无需注册
                  </span>
                  <span className="ms-2 sm:block sm:ms-0 text-slate-500 bg-white font-bold whitespace-nowrap">
                    完全免费
                  </span>
                  <span className="ms-2 sm:block sm:ms-0 text-slate-500 bg-white font-bold whitespace-nowrap">
                    快速简便
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
                了解更多
              </button>
              <Link
                to="/editor"
                className="inline-block py-3 text-white transition-all duration-300 rounded-full shadow-lg bg-sky-900 ps-7 pe-6 hover:bg-sky-800"
              >
                立即体验 <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Learn more */}
      <div id="learn-more">
        <div className="bg-zinc-100 py-10 px-28 md:px-8">
          {/* Supported by */}
          <div className="text-center mb-16">
            <div className="text-2xl md:text-xl font-bold text-sky-800 mb-8">
              赞助支持
            </div>
            <div>
              <a
                href="https://warp.dev/drawdb"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={warp}
                  alt="warp.dev"
                  width={260}
                  className="m-auto mb-4"
                />
                <div className="font-semibold text-lg md:text-base">
                  下一代AI驱动的全平台智能终端
                </div>
              </a>
            </div>
          </div>
          <div className="mt-16 w-[75%] text-center sm:w-full mx-auto shadow-xs rounded-2xl border p-6 bg-white space-y-3 mb-12">
            <div className="text-lg font-medium">
              几次点击即可构建图表，全局视图，导出 SQL 脚本，自定义编辑器等等。
            </div>
            <img src={screenshot} className="mx-auto" />
          </div>
          <div className="flex justify-center items-center gap-28 md:block">
            <div className="text-center mb-4">
              <div className="text-5xl md:text-3xl font-bold text-sky-800">
                {shortenNumber(stats.stars)}
              </div>
              <div className="ms-1 mt-1 font-medium tracking-wide">
                GitHub 星标
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="text-5xl md:text-3xl font-bold text-sky-800">
                {shortenNumber(stats.forks)}
              </div>
              <div className="ms-1 mt-1 font-medium tracking-wide">
                GitHub 分叉
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="text-5xl md:text-3xl font-bold text-sky-800">
                {shortenNumber(languages.length)}
              </div>
              <div className="ms-1 mt-1 font-medium tracking-wide">
                支持语言
              </div>
            </div>
          </div>
          <div className="text-lg font-medium text-center mt-12 mb-6">
            为您的数据库设计
          </div>
          <div className="grid grid-cols-3 place-items-center sm:grid-cols-1 sm:gap-10">
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
            不仅仅是一个编辑器
          </div>
          <div className="text-2xl mt-1 font-medium text-center">
            drawDB 能为您提供什么
          </div>
          <div className="grid grid-cols-3 gap-8 mt-10 md:grid-cols-2 sm:grid-cols-1">
            {features.map((f, i) => (
              <div
                key={"feature" + i}
                className="flex rounded-xl hover:bg-zinc-100 border border-zinc-100 shadow-xs hover:-translate-y-2 transition-all duration-300"
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
          网友们对我们的评价
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
          联系我们
        </div>
        <div className="text-lg text-center mb-4">
          我们期待听到您的声音。加入我们在 GitHub 和 X 上的社区。
        </div>
        <div className="px-36 text-center md:px-8">
          <div className="md:block md:space-y-3 flex gap-3 justify-center">
            <a
              className="inline-block"
              href={socials.github}
              target="_blank"
              rel="noreferrer"
            >
              <div className="bg-zinc-800 hover:opacity-90 transition-all duration-300 flex items-center gap-4 px-14 py-4 rounded-lg">
                <img src={github} className="h-8" />
                <div className="text-lg text-white font-bold">
                  查看源码
                </div>
              </div>
            </a>
            <a
              className="inline-block"
              href={socials.twitter}
              target="_blank"
              rel="noreferrer"
            >
              <div className="text-white bg-zinc-800 hover:opacity-90 transition-all duration-300 flex items-center gap-4 px-12 py-4 rounded-lg">
                <i className="text-2xl bi bi-twitter-x" />
                <div className="text-lg  font-bold">关注我们的 X</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="bg-red-700 py-1 text-center text-white text-xs font-semibold px-3">
        注意！图表保存在您的浏览器中。在清除浏览器数据之前，请务必备份您的数据。
      </div>
      <hr className="border-zinc-300" />
      <div className="text-center text-sm py-3">
        &copy; 2025 <strong>嘉诚信息</strong> - All rights reserved.
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
  { icon: oraclesql_icon, height: 172 },
];

const features = [
  {
    title: "导出",
    content: (
      <div>
        导出 DDL 脚本在您的数据库中运行，或将图表导出为 JSON 或图像格式。
      </div>
    ),
    footer: "",
  },
  {
    title: "逆向工程",
    content: (
      <div>
        已有数据库架构？导入 DDL 脚本即可生成图表。
      </div>
    ),
    footer: "",
  },
  {
    title: "可定制工作区",
    content: (
      <div>
        自定义 UI 以符合您的偏好。选择您想要在视图中显示的组件。
      </div>
    ),
    footer: "",
  },
  {
    title: "键盘快捷键",
    content: (
      <div>
        使用键盘快捷键加速开发。查看所有可用的快捷键
        <Link
          to={`${socials.docs}/shortcuts`}
          className="ms-1.5 text-blue-500 hover:underline"
        >
          点击这里
        </Link>
        。
      </div>
    ),
    footer: "",
  },
  {
    title: "模板",
    content: (
      <div>
        从预构建的模板开始。快速开始或为您的设计获取灵感。
      </div>
    ),
    footer: "",
  },
  {
    title: "自定义模板",
    content: (
      <div>
        有常用的结构？将它们保存为模板以节省时间，需要时即可加载。
      </div>
    ),
    footer: "",
  },
  {
    title: "强大的编辑器",
    content: (
      <div>
        撤销、重做、复制、粘贴、复制等功能。添加表格、主题区域和注释。
      </div>
    ),
    footer: "",
  },
  {
    title: "问题检测",
    content: (
      <div>
        检测并解决图表中的错误，确保脚本正确无误。
      </div>
    ),
    footer: "",
  },
  {
    title: "关系数据库",
    content: (
      <div>
        我们支持 5 种关系数据库 - MySQL、PostgreSQL、SQLite、MariaDB、SQL Server。
      </div>
    ),
    footer: "",
  },
  {
    title: "对象关系数据库",
    content: (
      <div>
        为对象关系数据库添加自定义类型，或创建自定义 JSON 架构。
      </div>
    ),
    footer: "",
  },
  {
    title: "演示模式",
    content: (
      <div>
        在团队会议和讨论中在大屏幕上展示您的图表。
      </div>
    ),
    footer: "",
  },
  {
    title: "任务跟踪",
    content: <div>跟踪任务并在完成时标记为已完成。</div>,
    footer: "",
  },
];
