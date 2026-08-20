export function getTypeIndex(types, idOrIndex) {
  if (typeof idOrIndex === "number") return idOrIndex;
  if (typeof idOrIndex === "string") {
    return types.findIndex((t) => t.id === idOrIndex);
  }
  return -1;
}

export function getTypeById(types, idOrIndex) {
  const index = getTypeIndex(types, idOrIndex);
  return {
    type: index >= 0 ? types[index] : null,
    index,
  };
}
