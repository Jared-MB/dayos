import { CodeBlock } from "../../_components/code";
import { DocPage, docMetadata } from "../../_components/doc-page";
import { Callout, Card, Cards, Code, H2, H3 } from "../../_components/prose";

const HREF = "/docs/server-rendering";

export const metadata = docMetadata(HREF);

export default function Page() {
  return (
    <DocPage href={HREF}>
      <p>
        A desktop that renders empty on the server and fills in on hydration
        gives you a flash of nothing, content search engines cannot see, and a
        window that jumps into place once React arrives. DayOS avoids all three,
        and the way it does it is worth understanding before you debug it.
      </p>

      <H2>The two frames</H2>

      <p>
        A window renders one of two ways depending on whether there is a desktop
        node to portal into.
      </p>

      <H3>With a desktop: the interactive frame</H3>

      <p>
        Once mounted, the window portals into the desktop element and is
        draggable and resizable. This is the normal case, and it is what you see
        in the browser.
      </p>

      <H3>Without one: the static frame</H3>

      <p>
        On the server — and on the hydration render, where the desktop node is
        equally unknown — the window renders in place, with the same accessible
        markup and no dragging. It carries <Code>data-window</Code> so you can
        tell them apart in the DOM.
      </p>

      <p>
        Its geometry is expressed in CSS rather than computed pixels, because
        the server does not know the viewport. The values are chosen to land
        exactly where the interactive frame will put the window on mount:
        centred, at 70% of the desktop.
      </p>

      <CodeBlock language="css">{`/* No defaultSize: a percentage that matches the 70% the mounted window uses. */
width: 70%;
height: 70%;
left: 15%;
top: 15%;

/* With a defaultSize: pixels, centred the way calc can express it. */
width: 520px;
height: 460px;
left: calc(50% - 260px);
top: calc(50% - 230px);`}</CodeBlock>

      <Callout title="Why this matters">
        <p>
          If the two frames disagreed, the swap on hydration would read as a
          jump. This is not hypothetical: it is what happened when the static
          frame came out in the corner. The maths is shared and there is a test
          comparing them, so a change to one has to be a change to both.
        </p>
      </Callout>

      <H2>Which windows are open on the server</H2>

      <p>
        Only what the desktop is told during render. With the core alone that
        means <Code>defaultOpenWindows</Code>:
      </p>

      <CodeBlock>{`<Desktop defaultOpenWindows={["notes"]}>`}</CodeBlock>

      <p>
        <Code>DesktopApp</Code>’s <Code>defaultOpen</Code> does not count. It
        runs in an effect, so it opens the window on the client only — an app
        can seed itself but not the desktop’s initial state, which belongs to
        its parent.
      </p>

      <H2>With the Next adapter</H2>

      <p>
        This is the adapter’s entire reason for existing.{" "}
        <Code>WindowRouteProvider</Code> works out which window the requested
        URL belongs to during the same render, so the matching window is born
        open:
      </p>

      <CodeBlock>{`const [openWindows, setOpenWindows] = useState<string[]>(() => {
  const match = findRoute(routes, pathname);
  return match ? [match] : [];
});`}</CodeBlock>

      <p>
        The result is that requesting <Code>/about</Code> returns HTML with the
        About window open and the About page’s content inside it. While this
        lived in an effect, the HTML always came out with an empty desktop and
        the page’s content was thrown away — there was no window around to claim
        it.
      </p>

      <H2>Server components inside windows</H2>

      <p>
        The desktop is a client component; what goes in a window need not be. In
        a Next app the pages stay server components, and the layout hands their
        rendered output to the provider as a prop:
      </p>

      <CodeBlock filename="app/layout.tsx">{`export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/*
          The current route's content goes in as a prop rather than as a child:
          the window it belongs to claims it from the inside instead of it
          sitting loose on the desktop.
        */}
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}`}</CodeBlock>

      <p>
        The window never renders the page. It positions a node that was already
        rendered somewhere else, which is why a server component can sit inside
        a draggable window without becoming a client component.
      </p>

      <H2>Frozen content</H2>

      <p>
        When focus moves to another window, the one behind keeps showing what it
        had rather than following the URL. Holding on to the React node is not
        enough on its own: what the router hands over is a pointer to the active
        segment, so re-rendering it would paint the current route and every
        window would show the same thing.
      </p>

      <p>
        Alongside the node, <Code>useWindowRoute</Code> stores the router
        context that was in place when that route was active, and re-provides
        it. The node then resolves back to its own segment.
      </p>

      <Callout type="warning" title="Frozen means frozen">
        <p>
          A background window’s content stops updating until it is focused
          again. That is what makes windows feel like windows, and it is worth
          knowing when a data-driven view looks stale — it is showing you the
          moment it lost focus.
        </p>
      </Callout>

      <H2>Debugging</H2>

      <ul>
        <li>
          <strong>The window flashes in from the corner.</strong> The static and
          interactive geometry have diverged. Check for a <Code>style</Code>{" "}
          that only applies to one of them.
        </li>
        <li>
          <strong>The desktop is empty in view-source.</strong> No window was
          open during the render. With the core, that means{" "}
          <Code>defaultOpenWindows</Code>; with the adapter, that the URL
          matched no declared route.
        </li>
        <li>
          <strong>Every window shows the same content.</strong> The window is
          rendering the route directly instead of what{" "}
          <Code>useWindowRoute</Code> returned.
        </li>
      </ul>

      <Cards>
        <Card href="/docs/routing" title="Windows with URLs">
          Set up the adapter and get server-rendered windows.
        </Card>
      </Cards>
    </DocPage>
  );
}
