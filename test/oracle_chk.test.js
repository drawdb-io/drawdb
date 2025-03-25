/* eslint-env jest */
import { toOracle } from "../src/utils/exportSQL/oracle.js";
import { DB } from "../src/data/constants.js";

describe("toOracle", () => {
  test("test for check constraint in any field of a table", () => {
    const diagram = {
      database: DB.ORACLE,
      tables: [
        {
          name: "salon",
          fields: [
            {
              name: "salon_id",
              type: "NUMBER",
              size: "10,0",
              notNull: true,
              primary: true,
              default: "",
            },
            {
              name: "capacidad",
              type: "NUMBER",
              size: "10,0",
              notNull: true,
              default: "",
              check: "> 0",
            },
          ],
          indices: [],
        },
      ],
      references: [],
    };

    const expectedSQL = `CREATE TABLE salon (
\t"salon_id" NUMBER(10,0) NOT NULL,
\t"capacidad" NUMBER(10,0) NOT NULL,
\tCONSTRAINT salon_capacidad_chk CHECK("capacidad" > 0),
\tCONSTRAINT salon_pk PRIMARY KEY("salon_id")
);`;   

    const result = toOracle(diagram);
    expect(result.trim()).toBe(expectedSQL.trim());
  });
});
