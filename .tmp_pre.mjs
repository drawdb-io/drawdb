import { preprocessForSqlite } from "./src/utils/importSQL/preprocessSqlite.js";
import { readFileSync } from "fs";

for (const f of ["C:/Users/X/Stock/xueqiu_scraper/docs/完整SQL/local_schema.sql",
                 "C:/Users/X/Stock/xueqiu_scraper/docs/完整SQL/d1_schema.sql"]) {
  const src = readFileSync(f, "utf8");
  const { columnComments, tableComments } = preprocessForSqlite(src);
  const tblCount = Object.keys(tableComments).length;
  const colCount = Object.values(columnComments).reduce((a,m)=>a+Object.keys(m).length,0);
  console.log("\n=== " + f.split(/[\/]/).pop() + " ===");
  console.log("tables with comment:", tblCount, "| total column comments:", colCount);
  console.log("-- sample table comments --");
  let shown = 0;
  for (const [t,c] of Object.entries(tableComments)) {
    if (shown++ < 6) console.log("  " + t + "  =>  " + c);
  }
  // sanity: any empty?
  const empties = Object.entries(tableComments).filter(([t,c])=>!c.trim());
  if (empties.length) console.log("  WARNING empty table comments:", empties.map(e=>e[0]).join(", "));
}
