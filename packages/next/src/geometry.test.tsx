import { windowRect } from "@dayos/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoutedApp, TEST_ROUTES } from "../test/fixtures";
import { setLocation } from "../test/next-router";
import { RoutedDesktop, WindowRouteProvider } from "./index";

/**
 * The frame the server serves doesn't use `Rnd` — there's no viewport to
 * measure — so it expresses its geometry in CSS, while the real window gets it
 * in px from `windowRect`. If the two drift apart, the user sees the window
 * jump on hydration. These tests resolve the CSS to px and compare it against
 * the function.
 *
 * The comparison isn't done by mounting the window and reading its `transform`:
 * jsdom doesn't compute layout, so react-rnd adjusts the position against
 * zeroed rects and the value left in the DOM isn't the one a browser gives.
 */
const DESKTOP = { width: 1000, height: 800 };

/** Resolves the CSS shapes the static frame emits against a container. */
const resolveCss = (value: string, container: number) => {
  const percent = value.match(/^([\d.]+)%$/);
  if (percent) return (Number(percent[1]) / 100) * container;

  const calc = value.match(/^calc\(([\d.]+)% - ([\d.]+)px\)$/);
  if (calc) return (Number(calc[1]) / 100) * container - Number(calc[2]);

  return Number.parseFloat(value);
};

const tree = (props?: { defaultSize?: { width: number; height: number } }) => {
  setLocation("/github");

  return (
    <WindowRouteProvider content={null} routes={TEST_ROUTES}>
      <RoutedDesktop>
        <RoutedApp href="/github" {...props} />
      </RoutedDesktop>
    </WindowRouteProvider>
  );
};

/** The static frame's geometry, already resolved to px against the desktop. */
function staticGeometry(props?: {
  defaultSize?: { width: number; height: number };
}) {
  const html = renderToStaticMarkup(tree(props));
  // Anchored on `data-window` and not on classes: DayOS emits none, and
  // whatever the consumer brings is none of this test's business.
  const style = html.match(/data-window=""[^>]*?style="([^"]*)"/);

  if (!style?.[1])
    throw new Error("the static frame was not found in the HTML");

  const declarations = Object.fromEntries(
    style[1].split(";").map((decl) => decl.split(/:(.*)/).slice(0, 2)),
  ) as Record<string, string | undefined>;

  /** A missing declaration: the frame changed and the test no longer measures what it thinks. */
  const declared = (property: string) => {
    const value = declarations[property];

    if (value === undefined)
      throw new Error(`the static frame did not declare ${property}`);

    return value;
  };

  return {
    width: resolveCss(declared("width"), DESKTOP.width),
    height: resolveCss(declared("height"), DESKTOP.height),
    x: resolveCss(declared("left"), DESKTOP.width),
    y: resolveCss(declared("top"), DESKTOP.height),
  };
}

describe("the server frame lands where the real window will sit", () => {
  const rect = (defaultSize?: { width: number; height: number }) =>
    windowRect({
      desktopWidth: DESKTOP.width,
      desktopHeight: DESKTOP.height,
      defaultSize,
    });

  it("with the default size", () => {
    expect(staticGeometry()).toEqual(rect());
  });

  it("with a defaultSize in px", () => {
    const defaultSize = { width: 760, height: 540 };

    expect(staticGeometry({ defaultSize })).toEqual(rect(defaultSize));
  });

  // Pins the value on top of the match: without this, two equally broken
  // implementations would still pass the test.
  it("and that position is the center of the desktop", () => {
    expect(staticGeometry()).toEqual({
      width: DESKTOP.width * 0.7,
      height: DESKTOP.height * 0.7,
      x: (DESKTOP.width - DESKTOP.width * 0.7) / 2,
      y: (DESKTOP.height - DESKTOP.height * 0.7) / 2,
    });
  });
});
