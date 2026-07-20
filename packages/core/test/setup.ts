import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom doesn't implement it and `Window` uses it to re-clamp against the
// desktop.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(cleanup);
