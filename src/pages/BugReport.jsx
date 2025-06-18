import { useEffect, useState, useCallback, useRef } from "react";
import logo_light from "../assets/logo_light_160.png";
import logo_dark from "../assets/logo_dark_160.png";
import { Banner, Button, Input, Upload, Toast, Spin } from "@douyinfe/semi-ui";
import { IconGithubLogo, IconPaperclip } from "@douyinfe/semi-icons";
import RichEditor from "../components/LexicalEditor/RichEditor";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { editorConfig } from "../data/editorConfig";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes } from "@lexical/html";
import { CLEAR_EDITOR_COMMAND } from "lexical";
import { Link } from "react-router-dom";
import { socials } from "../data/socials";
import { send } from "../api/email";
import { useSettings, useThemedPage } from "../hooks";

function Form({ theme }) {
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
        try {
          await send(
            `[BUG REPORT]: ${data.title}`,
            $generateHtmlFromNodes(editor),
            data.attachments,
          );
          Toast.success("Bug reported!");
          editor.dispatchCommand(CLEAR_EDITOR_COMMAND, null);
          resetForm();
        } catch {
          Toast.error("Oops! Something went wrong.");
          setLoading(false);
        }
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
      <RichEditor theme={theme} placeholder="Describe the bug" />
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
        dragMainText="Click to upload the file or drag and drop the file here"
        dragSubText="Upload up to 3 images"
        accept="image/*"
        limit={3}
      />
      <div className="pt-4 flex justify-end items-center">
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
  const {
    settings: { mode: theme },
  } = useSettings();

  useEffect(() => {
    document.title = "Report a bug | drawDB";
    document.body.setAttribute("class", "theme");
  }, []);

  useThemedPage();

  return (
    <>
      <div className="sm:py-3 py-5 px-20 sm:px-6 flex justify-between items-center">
        <div className="flex items-center justify-start">
          <Link to="/">
            <img
              src={theme === "dark" ? logo_dark : logo_light}
              alt="logo"
              className="me-2 sm:h-[28px] h-[42px]"
            />
          </Link>
          <div className="ms-4 sm:text-sm xl:text-lg font-semibold">
            Report a bug
          </div>
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
              <div className="font-bold ms-1">Describe the bug </div>
            </div>
            <div className="text-sm mt-1">
              Please provide a clear and concise description of what the bug is.
            </div>
            <div className="flex items-center mt-3">
              <IconPaperclip />
              <div className="font-bold ms-1">Steps to reproduce the bug </div>
            </div>
            <div className="text-sm mt-1">
              Please provide the steps of how to reproduce the bug.
            </div>
            <div className="flex items-center mt-3">
              <IconPaperclip />
              <div className="font-bold ms-1">Expected behaviour</div>
            </div>
            <div className="text-sm mt-1">
              Tell us what you expected to see vs what you saw.
            </div>
            <div className="flex items-center mt-3">
              <IconPaperclip />
              <div className="font-bold ms-1">Your browser and device</div>
            </div>
            <div className="text-sm mt-1">
              What web browser and device did you encounter the bug on.
            </div>
            <div className="flex items-center mt-3">
              <IconPaperclip />
              <div className="font-bold ms-1">Screenshots</div>
            </div>
            <div className="text-sm mt-1">
              Add any relevant images if possible.
            </div>
            <div className="flex items-center justify-center my-2">
              <hr
                className={`${
                  theme === "dark" ? "border-zinc-700" : "border-zinc-300"
                } grow`}
              />
              <div className="text-sm font-semibold m-2">Alternatively</div>
              <hr
                className={`${
                  theme === "dark" ? "border-zinc-700" : "border-zinc-300"
                } grow`}
              />
            </div>
            <Button
              block
              icon={<IconGithubLogo />}
              style={{ backgroundColor: "#239144", color: "white" }}
              onClick={() => {
                window.open(`${socials.github}/issues`, "_self");
              }}
            >
              Add an issue
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
                We value your feedback! If you&apos;ve encountered a bug or
                issue while using our platform, please help us improve by
                reporting it. Your input is invaluable in making our service
                better.
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
