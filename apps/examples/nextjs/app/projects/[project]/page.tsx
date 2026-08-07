import Link from "next/link";
import { notFound } from "next/navigation";
import { findProject, newTaskHref, PROJECTS, taskHref } from "../projects";

export function generateStaticParams() {
  return PROJECTS.map(({ slug }) => ({ project: slug }));
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  const found = findProject(project);

  // The param decides which window opens, so it can't be trusted to be one of
  // ours: anything else is a 404 and not an empty window.
  if (!found) notFound();

  return (
    <article className="prose">
      <h1>{found.name}</h1>
      <p>{found.summary}</p>
      <ul className="document-list">
        {found.tasks.map(({ slug, name, note }) => (
          <li key={slug}>
            <Link href={taskHref(found.slug, slug)}>{name}</Link> — {note}
          </li>
        ))}
      </ul>
      <p>
        <Link href={newTaskHref(found.slug)}>New task</Link> is static where it
        competes with a task name, and still one window per project.
      </p>
    </article>
  );
}
