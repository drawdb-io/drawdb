export const deepDiff = (original, modified, acc, path = "") => {
  for (const key of new Set([
    ...Object.keys(original),
    ...Object.keys(modified),
  ])) {
    const newPath = path ? `${path}.${key}` : key;

    if (
      typeof original[key] === "object" &&
      typeof modified[key] === "object" // doesnt handle removes well, searate cases for arrays and objs
    ) {
      deepDiff(original[key], modified[key], acc, newPath);
    } else if (original[key] !== modified[key]) {
      acc[newPath] = {
        from: original[key] || null,
        to: modified[key] || null,
      };
    }
  }
};
