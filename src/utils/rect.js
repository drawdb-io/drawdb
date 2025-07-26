export function getRectFromEndpoints({ x1, x2, y1, y2 }) {
  const width = Math.abs(x1 - x2);
  const height = Math.abs(y1 - y2);

  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);

  return { x, y, width, height };
}

export function isInsideRect(rect1, rect2) {
  return (
    rect1.x > rect2.x &&
    rect1.x + rect1.width < rect2.x + rect2.width &&
    rect1.y > rect2.y &&
    rect1.y + rect1.height < rect2.y + rect2.height
  );
}
