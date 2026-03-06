import { dbToTypes } from "./datatypes";
import { DB } from "./constants";

describe("MYPRIMETYPE datatype", () => {
  const supportedDatabases = [
    DB.GENERIC,
    DB.MYSQL,
    DB.POSTGRES,
    DB.SQLITE,
    DB.MSSQL,
    DB.MARIADB,
    DB.ORACLESQL,
  ];

  it("is available in all supported database maps", () => {
    supportedDatabases.forEach((database) => {
      expect(dbToTypes[database].MYPRIMETYPE).toBeTruthy();
      expect(dbToTypes[database].MYPRIMETYPE.type).toBe("MYPRIMETYPE");
    });
  });

  it("accepts allowed default values", () => {
    const checkDefault = dbToTypes[DB.GENERIC].MYPRIMETYPE.checkDefault;
    ["1", "3", "5", "7", "9", "11"].forEach((value) => {
      expect(checkDefault({ default: value })).toBe(true);
    });
  });

  it("rejects disallowed default values", () => {
    const checkDefault = dbToTypes[DB.GENERIC].MYPRIMETYPE.checkDefault;
    ["0", "2", "4", "-3", "1.5", "abc", ""].forEach((value) => {
      expect(checkDefault({ default: value })).toBe(false);
    });
  });
});
