/* eslint-env jest */
import { toOracle } from "../src/utils/exportSQL/oracle.js";
import { DB } from "../src/data/constants.js";

describe("toOracle", () => {
  test("test for unique index creation", () => {
    const diagram = {
      database: DB.ORACLE,
      tables: [
        {
          name: "mochila",
          fields: [
            {
              name: "mochila_id",
              type: "NUMBER",
              size: "10,0",
              notNull: true,
              primary: true,
              default: "",
            },
            {
              name: "capacidad_kg",
              type: "NUMBER",
              size: "2,0",
              notNull: true,
              default: "",
            },
          ],
          indices: [
            {
              name: "mochila_index_0",
              fields: ["mochila_id"],
              unique: true,
            }
          ],
        },
      ],
      references: [],
    };

    const expectedSQL = `CREATE TABLE mochila (
\t"mochila_id" NUMBER(10,0) NOT NULL,
\t"capacidad_kg" NUMBER(2,0) NOT NULL,
\tCONSTRAINT mochila_pk PRIMARY KEY("mochila_id")
);


CREATE UNIQUE INDEX "mochila_index_0" ON mochila ("mochila_id");
`;   

    const result = toOracle(diagram);
    expect(result.trim()).toBe(expectedSQL.trim());
  });
});
