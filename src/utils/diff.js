const isArrayOfObjects = (arr) =>
  Array.isArray(arr) &&
  arr.every((item) => typeof item === "object" && item !== null);

const isEmptyObject = (val) =>
  typeof val === "object" &&
  val !== null &&
  !Array.isArray(val) &&
  Object.keys(val).length === 0;

export const deepDiff = (
  original = {},
  modified = {},
  acc,
  keysToIgnore = [],
  path = "",
) => {
  const keys = new Set([...Object.keys(original), ...Object.keys(modified)]);

  for (const key of keys) {
    if (keysToIgnore.includes(key)) continue;

    const newPath = path ? `${path}#${key}` : key;
    const origVal = original[key];
    const modVal = modified[key];

    if (isArrayOfObjects(origVal) || isArrayOfObjects(modVal)) {
      const origArr = origVal ?? [];
      const modArr = modVal ?? [];

      for (const o of origArr) {
        const m = modArr.find((x) => x.id === o.id);
        if (m) {
          deepDiff(
            o,
            m,
            acc,
            keysToIgnore,
            `${newPath}[id=${o.id},name=${o.name}${o.type ? `,type=${o.type}` : ""}]`,
          );
        } else {
          acc[
            `${newPath}[id=${o.id},name=${o.name}${o.type ? `,type=${o.type}` : ""}]`
          ] = {
            from: o,
            to: null,
          };
        }
      }

      for (const m of modArr) {
        const o = origArr.find((x) => x.id === m.id);
        if (!o) {
          acc[
            `${newPath}[id=${m.id},name=${m.name}${m.type ? `,type=${m.type}` : ""}]`
          ] = {
            from: null,
            to: m,
          };
        }
      }

      continue;
    }

    if (Array.isArray(origVal) || Array.isArray(modVal)) {
      if (JSON.stringify(origVal) !== JSON.stringify(modVal)) {
        acc[newPath] = { from: origVal ?? null, to: modVal ?? null };
      }
      continue;
    }

    const isOrigObject = typeof origVal === "object" && origVal !== null;
    const isModObject = typeof modVal === "object" && modVal !== null;

    if (!isOrigObject && !isModObject) {
      if (origVal !== modVal) {
        acc[newPath] = {
          from: origVal ?? null,
          to: modVal ?? null,
        };
      }
      continue;
    }

    if (isOrigObject && isModObject) {
      if (isEmptyObject(origVal) && isEmptyObject(modVal)) {
        continue;
      }

      deepDiff(origVal, modVal, acc, keysToIgnore, newPath);
      continue;
    }

    acc[newPath] = {
      from: origVal ?? null,
      to: modVal ?? null,
    };
  }
};
