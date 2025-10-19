const isArrayOfObjects = (arr) =>
  Array.isArray(arr) &&
  arr.every((item) => typeof item === "object" && item !== null);

export const deepDiff = (original, modified, acc, keysToIgnore = [], path = "") => {
  for (const key of new Set([
    ...Object.keys(original),
    ...Object.keys(modified),
  ])) {
    if (keysToIgnore.includes(key)) {
      continue;
    }

    const newPath = path ? `${path}.${key}` : key;
    const origVal = original[key];
    const modVal = modified[key];

    if (
      Array.isArray(origVal) &&
      Array.isArray(modVal) &&
      isArrayOfObjects(origVal) &&
      isArrayOfObjects(modVal)
    ) {
      for (const o of origVal) {
        const modValItem = modVal.find((m) => m.id === o.id);
        if (modValItem) {
          deepDiff(o, modValItem, acc, `${newPath}[id=${o.id}]`);
        } else {
          acc[`${newPath}[id=${o.id}]`] = { from: o, to: null };
        }
      }

      for (const m of modVal) {
        const origValItem = origVal.find((o) => o.id === m.id);
        if (!origValItem) {
          acc[`${newPath}[id=${m.id}]`] = { from: null, to: m };
        }
      }

      continue;
    }

    if (
      Array.isArray(origVal) &&
      Array.isArray(modVal) &&
      !isArrayOfObjects(origVal) &&
      !isArrayOfObjects(modVal)
    ) {
      if (JSON.stringify(origVal) !== JSON.stringify(modVal)) {
        acc[newPath] = { from: origVal, to: modVal };
      }
      continue;
    }

    if (
      typeof origVal === "object" &&
      typeof modVal === "object" &&
      origVal !== null &&
      modVal !== null
    ) {
      deepDiff(origVal, modVal, acc, newPath);
      continue;
    }

    if (origVal !== modVal) {
      acc[newPath] = { from: origVal ?? null, to: modVal ?? null };
    }
  }
};
