/* eslint-env jest */
import { toOracle } from "../src/utils/exportSQL/oracle.js";
import { DB } from "../src/data/constants.js";

describe("toOracle", () => {
  test("test for unique constraints", () => {
    const diagram = {
      database: DB.ORACLE,
      tables: [
        {
          name: "computador",
          fields: [
            {
              name: "computador_id",
              type: "NUMBER",
              size: "10,0",
              notNull: true,
              primary: true,
              default: "",
            },
            {
              name: "num_serie",
              type: "VARCHAR2",
              size: 40,
              notNull: true,
              unique: true,
              default: "",
            },
          ],
          indices: [],
        },
      ],
      references: [],
    };

    const expectedSQL = `CREATE TABLE computador (
\t"computador_id" NUMBER(10,0) NOT NULL,
\t"num_serie" VARCHAR2(40) NOT NULL,
\tCONSTRAINT computador_num_serie_uk UNIQUE("num_serie"),
\tCONSTRAINT computador_pk PRIMARY KEY("computador_id")
);`;

    const result = toOracle(diagram);
    expect(result.trim()).toBe(expectedSQL.trim());
  });
});