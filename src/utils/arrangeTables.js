import {
  tableColorStripHeight,
  tableFieldHeight,
  tableHeaderHeight,
} from "../data/constants";

export function arrangeTables(diagram) {
  let maxHeight = -1;
  const tableWidth = 200;
  const gapX = 54;
  const gapY = 40;
  diagram.tables.forEach((table, i) => {
    if (i < diagram.tables.length / 2) {
      table.x = i * tableWidth + (i + 1) * gapX;
      table.y = gapY;
      const height =
        table.fields.length * tableFieldHeight +
        tableHeaderHeight +
        tableColorStripHeight;
      maxHeight = Math.max(height, maxHeight);
    } else {
      const index = diagram.tables.length - i - 1;
      table.x = index * tableWidth + (index + 1) * gapX;
      table.y = maxHeight + 2 * gapY;
    }
  });
}

export function autoArrangeTables(diagram) {
  const { tables, relationships } = diagram;

  if (!tables || tables.length === 0) return;

  const tableIds = tables.map((t) => t.id);
  const hasId = new Set(tableIds);

  const edges =
    relationships?.reduce((acc, r) => {
      const { startTableId, endTableId } = r;
      if (
        startTableId != null &&
        endTableId != null &&
        hasId.has(startTableId) &&
        hasId.has(endTableId) &&
        startTableId !== endTableId
      ) {
        acc.push({ from: startTableId, to: endTableId });
      }
      return acc;
    }, []) ?? [];

  const n = tables.length;

  if (n === 1 || edges.length === 0) {
    arrangeTables(diagram);
    return;
  }

  const area = Math.max(n, 1) * 40000;
  const width = Math.sqrt(area);
  const height = width;
  const k = Math.sqrt((width * height) / n);

  const positions = new Map();
  const displacements = new Map();

  tables.forEach((t, i) => {
    const x =
      typeof t.x === "number" && Number.isFinite(t.x)
        ? t.x
        : (width / 2) * (1 + Math.cos((2 * Math.PI * i) / n));
    const y =
      typeof t.y === "number" && Number.isFinite(t.y)
        ? t.y
        : (height / 2) * (1 + Math.sin((2 * Math.PI * i) / n));
    positions.set(t.id, { x, y });
    displacements.set(t.id, { x: 0, y: 0 });
  });

  const iterations = Math.min(200, 30 + n * 5);

  for (let iter = 0; iter < iterations; iter += 1) {
    tableIds.forEach((id) => {
      displacements.set(id, { x: 0, y: 0 });
    });

    for (let i = 0; i < n; i += 1) {
      const idI = tableIds[i];
      const posI = positions.get(idI);
      for (let j = i + 1; j < n; j += 1) {
        const idJ = tableIds[j];
        const posJ = positions.get(idJ);

        let dx = posI.x - posJ.x;
        let dy = posI.y - posJ.y;
        let dist = Math.hypot(dx, dy);
        if (dist < 0.01) {
          const angle = Math.random() * 2 * Math.PI;
          dx = Math.cos(angle) * 0.01;
          dy = Math.sin(angle) * 0.01;
          dist = Math.hypot(dx, dy);
        }

        const force = (k * k) / dist;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        const dispI = displacements.get(idI);
        const dispJ = displacements.get(idJ);
        dispI.x += fx;
        dispI.y += fy;
        dispJ.x -= fx;
        dispJ.y -= fy;
      }
    }

    edges.forEach(({ from, to }) => {
      const posU = positions.get(from);
      const posV = positions.get(to);
      if (!posU || !posV) return;
      let dx = posU.x - posV.x;
      let dy = posU.y - posV.y;
      let dist = Math.hypot(dx, dy);
      if (dist < 0.01) {
        const angle = Math.random() * 2 * Math.PI;
        dx = Math.cos(angle) * 0.01;
        dy = Math.sin(angle) * 0.01;
        dist = Math.hypot(dx, dy);
      }
      const force = (dist * dist) / k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      const dispU = displacements.get(from);
      const dispV = displacements.get(to);
      dispU.x -= fx;
      dispU.y -= fy;
      dispV.x += fx;
      dispV.y += fy;
    });

    const temperature = (width / 10) * (1 - iter / iterations);

    tableIds.forEach((id) => {
      const pos = positions.get(id);
      const disp = displacements.get(id);
      const dispLen = Math.hypot(disp.x, disp.y) || 1;
      const limited = Math.min(temperature, dispLen);
      const nx = pos.x + (disp.x / dispLen) * limited;
      const ny = pos.y + (disp.y / dispLen) * limited;

      positions.set(id, {
        x: Math.max(-width, Math.min(width, nx)),
        y: Math.max(-height, Math.min(height, ny)),
      });
    });
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  tableIds.forEach((id) => {
    const { x, y } = positions.get(id);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });

  const offsetX = -((minX + maxX) / 2);
  const offsetY = -((minY + maxY) / 2);

  tables.forEach((table) => {
    const pos = positions.get(table.id);
    if (!pos) return;
    table.x = Math.round(pos.x + offsetX);
    table.y = Math.round(pos.y + offsetY);
  });
}
