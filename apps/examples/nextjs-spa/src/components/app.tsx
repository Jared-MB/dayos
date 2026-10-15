import {
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

import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  id: string;
  children?: React.ReactNode;
}

export function App({ children, ...props }: Props) {
  return (
    <DesktopApp id={props.id}>
      <DesktopIcon className="h-fit cursor-pointer border border-zinc-800 rounded-md flex flex-col items-center p-2 gap-1">
        <props.icon />
        <DesktopIconText>{props.title}</DesktopIconText>
      </DesktopIcon>
      <Window className="bg-zinc-900 rounded-md border border-zinc-800">
        <WindowHeader className="border-b border-b-zinc-800 p-4 flex justify-between items-center">
          <WindowName>{props.title}</WindowName>
          <WindowActions className="flex items-center gap-2">
            <WindowExpand className="hover:border border-zinc-700 p-1 size-8 flex items-center justify-center rounded-md">
              ▢
            </WindowExpand>
            <WindowClose className="hover:border border-zinc-700 p-1 size-8 flex items-center justify-center rounded-md">
              ✕
            </WindowClose>
          </WindowActions>
        </WindowHeader>
        <WindowContent className="p-4">{children}</WindowContent>
      </Window>
    </DesktopApp>
  );
}
