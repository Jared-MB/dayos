import { CodeBlock } from "../../_components/code";
import { DocPage, docMetadata } from "../../_components/doc-page";
import { Callout, Code, H2, H3 } from "../../_components/prose";

const HREF = "/docs/state";

export const metadata = docMetadata(HREF);

export default function Page() {
  return (
    <DocPage href={HREF}>
      <p>
        Which windows are open is one list, held by <Code>Desktop</Code>. Left
        alone it manages itself. Handed a value and a callback, it becomes yours
        — which is how window state gets persisted, restored, or driven from a
        dock or a keyboard shortcut.
      </p>

      <H2>Uncontrolled</H2>

      <p>
        The default. The desktop keeps its own list, and{" "}
        <Code>defaultOpenWindows</Code> seeds it:
      </p>

      <CodeBlock>{`<Desktop defaultOpenWindows={["notes"]}>
  <App id="notes" />
  <App id="about" />
</Desktop>`}</CodeBlock>

      <p>
        The order is the stacking order: the last id is the window in front.
      </p>

      <H2>Controlled</H2>

      <p>
        Pass <Code>openWindows</Code> and <Code>onOpenWindowsChange</Code> and
        the desktop stops holding state. Every open, close and focus goes
        through you:
      </p>

      <CodeBlock>{`function Workspace() {
  const [openWindows, setOpenWindows] = useState<string[]>([]);

  return (
    <Desktop
      className="desktop"
      onOpenWindowsChange={setOpenWindows}
      openWindows={openWindows}
    >
      <App id="notes" />
      <App id="about" />
    </Desktop>
  );
}`}</CodeBlock>

      <Callout type="warning">
        <p>
          Controlled means controlled. If <Code>onOpenWindowsChange</Code> does
          not lead to a new <Code>openWindows</Code>, nothing opens and nothing
          closes — the close button will appear broken.
        </p>
      </Callout>

      <H3>Persisting a session</H3>

      <p>
        The list is an array of strings, so it survives a round trip through
        storage without any ceremony:
      </p>

      <CodeBlock>{`const STORAGE_KEY = "workspace";

function Workspace() {
  const [openWindows, setOpenWindows] = useState<string[]>([]);

  // After mount, never during render: the server has no access to storage, and
  // reading it while rendering is a hydration mismatch.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setOpenWindows(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(openWindows));
  }, [openWindows]);

  return (
    <Desktop onOpenWindowsChange={setOpenWindows} openWindows={openWindows}>
      {/* ... */}
    </Desktop>
  );
}`}</CodeBlock>

      <H2>Per window</H2>

      <p>
        <Code>DesktopApp</Code> takes the same pair for a single window, which
        is often all you need:
      </p>

      <CodeBlock>{`<DesktopApp defaultOpen id="notes">
  {/* opens on mount, and is left alone after that */}
</DesktopApp>`}</CodeBlock>

      <CodeBlock>{`<DesktopApp
  id="settings"
  onOpenChange={setSettingsOpen}
  open={isSettingsOpen}
>
  {/* stays in sync with your state, in both directions */}
</DesktopApp>`}</CodeBlock>

      <p>
        <Code>onOpenChange</Code> fires wherever the change came from — the
        icon, the close button, <kbd>Escape</kbd>, a route, another
        window&rsquo;s button. It watches the state rather than wrapping any one
        control, so there is no path that skips it.
      </p>

      <Callout title="defaultOpen only seeds the client">
        <p>
          It runs in an effect, so a window opened this way does not exist in
          the server HTML. To have a window come open from the server, list it
          in the desktop&rsquo;s <Code>defaultOpenWindows</Code> instead — that
          is state the parent owns, and it is decided during render.
        </p>
      </Callout>

      <H2>Driving the desktop from outside</H2>

      <p>
        <Code>useDesktop</Code> works anywhere inside <Code>Desktop</Code>, so
        controls do not have to live in a window:
      </p>

      <CodeBlock>{`function Shortcuts() {
  const { openWindow, closeWindow, activeWindowId } = useDesktop();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "w" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (activeWindowId) closeWindow(activeWindowId);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeWindowId, closeWindow]);

  return null;
}`}</CodeBlock>

      <H3>The operations</H3>

      <ul>
        <li>
          <Code>openWindow(id)</Code> — opens it, or brings it to the front if
          it is already open.
        </li>
        <li>
          <Code>closeWindow(id)</Code> — closes it. A no-op if it was not open.
        </li>
        <li>
          <Code>focusWindow(id)</Code> — brings it to the front without opening
          it. Focusing the window that is already in front changes nothing and
          re-renders nothing.
        </li>
      </ul>

      <H2>With routing</H2>

      <p>
        <Code>RoutedDesktop</Code> is a controlled desktop whose controller is
        the URL, which is why it does not accept the window-state props: the
        provider owns them. Read the state with <Code>useDesktop</Code> as
        usual, and change it by navigating.
      </p>
    </DocPage>
  );
}
