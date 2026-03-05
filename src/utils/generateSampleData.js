function randString(len = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

function sampleValueForType(type, index) {
  if (!type) return randString(8);
  const t = String(type).toLowerCase();
  if (t.includes("int") || t.includes("serial")) return index + 1;
  if (t.includes("char") || t.includes("text") || t.includes("varchar")) return randString(12);
  if (t.includes("time") || t.includes("date")) return new Date().toISOString();
  if (t.includes("bool")) return Math.random() > 0.5;
  if (t.includes("json")) return { sample: true, i: index };
  if (t.includes("float") || t.includes("double") || t.includes("real")) return (Math.random() * 100).toFixed(2);
  return randString(8);
}

/**
 * Generate sample rows for each table.
 * @param {Array} tables - array of table objects (must include id, name, fields[])
 * @param {number} count - rows per table
 * @returns {Object} map of tableName -> rows[]
 */
export function generateSampleData(tables = [], count = 5) {
  const out = {};
  tables.forEach((table) => {
    const rows = [];
    for (let i = 0; i < count; i++) {
      const row = {};
      (table.fields || []).forEach((f, idx) => {
        const key = f.name || `col_${idx}`;
        row[key] = sampleValueForType(f.type || f.dataType || "", i);
      });
      rows.push(row);
    }
    out[table.name || `table_${table.id}`] = rows;
  });
  return out;
}

export default generateSampleData;
