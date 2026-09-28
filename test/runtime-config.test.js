import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";

import {
  resolveBackendUrl,
  resolveGistBackendUrl,
} from "../src/config/runtime.js";

const encode = (value) => Buffer.from(value, "utf8").toString("base64");

test("runtime backend URL overrides the build-time URL", () => {
  const runtimeUrl = "https://服务.example.com/api?value='\"<script>";

  assert.equal(
    resolveBackendUrl(
      { VITE_BACKEND_URL: encode(runtimeUrl) },
      { VITE_BACKEND_URL: "https://build.example.com" },
    ),
    runtimeUrl,
  );
});

test("backend URLs have trailing slashes removed", () => {
  assert.equal(
    resolveBackendUrl(
      { VITE_BACKEND_URL: encode("https://runtime.example.com///") },
      {},
    ),
    "https://runtime.example.com",
  );
  assert.equal(
    resolveGistBackendUrl(
      {},
      {
        VITE_GIST_BACKEND_URL: "https://build.example.com/",
      },
    ),
    "https://build.example.com",
  );
});

test("gist URL uses runtime settings in specificity order", () => {
  const runtimeConfig = {
    VITE_BACKEND_URL: encode("https://runtime.example.com"),
    VITE_GIST_BACKEND_URL: encode("https://gists.example.com"),
  };

  assert.equal(
    resolveGistBackendUrl(runtimeConfig, {
      VITE_GIST_BACKEND_URL: "https://build-gists.example.com",
    }),
    "https://gists.example.com",
  );
});

test("runtime backend URL overrides build-time gist settings", () => {
  assert.equal(
    resolveGistBackendUrl(
      { VITE_BACKEND_URL: encode("https://runtime.example.com") },
      { VITE_GIST_BACKEND_URL: "https://build-gists.example.com" },
    ),
    "https://runtime.example.com",
  );
});

test("build-time and local defaults remain available", () => {
  assert.equal(
    resolveBackendUrl({}, { VITE_BACKEND_URL: "https://build.example.com" }),
    "https://build.example.com",
  );
  assert.equal(resolveBackendUrl({}, {}), undefined);
  assert.equal(resolveGistBackendUrl({}, {}), "http://localhost:5000");
});

test("malformed runtime values fall back to build-time settings", () => {
  for (const malformedValue of ["not valid base64", "/w==", "AB=="]) {
    assert.equal(
      resolveBackendUrl(
        { VITE_BACKEND_URL: malformedValue },
        { VITE_BACKEND_URL: "https://build.example.com" },
      ),
      "https://build.example.com",
    );
  }
});
