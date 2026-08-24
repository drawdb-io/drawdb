function normalizeRect(rect) {
  const width = Math.max(0, Number(rect?.width) || 0);
  const height = Math.max(0, Number(rect?.height) || 0);

  return {
    x: Number(rect?.x) || 0,
    y: Number(rect?.y) || 0,
    width,
    height,
  };
}

export function rectanglesIntersect(left, right) {
  return (
    left.x <= right.x + right.width &&
    left.x + left.width >= right.x &&
    left.y <= right.y + right.height &&
    left.y + left.height >= right.y
  );
}

function rectanglesEqual(left, right) {
  return (
    left.x === right.x &&
    left.y === right.y &&
    left.width === right.width &&
    left.height === right.height
  );
}

/**
 * A small uniform-grid index. It stores only ids and bounds; diagram entities
 * remain in their existing contexts as the single source of truth.
 */
export class SpatialIndex {
  constructor({ cellSize = 512, maxCellsPerEntity = 1024 } = {}) {
    this.cellSize = cellSize;
    this.maxCellsPerEntity = maxCellsPerEntity;
    this.buckets = new Map();
    this.entries = new Map();
    this.largeEntries = new Set();
  }

  get size() {
    return this.entries.size;
  }

  getCellRange(rect) {
    const normalized = normalizeRect(rect);
    return {
      minX: Math.floor(normalized.x / this.cellSize),
      maxX: Math.floor((normalized.x + normalized.width) / this.cellSize),
      minY: Math.floor(normalized.y / this.cellSize),
      maxY: Math.floor((normalized.y + normalized.height) / this.cellSize),
    };
  }

  getCellKeys(rect) {
    const range = this.getCellRange(rect);
    const columns = range.maxX - range.minX + 1;
    const rows = range.maxY - range.minY + 1;
    if (columns * rows > this.maxCellsPerEntity) return null;

    const keys = [];
    for (let x = range.minX; x <= range.maxX; x++) {
      for (let y = range.minY; y <= range.maxY; y++) {
        keys.push(`${x}:${y}`);
      }
    }
    return keys;
  }

  remove(id) {
    const current = this.entries.get(id);
    if (!current) return;

    if (current.cells) {
      for (const key of current.cells) {
        const bucket = this.buckets.get(key);
        bucket?.delete(id);
        if (bucket?.size === 0) this.buckets.delete(key);
      }
    } else {
      this.largeEntries.delete(id);
    }
    this.entries.delete(id);
  }

  update(id, rect, order = 0) {
    if (!rect) {
      this.remove(id);
      return;
    }

    const normalized = normalizeRect(rect);
    const current = this.entries.get(id);
    if (
      current &&
      current.order === order &&
      rectanglesEqual(current.rect, normalized)
    ) {
      return;
    }

    this.remove(id);
    const cells = this.getCellKeys(normalized);
    this.entries.set(id, { rect: normalized, cells, order });

    if (!cells) {
      this.largeEntries.add(id);
      return;
    }

    for (const key of cells) {
      let bucket = this.buckets.get(key);
      if (!bucket) {
        bucket = new Set();
        this.buckets.set(key, bucket);
      }
      bucket.add(id);
    }
  }

  sync(items, getRect, getId = (item) => item.id) {
    const seen = new Set();
    items.forEach((item, order) => {
      const id = getId(item);
      seen.add(id);
      this.update(id, getRect(item), order);
    });

    for (const id of this.entries.keys()) {
      if (!seen.has(id)) this.remove(id);
    }
  }

  query(rect) {
    const normalized = normalizeRect(rect);
    const candidates = new Set(this.largeEntries);
    const cells = this.getCellKeys(normalized);

    if (cells) {
      for (const key of cells) {
        const bucket = this.buckets.get(key);
        if (!bucket) continue;
        for (const id of bucket) candidates.add(id);
      }
    } else {
      for (const id of this.entries.keys()) candidates.add(id);
    }

    return [...candidates]
      .filter((id) =>
        rectanglesIntersect(this.entries.get(id).rect, normalized),
      )
      .sort(
        (left, right) =>
          this.entries.get(left).order - this.entries.get(right).order,
      );
  }

  clear() {
    this.buckets.clear();
    this.entries.clear();
    this.largeEntries.clear();
  }
}
