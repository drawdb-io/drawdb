export function canMutateDiagram(layout) {
  if (!layout) {
    return true;
  }

  return !layout.readOnly;
}


