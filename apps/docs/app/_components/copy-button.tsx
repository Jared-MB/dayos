"use client";

import { useEffect, useRef, useState } from "react";
import { useDictionary } from "./locale-provider";

/**
 * The one interactive part of a code block. It lives in its own client
 * component so the highlighted code around it stays server-rendered.
 */
export function CopyButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const d = useDictionary();
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Clearing on unmount: without it, navigating away mid-confirmation leaves a
  // timer that sets state on a component that is gone.
  useEffect(() => () => clearTimeout(timeout.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard access can be refused (an insecure origin, a permission
      // policy). Nothing here is worth an error dialog over.
      return;
    }

    setCopied(true);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      aria-label={copied ? d.code.copied : d.code.copy}
      className={["copy-button", className].filter(Boolean).join(" ")}
      data-copied={copied ? "" : undefined}
      onClick={copy}
      type="button"
    >
      {copied ? <CheckIcon /> : <ClipboardIcon />}
    </button>
  );
}

function ClipboardIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="14"
    >
      <rect height="13" rx="2" width="13" x="9" y="9" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
