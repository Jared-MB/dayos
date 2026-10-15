import { useDesktop } from "@dayos/core";

/**
 * One entry per window that's open or minimized. The name comes from the
 * window's `WindowName` through `windowNames`, falling back to the id.
 *
 * Entries are sorted by name and not by `openWindows`, which is stacking
 * order: following it would reshuffle the taskbar on every focus.
 */
export function Taskbar() {
  const {
    openWindows,
    minimizedWindows,
    windowNames,
    activeWindowId,
    openWindow,
    closeWindow,
    focusWindow,
  } = useDesktop();

  const nameOf = (id: string) => windowNames[id] ?? id;
  const entries = [...openWindows, ...minimizedWindows].sort((a, b) =>
    nameOf(a).localeCompare(nameOf(b)),
  );

  // Like most taskbars: the window in front minimizes, a minimized one comes
  // back, and any other open one comes to the front.
  const toggle = (id: string) => {
    if (minimizedWindows.includes(id)) openWindow(id);
    else if (id === activeWindowId) closeWindow(id, { keepMounted: true });
    else focusWindow(id);
  };

  return (
    <nav aria-label="Taskbar" className="taskbar">
      {entries.length === 0 ? (
        <p className="taskbar-empty">No open windows</p>
      ) : (
        <ul className="taskbar-list">
          {entries.map((id) => {
            const isMinimized = minimizedWindows.includes(id);
            const isActive = id === activeWindowId;

            return (
              <li
                key={id}
                className="taskbar-entry"
                data-active={isActive ? "" : undefined}
                data-minimized={isMinimized ? "" : undefined}
              >
                <button
                  type="button"
                  className="taskbar-button"
                  aria-pressed={isActive}
                  onClick={() => toggle(id)}
                >
                  <span className="taskbar-name">{nameOf(id)}</span>
                  {isMinimized && (
                    <span className="taskbar-status">minimized</span>
                  )}
                </button>
                {isMinimized && (
                  // A plain close on a minimized window drops it for good.
                  <button
                    type="button"
                    className="taskbar-close"
                    aria-label={`Close ${nameOf(id)}`}
                    onClick={() => closeWindow(id)}
                  >
                    ✕
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
