/* eslint-env jest */
import { toOracle } from "../src/utils/exportSQL/oracle.js";
import { DB } from "../src/data/constants.js";

describe("toOracle", () => {
  test("should generate correct Oracle SQL for tables with relationships", () => {
    const diagram = {
      database: DB.ORACLE,
      tables: [
        {
          name: "casa",
          fields: [
            {
              name: "id",
              type: "NUMBER",
              size: "10,0",
              notNull: true,
              unique: true,
              primary: true,
              default: ""
            },
            {
              name: "xd",
              type: "VARCHAR",
              size: "255",
              notNull: true,
              default: ""
            }
          ],
          indices: []
        },
        {
          name: "cuarto",
          fields: [
            {
              name: "id",
              type: "NUMBER",
              unique: true,
              primary: true,
              default: ""
            }
          ],
          indices: []
        }
      ],
      references: [
        {
          startTableId: 0,
          startFieldId: 0,
          endTableId: 1,
          endFieldId: 0
        }
      ]
    };

    const expectedSQL = `CREATE TABLE casa (
\t"id" NUMBER(10,0) NOT NULL,
\t"xd" VARCHAR(255) NOT NULL,
\tCONSTRAINT casa_pk PRIMARY KEY("id")
);


CREATE TABLE cuarto (
\t"id" NUMBER,
\tCONSTRAINT cuarto_pk PRIMARY KEY("id")
);


ALTER TABLE casa ADD CONSTRAINT casa_id_fk
FOREIGN KEY("id") REFERENCES cuarto("id");`;

    const result = toOracle(diagram);
    expect(result.trim()).toBe(expectedSQL.trim());
  });
}); 