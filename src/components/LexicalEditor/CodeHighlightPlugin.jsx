/**
 * See https://codesandbox.io/p/sandbox/vigilant-kate-5tncvy?file=%2Fsrc%2Fplugins%2FCodeHighlightPlugin.js
 */

import { registerCodeHighlighting } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

export default function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);
  return null;
}
