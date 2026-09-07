import { CodeBlock } from "../_components/code";
import { DocPage, docMetadata } from "../_components/doc-page";
import { Callout, Card, Cards, Code, H2 } from "../_components/prose";

const HREF = "/docs";

export const metadata = docMetadata(HREF);

export default function Page() {
  return (
    <DocPage href={HREF}>
      <p>
        DayOS is a windowed desktop for React. It gives you icons, windows you
        can drag, resize and maximize, and a focus stack that decides which
        window is in front. What that desktop looks like is entirely up to you:
        the library ships no theme, no colours and no layout.
      </p>

      <CodeBlock filename="desktop.tsx">{`import {
  Desktop,
  DesktopApp,
  DesktopIcon,
  Window,
  WindowContent,
  WindowHeader,
  WindowName,
} from "@dayos/core";

<Desktop className="h-dvh">
  <DesktopApp id="notes">
    <DesktopIcon>Notes</DesktopIcon>
    <Window>
      <WindowHeader>
        <WindowName>Notes</WindowName>
      </WindowHeader>
      <WindowContent>Hello</WindowContent>
    </Window>
  </DesktopApp>
</Desktop>;`}</CodeBlock>

      <p>
        Double click an icon to open its window. Drag the header to move it, the
        edges to resize it, and the maximize button to fill the desktop.
      </p>

      <H2>Two packages</H2>

      <p>
        DayOS is split in two, and the split is on one question: whether your
        windows have URLs.
      </p>

      <Cards>
        <Card href="/docs/api/core" title="@dayos/core">
          The library. React only, with no dependency on Next or on any router.
        </Card>
        <Card href="/docs/api/next" title="@dayos/next">
          The optional adapter for the Next App Router: every window gets a URL
          of its own.
        </Card>
      </Cards>

      <p>
        The core stands on its own and is not missing anything. Without the
        adapter the desktop works the same, on a single page and without URLs.
        The adapter is the only piece that talks to Next.
      </p>

      <H2>What the adapter adds</H2>

      <p>
        Server rendering is its whole reason to exist. It works out which window
        the requested URL belongs to during the same render, so the HTML the
        server sends already carries that window with its content inside,
        instead of an empty desktop that fills in once JavaScript arrives.
      </p>

      <p>On top of that:</p>

      <ul>
        <li>
          Focusing a window updates the URL, which makes windows shareable by
          link. It uses <Code>replace</Code>, so the back button still walks
          through pages and not through focus changes.
        </li>
        <li>
          A window that loses focus keeps showing its own content instead of
          jumping to whatever the current route is.
        </li>
        <li>
          One route declaration can stand for a window per document, task or
          record.
        </li>
      </ul>

      <H2>What it does not do</H2>

      <p>
        DayOS is a window manager, not a desktop environment. There is no
        taskbar, no dock, no start menu, no notification tray, no wallpaper
        picker and no window snapping. Those are all things you can build on top
        of the state it exposes, and none of them are things it decides for you.
      </p>

      <Callout title="No styles included">
        <p>
          The only CSS DayOS sets is structural: the desktop is{" "}
          <Code>position: relative</Code> with <Code>overflow: hidden</Code>{" "}
          because windows position and clip against it, and the window is a flex
          column so its header and body stack. Everything else — size,
          background, borders, the icon grid — is yours to write.
        </p>
      </Callout>

      <H2>Requirements</H2>

      <ul>
        <li>React 19 and React DOM 19.</li>
        <li>
          For <Code>@dayos/next</Code>: Next 16 with the App Router.
        </li>
      </ul>

      <H2>Next steps</H2>

      <Cards>
        <Card href="/docs/installation" title="Installation">
          Add the packages to a React or Next app.
        </Card>
        <Card href="/docs/quick-start" title="Quick Start">
          Build a desktop with two windows from scratch.
        </Card>
      </Cards>
    </DocPage>
  );
}
