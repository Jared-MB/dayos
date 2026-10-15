import {
  Desktop,
  DesktopApp,
  DesktopIcon,
  DesktopIconText,
  Window,
  WindowActions,
  WindowClose,
  WindowContent,
  WindowExpand,
  WindowHeader,
  WindowMinimize,
  WindowName,
} from "@dayos/core";
import { AnimatedWindowBody } from "./animated-window-body";

export function App() {
  return <MyDesktop />;
}

function MyDesktop() {
  return (
    <Desktop className="desktop">
      <MyApp id="notes" title="Notes">
        Double click the icon to open me.
      </MyApp>
      <MyApp id="about" title="About">
        Drag my header. Drag my edges. Try the maximize button.
      </MyApp>
      <MyApp id="animated" title="Animated" animated>
        I fade and scale in when I open, and back out when I close.
      </MyApp>
      <MyApp id="drafts" title="Drafts" animated minimizable>
        <p>
          Type something, then minimize me and open me again: the text is still
          here. Close me instead and it's gone. The exit plays either way.
        </p>
        <textarea aria-label="Draft" className="draft" rows={4} />
      </MyApp>
    </Desktop>
  );
}

function MyApp({
  id,
  title,
  animated = false,
  minimizable = false,
  children,
}: {
  id: string;
  title: string;
  animated?: boolean;
  /** `WindowMinimize` keeps the window mounted for that one close only. */
  minimizable?: boolean;
  children: React.ReactNode;
}) {
  return (
    <DesktopApp id={id}>
      <DesktopIcon className="icon">
        <span aria-hidden="true" className="icon-glyph">
          {animated ? "✦" : "▣"}
        </span>
        <DesktopIconText>{title}</DesktopIconText>
      </DesktopIcon>

      {/*
        Animated windows put the chrome on the body (`render`) rather than on
        the frame: the frame is the draggable box and doesn't animate, so a
        border on it would stay behind while the body fades out.
      */}
      <Window
        className={animated ? undefined : "window"}
        render={
          animated ? <AnimatedWindowBody className="window" /> : undefined
        }
      >
        <WindowHeader className="window-header">
          <WindowName className="window-title">{title}</WindowName>
          <WindowActions className="window-actions">
            {minimizable && (
              <WindowMinimize className="window-button">–</WindowMinimize>
            )}
            <WindowExpand className="window-button">▢</WindowExpand>
            <WindowClose className="window-button">✕</WindowClose>
          </WindowActions>
        </WindowHeader>
        <WindowContent className="window-content">{children}</WindowContent>
      </Window>
    </DesktopApp>
  );
}
