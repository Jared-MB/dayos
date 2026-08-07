import { llmsFullTxt } from "../_lib/doc-source";
import { markdownResponse } from "../_lib/markdown-response";

export const dynamic = "force-static";

/**
 * The whole documentation as one file, for a reader that would rather paste
 * everything once than follow fourteen links.
 */
export function GET() {
  return markdownResponse(llmsFullTxt());
}
