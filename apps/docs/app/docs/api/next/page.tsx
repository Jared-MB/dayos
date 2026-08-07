import { CodeBlock } from "../../../_components/code";
import { DocPage, docMetadata } from "../../../_components/doc-page";
import { Callout, Code, H2, H3, PropsTable } from "../../../_components/prose";

const HREF = "/docs/api/next";

export const metadata = docMetadata(HREF);

export default function Page() {
  return (
    <DocPage href={HREF}>
      <p>
        Everything <Code>@dayos/next</Code> exports. It is the only piece of
        DayOS that talks to Next, and it needs Next 16 with the App Router
        alongside <Code>@dayos/core</Code>.
      </p>

      <CodeBlock>{`import {
  RoutedDesktop,
  WindowRouteProvider,
  useDynamicWindows,
  useWindowRoute,
  type RouteParams,
  type RoutedDesktopProps,
} from "@dayos/next";`}</CodeBlock>

      <H2>WindowRouteProvider</H2>

      <p>
        The outermost piece. It takes the layout’s children and every route up
        front, and seeds the open window from the URL during render — which is
        what gets the right window into the server HTML.
      </p>

      <PropsTable
        rows={[
          {
            name: "content",
            type: "React.ReactNode",
            description:
              "The layout's children, i.e. whatever the current page returns. Passed as a prop rather than rendered as a child so the window it belongs to can claim it.",
          },
          {
            name: "routes",
            type: "readonly string[]",
            description: (
              <>
                <p>
                  Every route on the desktop, declared up front. A segment
                  written <Code>:like-this</Code> is a param and matches
                  anything.
                </p>
                <p>
                  It has to be the full list during render: a window that
                  registered itself from an effect would be too late for the
                  server to know which one the URL belonged to.
                </p>
              </>
            ),
          },
          {
            name: "children",
            type: "React.ReactNode",
            description: "The desktop, and everything on it.",
          },
        ]}
      />

      <CodeBlock filename="app/shell.tsx">{`const ROUTES = ["/", "/about", "/documents", "/documents/:file"] as const;

<WindowRouteProvider content={children} routes={ROUTES}>
  <RoutedDesktop className="desktop">{/* apps */}</RoutedDesktop>
</WindowRouteProvider>;`}</CodeBlock>

      <H2>RoutedDesktop</H2>

      <p>
        <Code>Desktop</Code> with its window state delegated to the provider. It
        is also the sole owner of the reverse sync, front window to URL — every
        window used to run that same sync, so N routed apps meant N{" "}
        <Code>replace</Code> calls per focus change.
      </p>

      <PropsTable
        rows={[
          {
            name: "exitHref",
            type: "string",
            default: '"/"',
            description: "Where the URL goes when no window is left open.",
          },
          {
            name: "...props",
            type: "DesktopProps",
            description:
              "Everything Desktop takes except openWindows, defaultOpenWindows and onOpenWindowsChange — those belong to the provider.",
          },
        ]}
      />

      <H3>How it syncs</H3>

      <ul>
        <li>
          It navigates with <Code>replace</Code>, not <Code>push</Code>:
          focusing a window is not navigating, and pushing would make the back
          button walk through every focus change instead of the pages visited.
        </li>
        <li>
          It passes <Code>scroll: false</Code>, so a window coming to the front
          is not scrolled back to its top. Nothing about the page changed, so
          nothing should move.
        </li>
        <li>
          It remembers each window’s last real URL, query and hash included.
          Returning to a window does not wipe the params it had.
        </li>
        <li>
          A window whose id no route claims is left alone — an unrouted app does
          not touch the URL.
        </li>
      </ul>

      <H2>useWindowRoute</H2>

      <p>
        The content of the containing app’s route. Live while that route is
        current, frozen once focus moves elsewhere.
      </p>

      <CodeBlock>{`function AppShell() {
  const content = useWindowRoute();

  return (
    <Window>
      <WindowContent>{content}</WindowContent>
    </Window>
  );
}`}</CodeBlock>

      <p>
        Returns <Code>null</Code> for a window that has never been the current
        route. It throws when the containing <Code>DesktopApp</Code> has no
        explicit id — the id is the href, and without one there is no route to
        return.
      </p>

      <Callout>
        <p>
          Call it inside the <Code>DesktopApp</Code>, not in the component that
          renders one. That is where the id it reads lives, which is why the
          usual shape is a small <Code>App</Code> wrapper around an{" "}
          <Code>AppShell</Code>.
        </p>
      </Callout>

      <H3>Why freezing takes more than keeping the node</H3>

      <p>
        What the router hands over is not content but a pointer to the active
        segment, so re-rendering a kept node paints the current route and every
        window ends up showing the same thing. Alongside the node, the hook
        stores the router context that was in place when this was the active
        route and re-provides it, which makes the node resolve back to its own
        segment.
      </p>

      <H2>useDynamicWindows</H2>

      <p>
        The windows a pattern has open right now, so an app can render one{" "}
        <Code>DesktopApp</Code> per instance.
      </p>

      <CodeBlock>{`function useDynamicWindows(
  pattern: string,
): { href: string; params: RouteParams }[];`}</CodeBlock>

      <CodeBlock>{`{useDynamicWindows("/documents/:file").map(({ href, params }) => (
  <DocumentApp file={params.file} href={href} key={href} />
))}`}</CodeBlock>

      <p>
        The list comes from the desktop’s open windows rather than from state of
        your own — the desktop already knows which documents are open. Only
        windows the pattern itself claims are returned, so declaring{" "}
        <Code>/documents/new</Code> alongside <Code>/documents/:file</Code>{" "}
        keeps that one out of the list.
      </p>

      <H2>RouteParams</H2>

      <p>
        What a pattern’s params resolved to, keyed by the name after the colon.
        Values arrive decoded, the way a Next page’s params do.
      </p>

      <CodeBlock>{`type RouteParams = Record<string, string>;`}</CodeBlock>

      <CodeBlock>{`// "/documents/annual%20report" against "/documents/:file"
{ file: "annual report" }`}</CodeBlock>

      <H2>RoutedDesktopProps</H2>

      <CodeBlock>{`type RoutedDesktopProps = Omit<
  DesktopProps,
  "openWindows" | "defaultOpenWindows" | "onOpenWindowsChange"
> & {
  exitHref?: string;
};`}</CodeBlock>

      <H2>A note on internals</H2>

      <Callout type="warning">
        <p>
          The adapter imports <Code>LayoutRouterContext</Code> from{" "}
          <Code>next/dist</Code>, which is not part of Next’s public API. It is
          the price of per-window content without parallel routes. If a Next
          update moves that module the package stops compiling, which is the
          loud failure rather than the quiet one — but it is worth knowing the
          coupling is there.
        </p>
      </Callout>
    </DocPage>
  );
}
