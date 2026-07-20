import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom doesn't implement it and `Window` uses it to re-clamp against the
// desktop.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("next/navigation", async () => {
  const { useSyncExternalStore } = await import("react");
  const { router, subscribePathname, getPathname } = await import(
    "./next-router"
  );

  return {
    // Reactive like Next's: navigating has to re-render whoever reads the
    // pathname, otherwise the URL ↔ window sync is only half tested.
    usePathname: () =>
      useSyncExternalStore(subscribePathname, getPathname, getPathname),
    useRouter: () => router,
  };
});

afterEach(async () => {
  cleanup();
  const { resetRouter } = await import("./next-router");
  resetRouter();
});
