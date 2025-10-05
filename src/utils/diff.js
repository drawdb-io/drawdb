export const deepDiff = (original, modified, acc, path = "") => {
  for (const key of new Set([
    ...Object.keys(original),
    ...Object.keys(modified),
  ])) {
    const newPath = path ? `${path}.${key}` : key;

    const origVal = original[key];
    const modVal = modified[key];

    if (
      Array.isArray(origVal) &&
      Array.isArray(modVal) &&
      origVal.every((v) => typeof v !== "object") &&
      modVal.every((v) => typeof v !== "object")
    ) {
      const len = Math.max(origVal.length, modVal.length);
      for (let i = 0; i < len; i++) {
        if (origVal[i] !== modVal[i]) {
          acc[`${newPath}.${i}`] = {
            from: origVal[i] ?? null,
            to: modVal[i] ?? null,
          };
        }
      }
    }

    else if (Array.isArray(origVal) && Array.isArray(modVal)) {
      const len = Math.max(origVal.length, modVal.length);
      for (let i = 0; i < len; i++) {
        const o = origVal[i];
        const m = modVal[i];

        if (o !== undefined && m === undefined) {
          acc[`${newPath}.${i}`] = { from: o, to: null };
        } else if (o === undefined && m !== undefined) {
          acc[`${newPath}.${i}`] = { from: null, to: m };
        } else {
          deepDiff(o, m, acc, `${newPath}.${i}`);
        }
      }
    } else if (
      typeof origVal === "object" &&
      typeof modVal === "object" &&
      origVal !== null &&
      modVal !== null
    ) {
      deepDiff(origVal, modVal, acc, newPath);
    } else if (origVal !== modVal) {
      acc[newPath] = {
        from: origVal ?? null,
        to: modVal ?? null,
      };
    }
  }
};
