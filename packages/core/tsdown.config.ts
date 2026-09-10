import { defineConfig } from "tsdown";

export default defineConfig(({ watch }) => ({
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
  // Not the default `node`: that resolves the CJS `require("react")` calls
  // inside the bundled deps through a `createRequire("node:module")` shim,
  // which is an unresolvable import the moment the package reaches a browser.
  // (`neutral` would be the honest label for a package that also renders on
  // the server, but it refuses to resolve CJS deps without hand-written
  // `mainFields`, and nothing here has a browser-only build to pick.)
  //
  // It also folds `process.env.NODE_ENV` to production inside the bundled
  // deps, which is what leaves `dist` with zero `process` references. Their
  // dev warnings go with it, and that's the right trade: those warnings are
  // about props DayOS passes to `react-rnd`, not about anything the consumer
  // wrote. React itself stays external, so their own dev build is untouched.
  platform: "browser",
  // `platform` also decides the output extension, and the switch above would
  // silently rename `dist/index.mjs` to `dist/index.js` — out from under the
  // `exports` map, which is how the package resolves at all.
  fixedExtension: true,

  // `dist` is what the `exports` map points at, so deleting it is deleting the
  // package: tsdown cleans the output directory before every build, and in
  // `--watch` that leaves a ~1s window per rebuild where `dist/index.mjs`
  // doesn't exist. A dev server resolving the workspace link straight to that
  // file — Vite, again — lands in the window on the very save that triggered
  // the rebuild, and reports the package as unresolvable. Overwriting in place
  // keeps the entry readable throughout. One-shot builds still clean, so a
  // renamed entry can't leave a stale sibling behind in a published `dist`.
  clean: !watch,
  // `react-rnd` is an implementation detail, and shipping it as a runtime
  // dependency makes it the consumer's problem: `react-draggable` reads
  // `process.env.DRAGGABLE_DEBUG` on every drag start, which is a bare
  // `ReferenceError` in any bundler that doesn't shim `process` — Vite, for
  // one, where it means windows silently refuse to drag or resize. Bundling it
  // is what lets the `define` below reach it, so installing DayOS is the whole
  // setup.
  deps: {
    alwaysBundle: ["react-rnd"],
    // The rest of the list is `react-rnd`'s own tree, spelled out so the build
    // fails if that tree ever grows something unexpected.
    onlyBundle: ["react-rnd", "react-draggable", "re-resizable", "prop-types"],
  },
  define: {
    // Not `undefined`: the identifier itself is what's missing, so the
    // replacement has to remove the `process` reference and not just read a
    // different value off it. It folds to `if (false)` and the debug logging
    // drops out entirely.
    "process.env.DRAGGABLE_DEBUG": "false",
  },
  // Libraries usually ship unminified and let the consumer's bundler do it,
  // but the moment `dist` carries vendored code that reasoning inverts: a
  // pre-bundled dependency arrives wrapped in interop closures its minifier
  // can no longer see across. Minifying here is what keeps the bundled build
  // from costing the consumer anything — measured against the same app built
  // with `react-rnd` external, it comes out slightly smaller.
  minify: {
    compress: true,
    codegen: true,
    // The internal components (`WindowFrame`, `StaticWindowFrame`) are what
    // React DevTools labels the tree with, and mangling turns that tree into
    // single letters in the consumer's own debugging session. Keeping the
    // names costs ~0.5 kB gzipped.
    mangle: { keepNames: true },
  },
}));
