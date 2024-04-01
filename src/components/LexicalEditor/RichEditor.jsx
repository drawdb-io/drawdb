import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import ToolbarPlugin from "./ToolbarPlugin";
import ListMaxIndentLevelPlugin from "./ListMaxIndentLevelPlugin";
import CodeHighlightPlugin from "./CodeHighlightPlugin";
import AutoLinkPlugin from "./AutoLinkPlugin";
import "./styles/index.css";

function Placeholder({ text }) {
  return <div className="editor-placeholder">{text || ""}</div>;
}

export default function RichEditor({ theme, placeholder }) {
  return (
    <div className="editor-container">
      <ToolbarPlugin theme={theme} />
      <div className="editor-inner">
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" />}
          placeholder={<Placeholder text={placeholder} />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <AutoFocusPlugin />
        <CodeHighlightPlugin />
        <ListPlugin />
        <LinkPlugin />
        <AutoLinkPlugin />
        <ListMaxIndentLevelPlugin maxDepth={7} />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <ClearEditorPlugin />
      </div>
    </div>
  );
}
