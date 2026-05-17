/**
 * Pure dispatcher for applying a remote collaboration delta to the local
 * editor state. Lives in OSS so any consumer (the closed-source pro app
 * here, but in principle any other transport) can reuse it.
 *
 * Pan/zoom (transform) is intentionally not synced.
 *
 * `delta` shape:
 *   { target, action, entityId, data }
 *
 * `ctx` is a bag of setters/getters the caller assembles by reading the
 * diagram/areas/notes/types/enums/database contexts.
 */
export function applyDiagramDelta(delta, ctx) {
  if (!delta) return;
  const { target, action, data } = delta;

  switch (target) {
    case "table": {
      if (action === "create") {
        const table = Array.isArray(data) ? data[0] : data;
        ctx.addTable?.({ table, index: ctx.tables?.length ?? 0 }, false);
      } else if (action === "delete") {
        const id = delta.entityId ?? (Array.isArray(data) ? data[0] : null);
        if (id != null) ctx.deleteTable?.(id, false);
      } else if (action === "update") {
        // Possible payload shapes (mirroring DiagramContext mutations):
        //   [tableId, partial]                — table-level update
        //   [tableId, fieldId, partial]       — field update
        //   [field, tableId]                  — field delete (rare; we
        //                                      prefer explicit field.delete)
        if (Array.isArray(data) && data.length === 2 && typeof data[1] === "object" && data[1] !== null) {
          ctx.updateTable?.(data[0], data[1]);
        } else if (Array.isArray(data) && data.length === 3) {
          ctx.updateField?.(data[0], data[1], data[2]);
        } else if (
          Array.isArray(data) &&
          data.length === 2 &&
          data[0] &&
          typeof data[0] === "object" &&
          data[0].id != null
        ) {
          ctx.deleteField?.(data[0], data[1], false);
        }
      }
      break;
    }
    case "relationship": {
      if (action === "create") {
        const r = Array.isArray(data) ? data[0] : data;
        ctx.addRelationship?.(r, false);
      } else if (action === "delete") {
        const id = delta.entityId ?? (Array.isArray(data) ? data[0] : null);
        if (id != null) ctx.deleteRelationship?.(id, false);
      } else if (action === "update") {
        const [id, partial] = data || [];
        ctx.updateRelationship?.(id, partial);
      }
      break;
    }
    case "area": {
      if (action === "create") {
        const a = Array.isArray(data) ? data[0] : data;
        ctx.addArea?.(a, false);
      } else if (action === "delete") {
        const id = delta.entityId ?? (Array.isArray(data) ? data[0] : null);
        if (id != null) ctx.deleteArea?.(id, false);
      } else if (action === "update") {
        const [id, partial] = data || [];
        ctx.updateArea?.(id, partial);
      }
      break;
    }
    case "note": {
      if (action === "create") {
        const n = Array.isArray(data) ? data[0] : data;
        ctx.addNote?.(n, false);
      } else if (action === "delete") {
        const id = delta.entityId ?? (Array.isArray(data) ? data[0] : null);
        if (id != null) ctx.deleteNote?.(id, false);
      } else if (action === "update") {
        const [id, partial] = data || [];
        ctx.updateNote?.(id, partial);
      }
      break;
    }
    case "database": {
      if (action === "update") {
        const next = Array.isArray(data) ? data[0] : data;
        if (next != null) ctx.setDatabase?.(next);
      }
      break;
    }
    case "types": {
      if (action === "update") {
        const next = Array.isArray(data) ? data[0] : data;
        if (next != null) ctx.setTypes?.(next);
      }
      break;
    }
    case "enums": {
      if (action === "update") {
        const next = Array.isArray(data) ? data[0] : data;
        if (next != null) ctx.setEnums?.(next);
      }
      break;
    }
    default:
      break;
  }
}
