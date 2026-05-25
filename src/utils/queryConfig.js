export const queryConfig = {
  theme: {
    key: "theme",
    label: "theme",
    options: [
      { label: "default", value: null },
      { label: "light", value: "light" },
      { label: "dark", value: "dark" },
    ],
    isValid: (val) => ["light", "dark"].includes(val),
  },
  hideHeader: {
    key: "hideHeader",
    label: "header",
    options: [
      { label: "default", value: null },
      { label: "hide", value: "true" },
      { label: "force_hide", value: "force" },
    ],
    isActive: (val) => val === "true" || val === "force",
    isForced: (val) => val === "force",
  },
  hideSidebar: {
    key: "hideSidebar",
    label: "sidebar",
    options: [
      { label: "default", value: null },
      { label: "hide", value: "true" },
      { label: "force_hide", value: "force" },
    ],
    isActive: (val) => val === "true" || val === "force",
    isForced: (val) => val === "force",
  },
  hideToolbar: {
    key: "hideToolbar",
    label: "toolbar",
    options: [
      { label: "default", value: null },
      { label: "hide", value: "true" },
      { label: "force_hide", value: "force" },
    ],
    isActive: (val) => val === "true" || val === "force",
    isForced: (val) => val === "force",
  },
  forceReadOnly: {
    key: "forceReadOnly",
    label: "read_only",
    options: [
      { label: "default", value: null },
      { label: "force_read_only", value: "true" },
    ],
    isActive: (val) => val === "true",
    isForced: (val) => val === "true",
  },
};
