import { dbToTypes } from "../../data/datatypes";

export function setUpDBML(monaco, database) {
  monaco.languages.register({ id: "dbml" });

  monaco.languages.setMonarchTokensProvider("dbml", {
    defaultToken: "",
    tokenPostfix: ".dbml",
    ignoreCase: true,

    keywords: [
      "table",
      "tablegroup",
      "project",
      "enum",
      "ref",
      "as",
      "indexes",
      "index",
      "note",
      "delete",
      "update",
      "pk",
      "increment",
      "not",
      "null",
      "unique",
      "default",
    ],

    typeKeywords: Object.keys(dbToTypes[database]),

    operators: [
      "=",
      ">",
      "<",
      "!",
      "~",
      "?",
      ":",
      "==",
      "<=",
      ">=",
      "!=",
      "&&",
      "||",
      "++",
      "--",
      "+",
      "-",
      "*",
      "/",
      "&",
      "|",
      "^",
    ],

    symbols: /[=><!~?:&|+\-*/^%]+/,
    escapes:
      /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

    tokenizer: {
      root: [
        [
          /[a-zA-Z_$][\w$]*/,
          {
            cases: {
              "@keywords": "keyword",
              "@typeKeywords": "type",
              "@default": "identifier",
            },
          },
        ],
        { include: "@whitespace" },
        [/[{}()[\]]/, "@brackets"],
        [/[<>](?!@symbols)/, "@brackets"],
        [
          /@symbols/,
          {
            cases: {
              "@operators": "operator",
              "@default": "",
            },
          },
        ],
        [/\d*\.\d+([eE][-+]?\d+)?/, "number.float"],
        [/0[xX][0-9a-fA-F]+/, "number.hex"],
        [/\d+/, "number"],
        [/[;,.]/, "delimiter"],
        [/"([^"\\]|\\.)*$/, "string.invalid"],
        [/'([^'\\]|\\.)*$/, "string.invalid"],
        [/"/, { token: "string.quote", bracket: "@open", next: "@dqstring" }],
        [/'/, { token: "string.quote", bracket: "@open", next: "@sqstring" }],
      ],

      dqstring: [
        [/[^\\"]+/, "string"],
        [/@escapes/, "string.escape"],
        [/\\./, "string.escape.invalid"],
        [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
      ],

      sqstring: [
        [/[^\\']+/, "string"],
        [/@escapes/, "string.escape"],
        [/\\./, "string.escape.invalid"],
        [/'/, { token: "string.quote", bracket: "@close", next: "@pop" }],
      ],

      comment: [
        [/[^\\/*]+/, "comment"],
        [/\/\*/, "comment", "@push"],
        ["\\*/", "comment", "@pop"],
        [/[\\/*]/, "comment"],
      ],

      whitespace: [
        [/[ \t\r\n]+/, "white"],
        [/\/\*/, "comment", "@comment"],
        [/\/\/.*$/, "comment"],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration("dbml", {
    comments: {
      lineComment: "//",
      blockComment: ["/*", "*/"],
    },
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });
}
