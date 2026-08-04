export function applyDiagramPlan(plan, ctx) {
  for (const op of plan) {
    switch (op.target) {
      case "enums":
        ctx.setEnums(op.enums);
        break;
      case "table":
        if (op.action === "create") ctx.addTable({ table: op.table }, false);
        else if (op.action === "delete") ctx.deleteTable(op.id, false);
        else ctx.updateTable(op.id, op.values);
        break;
      case "field":
        ctx.updateField(op.tableId, op.fieldId, op.values);
        break;
      case "relationship":
        if (op.action === "create") {
          ctx.addRelationship({ relationship: op.relationship }, false);
        } else if (op.action === "delete") {
          ctx.deleteRelationship(op.id, false);
        } else {
          ctx.updateRelationship(op.id, op.values);
        }
        break;
      default:
        break;
    }
  }
}
