import { describe, it, expect } from "vitest";
import {
  buildSQLFromAST,
  getTypeName,
  getTypeSize,
  getTableName,
  getIndexColumnName,
  mapReferentialAction,
  extractDefaultValue,
} from "../shared";
import { DB } from "../../../data/constants";

describe("getTypeName", () => {
  it("handles string data types", () => {
    expect(getTypeName("Date")).toBe("DATE");
    expect(getTypeName("Text")).toBe("TEXT");
    expect(getTypeName("Boolean")).toBe("BOOLEAN");
    expect(getTypeName("Real")).toBe("REAL");
  });

  it("handles object data types with empty value (unit variants)", () => {
    expect(getTypeName({ Int: {} })).toBe("INT");
    expect(getTypeName({ BigInt: {} })).toBe("BIGINT");
    expect(getTypeName({ SmallInt: {} })).toBe("SMALLINT");
    expect(getTypeName({ Blob: {} })).toBe("BLOB");
  });

  it("handles parameterized data types", () => {
    expect(getTypeName({ Varchar: { IntegerLength: { length: 255 } } })).toBe(
      "VARCHAR",
    );
    expect(
      getTypeName({ Decimal: { PrecisionAndScale: [10, 2] } }),
    ).toBe("DECIMAL");
  });
});

describe("getTypeSize", () => {
  it("returns null for string types", () => {
    expect(getTypeSize("Date")).toBeNull();
  });

  it("returns null for unit variant types", () => {
    expect(getTypeSize({ Int: {} })).toBeNull();
  });

  it("extracts length from parameterized types", () => {
    expect(getTypeSize({ Varchar: { IntegerLength: { length: 255 } } })).toEqual(
      { length: 255 },
    );
  });

  it("extracts precision and scale", () => {
    expect(
      getTypeSize({ Decimal: { PrecisionAndScale: [10, 2] } }),
    ).toEqual({ length: 10, scale: 2 });
  });
});

describe("getTableName", () => {
  it("extracts name from simple ObjectName", () => {
    const name = [{ Identifier: { value: "users" } }];
    expect(getTableName(name)).toBe("users");
  });

  it("extracts name from schema-qualified ObjectName", () => {
    const name = [
      { Identifier: { value: "public" } },
      { Identifier: { value: "users" } },
    ];
    expect(getTableName(name)).toBe("users");
  });
});

describe("getIndexColumnName", () => {
  it("extracts column name from index column", () => {
    const col = {
      column: { expr: { Identifier: { value: "email" } } },
    };
    expect(getIndexColumnName(col)).toBe("email");
  });
});

describe("mapReferentialAction", () => {
  it("maps known actions", () => {
    expect(mapReferentialAction("Cascade")).toBe("Cascade");
    expect(mapReferentialAction("SetNull")).toBe("Set null");
    expect(mapReferentialAction("SetDefault")).toBe("Set default");
    expect(mapReferentialAction("NoAction")).toBe("No action");
    expect(mapReferentialAction("Restrict")).toBe("Restrict");
  });

  it("returns No action for undefined", () => {
    expect(mapReferentialAction(undefined)).toBe("No action");
  });
});

describe("extractDefaultValue", () => {
  it("extracts string default", () => {
    const expr = { Value: { value: { SingleQuotedString: "hello" } } };
    expect(extractDefaultValue(expr)).toBe("hello");
  });

  it("extracts numeric default", () => {
    const expr = { Value: { value: { Number: ["42", false] } } };
    expect(extractDefaultValue(expr)).toBe("42");
  });

  it("extracts NULL default", () => {
    const expr = { Value: { value: "Null" } };
    expect(extractDefaultValue(expr)).toBe("NULL");
  });

  it("extracts function default", () => {
    const expr = {
      Function: {
        name: [{ Identifier: { value: "CURRENT_TIMESTAMP" } }],
        args: "None",
      },
    };
    expect(extractDefaultValue(expr)).toBe("CURRENT_TIMESTAMP");
  });

  it("extracts boolean default", () => {
    const expr = { Value: { value: { Boolean: true } } };
    expect(extractDefaultValue(expr)).toBe("TRUE");
  });
});

describe("buildSQLFromAST", () => {
  it("builds binary expression", () => {
    const expr = {
      BinaryOp: {
        left: { Identifier: { value: "age" } },
        op: "Gt",
        right: { Value: { value: { Number: ["0", false] } } },
      },
    };
    expect(buildSQLFromAST(expr, DB.MYSQL)).toBe("`age` > 0");
  });

  it("builds nested expressions", () => {
    const expr = {
      Nested: {
        BinaryOp: {
          left: { Identifier: { value: "x" } },
          op: "Gt",
          right: { Value: { value: { Number: ["1", false] } } },
        },
      },
    };
    expect(buildSQLFromAST(expr, DB.MYSQL)).toBe("(`x` > 1)");
  });

  it("builds function expressions", () => {
    const expr = {
      Function: {
        name: [{ Identifier: { value: "LENGTH" } }],
        args: [
          {
            Unnamed: {
              Expr: { Identifier: { value: "name" } },
            },
          },
        ],
      },
    };
    expect(buildSQLFromAST(expr, DB.MYSQL)).toBe("LENGTH(`name`)");
  });

  it("handles string values", () => {
    const expr = {
      Value: { value: { SingleQuotedString: "test" } },
    };
    expect(buildSQLFromAST(expr, DB.MYSQL)).toBe("'test'");
  });

  it("handles NULL", () => {
    const expr = { Value: { value: "Null" } };
    expect(buildSQLFromAST(expr, DB.MYSQL)).toBe("NULL");
  });

  it("handles IS NULL", () => {
    const expr = { IsNull: { Identifier: { value: "col" } } };
    expect(buildSQLFromAST(expr, DB.MYSQL)).toBe("`col` IS NULL");
  });
});
