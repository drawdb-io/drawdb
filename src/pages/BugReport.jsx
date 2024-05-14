import { useEffect, useState, useCallback, useRef } from "react";
import logo_light from "../assets/logo_light_160.png";
import logo_dark from "../assets/logo_dark_160.png";
import { Banner, Button, Input, Upload, Toast, Spin } from "@douyinfe/semi-ui";
import {
  IconSun,
  IconMoon,
  IconGithubLogo,
  IconPaperclip,
} from "@douyinfe/semi-icons";
import RichEditor from "../components/LexicalEditor/RichEditor";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { editorConfig } from "../data/editorConfig";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes } from "@lexical/html";
import { CLEAR_EDITOR_COMMAND } from "lexical";
import axios from "axios";
import { Link } from "react-router-dom";
import {useTranslation} from "react-i18next";

function Form({ theme }) {
  const { t } = useTranslation();
  const [editor] = useLexicalComposerContext();
  const [data, setData] = useState({
    title: "",
    attachments: [],
  });
  const [loading, setLoading] = useState(false);
  const uploadRef = useRef();

  const resetForm = () => {
    setData({
      title: "",
      attachments: [],
    });
    setLoading(false);

    if (uploadRef.current) {
      uploadRef.current.clear();
    }
  };

  const onFileChange = (fileList) => {
    const attachments = [];

    const processFile = (index) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const dataUri = event.target.result;
        attachments.push({ path: dataUri, filename: fileList[index].name });
      };

      reader.readAsDataURL(fileList[index].fileInstance);
    };

    fileList.forEach((_, i) => processFile(i));

    setData((prev) => ({
      ...prev,
      attachments: attachments,
    }));
  };

  const onSubmit = useCallback(() => {
    setLoading(true);
    editor.update(() => {
      const sendMail = async () => {
        await axios
          .post(`${import.meta.env.VITE_BACKEND_URL}/send_email`, {
            subject: `[BUG REPORT]: ${data.title}`,
            message: $generateHtmlFromNodes(editor),
            attachments: data.attachments,
          })
          .then(() => {
            Toast.success(t("Page.ReportBug.Bug reported"));
            editor.dispatchCommand(CLEAR_EDITOR_COMMAND, null);
            resetForm();
          })
          .catch(() => {
            Toast.error(t("Page.ReportBug.Oops! Something went wrong"));
            setLoading(false);
          });
      };
      sendMail();
    });
  }, [editor, data]);

  return (
    <div className="p-5 mt-6 card-theme rounded-md">
      <Input
        placeholder="Title"
        value={data.title}
        onChange={(v) => setData((prev) => ({ ...prev, title: v }))}
      />
      <RichEditor theme={theme} placeholder={"Describe the bug"} />
      <Upload
        action="#"
        ref={uploadRef}
        onChange={(info) => onFileChange(info.fileList)}
        beforeUpload={({ file }) => {
          return {
            autoRemove: false,
            fileInstance: file.fileInstance,
            status: "success",
            shouldUpload: false,
          };
        }}
        draggable={true}
        dragMainText={t("Page.ReportBug.BugUploadFile")}
        dragSubText={t("Page.ReportBug.BugUploadImage")}
        accept="image/*"
        limit={3}
      ></Upload>
      <div className="pt-4 flex justify-between items-center">
        <div className="text-sm opacity-80">
          <i className="fa-brands fa-markdown me-1"></i>Styling with markdown is
          supported
        </div>
        <div className="flex items-center">
          <Button
            onClick={onSubmit}
            style={{ padding: "16px 24px" }}
            disabled={loading || data.title === "" || !data.title}
          >
            Submit
          </Button>
          <div className={loading ? "ms-2" : "hidden"}>
            <Spin />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BugReport() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState("");

  useEffect(() => {
    setTheme(localStorage.getItem("theme"));
    document.title = t("Page.ReportBug.ReportABug") + " | drawDB";
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
            {t("Page.ReportBug.ReportABug")}
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
        </div>
      </div>
      <hr
        className={`${
          theme === "dark" ? "border-zinc-700" : "border-zinc-300"
        } my-1`}
      />
      <div className="grid grid-cols-12 gap-8 my-6 mx-20 sm:mx-6">
        <div className="col-span-4 md:col-span-12 lg:col-span-4">
          <div className="card-theme p-6 rounded-md">
            <div className="flex items-center">
              <IconPaperclip />
              <div className="font-bold ms-1">{t("Page.ReportBug.tips.title", {context: 1})}</div>
            </div>
            <div className="text-sm mt-1">
              {t("Page.ReportBug.tips.subTitle", {context: 1})}
            </div>
            <div className="flex items-center mt-3">
              <IconPaperclip />
              <div className="font-bold ms-1">{t("Page.ReportBug.tips.title", {context: 2})}</div>
            </div>
            <div className="text-sm mt-1">
              {t("Page.ReportBug.tips.subTitle", {context: 2})}
            </div>
            <div className="flex items-center mt-3">
              <IconPaperclip />
              <div className="font-bold ms-1">{t("Page.ReportBug.tips.title", {context: 3})}</div>
            </div>
            <div className="text-sm mt-1">
              {t("Page.ReportBug.tips.subTitle", {context: 3})}
            </div>
            <div className="flex items-center mt-3">
              <IconPaperclip />
              <div className="font-bold ms-1">{t("Page.ReportBug.tips.title", {context: 4})}</div>
            </div>
            <div className="text-sm mt-1">
              {t("Page.ReportBug.tips.subTitle", {context: 4})}
            </div>
            <div className="flex items-center mt-3">
              <IconPaperclip />
              <div className="font-bold ms-1">{t("Page.ReportBug.tips.title", {context: 5})}</div>
            </div>
            <div className="text-sm mt-1">
              {t("Page.ReportBug.tips.subTitle", {context: 5})}
            </div>
            <div className="flex items-center justify-center my-2">
              <hr
                className={`${
                  theme === "dark" ? "border-zinc-700" : "border-zinc-300"
                } flex-grow`}
              />
              <div className="text-sm font-semibold m-2">{t("Page.ReportBug.Alternatively")}</div>
              <hr
                className={`${
                  theme === "dark" ? "border-zinc-700" : "border-zinc-300"
                } flex-grow`}
              />
            </div>
            <Button
              block
              icon={<IconGithubLogo />}
              style={{ backgroundColor: "#239144", color: "white" }}
              onClick={() => {
                window.open(
                  "https://github.com/drawdb-io/drawdb/issues",
                  "_self",
                );
              }}
            >
              {t("Page.ReportBug.Add an issue")}
            </Button>
          </div>
        </div>
        <div className="col-span-8 md:col-span-12 lg:col-span-8">
          <Banner
            fullMode={false}
            type="info"
            icon={null}
            closeIcon={null}
            description={
              <div>
                {t("Page.ReportBug.tip2")}
              </div>
            }
          />
          <LexicalComposer initialConfig={editorConfig}>
            <Form theme={theme} />
          </LexicalComposer>
        </div>
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
