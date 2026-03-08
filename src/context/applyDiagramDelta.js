/**
 * Centralized handler for applying collaboration deltas.
 * Pan/zoom (transform) is intentionally not applied — not synced.
 *
 * @param {Object} delta - { target, action, data }
 * @param {Object} ctx - Diagram/areas/notes/database setters and getters
 */
export function applyDiagramDelta(delta, ctx) {
  if (!delta) return;
  const { target, action, data } = delta;

  switch (target) {
    case "table": {
      const [arg1, arg2] = data || [];
      if (action === "create") {
        ctx.addTable?.(arg1, false);
      } else if (action === "update") {
        ctx.updateTable?.(arg1, arg2);
      } else if (action === "delete") {
        ctx.deleteTable?.(arg1, false);
      }
      break;
    }
    case "field": {
      const [tid, fid, updatedValues] = data || [];
      if (action === "update") {
        const table = ctx.tables?.find((t) => t.id === tid);
        if (table) {
          const nextFields = table.fields.map((field) =>
            field.id === fid ? { ...field, ...updatedValues } : field,
          );
          ctx.updateTable?.(tid, { fields: nextFields });
        }
      } else if (action === "delete") {
        const [field, tableId] = data || [];
        const table = ctx.tables?.find((t) => t.id === tableId);
        if (table && field) {
          const nextFields = table.fields.filter((f) => f.id !== field.id);
          ctx.updateTable?.(tableId, { fields: nextFields });
        }
      }
      break;
    }
    case "relationship": {
      const [arg1, arg2] = data || [];
      if (action === "create") {
        ctx.addRelationship?.(arg1, false);
      } else if (action === "update") {
        ctx.updateRelationship?.(arg1, arg2);
      } else if (action === "delete") {
        ctx.deleteRelationship?.(arg1, false);
      }
      break;
    }
    case "area": {
      const [arg1, arg2] = data || [];
      if (action === "create") {
        ctx.addArea?.(arg1, false);
      } else if (action === "update") {
        ctx.updateArea?.(arg1, arg2);
      } else if (action === "delete") {
        ctx.deleteArea?.(arg1, false);
      }
      break;
    }
    case "note": {
      const [arg1, arg2] = data || [];
      if (action === "create") {
        ctx.addNote?.(arg1, false);
      } else if (action === "update") {
        ctx.updateNote?.(arg1, arg2);
      } else if (action === "delete") {
        ctx.deleteNote?.(arg1, false);
      }
      break;
    }
    case "database": {
      const [nextDb] = data || [];
      if (action === "update" && nextDb) {
        ctx.setDatabase?.(nextDb);
      }
      break;
    }
    default:
      break;
  }
}
