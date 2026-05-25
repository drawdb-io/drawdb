export const queryConfig = {
  theme: {
    key: "theme",
    isValid: (val) => ["light", "dark"].includes(val),
  },
  hideHeader: {
    key: "hideHeader",
    isActive: (val) => val === "true" || val === "force",
    isForced: (val) => val === "force",
  },
  hideSidebar: {
    key: "hideSidebar",
    isActive: (val) => val === "true" || val === "force",
    isForced: (val) => val === "force",
  },
  hideToolbar: {
    key: "hideToolbar",
    isActive: (val) => val === "true" || val === "force",
    isForced: (val) => val === "force",
  },
  forceReadOnly: {
    key: "forceReadOnly",
    isActive: (val) => val === "true",
    isForced: (val) => val === "true",
  },
};
