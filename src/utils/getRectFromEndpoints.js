export function getRectFromEndpoints({ x1, x2, y1, y2 }) {
  const width = Math.abs(x1 - x2);
  const height = Math.abs(y1 - y2);

  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);

  return { x, y, width, height };
}
