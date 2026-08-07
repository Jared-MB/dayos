import { CodeBlock } from "../../_components/code";
import { DocPage, docMetadata } from "../../_components/doc-page";
import { Callout, Code, H2, H3 } from "../../_components/prose";

const HREF = "/docs/windows";

export const metadata = docMetadata(HREF);

export default function Page() {
  return (
    <DocPage href={HREF}>
      <p>
        A window is a frame you can drag, resize and maximize. It is assembled
        from parts rather than configured through props, so a title bar with
        three buttons and a title bar with none are the same component with
        different children.
      </p>

      <H2>The parts</H2>

      <CodeBlock>{`<Window className="window">
  <WindowHeader className="window-header">
    <WindowName className="window-title">Notes</WindowName>
    <WindowActions className="window-actions">
      <WindowExpand className="window-button">▢</WindowExpand>
      <WindowClose className="window-button">✕</WindowClose>
    </WindowActions>
  </WindowHeader>
  <WindowContent className="window-content">Hello</WindowContent>
</Window>`}</CodeBlock>

      <ul>
        <li>
          <Code>Window</Code> — the frame. Portals into the desktop once it is
          mounted.
        </li>
        <li>
          <Code>WindowHeader</Code> — the title bar, which is also the drag
          handle.
        </li>
        <li>
          <Code>WindowName</Code> — the title. It is what the window is
          announced as.
        </li>
        <li>
          <Code>WindowContent</Code> — the body, which scrolls.
        </li>
        <li>
          <Code>WindowActions</Code> — the control group, and{" "}
          <Code>WindowAction</Code> a generic button to put in it.
        </li>
        <li>
          <Code>WindowExpand</Code>, <Code>WindowClose</Code> — maximize/restore
          and close.
        </li>
      </ul>

      <p>
        Only <Code>Window</Code> is required. Without a header the window cannot
        be dragged, but it can still be resized and closed.
      </p>

      <H2>Geometry</H2>

      <p>
        By default a window is 70% of the desktop, centred, and each additional
        window is offset 32px from the last so a stack of them is visible at
        once. The cascade wraps around when it reaches the edge instead of
        marching off screen.
      </p>

      <CodeBlock>{`<Window
  defaultSize={{ width: 520, height: 460 }}
  defaultPosition={{ x: 220, y: 140 }}
/>`}</CodeBlock>

      <p>
        Both are in pixels, both are initial values only, and a{" "}
        <Code>defaultPosition</Code> opts out of the cascade — the window goes
        exactly where you said. A size larger than the desktop is clamped to it.
      </p>

      <CodeBlock>{`<Window cascadeOffset={48} minWidth={320} minHeight={200} />`}</CodeBlock>

      <p>
        <Code>minWidth</Code> and <Code>minHeight</Code> default to 240 and 120
        and are the floor for resizing.
      </p>

      <Callout>
        <p>
          Geometry is read once, when the window first mounts. Changing{" "}
          <Code>defaultSize</Code> later does not move a window that is already
          open — that is what the word <em>default</em> is doing. Desktop
          resizes are handled separately: a window that no longer fits is
          clamped back inside.
        </p>
      </Callout>

      <H3>Working out where a window will land</H3>

      <p>
        The placement maths is exported as <Code>windowRect</Code>, the same
        function the window itself uses. It is pure, so it is available if you
        need to predict a position — for a minimize animation, say, or to
        persist geometry.
      </p>

      <CodeBlock>{`import { windowRect } from "@dayos/core";

const rect = windowRect({
  desktopWidth: 1280,
  desktopHeight: 800,
  defaultSize: { width: 520, height: 460 },
  cascadeStep: 2,
});
// { width: 520, height: 460, x: 444, y: 234 }`}</CodeBlock>

      <H2>Dragging and resizing</H2>

      <p>
        The header is the drag handle. Resizing works from any edge or corner.
        Both are bounded by the desktop, and both bring the window to the front
        when they start.
      </p>

      <H3>Elements that do not start a drag</H3>

      <p>
        Buttons, links and form controls in the header are excluded from
        dragging by default:
      </p>

      <CodeBlock>{`dragCancel = "button, a, input, select, textarea"`}</CodeBlock>

      <p>
        Without this, clicking the restore button would also begin a drag, and
        the window would end up following the cursor instead of returning to its
        saved position. Pass your own selector to widen it:
      </p>

      <CodeBlock>{`<Window dragCancel="button, a, input, select, textarea, .no-drag" />`}</CodeBlock>

      <H3>Maximizing</H3>

      <p>
        <Code>WindowExpand</Code> toggles between filling the desktop and going
        back to where the window was. The geometry from before is kept and
        re-clamped on the way back, since the desktop may have shrunk in the
        meantime.
      </p>

      <p>
        Dragging a maximized window restores it and hooks it to the cursor,
        keeping the pointer over the same proportional point of the title bar —
        the gesture every desktop has.
      </p>

      <p>
        While maximized, both the window and its header carry{" "}
        <Code>data-maximized</Code>, which is how you square off a rounded
        header:
      </p>

      <CodeBlock language="css">{`.window-header[data-maximized] {
  border-radius: 0;
}`}</CodeBlock>

      <H2>Keeping state while closed</H2>

      <p>
        Closing a window unmounts its subtree, and everything in it goes: scroll
        position, form fields, a video&rsquo;s playback position.{" "}
        <Code>keepMounted</Code> keeps it in the tree and hides it instead.
      </p>

      <CodeBlock>{`<Window keepMounted>
  <WindowContent>
    <textarea />
  </WindowContent>
</Window>`}</CodeBlock>

      <p>
        It is lazy about it: the window mounts the first time it opens, not
        before. Apps that are never opened cost nothing.
      </p>

      <Callout type="warning">
        <p>
          A kept-mounted window is still mounted. Timers keep running, queries
          keep refetching, and a video keeps playing unless something pauses it.
          That is the point of the prop, but it is worth knowing which of your
          windows have it.
        </p>
      </Callout>

      <H2>Closing</H2>

      <p>
        <Code>Escape</Code> closes the focused window unless you turn it off:
      </p>

      <CodeBlock>{`<Window closeOnEscape={false} />`}</CodeBlock>

      <p>
        A handler of your own that calls <Code>preventDefault()</Code> also
        stops it, which is how a window with unsaved changes asks first.
      </p>

      <H2>Focus and stacking</H2>

      <p>
        Clicking anywhere in a window brings it to the front, and so does
        focusing anything inside it — including via <kbd>Tab</kbd>. The stacking
        order is the desktop&rsquo;s <Code>openWindows</Code> list, and the{" "}
        <Code>z-index</Code> comes from a window&rsquo;s position in it.
      </p>

      <p>
        Windows are not modal, and they are announced that way. Several coexist
        and the rest of the desktop stays reachable, so each is a{" "}
        <Code>role=&quot;dialog&quot;</Code> with{" "}
        <Code>aria-modal=&quot;false&quot;</Code>, labelled by its{" "}
        <Code>WindowName</Code>.
      </p>

      <Callout title="Give every window a WindowName">
        <p>
          The dialog&rsquo;s accessible name comes from it. A window without one
          is announced as an unnamed dialog, which in a desktop full of them is
          no name at all.
        </p>
      </Callout>
    </DocPage>
  );
}
