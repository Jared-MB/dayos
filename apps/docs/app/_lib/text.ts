import { Children, isValidElement, type ReactNode } from "react";

/**
 * The words inside a node, with the markup gone.
 *
 * A heading written in Markdown arrives as a string when it is plain and as an
 * array the moment it contains a code span or a link, and the id it scrolls to
 * has to be the same either way. Anything with no text of its own — an icon, an
 * arrow — contributes nothing, which is the right answer for a heading that
 * carries one.
 */
export function plainText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(plainText).join("");

  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };

    return Children.toArray(props.children).map(plainText).join("");
  }

  return "";
}
