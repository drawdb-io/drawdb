export const shortcuts = [
  { shortcut: "CTRL+S", title: "Save diagram", description: "" },
  { shortcut: "CTRL+Shift+S", title: "Save diagram as", description: "" },
  {
    shortcut: "CTRL+O",
    title: "Open a diagram",
    description: "Load a saved diagram",
  },
  { shortcut: "CTRL+C", title: "Copy selected element", description: "" },
  { shortcut: "CTRL+V", title: "Paste selected element", description: "" },
  { shortcut: "CTRL+X", title: "Cut selected element", description: "" },
  { shortcut: "CTRL+D", title: "Duplicate selected element", description: "" },
  { shortcut: "DEL", title: "Delete selected element", description: "" },
  { shortcut: "CTRL+E", title: "Edit selected element", description: "" },
  {
    shortcut: "CTRL+I",
    title: "Import a diagram",
    description: "Import a diagram by uploadng a valid json or dbb file.",
  },
  { shortcut: "CTRL+Z", title: "Undo" },
  { shortcut: "CTRL+Y", title: "Redo" },
  {
    shortcut: "CTRL+SHIFT+M",
    title: "Enable/disable strict mode",
    description:
      "Disabling strict mode entails that the diagram will not undergo error or inconsistency checks.",
  },
  {
    shortcut: "CTRL+SHIFT+F",
    title: "Enable/disable field summaries",
    description:
      "Disabling field summaries will prevent the display of details for each field in the table when hovered over.",
  },
  { shortcut: "CTRL+SHIFT+G", title: "Show/hide grid" },
  {
    shortcut: "CTRL+ALT+C",
    title: "Copy as image",
    description: "Save the canvas as an image to the clipboard.",
  },
  {
    shortcut: "CTRL+R",
    title: "Reset view",
    description: "Resetting view will set diagram pan to (0, 0).",
  },
  { shortcut: "CTRL+UP / CTRL+Wheel up", title: "Zoom in" },
  { shortcut: "CTRL+DOWN / CTRL+Wheel down", title: "Zoom out" },
  { shortcut: "Wheel up / Wheel down", title: "Pan Y" },
  { shortcut: "SHIFT+Wheel up / SHIFT+Wheel down", title: "Pan X" },
  { shortcut: "CTRL+H", title: "Open shortcuts" },
];
