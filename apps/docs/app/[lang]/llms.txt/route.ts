import { llmsTxt } from "../_lib/doc-source";
import { markdownResponse } from "../_lib/markdown-response";

export const dynamic = "force-static";

/** The map of the docs, at the address the convention puts it. */
export function GET() {
  return markdownResponse(llmsTxt());
}
