/**
 * See https://codesandbox.io/p/sandbox/vigilant-kate-5tncvy?file=%2Fsrc%2Fplugins%2FToolbarPlugin.js
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $isParentElementRTL,
  $wrapNodes,
  $isAtNodeEnd,
} from "@lexical/selection";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import { createPortal } from "react-dom";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
} from "@lexical/rich-text";
import {
  $createCodeNode,
  $isCodeNode,
  getDefaultCodeLanguage,
  getCodeLanguages,
} from "@lexical/code";
import { Dropdown } from "@douyinfe/semi-ui";
import "./styles/index.css";

const LowPriority = 1;

const blockTypeToIcon = {
  code: "bi-code-slash",
  h1: "bi-type-h1",
  h2: "bi-type-h2",
  ol: "bi-list-ol",
  paragraph: "bi-text-paragraph",
  quote: "bi-chat-square-quote",
  ul: "bi-list-ul",
};

const blockTypeToBlockName = {
  paragraph: "Paragraph",
  h1: "Large Heading",
  h2: "Small Heading",
  ul: "Bulleted List",
  ol: "Numbered List",
  code: "Code Block",
  quote: "Quote",
};

function Divider() {
  return <div className="divider" />;
}

function positionEditorElement(editor, rect) {
  if (rect === null) {
    editor.style.opacity = "0";
    editor.style.top = "-1000px";
    editor.style.left = "-1000px";
  } else {
    editor.style.opacity = "1";
    editor.style.top = `${rect.top + rect.height + window.pageYOffset + 10}px`;
    editor.style.left = `${
      rect.left + window.pageXOffset - editor.offsetWidth / 2 + rect.width / 2
    }px`;
  }
}

function FloatingLinkEditor({ editor }) {
  const editorRef = useRef(null);
  const inputRef = useRef(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [isEditMode, setEditMode] = useState(false);
  const [lastSelection, setLastSelection] = useState(null);

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent)) {
        setLinkUrl(parent.getURL());
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL());
      } else {
        setLinkUrl("");
      }
    }
    const editorElem = editorRef.current;
    const nativeSelection = window.getSelection();
    const activeElement = document.activeElement;

    if (editorElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    if (
      selection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const domRange = nativeSelection.getRangeAt(0);
      let rect;
      if (nativeSelection.anchorNode === rootElement) {
        let inner = rootElement;
        while (inner.firstElementChild != null) {
          inner = inner.firstElementChild;
        }
        rect = inner.getBoundingClientRect();
      } else {
        rect = domRange.getBoundingClientRect();
      }

      positionEditorElement(editorElem, rect);
      setLastSelection(selection);
    } else if (!activeElement || activeElement.className !== "link-input") {
      positionEditorElement(editorElem, null);
      setLastSelection(null);
      setEditMode(false);
      setLinkUrl("");
    }

    return true;
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateLinkEditor();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor();
          return true;
        },
        LowPriority
      )
    );
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateLinkEditor();
    });
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    if (isEditMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditMode]);

  return (
    <div ref={editorRef} className="link-editor">
      {isEditMode ? (
        <input
          ref={inputRef}
          className="link-input"
          value={linkUrl}
          onChange={(event) => {
            setLinkUrl(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (lastSelection !== null) {
                if (linkUrl !== "") {
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
                }
                setEditMode(false);
              }
            } else if (event.key === "Escape") {
              event.preventDefault();
              setEditMode(false);
            }
          }}
        />
      ) : (
        <>
          <div className="link-input">
            <a href={linkUrl} target="_blank" rel="noopener noreferrer">
              {linkUrl}
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function Select({ onChange, className, options, value }) {
  return (
    <select className={className} onChange={onChange} value={value}>
      <option hidden={true} value="" />
      {options.map((option) => (
        <option className="option" key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function getSelectedNode(selection) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
}

function BlockOptionsDropdownList({ editor, blockType }) {
  const formatParagraph = () => {
    if (blockType !== "paragraph") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatLargeHeading = () => {
    if (blockType !== "h1") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode("h1"));
        }
      });
    }
  };

  const formatSmallHeading = () => {
    if (blockType !== "h2") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode("h2"));
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== "ul") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== "ol") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  };

  const formatQuote = () => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatCode = () => {
    if (blockType !== "code") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createCodeNode());
        }
      });
    }
  };

  return (
    <Dropdown
      trigger="click"
      clickToHide
      render={
        <Dropdown.Menu>
          <Dropdown.Item
            onClick={formatParagraph}
            icon={<i className={`bi ${blockTypeToIcon.paragraph}`} />}
          >
            Paragraph
          </Dropdown.Item>
          <Dropdown.Item
            onClick={formatLargeHeading}
            icon={<i className={`bi ${blockTypeToIcon.h1}`} />}
          >
            Large Heading
          </Dropdown.Item>
          <Dropdown.Item
            onClick={formatSmallHeading}
            icon={<i className={`bi ${blockTypeToIcon.h2}`} />}
          >
            Small Heading
          </Dropdown.Item>
          <Dropdown.Item
            onClick={formatBulletList}
            icon={<i className={`bi ${blockTypeToIcon.ul}`} />}
          >
            Bullet List
          </Dropdown.Item>
          <Dropdown.Item
            onClick={formatNumberedList}
            icon={<i className={`bi ${blockTypeToIcon.ol}`} />}
          >
            Numbered List
          </Dropdown.Item>
          <Dropdown.Item
            onClick={formatQuote}
            icon={<i className={`bi ${blockTypeToIcon.quote}`} />}
          >
            Quote
          </Dropdown.Item>
          <Dropdown.Item
            onClick={formatCode}
            icon={<i className={`bi ${blockTypeToIcon.code}`} />}
          >
            Code Block
          </Dropdown.Item>
        </Dropdown.Menu>
      }
    >
      <button
        className="flex mx-2 justify-center items-center"
        aria-label="Formatting Options"
      >
        <i className={`bi ${blockTypeToIcon[blockType]} me-3`} />
        <span className="me-3 text-sm">{blockTypeToBlockName[blockType]}</span>
        <i className="bi bi-chevron-down" />
      </button>
    </Dropdown>
  );
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState("paragraph");
  const [selectedElementKey, setSelectedElementKey] = useState(null);
  const [codeLanguage, setCodeLanguage] = useState("");
  const [, setIsRTL] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getTag() : element.getTag();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          setBlockType(type);
          if ($isCodeNode(element)) {
            setCodeLanguage(element.getLanguage() || getDefaultCodeLanguage());
          }
        }
      }

      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));
      setIsRTL($isParentElementRTL(selection));

      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  const codeLanguges = useMemo(() => getCodeLanguages(), []);
  const onCodeLanguageSelect = useCallback(
    (e) => {
      editor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) {
            node.setLanguage(e.target.value);
          }
        }
      });
    },
    [editor, selectedElementKey]
  );

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  return (
    <div className="toolbar" ref={toolbarRef}>
      <button
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND)}
        className="toolbar-item spaced"
        aria-label="Undo"
      >
        <i
          className={`bi bi-arrow-counterclockwise ${
            canUndo ? "" : "opacity-30"
          }`}
        />
      </button>
      <button
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND)}
        className="toolbar-item"
        aria-label="Redo"
      >
        <i className={`bi bi-arrow-clockwise ${canRedo ? "" : "opacity-30"}`} />
      </button>
      <Divider />
      <BlockOptionsDropdownList editor={editor} blockType={blockType} />
      <Divider />
      {blockType === "code" ? (
        <div className="flex items-center">
          <Select
            className="toolbar-item code-language"
            onChange={onCodeLanguageSelect}
            options={codeLanguges}
            value={codeLanguage}
          />
          <i className="bi bi-chevron-down" />
        </div>
      ) : (
        <>
          <button
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
            className={"toolbar-item spaced " + (isBold ? "active" : "")}
            aria-label="Format Bold"
          >
            <i className="bi bi-type-bold" />
          </button>
          <button
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
            }
            className={"toolbar-item spaced " + (isItalic ? "active" : "")}
            aria-label="Format Italics"
          >
            <i className="bi bi-type-italic" />
          </button>
          <button
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
            }
            className={"toolbar-item spaced " + (isUnderline ? "active" : "")}
            aria-label="Format Underline"
          >
            <i className="bi bi-type-underline" />
          </button>
          <button
            onClick={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
            }
            className={
              "toolbar-item spaced " + (isStrikethrough ? "active" : "")
            }
            aria-label="Format Strikethrough"
          >
            <i className="bi bi-type-strikethrough" />
          </button>
          <button
            onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
            className={"toolbar-item spaced " + (isCode ? "active" : "")}
            aria-label="Insert Code"
          >
            <i className="bi bi-code-slash" />
          </button>
          <button
            onClick={insertLink}
            className={"toolbar-item spaced " + (isLink ? "active" : "")}
            aria-label="Insert Link"
          >
            <i className="bi bi-link" />
          </button>
          {isLink &&
            createPortal(
              <FloatingLinkEditor editor={editor} />,
              document.body
            )}
          <Divider />
          <button
            onClick={() =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")
            }
            className="toolbar-item spaced"
            aria-label="Left Align"
          >
            <i className="bi bi-text-left" />
          </button>
          <button
            onClick={() =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
            }
            className="toolbar-item spaced"
            aria-label="Center Align"
          >
            <i className="bi bi-text-center" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
            }}
            className="toolbar-item spaced"
            aria-label="Right Align"
          >
            <i className="bi bi-text-right" />
          </button>
          <button
            onClick={() => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
            }}
            className="toolbar-item"
            aria-label="Justify Align"
          >
            <i className="bi bi-justify" />
          </button>
        </>
      )}
    </div>
  );
}
