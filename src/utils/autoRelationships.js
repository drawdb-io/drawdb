import { nanoid } from "nanoid";
import { Cardinality, Constraint } from "../data/constants";
import { getRelationshipFields } from "./utils";

function singularize(name) {
  if (!name || typeof name !== "string") return "";
  const lower = name.trim().toLowerCase();
  if (lower.endsWith("ies")) return lower.slice(0, -3) + "y";
  if (lower.endsWith("es") && !lower.endsWith("sses")) return lower.slice(0, -2);
  if (lower.endsWith("s") && !lower.endsWith("ss")) return lower.slice(0, -1);
  return lower;
}

export function findAutoFKRelationships(tables = [], existingRelationships = []) {
  const newRelationships = [];
  const currentRelationships = [...existingRelationships];

  const isFieldAlreadyLinked = (childTableId, fieldId) => {
    return currentRelationships.some((r) => {
      const pairs = getRelationshipFields(r);
      if (r.startTableId === childTableId) {
        return pairs.some((p) => p.startFieldId === fieldId);
      }
      return false;
    });
  };

  const isPairAlreadyLinked = (childTableId, fkFieldId, parentTableId, pkFieldId) => {
    return currentRelationships.some((r) => {
      const pairs = getRelationshipFields(r);
      const forward =
        r.startTableId === childTableId &&
        r.endTableId === parentTableId &&
        pairs.some((p) => p.startFieldId === fkFieldId && p.endFieldId === pkFieldId);
      const backward =
        r.startTableId === parentTableId &&
        r.endTableId === childTableId &&
        pairs.some((p) => p.startFieldId === pkFieldId && p.endFieldId === fkFieldId);
      return forward || backward;
    });
  };

  tables.forEach((parentTable) => {
    const pkFields = (parentTable.fields || []).filter((f) => f.primary);
    if (pkFields.length === 0) return;

    const pTableName = parentTable.name.trim().toLowerCase();
    const pSingularName = singularize(pTableName);

    pkFields.forEach((pkField) => {
      const pkFieldName = pkField.name.trim().toLowerCase();

      // Candidate matching names for the foreign key column in child tables
      const candidateNames = new Set([
        `${pTableName}_${pkFieldName}`,//users_id
        `${pSingularName}_${pkFieldName}`,//user_id
        `${pTableName}${pkFieldName}`,//usersid
        `${pSingularName}${pkFieldName}`,//userid
      ]);

      if (pkFieldName !== "id") {
        candidateNames.add(pkFieldName);
      }

      tables.forEach((childTable) => {
        if (childTable.id === parentTable.id) return;

        (childTable.fields || []).forEach((fkField) => {
          const fkFieldName = fkField.name.trim().toLowerCase();

          if (!candidateNames.has(fkFieldName)) return;

          if (
            isFieldAlreadyLinked(childTable.id, fkField.id) ||
            isPairAlreadyLinked(childTable.id, fkField.id, parentTable.id, pkField.id)
          ) {
            return;
          }

          const rel = {
            id: nanoid(),
            name: `fk_${childTable.name}_${fkField.name}_${parentTable.name}`,
            startTableId: childTable.id,
            startFieldId: fkField.id,
            endTableId: parentTable.id,
            endFieldId: pkField.id,
            cardinality: fkField.unique
              ? Cardinality.ONE_TO_ONE
              : Cardinality.MANY_TO_ONE,
            updateConstraint: Constraint.NONE,
            deleteConstraint: Constraint.NONE,
          };

          newRelationships.push(rel);
          currentRelationships.push(rel);
        });
      });
    });
  });

  return newRelationships;
}
