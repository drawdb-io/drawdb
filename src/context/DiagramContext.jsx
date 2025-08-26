import { createContext, useState } from "react";
import { Action, DB, ObjectType, defaultBlue } from "../data/constants";
import { useTransform, useUndoRedo, useSelect } from "../hooks";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";

export const DiagramContext = createContext(null);

export default function DiagramContextProvider({ children }) {
  const { t } = useTranslation();
  const [database, setDatabase] = useState(DB.GENERIC);
  const [tables, setTables] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const { transform } = useTransform();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();

  const addTable = (data, addToHistory = true) => {
    if (data) {
      setTables((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp.map((t, i) => ({ ...t, id: i }));
      });
    } else {
      setTables((prev) => [
        ...prev,
        {
          id: prev.length,
          name: `table_${prev.length}`,
          x: transform.pan.x,
          y: transform.pan.y,
          fields: [
            {
              name: "id",
              type: database === DB.GENERIC ? "INT" : "INTEGER",
              default: "",
              check: "",
              primary: true,
              unique: true,
              notNull: true,
              increment: true,
              comment: "",
              id: 0,
            },
          ],
          comment: "",
          indices: [],
          color: defaultBlue,
          key: Date.now(),
        },
      ]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.TABLE,
          message: t("add_table"),
        },
      ]);
      setRedoStack([]);
    }
  };

  const deleteTable = (id, addToHistory = true) => {
    if (addToHistory) {
      Toast.success(t("table_deleted"));
      const rels = relationships.reduce((acc, r) => {
        if (r.startTableId === id || r.endTableId === id) {
          acc.push(r);
        }
        return acc;
      }, []);
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.TABLE,
          data: { table: tables[id], relationship: rels },
          message: t("delete_table", { tableName: tables[id].name }),
        },
      ]);
      setRedoStack([]);
    }
    setRelationships((prevR) => {
      return prevR
        .filter((e) => !(e.startTableId === id || e.endTableId === id))
        .map((e, i) => {
          const newR = { ...e };

          if (e.startTableId > id) {
            newR.startTableId = e.startTableId - 1;
          }
          if (e.endTableId > id) {
            newR.endTableId = e.endTableId - 1;
          }

          return { ...newR, id: i };
        });
    });
    setTables((prev) => {
      return prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, id: i }));
    });
    if (id === selectedElement.id) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      }));
    }
  };

  const updateTable = (id, updatedValues) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedValues } : t)),
    );
  };

  const updateField = (tid, fid, updatedValues, addToHistory = true) => {
    const tableBeforeUpdate = tables.find(t => t.id === tid);
    if (!tableBeforeUpdate) return;

    // Capture the previous state of the fields in the table before any modifications.
    const previousFieldsState = JSON.parse(JSON.stringify(tableBeforeUpdate.fields));
    const originalFieldForMessage = previousFieldsState.find(f => f.id === fid);

    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id === tid) {
          // Start with a copy of the previous fields to apply updates.
          let newFields = previousFieldsState.map((field) =>
            field.id === fid ? { ...field, ...updatedValues } : field,
          );

          const fieldAfterDirectUpdate = newFields.find(f => f.id === fid);
          if (!fieldAfterDirectUpdate) return { ...table, fields: previousFieldsState };

          // Logic to promote a sibling FK to PK if the current field is being set as primary key
          if (Object.prototype.hasOwnProperty.call(updatedValues, 'primary') && updatedValues.primary === true) {
            if (fieldAfterDirectUpdate.foreignK === true && fieldAfterDirectUpdate.foreignKey) {
              const parentTableIdOfFK = fieldAfterDirectUpdate.foreignKey.tableId;
              const siblingFkFieldsToPromote = newFields.filter(
                (f) =>
                  f.id !== fid &&
                  f.foreignK === true &&
                  f.foreignKey &&
                  f.foreignKey.tableId === parentTableIdOfFK &&
                  f.primary === false
              );

              if (siblingFkFieldsToPromote.length > 0) {
                newFields = newFields.map(field => {
                  if (siblingFkFieldsToPromote.some(sfk => sfk.id === field.id)) {
                    return { ...field, primary: true};
                  }
                  return field;
                });
              }
            }
          }
          // Logic to demote a sibling FK if the current field is being set as not primary key
          else if (Object.prototype.hasOwnProperty.call(updatedValues, 'primary') && updatedValues.primary === false) {
            const originalFieldStateForDemotionLogic = previousFieldsState.find(f => f.id === fid);

            if (originalFieldStateForDemotionLogic &&
                originalFieldStateForDemotionLogic.primary === true && // was originally PK
                originalFieldStateForDemotionLogic.foreignK === true &&
                originalFieldStateForDemotionLogic.foreignKey) {

              const parentTableIdOfFK = originalFieldStateForDemotionLogic.foreignKey.tableId;

              const idsOfSiblingsToDemote = [];
              newFields.forEach(potentialSibling => {
                if (potentialSibling.id !== fid &&
                    potentialSibling.primary === true && // is currently PK (after fid may have been demoted)
                    potentialSibling.foreignK === true &&
                    potentialSibling.foreignKey &&
                    potentialSibling.foreignKey.tableId === parentTableIdOfFK) {
                  idsOfSiblingsToDemote.push(potentialSibling.id);
                }
              });

              if (idsOfSiblingsToDemote.length > 0) {
                newFields = newFields.map(field => {
                  if (idsOfSiblingsToDemote.includes(field.id)) {
                    return { ...field, primary: false};
                  }
                  return field;
                });
              }
            }
          }

          // Logic to handle notNull
          if (Object.prototype.hasOwnProperty.call(updatedValues, "notNull")) {
            if(fieldAfterDirectUpdate.foreignK === true && fieldAfterDirectUpdate.foreignKey) {
              const parentTableIdOfFK = fieldAfterDirectUpdate.foreignKey.tableId;
              const newNotnullValue = fieldAfterDirectUpdate.notNull;

              const siblingFkFieldsToUpdateNotNull = newFields.filter(
                (f) =>
                  f.id !== fid &&
                  f.foreignK === true &&
                  f.foreignKey &&
                  f.foreignKey.tableId === parentTableIdOfFK &&
                  f.notNull !== newNotnullValue
              );
              if (siblingFkFieldsToUpdateNotNull.length > 0) {
                newFields = newFields.map(field => {
                  if (siblingFkFieldsToUpdateNotNull.some(sfk => sfk.id === field.id)) {
                    return { ...field, notNull: newNotnullValue };
                  }
                  return field;
                });
              }
            }
          }

          return {
            ...table,
            fields: newFields,
          };
        }
        return table;
      }),
    );

    if (addToHistory && previousFieldsState) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.EDIT,
          element: ObjectType.TABLE,
          component: "field_update",
          tid: tid,
          data: {
            previousFields: previousFieldsState,
            updatedFieldId: fid,
            appliedValues: updatedValues
          },
          message: t("edit_table_field",
            { fieldName: originalFieldForMessage?.name ||
              `field ${fid}`, tableName: tableBeforeUpdate?.name ||
               `table ${tid}` }),
        },
      ]);
      setRedoStack([]);
    }
  };

  const deleteField = (field, tid, addToHistory = true) => {
    const currentTable = tables.find(t => t.id === tid);
    if (!currentTable) return;

    const pkFieldIds = currentTable.fields.filter(f => f.primary).map(f => f.id);
    const isPartOfCompositePK = field.primary && pkFieldIds.length > 1;

    const isPartOfCompositeFK = (() => {
      if (!field.foreignK || !field.foreignKey) return false;
      const fkParentTableId = field.foreignKey.tableId;
      const relatedFKs = currentTable.fields.filter(
        f =>
          f.foreignK && f.foreignKey &&
          f.foreignKey.tableId === fkParentTableId
      );
      return relatedFKs.length > 1;
    })();

    // Get relationships directly connected to the field being deleted
    let directlyAffectedRelationships = relationships.filter(
      (r) =>
        (r.startTableId === tid && r.startFieldId === field.id) ||
        (r.endTableId === tid && r.endFieldId === field.id)
    );

    let compositePKAffectedRelationships = [];
    // If the field is part of a composite PK, get all relationships starting from any field in that composite PK
    if (isPartOfCompositePK) {
      compositePKAffectedRelationships = relationships.filter(
        (r) => r.startTableId === tid && pkFieldIds.includes(r.startFieldId)
      );
    }

    let compositeFKAffectedRelationships = [];
    // If the field is part of a composite FK, get all relationships ending at any field in that composite FK
    if (isPartOfCompositeFK && field.foreignK) {
      const fkParentTableId = field.foreignKey.tableId;
      const relatedFKFieldIds = currentTable.fields
        .filter(f => f.foreignK && f.foreignKey && f.foreignKey.tableId === fkParentTableId)
        .map(f => f.id);
      compositeFKAffectedRelationships = relationships.filter(
        (r) => r.endTableId === tid && relatedFKFieldIds.includes(r.endFieldId)
      );
    }
    let subtypeRelationshipToRemove = null;
    let modifiedSubtypeRelationship = null; // Store original state of modified subtype relationship
    let subtypeChildTablesSnapshot = {}; // NEW: Capture ALL child tables from subtype relationships

    // Helper function to capture child table fields for subtype relationships
    const captureSubtypeChildFields = (subtypeRel, reason = "unknown") => {
      if (subtypeRel.endTableIds && subtypeRel.endTableIds.length > 0) {
        subtypeRel.endTableIds.forEach(childTableId => {
          const childTable = tables.find(t => t.id === childTableId);
          if (childTable) {
            subtypeChildTablesSnapshot[childTableId] = JSON.parse(JSON.stringify(childTable.fields));
          }
        });
      } else if (subtypeRel.endTableId !== undefined) {
        // Handle single child case
        const childTable = tables.find(t => t.id === subtypeRel.endTableId);
        if (childTable) {
          subtypeChildTablesSnapshot[subtypeRel.endTableId] = JSON.parse(JSON.stringify(childTable.fields));
        }
      }
    };

    // Special handling for subtype relationships when deleting FK fields
    if (field.foreignK && field.foreignKey) {
      const parentTableId = field.foreignKey.tableId;
      // Find subtype relationships where this table is a child
      const subtypeRelationships = relationships.filter(rel =>
        rel.subtype &&
        rel.startTableId === parentTableId &&
        (
          (rel.endTableIds && rel.endTableIds.includes(tid)) ||
          (rel.endTableId === tid)
        )
      );
      if (subtypeRelationships.length > 0) {
        const subtypeRel = subtypeRelationships[0];
        // Save original state of the subtype relationship for undo
        modifiedSubtypeRelationship = JSON.parse(JSON.stringify(subtypeRel));
        // Capture fields of ALL child tables BEFORE any modifications
        captureSubtypeChildFields(subtypeRel, "FK deletion");
        if (subtypeRel.endTableIds && subtypeRel.endTableIds.length > 1) {
          // Update the subtype relationship to remove this child table
          const endTableIds = subtypeRel.endTableIds || [subtypeRel.endTableId];
          const endFieldIds = subtypeRel.endFieldIds || [subtypeRel.endFieldId];
          const childIndex = endTableIds.indexOf(tid);
          if (childIndex > -1) {
            const newEndTableIds = endTableIds.filter((_, i) => i !== childIndex);
            const newEndFieldIds = endFieldIds.filter((_, i) => i !== childIndex);
            let newRelationshipState = {};
            // If only one child remains, convert back to single endTableId format
            if (newEndTableIds.length === 1) {
              newRelationshipState = {
                endTableId: newEndTableIds[0],
                endFieldId: newEndFieldIds[0],
                endTableIds: undefined,
                endFieldIds: undefined,
                relationshipType: 'subtype',
              };
            } else if (newEndTableIds.length > 1) {
              newRelationshipState = {
                endTableIds: newEndTableIds,
                endFieldIds: newEndFieldIds,
                endTableId: undefined,
                endFieldId: undefined,
                relationshipType: 'subtype',
              };
            } else {
              // No children left, this will be handled by normal relationship deletion
              newRelationshipState = null;
            }
            if (newRelationshipState) {
              // Update the relationship to remove this child
              setRelationships(prev =>
                prev.map(rel => {
                  if (rel.id === subtypeRel.id) {
                    return { ...rel, ...newRelationshipState };
                  }
                  return rel;
                })
              );
              // Store the relationship ID to filter later after affectedRelationships is declared
              subtypeRelationshipToRemove = subtypeRel.id;
            }
          }
        }
      }
    }

    // NEW: Special handling for subtype relationships when deleting PK fields (parent table case)
    if (field.primary) {
      // Find subtype relationships where this table is the parent (startTableId)
      const parentSubtypeRelationships = relationships.filter(rel =>
        rel.subtype &&
        rel.startTableId === tid &&
        rel.startFieldId === field.id
      );
      if (parentSubtypeRelationships.length > 0) {
        // Capture fields of ALL child tables BEFORE any modifications
        parentSubtypeRelationships.forEach(subtypeRel => {
          captureSubtypeChildFields(subtypeRel, "PK deletion");
        });
      }
    }
    // Combine all unique affected relationships
    const allPotentiallyAffected = [
        ...directlyAffectedRelationships,
        ...compositePKAffectedRelationships,
        ...compositeFKAffectedRelationships
    ];
    const uniqueAffectedRelationshipIds = new Set();
    const finalAffectedRelationships = allPotentiallyAffected.filter(rel => {
      if (!uniqueAffectedRelationshipIds.has(rel.id)) {
        uniqueAffectedRelationshipIds.add(rel.id);
        return true;
      }
      return false;
    });
    let affectedRelationships = finalAffectedRelationships; // Use this 'affectedRelationships' variable moving forward
    // Filter out subtype relationship if it was marked for removal
    if (subtypeRelationshipToRemove !== null) {
      affectedRelationships = affectedRelationships.filter(
        rel => rel.id !== subtypeRelationshipToRemove);
    }

    let childFieldsSnapshot = {}

    if (affectedRelationships.length > 0) {
      affectedRelationships.forEach((rel) => {
        const childTable = tables.find((t) => t.id === rel.endTableId);
        if(childTable){
          childFieldsSnapshot[childTable.id] = JSON.parse(JSON.stringify(childTable.fields));
        }
      });
    }
    // NEW: Merge subtype child tables snapshot into childFieldsSnapshot
    if (Object.keys(subtypeChildTablesSnapshot).length > 0) {
      // Merge subtypeChildTablesSnapshot into childFieldsSnapshot
      Object.entries(subtypeChildTablesSnapshot).forEach(([tableId, fieldsSnapshot]) => {
        childFieldsSnapshot[tableId] = fieldsSnapshot;
      });
    }

    const previousFields = JSON.parse(JSON.stringify(currentTable.fields));
    let relationshipsBeforeModification = [];

    // Identificate relationships that will be modified (not deleted) due to fieldId adjustment
    const relationsToAdjust = relationships.filter(r => {
      const isAffectedAndNotDeleted = !affectedRelationships.some(ar => ar.id === r.id);
      const needsAdjustment = (r.startTableId === tid && r.startFieldId > field.id) ||
                              (r.endTableId === tid && r.endFieldId > field.id);
      return isAffectedAndNotDeleted && needsAdjustment;
    });
    relationshipsBeforeModification = JSON.parse(JSON.stringify(relationsToAdjust));


    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.EDIT,
          element: ObjectType.TABLE,
          component: "field_delete",
          tid: tid,
          data: {
            field: JSON.parse(JSON.stringify(field)),
            deletedRelationships: JSON.parse(JSON.stringify(affectedRelationships)), // Relationships that will be deleted
            modifiedRelationshipsOriginalState: relationshipsBeforeModification, // Original state of relationships that are only modified
            modifiedSubtypeRelationship: modifiedSubtypeRelationship, // Original state of modified subtype relationship
            previousFields: previousFields,
            childFieldsSnapshot: JSON.parse(JSON.stringify(childFieldsSnapshot)),
          },
          message: t("edit_table", {
            tableName: currentTable.name,
            extra: "[delete field]",
          }),
        },
      ]);
      setRedoStack([]);
    }

    // Delete relationships (affectedRelationships)
    setRelationships((prevRels) => {
      const affectedRelIds = new Set(affectedRelationships.map((r) => r.id));
      let temp = prevRels.filter((r) => !affectedRelIds.has(r.id));

      // Adjust fieldId for remaining relationships and re-index their IDs
      temp = temp.map((r) => {
        const newRel = { ...r }; // Copia para modificar
        if (newRel.startTableId === tid && newRel.startFieldId > field.id) {
          newRel.startFieldId -= 1;
        }
        if (newRel.endTableId === tid && newRel.endFieldId > field.id) {
          newRel.endFieldId -= 1;
        }
        return newRel;
      });

      // Re-index IDs of all remaining relationships
      return temp.map((r, i) => ({ ...r, id: i }));
    });
    const updatedTables = [...tables];

    // Delete FKs in child tables if a composite PK is deleted
    if (isPartOfCompositePK) {
      affectedRelationships.forEach((rel) => {
        const childTable = updatedTables.find((t) => t.id === rel.endTableId);
        const fksToRemove = childTable.fields.filter(
          (f) =>
            f.foreignK &&
            f.foreignKey.tableId === tid &&
            pkFieldIds.includes(f.foreignKey.fieldId)
        );
        childTable.fields = childTable.fields
          .filter((f) => !fksToRemove.includes(f))
          .map((f, i) => ({ ...f, id: i }));
      });
    }

    // Delete FKs in child tables if a composite FK is deleted
    if (isPartOfCompositeFK && field.foreignK) {
      const fkTableId = field.foreignKey.tableId;
      const childTable = updatedTables[tid];
      childTable.fields = childTable.fields
        .filter(
          (f) =>
            !(
              f.foreignK &&
              f.foreignKey.tableId === fkTableId
            )
        )
        .map((f, i) => ({ ...f, id: i }));
    }

    // Delete any FK references in other tables
    updatedTables.forEach((table) => {
      table.fields = table.fields.filter(
        (f) =>
          !(
            f.foreignK &&
            f.foreignKey.tableId === tid &&
            f.foreignKey.fieldId === field.id
          )
      );
    });

    // Delete the field from the table
    updatedTables[tid].fields = updatedTables[tid].fields
      .filter((f) => f.id !== field.id)
      .map((f, i) => ({ ...f, id: i }));

    // Update the tables state
    updatedTables.forEach((table) => updateTable(table.id, { fields: table.fields }));
  };

  const addRelationship = (relationshipData, autoGeneratedFkFields, childTableIdForFks, addToHistory = true) => {
    if (addToHistory) {
      const newRelationshipId = relationships.reduce((maxId, r) => Math.max(maxId, typeof r.id === 'number' ? r.id : -1), -1) + 1;
      const newRelationshipWithId = { ...relationshipData, id: newRelationshipId };

      setRelationships((prev) => [...prev, newRelationshipWithId]);

      if(relationshipData.subtype)
      setUndoStack((prevUndo) => [
        ...prevUndo,
        {
          action: Action.ADD,
          element: ObjectType.RELATIONSHIP,
          data: {
            relationship: JSON.parse(JSON.stringify(newRelationshipWithId)),
            autoGeneratedFkFields: JSON.parse(JSON.stringify(autoGeneratedFkFields || [])),
            childTableIdWithGeneratedFks: childTableIdForFks,
          },
          message: t("add_relationship"),
        },
      ]);
      setRedoStack([]);
    } else {
      setRelationships((prevRels) => {
        let tempRels = [...prevRels];
        const idCollision = tempRels.some(r => r.id === relationshipData.id);
        const relationshipToInsert = { ...relationshipData };
        if (idCollision) {
          const maxId = tempRels.reduce((max, r) => Math.max(max, typeof r.id === 'number' ? r.id : -1), -1);
          relationshipToInsert.id = maxId + 1;
        }
        tempRels.push(relationshipToInsert);
        return tempRels.sort((a,b) => a.id - b.id).map((r, i) => ({ ...r, id: i }));
      });
    }
  };

  const deleteRelationship = (id, addToHistory = true) => {
    const relationshipToDelete = relationships.find(r => r.id === id);
    if (!relationshipToDelete) return;

    let childTableFieldsBeforeFkDeletion = null; // Save the state of child table fields before FK deletion (legacy format)
    let childTableIdWithModifiedFields = null; // Track which table's fields were saved (legacy format)
    let primaryChildTableId = null; // Primary child table for undo compatibility
    let allChildTablesFieldsBeforeFkDeletion = {}; // NEW: Save ALL child tables' fields before FK deletion
    // For subtype relationships with multiple children, handle each child
    if (relationshipToDelete.subtype && relationshipToDelete.endTableIds) {
      // Handle multiple children
      relationshipToDelete.endTableIds.forEach(childTableId => {
        const childTable = tables.find((table) => table.id === childTableId);
        if (childTable) {
          // Save ALL child tables' fields for complete restoration
          allChildTablesFieldsBeforeFkDeletion[childTableId] = JSON.parse(JSON.stringify(childTable.fields));
          // Save the first child table's fields (for undo compatibility with legacy format)
          if (childTableFieldsBeforeFkDeletion === null) {
            childTableFieldsBeforeFkDeletion = JSON.parse(JSON.stringify(childTable.fields));
            childTableIdWithModifiedFields = childTableId;
            primaryChildTableId = childTableId; // For undo stack reference
          }
          const allFkFieldsForThisParent = childTable.fields.filter(
            (field) =>
              field.foreignK === true &&
              field.foreignKey &&
              field.foreignKey.tableId === relationshipToDelete.startTableId
          );

          if (allFkFieldsForThisParent.length > 0) {
            const newChildFields = childTable.fields.filter(
              (field) => !allFkFieldsForThisParent.some(deletedField => deletedField.id === field.id)
            ).map((f, i) => ({ ...f, id: i }));

            updateTable(childTableId, { fields: newChildFields });
          }
        }
      });
    } else {
      // Handle single child (normal relationship or single-child subtype)
      const childTableId = relationshipToDelete.endTableId;
      const parentTableIdForFK = relationshipToDelete.startTableId;
      const childTable = tables.find((table) => table.id === childTableId);

      if (childTable) {
        // Save the state of child table fields before any modification
        childTableFieldsBeforeFkDeletion = JSON.parse(JSON.stringify(childTable.fields));
        allChildTablesFieldsBeforeFkDeletion[childTableId] = JSON.parse(JSON.stringify(childTable.fields));
        primaryChildTableId = childTableId; // For undo stack reference
        if (relationshipToDelete.subtype) {
          // already saved above
        }

        const allFkFieldsForThisParent = childTable.fields.filter(
          (field) =>
            field.foreignK === true &&
            field.foreignKey &&
            field.foreignKey.tableId === parentTableIdForFK
        );

        if (allFkFieldsForThisParent.length > 0) {
          const newChildFields = childTable.fields.filter(
            (field) => !allFkFieldsForThisParent.some(deletedField => deletedField.id === field.id)
          ).map((f, i) => ({ ...f, id: i }));

          updateTable(childTableId, { fields: newChildFields });
        }
      }
    }

    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.RELATIONSHIP,
          data: {
            relationship: JSON.parse(JSON.stringify(relationshipToDelete)),
            // Saving the complete state of child table fields BEFORE FK deletion (legacy format).
            childTableFieldsBeforeFkDeletion: childTableFieldsBeforeFkDeletion,
            childTableIdWithPotentiallyModifiedFields: childTableIdWithModifiedFields || primaryChildTableId || relationshipToDelete.endTableIds?.[0],
            // NEW: Save ALL child tables' fields for complete restoration
            allChildTablesFieldsBeforeFkDeletion: Object.keys(allChildTablesFieldsBeforeFkDeletion).length > 0 ? allChildTablesFieldsBeforeFkDeletion : null,
          },
          message: t("delete_relationship", {
            refName: relationshipToDelete.name,
          }),
        },
      ]);
      setRedoStack([]);
    }

    setRelationships((prev) =>
      prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, id: i })),
    );
  };

  const updateRelationship = (id, updatedValues) => {
    setRelationships((prev) =>
      prev.map((rel) => {
        if (rel.id === id) {
          let finalUpdatedValues = { ...updatedValues };
          // If subtype is being enabled, set relationshipType to 'subtype'
          if (updatedValues.subtype === true) {
            finalUpdatedValues.relationshipType = 'subtype';
          }
          // If subtype is being disabled, reset relationshipType to a default (e.g., one_to_one)
          else if (updatedValues.subtype === false) {
            finalUpdatedValues.relationshipType = 'one_to_one';
          }
          return { ...rel, ...finalUpdatedValues };
        }
        return rel;
      }),
    );
  };

  // Subtype relationship management functions
  const addChildToSubtype = (relationshipId, childTableId, shouldAddToUndoStack = true) => {
    // Critical validation: Prevent infinite loops
    if (typeof relationshipId !== 'number' || relationshipId < 0) {
      console.error("CRITICAL ERROR: Invalid relationshipId detected", { relationshipId, type: typeof relationshipId });
      return;
    }
    if (typeof childTableId !== 'number' || childTableId < 0) {
      console.error("CRITICAL ERROR: Invalid childTableId detected", { childTableId, type: typeof childTableId });
      return;
    }
    const relationshipToUpdate = relationships.find(rel => rel.id === relationshipId && rel.subtype);
    if (!relationshipToUpdate) {
      console.error("Relationship not found or not a subtype", relationshipId);
      return;
    }
    const endTableIds = relationshipToUpdate.endTableIds ||
      (relationshipToUpdate.endTableId !== undefined && relationshipToUpdate.endTableId !== null
        ? [relationshipToUpdate.endTableId]
        : []);
    const endFieldIds = relationshipToUpdate.endFieldIds ||
      (relationshipToUpdate.endFieldId !== undefined && relationshipToUpdate.endFieldId !== null
        ? [relationshipToUpdate.endFieldId]
        : []);
    // Verify that the child table is not already included
    if (endTableIds.includes(childTableId)) {
      console.warn("Child table already included in subtype relationship", childTableId);
      return;
    }
    // Verify that the child table is not the parent table
    if (relationshipToUpdate.startTableId === childTableId) {
      console.warn("Cannot add parent table as child in subtype relationship", {
        parentTableId: relationshipToUpdate.startTableId,
        childTableId: childTableId
      });
      return;
    }
    // Find the child table and get its first valid field
    const childTable = tables.find(t => t.id === childTableId);
    if (!childTable || !childTable.fields || childTable.fields.length === 0) {
      console.error("Child table not found or has no fields", childTableId);
      return;
    }
    // Find the parent table to get primary keys for FK generation
    const parentTable = tables.find(t => t.id === relationshipToUpdate.startTableId);
    if (!parentTable || !parentTable.fields || parentTable.fields.length === 0) {
      console.error("Parent table not found or has no fields", relationshipToUpdate.startTableId);
      return;
    }
    // Get primary key fields from parent table for FK generation
    const parentPkFields = parentTable.fields.filter(field => field.primary);
    if (parentPkFields.length === 0) {
      console.error("Parent table has no primary key fields", relationshipToUpdate.startTableId);
      return;
    }
    // Check if FK fields already exist in child table
    const existingFkFields = childTable.fields.filter(field =>
      field.foreignK &&
      field.foreignKey &&
      field.foreignKey.tableId === relationshipToUpdate.startTableId
    );
    let firstFieldId = childTable.fields[0].id;
    let newFkFields = [];
    // Generate FK fields only if they don't exist
    if (existingFkFields.length === 0) {
      // Generate new FK fields based on parent's primary keys
      newFkFields = parentPkFields.map((field, index) => ({
        name: `${field.name}`,
        type: field.type,
        size: field.size,
        notNull: true,
        unique: false,
        default: "",
        check: "",
        primary: true,
        increment: false,
        comment: `Foreign key referencing ${parentTable.name}.${field.name}`,
        foreignK: true,
        foreignKey: {
          tableId: parentTable.id,
          fieldId: field.id,
        },
        id: childTable.fields.reduce((maxId, f) => Math.max(maxId, typeof f.id === 'number' ? f.id : -1), -1) + 1 + index,
      }));
      // Update child table with new FK fields
      const updatedChildFields = [...childTable.fields, ...newFkFields];
      updateTable(childTableId, { fields: updatedChildFields });
      // Use the first new FK field as the reference
      if (newFkFields.length > 0) {
        firstFieldId = newFkFields[0].id;
      }
    } else {
      firstFieldId = existingFkFields[0].id;
    }
    const newEndTableIds = [...endTableIds, childTableId];
    const newEndFieldIds = [...endFieldIds, firstFieldId];
    // Register undo/redo action if requested
    if (shouldAddToUndoStack && typeof setUndoStack === 'function') {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.EDIT,
          element: ObjectType.RELATIONSHIP,
          rid: relationshipId,
          undo: {
            endTableIds: relationshipToUpdate.endTableIds,
            endFieldIds: relationshipToUpdate.endFieldIds,
            endTableId: relationshipToUpdate.endTableId,
            endFieldId: relationshipToUpdate.endFieldId,
            generatedFkFields: newFkFields.length > 0 ? newFkFields : null, // Store generated FK fields for undo
            childTableId: childTableId,
          },
          redo: {
            endTableIds: newEndTableIds,
            endFieldIds: newEndFieldIds,
            endTableId: undefined,
            endFieldId: undefined,
            generatedFkFields: newFkFields.length > 0 ? newFkFields : null, // Store generated FK fields for redo
            childTableId: childTableId,
          },
          message: `Add child table to subtype relationship with FK generation`,
        },
      ]);
      setRedoStack([]);
    }
    setRelationships(prev =>
      prev.map(rel => {
        if (rel.id === relationshipId && rel.subtype) {
          const updatedRel = {
            ...rel,
            endTableIds: newEndTableIds,
            endFieldIds: newEndFieldIds,
            endTableId: undefined, // Clear single reference when using array
            endFieldId: undefined,
            relationshipType: 'subtype', // Set specific type for subtype relationships
          };
          return updatedRel;
        }
        return rel;
      })
    );
  };

  const removeChildFromSubtype = (relationshipId, childTableId, shouldAddToUndoStack = true) => {
    const relationshipToUpdate = relationships.find(rel => rel.id === relationshipId && rel.subtype);
    if (!relationshipToUpdate) return;
    const endTableIds = relationshipToUpdate.endTableIds || [relationshipToUpdate.endTableId];
    const endFieldIds = relationshipToUpdate.endFieldIds || [relationshipToUpdate.endFieldId];
    const childIndex = endTableIds.indexOf(childTableId);
    if (childIndex > -1) {
      // Find the child table to remove FK fields
      const childTable = tables.find(t => t.id === childTableId);
      let removedFkFields = [];
      if (childTable) {
        // Find and collect FK fields that reference the parent table
        removedFkFields = childTable.fields.filter(field =>
          field.foreignK &&
          field.foreignKey &&
          field.foreignKey.tableId === relationshipToUpdate.startTableId
        );
        if (removedFkFields.length > 0) {
          // Remove FK fields from child table
          const updatedChildFields = childTable.fields.filter(field =>
            !(field.foreignK &&
              field.foreignKey &&
              field.foreignKey.tableId === relationshipToUpdate.startTableId)
          ).map((f, i) => ({ ...f, id: i })); // Re-index field IDs
          updateTable(childTableId, { fields: updatedChildFields });
        }
      }
      const newEndTableIds = endTableIds.filter((_, i) => i !== childIndex);
      const newEndFieldIds = endFieldIds.filter((_, i) => i !== childIndex);
      let newRelationshipState = {};
      let shouldDeleteRelationship = false;
      // If only one child remains, convert back to single endTableId format
      if (newEndTableIds.length === 1) {
        newRelationshipState = {
          endTableId: newEndTableIds[0],
          endFieldId: newEndFieldIds[0],
          endTableIds: undefined,
          endFieldIds: undefined,
          relationshipType: 'subtype', // Still a subtype with single child
        };
      } else if (newEndTableIds.length > 1) {
        newRelationshipState = {
          endTableIds: newEndTableIds,
          endFieldIds: newEndFieldIds,
          endTableId: undefined,
          endFieldId: undefined,
          relationshipType: 'subtype', // Still a subtype with multiple children
        };
      } else {
        // No children left, mark relationship for deletion
        shouldDeleteRelationship = true;
      }
      // Register undo/redo action if requested
      if (shouldAddToUndoStack && typeof setUndoStack === 'function') {
        if (shouldDeleteRelationship) {
          // When deleting the entire relationship, use DELETE action
          setUndoStack((prev) => [
            ...prev,
            {
              action: Action.DELETE,
              element: ObjectType.RELATIONSHIP,
              data: {
                relationship: JSON.parse(JSON.stringify(relationshipToUpdate)),
                removedFkFields: removedFkFields,
                childTableId: childTableId,
              },
              message: `Delete subtype relationship (last child removed) with FK cleanup`,
            },
          ]);
        } else {
          // When editing the relationship, use EDIT action
          setUndoStack((prev) => [
            ...prev,
            {
              action: Action.EDIT,
              element: ObjectType.RELATIONSHIP,
              rid: relationshipId,
              undo: {
                endTableIds: relationshipToUpdate.endTableIds,
                endFieldIds: relationshipToUpdate.endFieldIds,
                endTableId: relationshipToUpdate.endTableId,
                endFieldId: relationshipToUpdate.endFieldId,
                removedFkFields: removedFkFields, // Store removed FK fields for undo
                childTableId: childTableId,
              },
              redo: {
                ...newRelationshipState,
                removedFkFields: removedFkFields, // Store removed FK fields for redo
                childTableId: childTableId,
              },
              message: `Remove child table from subtype relationship with FK cleanup`,
            },
          ]);
        }
        setRedoStack([]);
      }
      if (shouldDeleteRelationship) {
        // Delete the entire relationship
        setRelationships(prev => prev.filter(rel => rel.id !== relationshipId).map((rel, i) => ({ ...rel, id: i })));
      } else {
        // Update the relationship
        setRelationships(prev =>
          prev.map(rel => {
            if (rel.id === relationshipId && rel.subtype) {
              return {
                ...rel,
                ...newRelationshipState,
              };
            }
            return rel;
          })
        );
      }
    }
  };

  const restoreFieldsToTable = (tableId, fieldsToRestore) => {
    if (!fieldsToRestore || fieldsToRestore.length === 0) return;

    setTables(prevTables => prevTables.map(t => {
      if (t.id === tableId) {
        let currentFields = [...t.fields];
        fieldsToRestore.forEach(fieldToRestore => {
          const existingAtIndex = currentFields.find(f => f.id === fieldToRestore.id);
          if (!existingAtIndex) { // Only add if the field with that ID does not already exist
            if (fieldToRestore.id >= 0 && fieldToRestore.id <= currentFields.length) {
              currentFields.splice(fieldToRestore.id, 0, JSON.parse(JSON.stringify(fieldToRestore)));
            } else {
              currentFields.push(JSON.parse(JSON.stringify(fieldToRestore))); // Add to the end if the ID is out of bounds
            }
          }
        });
        const reIndexedFields = currentFields.map((f, i) => ({ ...f, id: i }));

        return { ...t, fields: reIndexedFields };
      }
      return t;
    }));
  };

  return (
    <DiagramContext.Provider
      value={{
        tables,
        setTables,
        addTable,
        updateTable,
        updateField,
        deleteField,
        deleteTable,
        relationships,
        setRelationships,
        addRelationship,
        deleteRelationship,
        updateRelationship,
        addChildToSubtype,
        removeChildFromSubtype,
        restoreFieldsToTable,
        database,
        setDatabase,
        tablesCount: tables.length,
        relationshipsCount: relationships.length,
      }}
    >
      {children}
    </DiagramContext.Provider>
  );
}
