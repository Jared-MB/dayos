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
  WindowName,
} from "@dayos/core";

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
    </Desktop>
  );
}

function MyApp({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <DesktopApp id={id}>
      <DesktopIcon className="icon">
        <span aria-hidden="true" className="icon-glyph">
          ▣
        </span>
        <DesktopIconText>{title}</DesktopIconText>
      </DesktopIcon>

      <Window className="window">
        <WindowHeader className="window-header">
          <WindowName className="window-title">{title}</WindowName>
          <WindowActions className="window-actions">
            <WindowExpand className="window-button">▢</WindowExpand>
            <WindowClose className="window-button">✕</WindowClose>
          </WindowActions>
        </WindowHeader>
        <WindowContent className="window-content">{children}</WindowContent>
      </Window>
    </DesktopApp>
  );
}
