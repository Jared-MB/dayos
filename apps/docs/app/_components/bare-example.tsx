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

export function BareExample() {
  return (
    <Desktop className="desktop">
      <DesktopApp id="notes">
        <DesktopIcon className="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>Notas</title>
            <path d="M8 2v4" />
            <path d="M12 2v4" />
            <path d="M16 2v4" />
            <rect width="16" height="18" x="4" y="4" rx="2" />
            <path d="M8 10h6" />
            <path d="M8 14h8" />
            <path d="M8 18h5" />
          </svg>
          <DesktopIconText>Notas</DesktopIconText>
        </DesktopIcon>
        <Window className="window">
          <WindowHeader className="window-header">
            <WindowName>Notes</WindowName>
            <WindowActions className="window-actions">
              <WindowExpand className="window-button">▢</WindowExpand>
              <WindowClose className="window-button">✕</WindowClose>
            </WindowActions>
          </WindowHeader>
          <WindowContent className="window-content">Hello</WindowContent>
        </Window>
      </DesktopApp>
      <DesktopApp id="other">
        <DesktopIcon className="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>Other</title>
            <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
            <path d="m21 3-9 9" />
            <path d="M15 3h6v6" />
          </svg>
          <DesktopIconText>Other</DesktopIconText>
        </DesktopIcon>
        <Window className="window">
          <WindowHeader className="window-header">
            <WindowName>Other</WindowName>
            <WindowActions className="window-actions">
              <WindowExpand className="window-button">▢</WindowExpand>
              <WindowClose className="window-button">✕</WindowClose>
            </WindowActions>
          </WindowHeader>
          <WindowContent className="window-content">
            Hello from other window
          </WindowContent>
        </Window>
      </DesktopApp>
    </Desktop>
  );
}
