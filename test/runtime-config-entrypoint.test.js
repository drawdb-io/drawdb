import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import vm from "node:vm";

function getShell() {
  if (process.platform !== "win32") {
    return "sh";
  }

  const gitBash = path.join(
    process.env.ProgramFiles || "C:\\Program Files",
    "Git",
    "bin",
    "bash.exe",
  );
  return existsSync(gitBash) ? gitBash : "sh";
}

test("the Docker entrypoint safely serializes runtime URLs", () => {
  const backendUrl = `https://服务.example.com/api?value='"</script>&line=
second`;
  const gistBackendUrl = "https://gists.example.com/path?x=1&y=2";
  const result = spawnSync(
    getShell(),
    ["docker/40-drawdb-runtime-config.sh", "-"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        VITE_BACKEND_URL: backendUrl,
        VITE_GIST_BACKEND_URL: gistBackendUrl,
      },
    },
  );

  assert.equal(result.status, 0, result.stderr);

  const context = {};
  vm.runInNewContext(result.stdout, context);
  const config = context.__DRAWDB_RUNTIME_CONFIG__;
  const decode = (value) => Buffer.from(value, "base64").toString("utf8");

  assert.equal(decode(config.VITE_BACKEND_URL), backendUrl);
  assert.equal(decode(config.VITE_GIST_BACKEND_URL), gistBackendUrl);
  assert.ok(Object.isFrozen(config));
});
