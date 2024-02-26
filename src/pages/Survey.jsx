import { useEffect, useState, useCallback, useMemo } from "react";
import logo_light from "../assets/logo_light_46.png";
import logo_dark from "../assets/logo_dark_46.png";
import {
  Banner,
  Button,
  Toast,
  Spin,
  Slider,
  Radio,
  RadioGroup,
  Select,
  TextArea,
} from "@douyinfe/semi-ui";
import { IconSun, IconMoon } from "@douyinfe/semi-icons";
import RichEditor from "../components/RichEditor";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { editorConfig } from "../data/editor_config";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes } from "@lexical/html";
import { CLEAR_EDITOR_COMMAND } from "lexical";
import axios from "axios";
import { Link } from "react-router-dom";

function SurveyForm({ theme }) {
  const [editor] = useLexicalComposerContext();
  const questions = useMemo(
    () => ({
      satisfaction: "How satisfied are you with drawDB?",
      ease: "How easy was it to get started with drawDB?",
      wouldRecommend: "How likely are you to recommend drawDB?",
      hadDifficulty:
        "Did you encounter any difficulties when navigating drawDB?",
      difficulty: "What were the difficulties you faced?",
      triedOtherApps: "Have you tried apps like drawDB?",
      comparison: "How did you find drawDB as compared to other apps?",
      occupation: "What is your occupation?",
    }),
    []
  );
  const [form, setForm] = useState({
    satisfaction: 5,
    ease: 5,
    wouldRecommend: 5,
    hadDifficulty: "",
    difficulty: "",
    triedOtherApps: "",
    comparison: "",
    occupation: "",
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setForm({
      satisfaction: 5,
      ease: 5,
      wouldRecommend: 5,
      hadDifficulty: "",
      difficulty: "",
      triedOtherApps: "",
      comparison: "",
      occupation: "",
    });
    setLoading(false);
  };

  const onSubmit = useCallback(() => {
    setLoading(true);
    editor.update(() => {
      const sendMail = async () => {
        await axios
          .post(`${import.meta.env.VITE_API_BACKEND_URL}/send_email`, {
            subject: `[SURVEY]: ${new Date().toDateString()}`,
            message: `${Object.keys(form).map(
              (k) => `<div>${questions[k]}</div><div>${form[k]}</div>`
            )}<div>How can we make drawDB a better experience for you?</div>${$generateHtmlFromNodes(
              editor
            )}`,
          })
          .then(() => {
            Toast.success("Thanks for the feedback!");
            editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
            resetForm();
          })
          .catch(() => {
            Toast.error("Oops! Something went wrong.");
            setLoading(false);
          });
      };
      sendMail();
    });
  }, [editor, form, questions]);

  return (
    <div className="py-5 px-8 mt-6 card-theme rounded-md">
      <div className="my-3">
        <div className="font-semibold ms-1 mb-2">{questions.satisfaction}</div>
        <Slider
          field="satisfaction"
          min={0}
          max={10}
          value={form.satisfaction}
          onChange={(v) => {
            setForm((prev) => ({ ...prev, satisfaction: v }));
          }}
        />
        <div className="text-sm flex justify-between opacity-80">
          <div>Not at all</div>
          <div>Extremely</div>
        </div>
      </div>
      <div className="my-3">
        <div className="font-semibold ms-1 mb-2">{questions.ease}</div>
        <Slider
          field="ease"
          min={0}
          max={10}
          value={form.ease}
          onChange={(v) => {
            setForm((prev) => ({ ...prev, ease: v }));
          }}
        />
        <div className="text-sm flex justify-between opacity-80">
          <div>Not at all</div>
          <div>Extremely</div>
        </div>
      </div>
      <div className="my-3">
        <div className="font-semibold ms-1 mb-2">
          {questions.wouldRecommend}
        </div>
        <Slider
          field="ease"
          min={0}
          max={10}
          value={form.wouldRecommend}
          onChange={(v) => {
            setForm((prev) => ({ ...prev, wouldRecommend: v }));
          }}
        />
        <div className="text-sm flex justify-between opacity-80">
          <div>Not at all</div>
          <div>Extremely</div>
        </div>
      </div>
      <div className="my-3">
        <div className="font-semibold ms-1 mb-3">{questions.hadDifficulty}</div>
        <RadioGroup
          direction="vertical"
          value={form.hadDifficulty}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, hadDifficulty: e.target.value }))
          }
        >
          <Radio value={"yes"}>Yes</Radio>
          <Radio value={"no"}>No</Radio>
        </RadioGroup>
      </div>
      {form.hadDifficulty === "yes" && (
        <div className="my-3">
          <div className="font-semibold ms-1 mb-3">{questions.difficulty}</div>
          <TextArea
            rows={2}
            placeholder="Tell us more"
            value={form.difficulty}
            onChange={(v) => setForm((prev) => ({ ...prev, difficulty: v }))}
          />
        </div>
      )}
      <div className="my-3">
        <div className="font-semibold ms-1 mb-3">
          {questions.triedOtherApps}
        </div>
        <RadioGroup
          direction="vertical"
          value={form.triedOtherApps}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, triedOtherApps: e.target.value }))
          }
        >
          <Radio value={"yes"}>Yes</Radio>
          <Radio value={"no"}>No</Radio>
        </RadioGroup>
      </div>
      {form.triedOtherApps === "yes" && (
        <div className="my-3">
          <div className="font-semibold ms-1 mb-3">{questions.comparison}</div>
          <TextArea
            rows={2}
            placeholder="Tell us more"
            value={form.comparison}
            onChange={(v) => setForm((prev) => ({ ...prev, comparison: v }))}
          />
        </div>
      )}
      <div className="my-3">
        <div className="font-semibold ms-1 mb-3">{questions.occupation}</div>
        <Select
          optionList={[
            { value: "Student", label: "Student" },
            { value: "Teacher", label: "Teacher" },
            { value: "Developer", label: "Developer" },
          ]}
          className="w-full"
          placeholder="Occupation"
          value={form.occupation}
          onSelect={(v) => setForm((prev) => ({ ...prev, occupation: v }))}
        />
      </div>
      <div className="ms-1 font-semibold">
        How can we make drawDB a better experience for you?
      </div>
      <RichEditor theme={theme} />
      <div className="flex justify-between items-center">
        <div className="text-sm opacity-80">
          <i className="fa-brands fa-markdown me-1"></i>Styling with markdown is
          supported
        </div>
        <div className="flex items-center">
          <Button
            onClick={onSubmit}
            style={{ padding: "16px 32px" }}
            disabled={loading}
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

export default function Survey() {
  const [theme, setTheme] = useState("");

  useEffect(() => window.scroll(0, 0));

  useEffect(() => {
    const t = localStorage.getItem("theme");
    setTheme(t);
    if (t === "dark") {
      const body = document.body;
      if (body.hasAttribute("theme-mode")) {
        body.setAttribute("theme-mode", "dark");
      }
    } else {
      const body = document.body;
      if (body.hasAttribute("theme-mode")) {
        body.setAttribute("theme-mode", "light");
      }
    }
    document.title = "Share you feedback | drawDB";
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
    <div>
      <div className="sm:py-3 py-5 md:px-8 px-20 flex justify-between items-center">
        <div className="flex items-center justify-start">
          <Link to="/">
            <img
              src={theme === "dark" ? logo_dark : logo_light}
              alt="logo"
              className="me-2 sm:h-[28px] md:h-[46px]"
            />
          </Link>
          <div className="ms-4 sm:text-sm xl:text-lg font-semibold">
            Share your feedback
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
          ></Button>
        </div>
      </div>
      <hr
        className={`${
          theme === "dark" ? "border-zinc-700" : "border-zinc-300"
        } my-1`}
      />
      <div className="md:w-[90%] w-[74%] mx-auto my-8">
        <Banner
          fullMode={false}
          type="info"
          icon={null}
          closeIcon={null}
          description={
            <div>
              Thanks for taking this survey! We highly value your feedback and
              strive to make drawDB fit your needs better.
            </div>
          }
        />
        <LexicalComposer initialConfig={editorConfig}>
          <SurveyForm theme={theme} />
        </LexicalComposer>
      </div>
      <hr
        className={`${
          theme === "dark" ? "border-zinc-700" : "border-zinc-300"
        } my-1`}
      />
      <div className="text-center text-sm py-3">
        &copy; 2024 <strong>drawDB</strong> - All right reserved.
      </div>
    </div>
  );
}
