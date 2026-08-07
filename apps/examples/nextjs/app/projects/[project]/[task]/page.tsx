import { notFound } from "next/navigation";
import { findTask, PROJECTS } from "../../projects";

export function generateStaticParams() {
  return PROJECTS.flatMap(({ slug, tasks }) =>
    tasks.map(({ slug: task }) => ({ project: slug, task })),
  );
}

export default async function TaskPage({
  params,
}: {
  params: Promise<{ project: string; task: string }>;
}) {
  const { project, task } = await params;
  const found = findTask(project, task);

  if (!found) notFound();

  return (
    <article className="prose">
      <h1>{found.name}</h1>
      <p>{found.note}</p>
      <p>
        Third level, and two params deep. This window's id is the whole URL, so
        the same task under another project is a different window.
      </p>
    </article>
  );
}
