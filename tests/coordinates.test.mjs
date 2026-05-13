import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(tmpdir(), "vision-review-coordinate-tests");
const compiledFile = resolve(outDir, "src/lib/coordinates.js");

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
execFileSync(
  resolve(root, "node_modules/.bin/tsc"),
  [
    "--project",
    "tsconfig.json",
    "--outDir",
    outDir,
    "--module",
    "NodeNext",
    "--moduleResolution",
    "NodeNext",
    "--noEmit",
    "false"
  ],
  { cwd: root, stdio: "inherit" }
);

const {
  getContainedImageRect,
  normalizedBoxToRenderBox
} = await import(pathToFileURL(compiledFile).href);

test("normalized box renders correctly when the original image is scaled down proportionally", () => {
  const renderBox = normalizedBoxToRenderBox(
    { x: 0.5, y: 0.5, width: 0.1, height: 0.1 },
    { left: 0, top: 0, width: 585, height: 1266 }
  );

  assert.deepEqual(renderBox, {
    left: 292.5,
    top: 633,
    width: 58.5,
    height: 126.60000000000001
  });
});

test("contain mode accounts for horizontal letterboxing", () => {
  const imageRect = getContainedImageRect({
    containerWidth: 800,
    containerHeight: 600,
    naturalWidth: 400,
    naturalHeight: 400
  });
  const renderBox = normalizedBoxToRenderBox(
    { x: 0, y: 0, width: 1, height: 1 },
    imageRect
  );

  assert.deepEqual(imageRect, {
    left: 100,
    top: 0,
    width: 600,
    height: 600,
    scale: 1.5
  });
  assert.deepEqual(renderBox, { left: 100, top: 0, width: 600, height: 600 });
});

test("contain mode accounts for vertical letterboxing", () => {
  const imageRect = getContainedImageRect({
    containerWidth: 600,
    containerHeight: 800,
    naturalWidth: 600,
    naturalHeight: 300
  });
  const renderBox = normalizedBoxToRenderBox(
    { x: 0, y: 0, width: 1, height: 1 },
    imageRect
  );

  assert.deepEqual(imageRect, {
    left: 0,
    top: 250,
    width: 600,
    height: 300,
    scale: 1
  });
  assert.deepEqual(renderBox, { left: 0, top: 250, width: 600, height: 300 });
});
