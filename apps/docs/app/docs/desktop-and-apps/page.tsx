import { CodeBlock } from "../../_components/code";
import { DocPage, docMetadata } from "../../_components/doc-page";
import { Callout, Code, H2, H3 } from "../../_components/prose";

const HREF = "/docs/desktop-and-apps";

export const metadata = docMetadata(HREF);

export default function Page() {
  return (
    <DocPage href={HREF}>
      <p>
        Two components hold the desktop together. <Code>Desktop</Code> is the
        container and the single source of truth for which windows are open;{" "}
        <Code>DesktopApp</Code> is one entry in it, tying an icon to a window
        through a shared id.
      </p>

      <H2>Desktop</H2>

      <p>
        Everything else has to be inside it. It owns the list of open windows,
        their stacking order, and whether a drag or resize is currently
        happening.
      </p>

      <CodeBlock>{`<Desktop className="desktop">
  {/* apps go here */}
</Desktop>`}</CodeBlock>

      <p>
        It renders a single <Code>div</Code> with two inline styles:
      </p>

      <CodeBlock language="css">{`position: relative;  /* windows are positioned against it */
overflow: hidden;    /* and clipped by it */`}</CodeBlock>

      <p>
        That is the whole of it. Height, background, the icon grid — all yours.
        Give it a height, or it collapses and the windows inside are clipped to
        nothing.
      </p>

      <H3>The wallpaper shorthand</H3>

      <p>
        <Code>wallpaper</Code> takes a URL and is exactly equivalent to writing
        the four background properties yourself:
      </p>

      <CodeBlock>{`<Desktop className="desktop" wallpaper="/wallpaper.jpg" />`}</CodeBlock>

      <CodeBlock language="css">{`background-image: url(/wallpaper.jpg);
background-size: cover;
background-position: center;
background-repeat: no-repeat;`}</CodeBlock>

      <p>
        For a gradient or anything else, skip the prop and use CSS. It is a
        convenience for the common case, not the supported way to do
        backgrounds.
      </p>

      <H3>Interaction state</H3>

      <p>
        While a window is being dragged or resized, the desktop carries{" "}
        <Code>data-interacting</Code>. It exists for one specific problem: an
        iframe under the cursor swallows the <Code>mousemove</Code> and{" "}
        <Code>mouseup</Code> that the drag listens for on the document, and the
        window either stalls or stays stuck to the pointer.
      </p>

      <CodeBlock language="css">{`.desktop[data-interacting] iframe {
  pointer-events: none;
}`}</CodeBlock>

      <p>
        DayOS cannot set this itself: it is a rule about descendants, and an
        inline style cannot express one. In Tailwind:
      </p>

      <CodeBlock>{`<Desktop className="[&[data-interacting]_iframe]:pointer-events-none" />`}</CodeBlock>

      <H2>DesktopApp</H2>

      <p>
        An app is an icon and a window that belong together. It renders no
        element of its own — it is a context provider, and its children are what
        you see.
      </p>

      <CodeBlock>{`<DesktopApp id="notes">
  <DesktopIcon>Notes</DesktopIcon>
  <Window>
    <WindowContent>Hello</WindowContent>
  </Window>
</DesktopApp>`}</CodeBlock>

      <p>
        Neither child is required. An app with an icon and no window is a
        launcher for something else; an app with a window and no icon is a
        window that opens from somewhere other than the desktop, which is how
        dynamic routes work.
      </p>

      <H3>The id</H3>

      <p>
        The <Code>id</Code> is the window’s identity. It is the key in the
        desktop’s list of open windows, and with <Code>@dayos/next</Code> it is
        also the window’s href — one identity, declared once.
      </p>

      <p>
        Leaving it out is allowed and gives you a generated one, which is fine
        for an app that is never referred to from outside. Anything that opens,
        closes or routes a window by name needs an id you chose.
      </p>

      <Callout type="warning" title="Two apps cannot share an id">
        <p>
          They would share window state, both open at once, both portal into the
          desktop, and land in exactly the same place — one window with the
          wrong content in it. DayOS logs an error in development when it sees
          this. In production the check is skipped entirely.
        </p>
      </Callout>

      <H3>Opening and closing from the app</H3>

      <p>
        <Code>useDesktopApp</Code> gives you the containing app’s state and
        controls, which is how you build a button that opens a window from
        inside another one:
      </p>

      <CodeBlock>{`function Controls() {
  const { id, isWindowOpen, open, close, focus } = useDesktopApp();

  return (
    <button onClick={isWindowOpen ? close : open} type="button">
      {isWindowOpen ? "Close" : "Open"} {id}
    </button>
  );
}`}</CodeBlock>

      <p>
        It throws outside a <Code>DesktopApp</Code>. When that is a real
        possibility — a component shared between windowed and non-windowed
        contexts — <Code>useOptionalDesktopApp</Code> returns <Code>null</Code>{" "}
        instead.
      </p>

      <H2>Icons</H2>

      <p>
        <Code>DesktopIcon</Code> is a button that opens its app’s window on
        double click. It handles <kbd>Enter</kbd> and <kbd>Space</kbd> too,
        because a double click does not exist for the keyboard and the icon
        would otherwise be unreachable.
      </p>

      <CodeBlock>{`<DesktopIcon className="icon">
  <img alt="" src="/icons/notes.svg" />
  <DesktopIconText>Notes</DesktopIconText>
</DesktopIcon>`}</CodeBlock>

      <p>
        <Code>DesktopIconText</Code> is a plain <Code>span</Code> and exists so
        the label is a styleable thing rather than a bare text node.
      </p>

      <H3>Your handlers run first</H3>

      <p>
        DayOS composes with the handlers you pass instead of replacing them.
        Yours runs first, and calling <Code>preventDefault()</Code> cancels the
        open:
      </p>

      <CodeBlock>{`<DesktopIcon
  onDoubleClick={(event) => {
    if (!isUnlocked) event.preventDefault();
  }}
>
  Vault
</DesktopIcon>`}</CodeBlock>

      <H2>Reading the desktop</H2>

      <p>
        <Code>useDesktop</Code> is the whole state, available to anything inside{" "}
        <Code>Desktop</Code>. It is what you build a taskbar or a window
        switcher out of:
      </p>

      <CodeBlock>{`function Taskbar() {
  const { openWindows, activeWindowId, focusWindow, closeWindow } = useDesktop();

  return (
    <div className="taskbar">
      {openWindows.map((id) => (
        <button
          data-active={id === activeWindowId ? "" : undefined}
          key={id}
          onClick={() => focusWindow(id)}
          type="button"
        >
          {id}
        </button>
      ))}
    </div>
  );
}`}</CodeBlock>

      <p>
        <Code>openWindows</Code> is in stacking order, so the last entry is the
        window in front — which is exactly what <Code>activeWindowId</Code> is.
      </p>

      <Callout>
        <p>
          A taskbar has to be inside <Code>Desktop</Code> to read this state,
          and it will be positioned against the desktop like everything else.
          Give it a <Code>z-index</Code> above the windows: they start at 1 and
          climb with the stack.
        </p>
      </Callout>
    </DocPage>
  );
}
