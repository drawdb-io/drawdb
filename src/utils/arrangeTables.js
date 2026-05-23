import {
  tableColorStripHeight,
  tableFieldHeight,
  tableHeaderHeight,
  tableWidth,
} from "../data/constants";

// Force-directed layout algorithm
function forceDirectedLayout(tables, relationships, options = {}) {
  const {
    iterations = 100,
    repulsionStrength = 5000,
    attractionStrength = 0.001,
    centerForce = 0.01,
    minDistance = 250
  } = options;

  // Initialize positions if not set
  tables.forEach((table, i) => {
    if (table.x === undefined) table.x = Math.random() * 800;
    if (table.y === undefined) table.y = Math.random() * 600;
  });

  // Build adjacency list
  const adjacency = {};
  relationships.forEach(rel => {
    const { startTableId, endTableId } = rel;
    if (!adjacency[startTableId]) adjacency[startTableId] = [];
    if (!adjacency[endTableId]) adjacency[endTableId] = [];
    adjacency[startTableId].push(endTableId);
    adjacency[endTableId].push(startTableId);
  });

  // Force simulation
  for (let iter = 0; iter < iterations; iter++) {
    const forces = {};
    
    // Initialize forces
    tables.forEach(table => {
      forces[table.id] = { x: 0, y: 0 };
    });

    // Repulsion between all nodes
    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const table1 = tables[i];
        const table2 = tables[j];
        
        const dx = table2.x - table1.x;
        const dy = table2.y - table1.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        if (distance < minDistance) {
          const force = repulsionStrength / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          forces[table1.id].x -= fx;
          forces[table1.id].y -= fy;
          forces[table2.id].x += fx;
          forces[table2.id].y += fy;
        }
      }
    }

    // Attraction along edges
    relationships.forEach(rel => {
      const table1 = tables.find(t => t.id === rel.startTableId);
      const table2 = tables.find(t => t.id === rel.endTableId);
      
      if (table1 && table2) {
        const dx = table2.x - table1.x;
        const dy = table2.y - table1.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = distance * attractionStrength;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        forces[table1.id].x += fx;
        forces[table1.id].y += fy;
        forces[table2.id].x -= fx;
        forces[table2.id].y -= fy;
      }
    });

    // Center gravity
    const centerX = 400;
    const centerY = 300;
    
    tables.forEach(table => {
      const dx = centerX - table.x;
      const dy = centerY - table.y;
      forces[table.id].x += dx * centerForce;
      forces[table.id].y += dy * centerForce;
    });

    // Apply forces
    tables.forEach(table => {
      table.x += forces[table.id].x;
      table.y += forces[table.id].y;
    });
  }
}

// Hierarchical layout algorithm
function hierarchicalLayout(tables, relationships) {
  // Build adjacency list
  const adjacency = {};
  const inDegree = {};
  
  tables.forEach(table => {
    adjacency[table.id] = [];
    inDegree[table.id] = 0;
  });

  relationships.forEach(rel => {
    adjacency[rel.startTableId].push(rel.endTableId);
    inDegree[rel.endTableId]++;
  });

  // Topological sort to determine layers
  const layers = [];
  const visited = new Set();
  const queue = [];

  // Find nodes with no incoming edges
  tables.forEach(table => {
    if (inDegree[table.id] === 0) {
      queue.push(table);
      visited.add(table.id);
    }
  });

  while (queue.length > 0) {
    const currentLayer = [...queue];
    queue.length = 0;
    layers.push(currentLayer);

    currentLayer.forEach(table => {
      adjacency[table.id].forEach(neighborId => {
        if (!visited.has(neighborId)) {
          inDegree[neighborId]--;
          if (inDegree[neighborId] === 0) {
            const neighbor = tables.find(t => t.id === neighborId);
            if (neighbor) {
              queue.push(neighbor);
              visited.add(neighborId);
            }
          }
        }
      });
    });
  }

  // Add remaining nodes (in case of cycles)
  tables.forEach(table => {
    if (!visited.has(table.id)) {
      if (!layers[layers.length - 1]) layers.push([]);
      layers[layers.length - 1].push(table);
    }
  });

  // Position nodes
  const verticalGap = 200;
  const horizontalGap = tableWidth + 50;

  layers.forEach((layer, layerIndex) => {
    const layerWidth = layer.length * horizontalGap;
    const startX = (800 - layerWidth) / 2;

    layer.forEach((table, tableIndex) => {
      table.x = startX + tableIndex * horizontalGap;
      table.y = 50 + layerIndex * verticalGap;
    });
  });
}

// Enhanced arrange function with algorithm selection
export function arrangeTables(diagram, algorithm = 'force-directed') {
  const { tables, relationships } = diagram;
  
  if (tables.length === 0) return;

  switch (algorithm) {
    case 'force-directed':
      forceDirectedLayout(tables, relationships);
      break;
    case 'hierarchical':
      hierarchicalLayout(tables, relationships);
      break;
    default:
      // Simple grid layout as fallback
      simpleGridLayout(tables);
      break;
  }
}

// Keep original simple layout as fallback
function simpleGridLayout(tables) {
  let maxHeight = -1;
  const gapX = 54;
  const gapY = 40;
  
  tables.forEach((table, i) => {
    if (i < tables.length / 2) {
      table.x = i * tableWidth + (i + 1) * gapX;
      table.y = gapY;
      const height =
        table.fields.length * tableFieldHeight +
        tableHeaderHeight +
        tableColorStripHeight;
      maxHeight = Math.max(height, maxHeight);
    } else {
      const index = tables.length - i - 1;
      table.x = index * tableWidth + (index + 1) * gapX;
      table.y = maxHeight + 2 * gapY;
    }
  });
}

// Export individual algorithms for direct use
export { forceDirectedLayout, hierarchicalLayout };
