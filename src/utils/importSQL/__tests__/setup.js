import { init } from "@guanmingchiu/sqlparser-ts";
import { beforeAll } from "vitest";

beforeAll(async () => {
  await init();
});
