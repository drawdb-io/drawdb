import { ObjectType, Tab } from "../data/constants.js";

export function openRelationshipEditorSelection(previous, id, sidebar) {
  return {
    ...previous,
    ...(sidebar ? { currentTab: Tab.RELATIONSHIPS } : {}),
    element: ObjectType.RELATIONSHIP,
    id,
    open: true,
  };
}
