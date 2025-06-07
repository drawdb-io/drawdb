import { tableFieldHeight, tableHeaderHeight, tableColorStripHeight } from "../data/constants";

function getTableHeight(table) {
  return table.fields.length * tableFieldHeight + tableHeaderHeight + tableColorStripHeight;
}

export { getTableHeight };
