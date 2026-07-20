import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.tsx"],
  format: "esm",
  dts: true,
  // Without this the bundler resolves `next/navigation` against the disk and
  // emits `next/navigation.js`. That works today because Next declares no
  // `exports`, and stops working the day it does.
  external: [/^next(\/.*)?$/],
});
