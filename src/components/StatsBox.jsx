import { useDiagram } from "../hooks";

function computeLongestChain(tables, relationships) {
  if (!tables || tables.length <= 1) return 0;

  const adjacency = new Map();
  tables.forEach((table) => {
    adjacency.set(table.id, new Set());
  });

  relationships.forEach((rel) => {
    const { startTableId, endTableId } = rel;
    if (!adjacency.has(startTableId) || !adjacency.has(endTableId)) return;
    adjacency.get(startTableId).add(endTableId);
    adjacency.get(endTableId).add(startTableId);
  });

  const bfsMaxDistance = (startId) => {
    const visited = new Set([startId]);
    const queue = [{ id: startId, dist: 0 }];
    let maxDist = 0;

    while (queue.length > 0) {
      const { id, dist } = queue.shift();
      maxDist = Math.max(maxDist, dist);
      const neighbors = adjacency.get(id) ?? new Set();
      neighbors.forEach((neighborId) => {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ id: neighborId, dist: dist + 1 });
        }
      });
    }

    return maxDist;
  };

  let longest = 0;
  tables.forEach((table) => {
    longest = Math.max(longest, bfsMaxDistance(table.id));
  });

  return longest;
}

export default function StatsBox() {
  const { tables, relationships } = useDiagram();

  const tableCount = tables.length;
  const relationshipCount = relationships.length;
  const maxChainLength = computeLongestChain(tables, relationships);

  if (tableCount === 0 && relationshipCount === 0) {
    return null;
  }

  return (
    <div className="fixed left-5 bottom-4 flex flex-col gap-1 bg-[rgba(var(--semi-grey-1),var(--tw-bg-opacity))]/40 border border-color px-3 py-2 rounded-xl backdrop-blur-xs text-xs select-none">
      <div className="font-semibold">Layout stats</div>
      <div className="flex gap-4 flex-wrap">
        <div>
          <span className="font-medium">Tables:</span> {tableCount}
        </div>
        <div>
          <span className="font-medium">Relationships:</span> {relationshipCount}
        </div>
        <div>
          <span className="font-medium">Max chain length:</span> {maxChainLength}
        </div>
      </div>
    </div>
  );
}

