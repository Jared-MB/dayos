import Link from "next/link";
import { PROJECTS, projectHref } from "./projects";

export default function ProjectsPage() {
  return (
    <article className="prose">
      <h1>Projects</h1>
      <p>
        Three routes nest here: this list, a project, and a task inside it. Open
        one and then the next, and all three windows sit on the desktop at once,
        each showing its own page.
      </p>
      <ul className="document-list">
        {PROJECTS.map(({ slug, name, summary }) => (
          <li key={slug}>
            <Link href={projectHref(slug)}>{name}</Link> — {summary}
          </li>
        ))}
      </ul>
      <p>
        <Link href="/projects/archive">Archive</Link> is a static route sitting
        where a project name would go. It opens its own window rather than being
        read as a project called “archive”.
      </p>
    </article>
  );
}
