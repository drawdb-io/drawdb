import { generateSampleData } from "../generateSampleData";

describe("generateSampleData utility", () => {
  it("produces unique table keys and numeric float values", () => {
    const tables = [
      { id: 1, name: "users", fields: [{ name: "id", type: "int" }, { name: "score", type: "float" }] },
      { id: 2, name: "users", fields: [{ name: "id", type: "int" }] },
    ];
    const data = generateSampleData(tables, 2);
    // ensure both tables exist by composite key
    expect(Object.keys(data)).toContain("users_1");
    expect(Object.keys(data)).toContain("users_2");
    // float value should be number not string
    const row = data["users_1"][0];
    expect(typeof row.score).toBe("number");
  });
});